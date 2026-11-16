// Tests for tokens/figma/lib.ts. Run with `pnpm test:figma`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { colourScopes, compareHashes, escapeHtml, expectedHashes, exportTokens, fnv, renderScripts } from './lib.ts'
import type { FigmaTokens } from './lib.ts'

const tokens = fileURLToPath(new URL('..', import.meta.url))
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

// A stub of the Figma plugin API with only what the text-style and
// fingerprint scripts call, so a test can run the rendered code.
type StubStyle = Record<string, unknown> & { id: string; name: string }
function stubFigma(styles: StubStyle[]) {
  const font = { id: 'V:font', name: 'font/sans', resolvedType: 'STRING', variableCollectionId: 'C:theme', scopes: ['FONT_FAMILY'], codeSyntax: {}, hiddenFromPublishing: false, description: '', valuesByMode: { m: 'Geist' } }
  return {
    styles,
    variables: {
      getLocalVariablesAsync: () => Promise.resolve([font]),
      getLocalVariableCollectionsAsync: () => Promise.resolve([{ id: 'C:theme', name: 'Theme', modes: [{ modeId: 'm', name: 'Viewscreen' }] }]),
    },
    getLocalTextStylesAsync: () => Promise.resolve(styles),
    getLocalEffectStylesAsync: () => Promise.resolve([]),
    loadFontAsync: () => Promise.resolve(),
    createTextStyle: () => {
      const s: StubStyle = {
        id: `S:${String(styles.length)}`, name: '', boundVariables: {},
        setBoundVariable: (k: string, v: { id: string } | null) => {
          const rest = Object.entries(record(s['boundVariables'])).filter(([key]) => key !== k)
          s['boundVariables'] = Object.fromEntries(v ? [...rest, [k, { id: v.id }]] : rest)
        },
      }
      styles.push(s)
      return s
    },
  }
}
// use_figma runs a script as the body of an async function with figma in scope.
const run = async (code: string, figma: unknown): Promise<unknown> => {
  const result: unknown = runInNewContext(`(async () => {\n${code}\n})()`, { figma })
  return await result
}
const textScript = (d: FigmaTokens) => renderScripts(d).find((s) => s.file === 'text-styles.js')?.code ?? ''
const fingerprint = (d: FigmaTokens) => renderScripts(d).find((s) => s.file === 'fingerprint.js')?.code ?? ''
const sansOnly = (): FigmaTokens => ({ ...doc, collections: [], effectStyles: [], textStyles: doc.textStyles.filter((t) => t.fontFamilyVariable === 'font/sans') })
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null
const record = (x: unknown): Record<string, unknown> => (typeof x === 'object' && x !== null ? Object.fromEntries(Object.entries(x)) : {})
// The stub has one font variable that sansOnly() does not export, so these tests compare the styles only.
const stylesOf = (x: unknown) => Object.fromEntries(Object.entries(record(x)).filter(([k]) => k.startsWith('style|')))

void test('exports the uppercase transform as the UPPER text case (Codex review of #14)', () => {
  assert.equal(doc.textStyles.find((t) => t.name === 'text/eyebrow')?.textCase, 'UPPER')
  assert.ok(doc.textStyles.filter((t) => t.name !== 'text/eyebrow').every((t) => t.textCase === 'ORIGINAL'))
})

void test('the written text styles match their expected hashes, text case included', async () => {
  const d = sansOnly()
  const figma = stubFigma([])
  // JSON makes the reply, built in the script's own realm, comparable here.
  assert.deepEqual(JSON.parse(JSON.stringify(await run(textScript(d), figma))), { created: d.textStyles.length, updated: 0, total: d.textStyles.length, effectStyles: { created: 0, updated: 0, total: 0 } })
  const expected = expectedHashes(d)
  const got = stylesOf(await run(fingerprint(d), figma))
  assert.deepEqual(compareHashes(expected, got), [])
  const first = figma.styles[0]
  assert.ok(first)
  first['textCase'] = first['textCase'] === 'UPPER' ? 'ORIGINAL' : 'UPPER'
  assert.deepEqual(compareHashes(expected, stylesOf(await run(fingerprint(d), figma))), [`changed style|${first.name}`])
})

