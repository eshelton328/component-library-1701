#!/usr/bin/env node
// Release preflight, run by the release job before semantic-release. It
// reads the package's versions from the registry with the release token,
// and fails on HTTP 401 or 403, before semantic-release pushes a tag. The
// @semantic-release/npm plugin skips its token check for a registry other
// than npmjs.org. Then it checks the last release tag on the branch with
// registryState() in release-lib.ts.
//
// Limit: for a package that does not exist yet, GitHub Packages returns
// 404 for any token, also an invalid one (seen 2026-11-15). So the first
// release cannot be checked for access. If that publish fails, its tag
// stays with no package, and the rerun fails here at registryState.
//   NPM_TOKEN=<token> node scripts/check-release-registry.ts
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { registryState } from './release-lib.ts'

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const fail = (message: string): never => {
  console.log(JSON.stringify({ ok: false, problem: message }))
  process.exit(1)
}

const pkg: unknown = JSON.parse(readFileSync('package.json', 'utf8'))
const name = isRecord(pkg) && typeof pkg['name'] === 'string' ? pkg['name'] : fail('package.json has no name')
const publishConfig = isRecord(pkg) ? pkg['publishConfig'] : undefined
const registry = isRecord(publishConfig) && typeof publishConfig['registry'] === 'string' ? publishConfig['registry'] : fail('package.json has no publishConfig.registry')
const token = process.env['NPM_TOKEN'] ?? fail('NPM_TOKEN is not set')

const git = (args: string[]) => spawnSync('git', args, { encoding: 'utf8' })
const described = git(['describe', '--tags', '--abbrev=0', '--match', 'v*'])
const latestTag = described.status === 0 ? described.stdout.trim() : undefined
const tagAtHead = latestTag !== undefined && git(['tag', '--points-at', 'HEAD']).stdout.split('\n').includes(latestTag)

const url = `${registry.replace(/\/$/, '')}/${name.replace('/', '%2f')}`
const res = await fetch(url, { headers: { authorization: `Bearer ${token}`, accept: 'application/json' } })
if (res.status === 401 || res.status === 403) {
  fail(`The release token cannot read ${name} at ${registry} (HTTP ${String(res.status)}). In the package settings, give this repository write access under "Manage Actions access".`)
}
let versions: string[] = []
if (res.status === 404) {
  // No package yet, or one the token cannot see. registryState fails when
  // the last tag has no package and HEAD is at that tag.
  versions = []
} else if (res.ok) {
  const body: unknown = await res.json()
  const v = isRecord(body) ? body['versions'] : undefined
  versions = isRecord(v) ? Object.keys(v) : fail(`${url} returned no versions object`)
} else {
  fail(`${url} returned HTTP ${String(res.status)}`)
}

const state = registryState({ latestTag, tagAtHead, versions })
console.log(JSON.stringify({ ...state, tag: latestTag ?? null, tagAtHead, versions: versions.length, http: res.status }))
if (state.warning) console.error(`::warning::${state.warning}`)
process.exit(state.ok ? 0 : 1)
