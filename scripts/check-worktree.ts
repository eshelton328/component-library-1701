#!/usr/bin/env node
// Proves the checks pass in a fresh git worktree of HEAD: it adds a
// worktree in a temporary folder, runs pnpm install and pnpm verify there,
// then removes the worktree. Agents work in worktrees, so a check that
// passes only in the main checkout does not count. CI runs it on each PR;
// it is not part of pnpm verify, which it runs.
//   node scripts/check-worktree.ts
// Each step's output is printed line by line as it runs, with the step name
// as a prefix, so the log of a step that hangs ends at its last line. The
// summary at the end repeats the last lines of a failed step.
// The worktree is removed on success, on failure and on SIGINT or SIGTERM,
// and a failed removal fails the check.
import { spawn, spawnSync } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { lineWriter } from './worktree-lib.ts'

type Step = { name: string; ok: boolean; tail: string }
const root = new URL('..', import.meta.url).pathname
const parent = mkdtempSync(join(tmpdir(), 'worktree-check-'))
const dir = join(parent, 'repo')
const tailOf = (out: string) => out.split('\n').filter((l) => l.trim()).slice(-15).join('\n')
let child: ChildProcess | undefined

// Runs one command, prints its output as it runs and keeps the last lines.
const step = (name: string, cmd: string, args: string[], cwd: string) =>
  new Promise<Step>((done) => {
    let out = ''
    const print = (line: string) => { process.stdout.write(line) }
    const writers = [lineWriter(`[${name}] `, print), lineWriter(`[${name}] `, print)] as const
    console.log(`[${name}] $ ${[cmd, ...args].join(' ')}`)
    child = spawn(cmd, args, { cwd, env: { ...process.env, CI: process.env['CI'] ?? '1' } })
    const keep = (writer: (typeof writers)[number]) => (b: Buffer) => {
      const text = b.toString()
      out = (out + text).slice(-20000)
      writer.write(text)
    }
    child.stdout?.on('data', keep(writers[0]))
    child.stderr?.on('data', keep(writers[1]))
    child.on('error', (e) => { done({ name, ok: false, tail: e.message }) })
    child.on('close', (code) => {
      child = undefined
      for (const w of writers) w.flush()
      done({ name, ok: code === 0, tail: tailOf(out) })
    })
  })

// Removes the worktree and its git entry. Synchronous, so a signal handler
// can run it before the process exits.
const cleanup = (): Step => {
  const remove = existsSync(dir) ? spawnSync('git', ['worktree', 'remove', '--force', dir], { cwd: root, encoding: 'utf8' }) : undefined
  rmSync(parent, { recursive: true, force: true })
  spawnSync('git', ['worktree', 'prune'], { cwd: root })
  const listed = spawnSync('git', ['worktree', 'list', '--porcelain'], { cwd: root, encoding: 'utf8' }).stdout.includes(dir)
  const ok = (remove === undefined || remove.status === 0) && !listed
  return { name: 'git worktree remove', ok, tail: ok ? '' : `${remove?.stderr ?? ''}${listed ? `\n${dir} is still listed by git worktree list` : ''}`.trim() }
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    child?.kill('SIGTERM')
    const removed = cleanup()
    console.log(JSON.stringify({ ok: false, worktree: dir, interrupted: signal, cleanup: removed }, null, 1))
    process.exit(signal === 'SIGINT' ? 130 : 143)
  })
}

const steps: Step[] = []
const add = await step('git worktree add', 'git', ['worktree', 'add', '--detach', dir, 'HEAD'], root)
steps.push(add)
if (add.ok) {
  for (const [name, args] of [
    ['pnpm install', ['install', '--frozen-lockfile', '--prefer-offline']],
    ['pnpm verify', ['verify']],
  ] as const) {
    const r = await step(name, 'pnpm', [...args], dir)
    steps.push(r)
    if (!r.ok) break
  }
}
steps.push(cleanup())
const ok = steps.every((s) => s.ok)
console.log(JSON.stringify({ ok, worktree: dir, steps: steps.map((s) => (s.ok ? { name: s.name, ok: true } : s)) }, null, 1))
process.exit(ok ? 0 : 1)
