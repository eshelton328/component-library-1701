// Tests for scripts/worktree-lib.ts. Run with `pnpm test:release`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lineWriter } from './worktree-lib.ts'

void test('a line goes out as soon as it ends, with the prefix', () => {
  const out: string[] = []
  const w = lineWriter('[x] ', (l) => out.push(l))
  w.write('one\ntw')
  assert.deepEqual(out, ['[x] one\n'])
  w.write('o\n\nthree')
  assert.deepEqual(out, ['[x] one\n', '[x] two\n', '[x] \n'])
  w.flush()
  assert.deepEqual(out, ['[x] one\n', '[x] two\n', '[x] \n', '[x] three\n'])
})

void test('flush sends nothing when the last chunk ended with a newline, and nothing twice', () => {
  const out: string[] = []
  const w = lineWriter('[x] ', (l) => out.push(l))
  w.write('done\n')
  w.flush()
  w.flush()
  assert.deepEqual(out, ['[x] done\n'])
})

void test('a chunk with no newline waits until a newline or flush', () => {
  const out: string[] = []
  const w = lineWriter('', (l) => out.push(l))
  w.write('a')
  w.write('b')
  assert.deepEqual(out, [])
  w.flush()
  assert.deepEqual(out, ['ab\n'])
})
