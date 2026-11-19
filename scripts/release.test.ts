// Tests for scripts/release-lib.ts (the commit header check, the breaking
// marker and the API report diff) and for the release type that
// check-release-api.ts reads from the analyzer. Run with `pnpm test:release`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyzeCommits } from '@semantic-release/commit-analyzer'
import config from '../release.config.js'
import { afterRecipeTypes, apiItems, apiLines, diffApi, hasBreakingMarker, isConventionalHeader, recipeTypesFile, recipeTypesMissing, recipeTypesReport, registryState } from './release-lib.ts'

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
  assert.deepEqual(d, { removed: [], added: ['export const b: string;'], addedRequired: [], narrowed: [], breaking: false })
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

const intersected = (tail: string, ...members: string[]) => report(`export type PopoverProps = {\n${members.map((m) => `    ${m}\n`).join('')}}${tail}`)

void test('splits an object literal intersected with named types into members and its tail', () => {
  const items = apiItems(intersected(' & PopoverDataAttributes;', 'trigger: ReactElement;', 'note?: ReactNode;'))
  assert.deepEqual(items.map((i) => [i.key, i.text]), [
    ['PopoverProps', 'export type PopoverProps = {'],
    ['PopoverProps.trigger', 'trigger: ReactElement;'],
    ['PopoverProps.note', 'note?: ReactNode;'],
    ['PopoverProps.&', '& PopoverDataAttributes;'],
  ])
})

void test('a new optional member of an object and name intersection is not breaking', () => {
  const a = 'export interface A {\n    tone?: string;\n}\n'
  const withA = (r: string) => r.replace('export type PopoverProps', `${a}export type PopoverProps`)
  const d = diffApi(withA(intersected(' & A;', 'label: string;')), withA(intersected(' & A;', 'label: string;', 'size?: string;')))
  assert.equal(d.breaking, false)
  assert.deepEqual(d.removed, [])
  assert.deepEqual(d.added, ['size?: string;'])
})

void test('a removed member of an object and name intersection is breaking', () => {
  const d = diffApi(intersected(' & A;', 'label: string;', 'size?: string;'), intersected(' & A;', 'label: string;'))
  assert.equal(d.breaking, true)
  assert.deepEqual(d.removed, ['size?: string;'])
})

void test('a new required member of an object and name intersection is breaking', () => {
  const d = diffApi(intersected(' & A;', 'label: string;'), intersected(' & A;', 'label: string;', 'size: string;'))
  assert.equal(d.breaking, true)
  assert.deepEqual(d.addedRequired, ['PopoverProps.size'])
})

void test('any change to the named types of an intersection is breaking', () => {
  const base = intersected(' & A;', 'label: string;')
  for (const tail of [' & B;', ' & A & B;', ';', '', ' & A & C;']) {
    assert.equal(diffApi(base, intersected(tail, 'label: string;')).breaking, true, tail)
  }
  assert.equal(diffApi(intersected(' & A & B;', 'label: string;'), base).breaking, true)
  // Adding an intersection to a plain object alias is breaking too.
  assert.deepEqual(diffApi(intersected(';', 'label: string;'), base).addedRequired, ['PopoverProps.&'])
})

void test('an intersection with a union, a second literal or a non-identifier tail stays one item', () => {
  for (const tail of [' | A;', ' & {\n    size?: string;\n};', ' & A | B;', ' & A.B;', ' & A &', ' & typeof a;']) {
    assert.deepEqual(apiItems(intersected(tail, 'label: string;')).map((i) => i.key), ['PopoverProps'], tail)
  }
  // Type parameters on the alias keep it one item.
  assert.deepEqual(apiItems(report('export type P<T> = {\n    value: T;\n} & A;')).map((i) => i.key), ['P'])
  // So does a mapped key.
  assert.deepEqual(apiItems(report('export type P = {\n    [K in Keys]: string;\n} & A;')).map((i) => i.key), ['P'])
})

