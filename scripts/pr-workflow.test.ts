// Tests for the base-branch guard of .github/workflows/pr.yml. Run with
// `pnpm test:release`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(new URL('../.github/workflows/pr.yml', import.meta.url), 'utf8')
const guard = workflow.slice(workflow.indexOf('- name: Require a ci run after the last base-branch change'))
const step = guard.slice(0, guard.indexOf('\n      - name:'))

// The events of the guard's if: list, as written in pr.yml.
function guardEvents(): string {
  const events = /\n {8}if: contains\(fromJSON\('\[([^\]]*)\]'\), github\.event\.action\)\n/.exec(step)?.[1]
  if (events === undefined) throw new Error('the guard step has no if: contains(fromJSON(...), github.event.action)')
  return events
}

void test('the guard runs only on an edit, as a push or reopen starts ci.yml itself', () => {
  assert.match(step, /\n {8}if: contains\(fromJSON\('\[[^\]]*\]'\), github\.event\.action\)\n/)
  assert.doesNotMatch(guardEvents(), /opened|synchronize/)
})

void test('the guard runs on a label change, so a newer run cannot skip it after a base change (Codex review of #249)', () => {
  assert.deepEqual(guardEvents().split(', ').sort(), ['"edited"', '"labeled"', '"unlabeled"'])
})

void test('the guard counts only ci runs of this PR, not of another PR with the same head', () => {
  assert.match(step, /select\(any\(\.pull_requests\[\]; \.number == \$PR\)\)/)
})