// Tests for .github/workflows/actions-minutes.yml. Each test runs the
// workflow's counting step with bash, as the runner does, against a fake
// `gh` in a temporary folder, and checks one fix from the PR #203 review:
// a re-run of a recent day is counted, a partial count keeps the alert
// issue open, and the issue is found past the first page of open issues.
// Later tests check that a day over the per-run call limit is finished by
// the next run from the ledger, and the three fixes from the PR #215
// review: a re-run is counted until a day is final, a recent day not
// counted again is missing, and a workflow name with " / " stays whole.
// The workflow now counts the month to date in USD, so the tests pass it a
// fixed --today and use its monthly issue title, and a fake curl answers
// its GitHub Packages storage count. The last tests check the three fixes
// from the Codex review of the-bridge #262 (brain dc3ae99): ubuntu-N-arm
// and macos-N-intel runners get their own prices, a registry error at an
// alert level is written into the issue, and a failed alert comment is
// sent again by the next run.
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
const title = 'Actions spend at a monthly alert level'
// The workflow counts the month to date, so the tests run it on a fixed
// day in the middle of a month: on the 1st to the 3rd, day(3) would fall in
// the month before and no test would count it.
const today = '2026-11-19'

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
// "fail_days" answers HTTP 403, and with FAKE_FAIL_COMMENT set an issue
// comment answers HTTP 422.
// A fake curl for the GitHub Packages registry: one package version of
// 1,000 bytes, so the storage count never calls the real registry.
// With FAKE_CURL_FAIL set, it fails as curl -f does on an HTTP error.
const fakeCurl = `#!/usr/bin/env bash
if [ -n "$FAKE_CURL_FAIL" ]; then exit 22; fi
for a in "$@"; do
  if [ "$a" = -D ]; then printf 'HTTP/2 206\\r\\ncontent-range: bytes 0-0/1000\\r\\n\\r\\n'; exit 0; fi
done
echo '{"versions": {"1.0.0-beta.1": {"dist": {"tarball": "https://npm.pkg.github.com/x.tgz"}}}}'
`

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
    if os.environ.get("FAKE_FAIL_COMMENT"):
        sys.stderr.write("gh: Validation Failed (HTTP 422)\\n"); sys.exit(1)
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
  runs: { id: number; name: string; status: 'completed'; created_at: string; run_attempt?: number }[]
  jobs: Record<string, Job[]>
  fail_days: string[]
}

// The UTC day n days before the fixed today, as YYYY-MM-DD.
function day(n: number): string {
  const d = new Date(`${today}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

function job(on: string, attempt: number, minutes: number, labels: string[] = ['ubuntu-24.04']): Job {
  const start = new Date(`${on}T10:00:00Z`)
  const end = new Date(start.getTime() + minutes * 60_000)
  const iso = (t: Date) => t.toISOString().replace(/\.\d{3}Z$/, 'Z')
  return { name: 'test', status: 'completed', conclusion: 'success', run_attempt: attempt,
    labels, started_at: iso(start), completed_at: iso(end) }
}

function openIssue(n: number, issueTitle: string): Issue {
  return { number: n, title: issueTitle, body: '', state: 'open', comments: [] }
}

function sandbox(data: Data, issues: Issue[]) {
  const dir = mkdtempSync(join(tmpdir(), 'actions-minutes-'))
  const bin = join(dir, 'bin')
  mkdirSync(bin)
  writeFileSync(join(bin, 'gh'), fakeGh)
  writeFileSync(join(bin, 'curl'), fakeCurl)
  chmodSync(join(bin, 'curl'), 0o755)
  chmodSync(join(bin, 'gh'), 0o755)
  const script = stepScript()
  if (!script.includes(' --month-to-date ')) throw new Error('the counting step does not pass --month-to-date')
  // --today goes right after the command, not after the first " --month-to-date ":
  // the script that the step embeds has that text in its usage too, so on
  // 2026-11-20 --today went there and every test counted to the real date.
  const command = 'python3 "$RUNNER_TEMP/minutes" '
  if (script.split(command).length !== 2) throw new Error('the counting step does not run "$RUNNER_TEMP/minutes" once')
  writeFileSync(join(dir, 'step.sh'), script.replace(command, `${command}--today ${today} `))
  const write = (d: Data) => { writeFileSync(join(dir, 'data.json'), JSON.stringify(d)) }
  write(data)
  writeFileSync(join(dir, 'state.json'), JSON.stringify({ issues }))
  // env adds variables for the fake gh and curl; status is the exit code
  // the step must give.
  const run = (env: Record<string, string> = {}, status = 0): Record<string, unknown> => {
    const p = spawnSync('bash', ['-e', join(dir, 'step.sh')], {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:${process.env['PATH'] ?? ''}`, FAKE_DIR: dir,
        RUNNER_TEMP: dir, GITHUB_REPOSITORY: repo, GH_TOKEN: 'fake', ...env },
    })
    assert.equal(p.status, status, `the step failed:\n${p.stdout}\n${p.stderr}`)
    const result: unknown = JSON.parse(p.stdout)
    if (!isRecord(result)) throw new Error(`the step printed no JSON object: ${p.stdout}`)
    // today is a past day, so the real clock is always later: a run that
    // ignores --today counts past it and fails here.
    const days = result['days']
    assert.ok(Array.isArray(days) && days.at(-1) === today,
      `the step counted to ${String(Array.isArray(days) ? days.at(-1) : days)}, not to --today ${today}`)
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
  const ledger = join(dir, 'actions-minutes-ledger.json')
  return { run, write, issue, ledger }
}

