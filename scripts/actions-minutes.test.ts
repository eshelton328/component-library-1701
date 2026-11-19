// Tests for .github/workflows/actions-minutes.yml. Each test runs the
// workflow's counting step with bash, as the runner does, against a fake
// `gh` in a temporary folder, and checks one fix from the PR #203 review:
// a re-run of a recent day is counted, a partial count keeps the alert
// issue open, and the issue is found past the first page of open issues.
// Run with `pnpm test:release`; it needs bash and python3.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parse } from 'yaml'

const root = new URL('..', import.meta.url).pathname
const workflowPath = join(root, '.github/workflows/actions-minutes.yml')
const stepName = 'Count the minutes and update the alert issue'
const repo = 'owner/repo'
const title = 'Actions minutes at the weekly alert level'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// The run script of the counting step, read from the workflow file.
function stepScript(): string {
  const doc: unknown = parse(readFileSync(workflowPath, 'utf8'))
  const jobs = isRecord(doc) ? doc['jobs'] : undefined
  const count = isRecord(jobs) ? jobs['count'] : undefined
  const steps = isRecord(count) ? count['steps'] : undefined
  if (!Array.isArray(steps)) throw new Error('actions-minutes.yml has no jobs.count.steps')
  for (const step of steps) {
    if (isRecord(step) && step['name'] === stepName && typeof step['run'] === 'string') return step['run']
  }
  throw new Error(`actions-minutes.yml has no step "${stepName}" with a run script`)
}

// A fake gh: the runs, jobs and issues API of one repository, from
// data.json, with the issues kept in state.json. A runs query for a day in
// "fail_days" answers HTTP 403.
const fakeGh = `#!/usr/bin/env python3
import json, os, re, sys
from datetime import datetime
D = os.environ["FAKE_DIR"]
data = json.load(open(os.path.join(D, "data.json")))
state = json.load(open(os.path.join(D, "state.json")))
a = sys.argv[1:]
assert a[0] == "api", a
method, path, params, body, i = "GET", None, {}, {}, 1
while i < len(a):
    if a[i] == "-X": method = a[i + 1]; i += 2
    elif a[i] == "-f": k, _, v = a[i + 1].partition("="); params[k] = v; i += 2
    elif a[i] == "--input": body = json.loads(sys.stdin.read() or "{}"); i += 2
    else: path = a[i]; i += 1
m = re.fullmatch(r"/repos/[^/]+/[^/]+/(.*)", path)
rest = m[1]
per, page = int(params.get("per_page", 30)), int(params.get("page", 1))
def ts(s): return datetime.fromisoformat(s.replace("Z", "+00:00"))
def out(v): print(json.dumps(v)); sys.exit(0)
def save(): json.dump(state, open(os.path.join(D, "state.json"), "w"))
if rest == "actions/runs":
    lo, hi = params["created"].split("..")
    if lo[:10] in data.get("fail_days", []):
        sys.stderr.write("gh: API rate limit exceeded (HTTP 403)\\n"); sys.exit(1)
    runs = [r for r in data["runs"] if ts(lo) <= ts(r["created_at"]) <= ts(hi)]
    out({"total_count": len(runs), "workflow_runs": runs[(page - 1) * per:page * per]})
j = re.fullmatch(r"actions/runs/(\\d+)/jobs", rest)
if j:
    jobs = data["jobs"].get(j[1], [])
    out({"total_count": len(jobs), "jobs": jobs[(page - 1) * per:page * per]})
issues = state["issues"]
if rest == "issues" and method == "GET":
    shown = sorted([x for x in issues if x["state"] == params.get("state", "open")], key=lambda x: -x["number"])
    out(shown[(page - 1) * per:page * per])
if rest == "issues" and method == "POST":
    n = max([x["number"] for x in issues] + [0]) + 1
    issues.append({"number": n, "title": body["title"], "body": body["body"], "state": "open", "comments": []})
    save(); out(issues[-1])
k = re.fullmatch(r"issues/(\\d+)(/comments)?", rest)
it = next(x for x in issues if x["number"] == int(k[1]))
if k[2]:
    it["comments"].append(body["body"]); save(); out({})
it.update(body); save(); out(it)
`

interface Job {
  name: string
  status: 'completed'
  conclusion: 'success'
  run_attempt: number
  labels: string[]
  started_at: string
  completed_at: string
}

