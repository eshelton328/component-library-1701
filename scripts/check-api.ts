#!/usr/bin/env node
// Builds the declarations of src/index.ts and compares the public API with
// the committed report in api/ (brain decision d-063), and the recipe types
// in styled-system/recipes with api/recipe-types.api.md. It fails when they
// differ; run `pnpm api:update` to write the new report and commit it with
// the change, so the PR shows the API change.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { recipeTypesFile, recipeTypesReport } from './release-lib.ts'

const root = new URL('..', import.meta.url).pathname
const bin = (name: string) => join(root, 'node_modules/.bin', name)
const update = process.argv.includes('--update')
const run = (cmd: string, args: string[]) => spawnSync(bin(cmd), args, { cwd: root, encoding: 'utf8' })

rmSync(join(root, '.api'), { recursive: true, force: true })
mkdirSync(join(root, 'api'), { recursive: true })
const tsc = run('tsc', ['-p', 'tsconfig.api.json'])
if (tsc.status !== 0) {
  console.error(tsc.stdout, tsc.stderr)
  process.exit(1)
}
const ae = run('api-extractor', ['run', ...(update ? ['--local'] : [])])
if (ae.status !== 0) {
  console.error(ae.stdout, ae.stderr)
  console.error('The public API differs from api/component-library-1701.api.md. Run pnpm api:update and commit the report. A removed or changed line is a breaking change: see AGENTS.md, "Releases".')
  process.exit(1)
}
// The recipe types that the API diffs read (see recipeTypesReport).
const recipes = join(root, 'styled-system/recipes')
if (!existsSync(recipes)) {
  console.error('styled-system/recipes is missing. Run pnpm codegen first.')
  process.exit(1)
}
const types = recipeTypesReport(
  readdirSync(recipes)
    .filter((f) => f.endsWith('.d.ts'))
    .map((name) => ({ name, text: readFileSync(join(recipes, name), 'utf8') })),
)
const typesPath = join(root, recipeTypesFile)
if (update) writeFileSync(typesPath, types)
else if (!existsSync(typesPath) || readFileSync(typesPath, 'utf8') !== types) {
  console.error(`${recipeTypesFile} differs from styled-system/recipes. Run pnpm api:update and commit it.`)
  process.exit(1)
}
console.log(JSON.stringify({ ok: true, updated: update }))