const popoverData = `// @public (undocumented)
export type PopoverDataAttributes = {
    [key: \`data-\${string}\`]: string | number | boolean | undefined;
};

`

// PopoverProps as api/component-library-1701.api.md reports it on 2026-11-17.
const popoverPropsBody = `// @public (undocumented)
export type PopoverProps = {
    trigger: ReactElement;
    label: string;
    children: ReactNode;
    note?: ReactNode;
    actions?: ReactNode;
    open?: boolean | undefined;
    onOpenChange?: ((open: boolean) => void) | undefined;
    placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | undefined;
    width?: 'sm' | 'filter' | 'md' | 'lg' | 'picker' | undefined;
    flip?: boolean | undefined;
    className?: string | undefined;
} & PopoverDataAttributes;

// @public
export function PopoverSection(input: PopoverSectionProps): JSX.Element;`
const popoverProps = report(popoverPropsBody)

void test('the reported PopoverProps splits into members, and a new optional member is not breaking', () => {
  const keys = apiItems(popoverProps).map((i) => i.key)
  assert.deepEqual(keys, ['PopoverProps', ...['trigger', 'label', 'children', 'note', 'actions', 'open', 'onOpenChange', 'placement', 'width', 'flip', 'className', '&'].map((k) => `PopoverProps.${k}`), 'PopoverSection'])
  const withData = report(popoverData + popoverPropsBody)
  const after = withData.replace('    className?: string | undefined;\n', '    className?: string | undefined;\n    opaque?: boolean | undefined;\n')
  assert.equal(diffApi(withData, after).breaking, false)
  assert.equal(diffApi(withData, withData.replace('& PopoverDataAttributes;', '& PopoverDataProps;')).breaking, true)
})

void test('a new optional member that an intersected index signature allows is breaking (Codex review of #110)', () => {
  const before = report(popoverData + popoverPropsBody)
  const add = (member: string) => before.replace('    className?: string | undefined;\n', `    className?: string | undefined;\n    ${member}\n`)
  const testid = diffApi(before, add('"data-testid"?: string;'))
  assert.equal(testid.breaking, true)
  assert.deepEqual(testid.narrowed, ['PopoverProps.data-testid'])
  const opaque = diffApi(before, add('opaque?: boolean | undefined;'))
  assert.equal(opaque.breaking, false)
  assert.deepEqual(opaque.narrowed, [])
})

void test('a new optional member is breaking when an intersected type is not in the report (Codex review of #110)', () => {
  // The PopoverProps fixture has no PopoverDataAttributes declaration.
  const after = popoverProps.replace('    className?: string | undefined;\n', '    className?: string | undefined;\n    opaque?: boolean | undefined;\n')
  assert.deepEqual(diffApi(popoverProps, after).narrowed, ['PopoverProps.opaque'])
})

// Scalar and a recipe's variant props, as the report and Panda's
// styled-system/recipes/dialog.d.ts declare them on 2026-11-18.
const scalarDecl = `// @public
export type Scalar<T> = {
    [K in keyof T]?: Exclude<T[K], readonly unknown[] | {
        readonly [key: string]: unknown;
    }>;
};

`
const dialogVariantTypes = report(`export type DialogVariant = {
  size?: "md" | "lg" | "wide"
}

export type DialogVariantProps = {
  [K in keyof DialogVariant]?: ConditionalValue<DialogVariant[K]>
}`)

// DialogProps as the v1.0.0-beta.42 report has it, shortened.
const dialogPropsBody = `// @public (undocumented)
export type DialogProps = Scalar<DialogVariantProps> & {
    title: string;
    description?: ReactNode;
    className?: string | undefined;
} & PopoverDataAttributes;`
const dialogProps = report(popoverData + scalarDecl + dialogPropsBody)
const bothTypes = { before: dialogVariantTypes, after: dialogVariantTypes }
const addDialogMember = (r: string, member: string) => r.replace('    title: string;\n', `    title: string;\n    ${member}\n`)

