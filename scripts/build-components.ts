// Builds the components for the package (`pnpm build:components`):
// dist/components/*.js from vite.lib.config.ts, and one rolled-up
// dist/components/index.d.ts from API Extractor. In both, an import of
// Panda's styled-system becomes the package's own subpath export, such as
// `@eshelton328/component-library-1701/recipes`, because the relative path
// from src/ is wrong in the package.
import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Extractor, ExtractorConfig } from '@microsoft/api-extractor'
import ts from 'typescript'

const root = join(import.meta.dirname, '..')
const pkg: unknown = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const name = isRecord(pkg) && typeof pkg['name'] === 'string' ? pkg['name'] : ''
if (!name) throw new Error('package.json has no name')

const run = (cmd: string, args: string[]) => {
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8' })
  if (r.status !== 0) {
    console.error(r.stdout, r.stderr)
    process.exit(1)
  }
}
run('pnpm', ['exec', 'vite', 'build', '-c', 'vite.lib.config.ts', '--logLevel', 'warn'])
// A styled-system file in dist/components is a second copy of Panda's
// runtime, which the package already ships as its own subpath exports.
const copied = readdirSync(join(root, 'dist/components'), { recursive: true, encoding: 'utf8' }).filter((f) => f.includes('styled-system'))
if (copied.length) throw new Error(`dist/components holds a copy of styled-system: ${copied.slice(0, 3).join(', ')}`)
run('pnpm', ['exec', 'tsc', '-p', 'tsconfig.api.json'])

const dts = join(root, 'dist/components/index.d.ts')
const base = ExtractorConfig.loadFile(join(root, 'api-extractor.json'))
const config = ExtractorConfig.prepare({
  configObject: { ...base, apiReport: { enabled: false, reportFileName: '<unscopedPackageName>.api.md' }, dtsRollup: { enabled: true, untrimmedFilePath: dts } },
  configObjectFullPath: join(root, 'api-extractor.json'),
  packageJsonFullPath: join(root, 'package.json'),
})
const result = Extractor.invoke(config, { localBuild: true, showVerboseMessages: false })
if (!result.succeeded) process.exit(1)

// Read the import specifiers with TypeScript's scanner, so that a comment
// or an ordinary string that names styled-system is not an import.
const specifiers = (text: string) => ts.preProcessFile(text, true, true).importedFiles.map((f) => f.fileName)

/** `../../styled-system/recipes` (with `/index` or `.js`) becomes `<name>/recipes`; other specifiers stay. */
export const toPackagePath = (spec: string, pkgName: string) => {
  const m = /^(?:\.\.?\/)+styled-system\/([\w/-]+?)(?:\/index)?(?:\.(?:d\.)?js)?$/.exec(spec)
  return m?.[1] === undefined ? spec : `${pkgName}/${m[1]}`
}

// Each import of the built code must be a dependency, a peer, or a subpath
// that the package exports; a relative import must stay inside the build.
const exportKeys = Object.keys(isRecord(pkg) && isRecord(pkg['exports']) ? pkg['exports'] : {})
const deps = Object.keys({ ...(isRecord(pkg) && isRecord(pkg['dependencies']) ? pkg['dependencies'] : {}), ...(isRecord(pkg) && isRecord(pkg['peerDependencies']) ? pkg['peerDependencies'] : {}) })
const exported = (sub: string) => exportKeys.some((k) => k === `./${sub}` || (k.includes('*') && new RegExp(`^${k.replace('.', '\\.').replace('*', '.+')}$`).test(`./${sub}`)))
export const badImport = (spec: string, pkgName: string, rolled: boolean) => {
  if (spec.startsWith('.')) return rolled || spec.includes('styled-system') ? 'a relative path outside the build' : undefined
  if (spec.startsWith(`${pkgName}/`)) return exported(spec.slice(pkgName.length + 1)) ? undefined : 'a subpath the package does not export'
  return deps.some((d) => spec === d || spec.startsWith(`${d}/`)) ? undefined : 'not a dependency or a peer'
}

const problems: string[] = []
const dtsText = readFileSync(dts, 'utf8')
let rolled = dtsText
for (const spec of new Set(specifiers(dtsText))) {
  const to = toPackagePath(spec, name)
  if (to !== spec) rolled = rolled.replaceAll(`'${spec}'`, `'${to}'`).replaceAll(`"${spec}"`, `"${to}"`)
}
writeFileSync(dts, rolled)
const files = readdirSync(join(root, 'dist/components'), { recursive: true, encoding: 'utf8' }).filter((f) => /\.(js|d\.ts)$/.test(f))
for (const f of files) {
  // A React Server Components app must load each module on the client.
  if (f.endsWith('.js') && !readFileSync(join(root, 'dist/components', f), 'utf8').startsWith('"use client";')) problems.push(`dist/components/${f} does not start with "use client"`)
  for (const spec of specifiers(readFileSync(join(root, 'dist/components', f), 'utf8'))) {
    const why = badImport(spec, name, f.endsWith('.d.ts'))
    if (why) problems.push(`dist/components/${f} imports ${spec}: ${why}`)
  }
}
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(JSON.stringify({ ok: true, types: 'dist/components/index.d.ts', modules: files.length }))