void test('the fingerprint sees the letter-spacing unit and survives an AUTO line height', async () => {
  const d = sansOnly()
  const figma = stubFigma([])
  await run(textScript(d), figma)
  const expected = expectedHashes(d)
  const [a, b] = figma.styles
  assert.ok(a && b)
  a['letterSpacing'] = { ...record(a['letterSpacing']), unit: 'PERCENT' }
  b['lineHeight'] = { unit: 'AUTO' }
  assert.deepEqual(compareHashes(expected, stylesOf(await run(fingerprint(d), figma))).sort(), [`changed style|${a.name}`, `changed style|${b.name}`].sort())
})

void test('a second text style with the same name is extra in the fingerprint and stops the write', async () => {
  const d = sansOnly()
  const figma = stubFigma([])
  await run(textScript(d), figma)
  const first = figma.styles[0]
  assert.ok(first)
  figma.styles.push({ ...first, id: 'S:twin', fontSize: 99 })
  assert.deepEqual(compareHashes(expectedHashes(d), stylesOf(await run(fingerprint(d), figma))), [`extra style|${first.name}|duplicate|S:twin`])
  await assert.rejects(run(textScript(d), figma), /same name: .*S:twin/)
})

void test('rejects a text style that differs between themes', () => {
  const theme = themes[0]?.json
  const second = structuredClone(theme)
  const text = record(record(second)['text'])
  const heading = record(text['eyebrow'])
  heading['$value'] = { ...record(heading['$value']), fontSize: { value: 32, unit: 'px' } }
  text['eyebrow'] = heading
  assert.throws(() => exportTokens({ themes: [{ name: 'a', json: theme }, { name: 'b', json: { ...record(second), text } }], layout: {}, commit: '', tokensSha256: '' }), /text\/eyebrow differs between themes/)
})

void test('a text decoration or paragraph spacing left in Figma changes the hash, and a rerun resets it', async () => {
  const d = sansOnly()
  const figma = stubFigma([])
  await run(textScript(d), figma)
  const first = figma.styles[0]
  assert.ok(first)
  first['textDecoration'] = 'STRIKETHROUGH'
  first['paragraphSpacing'] = 40
  assert.deepEqual(compareHashes(expectedHashes(d), stylesOf(await run(fingerprint(d), figma))), [`changed style|${first.name}`])
  await run(textScript(d), figma)
  assert.deepEqual(compareHashes(expectedHashes(d), stylesOf(await run(fingerprint(d), figma))), [])
})

// A stub of the variables API for the upsert scripts: one collection with
// one mode, holding the variables a test gives it.
type StubVar = { id: string; name: string; resolvedType: string; variableCollectionId: string; codeSyntax: Record<string, string>; [k: string]: unknown }
function stubVariables(name: string, mode: string, vars: { name: string; type: string; web?: string }[]) {
  const col = { id: 'C:1', name, modes: [{ modeId: 'm1', name: mode }], hiddenFromPublishing: false, renamed: false, renameMode: () => (col.renamed = true), addMode: () => 'm2' }
  const cols: (typeof col)[] = [col]
  const all: StubVar[] = vars.map((v, i) => ({
    id: `V:${String(i)}`, name: v.name, resolvedType: v.type, variableCollectionId: col.id, scopes: [], description: '', hiddenFromPublishing: false,
    valuesByMode: {}, codeSyntax: v.web === undefined ? {} : { WEB: v.web },
  }))
  for (const v of all) {
    v['setVariableCodeSyntax'] = (_: string, w: string) => (v.codeSyntax = { WEB: w })
    v['removeVariableCodeSyntax'] = () => (v.codeSyntax = {})
    v['setValueForMode'] = () => undefined
  }
  return {
    all,
    col,
    cols,
    variables: {
      getLocalVariableCollectionsAsync: () => Promise.resolve(cols),
      getLocalVariablesAsync: () => Promise.resolve(all),
      createVariableCollection: () => col,
      createVariable: () => fail('the stub creates no variables'),
    },
    getLocalTextStylesAsync: () => Promise.resolve([]),
    getLocalEffectStylesAsync: () => Promise.resolve([]),
  }
}
const fail = (m: string): never => {
  throw new Error(m)
}
const layoutScript = renderScripts(doc).find((s) => s.file === 'layout.js')?.code ?? ''
const layoutVars = collection(doc, 'Layout')?.variables ?? []

