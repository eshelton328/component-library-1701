#!/usr/bin/env node
// Proves the checks pass in a fresh git worktree of HEAD: it adds a
// worktree in a temporary folder, runs pnpm install and pnpm verify there,
// then removes the worktree. Agents work in worktrees, so a check that
// passes only in the main checkout does not count. CI runs it on each PR;
// it is not part of pnpm verify, which it runs.
//   node scripts/check-worktree.ts
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const root = new URL('..', import.meta.url).pathname
const dir = join(mkdtempSync(join(tmpdir(), 'worktree-check-')), 'repo')
const step = (cmd: string, args: string[], cwd: string) => {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', env: { ...process.env, CI: process.env['CI'] ?? '1' } })
  return { ok: r.status === 0, tail: `${r.stdout}${r.stderr}`.split('\n').filter((l) => l.trim()).slice(-15).join('\n') }
}

const steps: { name: string; ok: boolean; tail: string }[] = []
const add = step('git', ['worktree', 'add', '--detach', dir, 'HEAD'], root)
steps.push({ name: 'git worktree add', ...add })
if (add.ok) {
  for (const [name, args] of [
    ['pnpm install', ['install', '--frozen-lockfile', '--prefer-offline']],
    ['pnpm verify', ['verify']],
  ] as const) {
    const r = step('pnpm', [...args], dir)
    steps.push({ name, ...r })
    if (!r.ok) break
  }
  step('git', ['worktree', 'remove', '--force', dir], root)
}
rmSync(join(dir, '..'), { recursive: true, force: true })
const ok = steps.every((s) => s.ok)
console.log(JSON.stringify({ ok, worktree: dir, steps: steps.map((s) => (s.ok ? { name: s.name, ok: true } : s)) }, null, 1))
process.exit(ok ? 0 : 1)
