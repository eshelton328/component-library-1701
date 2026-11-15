#!/usr/bin/env node
// Compares the API report on a PR with the base branch and prints what was
// removed and added (brain decision d-063). With --comment <file> it writes
// a Markdown warning for the PR. It fails when a line was removed or
// changed and the PR title has no `!`, because semantic-release then would
// not make a major version.
//   node scripts/check-api-diff.ts --base origin/main --title "<title>" [--comment out.md]
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { diffApi, hasBreakingMarker } from './release-lib.ts'

const report = 'api/component-library-1701.api.md'
const { values } = parseArgs({ options: { base: { type: 'string' }, title: { type: 'string' }, comment: { type: 'string' } } })
const base = values.base ?? 'origin/main'
const title = values.title ?? ''

const old = spawnSync('git', ['show', `${base}:${report}`], { encoding: 'utf8' })
const diff = diffApi(old.status === 0 ? old.stdout : '', readFileSync(report, 'utf8'))
const marked = hasBreakingMarker(title)
const ok = !diff.breaking || marked

if (values.comment) {
  const list = (lines: string[]) => lines.map((l) => `- \`${l}\``).join('\n')
  const body = diff.breaking
    ? `### ⚠️ Breaking API change\n\nThese lines of the public API were removed or changed:\n\n${list(diff.removed)}\n\n${marked ? 'The title has `!`, so the release will be a major version.' : 'Add `!` to the PR title (for example `feat!: …`) and a `BREAKING CHANGE:` footer with the migration, or keep the old API and deprecate it first.'}`
    : diff.added.length
      ? `### API additions\n\n${list(diff.added)}`
      : ''
  writeFileSync(values.comment, body)
}
console.log(JSON.stringify({ ok, breaking: diff.breaking, marked, removed: diff.removed, added: diff.added }))
process.exit(ok ? 0 : 1)
