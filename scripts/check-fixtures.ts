#!/usr/bin/env node
// Proves that the checks catch what they must. Each fixture in
// checks/fixtures/ starts with `// expect: clean`, `// expect: tsc <code>`
// or `// expect: eslint <rule>`; each story in checks/stories/ is preceded
// by `// expect: pass` or `// expect: fail`. Prints one JSON object and
// exits 1 if any expectation does not hold.
//   node scripts/check-fixtures.ts           all checks
//   node scripts/check-fixtures.ts --static  skip the browser story checks
import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync, readdirSync, mkdtempSync } from 'node:fs'
import { join, relative } from 'node:path'
import { tmpdir } from 'node:os'

const root = new URL('..', import.meta.url).pathname
const bin = (name: string) => join(root, 'node_modules/.bin', name)
const run = (cmd: string, args: string[]) => spawnSync(bin(cmd), args, { cwd: root, encoding: 'utf8' })
type Result = { check: string; expect: string; ok: boolean; tsc?: string[]; eslint?: string[]; got?: string; unscoped?: string[] }
const results: Result[] = []
const fixtures = join(root, 'checks/fixtures')
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const str = (v: unknown) => (typeof v === 'string' ? v : '')

execFileSync(bin('panda'), ['codegen', '--config', 'checks/panda.config.ts', '--log-level', 'silent'], { cwd: root })

const tsc = run('tsc', ['-p', 'checks/tsconfig.json', '--pretty', 'false'])
const tscErrors: Record<string, string[]> = {}
for (const line of tsc.stdout.split('\n')) {
  const m = line.match(/fixtures\/([^(]+)\(\d+,\d+\): error (TS\d+)/)
  const [, file, code] = m ?? []
  if (file && code) (tscErrors[file] ??= []).push(code)
}
// ESLint's JSON report: an array of { filePath, messages: [{ ruleId }] }.
const lintWith = (config: string): Record<string, string[]> => {
  const report: unknown = JSON.parse(run('eslint', ['-c', config, '-f', 'json', 'checks/fixtures']).stdout)
  const rules: Record<string, string[]> = {}
  for (const file of list(report)) {
    if (!isRecord(file)) continue
    rules[relative(fixtures, str(file['filePath']))] = list(file['messages']).map((m) => (isRecord(m) && typeof m['ruleId'] === 'string' ? m['ruleId'] : 'eslint'))
  }
  return rules
}
const eslintRules = lintWith('checks/eslint.config.js')
const scriptRules = lintWith('checks/eslint.scripts.config.js')

// Fixtures may sit in folders: checks/fixtures/src/<tier>/ shows the tier rules.
const fixtureFiles = readdirSync(fixtures, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.tsx')).sort()
for (const name of fixtureFiles) {
  const [head = '', second = ''] = readFileSync(join(fixtures, name), 'utf8').split('\n')
  const [, tool, want] = head.match(/^\/\/ expect: (clean|tsc|eslint) ?(\S*)/) ?? []
  const gotTsc = tscErrors[name] ?? []
  const gotLint = eslintRules[name] ?? []
  let ok: boolean
  if (tool === 'clean') ok = gotTsc.length === 0 && gotLint.length === 0
  else if (tool === 'tsc' && want) ok = gotTsc.includes(want)
  else if (tool === 'eslint' && want) ok = gotLint.includes(want)
  else ok = false
  results.push({ check: `fixtures/${name}`, expect: head.slice(3), ok, tsc: gotTsc, eslint: gotLint })
  if (second.trim() === '// scope: scripts too' && (tool === 'eslint' || tool === 'clean')) {
    const gotScript = scriptRules[name] ?? []
    const okScript = tool === 'clean' ? gotScript.length === 0 : want !== undefined && gotScript.includes(want)
    results.push({ check: `fixtures/${name} (scripts config)`, expect: head.slice(3), ok: okScript, eslint: gotScript })
  }
}

if (!process.argv.includes('--static')) {
  const out = join(mkdtempSync(join(tmpdir(), 'checks-')), 'vitest.json')
  run('vitest', ['run', '--project=checks', '--reporter=json', `--outputFile=${out}`])
  // Vitest's JSON report: { testResults: [{ assertionResults: [{ title, status }] }] }.
  const report: unknown = JSON.parse(readFileSync(out, 'utf8'))
  const status: Record<string, string> = {}
  // A story file that fails to import runs no tests. Report its error, so
  // the failure names the cause rather than a list of missing stories.
  const importErrors: string[] = []
  for (const file of list(isRecord(report) ? report['testResults'] : [])) {
    if (!isRecord(file)) continue
    const assertions = list(file['assertionResults'])
    if (assertions.length === 0 && file['status'] === 'failed') importErrors.push(str(file['message']).split('\n').slice(0, 3).join(' '))
    for (const a of assertions) {
      if (isRecord(a)) status[str(a['title'])] = str(a['status'])
    }
  }
  if (importErrors.length) {
    results.push({
      check: 'stories: the story files load',
      expect: 'every story file imports',
      ok: false,
      got: `${importErrors[0] ?? ''} Vite serves only files inside the repository, so in a git worktree run pnpm install there; never link node_modules from another checkout.`,
    })
  }
  for (const name of readdirSync(join(root, 'checks/stories'))) {
    const lines = readFileSync(join(root, 'checks/stories', name), 'utf8').split('\n')
    lines.forEach((line, i) => {
      const want = line.match(/^\/\/ expect: (pass|fail)/)?.[1]
      const story = lines[i + 1]?.match(/^export const (\w+)/)?.[1]
      if (!want || !story) return
      const title = story.replace(/([a-z])([A-Z])/g, '$1 $2')
      const got = status[title] === 'passed' ? 'pass' : status[title] === 'failed' ? 'fail' : 'missing'
      results.push({ check: `stories/${name}#${story}`, expect: want, ok: got === want, got })
    })
  }
}

// Scope: every tracked TypeScript file outside checks/ and generated output
// gets the type rules, so a narrower `files` glob in eslint.config.js fails.
const { ESLint } = await import('eslint')
const linter = new ESLint({ cwd: root })
const tracked = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean)
const unscoped: string[] = []
for (const file of tracked.filter((f) => !/^(checks|tokens\/generated)\//.test(f))) {
  // calculateConfigForFile returns `any`; read only the one rule setting.
  const config: unknown = (await linter.isPathIgnored(file)) ? undefined : await linter.calculateConfigForFile(file)
  const rules = isRecord(config) ? config['rules'] : undefined
  const rule = isRecord(rules) ? rules['@typescript-eslint/no-unsafe-type-assertion'] : undefined
  const severity: unknown = Array.isArray(rule) ? rule[0] : rule
  if (severity !== 2 && severity !== 'error') unscoped.push(file)
}
results.push({ check: 'scope: type rules on every tracked .ts and .tsx file', expect: 'none unscoped', ok: unscoped.length === 0, unscoped })

const ok = results.every((r) => r.ok)
console.log(JSON.stringify({ ok, failed: results.filter((r) => !r.ok), passed: results.filter((r) => r.ok).length }, null, 1))
process.exit(ok ? 0 : 1)