void test('the upsert stops before any change when two variables share a name (Codex review of #14)', async () => {
  const [first] = layoutVars
  assert.ok(first)
  // The one mode is named Mode 1, so the script would rename it; it must stop first.
  const figma = stubVariables('Layout', 'Mode 1', [...layoutVars.map((v) => ({ name: v.name, type: v.type })), { name: first.name, type: first.type }])
  await assert.rejects(run(layoutScript, figma), new RegExp(`same name in Layout: ${first.name} V:0`))
  assert.equal(figma.col.renamed, false)
  const got = record(await run(fingerprint(doc), figma))
  assert.ok(`var|Layout|${first.name}|duplicate|V:${String(layoutVars.length)}` in got)
})

void test('the upsert removes a WEB code syntax that the tokens do not set', async () => {
  // The dark and light primitives have no WEB syntax in the tokens.
  const themeVars = collection(doc, 'Theme')?.variables ?? []
  assert.ok(themeVars.some((v) => v.web === undefined))
  const figma = stubVariables('Theme', 'Viewscreen', themeVars.map((v) => ({ name: v.name, type: v.type, web: 'var(--obsolete)' })))
  await run(renderScripts(doc).find((s) => s.file === 'theme.js')?.code ?? '', figma)
  for (const [i, v] of figma.all.entries()) {
    const web = themeVars[i]?.web
    assert.deepEqual(v.codeSyntax, web === undefined ? {} : { WEB: web }, v.name)
  }
})

void test('the upsert stops before any change when two collections share a name (Codex round 3)', async () => {
  const figma = stubVariables('Layout', 'Mode 1', layoutVars.map((v) => ({ name: v.name, type: v.type })))
  figma.cols.push({ ...figma.col, id: 'C:2' })
  await assert.rejects(run(layoutScript, figma), /Collections with the same name: Layout C:1, Layout C:2/)
  assert.equal(figma.col.renamed, false)
  assert.ok('col|Layout|duplicate|C:2' in record(await run(fingerprint(doc), figma)))
})

void test('a collection hidden from publishing changes the hash, and the upsert shows it again (Codex round 3)', async () => {
  const figma = stubVariables('Layout', 'Value', layoutVars.map((v) => ({ name: v.name, type: v.type })))
  const want = expectedHashes(doc)['col|Layout']
  assert.equal(record(await run(fingerprint(doc), figma))['col|Layout'], want)
  figma.col.hiddenFromPublishing = true
  assert.notEqual(record(await run(fingerprint(doc), figma))['col|Layout'], want)
  await run(layoutScript, figma)
  assert.equal(figma.col.hiddenFromPublishing, false)
})

void test('a text wrap style or an extra variable binding changes the hash, and a rerun resets both (Codex round 3)', async () => {
  const d = sansOnly()
  const figma = stubFigma([])
  await run(textScript(d), figma)
  const [a, b] = figma.styles
  assert.ok(a && b)
  a['textWrapStyle'] = 'BALANCE'
  b['boundVariables'] = { ...record(b['boundVariables']), fontSize: { id: 'V:size' } }
  assert.deepEqual(compareHashes(expectedHashes(d), stylesOf(await run(fingerprint(d), figma))).sort(), [`changed style|${a.name}`, `changed style|${b.name}`].sort())
  await run(textScript(d), figma)
  assert.equal(a['textWrapStyle'], 'AUTO')
  assert.deepEqual(Object.keys(record(b['boundVariables'])), ['fontFamily'])
  assert.deepEqual(compareHashes(expectedHashes(d), stylesOf(await run(fingerprint(d), figma))), [])
})

