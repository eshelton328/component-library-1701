// Tests for scripts/release-reuse.ts and the reuse jobs in
// .github/workflows/release.yml: a release uses the merged PR's ci result
// only when that run passed on the same files, and runs ci.yml in full in
// every other case. Run with `pnpm test:release`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { decide, isPull, isRun, isJob, listOf, retargetedIn } from './release-reuse.ts'
import type { Deps, Pull, Run, Job } from './release-reuse.ts'

const root = new URL('..', import.meta.url).pathname
const REPO = 'owner/lib'
const SHA = 'a'.repeat(40)
const PARENT = 'b'.repeat(40)
const HEAD = 'c'.repeat(40)

const pull = (over: Partial<Pull> = {}): Pull => ({
  number: 7, merged_at: '2026-11-20T00:00:00Z', merge_commit_sha: SHA, head: { sha: HEAD, ref: 'feat-x', repo: { full_name: REPO } }, ...over,
})
const run = (over: Partial<Run> = {}): Run => ({ id: 1, event: 'pull_request', head_sha: HEAD, head_branch: 'feat-x', conclusion: 'success', created_at: '2026-11-20T00:00:00Z', ...over })
const worktreeJob = (conclusion: string | null): Job => ({ name: 'worktree', steps: [{ name: 'Run pnpm check:worktree', conclusion }] })

function deps(over: Partial<Deps> = {}): Deps {
  return {
    repo: REPO,
    pulls: () => Promise.resolve([pull()]),
    retargeted: () => Promise.resolve(false),
    runs: () => Promise.resolve([run()]),
    jobs: () => Promise.resolve([worktreeJob('success')]),
    tree: (rev) => (rev === SHA || rev === HEAD ? 't1' : undefined),
    parent: () => PARENT,
    isAncestor: (a, b) => a === PARENT && b === HEAD,
    fetchHead: () => true,
    ...over,
  }
}

void test('a squash commit with the same tree as a passed PR head reuses that run', async () => {
  assert.deepEqual(await decide(SHA, deps()), { reuse: true, worktree: true, run: 1, reason: 'ci run 1 of PR #7 passed on the same tree' })
})

void test('a PR run that skipped check:worktree reuses the run but not the worktree check', async () => {
  const d = await decide(SHA, deps({ jobs: () => Promise.resolve([worktreeJob('skipped')]) }))
  assert.equal(d.reuse, true)
  assert.equal(d.worktree, false)
})

void test('a different tree runs ci in full', async () => {
  const d = await decide(SHA, deps({ tree: (rev) => (rev === SHA ? 't1' : 't2') }))
  assert.equal(d.reuse, false)
  assert.match(d.reason, /another tree/)
})

void test('a red or unfinished newest head run runs ci in full, even after an older green run', async () => {
  for (const conclusion of ['failure', 'cancelled', null]) {
    const runs = [run({ id: 1, created_at: '2026-11-20T00:00:00Z' }), run({ id: 2, conclusion, created_at: '2026-11-20T01:00:00Z' })]
    const d = await decide(SHA, deps({ runs: () => Promise.resolve(runs) }))
    assert.equal(d.reuse, false, String(conclusion))
  }
})

void test('a parent that is not an ancestor of the PR head runs ci in full', async () => {
  const d = await decide(SHA, deps({ isAncestor: () => false }))
  assert.equal(d.reuse, false)
  assert.match(d.reason, /not an ancestor/)
})

void test('no PR, two PRs, a fork, another merge commit, no run or a push run all run ci in full', async () => {
  const cases: Partial<Deps>[] = [
    { pulls: () => Promise.resolve([]) },
    { pulls: () => Promise.resolve([pull(), pull({ number: 8 })]) },
    { pulls: () => Promise.resolve([pull({ merge_commit_sha: PARENT })]) },
    { pulls: () => Promise.resolve([pull({ merged_at: null })]) },
    { pulls: () => Promise.resolve([pull({ head: { sha: HEAD, ref: 'feat-x', repo: { full_name: 'other/lib' } } })]) },
    { runs: () => Promise.resolve([]) },
    { runs: () => Promise.resolve([run({ event: 'push' })]) },
    { runs: () => Promise.resolve([run({ head_sha: PARENT })]) },
    { fetchHead: () => false },
  ]
  for (const [i, c] of cases.entries()) assert.equal((await decide(SHA, deps(c))).reuse, false, `case ${String(i)}`)
})

const jobsOf = (path: string): Record<string, Record<string, unknown>> => {
  const doc: unknown = parse(readFileSync(join(root, path), 'utf8'))
  if (typeof doc !== 'object' || doc === null || !('jobs' in doc)) throw new Error(`${path} has no jobs`)
  const jobs: unknown = doc.jobs
  if (typeof jobs !== 'object' || jobs === null) throw new Error(`${path} has no jobs`)
  return Object.fromEntries(Object.entries(jobs).map(([k, v]: [string, unknown]) => [k, typeof v === 'object' && v !== null ? Object.fromEntries(Object.entries(v)) : {}]))
}

