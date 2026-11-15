#!/usr/bin/env node
// Fails when a step of `pnpm verify` does not run on every pull request.
// CI runs each check as its own job, so a step added to verify and not to
// CI would pass locally and never run on a PR. The workflow is parsed as
// YAML. A step counts only when it is a `run: pnpm <step>` in a job of a
// workflow that triggers on pull_request, with no `if:` on the job or the
// step, so a step in a comment, a string or a disabled job does not count.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'

const root = new URL('..', import.meta.url).pathname
const workflowPath = process.argv[2] ?? join(root, '.github/workflows/ci.yml')
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const problems: string[] = []

const pkg: unknown = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const scripts = isRecord(pkg) ? pkg['scripts'] : undefined
const verify = isRecord(scripts) && typeof scripts['verify'] === 'string' ? scripts['verify'] : ''
const steps = verify.split('&&').map((s) => s.trim().replace(/^pnpm\s+/, '')).filter(Boolean)
if (!steps.length) problems.push('package.json has no verify script')

const workflow: unknown = parse(readFileSync(workflowPath, 'utf8'))
// `on` may be a string, a list or a map of triggers.
const on = isRecord(workflow) ? workflow['on'] : undefined
const onPullRequest = on === 'pull_request' || (Array.isArray(on) && on.includes('pull_request')) || (isRecord(on) && 'pull_request' in on)
if (!onPullRequest) problems.push(`${workflowPath} does not run on pull_request`)

const covered = new Set<string>()
const jobs = isRecord(workflow) && isRecord(workflow['jobs']) ? workflow['jobs'] : {}
for (const job of Object.values(jobs)) {
  if (!isRecord(job) || 'if' in job || !Array.isArray(job['steps'])) continue
  const jobSteps: unknown[] = job['steps']
  for (const s of jobSteps) {
    if (!isRecord(s) || 'if' in s || typeof s['run'] !== 'string') continue
    const m = /^pnpm\s+(\S+)\s*$/.exec(s['run'].trim())
    if (m?.[1]) covered.add(m[1])
  }
}
const missing = onPullRequest ? steps.filter((s) => !covered.has(s)) : steps
const ok = problems.length === 0 && missing.length === 0
console.log(JSON.stringify({ ok, steps: steps.length, missing, problems }))
process.exit(ok ? 0 : 1)