void test('an alias with a generic reference before its object splits into members (#158)', () => {
  assert.deepEqual(
    apiItems(dialogProps).filter((i) => i.key.startsWith('DialogProps')).map((i) => [i.key, i.text]),
    [
      ['DialogProps', 'export type DialogProps = Scalar<DialogVariantProps> & {'],
      ['DialogProps.title', 'title: string;'],
      ['DialogProps.description', 'description?: ReactNode;'],
      ['DialogProps.className', 'className?: string | undefined;'],
      ['DialogProps.&', 'Scalar<DialogVariantProps> & {…} & PopoverDataAttributes;'],
    ],
  )
})

void test('a new optional member of an alias with a generic reference is not breaking when the reference has no such key (#158)', () => {
  const d = diffApi(dialogProps, addDialogMember(dialogProps, 'meta?: ReactNode;'), bothTypes)
  assert.deepEqual(d, { removed: [], added: ['meta?: ReactNode;'], addedRequired: [], narrowed: [], breaking: false })
})

void test('a removed or narrowed member of an alias with a generic reference is breaking', () => {
  const removed = diffApi(dialogProps, dialogProps.replace('    description?: ReactNode;\n', ''), bothTypes)
  assert.equal(removed.breaking, true)
  assert.ok(removed.removed.some((t) => t.includes('description?: ReactNode;')))
  const retyped = diffApi(dialogProps, dialogProps.replace('description?: ReactNode;', 'description?: string;'), bothTypes)
  assert.equal(retyped.breaking, true)
  assert.ok(retyped.removed.some((t) => t.includes('description?: ReactNode;')))
  // `size` is a key of the variant props, so a new `size` narrows it.
  const shadow = diffApi(dialogProps, addDialogMember(dialogProps, 'size?: "md";'), bothTypes)
  assert.equal(shadow.breaking, true)
  const required = diffApi(dialogProps, addDialogMember(dialogProps, 'meta: ReactNode;'), bothTypes)
  assert.equal(required.breaking, true)
})

void test('a new optional member is breaking when the keys of a generic reference are not known', () => {
  const meta = (before: string, types?: { before?: string | undefined; after?: string | undefined }) => diffApi(before, addDialogMember(before, 'meta?: ReactNode;'), types)
  // No declaration of DialogVariantProps.
  assert.deepEqual(meta(dialogProps).narrowed, ['DialogProps.meta'])
  // No declaration of Scalar.
  const noScalar = report(popoverData + dialogPropsBody)
  assert.deepEqual(meta(noScalar, bothTypes).narrowed, ['DialogProps.meta'])
  // A Scalar that is not a mapped type over the keys of its parameter.
  for (const scalar of [
    'export type Scalar<T> = {\n    [K in keyof T as `x${string}`]?: T[K];\n};\n\n',
    'export type Scalar<T> = {\n    [K in keyof T]?: T[K];\n    extra?: string;\n};\n\n',
    'export type Scalar<T> = {\n    [K in keyof Other]?: T;\n};\n\n',
    'export type Scalar<T> = Partial<T>;\n\n',
  ]) {
    const r = report(popoverData + scalar + dialogPropsBody)
    assert.deepEqual(meta(r, bothTypes).narrowed, ['DialogProps.meta'], scalar)
  }
})

void test('a new optional member is breaking when the recipe types of the release had that key (Codex review of #160)', () => {
  // The release had a `size` variant; this change removes it and adds a
  // `size` prop, so a caller that passes size="lg" fails to compile.
  const withoutSize = dialogVariantTypes.replace('  size?: "md" | "lg" | "wide"\n', '')
  const after = addDialogMember(dialogProps, 'size?: "md";')
  const d = diffApi(dialogProps, after, { before: dialogVariantTypes, after: withoutSize })
  assert.deepEqual(d.narrowed, ['DialogProps.size'])
  // With no recipe types for the release, every new member counts.
  assert.deepEqual(diffApi(dialogProps, addDialogMember(dialogProps, 'meta?: ReactNode;'), { after: dialogVariantTypes }).narrowed, ['DialogProps.meta'])
  // With both, a name that neither allows passes.
  assert.deepEqual(diffApi(dialogProps, addDialogMember(dialogProps, 'meta?: ReactNode;'), { before: dialogVariantTypes, after: withoutSize }).narrowed, [])
})

