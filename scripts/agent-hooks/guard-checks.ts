#!/usr/bin/env node
// PreToolUse hook: blocks edits to tests, baselines and check config, and
// blocks screenshot update flags. See lib.ts for the file list.
import { readInput, repoPath, guarded, baselines, updateFlags, linksModules } from './lib.ts'

const input = readInput()
const tool = input.tool_name
const allow = process.env.LIB_ALLOW_CHECK_EDITS === '1'
let reason = ''

if (tool === 'Bash') {
  const cmd = input.tool_input?.command ?? ''
  if (updateFlags.test(cmd)) {
    reason = 'Screenshot and snapshot baselines change only through the CI workflow the owner starts. Fix the component so the test passes.'
  } else if (linksModules(cmd)) {
    reason = 'Do not link node_modules from another checkout: Vite will not serve files outside the repository, so the story tests load nothing. In a git worktree, run pnpm install there; the pnpm store makes it fast.'
  }
} else {
  const path = repoPath(input.tool_input?.file_path)
  if (baselines.some((re) => re.test(path))) {
    reason = `${path} is a baseline. Baselines change only through the CI workflow the owner starts.`
  } else if (!allow && guarded.some((re) => re.test(path))) {
    reason = `${path} is a test or a check. Never weaken, skip or delete a check to make it pass; fix the code instead. If the task is to change tests or checks, the owner starts the session with LIB_ALLOW_CHECK_EDITS=1.`
  }
}

if (reason) {
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
  }))
}
