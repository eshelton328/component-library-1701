#!/usr/bin/env node
// Fails when a folder with tracked files has no AGENTS.md, when a CLAUDE.md
// is not the shim "@AGENTS.md", or when a parent AGENTS.md does not link a
// child's AGENTS.md. Dot-folders and folders in .agentsignore are exempt.
// Prints one JSON object; exits 1 on any problem.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean)
const ignore = readFileSync(join(root, '.agentsignore'), 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => l.replace(/\/$/, ''))
const exempt = (d) => d.split('/').some((p) => p.startsWith('.')) || ignore.some((i) => d === i || d.startsWith(`${i}/`))

const dirs = new Set()
for (const f of files) {
  for (let d = dirname(f); d !== '.'; d = dirname(d)) dirs.add(d)
}
const hasOwnFiles = (d) => files.some((f) => dirname(f) === d)
const problems = []
const need = ['.', ...[...dirs].filter((d) => !exempt(d) && (hasOwnFiles(d) || [...dirs].some((c) => dirname(c) === d && !exempt(c))))]
for (const d of need) {
  const agents = join(root, d, 'AGENTS.md')
  if (!existsSync(agents)) { problems.push(`${d}/ has no AGENTS.md`); continue }
  const shim = join(root, d, 'CLAUDE.md')
  if (!existsSync(shim) || readFileSync(shim, 'utf8').trim() !== '@AGENTS.md') problems.push(`${d}/CLAUDE.md must contain only @AGENTS.md`)
  if (d === '.') continue
  let parent = dirname(d)
  while (parent !== '.' && !existsSync(join(root, parent, 'AGENTS.md'))) parent = dirname(parent)
  const link = relative(join(root, parent), agents)
  if (!readFileSync(join(root, parent, 'AGENTS.md'), 'utf8').includes(`](${link})`)) problems.push(`${parent === '.' ? '' : `${parent}/`}AGENTS.md does not link ${link}`)
}
console.log(JSON.stringify({ ok: problems.length === 0, folders: need.length, problems }))
process.exit(problems.length ? 1 : 0)
