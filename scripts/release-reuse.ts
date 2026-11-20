// Decides whether a release run can use the ci result of the merged PR
// instead of running ci.yml again on the same files. A squash merge makes a
// new commit, so no ci run has the release commit's SHA. The PR run counts
// only when it checked exactly the release commit's files:
//   - the commit is the merge commit of one merged PR from this repository;
//   - the PR head has the same tree as the commit, and the commit's parent
//     is an ancestor of the head, so the PR run's merge ref had that tree;
//   - the newest ci run of that head (event pull_request) passed.
// worktree=true when that run's worktree job also ran pnpm check:worktree;
// otherwise release.yml still runs it. Any lookup error gives reuse=false,
// so release.yml runs ci.yml in full, as before.
//   node scripts/release-reuse.ts <sha>   (GH_TOKEN, GITHUB_REPOSITORY)
// It prints reuse=, worktree=, run= and reason= lines for $GITHUB_OUTPUT.
import { spawnSync } from 'node:child_process'

export interface Pull { number: number; merged_at: string | null; merge_commit_sha: string | null; head: { sha: string; ref: string; repo: { full_name: string } | null } }
export interface Run { id: number; event: string; head_sha: string; head_branch: string | null; conclusion: string | null; created_at: string }
export interface Step { name: string; conclusion: string | null }
export interface Job { name: string; steps?: Step[] }
export interface Deps {
  repo: string
  pulls: (sha: string) => Promise<Pull[]>
  // true when the PR's base branch changed after it opened: ci.yml does
  // not run again then, so its last run may have checked another base.
  retargeted: (pr: number) => Promise<boolean>
  runs: (headSha: string) => Promise<Run[]>
  jobs: (runId: number) => Promise<Job[]>
  tree: (rev: string) => string | undefined
  parent: (sha: string) => string | undefined
  isAncestor: (a: string, b: string) => boolean
  fetchHead: (pr: number) => boolean
}
export interface Decision { reuse: boolean; worktree: boolean; run?: number; reason: string }

const no = (reason: string): Decision => ({ reuse: false, worktree: false, reason })

export async function decide(sha: string, d: Deps): Promise<Decision> {
  const merged = (await d.pulls(sha)).filter((p) => p.merged_at !== null && p.merge_commit_sha === sha)
  const pr = merged[0]
  if (pr === undefined || merged.length !== 1) return no(`${String(merged.length)} merged PRs have ${sha} as their merge commit`)
  if (pr.head.repo?.full_name !== d.repo) return no(`PR #${String(pr.number)} comes from another repository`)
  const head = pr.head.sha
  // A run lists no PR once the PR has merged, so a run is matched to this PR
  // by its head SHA and branch. Another PR with the same head could have a
  // newer green run on another base, so a shared head never reuses.
  const sharing = (await d.pulls(head)).filter((p) => p.head.sha === head)
  if (sharing.length !== 1 || sharing[0]?.number !== pr.number) return no(`${String(sharing.length)} PRs have head ${head}`)
  if (await d.retargeted(pr.number)) return no(`the base branch of PR #${String(pr.number)} changed after it opened`)
  if (!d.fetchHead(pr.number)) return no(`the head of PR #${String(pr.number)} could not be fetched`)
  const tree = d.tree(sha)
  if (tree === undefined || tree !== d.tree(head)) return no(`PR #${String(pr.number)} head ${head} has another tree`)
  const parent = d.parent(sha)
  if (parent === undefined || !d.isAncestor(parent, head)) return no(`the parent of ${sha} is not an ancestor of PR #${String(pr.number)} head ${head}`)
  const runs = (await d.runs(head)).filter((r) => r.event === 'pull_request' && r.head_sha === head && r.head_branch === pr.head.ref)
  const newest = [...runs].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  if (newest === undefined) return no(`no ci run of PR #${String(pr.number)} head ${head}`)
  if (newest.conclusion !== 'success') return no(`the newest ci run ${String(newest.id)} of PR #${String(pr.number)} ended ${newest.conclusion ?? 'not yet'}`)
  const worktree = (await d.jobs(newest.id)).some((j) => j.name === 'worktree' &&
    (j.steps ?? []).some((s) => s.name === 'Run pnpm check:worktree' && s.conclusion === 'success'))
  return { reuse: true, worktree, run: newest.id, reason: `ci run ${String(newest.id)} of PR #${String(pr.number)} passed on the same tree` }
}

