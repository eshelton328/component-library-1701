#!/usr/bin/env node
// Fails when the public API broke since the last release tag and no commit
// in that range tells semantic-release so (brain decision d-063). The PR
// check reads the PR title, but the squash message can be edited at merge:
// `feat!: remove size` merged as `fix: remove size` would ship a breaking
// change as a patch. The release job runs this before semantic-release.
// It asks @semantic-release/commit-analyzer for the release type, so a
// reverted breaking commit does not count. With no release tag there is no
// published API to break, so it passes.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { analyzeCommits } from '@semantic-release/commit-analyzer'
import { diffApi, recipeTypesFile, recipeTypesReport } from './release-lib.ts'

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const report = 'api/component-library-1701.api.md'
const git = (args: string[]) => spawnSync('git', args, { encoding: 'utf8' })

const tag = git(['describe', '--tags', '--abbrev=0', '--match', 'v*'])
if (tag.status !== 0) {
  console.log(JSON.stringify({ ok: true, tag: null, reason: 'no release tag' }))
  process.exit(0)
}
const from = tag.stdout.trim()
const old = git(['show', `${from}:${report}`])
// The report imports the recipe variant types (such as DialogVariantProps)
// from styled-system, so it does not declare them. Panda codegen (the
// `prepare` script) writes them, and the diff reads their declarations to
// find the names that `Scalar<DialogVariantProps>` allows, on both sides:
// a variant that the release had and this change removes still counts.
// Without them, every new optional member of such an alias is breaking.
const recipeTypes = (root: string): string | undefined => {
  const recipes = join(root, 'styled-system/recipes')
  if (!existsSync(recipes)) return undefined
  const files = readdirSync(recipes).filter((f) => f.endsWith('.d.ts'))
  return recipeTypesReport(files.map((name) => ({ name, text: readFileSync(join(recipes, name), 'utf8') })))
}

// The recipe types of the release tag: its committed recipeTypesFile, or
// for a tag from before that file, a temporary worktree of the tag, where
// `pnpm install` runs Panda codegen through `prepare`. Any failure gives
// `undefined`, so the diff stays strict.
const tagRecipeTypes = (ref: string): string | undefined => {
  const committed = git(['show', `${ref}:${recipeTypesFile}`])
  if (committed.status === 0) return committed.stdout
  const parent = mkdtempSync(join(tmpdir(), 'release-api-'))
  const dir = join(parent, 'repo')
  try {
    if (git(['worktree', 'add', '--detach', dir, ref]).status !== 0) return undefined
    const install = spawnSync('pnpm', ['install', '--frozen-lockfile', '--prefer-offline'], { cwd: dir, encoding: 'utf8' })
    if (install.status !== 0) {
      console.error(`pnpm install in a worktree of ${ref} failed, so its recipe types are not known:\n${install.stderr.slice(-2000)}`)
      return undefined
    }
    return recipeTypes(dir)
  } finally {
    git(['worktree', 'remove', '--force', dir])
    rmSync(parent, { recursive: true, force: true })
    git(['worktree', 'prune'])
  }
}

const before = old.status === 0 ? old.stdout : ''
const after = readFileSync(report, 'utf8')
const afterTypes = recipeTypes('.')
// Build the tag's types only when a narrowed member needs them.
const first = diffApi(before, after, { after: afterTypes })
const diff = first.narrowed.length > 0 && afterTypes !== undefined ? diffApi(before, after, { before: tagRecipeTypes(from), after: afterTypes }) : first

const log = git(['log', '--no-merges', '--format=%H%x1f%B%x00', `${from}..HEAD`])
if (log.status !== 0) {
  console.error(log.stderr)
  process.exit(1)
}
const commits = log.stdout
  .split('\0')
  .map((c) => c.replace(/^\n/, ''))
  .filter((c) => c.includes('\x1f'))
  .map((c) => {
    const [hash = '', message = ''] = c.split('\x1f')
    return { hash, message: message.trim() }
  })

// Ask the analyzer that semantic-release runs, with the same config, so
// reverted commits and the preset's rules count as they will at release.
const config: unknown = (await import('../release.config.js')).default
const plugins = isRecord(config) && Array.isArray(config['plugins']) ? config['plugins'] : []
const entry: unknown = plugins.find((p: unknown) => (Array.isArray(p) ? p[0] : p) === '@semantic-release/commit-analyzer')
const pluginConfig: unknown = Array.isArray(entry) ? entry[1] : {}
const quiet = { log: () => undefined, error: () => undefined, warn: () => undefined, success: () => undefined }
const releaseType = await analyzeCommits(pluginConfig, { commits, logger: quiet, cwd: process.cwd(), options: {} })
const marked = releaseType === 'major'
const ok = !diff.breaking || marked
console.log(JSON.stringify({ ok, tag: from, breaking: diff.breaking, releaseType, removed: diff.removed, addedRequired: diff.addedRequired, narrowed: diff.narrowed }))
if (!ok) console.error(`The public API broke since ${from}, but semantic-release would make a ${String(releaseType)} release, not a major one. Push a commit with a BREAKING CHANGE footer that names the migration.`)
process.exit(ok ? 0 : 1)
