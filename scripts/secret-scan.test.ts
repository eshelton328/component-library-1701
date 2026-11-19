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
import { mergePrefixPaths } from './secret-merge-prefix.ts'

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

// The rule IDs that gitleaks git finds in a repository whose last commit
// is a merge that adds a planted line, with these --log-opts ($BASE is the
// commit before the merge).
function scanMerge(logOpts: (base: string) => string): string[] {
  const dir = mkdtempSync(join(tmpdir(), 'secret-scan-git-'))
  const report = join(dir, 'report.json')
  const repo = join(dir, 'repo')
  mkdirSync(repo)
  const git = (...args: string[]) => {
    const r = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t' + '@' + 'users.noreply.github.com', ...args],
      { cwd: repo, encoding: 'utf8' })
    assert.equal(r.status, 0, r.stderr)
    return r.stdout.trim()
  }
  git('init', '-q', '-b', 'main')
  writeFileSync(join(repo, 'a.txt'), 'a\n')
  git('add', '.')
  git('commit', '-qm', 'one', '--no-verify')
  git('checkout', '-q', '-b', 'side')
  writeFileSync(join(repo, 'b.txt'), 'b\n')
  git('add', '.')
  git('commit', '-qm', 'side', '--no-verify')
  git('checkout', '-q', 'main')
  const base = git('rev-parse', 'HEAD')
  git('merge', '-q', '--no-ff', '--no-commit', 'side')
  writeFileSync(join(repo, 'deploy.sh'), 'PASS' + 'WORD="' + literal + '"\n')
  git('add', '.')
  git('commit', '-qm', 'merge', '--no-verify')
  const run = spawnSync(gitleaks, ['git', '--no-banner', '--redact', '--exit-code', '0', '--config', config,
    '--report-format', 'json', '--report-path', report, '--log-opts=' + logOpts(base), repo], { encoding: 'utf8' })
  if (run.error !== undefined) throw new Error(`gitleaks did not start (${run.error.message}); install gitleaks 8.30.1 or set GITLEAKS`)
  assert.equal(run.status, 0, run.stderr)
  const found: unknown = JSON.parse(readFileSync(report, 'utf8'))
  if (!Array.isArray(found)) throw new Error('the gitleaks report is not a list')
  return found.filter(isFinding).map((f) => f.RuleID).sort()
}

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

void test('a single-quoted value with a $ is literal and found (Codex review of the-bridge #215)', () => {
  assert.deepEqual(scan('deploy.sh', ['PASS' + "WORD='$" + literal + "'"]), ['env-assignment'])
})

void test('a single-quoted GitHub expression is not a literal (Codex review of #262)', () => {
  assert.deepEqual(scan('ci.yml', ['          PASS' + "WORD='$" + '{{secrets.PASSWORD}}' + "'"]), [])
  assert.deepEqual(scan('ci.yml', ['          PASS' + "WORD='$" + '{{ secrets.PASSWORD }}' + "'"]), [])
})

// Gitleaks on a merge commit that resolves a conflict in
// tokens/figma/target.json, with the scan flags of both CI scans.
function scanFileKeyConflict(): string[] {
  const dir = mkdtempSync(join(tmpdir(), 'secret-scan-conflict-'))
  const report = join(dir, 'report.json')
  const repo = join(dir, 'repo')
  mkdirSync(join(repo, 'tokens', 'figma'), { recursive: true })
  const git = (...args: string[]) => {
    const r = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t' + '@' + 'users.noreply.github.com',
      '-c', 'core.hooksPath=/dev/null', ...args], { cwd: repo, encoding: 'utf8' })
    return { status: r.status, out: r.stdout.trim(), err: r.stderr }
  }
  const ok = (...args: string[]) => { const r = git(...args); assert.equal(r.status, 0, r.err); return r.out }
  const target = join(repo, 'tokens', 'figma', 'target.json')
  const key = (tail: string) => '{\n  "file' + 'Key": "AbCdEfGhIjKlMnOpQrStUv' + tail + '",\n  "page": "x"\n}\n'
  ok('init', '-q', '-b', 'main')
  writeFileSync(target, key('1'))
  ok('add', '.')
  ok('commit', '-qm', 'base')
  ok('checkout', '-q', '-b', 'side')
  writeFileSync(target, key('2'))
  ok('commit', '-qam', 'side')
  ok('checkout', '-q', 'main')
  writeFileSync(target, key('3'))
  ok('commit', '-qam', 'main')
  assert.notEqual(git('merge', '-q', 'side').status, 0, 'the merge must stop on a conflict')
  writeFileSync(target, key('9Q'))
  ok('add', '.')
  ok('commit', '-qm', 'merge')
  const run = spawnSync(gitleaks, ['git', '--no-banner', '--redact', '--exit-code', '0', '--config', config,
    '--report-format', 'json', '--report-path', report, '--log-opts=--all --diff-merges=remerge', repo], { encoding: 'utf8' })
  if (run.error !== undefined) throw new Error(`gitleaks did not start (${run.error.message}); install gitleaks 8.30.1 or set GITLEAKS`)
  assert.equal(run.status, 0, run.stderr)
  const found: unknown = JSON.parse(readFileSync(report, 'utf8'))
  if (!Array.isArray(found)) throw new Error('the gitleaks report is not a list')
  return found.filter(isFinding).map((f) => f.RuleID).sort()
}

