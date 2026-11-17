// Tests for scripts/release-lib.ts (the commit header check, the breaking
// marker and the API report diff) and for the release type that
// check-release-api.ts reads from the analyzer. Run with `pnpm test:release`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { analyzeCommits } from '@semantic-release/commit-analyzer'
import config from '../release.config.js'
import { apiItems, apiLines, diffApi, hasBreakingMarker, isConventionalHeader, registryState } from './release-lib.ts'

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
  assert.deepEqual(d.removed, ['slots: { root: string; };'])
})

void test('keys members by declaration, and overloads by position', () => {
  const keys = apiItems(report('export function f(a: string): void;\nexport function f(a: number): void;\nexport interface P {\n    "data-x"?: string;\n    on(e: string): void;\n}')).map((i) => i.key)
  assert.deepEqual(keys, ['f', 'f#2', 'P', 'P.data-x', 'P.on'])
})

// The analyzer with release.config.js, as check-release-api.ts runs it.
const quiet = { log: () => undefined, error: () => undefined, warn: () => undefined, success: () => undefined }
const plugins = typeof config === 'object' && config !== null && 'plugins' in config && Array.isArray(config.plugins) ? config.plugins : []
const entry: unknown = plugins.find((p: unknown) => Array.isArray(p) && p[0] === '@semantic-release/commit-analyzer')
const releaseType = (...messages: string[]) =>
  analyzeCommits(Array.isArray(entry) ? entry[1] : {}, {
    commits: messages.map((message, i) => ({ hash: String(i).padStart(40, 'a'), message })),
    logger: quiet,
    cwd: process.cwd(),
    options: {},
  })

void test('the analyzer makes a major release for a ! header or a BREAKING CHANGE footer', async () => {
  assert.equal(await releaseType('feat!: remove size'), 'major')
  assert.equal(await releaseType('fix(button): drop size (#9)\n\nBREAKING CHANGE: use variant instead'), 'major')
  assert.equal(await releaseType('fix: drop size\n\nBREAKING-CHANGE: use variant instead'), 'major')
  assert.equal(await releaseType('fix: remove size prop'), 'patch')
  assert.equal(await releaseType('fix: mention BREAKING CHANGE: in the subject'), 'patch')
})

void test('a reverted breaking commit does not count (Codex review of #9, 2026-11-15)', async () => {
  const hash = 'b'.repeat(40)
  // Newest first, as git log gives them to the analyzer.
  const commits = [
    { hash: 'd'.repeat(40), message: 'fix: remove tone' },
    { hash: 'c'.repeat(40), message: `revert: feat!: remove size\n\nThis reverts commit ${hash}.` },
    { hash, message: 'feat!: remove size' },
  ]
  const type = await analyzeCommits(Array.isArray(entry) ? entry[1] : {}, { commits, logger: quiet, cwd: process.cwd(), options: {} })
  assert.equal(type, 'patch')
})

void test('a prop moved between nested objects is breaking (Codex review of #9)', () => {
  const before = report('export interface P {\n    slots: {\n        root: {\n            id?: string;\n        };\n        label?: string;\n    };\n}')
  const after = report('export interface P {\n    slots: {\n        root: {\n            id?: string;\n            label?: string;\n        };\n    };\n}')
  assert.equal(diffApi(before, after).breaking, true)
})

void test('a member moved between union branches is breaking (Codex review of #9)', () => {
  const before = report('export type Props = {\n    kind: "a";\n    value?: string;\n} | {\n    kind: "b";\n};')
  const after = report('export type Props = {\n    kind: "a";\n} | {\n    kind: "b";\n    value?: string;\n};')
  assert.equal(diffApi(before, after).breaking, true)
})

const alias = (...members: string[]) => report(`export type CheckboxGroupItem = {\n${members.map((m) => `    ${m}\n`).join('')}};`)

void test('a new optional member of an object type alias is not breaking', () => {
  const d = diffApi(alias('value: string;'), alias('value: string;', 'disabled?: boolean;'))
  assert.equal(d.breaking, false)
  assert.deepEqual(d.removed, [])
  assert.deepEqual(d.added, ['disabled?: boolean;'])
})

