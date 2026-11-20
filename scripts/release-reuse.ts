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

export interface Pull { number: number; merged_at: string | null; merge_commit_sha: string | null; head: { sha: string; repo: { full_name: string } | null } }
export interface Run { id: number; event: string; head_sha: string; conclusion: string | null; created_at: string }
export interface Step { name: string; conclusion: string | null }
export interface Job { name: string; steps?: Step[] }
export interface Deps {
  repo: string
  pulls: (sha: string) => Promise<Pull[]>
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
  if (pr === undefined || merged.length !== 1) return no(`${merged.length} merged PRs have ${sha} as their merge commit`)
  if (pr.head.repo?.full_name !== d.repo) return no(`PR #${pr.number} comes from another repository`)
  const head = pr.head.sha
  if (!d.fetchHead(pr.number)) return no(`the head of PR #${pr.number} could not be fetched`)
  const tree = d.tree(sha)
  if (tree === undefined || tree !== d.tree(head)) return no(`PR #${pr.number} head ${head} has another tree`)
  const parent = d.parent(sha)
  if (parent === undefined || !d.isAncestor(parent, head)) return no(`the parent of ${sha} is not an ancestor of PR #${pr.number} head ${head}`)
  const runs = (await d.runs(head)).filter((r) => r.event === 'pull_request' && r.head_sha === head)
  const newest = [...runs].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  if (newest === undefined) return no(`no ci run of PR #${pr.number} head ${head}`)
  if (newest.conclusion !== 'success') return no(`the newest ci run ${newest.id} of PR #${pr.number} ended ${newest.conclusion ?? 'not yet'}`)
  const worktree = (await d.jobs(newest.id)).some((j) => j.name === 'worktree' &&
    (j.steps ?? []).some((s) => s.name === 'Run pnpm check:worktree' && s.conclusion === 'success'))
  return { reuse: true, worktree, run: newest.id, reason: `ci run ${newest.id} of PR #${pr.number} passed on the same tree` }
}

const git = (args: string[]) => spawnSync('git', args, { encoding: 'utf8' })
const out = (args: string[]) => { const r = git(args); return r.status === 0 ? r.stdout.trim() : undefined }

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { authorization: `Bearer ${process.env['GH_TOKEN'] ?? ''}`, accept: 'application/vnd.github+json' },
  })
  if (!res.ok) throw new Error(`GET ${path}: ${res.status}`)
  return await res.json() as T
}

if (import.meta.main) {
  const sha = process.argv[2] ?? ''
  const repo = process.env['GITHUB_REPOSITORY'] ?? ''
  const deps: Deps = {
    repo,
    pulls: (s) => api<Pull[]>(`/repos/${repo}/commits/${s}/pulls`),
    runs: async (h) => (await api<{ workflow_runs: Run[] }>(`/repos/${repo}/actions/workflows/ci.yml/runs?head_sha=${h}&event=pull_request&per_page=100`)).workflow_runs,
    jobs: async (id) => (await api<{ jobs: Job[] }>(`/repos/${repo}/actions/runs/${id}/jobs?per_page=100`)).jobs,
    tree: (rev) => out(['rev-parse', '--verify', '--quiet', `${rev}^{tree}`]),
    parent: (s) => out(['rev-parse', '--verify', '--quiet', `${s}^`]),
    isAncestor: (a, b) => git(['merge-base', '--is-ancestor', a, b]).status === 0,
    fetchHead: (n) => git(['fetch', '--quiet', 'origin', `refs/pull/${n}/head`]).status === 0,
  }
  let d: Decision
  try { d = /^[0-9a-f]{40}$/.test(sha) ? await decide(sha, deps) : no('no commit SHA given') }
  catch (e) { d = no(`a lookup failed: ${e instanceof Error ? e.message : String(e)}`) }
  console.log(`reuse=${String(d.reuse)}\nworktree=${String(d.worktree)}\nrun=${String(d.run ?? '')}\nreason=${d.reason.replace(/\n/g, ' ')}`)
}
