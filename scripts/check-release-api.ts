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
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { analyzeCommits } from '@semantic-release/commit-analyzer'
import { diffApi } from './release-lib.ts'

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
// find the names that `Scalar<DialogVariantProps>` allows. Without them,
// every new optional member of such an alias counts as breaking.
const recipes = 'styled-system/recipes'
const recipeTypes = existsSync(recipes)
  ? readdirSync(recipes)
      .filter((f) => f.endsWith('.d.ts'))
      .sort()
      .map((f) => readFileSync(`${recipes}/${f}`, 'utf8'))
      .join('\n')
  : ''
const diff = diffApi(old.status === 0 ? old.stdout : '', readFileSync(report, 'utf8'), `\`\`\`ts\n${recipeTypes}\n\`\`\`\n`)

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