void test('the Figma fileKey exception holds in a merge conflict hunk, which gitleaks names b/<path> (Codex review of #262)', () => {
  assert.deepEqual(scanFileKeyConflict(), [])
})

void test('both CI scans pass --diff-merges=remerge, so a merge commit is scanned (Codex review of the-bridge #215)', () => {
  for (const path of workflows) {
    const text = readFileSync(join(root, path), 'utf8')
    const at = text.indexOf('"$RUNNER_TEMP/gitleaks" git ')
    const call = text.slice(at, text.indexOf('\n', text.indexOf(' .', at)))
    assert.match(call, /--log-opts="[^"]*--diff-merges=remerge/, `${path} passes --diff-merges=remerge`)
  }
  assert.deepEqual(scanMerge((base) => '--diff-merges=remerge ' + base + '..HEAD'), ['env-assignment'])
  assert.deepEqual(scanMerge(() => '--all --diff-merges=remerge'), ['env-assignment'])
  assert.deepEqual(scanMerge((base) => base + '..HEAD'), [])
})

void test('a single-quoted value from ${ is a literal unless it is a whole expression with no space (Codex review of the-bridge #225)', () => {
  assert.deepEqual(scan('deploy.sh', ['PASS' + "WORD='$" + '{' + literal + "}'"]), ['env-assignment'])
  assert.deepEqual(scan('deploy.sh', ['PASS' + "WORD='$" + '{{x}}' + literal + "'"]), ['env-assignment'])
  assert.deepEqual(scan('deploy.sh', ['PASS' + "WORD='$" + literal + "'"]), ['env-assignment'])
  assert.deepEqual(scan('ci.yml', ['          PASS' + "WORD='$" + '{{secrets.PASSWORD}}' + "'"]), [])
})

void test('the job secrets fails a PR that adds or changes a file under a top-level b/ folder, which would share the exceptions (Codex review of the-bridge #225)', () => {
  assert.deepEqual(mergePrefixPaths(['b/tokens/x.json', 'src/b/x.ts', 'tokens/b/x.json', 'b.md']), ['b/tokens/x.json'])
  const job = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8').split('\n  secrets:\n')[1] ?? ''
  assert.match(job, /run: node scripts\/secret-merge-prefix\.ts "\$BASE" "\$HEAD"/)
  const repo = mkdtempSync(join(tmpdir(), 'secret-scan-b-'))
  const git = (...args: string[]) => {
    const r = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t' + '@' + 'users.noreply.github.com',
      '-c', 'core.hooksPath=/dev/null', ...args], { cwd: repo, encoding: 'utf8' })
    assert.equal(r.status, 0, r.stderr)
    return r.stdout.trim()
  }
  git('init', '-q', '-b', 'main')
  writeFileSync(join(repo, 'a.txt'), 'a\n')
  git('add', '.')
  git('commit', '-qm', 'one')
  const base = git('rev-parse', 'HEAD')
  mkdirSync(join(repo, 'b/tokens'), { recursive: true })
  writeFileSync(join(repo, 'b/tokens/x.json'), '{}\n')
  git('add', '.')
  git('commit', '-qm', 'two')
  const script = join(root, 'scripts/secret-merge-prefix.ts')
  const run = spawnSync(process.execPath, [script, base, 'HEAD'], { cwd: repo, encoding: 'utf8' })
  assert.equal(run.status, 1, run.stderr)
  assert.match(run.stdout, /"found":\["b\/tokens\/x\.json"\]/)
})