function dayMinutes(result: Record<string, unknown>, on: string): unknown {
  const repos = result['repos']
  const mine = isRecord(repos) ? repos[repo] : undefined
  const days = isRecord(mine) ? mine['days'] : undefined
  return isRecord(days) ? days[on] : undefined
}

void test('the counting step counts to --today, not to the real date', () => {
  // The real clock is days past today here; the result must not follow it.
  assert.ok(new Date().toISOString().slice(0, 10) > today, 'pick a fixed today in the past')
  const result = sandbox({ runs: [], jobs: {}, fail_days: [] }, []).run()
  assert.equal(String(result['now']).slice(0, 10), today)
})

void test('a re-run of a day 2 days back is counted after the ledger saved that day', () => {
  const d = day(2)
  const data: Data = { runs: [{ id: 1, name: 'ci', status: 'completed', created_at: `${d}T10:00:00Z` }],
    jobs: { '1': [job(d, 1, 10)] }, fail_days: [] }
  const box = sandbox(data, [])
  assert.equal(dayMinutes(box.run(), d), 10)
  box.write({ ...data, jobs: { '1': [job(d, 1, 10), job(d, 2, 20)] } })
  assert.equal(dayMinutes(box.run(), d), 30)
})

void test('a day over the per-run call limit is finished by the next run from the ledger', () => {
  // 900 runs need about 909 calls, more than the step's --max-calls 800.
  const d = day(3)
  const runs: Data['runs'] = []
  const jobs: Data['jobs'] = {}
  for (let id = 1; id <= 900; id++) {
    runs.push({ id, name: 'ci', status: 'completed', created_at: `${d}T10:00:00Z` })
    jobs[String(id)] = [job(d, 1, 1)]
  }
  const box = sandbox({ runs, jobs, fail_days: [] }, [])
  const first = box.run()
  assert.equal(first['partial'], true)
  const second = box.run()
  assert.equal(second['partial'], false)
  assert.equal(dayMinutes(second, d), 900)
})

void test('a re-run made after a day was counted at 2 days old is counted the next day', () => {
  // The first run counts the run on day(2); the ledger is then moved one
  // day back, as if a day had passed, and the run gets a second attempt.
  const d2 = day(2)
  const d3 = day(3)
  const box = sandbox({ runs: [{ id: 1, name: 'ci', status: 'completed', created_at: `${d2}T10:00:00Z`, run_attempt: 1 }],
    jobs: { '1': [job(d2, 1, 10)] }, fail_days: [] }, [])
  assert.equal(dayMinutes(box.run(), d2), 10)
  const saved: unknown = JSON.parse(readFileSync(box.ledger, 'utf8'))
  const days = isRecord(saved) ? saved['days'] : undefined
  const mine = isRecord(days) ? days[repo] : undefined
  if (!isRecord(mine)) throw new Error('the ledger has no days for the repository')
  mine[d3] = mine[d2]
  Reflect.deleteProperty(mine, d2)
  writeFileSync(box.ledger, JSON.stringify(saved))
  box.write({ runs: [{ id: 1, name: 'ci', status: 'completed', created_at: `${d3}T10:00:00Z`, run_attempt: 2 }],
    jobs: { '1': [job(d3, 1, 10), job(d3, 2, 20)] }, fail_days: [] })
  assert.equal(dayMinutes(box.run(), d3), 30)
})

