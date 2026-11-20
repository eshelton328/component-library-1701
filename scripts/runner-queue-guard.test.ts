// Tests for .github/workflows/runner-queue-guard.yml. Run with
// `pnpm test:release`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(new URL('../.github/workflows/runner-queue-guard.yml', import.meta.url), 'utf8')

void test('the guard reads every page of the queued and in-progress runs, not only the first 30', () => {
  const calls = [...workflow.matchAll(/gh api [^\n]*actions\/runs\?status=([a-z_]+)/g)]
  assert.deepEqual(
    calls.map((call) => call[1]),
    ['queued', 'in_progress'],
  )
  for (const call of calls) assert.match(call[0], /gh api --paginate /, `not paginated: ${call[0]}`)
})

void test('the guard cancels a job queued for the self-hosted label after 10 minutes with a stale heartbeat, or 30 in any case', () => {
  assert.match(workflow, /SEEN: \$\{\{ vars\.BRIDGE_RUNNER_SEEN \}\}/)
  assert.match(workflow, /\$\(\( now - SEEN \)\) -le 180/)
  assert.match(workflow, /\[ "\$stale" = 1 \] && \[ "\$waited" -gt 600 \]/)
  assert.match(workflow, /\[ "\$waited" -gt 1800 \]/)
  assert.match(workflow, /index\("self-hosted"\)/)
})