void test('a removed member of an object type alias is breaking', () => {
  const d = diffApi(alias('value: string;', 'disabled?: boolean;'), alias('value: string;'))
  assert.equal(d.breaking, true)
  assert.deepEqual(d.removed, ['disabled?: boolean;'])
})

void test('a new required member of an object type alias is breaking', () => {
  const d = diffApi(alias('value: string;'), alias('value: string;', 'label: string;'))
  assert.equal(d.breaking, true)
  assert.deepEqual(d.removed, [])
  assert.deepEqual(d.addedRequired, ['CheckboxGroupItem.label'])
})

void test('swapping two elements of a multi-line named tuple in an object type alias is breaking (Codex review of #100)', () => {
  const d = diffApi(alias('range: [', '    start: string,', '    count: number,', '];'), alias('range: [', '    count: number,', '    start: string,', '];'))
  assert.equal(d.breaking, true)
  assert.deepEqual(d.removed, ['range: [ start: string, count: number, ];'])
  assert.deepEqual(apiItems(alias('range: [', '    start: string,', '    count: number,', '];')).map((i) => i.key), ['CheckboxGroupItem', 'CheckboxGroupItem.range'])
})

void test('swapping two elements of a multi-line named tuple in an interface is breaking (Codex review of #100)', () => {
  const before = report('export interface P {\n    range: [\n        start: string,\n        count: number\n    ];\n}')
  const after = report('export interface P {\n    range: [\n        count: number,\n        start: string\n    ];\n}')
  const d = diffApi(before, after)
  assert.equal(d.breaking, true)
  assert.deepEqual(d.removed, ['range: [ start: string, count: number ];'])
})

void test('a union type alias counts any change as breaking', () => {
  const before = report('export type Props = {\n    kind: "a";\n} | {\n    kind: "b";\n};')
  const after = report('export type Props = {\n    kind: "a";\n    value?: string;\n} | {\n    kind: "b";\n};')
  const d = diffApi(before, after)
  assert.equal(d.breaking, true)
  assert.deepEqual(apiItems(after).map((i) => i.key), ['Props'])
})

void test('a new call or computed signature counts as required (Codex review of #9)', () => {
  const before = report('export interface P {\n    label?: string;\n}')
  for (const member of ['(value: string): string;', '[Symbol.iterator](): Iterator<string>;']) {
    const after = report(`export interface P {\n    label?: string;\n    ${member}\n}`)
    assert.equal(diffApi(before, after).breaking, true, member)
  }
})

void test('an empty baseline makes everything an addition', () => {
  const d = diffApi('', report('export const a: number;'))
  assert.deepEqual(d, { removed: [], added: ['export const a: number;'], addedRequired: [], breaking: false })
})

void test('reads a report with CRLF line ends', () => {
  const crlf = report('export const a: number;').replace(/\n/g, '\r\n')
  assert.deepEqual(apiLines(crlf), ['export const a: number;'])
})

void test('a first release, with no tag, passes the registry check', () => {
  assert.deepEqual(registryState({ latestTag: undefined, releaseType: null, versions: [] }), { ok: true })
})

void test('a tag whose package is in the registry passes', () => {
  assert.deepEqual(registryState({ latestTag: 'v1.0.0-beta.2', releaseType: null, versions: ['1.0.0-beta.1', '1.0.0-beta.2'] }), { ok: true })
})

void test('a rerun with no commit after a tag with no package fails (Codex audit, 2026-11-15)', () => {
  const s = registryState({ latestTag: 'v1.0.0-beta.2', releaseType: null, versions: ['1.0.0-beta.1'] })
  assert.equal(s.ok, false)
  assert.match(s.problem ?? '', /Push a fix commit/)
})

void test('only ci or docs commits after a tag with no package fail (Codex review of #11)', () => {
  // The analyzer returns null for ci: and docs: commits.
  const s = registryState({ latestTag: 'v1.0.0-beta.2', releaseType: null, versions: [] })
  assert.equal(s.ok, false)
})

void test('a releasing commit after a tag with no package only warns', () => {
  const s = registryState({ latestTag: 'v1.0.0-beta.2', releaseType: 'patch', versions: ['1.0.0-beta.1'] })
  assert.equal(s.ok, true)
  assert.match(s.warning ?? '', /publishes the next version \(patch\)/)
})
