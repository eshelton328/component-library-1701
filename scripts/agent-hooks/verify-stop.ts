#!/usr/bin/env node
// Stop hook: runs `pnpm verify` when the working tree has changes, and
// returns the failure to the agent once. On the second stop
// (stop_hook_active) it lets the agent stop, so a check that cannot pass
// does not loop; the agent then reports the failure.
import { spawnSync } from 'node:child_process'
import { readInput, root } from './lib.ts'

const input = readInput()
if (input.stop_hook_active) process.exit(0)
const status = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' })
if (!status.stdout.trim()) process.exit(0)
const r = spawnSync('pnpm', ['verify'], { cwd: root, encoding: 'utf8' })
if (r.status !== 0) {
  const out = (r.stdout + r.stderr).split('\n').filter((l) => l.trim()).slice(-40).join('\n')
  console.log(JSON.stringify({
    decision: 'block',
    reason: `pnpm verify failed. Fix the failures before you stop, or say in your reply which failure remains and why:\n${out}`,
  }))
}