const git = (args: string[]) => spawnSync('git', args, { encoding: 'utf8' })
const out = (args: string[]) => { const r = git(args); return r.status === 0 ? r.stdout.trim() : undefined }

async function api(path: string): Promise<unknown> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { authorization: `Bearer ${process.env['GH_TOKEN'] ?? ''}`, accept: 'application/vnd.github+json' },
  })
  if (!res.ok) throw new Error(`GET ${path}: ${String(res.status)}`)
  const body: unknown = await res.json()
  return body
}

// Type guards for the GitHub API replies. A reply that does not match
// throws, so the release runs ci.yml in full.
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isNullableString = (v: unknown): v is string | null => v === null || typeof v === 'string'
export function isPull(v: unknown): v is Pull {
  if (!isRecord(v) || typeof v['number'] !== 'number' || !isNullableString(v['merged_at']) || !isNullableString(v['merge_commit_sha'])) return false
  const head = v['head']
  if (!isRecord(head) || typeof head['sha'] !== 'string' || typeof head['ref'] !== 'string') return false
  const repo = head['repo']
  return repo === null || (isRecord(repo) && typeof repo['full_name'] === 'string')
}
export function isRun(v: unknown): v is Run {
  return isRecord(v) && typeof v['id'] === 'number' && typeof v['event'] === 'string' && typeof v['head_sha'] === 'string' &&
    isNullableString(v['head_branch']) &&
    isNullableString(v['conclusion']) && typeof v['created_at'] === 'string'
}
const isStep = (v: unknown): v is Step => isRecord(v) && typeof v['name'] === 'string' && isNullableString(v['conclusion'])
export function isJob(v: unknown): v is Job {
  if (!isRecord(v) || typeof v['name'] !== 'string') return false
  const steps = v['steps']
  return steps === undefined || (Array.isArray(steps) && steps.every(isStep))
}
export function listOf<T>(v: unknown, guard: (x: unknown) => x is T, what: string): T[] {
  if (!Array.isArray(v) || !v.every(guard)) throw new Error(`the reply is not a list of ${what}`)
  return v
}
export const retargetedIn = (events: unknown[]): boolean => events.some((e) => isRecord(e) && e['event'] === 'base_ref_changed')
const field = (v: unknown, key: string): unknown => (isRecord(v) ? v[key] : undefined)

if (import.meta.main) {
  const sha = process.argv[2] ?? ''
  const repo = process.env['GITHUB_REPOSITORY'] ?? ''
  const deps: Deps = {
    repo,
    pulls: async (s) => listOf(await api(`/repos/${repo}/commits/${s}/pulls`), isPull, 'pulls'),
    runs: async (h) => listOf(field(await api(`/repos/${repo}/actions/workflows/ci.yml/runs?head_sha=${h}&event=pull_request&per_page=100`), 'workflow_runs'), isRun, 'runs'),
    retargeted: async (n) => {
      // One page of 100 events; a longer timeline counts as changed.
      const events = await api(`/repos/${repo}/issues/${String(n)}/timeline?per_page=100`)
      return !Array.isArray(events) || events.length >= 100 || retargetedIn(events)
    },
    jobs: async (id) => listOf(field(await api(`/repos/${repo}/actions/runs/${String(id)}/jobs?per_page=100`), 'jobs'), isJob, 'jobs'),
    tree: (rev) => out(['rev-parse', '--verify', '--quiet', `${rev}^{tree}`]),
    parent: (s) => out(['rev-parse', '--verify', '--quiet', `${s}^`]),
    isAncestor: (a, b) => git(['merge-base', '--is-ancestor', a, b]).status === 0,
    fetchHead: (n) => git(['fetch', '--quiet', 'origin', `refs/pull/${String(n)}/head`]).status === 0,
  }
  let d: Decision
  try { d = /^[0-9a-f]{40}$/.test(sha) ? await decide(sha, deps) : no('no commit SHA given') }
  catch (e) { d = no(`a lookup failed: ${e instanceof Error ? e.message : String(e)}`) }
  console.log(`reuse=${String(d.reuse)}\nworktree=${String(d.worktree)}\nrun=${String(d.run ?? '')}\nreason=${d.reason.replace(/\n/g, ' ')}`)
}
