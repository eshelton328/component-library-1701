#!/usr/bin/env node
// PostToolUse hook: runs ESLint on the file an agent just edited and returns
// the errors, so the agent fixes them in the next step.
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { readInput, repoPath, root } from './lib.ts'

const path = repoPath(readInput().tool_input?.file_path)
if (/^(src|\.storybook)\/.*\.(ts|tsx)$/.test(path)) {
  const r = spawnSync(join(root, 'node_modules/.bin/eslint'), ['--max-warnings', '0', path], { cwd: root, encoding: 'utf8' })
  if (r.status !== 0) {
    console.log(JSON.stringify({
      decision: 'block',
      reason: `ESLint found errors in ${path}. Fix each one as its message says:\n${r.stdout.slice(0, 4000)}`,
    }))
  }
}
