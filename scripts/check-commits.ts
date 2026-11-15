#!/usr/bin/env node
// Fails when a commit since the last release tag has a header that is not
// a Conventional Commits header. The release job runs it before
// semantic-release, because a PR title check cannot catch an edited squash
// message (toolkit rule releases.md). Merge commits are skipped.
import { spawnSync } from 'node:child_process'
import { isConventionalHeader } from './release-lib.ts'

const git = (args: string[]) => spawnSync('git', args, { encoding: 'utf8' })
const tag = git(['describe', '--tags', '--abbrev=0', '--match', 'v*'])
const range = tag.status === 0 ? `${tag.stdout.trim()}..HEAD` : 'HEAD'
const log = git(['log', '--no-merges', '--format=%h %s', range])
if (log.status !== 0) {
  console.error(log.stderr)
  process.exit(1)
}
const bad = log.stdout
  .split('\n')
  .filter(Boolean)
  .filter((line) => !isConventionalHeader(line.slice(line.indexOf(' ') + 1)))
console.log(JSON.stringify({ ok: bad.length === 0, range, bad }))
process.exit(bad.length ? 1 : 0)
