#!/usr/bin/env node
// The repository side of the Figma token sync (brain decision d-070).
//   node tokens/figma/sync.ts render [--out <dir>]
//     Writes <dir>/figma-tokens.json and <dir>/scripts/*.js, the use_figma
//     scripts in the order they must run. The default <dir> is .figma-sync/.
//   node tokens/figma/sync.ts compare <fingerprint.json> [--out <dir>]
//     Compares the reply of fingerprint.js with <dir>/figma-tokens.json.
//     Exit 0 when every variable and text style matches.
// The Figma side runs in the agent or skill that holds the Figma MCP
// server; this script never calls Figma.
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { compareHashes, expectedHashes, exportTokens, renderScripts } from './lib.ts'
import type { FigmaTokens } from './lib.ts'

const root = new URL('../..', import.meta.url).pathname
const tokens = join(root, 'tokens')
const args = process.argv.slice(2)
const [command] = args
const outArg = args.includes('--out') ? args[args.indexOf('--out') + 1] : undefined
const out = outArg ?? join(root, '.figma-sync')
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'))
const jsonIn = (dir: string) => readdirSync(join(tokens, dir)).filter((f) => f.endsWith('.json')).sort().map((f) => join(tokens, dir, f))

// The export of the tokens as they are now in the repository.
function currentDoc(): FigmaTokens {
  const sources = [...jsonIn('.'), ...jsonIn('modes'), ...jsonIn('themes')].sort()
  const hash = createHash('sha256')
  for (const s of sources) hash.update(readFileSync(s))
  const commit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim()
  const themes = jsonIn('themes').map((f) => ({ name: f.split('/').pop()?.replace(/\.json$/, '') ?? '', json: readJson(f) }))
  return exportTokens({ themes, layout: readJson(join(tokens, 'layout.json')), commit, tokensSha256: hash.digest('hex') })
}

if (command === 'render') {
  const doc = currentDoc()
  const commit = doc.source.commit
  mkdirSync(join(out, 'scripts'), { recursive: true })
  writeFileSync(join(out, 'figma-tokens.json'), JSON.stringify(doc, null, 1))
  const scripts = renderScripts(doc)
  for (const s of scripts) writeFileSync(join(out, 'scripts', s.file), s.code)
  const counts = Object.fromEntries(doc.collections.map((c) => [c.name, c.variables.length]))
  console.log(JSON.stringify({ ok: true, commit: commit.slice(0, 7), out, counts, textStyles: doc.textStyles.length, scripts: scripts.map((s) => ({ file: s.file, bytes: s.code.length })) }))
} else if (command === 'compare') {
  const fingerprint = args[1]
  if (!fingerprint || fingerprint.startsWith('--')) {
    console.error('usage: node tokens/figma/sync.ts compare <fingerprint.json> [--out <dir>]')
    process.exit(2)
  }
  const got = readJson(fingerprint)
  if (!isRecord(got)) {
    console.error(`${fingerprint} is not the object fingerprint.js returns`)
    process.exit(2)
  }
  // Compare with the tokens as they are now, and fail when they changed
  // after the render, because Figma then holds the rendered ones.
  const doc = currentDoc()
  const rendered = readJson(join(out, 'figma-tokens.json'))
  const renderedSha = isRecord(rendered) && isRecord(rendered['source']) ? rendered['source']['tokensSha256'] : undefined
  if (renderedSha !== doc.source.tokensSha256) {
    console.error(`The tokens changed after ${join(out, 'figma-tokens.json')} was rendered. Render and send the scripts again.`)
    process.exit(2)
  }
  const expected = expectedHashes(doc)
  const problems = compareHashes(expected, got)
  console.log(JSON.stringify({ ok: problems.length === 0, source: doc.source.commit.slice(0, 7), checked: Object.keys(expected).length, problems }, null, 1))
  process.exit(problems.length ? 1 : 0)
} else {
  console.error('usage: node tokens/figma/sync.ts render|compare ...')
  process.exit(2)
}