interface Issue {
  number: number
  title: string
  body: string
  state: 'open' | 'closed'
  comments: string[]
}

interface Data {
  runs: { id: number; name: string; status: 'completed'; created_at: string }[]
  jobs: Record<string, Job[]>
  fail_days: string[]
}

// The UTC day n days before today, as YYYY-MM-DD.
function day(n: number): string {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

function job(on: string, attempt: number, minutes: number): Job {
  const start = new Date(`${on}T10:00:00Z`)
  const end = new Date(start.getTime() + minutes * 60_000)
  const iso = (t: Date) => t.toISOString().replace(/\.\d{3}Z$/, 'Z')
  return { name: 'test', status: 'completed', conclusion: 'success', run_attempt: attempt,
    labels: ['ubuntu-24.04'], started_at: iso(start), completed_at: iso(end) }
}

function openIssue(n: number, issueTitle: string): Issue {
  return { number: n, title: issueTitle, body: '', state: 'open', comments: [] }
}

function sandbox(data: Data, issues: Issue[]) {
  const dir = mkdtempSync(join(tmpdir(), 'actions-minutes-'))
  const bin = join(dir, 'bin')
  mkdirSync(bin)
  writeFileSync(join(bin, 'gh'), fakeGh)
  chmodSync(join(bin, 'gh'), 0o755)
  writeFileSync(join(dir, 'step.sh'), stepScript())
  const write = (d: Data) => { writeFileSync(join(dir, 'data.json'), JSON.stringify(d)) }
  write(data)
  writeFileSync(join(dir, 'state.json'), JSON.stringify({ issues }))
  const run = (): Record<string, unknown> => {
    const p = spawnSync('bash', ['-e', join(dir, 'step.sh')], {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:${process.env['PATH'] ?? ''}`, FAKE_DIR: dir,
        RUNNER_TEMP: dir, GITHUB_REPOSITORY: repo, GH_TOKEN: 'fake' },
    })
    assert.equal(p.status, 0, `the step failed:\n${p.stdout}\n${p.stderr}`)
    const result: unknown = JSON.parse(p.stdout)
    if (!isRecord(result)) throw new Error(`the step printed no JSON object: ${p.stdout}`)
    return result
  }
  const issue = (n: number): Record<string, unknown> => {
    const state: unknown = JSON.parse(readFileSync(join(dir, 'state.json'), 'utf8'))
    const list = isRecord(state) ? state['issues'] : undefined
    const items: unknown[] = Array.isArray(list) ? list : []
    const found = items.find((x) => isRecord(x) && x['number'] === n)
    if (!isRecord(found)) throw new Error(`no issue #${String(n)}`)
    return found
  }
  return { run, write, issue }
}

function dayMinutes(result: Record<string, unknown>, on: string): unknown {
  const repos = result['repos']
  const mine = isRecord(repos) ? repos[repo] : undefined
  const days = isRecord(mine) ? mine['days'] : undefined
  return isRecord(days) ? days[on] : undefined
}

void test('a re-run of a day 2 days back is counted after the ledger saved that day', () => {
  const d = day(2)
  const data: Data = { runs: [{ id: 1, name: 'ci', status: 'completed', created_at: `${d}T10:00:00Z` }],
    jobs: { '1': [job(d, 1, 10)] }, fail_days: [] }
  const box = sandbox(data, [])
  assert.equal(dayMinutes(box.run(), d), 10)
  box.write({ ...data, jobs: { '1': [job(d, 1, 10), job(d, 2, 20)] } })
  assert.equal(dayMinutes(box.run(), d), 30)
})

void test('a partial count below the alert level keeps the alert issue open', () => {
  const data: Data = { runs: [], jobs: {}, fail_days: [day(3)] }
  const box = sandbox(data, [openIssue(1, title)])
  const result = box.run()
  assert.equal(result['partial'], true)
  assert.equal(box.issue(1)['state'], 'open')
  assert.deepEqual(box.issue(1)['comments'], [])
})

void test('the alert issue is found and closed when 100 newer issues are open', () => {
  const issues = [openIssue(1, title)]
  for (let n = 2; n <= 101; n++) issues.push(openIssue(n, `issue ${String(n)}`))
  const box = sandbox({ runs: [], jobs: {}, fail_days: [] }, issues)
  const result = box.run()
  assert.equal(result['partial'], false)
  assert.equal(box.issue(1)['state'], 'closed')
})
