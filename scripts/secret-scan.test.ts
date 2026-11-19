// Tests for the rules in .gitleaks.toml and the gitleaks flags of the two
// CI scans (the job secrets in ci.yml and secret-history.yml). Each test
// writes planted lines to a temporary folder and runs gitleaks on it with
// the repository's config. The planted values are built from parts, so
// this file itself has no line that the scan finds. The job secrets runs
// it with `node --test scripts/secret-scan.test.ts`; it needs gitleaks
// 8.30.1 on PATH or in GITLEAKS, and fails without it.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const config = join(root, '.gitleaks.toml')
const gitleaks = process.env['GITLEAKS'] ?? 'gitleaks'

// The two workflows whose gitleaks call must ignore gitleaks:allow comments.
const workflows = ['.github/workflows/ci.yml', '.github/workflows/secret-history.yml']

function isFinding(value: unknown): value is { RuleID: string } {
  return typeof value === 'object' && value !== null && 'RuleID' in value && typeof value.RuleID === 'string'
}

// The rule IDs that gitleaks finds in one file with these lines.
function scan(name: string, lines: string[], flags: string[] = []): string[] {
  const dir = mkdtempSync(join(tmpdir(), 'secret-scan-'))
  const src = join(dir, 'src')
  const report = join(dir, 'report.json')
  mkdirSync(src)
  writeFileSync(join(src, name), lines.join('\n') + '\n')
  const run = spawnSync(gitleaks, ['dir', '--no-banner', '--redact', '--exit-code', '0', '--config', config,
    '--report-format', 'json', '--report-path', report, ...flags, src], { encoding: 'utf8' })
  if (run.error !== undefined) throw new Error(`gitleaks did not start (${run.error.message}); install gitleaks 8.30.1 or set GITLEAKS`)
  assert.equal(run.status, 0, run.stderr)
  const found: unknown = JSON.parse(readFileSync(report, 'utf8'))
  if (!Array.isArray(found)) throw new Error('the gitleaks report is not a list')
  return found.filter(isFinding).map((f) => f.RuleID).sort()
}

const literal = 'winter' + 'iscoming'

void test('a bare secret-named key with a literal value is found (Codex review of #252)', () => {
  assert.deepEqual(scan('deploy.sh', ['PASS' + 'WORD="' + literal + '"']), ['env-assignment'])
  assert.deepEqual(scan('deploy.sh', ['export TOK' + 'EN=' + literal]), ['env-assignment'])
})

void test('a prefixed secret-named key is still found, and a value from a variable is not', () => {
  assert.deepEqual(scan('deploy.sh', ['DB_PASS' + 'WORD="' + literal + '"']), ['env-assignment'])
  assert.deepEqual(scan('deploy.sh', ['PASS' + 'WORD="$' + 'FROM_ENV_VALUE"']), [])
})

void test('an email address with an upper-case domain is found (Codex review of #252)', () => {
  assert.deepEqual(scan('notes.md', ['Write to alice' + '@' + 'PERSONAL.COM today.']), ['email'])
  assert.deepEqual(scan('notes.md', ['Write to alice' + '@' + 'personal.com today.']), ['email'])
})

void test('the email exceptions hold in any case, and a token pair is not an address', () => {
  assert.deepEqual(scan('notes.md', ['1+bot' + '@' + 'USERS.NOREPLY.GITHUB.COM']), [])
  assert.deepEqual(scan('notes.md', ['surface.inset' + '@' + 'surface.pane']), [])
})

void test('both CI scans ignore gitleaks:allow comments (Codex review of #252)', () => {
  for (const path of workflows) {
    const text = readFileSync(join(root, path), 'utf8')
    const calls = text.split('\n').filter((line) => line.includes('"$RUNNER_TEMP/gitleaks" git '))
    assert.equal(calls.length, 1, `${path} has one gitleaks git call`)
    assert.match(calls[0] ?? '', / --ignore-gitleaks-allow /, `${path} passes --ignore-gitleaks-allow`)
  }
  const line = 'API_TOK' + 'EN="' + literal + '" # gitleaks' + ':allow'
  assert.deepEqual(scan('deploy.sh', [line]), [])
  assert.deepEqual(scan('deploy.sh', [line], ['--ignore-gitleaks-allow']), ['env-assignment'])
})