void test('a recent day kept in the ledger but not counted again is missing, and the issue stays open', () => {
  const d1 = day(1)
  const data: Data = { runs: [{ id: 1, name: 'ci', status: 'completed', created_at: `${d1}T10:00:00Z`, run_attempt: 1 }],
    jobs: { '1': [job(d1, 1, 10)] }, fail_days: [] }
  const first = sandbox(data, [])
  assert.equal(first.run()['partial'], false)
  // The next run starts from that ledger with the alert issue open, and
  // the runs query for day(1) fails.
  const next = sandbox({ ...data, fail_days: [d1] }, [openIssue(1, title)])
  writeFileSync(next.ledger, readFileSync(first.ledger, 'utf8'))
  assert.equal(next.run()['partial'], true)
  assert.equal(next.issue(1)['state'], 'open')
})

void test('a workflow name with " / " in it stays one workflow', () => {
  const d = day(3)
  const box = sandbox({ runs: [{ id: 1, name: 'deploy / prod', status: 'completed', created_at: `${d}T10:00:00Z`, run_attempt: 1 }],
    jobs: { '1': [job(d, 1, 10)] }, fail_days: [] }, [])
  const result = box.run()
  const repos = result['repos']
  const mine = isRecord(repos) ? repos[repo] : undefined
  const byWorkflow = isRecord(mine) ? mine['by_workflow'] : undefined
  assert.ok(isRecord(byWorkflow) && 'deploy / prod' in byWorkflow, JSON.stringify(byWorkflow))
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

// The runs of one day, each with one job of the given minutes and runner label.
function spend(on: string, jobs: [number, string][]): Data {
  const runs: Data['runs'] = []
  const byRun: Data['jobs'] = {}
  jobs.forEach(([minutes, label], i) => {
    runs.push({ id: i + 1, name: 'ci', status: 'completed', created_at: `${on}T10:00:00Z`, run_attempt: 1 })
    byRun[String(i + 1)] = [job(on, 1, minutes, [label])]
  })
  return { runs, jobs: byRun, fail_days: [] }
}

function issueAction(result: Record<string, unknown>): unknown {
  const issue = result['issue']
  return isRecord(issue) ? issue['action'] : undefined
}

void test('ubuntu-N-arm runners cost the Linux arm64 price and macos-N-intel runners the macOS price', () => {
  // 1,000 arm minutes at $0.005 and 100 Intel macOS minutes at $0.062: $11.20.
  // The x64 Linux price for both gave $6.60 and left macos-15-intel unpriced.
  const d = day(3)
  const result = sandbox(spend(d, [[1000, 'ubuntu-24.04-arm'], [100, 'macos-15-intel']]), []).run()
  const repos = result['repos']
  const mine = isRecord(repos) ? repos[repo] : undefined
  const usdDays = isRecord(mine) ? mine['usd_days'] : undefined
  assert.equal(isRecord(usdDays) ? usdDays[d] : undefined, 11.2)
  assert.deepEqual(isRecord(mine) ? mine['unpriced'] : undefined, [])
})

void test('a registry error at an alert level opens the issue and writes the error into it', () => {
  // $72 is over 50 % of this repository's part of the budget, $140.40.
  const box = sandbox(spend(day(3), [[12000, 'ubuntu-24.04']]), [])
  const result = box.run({ FAKE_CURL_FAIL: '1' })
  assert.equal(issueAction(result), 'opened')
  const body = box.issue(1)['body']
  assert.ok(typeof body === 'string' && body.includes('was not counted'), String(body))
})

void test('an alert comment that failed is sent again by the next run', () => {
  // $120 is over 80 % of $140.40; the open issue recorded the 50 % level.
  const box = sandbox(spend(day(3), [[20000, 'ubuntu-24.04']]),
    [{ ...openIssue(1, title), body: '<!-- actions-minutes level=50 -->' }])
  box.run({ FAKE_FAIL_COMMENT: '1' }, 3)
  assert.deepEqual(box.issue(1)['comments'], [])
  assert.equal(box.issue(1)['body'], '<!-- actions-minutes level=50 -->')
  const result = box.run()
  assert.equal(issueAction(result), 'raised')
  const comments = box.issue(1)['comments']
  assert.ok(Array.isArray(comments) && comments.length === 1, JSON.stringify(comments))
  const body = box.issue(1)['body']
  assert.ok(typeof body === 'string' && body.includes('level=80'), String(body))
})
