#!/usr/bin/env node
// Runs each hook on fixed inputs and checks its decision. Prints JSON and
// exits 1 on any mismatch.
import { spawnSync } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { root } from './lib.mjs'

const hook = (name, input, env = {}) => {
  const r = spawnSync('node', [join(root, 'scripts/agent-hooks', name)], {
    input: JSON.stringify(input), encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: root, ...env },
  })
  return r.stdout.trim() ? JSON.parse(r.stdout) : null
}
const edit = (rel) => ({ tool_name: 'Edit', tool_input: { file_path: join(root, rel) } })
const denied = (out) => out?.hookSpecificOutput?.permissionDecision === 'deny'

const cases = [
  ['guard: component edit passes', !denied(hook('guard-checks.mjs', edit('src/button/button.tsx')))],
  ['guard: story edit passes', !denied(hook('guard-checks.mjs', edit('src/button/button.stories.tsx')))],
  ['guard: test edit blocked', denied(hook('guard-checks.mjs', edit('src/button/button.test.tsx')))],
  ['guard: test edit allowed with LIB_ALLOW_CHECK_EDITS', !denied(hook('guard-checks.mjs', edit('src/button/button.test.tsx'), { LIB_ALLOW_CHECK_EDITS: '1' }))],
  ['guard: lint config blocked', denied(hook('guard-checks.mjs', edit('eslint.shared.js')))],
  ['guard: check fixture blocked', denied(hook('guard-checks.mjs', edit('checks/fixtures/clean.tsx')))],
  ['guard: baseline blocked even when allowed', denied(hook('guard-checks.mjs', edit('src/__screenshots__/button.png'), { LIB_ALLOW_CHECK_EDITS: '1' }))],
  ['guard: update flag blocked', denied(hook('guard-checks.mjs', { tool_name: 'Bash', tool_input: { command: 'pnpm vitest run -u' } }))],
  ['guard: playwright update blocked', denied(hook('guard-checks.mjs', { tool_name: 'Bash', tool_input: { command: 'npx playwright test --update-snapshots' } }))],
  ['guard: plain test run passes', !denied(hook('guard-checks.mjs', { tool_name: 'Bash', tool_input: { command: 'pnpm test' } }))],
  ['stop: second stop passes', hook('verify-stop.mjs', { stop_hook_active: true }) === null],
]

// The lint hook needs a real file: one with a raw colour must come back blocked.
const tmp = join(root, 'src/__hooktest__')
mkdirSync(tmp, { recursive: true })
writeFileSync(join(tmp, 'bad.tsx'), "import { css } from '../../styled-system/css'\n\nexport const bad = css({ color: '[red]' })\n")
const lint = hook('lint-edit.mjs', edit('src/__hooktest__/bad.tsx'))
spawnSync('rm', ['-rf', tmp])
cases.push(['lint: arbitrary value blocked', lint?.decision === 'block' && lint.reason.includes('no-restricted-syntax')])
cases.push(['lint: file outside src passes', hook('lint-edit.mjs', edit('README.md')) === null])


const failed = cases.filter(([, ok]) => !ok).map(([name]) => name)
console.log(JSON.stringify({ ok: failed.length === 0, passed: cases.length - failed.length, failed }))
process.exit(failed.length ? 1 : 0)
