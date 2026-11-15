// Tests for scripts/release-lib.ts: the commit header check and the API
// report diff. Run with `pnpm test:release`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apiLines, diffApi, hasBreakingMarker, isConventionalHeader } from './release-lib.ts'

const report = (body: string) => `## API Report File\n\n\`\`\`ts\n\n// comment\nimport { X } from 'y';\n${body}\n\n\`\`\`\n`

void test('accepts Conventional Commits headers, with a PR number', () => {
  assert.ok(isConventionalHeader('feat(tokens): add the viewscreen theme (#2)'))
  assert.ok(isConventionalHeader('fix!: drop the old prop'))
})

void test('rejects headers that are not Conventional Commits', () => {
  assert.ok(!isConventionalHeader('Merge pull request #1 from a/b'))
  assert.ok(!isConventionalHeader('feat: Add a thing'))
  assert.ok(!isConventionalHeader('feat: add a thing.'))
  assert.ok(!isConventionalHeader('feature: add a thing'))
})

void test('finds the breaking marker only before the colon', () => {
  assert.ok(hasBreakingMarker('feat!: remove size'))
  assert.ok(hasBreakingMarker('feat(button)!: remove size'))
  assert.ok(!hasBreakingMarker('feat: remove size!'))
})

void test('reads only declaration lines from a report', () => {
  assert.deepEqual(apiLines(report('export const a: number;')), ['export const a: number;'])
  assert.deepEqual(apiLines('no code block'), [])
})

void test('an added export is not breaking', () => {
  const d = diffApi(report('export const a: number;'), report('export const a: number;\nexport const b: string;'))
  assert.deepEqual(d, { removed: [], added: ['export const b: string;'], breaking: false })
})

void test('a removed export is breaking', () => {
  const d = diffApi(report('export const a: number;\nexport const b: string;'), report('export const a: number;'))
  assert.equal(d.breaking, true)
  assert.deepEqual(d.removed, ['export const b: string;'])
})

void test('a renamed or retyped prop is breaking', () => {
  const before = report('export interface ButtonProps {\n    size?: "sm" | "md";\n}')
  const after = report('export interface ButtonProps {\n    size?: "md";\n}')
  const d = diffApi(before, after)
  assert.equal(d.breaking, true)
  assert.deepEqual(d.removed, ['size?: "sm" | "md";'])
  assert.deepEqual(d.added, ['size?: "md";'])
})

void test('counts repeated lines, so removing one of two closing braces is seen', () => {
  const before = report('export interface A {\n}\nexport interface B {\n}')
  const after = report('export interface A {\n}')
  assert.deepEqual(diffApi(before, after).removed.sort(), ['export interface B {', '}'].sort())
})

void test('an empty baseline makes everything an addition', () => {
  const d = diffApi('', report('export const a: number;'))
  assert.deepEqual(d, { removed: [], added: ['export const a: number;'], breaking: false })
})

void test('reads a report with CRLF line ends', () => {
  const crlf = report('export const a: number;').replace(/\n/g, '\r\n')
  assert.deepEqual(apiLines(crlf), ['export const a: number;'])
})
