#!/usr/bin/env node
// Runs each hook on fixed inputs and checks its decision. Prints JSON and
// exits 1 on any mismatch.
import { spawnSync } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { root, parseInput } from './lib.ts'

type HookOutput = {
  decision?: string
  reason?: string
  hookSpecificOutput?: { permissionDecision?: string }
}
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
// Read only the fields the cases check, so a malformed output fails a case.
const parseOutput = (raw: string): HookOutput => {
  const data: unknown = JSON.parse(raw)
  if (!isRecord(data)) return {}
  const out: HookOutput = {}
  if (typeof data['decision'] === 'string') out.decision = data['decision']
  if (typeof data['reason'] === 'string') out.reason = data['reason']
  const specific = data['hookSpecificOutput']
  if (isRecord(specific) && typeof specific['permissionDecision'] === 'string') {
    out.hookSpecificOutput = { permissionDecision: specific['permissionDecision'] }
  }
  return out
}

// The environment of each hook run, without LIB_ALLOW_CHECK_EDITS: a
// session started with it (to change a check) must still see the guard
// block, so only a case that sets it passes it to the hook.
const baseEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== 'LIB_ALLOW_CHECK_EDITS'))
const hook = (name: string, input: unknown, env: Record<string, string> = {}): HookOutput | null => {
  const r = spawnSync('node', [join(root, 'scripts/agent-hooks', name)], {
    input: JSON.stringify(input), encoding: 'utf8', env: { ...baseEnv, CLAUDE_PROJECT_DIR: root, ...env },
  })
  return r.stdout.trim() ? parseOutput(r.stdout) : null
}
const edit = (rel: string) => ({ tool_name: 'Edit', tool_input: { file_path: join(root, rel) } })
const denied = (out: HookOutput | null) => out?.hookSpecificOutput?.permissionDecision === 'deny'

const cases: [string, boolean][] = [
  ['guard: component edit passes', !denied(hook('guard-checks.ts', edit('src/button/button.tsx')))],
  ['guard: story edit passes', !denied(hook('guard-checks.ts', edit('src/button/button.stories.tsx')))],
  ['guard: test edit blocked', denied(hook('guard-checks.ts', edit('src/button/button.test.tsx')))],
  ['guard: test edit allowed with LIB_ALLOW_CHECK_EDITS', !denied(hook('guard-checks.ts', edit('src/button/button.test.tsx'), { LIB_ALLOW_CHECK_EDITS: '1' }))],
  ['guard: lint config blocked', denied(hook('guard-checks.ts', edit('eslint.shared.js')))],
  ['guard: fixture runner blocked', denied(hook('guard-checks.ts', edit('scripts/check-fixtures.ts')))],
  ['guard: AGENTS.md check blocked', denied(hook('guard-checks.ts', edit('scripts/check-agents-md.ts')))],
  ['guard: check fixture blocked', denied(hook('guard-checks.ts', edit('checks/fixtures/clean.tsx')))],
  ['guard: baseline blocked even when allowed', denied(hook('guard-checks.ts', edit('src/__screenshots__/button.png'), { LIB_ALLOW_CHECK_EDITS: '1' }))],
  ['guard: token contrast pairs blocked', denied(hook('guard-checks.ts', edit('tokens/contrast.json')))],
  ['guard: generated preset blocked', denied(hook('guard-checks.ts', edit('tokens/generated/preset.ts')))],
  ['guard: theme token edit passes', !denied(hook('guard-checks.ts', edit('tokens/themes/viewscreen.json')))],
  ['guard: update flag blocked', denied(hook('guard-checks.ts', { tool_name: 'Bash', tool_input: { command: 'pnpm vitest run -u' } }))],
  ['guard: playwright update blocked', denied(hook('guard-checks.ts', { tool_name: 'Bash', tool_input: { command: 'npx playwright test --update-snapshots' } }))],
  ['guard: linking node_modules blocked', denied(hook('guard-checks.ts', { tool_name: 'Bash', tool_input: { command: 'ln -s ../main/node_modules node_modules' } }))],
  ['guard: link built with a substitution blocked', denied(hook('guard-checks.ts', { tool_name: 'Bash', tool_input: { command: 'ln -s "$(cd ../main && pwd)/node_modules" node_modules' } }))],
  ['guard: link after cd blocked', denied(hook('guard-checks.ts', { tool_name: 'Bash', tool_input: { command: 'cd /tmp/wt && /bin/ln -sf ../main/node_modules .' } }))],
  ['guard: search for the pattern passes', !denied(hook('guard-checks.ts', { tool_name: 'Bash', tool_input: { command: "rg 'ln.*node_modules' scripts/agent-hooks/lib.ts" } }))],
  ['guard: unrelated link then ls passes', !denied(hook('guard-checks.ts', { tool_name: 'Bash', tool_input: { command: 'ln -s README.md README-link.md\nls node_modules' } }))],
  ['guard: link built with backticks blocked', denied(hook('guard-checks.ts', { tool_name: 'Bash', tool_input: { command: 'ln -s "`cd ../main; pwd`/node_modules" node_modules' } }))],
  ['guard: pnpm install passes', !denied(hook('guard-checks.ts', { tool_name: 'Bash', tool_input: { command: 'pnpm install --frozen-lockfile' } }))],
  ['guard: plain test run passes', !denied(hook('guard-checks.ts', { tool_name: 'Bash', tool_input: { command: 'pnpm test' } }))],
  ['stop: second stop passes', hook('verify-stop.ts', { stop_hook_active: true }) === null],
]

// The lint hook needs a real file: one with a raw colour must come back blocked.
const tmp = join(root, 'src/__hooktest__')
mkdirSync(tmp, { recursive: true })
writeFileSync(join(tmp, 'bad.tsx'), "import { css } from '../../styled-system/css'\n\nexport const bad = css({ color: '[red]' })\n")
const lint = hook('lint-edit.ts', edit('src/__hooktest__/bad.tsx'))
spawnSync('rm', ['-rf', tmp])
cases.push(['lint: arbitrary value blocked', lint?.decision === 'block' && (lint.reason ?? '').includes('no-restricted-syntax')])
cases.push(['input: a non-object input reads as empty', JSON.stringify(parseInput('[1]')) === '{}'])
cases.push(['input: a numeric file path is dropped', parseInput('{"tool_input":{"file_path":7}}').tool_input?.file_path === undefined])
cases.push(['lint: file outside src passes', hook('lint-edit.ts', edit('README.md')) === null])


const failed = cases.filter(([, ok]) => !ok).map(([name]) => name)
console.log(JSON.stringify({ ok: failed.length === 0, passed: cases.length - failed.length, failed }))
process.exit(failed.length ? 1 : 0)
