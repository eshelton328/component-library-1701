#!/usr/bin/env node
// Builds the package as the release job does (pnpm build:lib) and checks
// it: package.json must not change, because `panda lib` syncs its exports
// and the committed exports must match; the packed file list must hold
// every file that an export points to; a wildcard export must pack a
// types file for each runtime file and the reverse; the Panda manifest's
// preset and build info must be packed; and every packed runtime entry
// must import under plain Node ESM, as a consumer without a bundler
// loads it.
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join, posix } from 'node:path'

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
// Each export with its conditions: { types?, default? } or a bare string.
const exportsField: unknown = isRecord(pkg) ? pkg['exports'] : undefined
collect(exportsField)
const toRegex = (pattern: string) => new RegExp(`^${pattern.replace(/[.]/g, '\\.').replace('*', '(.+)')}$`)
const strip = (t: string) => t.replace(/^\.\//, '')
for (const t of targets) {
  const path = strip(t)
  const found = path.includes('*') ? [...files].some((f) => toRegex(path).test(f)) : files.has(path)
  if (!found) problems.push(`export target ${t} is not in the package`)
}

// A wildcard export with both conditions: every runtime file needs its
// types file, and every types file its runtime file. Panda writes these
// internal helpers with no types file; only its own files import them:
// the patterns and, since the first config recipe, each recipe file.
const internalRuntime = new Set(['styled-system/patterns/runtime.js', 'styled-system/recipes/runtime.js'])
const isRuntime = /\.[cm]?js$/
const runtime: string[] = []
for (const value of Object.values(isRecord(exportsField) ? exportsField : {})) {
  const types = isRecord(value) && typeof value['types'] === 'string' ? strip(value['types']) : undefined
  const def = isRecord(value) && typeof value['default'] === 'string' ? strip(value['default']) : typeof value === 'string' ? strip(value) : undefined
  // Expand the target to files first, so `./dist/panda/*` gives its .mjs.
  if (def) runtime.push(...(def.includes('*') ? [...files].filter((f) => toRegex(def).test(f)) : [def]).filter((f) => isRuntime.test(f)))
  if (!types || !def || !types.includes('*') || !def.includes('*')) continue
  const stems = (pattern: string) => new Set([...files].flatMap((f) => toRegex(pattern).exec(f)?.[1] ?? []))
  const typeStems = stems(types)
  const defStems = stems(def)
  for (const s of defStems) if (!typeStems.has(s) && !internalRuntime.has(def.replace('*', s))) problems.push(`${types.replace('*', s)} is not packed, but ${def.replace('*', s)} is`)
  for (const s of typeStems) if (!defStems.has(s)) problems.push(`${def.replace('*', s)} is not packed, but ${types.replace('*', s)} is`)
}

// The Panda manifest names its preset and build info relative to itself.
const manifestPath = 'dist/panda/lib.json'
if (!files.has(manifestPath)) problems.push(`${manifestPath} is not in the package`)
else {
  const manifest: unknown = JSON.parse(readFileSync(join(root, manifestPath), 'utf8'))
  for (const key of ['preset', 'buildInfo']) {
    const ref = isRecord(manifest) ? manifest[key] : undefined
    if (typeof ref !== 'string') problems.push(`${manifestPath} has no ${key}`)
    else if (!files.has(posix.join(posix.dirname(manifestPath), ref))) problems.push(`${manifestPath} names ${ref} as ${key}, but it is not packed`)
    // A consumer's panda.config.ts loads the preset, so it must import too.
    else if (key === 'preset') runtime.push(posix.join(posix.dirname(manifestPath), ref))
  }
}

// Import every runtime entry from the real tarball, unpacked inside the
// repository so that peer dependencies such as react resolve from
// node_modules. A bundler hides an extensionless import; Node does not.
const smoke = mkdtempSync(join(root, '.pack-smoke-'))
try {
  const tgz = execFileSync('npm', ['pack', '--ignore-scripts', '--pack-destination', smoke, '--silent'], { cwd: root, encoding: 'utf8' }).trim().split('\n').pop() ?? ''
  execFileSync('tar', ['-xzf', join(smoke, tgz), '-C', smoke])
  const pkgDir = join(smoke, 'package') + '/'
  const failed: string[] = []
  for (const entry of new Set(runtime)) {
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(pkgDir + entry)})`], { encoding: 'utf8' })
    if (r.status !== 0) failed.push(`${entry} does not import under Node: ${(r.stderr.match(/\w*Error[^\n]*/) ?? [r.stderr.trim()])[0].split(pkgDir).join('')}`)
  }
  // One missing file breaks every entry that imports it; show the first few.
  problems.push(...failed.slice(0, 5))
  if (failed.length > 5) problems.push(`${String(failed.length - 5)} more entries do not import under Node`)
} finally {
  rmSync(smoke, { recursive: true, force: true })
}
console.log(JSON.stringify({ ok: problems.length === 0, files: files.size, exports: targets.length, imported: new Set(runtime).size, problems }))
process.exit(problems.length ? 1 : 0)