void test('release.yml runs ci.yml unless reuse is true, and releases only after a check passed', () => {
  const j = jobsOf('.github/workflows/release.yml')
  const ifOf = (name: string) => { const v = j[name]?.['if']; return typeof v === 'string' ? v : '' }
  assert.match(ifOf('ci'), /!cancelled\(\)/)
  assert.match(ifOf('ci'), /needs\.reuse\.outputs\.reuse != 'true'/)
  assert.equal(j['ci']?.['uses'], './.github/workflows/ci.yml')
  assert.equal(ifOf('worktree'), "needs.reuse.outputs.reuse == 'true' && needs.reuse.outputs.worktree != 'true'")
  assert.deepEqual(j['release']?.['needs'], ['reuse', 'ci', 'worktree'])
  const rel = ifOf('release').replace(/\s+/g, ' ')
  assert.match(rel, /needs\.ci\.result == 'success' \|\|/)
  assert.match(rel, /needs\.reuse\.outputs\.reuse == 'true' && needs\.ci\.result == 'skipped'/)
  assert.match(rel, /needs\.worktree\.result == 'success' \|\| \(needs\.worktree\.result == 'skipped' && needs\.reuse\.outputs\.worktree == 'true'\)/)
  const steps = j['worktree']?.['steps']
  assert.ok(Array.isArray(steps) && steps.some((s: unknown) => typeof s === 'object' && s !== null && 'run' in s && s.run === 'pnpm check:worktree'))
})

void test('the step name that release-reuse.ts reads is the one ci.yml gives check:worktree', () => {
  const steps = jobsOf('.github/workflows/ci.yml')['worktree']?.['steps']
  assert.ok(Array.isArray(steps))
  const step: unknown = steps.find((s: unknown) => typeof s === 'object' && s !== null && 'run' in s && s.run === 'pnpm check:worktree')
  assert.ok(typeof step === 'object' && step !== null && !('name' in step), 'GitHub names it "Run pnpm check:worktree" only when it has no name')
  const script = readFileSync(join(root, 'scripts/release-reuse.ts'), 'utf8')
  assert.match(script, /s\.name === 'Run pnpm check:worktree'/)
})

void test('ci.yml runs check:worktree on every commit (bridge-coord, 2026-11-20)', () => {
  const steps = jobsOf('.github/workflows/ci.yml')['worktree']?.['steps']
  assert.ok(Array.isArray(steps))
  const paths: unknown = steps.find((s: unknown) => typeof s === 'object' && s !== null && 'id' in s && s.id === 'paths')
  assert.ok(typeof paths === 'object' && paths !== null && 'run' in paths)
  assert.equal(String(paths.run).trim(), 'echo "run=true" >> "$GITHUB_OUTPUT"')
})

void test('the API guards accept the shapes the script reads and reject the rest, so a bad reply runs ci in full', () => {
  assert.ok(isPull(pull()))
  assert.ok(isPull(pull({ head: { sha: HEAD, ref: 'feat-x', repo: null } })))
  for (const bad of [null, [], {}, { ...pull(), number: '7' }, { ...pull(), merged_at: 1 }, { ...pull(), merge_commit_sha: undefined }, { ...pull(), head: null }, { ...pull(), head: { sha: 1, ref: 'feat-x', repo: null } }, { ...pull(), head: { sha: HEAD, repo: null } }, { ...pull(), head: { sha: HEAD, ref: 'feat-x', repo: {} } }]) assert.equal(isPull(bad), false, JSON.stringify(bad))
  assert.ok(isRun(run()))
  assert.ok(isRun(run({ conclusion: null })))
  for (const key of ['id', 'event', 'head_sha', 'head_branch', 'conclusion', 'created_at']) assert.equal(isRun({ ...run(), [key]: undefined }), false, key)
  assert.ok(isJob(worktreeJob('success')))
  assert.ok(isJob({ name: 'worktree' }))
  for (const bad of [{ steps: [] }, { name: 'worktree', steps: {} }, { name: 'worktree', steps: [{ name: 1, conclusion: null }] }, { name: 'worktree', steps: [{ name: 'x', conclusion: 1 }] }]) assert.equal(isJob(bad), false, JSON.stringify(bad))
  assert.throws(() => listOf({ jobs: [] }, isJob, 'jobs'), /not a list of jobs/)
  assert.throws(() => listOf([run(), { id: 2 }], isRun, 'runs'), /not a list of runs/)
  assert.deepEqual(listOf([run()], isRun, 'runs'), [run()])
})

void test('a newer green run of another PR with the same head never hides a red run of the merged PR (Codex review of #291)', async () => {
  const other = pull({ number: 8, merged_at: null, merge_commit_sha: null, head: { sha: HEAD, ref: 'feat-y', repo: { full_name: REPO } } })
  // pulls(SHA) finds the merged PR; pulls(HEAD) finds both PRs on that head.
  const pulls = (s: string) => Promise.resolve(s === HEAD ? [pull(), other] : [pull()])
  const runs = () => Promise.resolve([
    run({ id: 1, conclusion: 'failure', created_at: '2026-11-20T00:00:00Z' }),
    run({ id: 2, head_branch: 'feat-y', created_at: '2026-11-20T01:00:00Z' }),
  ])
  const d = await decide(SHA, deps({ pulls, runs }))
  assert.equal(d.reuse, false)
  assert.match(d.reason, /2 PRs have head/)
  // Even with one PR on the head, a run from another branch is not this PR's run.
  const lone = await decide(SHA, deps({ runs }))
  assert.equal(lone.reuse, false)
  assert.match(lone.reason, /newest ci run 1 .* ended failure/)
})

void test('a PR whose base branch changed after it opened runs ci in full', async () => {
  const d = await decide(SHA, deps({ retargeted: () => Promise.resolve(true) }))
  assert.equal(d.reuse, false)
  assert.match(d.reason, /base branch .* changed/)
  assert.equal(retargetedIn([{ event: 'committed' }, { event: 'base_ref_changed' }]), true)
  assert.equal(retargetedIn([{ event: 'committed' }, null, 'x']), false)
})
