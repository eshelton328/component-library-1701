#!/usr/bin/env node
// Fails when the public API broke since the last release tag and no commit
// in that range tells semantic-release so (brain decision d-063). The PR
// check reads the PR title, but the squash message can be edited at merge:
// `feat!: remove size` merged as `fix: remove size` would ship a breaking
// change as a patch. The release job runs this before semantic-release.
// With no release tag there is no published API to break, so it passes.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { diffApi, isBreakingCommit } from './release-lib.ts'

const report = 'api/component-library-1701.api.md'
const git = (args: string[]) => spawnSync('git', args, { encoding: 'utf8' })

const tag = git(['describe', '--tags', '--abbrev=0', '--match', 'v*'])
if (tag.status !== 0) {
  console.log(JSON.stringify({ ok: true, tag: null, reason: 'no release tag' }))
  process.exit(0)
}
const from = tag.stdout.trim()
const old = git(['show', `${from}:${report}`])
const diff = diffApi(old.status === 0 ? old.stdout : '', readFileSync(report, 'utf8'))

const log = git(['log', '--no-merges', '--format=%B%x00', `${from}..HEAD`])
if (log.status !== 0) {
  console.error(log.stderr)
  process.exit(1)
}
const marked = log.stdout.split('\0').some((m) => isBreakingCommit(m.trim()))
const ok = !diff.breaking || marked
console.log(JSON.stringify({ ok, tag: from, breaking: diff.breaking, marked, removed: diff.removed, addedRequired: diff.addedRequired }))
if (!ok) console.error(`The public API broke since ${from}, but no commit has '!' or a BREAKING CHANGE footer, so semantic-release would not make a major version. Push a commit with a BREAKING CHANGE footer that names the migration.`)
process.exit(ok ? 0 : 1)
