// Tests for tokens/figma/lib.ts. Run with `pnpm test:figma`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { colourScopes, compareHashes, escapeHtml, expectedHashes, exportTokens, fnv, renderScripts } from './lib.ts'
import type { FigmaTokens } from './lib.ts'

const tokens = new URL('..', import.meta.url).pathname
const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'))
const themes = readdirSync(join(tokens, 'themes')).filter((f) => f.endsWith('.json')).map((f) => ({ name: f.replace(/\.json$/, ''), json: readJson(join(tokens, 'themes', f)) }))
const doc = exportTokens({ themes, layout: readJson(join(tokens, 'layout.json')), commit: 'test', tokensSha256: 'test' })
const collection = (d: FigmaTokens, name: string) => d.collections.find((c) => c.name === name)

void test('exports the three collections and the text styles of the repository tokens', () => {
  assert.deepEqual(doc.collections.map((c) => [c.name, c.modes]), [['Theme', ['Viewscreen']], ['Color', ['Dark', 'Light']], ['Layout', ['Value']]])
  assert.ok(doc.textStyles.length > 0)
  for (const c of doc.collections) assert.ok(c.variables.length > 0, c.name)
})

void test('hides the dark and light primitives and gives them no scopes (run 1, P1)', () => {
  const primitives = collection(doc, 'Theme')?.variables.filter((v) => /^(dark|light)\//.test(v.name)) ?? []
  assert.ok(primitives.length > 0)
  for (const v of primitives) {
    assert.equal(v.hidden, true, v.name)
    assert.deepEqual(v.scopes, [], v.name)
  }
  assert.ok(collection(doc, 'Color')?.variables.every((v) => v.hidden === undefined))
})

void test('writes opacity as a percent (run 1, P2)', () => {
  const opacity = collection(doc, 'Theme')?.variables.filter((v) => v.name.startsWith('opacity/')) ?? []
  assert.ok(opacity.length > 0)
  for (const v of opacity) {
    const value = v.values?.['Viewscreen']
    assert.ok(typeof value === 'number', v.name)
    assert.ok(value > 1 && value <= 100, `${v.name} = ${String(value)}`)
  }
})

void test('every Color alias names a Theme variable', () => {
  const theme = new Set(collection(doc, 'Theme')?.variables.map((v) => v.name))
  for (const v of collection(doc, 'Color')?.variables ?? []) {
    assert.deepEqual(Object.keys(v.aliases ?? {}), ['Dark', 'Light'], v.name)
    for (const target of Object.values(v.aliases ?? {})) assert.ok(theme.has(target), `${v.name} -> ${target}`)
  }
})

void test('every text style names a font variable', () => {
  const fonts = new Set(collection(doc, 'Theme')?.variables.filter((v) => v.type === 'STRING').map((v) => v.name))
  for (const t of doc.textStyles) assert.ok(fonts.has(t.fontFamilyVariable), t.name)
})

void test('scopes colours by group, and fails on an unknown status part', () => {
  assert.deepEqual(colourScopes(['fg', 'default']), ['TEXT_FILL', 'SHAPE_FILL'])
  assert.deepEqual(colourScopes(['status', 'error', 'border']), ['STROKE_COLOR'])
  assert.deepEqual(colourScopes(['surface', 'pane']), ['FRAME_FILL', 'SHAPE_FILL'])
  assert.throws(() => colourScopes(['status', 'error', 'glow']))
})

void test('rejects a dimension that is not in px', () => {
  const theme = structuredClone(themes[0]?.json)
  assert.ok(typeof theme === 'object' && theme !== null && 'radius' in theme)
  const bad = { ...theme, radius: { sm: { $type: 'dimension', $value: { value: 1, unit: 'rem' } } } }
  assert.throws(() => exportTokens({ themes: [{ name: 'bad', json: bad }], layout: {}, commit: '', tokensSha256: '' }), /not a px dimension/)
})

void test('renders the scripts in order, with the data in place', () => {
  const scripts = renderScripts(doc)
  assert.deepEqual(scripts.map((s) => s.file), ['theme.js', 'color.js', 'layout.js', 'text-styles.js', 'fingerprint.js'])
  for (const s of scripts) assert.ok(!s.code.includes('__DATA__'), s.file)
  const color = scripts.find((s) => s.file === 'color.js')?.code ?? ''
  const data: unknown = JSON.parse(/^const DATA = (.*);$/m.exec(color)?.[1] ?? 'null')
  assert.ok(typeof data === 'object' && data !== null && 'aliasFrom' in data && data.aliasFrom === 'Theme')
  assert.match(scripts.find((s) => s.file === 'theme.js')?.code ?? '', /hiddenFromPublishing = !!d\.h/)
})

void test('keeps a $ in a description, which String.replace would expand', () => {
  const d = structuredClone(doc)
  const v = d.collections[0]?.variables[0]
  assert.ok(v)
  v.description = "costs $& and $' here"
  assert.ok(renderScripts(d)[0]?.code.includes("costs $& and $' here"))
})

void test('hashes with 32-bit FNV-1a', () => {
  assert.equal(fnv(''), '811c9dc5')
  assert.equal(fnv('a'), 'e40c292c')
  assert.equal(fnv('foobar'), 'bf9cf968')
})

void test('escapes descriptions as Figma stores them (run 1, P3)', () => {
  assert.equal(escapeHtml(`backdrop's <b> & "x"`), 'backdrop&#39;s &lt;b&gt; &amp; &quot;x&quot;')
})

void test('compares hashes and names each missing, extra and changed item', () => {
  const expected = expectedHashes(doc)
  assert.deepEqual(compareHashes(expected, { ...expected }), [])
  const [first, second] = Object.keys(expected)
  assert.ok(first !== undefined && second !== undefined)
  const got = Object.fromEntries(Object.entries({ ...expected, [first]: '00000000', 'var|Theme|stray': 'x' }).filter(([k]) => k !== second))
  assert.deepEqual(compareHashes(expected, got), [`missing ${second}`, 'extra var|Theme|stray', `changed ${first}`])
})

void test('a changed value changes its hash', () => {
  const d = structuredClone(doc)
  const v = collection(d, 'Layout')?.variables[0]
  assert.ok(v?.values)
  const before = expectedHashes(d)[`var|Layout|${v.name}`]
  v.values['Value'] = 999
  assert.notEqual(expectedHashes(d)[`var|Layout|${v.name}`], before)
})
