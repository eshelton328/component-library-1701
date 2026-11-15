#!/usr/bin/env node
// PreToolUse hook: blocks edits to tests, baselines and check config, and
// blocks screenshot update flags. See lib.mjs for the file list.
import { readInput, repoPath, guarded, baselines, updateFlags } from './lib.mjs'

const input = readInput()
const tool = input.tool_name
const allow = process.env.LIB_ALLOW_CHECK_EDITS === '1'
let reason = ''

if (tool === 'Bash') {
  const cmd = input.tool_input?.command ?? ''
  if (updateFlags.test(cmd)) {
    reason = 'Screenshot and snapshot baselines change only through the CI workflow Erik starts. Fix the component so the test passes.'
  }
} else {
  const path = repoPath(input.tool_input?.file_path)
  if (baselines.some((re) => re.test(path))) {
    reason = `${path} is a baseline. Baselines change only through the CI workflow Erik starts.`
  } else if (!allow && guarded.some((re) => re.test(path))) {
    reason = `${path} is a test or a check. Never weaken, skip or delete a check to make it pass; fix the code instead. If the task is to change tests or checks, Erik starts the session with LIB_ALLOW_CHECK_EDITS=1.`
  }
}

if (reason) {
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
  }))
}