void test('exports each shadow as an effect style bound to a Color variable that follows Dark and Light', () => {
  const shadows = ['shadow/overlay', 'shadow/dialog', 'shadow/lift']
  assert.deepEqual(doc.effectStyles.map((e) => e.name), shadows)
  assert.deepEqual(doc.notExported, [])
  const overlay = doc.effectStyles[0]
  assert.deepEqual(overlay, { name: 'shadow/overlay', type: 'DROP_SHADOW', description: 'Popovers, menus, pickers and sheets.', colorVariable: 'shadow/overlay', offsetX: 0, offsetY: 12, radius: 32, spread: 0 })
  const colour = collection(doc, 'Color')?.variables.find((v) => v.name === 'shadow/overlay')
  assert.deepEqual(colour?.aliases, { Dark: 'dark/shadow/overlay', Light: 'light/shadow/overlay' })
  assert.deepEqual(colour.scopes, ['EFFECT_COLOR'])
  const theme = collection(doc, 'Theme')?.variables ?? []
  assert.deepEqual(theme.find((v) => v.name === 'dark/shadow/overlay')?.values, { Viewscreen: { r: 0, g: 0, b: 0, a: 0.55 } })
  assert.deepEqual(theme.find((v) => v.name === 'light/shadow/overlay')?.values, { Viewscreen: { r: 0, g: 0, b: 0, a: 0.14 } })
  for (const name of shadows) assert.equal(theme.find((v) => v.name === `light/${name}`)?.hidden, true, name)
})

void test('rejects a shadow whose offset, blur or spread differs between dark and light', () => {
  const theme = structuredClone(themes[0]?.json)
  // Walk to light.shadow.lift in place; record() would copy.
  const at = (x: unknown, key: string): unknown => (isObject(x) ? x[key] : undefined)
  const lift = at(at(at(theme, 'light'), 'shadow'), 'lift')
  assert.ok(isObject(lift))
  lift['$value'] = { ...record(lift['$value']), blur: { value: 99, unit: 'px' } }
  assert.throws(() => exportTokens({ themes: [{ name: 'a', json: theme }], layout: {}, commit: '', tokensSha256: '' }), /shadow\/lift has another inset, offset, blur or spread in light\/shadow\/lift/)
})

// A stub with the Color collection's shadow variables and the effect-style API.
function stubEffects(d: FigmaTokens) {
  const col = { id: 'C:color', name: 'Color', modes: [{ modeId: 'd', name: 'Dark' }], hiddenFromPublishing: false }
  const vars = d.effectStyles.map((e) => ({ id: `V:${e.colorVariable}`, name: e.colorVariable, resolvedType: 'COLOR', variableCollectionId: col.id, scopes: [], codeSyntax: {}, hiddenFromPublishing: false, description: '', valuesByMode: { d: { r: 0, g: 0, b: 0, a: 0.5 } } }))
  const effects: StubStyle[] = []
  return {
    effects,
    variables: {
      getLocalVariablesAsync: () => Promise.resolve(vars),
      getLocalVariableCollectionsAsync: () => Promise.resolve([col]),
      setBoundVariableForEffect: (e: Record<string, unknown>, field: string, v: { id: string }) => ({ ...e, boundVariables: { [field]: { type: 'VARIABLE_ALIAS', id: v.id } } }),
    },
    getLocalTextStylesAsync: () => Promise.resolve([]),
    getLocalEffectStylesAsync: () => Promise.resolve(effects),
    createEffectStyle: () => {
      const s: StubStyle = { id: `E:${String(effects.length)}`, name: '', effects: [], description: '' }
      effects.push(s)
      return s
    },
  }
}
const effectsOnly = (): FigmaTokens => ({ ...doc, collections: [], textStyles: [] })
const effectsOf = (x: unknown) => Object.fromEntries(Object.entries(record(x)).filter(([k]) => k.startsWith('effect|')))

