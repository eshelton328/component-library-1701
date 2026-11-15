// Tests for scripts/release-lib.ts: the commit header check, the breaking
// markers and the API report diff. Run with `pnpm test:release`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apiItems, apiLines, diffApi, hasBreakingMarker, isBreakingCommit, isConventionalHeader } from './release-lib.ts'

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
  assert.deepEqual(d, { removed: [], added: ['export const b: string;'], addedRequired: [], breaking: false })
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

void test('a removed declaration is breaking, with its members', () => {
  const before = report('export interface A {\n}\nexport interface B {\n    x: string;\n}')
  const after = report('export interface A {\n}')
  const d = diffApi(before, after)
  assert.equal(d.breaking, true)
  assert.deepEqual(d.removed.sort(), ['export interface B {', 'x: string;'].sort())
})

void test('a prop moved to another interface is breaking (Codex audit, 2026-11-15)', () => {
  const before = report('export interface A {\n    size?: "sm" | "md";\n}\nexport interface B {\n}')
  const after = report('export interface A {\n}\nexport interface B {\n    size?: "sm" | "md";\n}')
  const d = diffApi(before, after)
  assert.equal(d.breaking, true)
  assert.deepEqual(d.removed, ['size?: "sm" | "md";'])
})

void test('a new required member of an existing interface is breaking (Codex audit, 2026-11-15)', () => {
  const before = report('export interface ButtonProps {\n    size?: "sm";\n}')
  const after = report('export interface ButtonProps {\n    size?: "sm";\n    label: string;\n}')
  const d = diffApi(before, after)
  assert.equal(d.breaking, true)
  assert.deepEqual(d.removed, [])
  assert.deepEqual(d.addedRequired, ['ButtonProps.label'])
})

void test('a new optional member is not breaking', () => {
  const before = report('export interface ButtonProps {\n    size?: "sm";\n}')
  const after = report('export interface ButtonProps {\n    size?: "sm";\n    readonly label?: string;\n}')
  const d = diffApi(before, after)
  assert.equal(d.breaking, false)
  assert.deepEqual(d.added, ['readonly label?: string;'])
})

void test('a new interface with required members is not breaking', () => {
  const d = diffApi(report('export const a: number;'), report('export const a: number;\nexport interface New {\n    x: string;\n}'))
  assert.equal(d.breaking, false)
  assert.deepEqual(d.addedRequired, [])
})

void test('a change inside a nested type changes the member that holds it', () => {
  const before = report('export interface P {\n    slots: {\n        root: string;\n    };\n}')
  const after = report('export interface P {\n    slots: {\n        root: number;\n    };\n}')
  const d = diffApi(before, after)
  assert.equal(d.breaking, true)
  assert.deepEqual(d.removed, ['slots: { root: string;'])
})

void test('keys members by declaration, and overloads by position', () => {
  const keys = apiItems(report('export function f(a: string): void;\nexport function f(a: number): void;\nexport interface P {\n    "data-x"?: string;\n    on(e: string): void;\n}')).map((i) => i.key)
  assert.deepEqual(keys, ['f', 'f#2', 'P', 'P.data-x', 'P.on'])
})

void test('a breaking commit has a ! header or a BREAKING CHANGE footer', () => {
  assert.ok(isBreakingCommit('feat!: remove size'))
  assert.ok(isBreakingCommit('fix(button): drop size (#9)\n\nBREAKING CHANGE: use variant instead'))
  assert.ok(isBreakingCommit('fix: drop size\n\nBREAKING-CHANGE: use variant instead'))
  assert.ok(!isBreakingCommit('fix: remove size prop'))
  assert.ok(!isBreakingCommit('fix: mention BREAKING CHANGE: in the subject'))
  assert.ok(!isBreakingCommit('fix: drop size\n\nthis is not a BREAKING CHANGE: footer'))
})

void test('an empty baseline makes everything an addition', () => {
  const d = diffApi('', report('export const a: number;'))
  assert.deepEqual(d, { removed: [], added: ['export const a: number;'], addedRequired: [], breaking: false })
})

void test('reads a report with CRLF line ends', () => {
  const crlf = report('export const a: number;').replace(/\n/g, '\r\n')
  assert.deepEqual(apiLines(crlf), ['export const a: number;'])
})
