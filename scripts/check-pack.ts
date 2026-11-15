#!/usr/bin/env node
// Builds the package as the release job does (pnpm build:lib) and checks
// it: package.json must not change, because `panda lib` syncs its exports
// and the committed exports must match; and the packed file list must hold
// every file that an export points to.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const problems: string[] = []

const pkgPath = join(root, 'package.json')
const before = readFileSync(pkgPath, 'utf8')
execFileSync('pnpm', ['-s', 'build:lib'], { cwd: root, stdio: 'ignore' })
if (readFileSync(pkgPath, 'utf8') !== before) {
  problems.push('pnpm build:lib changed package.json. Commit the exports that panda lib writes.')
}

const packed: unknown = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: root, encoding: 'utf8' }))
const first: unknown = Array.isArray(packed) ? packed[0] : undefined
const entries: unknown = isRecord(first) ? first['files'] : undefined
const files = new Set((Array.isArray(entries) ? entries : []).flatMap((f) => (isRecord(f) && typeof f['path'] === 'string' ? [f['path']] : [])))

const pkg: unknown = JSON.parse(before)
const targets: string[] = []
const collect = (v: unknown) => {
  if (typeof v === 'string') targets.push(v)
  else if (isRecord(v)) Object.values(v).forEach(collect)
}
collect(isRecord(pkg) ? pkg['exports'] : undefined)
for (const t of targets) {
  const path = t.replace(/^\.\//, '')
  const found = path.includes('*') ? [...files].some((f) => new RegExp(`^${path.replace(/[.]/g, '\\.').replace('*', '.+')}$`).test(f)) : files.has(path)
  if (!found) problems.push(`export target ${t} is not in the package`)
}
if (!files.has('dist/panda/lib.json')) problems.push('dist/panda/lib.json is not in the package')
console.log(JSON.stringify({ ok: problems.length === 0, files: files.size, exports: targets.length, problems }))
process.exit(problems.length ? 1 : 0)
