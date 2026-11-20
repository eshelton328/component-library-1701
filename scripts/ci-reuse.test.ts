// Tests for the reuse of the worktree result in .github/workflows/ci.yml:
// typecheck, lint, tokens, checks and test pass from the worktree job only
// because its pnpm verify runs each of their commands, with the same flags.
// A skipped verify runs the jobs in full, and any other end of the worktree
// job fails them. Run with `pnpm test:release`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { parse, stringify } from 'yaml'

const root = new URL('..', import.meta.url).pathname
const REUSED = ['typecheck', 'lint', 'tokens', 'checks', 'test']

type Step = Record<string, unknown>
interface Job { needs: unknown; if: unknown; timeout: unknown; outputs: Record<string, unknown>; steps: Step[] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

// The jobs of a parsed workflow, by name; it throws on any other shape.
function jobsOf(doc: unknown): Record<string, unknown> {
  const jobs = isRecord(doc) ? doc['jobs'] : undefined
  if (!isRecord(jobs)) throw new Error('ci.yml has no jobs')
  return jobs
}

function jobOf(doc: unknown, name: string): Job {
  const job = jobsOf(doc)[name]
  if (!isRecord(job)) throw new Error(`ci.yml has no job ${name}`)
  const steps = job['steps']
  if (!Array.isArray(steps) || !steps.every(isRecord)) throw new Error(`${name} has no list of steps`)
  const outputs = job['outputs']
  return { needs: job['needs'], if: job['if'], timeout: job['timeout-minutes'], outputs: isRecord(outputs) ? outputs : {}, steps }
}

const ciText = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8')
const ci: unknown = parse(ciText)
const pkg: unknown = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const scripts = isRecord(pkg) ? pkg['scripts'] : undefined
const verifyScript = isRecord(scripts) ? str(scripts['verify']) : undefined
if (verifyScript === undefined) throw new Error('package.json has no verify script')
const verify = verifyScript.split('&&').map((s) => s.trim())

function pnpmRuns(job: Job): string[] {
  return job.steps.flatMap((s) => {
    const run = str(s['run'])?.trim()
    return run !== undefined && /^pnpm\s/.test(run) ? [run] : []
  })
}

// Writes a changed copy of ci.yml and returns the exit code of check:ci on it.
function checkCi(change: (doc: unknown) => void): number | null {
  const copy: unknown = parse(ciText)
  change(copy)
  const file = join(mkdtempSync(join(tmpdir(), 'ci-reuse-')), 'ci.yml')
  writeFileSync(file, stringify(copy))
  return spawnSync('node', [join(root, 'scripts/check-ci.ts'), file]).status
}

void test('pnpm verify runs each command of the reused jobs, with the same arguments', () => {
  for (const name of REUSED) {
    const runs = pnpmRuns(jobOf(ci, name))
    assert.ok(runs.length > 0, `${name} runs no pnpm command`)
    for (const run of runs) assert.ok(verify.includes(run), `verify does not run "${run}" of the ${name} job`)
  }
})

void test('the reused jobs run only pnpm commands after the reuse step, so verify covers all of their work', () => {
  for (const name of REUSED) {
    for (const s of jobOf(ci, name).steps.slice(1)) {
      const run = str(s['run'])
      const uses = str(s['uses'])
      if (run !== undefined) assert.match(run.trim(), /^pnpm\s\S+$/, `${name} runs "${run.trim()}", which verify may not run`)
      else assert.ok(uses === './.github/actions/setup' || uses?.startsWith('actions/checkout@') === true, `${name} uses ${String(uses)}`)
    }
  }
})

void test('the worktree job runs pnpm verify with the same setup, and reports whether it ran', () => {
  const w = jobOf(ci, 'worktree')
  assert.equal(w.outputs['ran'], '${{ steps.paths.outputs.run }}')
  const setup = w.steps.find((s) => s['uses'] === './.github/actions/setup')
  const withs = setup?.['with']
  assert.equal(isRecord(withs) ? withs['browser'] : undefined, 'true')
  assert.ok(w.steps.some((s) => str(s['run'])?.trim() === 'pnpm check:worktree'))
  const script = readFileSync(join(root, 'scripts/check-worktree.ts'), 'utf8')
  assert.match(script, /\['pnpm verify', \['verify'\]\]/)
})

void test('a hang in the worktree job ends the run and shows where it stopped (beta run 44638994455)', () => {
  assert.equal(jobOf(ci, 'worktree').timeout, 25)
  const script = readFileSync(join(root, 'scripts/check-worktree.ts'), 'utf8')
  assert.match(script, /detached: true/)
  assert.match(script, /process\.kill\(-child\.pid, 'SIGTERM'\)/)
  assert.match(script, /lineWriter\(/)
  assert.match(script, /::group::/)
})

void test('each reused job waits for worktree and skips its steps only on reuse', () => {
  for (const name of REUSED) {
    const job = jobOf(ci, name)
    assert.equal(job.needs, 'worktree', name)
    assert.equal(job.if, '${{ !cancelled() }}', name)
    const first = job.steps.at(0)
    assert.ok(first !== undefined, `${name} has no steps`)
    assert.equal(first['id'], 'reuse', name)
    assert.equal(first['if'], undefined, name)
    for (const s of job.steps.slice(1)) assert.equal(s['if'], "steps.reuse.outputs.reuse != 'true'", name)
  }
})

// Runs the reuse step's script as the runner would, and returns its exit
// code and outputs.
function reuse(result: string, ran: string): { code: number | null; out: string } {
  const out = join(mkdtempSync(join(tmpdir(), 'ci-reuse-')), 'out')
  writeFileSync(out, '')
  const run = str(jobOf(ci, 'typecheck').steps.at(0)?.['run'])
  if (run === undefined) throw new Error('the reuse step of typecheck has no run script')
  const r = spawnSync('bash', ['-c', run], { env: { ...process.env, RESULT: result, RAN: ran, GITHUB_OUTPUT: out }, encoding: 'utf8' })
  return { code: r.status, out: readFileSync(out, 'utf8').trim() }
}

void test('the reuse step passes only on a worktree success, and reuses only when verify ran', () => {
  assert.deepEqual(reuse('success', 'true'), { code: 0, out: 'reuse=true' })
  assert.deepEqual(reuse('success', 'false'), { code: 0, out: 'reuse=false' })
  assert.deepEqual(reuse('success', ''), { code: 0, out: 'reuse=false' })
  for (const end of ['failure', 'cancelled', 'skipped', '']) assert.equal(reuse(end, 'true').code, 1, end)
})

void test('every reused job has the same reuse step', () => {
  for (const name of REUSED) assert.deepEqual(jobOf(ci, name).steps[0], jobOf(ci, 'typecheck').steps[0], name)
})

void test('check:ci fails when a reused job drops a verify command', () => {
  const status = checkCi((doc) => {
    const job = jobsOf(doc)['typecheck']
    if (!isRecord(job) || !Array.isArray(job['steps'])) throw new Error('typecheck has no steps')
    const steps: unknown[] = job['steps']
    job['steps'] = steps.filter((s) => !(isRecord(s) && str(s['run'])?.trim() === 'pnpm typecheck'))
  })
  assert.equal(status, 1)
  assert.equal(spawnSync('node', [join(root, 'scripts/check-ci.ts')]).status, 0)
})

void test('check:ci counts the reuse form only in the five reused jobs (Codex review of #258)', () => {
  // A package job in the reuse form whose reuse step always reuses would
  // skip check:api on every PR; check:ci must not count that step.
  const status = checkCi((doc) => {
    const jobs = jobsOf(doc)
    const pkg = jobs['package']
    if (!isRecord(pkg) || !Array.isArray(pkg['steps'])) throw new Error('package has no steps')
    const steps: unknown[] = pkg['steps']
    for (const s of steps) if (isRecord(s)) s['if'] = "steps.reuse.outputs.reuse != 'true'"
    pkg['needs'] = 'worktree'
    pkg['if'] = '${{ !cancelled() }}'
    pkg['steps'] = [{ id: 'reuse', run: 'echo "reuse=true" >> "$GITHUB_OUTPUT"' }, ...steps]
  })
  assert.equal(status, 1)
})

void test('check:ci does not count a step under another if', () => {
  const status = checkCi((doc) => {
    const job = jobsOf(doc)['typecheck']
    if (!isRecord(job) || !Array.isArray(job['steps'])) throw new Error('typecheck has no steps')
    const steps: unknown[] = job['steps']
    for (const s of steps.slice(1)) if (isRecord(s)) s['if'] = "steps.reuse.outputs.reuse == 'never'"
  })
  assert.equal(status, 1)
})

void test('a reused job takes ubuntu-slim only when it reuses, and ubuntu-24.04 when it runs in full (issue #275)', () => {
  const expr = "${{ needs.worktree.result == 'success' && needs.worktree.outputs.ran == 'true' && 'ubuntu-slim' || 'ubuntu-24.04' }}"
  const jobs = jobsOf(ci)
  for (const name of REUSED) {
    const job = jobs[name]
    assert.ok(isRecord(job), name)
    assert.equal(job['runs-on'], expr, name)
  }
  // The same condition as the reuse step: success and ran give reuse=true.
  const pick = (result: string, ran: string) => (result === 'success' && ran === 'true' ? 'ubuntu-slim' : 'ubuntu-24.04')
  for (const result of ['success', 'failure', 'cancelled', 'skipped', '']) {
    for (const ran of ['true', 'false', '']) {
      const r = reuse(result, ran)
      const reused = r.code === 0 && r.out.includes('reuse=true')
      if (reused) assert.equal(pick(result, ran), 'ubuntu-slim', `${result}/${ran}`)
      if (r.code === 0 && !reused) assert.equal(pick(result, ran), 'ubuntu-24.04', `${result}/${ran}`)
    }
  }
})
