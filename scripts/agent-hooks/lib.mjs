// Shared helpers for the Claude Code hooks in this folder.
import { readFileSync } from 'node:fs'
import { relative } from 'node:path'

export const root = process.env.CLAUDE_PROJECT_DIR ?? new URL('../..', import.meta.url).pathname

export function readInput() {
  return JSON.parse(readFileSync(0, 'utf8') || '{}')
}

export function repoPath(file) {
  return file ? relative(root, file) : ''
}

// Files that hold tests, baselines or the checks themselves. Changing one
// can make a failing check pass, so agents may change them only in a
// session started with LIB_ALLOW_CHECK_EDITS=1.
export const guarded = [
  /(^|\/)__screenshots__\//,
  /-snapshots\//,
  /\.(test|spec)\.[cm]?[jt]sx?$/,
  /^checks\//,
  /^scripts\/agent-hooks\//,
  /^\.claude\//,
  /^\.github\//,
  /^eslint\.[\w.]+\.js$|^eslint\.config\.js$/,
  /^panda\.config\.ts$/,
  /^tsconfig\.json$/,
  /^vitest\.config\.ts$/,
  /^tokens\/(build\.mjs|test\.mjs|contrast\.json|resolver\.json)$/,
  /^tokens\/generated\//,
]

// Baselines change only through the CI workflow Erik starts, in any session.
export const baselines = [/(^|\/)__screenshots__\//, /-snapshots\//]

export const updateFlags = /(vitest|playwright|test)\b[^|;&]*\s(-u|--update|--update-snapshots)\b/