void test('the written effect styles match their expected hashes, and a changed blur or an unbound colour does not', async () => {
  const d = effectsOnly()
  const figma = stubEffects(d)
  const reply = record(await run(textScript(d), figma))
  assert.deepEqual(record(reply['effectStyles']), { created: 3, updated: 0, total: 3 })
  assert.deepEqual(compareHashes(expectedHashes(d), effectsOf(await run(fingerprint(d), figma))), [])
  const [a, b] = figma.effects
  assert.ok(a && b)
  const shadowA = record(Array.isArray(a['effects']) ? a['effects'][0] : undefined)
  const shadowB = record(Array.isArray(b['effects']) ? b['effects'][0] : undefined)
  a['effects'] = [{ ...shadowA, radius: 1 }]
  b['effects'] = [{ ...shadowB, boundVariables: {} }]
  assert.deepEqual(compareHashes(expectedHashes(d), effectsOf(await run(fingerprint(d), figma))).sort(), [`changed effect|${a.name}`, `changed effect|${b.name}`].sort())
  assert.deepEqual(record(record(await run(textScript(d), figma))['effectStyles']), { created: 0, updated: 3, total: 3 })
  assert.deepEqual(compareHashes(expectedHashes(d), effectsOf(await run(fingerprint(d), figma))), [])
})

void test('the effect styles stop before any change when a Color variable is missing or a style name is taken twice (Codex review of #70)', async () => {
  const d = effectsOnly()
  const figma = stubEffects(d)
  // Only the last style's variable is missing, so a write-then-check script would create the first two.
  const present = await figma.variables.getLocalVariablesAsync()
  figma.variables.getLocalVariablesAsync = () => Promise.resolve(present.filter((v) => v.name !== 'shadow/lift'))
  await assert.rejects(run(textScript(d), figma), /Missing Color variable shadow\/lift/)
  assert.equal(figma.effects.length, 0)
  const ok = stubEffects(d)
  await run(textScript(d), ok)
  const first = ok.effects[0]
  assert.ok(first)
  ok.effects.push({ ...first, id: 'E:twin' })
  await assert.rejects(run(textScript(d), ok), /Effect styles with the same name: shadow\/overlay/)
  assert.ok(`effect|${first.name}|duplicate|E:twin` in record(await run(fingerprint(d), ok)))
})

void test('exports an inset shadow as an inner shadow, and its hash sees the type (Codex review of #70)', async () => {
  const theme = structuredClone(themes[0]?.json)
  const at = (x: unknown, key: string): unknown => (isObject(x) ? x[key] : undefined)
  for (const scheme of ['dark', 'light']) {
    const lift = at(at(at(theme, scheme), 'shadow'), 'lift')
    assert.ok(isObject(lift))
    lift['$value'] = { ...record(lift['$value']), inset: true }
  }
  const d = exportTokens({ themes: [{ name: 'viewscreen', json: theme }], layout: {}, commit: '', tokensSha256: '' })
  assert.equal(d.effectStyles.find((e) => e.name === 'shadow/lift')?.type, 'INNER_SHADOW')
  const only = { ...d, collections: [], textStyles: [] }
  const figma = stubEffects(only)
  await run(textScript(only), figma)
  assert.deepEqual(compareHashes(expectedHashes(only), effectsOf(await run(fingerprint(only), figma))), [])
  assert.notEqual(expectedHashes(only)['effect|shadow/lift'], expectedHashes(effectsOnly())['effect|shadow/lift'])
  const dark = at(at(at(theme, 'dark'), 'shadow'), 'lift')
  assert.ok(isObject(dark))
  dark['$value'] = { ...record(dark['$value']), inset: false }
  assert.throws(() => exportTokens({ themes: [{ name: 'viewscreen', json: theme }], layout: {}, commit: '', tokensSha256: '' }), /shadow\/lift has another inset/)
})

void test('the fingerprint hashes an effect style with a noise effect, which has no radius (Codex review of #70)', async () => {
  const d = effectsOnly()
  const figma = stubEffects(d)
  await run(textScript(d), figma)
  figma.effects.push({ id: 'E:noise', name: 'other/noise', description: '', effects: [{ type: 'NOISE', noiseType: 'MONOTONE', noiseSize: 1, density: 0.5, visible: true, blendMode: 'NORMAL', color: { r: 0, g: 0, b: 0, a: 1 } }] })
  assert.deepEqual(compareHashes(expectedHashes(d), effectsOf(await run(fingerprint(d), figma))), ['extra effect|other/noise'])
})
