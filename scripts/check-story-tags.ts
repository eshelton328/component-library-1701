// check:story-tags: writes the Storybook index, then runs the story-tags Vitest project (story-tags.test.ts), which
// fails when the index shows a story in the Storybook UI that its file hides with '!dev', or the reverse.
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'

try {
  mkdirSync('.vitest', { recursive: true })
  execFileSync('pnpm', ['exec', 'storybook', 'index', '-o', '.vitest/story-index.json', '--quiet'], { stdio: 'inherit' })
  execFileSync('pnpm', ['exec', 'vitest', 'run', '--project=story-tags'], { stdio: 'inherit' })
} catch {
  process.exit(1)
}
