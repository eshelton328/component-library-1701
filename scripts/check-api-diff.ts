#!/usr/bin/env node
// Compares two API reports and prints what was removed, added and newly
// required (brain decision d-063). With --comment <file> it writes a
// Markdown warning for the PR. It fails when the change is breaking and
// the PR title has no `!`, because semantic-release then would not make a
// major version.
//
// The api-report workflow runs this file from the base branch, never from
// the PR, and passes the PR's report as a file. It reads the reports as
// data and runs no code from the PR.
//   node scripts/check-api-diff.ts --before base.api.md --after pr.api.md --title "<title>" [--comment out.md]
//   node scripts/check-api-diff.ts --base origin/main --title "<title>"   (local: the report in the work tree)
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { diffApi, hasBreakingMarker } from './release-lib.ts'

const report = 'api/component-library-1701.api.md'
const { values } = parseArgs({
  options: {
    base: { type: 'string' },
    before: { type: 'string' },
    after: { type: 'string' },
    title: { type: 'string' },
    comment: { type: 'string' },
  },
})
const title = values.title ?? ''

const readBefore = (): string => {
  if (values.before) return readFileSync(values.before, 'utf8')
  const old = spawnSync('git', ['show', `${values.base ?? 'origin/main'}:${report}`], { encoding: 'utf8' })
  return old.status === 0 ? old.stdout : ''
}
const diff = diffApi(readBefore(), readFileSync(values.after ?? report, 'utf8'))
const marked = hasBreakingMarker(title)
const ok = !diff.breaking || marked

if (values.comment) {
  const list = (lines: string[]) => lines.map((l) => `- \`${l}\``).join('\n')
  const parts: string[] = []
  if (diff.removed.length) parts.push(`These items of the public API were removed or changed:\n\n${list(diff.removed)}`)
  if (diff.addedRequired.length) parts.push(`These new members are required, so callers that do not give them fail to compile:\n\n${list(diff.addedRequired)}`)
  const body = diff.breaking
    ? `### ⚠️ Breaking API change\n\n${parts.join('\n\n')}\n\n${marked ? 'The title has `!`, so the release will be a major version.' : 'Add `!` to the PR title (for example `feat!: …`) and a `BREAKING CHANGE:` footer with the migration, or keep the old API and deprecate it first.'}`
    : diff.added.length
      ? `### API additions\n\n${list(diff.added)}`
      : ''
  writeFileSync(values.comment, body)
}
console.log(JSON.stringify({ ok, breaking: diff.breaking, marked, removed: diff.removed, added: diff.added, addedRequired: diff.addedRequired }))
process.exit(ok ? 0 : 1)
