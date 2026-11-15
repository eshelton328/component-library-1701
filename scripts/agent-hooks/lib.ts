// Shared helpers for the Claude Code hooks in this folder.
import { readFileSync } from 'node:fs'
import { relative } from 'node:path'

export const root = process.env.CLAUDE_PROJECT_DIR ?? new URL('../..', import.meta.url).pathname

// The fields of a Claude Code hook input that these hooks read.
export type HookInput = {
  tool_name?: string
  tool_input?: { command?: string; file_path?: string }
  stop_hook_active?: boolean
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const text = (v: unknown) => (typeof v === 'string' ? v : undefined)

// Hook input is JSON from Claude Code, so parse it before use.
export function parseInput(raw: string): HookInput {
  const data: unknown = JSON.parse(raw || '{}')
  if (!isRecord(data)) return {}
  const input: HookInput = {}
  const name = text(data['tool_name'])
  if (name !== undefined) input.tool_name = name
  const tool = data['tool_input']
  if (isRecord(tool)) {
    input.tool_input = {}
    const command = text(tool['command'])
    const file = text(tool['file_path'])
    if (command !== undefined) input.tool_input.command = command
    if (file !== undefined) input.tool_input.file_path = file
  }
  if (data['stop_hook_active'] === true) input.stop_hook_active = true
  return input
}

export function readInput(): HookInput {
  return parseInput(readFileSync(0, 'utf8'))
}

export function repoPath(file: string | undefined) {
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
  /^scripts\/check-[\w-]+\.ts$/,
  /^\.claude\//,
  /^\.github\//,
  /^eslint\.[\w.]+\.js$|^eslint\.config\.js$/,
  /^panda\.config\.ts$/,
  /^tsconfig\.json$/,
  /^vitest\.config\.ts$/,
  /^tokens\/(build\.ts|test\.ts|contrast\.json|resolver\.json)$/,
  /^tokens\/generated\//,
]

// Baselines change only through the CI workflow Erik starts, in any session.
export const baselines = [/(^|\/)__screenshots__\//, /-snapshots\//]

export const updateFlags = /(vitest|playwright|test)\b[^|;&]*\s(-u|--update|--update-snapshots)\b/
