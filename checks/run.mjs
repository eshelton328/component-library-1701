#!/usr/bin/env node
// Proves that the checks catch what they must. Each fixture in
// checks/fixtures/ starts with `// expect: clean`, `// expect: tsc <code>`
// or `// expect: eslint <rule>`; each story in checks/stories/ is preceded
// by `// expect: pass` or `// expect: fail`. Prints one JSON object and
// exits 1 if any expectation does not hold.
//   node checks/run.mjs           all checks
//   node checks/run.mjs --static  skip the browser story checks
import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync, readdirSync, mkdtempSync } from 'node:fs'
import { join, basename } from 'node:path'
import { tmpdir } from 'node:os'

const root = new URL('..', import.meta.url).pathname
const bin = (name) => join(root, 'node_modules/.bin', name)
const run = (cmd, args) => spawnSync(bin(cmd), args, { cwd: root, encoding: 'utf8' })
const results = []

execFileSync(bin('panda'), ['codegen', '--config', 'checks/panda.config.ts', '--log-level', 'silent'], { cwd: root })

const tsc = run('tsc', ['-p', 'checks/tsconfig.json', '--pretty', 'false'])
const tscErrors = {}
for (const line of tsc.stdout.split('\n')) {
  const m = line.match(/fixtures\/([^(]+)\(\d+,\d+\): error (TS\d+)/)
  if (m) (tscErrors[m[1]] ??= []).push(m[2])
}
const eslint = run('eslint', ['-c', 'checks/eslint.config.js', '-f', 'json', 'checks/fixtures'])
const eslintRules = {}
for (const file of JSON.parse(eslint.stdout)) {
  eslintRules[basename(file.filePath)] = file.messages.map((m) => m.ruleId ?? 'eslint')
}

for (const name of readdirSync(join(root, 'checks/fixtures')).sort()) {
  const head = readFileSync(join(root, 'checks/fixtures', name), 'utf8').split('\n')[0]
  const [, tool, want] = head.match(/^\/\/ expect: (clean|tsc|eslint) ?(\S*)/) ?? []
  const gotTsc = tscErrors[name] ?? []
  const gotLint = eslintRules[name] ?? []
  let ok
  if (tool === 'clean') ok = gotTsc.length === 0 && gotLint.length === 0
  else if (tool === 'tsc') ok = gotTsc.includes(want)
  else if (tool === 'eslint') ok = gotLint.includes(want)
  else ok = false
  results.push({ check: `fixtures/${name}`, expect: head.slice(3), ok, tsc: gotTsc, eslint: gotLint })
}

if (!process.argv.includes('--static')) {
  const out = join(mkdtempSync(join(tmpdir(), 'checks-')), 'vitest.json')
  run('vitest', ['run', '--project=checks', '--reporter=json', `--outputFile=${out}`])
  const report = JSON.parse(readFileSync(out, 'utf8'))
  const status = {}
  for (const file of report.testResults) for (const a of file.assertionResults) status[a.title] = a.status
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

const ok = results.every((r) => r.ok)
console.log(JSON.stringify({ ok, failed: results.filter((r) => !r.ok), passed: results.filter((r) => r.ok).length }, null, 1))
process.exit(ok ? 0 : 1)