void test('an object intersected with a generic reference in its tail splits into members', () => {
  const tail = (t: string, ...members: string[]) => report(popoverData + scalarDecl + `export type P = {\n${members.map((m) => `    ${m}\n`).join('')}}${t}`)
  assert.deepEqual(apiItems(tail(' & Pick<A, "x">;', 'label: string;')).filter((i) => i.key === 'P' || i.key.startsWith('P.')).map((i) => [i.key, i.text]), [
    ['P', 'export type P = {'],
    ['P.label', 'label: string;'],
    ['P.&', '& Pick<A, "x">;'],
  ])
  // Pick is not in the report, so a new optional member may narrow it.
  const pick = diffApi(tail(' & Pick<A, "x">;', 'label: string;'), tail(' & Pick<A, "x">;', 'label: string;', 'note?: string;'))
  assert.deepEqual(pick.narrowed, ['P.note'])
  // A mapped reference whose argument has no such key passes.
  const before = tail(' & Scalar<DialogVariantProps>;', 'label: string;')
  const types = { before: dialogVariantTypes, after: dialogVariantTypes }
  assert.equal(diffApi(before, tail(' & Scalar<DialogVariantProps>;', 'label: string;', 'note?: string;'), types).breaking, false)
  // A removed, retyped or shadowed member, or a changed reference, is breaking.
  for (const after of [
    tail(' & Scalar<DialogVariantProps>;'),
    tail(' & Scalar<DialogVariantProps>;', 'label: number;'),
    tail(' & Scalar<DialogVariantProps>;', 'label: string;', 'size?: "md";'),
    tail(' & Scalar<OtherVariantProps>;', 'label: string;'),
  ]) assert.equal(diffApi(before, after, types).breaking, true, after)
})

void test('the recipe types report holds each recipe file in name order, and the diff reads it (#160 follow-up)', () => {
  const dialog = dialogVariantTypes.slice(dialogVariantTypes.indexOf('export type DialogVariant ='), dialogVariantTypes.lastIndexOf('}') + 1)
  const types = recipeTypesReport([
    { name: 'menu.d.ts', text: "import type { X } from '../types/system.js';\nexport type MenuVariant = {\n  size?: \"sm\"\n}\n" },
    { name: 'dialog.d.ts', text: `import type { ConditionalValue } from '../types/system.js';\n${dialog}\n` },
  ])
  assert.ok(types.indexOf('// dialog.d.ts') < types.indexOf('// menu.d.ts'))
  assert.deepEqual(apiItems(types).map((i) => i.key), ['DialogVariant', 'DialogVariant.size', 'DialogVariantProps', 'MenuVariant', 'MenuVariant.size'])
  const both = { before: types, after: types }
  assert.equal(diffApi(dialogProps, addDialogMember(dialogProps, 'meta?: ReactNode;'), both).breaking, false)
  assert.deepEqual(diffApi(dialogProps, addDialogMember(dialogProps, 'size?: "md";'), both).narrowed, ['DialogProps.size'])
})

void test('any change to the generic references before the object is breaking', () => {
  for (const head of ['Scalar<OtherVariantProps> & ', 'ComponentProps<"div"> & Scalar<DialogVariantProps> & ', '']) {
    const after = dialogProps.replace('Scalar<DialogVariantProps> & {', `${head}{`)
    assert.equal(diffApi(dialogProps, after, bothTypes).breaking, true, head)
  }
})

