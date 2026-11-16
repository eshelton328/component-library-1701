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

const root = join(import.meta.dirname, '..')
const pkg: unknown = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const name = typeof pkg === 'object' && pkg !== null && 'name' in pkg && typeof pkg.name === 'string' ? pkg.name : ''
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

/** Rewrites `../../styled-system/recipes` (and `/index`, `.js`) to `<name>/recipes`. */
export const toPackagePath = (text: string, pkgName: string) =>
  text.replace(/(['"])(?:\.\.?\/)+styled-system\/([\w/-]+?)(?:\/index)?(?:\.(?:d\.)?js)?\1/g, (_, q: string, sub: string) => `${q}${pkgName}/${sub}${q}`)

const rolled = toPackagePath(readFileSync(dts, 'utf8'), name)
if (/styled-system/.test(rolled.replaceAll(name, ''))) throw new Error('dist/components/index.d.ts still imports a styled-system path')
writeFileSync(dts, rolled)
console.log(JSON.stringify({ ok: true, types: 'dist/components/index.d.ts' }))