// FileBrowserProps as the v1.0.0-beta.83 report and the main report of
// 2026-11-19 (after #261 added the figma prop) have it, shortened.
const fileBrowserBeta83 = report(scalarDecl + `// @public (undocumented)
export type FileBrowserProps = Scalar<FileBrowserVariantProps> & {
    tree: ReactNode;
    children?: ReactNode;
};`)
const fileBrowserMain = fileBrowserBeta83.replace('    tree: ReactNode;\n', '    tree: ReactNode;\n    figma?: FileBrowserLayers | undefined;\n')
// styled-system/recipes/file-browser.d.ts as Panda codegen writes it.
const fileBrowserRecipe = {
  name: 'file-browser.d.ts',
  text: `import type { ConditionalValue } from '../types/system.js';

export type FileBrowserVariant = {
  layout?: "split" | "stacked"
}

export type FileBrowserVariantProps = {
  [K in keyof FileBrowserVariant]?: ConditionalValue<FileBrowserVariant[K]>
}
`,
}
const tempRoot = (files: Record<string, string>) => {
  const root = mkdtempSync(join(tmpdir(), 'release-api-test-'))
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  return root
}

void test('the after recipe types come from the committed file when styled-system is missing (lib-api-diff, 2026-11-19)', () => {
  const root = tempRoot({ [recipeTypesFile]: recipeTypesReport([fileBrowserRecipe]) })
  try {
    const types = afterRecipeTypes(root)
    assert.equal(types, recipeTypesReport([fileBrowserRecipe]))
    // check-release-api.ts reads the tag's committed file for the before side.
    const d = diffApi(fileBrowserBeta83, fileBrowserMain, { before: types, after: types })
    assert.deepEqual(d.narrowed, [])
    assert.equal(d.breaking, false)
    // A new prop with the name of a variant still narrows it.
    const layout = fileBrowserBeta83.replace('    tree: ReactNode;\n', '    tree: ReactNode;\n    layout?: string;\n')
    assert.deepEqual(diffApi(fileBrowserBeta83, layout, { before: types, after: types }).narrowed, ['FileBrowserProps.layout'])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

void test('the committed recipe types win over styled-system, which counts only when the file is missing', () => {
  const recipe = (text: string) => ({ [`styled-system/recipes/${fileBrowserRecipe.name}`]: text, 'styled-system/recipes/index.mjs': '' })
  const stale = fileBrowserRecipe.text.replace('"split" | "stacked"', '"split"')
  const both = tempRoot({ [recipeTypesFile]: recipeTypesReport([fileBrowserRecipe]), ...recipe(stale) })
  const codegen = tempRoot(recipe(fileBrowserRecipe.text))
  try {
    assert.equal(afterRecipeTypes(both), recipeTypesReport([fileBrowserRecipe]))
    assert.equal(afterRecipeTypes(codegen), recipeTypesReport([fileBrowserRecipe]))
  } finally {
    rmSync(both, { recursive: true, force: true })
    rmSync(codegen, { recursive: true, force: true })
  }
})

void test('a stale styled-system/recipes with no file-browser recipe does not hide the committed recipe types (bridge-release, 2026-11-19)', () => {
  // The release clone had styled-system/recipes from before #261, with no
  // file-browser or file-frame recipe, because pnpm install skipped prepare.
  const stale = { 'styled-system/recipes/dialog.d.ts': 'export type DialogVariant = {\n  size?: "md"\n}\n' }
  const root = tempRoot({ [recipeTypesFile]: recipeTypesReport([fileBrowserRecipe]), ...stale })
  const staleOnly = tempRoot(stale)
  try {
    const types = afterRecipeTypes(root)
    assert.equal(types, recipeTypesReport([fileBrowserRecipe]))
    assert.deepEqual(diffApi(fileBrowserBeta83, fileBrowserMain, { before: types, after: types }).narrowed, [])
    // The stale folder alone does not know FileBrowserVariantProps, so it
    // gives the false breaking result that the committed file prevents.
    const staleTypes = afterRecipeTypes(staleOnly)
    assert.deepEqual(diffApi(fileBrowserBeta83, fileBrowserMain, { before: types, after: staleTypes }).narrowed, ['FileBrowserProps.figma'])
  } finally {
    rmSync(root, { recursive: true, force: true })
    rmSync(staleOnly, { recursive: true, force: true })
  }
})

void test('check-release-api.ts exits 1 when no recipe types are known, never with a breaking result (lib-api-diff, 2026-11-19)', () => {
  const root = tempRoot({ 'api/component-library-1701.api.md': fileBrowserBeta83 })
  const git = (...args: string[]) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', '-c', 'tag.gpgsign=false', ...args], { cwd: root, encoding: 'utf8' })
  try {
    assert.equal(afterRecipeTypes(root), undefined)
    for (const args of [['init', '-q'], ['add', '.'], ['commit', '-q', '-m', 'feat: first'], ['tag', 'v1.0.0-beta.83']]) assert.equal(git(...args).status, 0, args.join(' '))
    writeFileSync(join(root, 'api/component-library-1701.api.md'), fileBrowserMain)
    const script = fileURLToPath(new URL('check-release-api.ts', import.meta.url))
    const run = spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' })
    assert.equal(run.status, 1, run.stdout + run.stderr)
    assert.equal(recipeTypesMissing, 'recipe types missing: run pnpm install')
    assert.match(run.stderr, /recipe types missing: run pnpm install/)
    assert.doesNotMatch(run.stdout, /breaking/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

void test('a generic reference before the object with a union, a body or a type argument it cannot read stays one item', () => {
  for (const head of ['A | Scalar<B> & ', 'Scalar<{ a: string }> & ', 'Scalar<(a: B) => C> & ', 'A.B<C> & ', 'typeof a & ']) {
    const r = report(`export type P = ${head}{\n    label: string;\n};`)
    assert.deepEqual(apiItems(r).map((i) => i.key), ['P'], head)
  }
})

void test('a new optional member is breaking when an intersected type has it, or a key type allows it (Codex review of #110)', () => {
  const props = (named: string, ...members: string[]) => report(`${named}\nexport type P = {\n${members.map((m) => `    ${m}\n`).join('')}} & A;`)
  const cases: [named: string, member: string, breaking: boolean][] = [
    ['export interface A {\n    size?: number;\n}', 'size?: string;', true],
    ['export interface A {\n    size?: number;\n}', 'tone?: string;', false],
    ['export type A = {\n    [key: string]: unknown;\n};', 'tone?: string;', true],
    ['export type A = {\n    [key: number]: unknown;\n};', 'tone?: string;', false],
    ['export type A = {\n    [key: number]: unknown;\n};', '"0"?: string;', true],
    ['export type A = {\n    [key: `aria-${string}`]: string;\n};', 'tone?: string;', false],
    ['export type A = {\n    [key: `aria-${string}`]: string;\n};', '"aria-label"?: string;', true],
    ['export type A = {\n    [key: `x${boolean}`]: string;\n};', 'tone?: string;', true],
    ['export type A = {\n    [key: Keys]: string;\n};', 'tone?: string;', true],
    ['export interface A extends B {\n    size?: number;\n}', 'tone?: string;', true],
    ['export interface A<T> {\n    size?: T;\n}', 'tone?: string;', true],
    ['export type A = B | C;', 'tone?: string;', true],
    ['export type A = {\n    size?: number;\n} & B;', 'tone?: string;', true],
  ]
  for (const [named, member, breaking] of cases) {
    const d = diffApi(props(named, 'label: string;'), props(named, 'label: string;', member))
    assert.equal(d.breaking, breaking, `${named} + ${member}`)
  }
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
  assert.deepEqual(d, { removed: [], added: ['export const a: number;'], addedRequired: [], narrowed: [], breaking: false })
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
