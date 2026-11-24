#!/usr/bin/env node
// Builds the Panda preset from the DTCG tokens and checks them.
//   node tokens/build.ts              check, then write the outputs
//   node tokens/build.ts --check      check, and fail if an output is out of date
//   node tokens/build.ts --dir <path> use the tokens in <path> and write the
//                                      outputs to <path>/generated (for tests)
// Prints one JSON object. Exits 1 if a check fails.
//
// Checks, for every theme, mode and text size the resolver lists:
//   complete    every theme, mode and size has the same tokens, with the same types
//   layout      spacing, sizes, durations and easings have the same value in
//               every theme, mode and size
//   size        a text size changes only the font size and line height of
//               text styles
//   grid        every text style's line height is a whole multiple of 4 px
//   described   every token has a $description (in the default theme and mode)
//   colorspace  every colour, also inside a shadow, is in srgb
//   hex         a colour's hex matches its components, also inside a shadow
//   canvas      color.bg.canvas is opaque, since contrast is measured on it
//   contrast    each pair in contrast.json meets its minimum
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parse, defineConfig, Logger } from '@terrazzo/parser'
import type { TokenNormalized, TokenNormalizedSet } from '@terrazzo/parser'

type Colour = Extract<TokenNormalized, { $type: 'color' }>['$value']
type Shadow = Extract<TokenNormalized, { $type: 'shadow' }>['$value'][number]
type Typography = Extract<TokenNormalized, { $type: 'typography' }>['$value']
type Dimension = Shadow['blur']
type Duration = Extract<TokenNormalized, { $type: 'duration' }>['$value']
type CubicBezier = Extract<TokenNormalized, { $type: 'cubicBezier' }>['$value']
type Problem = { check: string; detail: string }
type Pair = { fg: string; on: string[]; min: number }
type Rgb = [number, number, number]
type Leaf = { value: unknown; description?: string }
type Tree = { [key: string]: Tree | Leaf }

const args = process.argv.slice(2)
const check = args.includes('--check')
const dirArg = args.includes('--dir') ? args[args.indexOf('--dir') + 1] : undefined
if (args.includes('--dir') && !dirArg) throw new Error('--dir needs a path')
const custom = dirArg ? resolve(dirArg) : null
const dir = custom ?? new URL('.', import.meta.url).pathname.replace(/\/$/, '')
const presetOut = join(dir, 'generated/preset.ts')
const docsOut = custom ? join(dir, 'generated/colours.mdx') : join(dir, '../src/foundations/colours.mdx')
const problems: Problem[] = []
const fail = (check: string, detail: string) => problems.push({ check, detail })

const config = defineConfig({ lint: { rules: {} } }, { cwd: new URL(`file://${dir}/`) })
const src = readFileSync(join(dir, 'resolver.json'), 'utf8')
const { resolver } = await parse([{ src, filename: new URL(`file://${dir}/resolver.json`) }], { config, logger: new Logger({ level: 'error' }) })
const themeModifier = resolver.source.modifiers?.['theme']
const modeModifier = resolver.source.modifiers?.['mode']
const sizeModifier = resolver.source.modifiers?.['size']
if (!themeModifier || !modeModifier || !sizeModifier) throw new Error('resolver.json needs a theme, a mode and a size modifier')
const themes = Object.keys(themeModifier.contexts)
const modes = Object.keys(modeModifier.contexts)
const sizes = Object.keys(sizeModifier.contexts)
const defaultTheme = themeModifier.default ?? themes[0]
const defaultMode = modeModifier.default ?? modes[0]
const defaultSize = sizeModifier.default ?? sizes[0]
if (!defaultTheme || !defaultMode || !defaultSize) throw new Error('resolver.json lists no theme, no mode or no size')
// The other text sizes, each with the Panda condition and the class on
// <html> that picks it: size default is _textDefault and .text-default.
const otherSizes = sizes.filter((s) => s !== defaultSize).map((s) => ({ size: s, condition: `text${s.charAt(0).toUpperCase()}${s.slice(1)}`, className: `text-${s}` }))

// Tokens under dark.* and light.* are the raw mode groups, and those under
// default.* and large.* the raw size groups; modes/*.json and sizes/*.json
// extend them into color.*, shadow.* and text.*, so only the extended
// copies ship.
const isRaw = (id: string) => [...modes, ...sizes].some((m) => id.startsWith(`${m}.`))
const sets: Record<string, TokenNormalizedSet> = {}
for (const theme of themes) for (const mode of modes) for (const size of sizes) {
  const all = resolver.apply({ theme, mode, size })
  sets[`${theme}/${mode}/${size}`] = Object.fromEntries(Object.entries(all).filter(([id]) => !isRaw(id)))
}
const setOf = (theme: string, mode: string, size = defaultSize): TokenNormalizedSet => {
  const set = sets[`${theme}/${mode}/${size}`]
  if (!set) throw new Error(`no token set for ${theme}/${mode}/${size}`)
  return set
}
const base = setOf(defaultTheme, defaultMode)
// Layout and motion tokens: no theme or mode may change them (d-035).
const fixedPrefixes = ['spacing.', 'size.', 'duration.', 'easing.']
const isLayout = (id: string) => fixedPrefixes.some((p) => id.startsWith(p))

// complete, layout
for (const [key, set] of Object.entries(sets)) {
  for (const id of Object.keys(base)) {
    const want = base[id]
    const got = set[id]
    if (!want) continue
    if (!got) fail('complete', `${key} has no ${id}`)
    else if (got.$type !== want.$type) fail('complete', `${key} ${id} is ${got.$type}, not ${want.$type}`)
    else if (isLayout(id) && JSON.stringify(got.$value) !== JSON.stringify(want.$value)) {
      fail('layout', `${key} changes ${id}; spacing, sizes, durations and easings are the same in every theme, mode and size (d-035)`)
    }
  }
  for (const id of Object.keys(set)) if (!base[id]) fail('complete', `${key} has ${id}, which ${defaultTheme}/${defaultMode} lacks`)
}
// size: a text size set differs from its theme and mode only in the font
// size and line height of text styles.
const sizeFree = (t: TokenNormalized): unknown => {
  if (t.$type !== 'typography') return t.$value
  const { fontFamily, fontWeight, letterSpacing } = t.$value
  return { fontFamily, fontWeight, letterSpacing }
}
for (const theme of themes) for (const mode of modes) for (const { size } of otherSizes) {
  const plain = setOf(theme, mode)
  for (const [id, t] of Object.entries(setOf(theme, mode, size))) {
    const want = plain[id]
    if (want && JSON.stringify(sizeFree(t)) !== JSON.stringify(sizeFree(want))) {
      fail('size', `${theme}/${mode}/${size} changes ${t.$type === 'typography' ? `more than the font size and line height of ${id}` : id}; a text size changes only those`)
    }
  }
}
// grid: a line height is a ratio of the font size, rounded up to 4 places
// so the browser lays out at least the whole px (d-100); it must land on a
// multiple of 4 or less than 0.01 px over it, never under it.
for (const [key, set] of Object.entries(sets)) for (const [id, t] of Object.entries(set)) {
  if (t.$type !== 'typography') continue
  const { fontSize, lineHeight } = t.$value
  const px = typeof lineHeight === 'number' ? fontSize.value * lineHeight : lineHeight.value
  if (fontSize.unit !== 'px' || (typeof lineHeight !== 'number' && lineHeight.unit !== 'px')) fail('grid', `${key} ${id} is not in px`)
  else if (px - Math.floor(px / 4 + 1e-9) * 4 >= 0.01) fail('grid', `${key} ${id} has a line height of ${px.toFixed(4)} px, not a multiple of 4 or just over one`)
}
// described
for (const [id, t] of Object.entries(base)) if (!t.$description?.trim()) fail('described', `${id} has no $description`)
// colorspace, hex: every colour value, including the colour of each shadow layer
const components = (c: Colour): Rgb => {
  const [r, g, b] = c.components
  if (r == null || g == null || b == null) throw new Error(`a colour has a missing component: ${JSON.stringify(c)}`)
  return [r, g, b]
}
const toHex = (c: Colour) => '#' + components(c).map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')
const coloursOf = (t: TokenNormalized): [string, Colour][] => {
  if (t.$type === 'color') return [['', t.$value]]
  if (t.$type === 'shadow') return t.$value.map((s, i): [string, Colour] => [` shadow layer ${String(i)}`, s.color])
  return []
}
for (const [key, set] of Object.entries(sets)) for (const [id, t] of Object.entries(set)) {
  for (const [where, c] of coloursOf(t)) {
    if (c.colorSpace !== 'srgb') fail('colorspace', `${key} ${id}${where} is in ${c.colorSpace}; use srgb`)
    else if (c.hex && toHex(c) !== c.hex.toLowerCase()) fail('hex', `${key} ${id}${where}: hex ${c.hex} but components give ${toHex(c)}`)
  }
}
// canvas, contrast
const colourOf = (set: TokenNormalizedSet, id: string): Colour | undefined => {
  const t = set[`color.${id}`]
  return t?.$type === 'color' ? t.$value : undefined
}
const rgb = (c: Colour) => ({ c: components(c), a: c.alpha })
// A browser stores each blended colour as 8-bit channels, so round the same
// way; otherwise the build can pass a pair that axe fails by 0.01.
const blend = (v: number, under: number, a: number) => Math.round((v * a + under * (1 - a)) * 255) / 255
const over = (top: { c: Rgb; a: number }, bottom: Rgb): Rgb => [
  blend(top.c[0], bottom[0], top.a),
  blend(top.c[1], bottom[1], top.a),
  blend(top.c[2], bottom[2], top.a),
]
const linear = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const lum = ([r, g, b]: Rgb) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
const ratio = (a: Rgb, b: Rgb) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)
// contrast.json is data from outside the code, so parse it before use.
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const isName = (s: unknown): s is string => typeof s === 'string' && s.trim() !== ''
const isPair = (v: unknown): v is Pair =>
  isRecord(v) && isName(v['fg']) && typeof v['min'] === 'number' &&
  Array.isArray(v['on']) && v['on'].length > 0 &&
  v['on'].every((s) => typeof s === 'string' && s.split('@').every(isName))
const parsePairs = (text: string): Pair[] => {
  const data: unknown = JSON.parse(text)
  if (!isRecord(data) || !Array.isArray(data['pairs'])) throw new Error('contrast.json needs a "pairs" array')
  const found: unknown[] = data['pairs']
  const bad = found.findIndex((p) => !isPair(p))
  if (bad >= 0) throw new Error(`contrast.json pair ${String(bad)} needs fg (a token name), on (a non-empty list of token names or stacks) and min (number)`)
  return found.filter(isPair)
}
const pairs = parsePairs(readFileSync(join(dir, 'contrast.json'), 'utf8'))
let measured = 0
// The size check keeps colours the same in every text size, so contrast is
// measured on the default size only.
for (const [key, set] of Object.entries(sets).filter(([k]) => k.endsWith(`/${defaultSize}`))) {
  const canvasColour = colourOf(set, 'bg.canvas')
  if (!canvasColour) { fail('canvas', `${key} has no color.bg.canvas`); continue }
  if (canvasColour.alpha !== 1) { fail('canvas', `${key} color.bg.canvas has alpha ${String(canvasColour.alpha)}; it must be opaque`); continue }
  const canvas = components(canvasColour)
  for (const p of pairs) for (const bg of p.on) {
    const ids = [p.fg, ...bg.split('@')]
    const missing = ids.find((id) => !colourOf(set, id))
    if (missing !== undefined) { fail('contrast', `${key}: contrast.json names color.${missing}, which is not a colour token`); continue }
    let back = canvas
    for (const id of bg.split('@').reverse()) {
      const c = colourOf(set, id)
      if (c) back = over(rgb(c), back)
    }
    const fg = colourOf(set, p.fg)
    if (!fg) continue
    const r = ratio(over(rgb(fg), back), back)
    measured++
    if (r < p.min) fail('contrast', `${key}: ${p.fg} on ${bg} is ${r.toFixed(2)}, needs ${String(p.min)}`)
  }
}

const report = () => {
  console.log(JSON.stringify({ ok: problems.length === 0, themes, modes, sizes, tokens: Object.keys(base).length, contrastPairs: measured, problems }, null, 1))
  process.exit(problems.length ? 1 : 0)
}
// The outputs are built only from tokens that passed every check.
if (problems.length) report()

// emit
const css = {
  color: (v: Colour) => {
    const [r, g, b] = components(v).map((x) => Math.round(x * 255))
    return v.alpha === 1 ? toHex(v) : `rgba(${String(r)}, ${String(g)}, ${String(b)}, ${String(v.alpha)})`
  },
  dimension: (v: Dimension) => `${String(v.value)}${v.unit}`,
  duration: (v: Duration) => `${String(v.value)}${v.unit}`,
  cubicBezier: (v: CubicBezier) => `cubic-bezier(${v.map((n) => String(n)).join(', ')})`,
  fontFamily: (v: Typography['fontFamily']) => [v].flat().map((f) => (/\s/.test(f) ? `"${f}"` : f)).join(', '),
  lineHeight: (v: Typography['lineHeight']) => (typeof v === 'number' ? String(v) : css.dimension(v)),
  shadow: (v: Shadow[]) => v.map((s) => `${s.inset ? 'inset ' : ''}${css.dimension(s.offsetX)} ${css.dimension(s.offsetY)} ${css.dimension(s.blur)} ${css.dimension(s.spread)} ${css.color(s.color)}`).join(', '),
}
// The CSS value of every token type the tokens use. A new type fails here
// until it gets a formatter.
const cssValue = (t: TokenNormalized): string => {
  switch (t.$type) {
    case 'color': return css.color(t.$value)
    case 'dimension': return css.dimension(t.$value)
    case 'number': return String(t.$value)
    case 'shadow': return css.shadow(t.$value)
    case 'fontFamily': return css.fontFamily(t.$value)
    case 'fontWeight': return String(t.$value)
    case 'duration': return css.duration(t.$value)
    case 'cubicBezier': return css.cubicBezier(t.$value)
    case 'boolean': case 'border': case 'gradient':
    case 'link': case 'string': case 'strokeStyle': case 'transition': case 'typography':
      throw new Error(`${t.id}: no CSS formatter for $type ${t.$type}`)
  }
}
const category = (id: string): [string, string] => {
  const map: [string, string][] = [['color.', 'colors'], ['shadow.', 'shadows'], ['radius.', 'radii'], ['borderWidth.', 'borderWidths'], ['blur.', 'blurs'], ['opacity.', 'opacity'], ['font.family.', 'fonts'], ['text.', 'text'], ['spacing.', 'spacing'], ['size.', 'sizes'], ['duration.', 'durations'], ['easing.', 'easings']]
  const hit = map.find(([prefix]) => id.startsWith(prefix))
  if (!hit) throw new Error(`no Panda category for ${id}`)
  return [hit[1], id.slice(hit[0].length)]
}
// A group may hold a child named "value", so a leaf is known by where it
// came from, not by its shape: leaf() records each one it makes.
const leaves = new WeakSet<object>()
const isLeaf = (node: Tree | Leaf): node is Leaf => leaves.has(node)
const branch = (tree: Tree, key: string): Tree => {
  const node = tree[key] ?? {}
  if (isLeaf(node)) throw new Error(`token path ${key} is both a token and a group`)
  tree[key] = node
  return node
}
const put = (tree: Tree, path: string, leaf: Leaf) => {
  const parts = path.split('.')
  const last = parts.pop()
  if (last === undefined) throw new Error('empty token path')
  let node = tree
  for (const p of parts) node = branch(node, p)
  node[last] = leaf
}
const leaf = (value: unknown, description: string | undefined): Leaf => {
  const node: Leaf = description ? { value, description } : { value }
  leaves.add(node)
  return node
}
// The Panda categories of the fixed tokens, which ship as tokens, not semantic tokens.
const fixedCategories = ['spacing', 'sizes', 'durations', 'easings']
const modal = (light: string, dark: string) => (light === dark ? dark : { base: light, _dark: dark })
type Modal = ReturnType<typeof modal>
// A text part's value in each size: the default size's value as base, and
// each other size's value under its condition when it differs.
const sized = (part: (set: TokenNormalizedSet) => string, theme: string) => {
  const value = (size: string): Modal => modal(part(setOf(theme, 'light', size)), part(setOf(theme, 'dark', size)))
  const plain = value(defaultSize)
  const changed = otherSizes.map(({ size, condition }): [string, Modal] => [`_${condition}`, value(size)]).filter(([, v]) => JSON.stringify(v) !== JSON.stringify(plain))
  return changed.length ? { base: plain, ...Object.fromEntries(changed) } : plain
}

const tokens: Tree = {}
const textStyles: Record<string, { description: string | undefined; value: Record<string, string> }> = {}
const typographyOf = (set: TokenNormalizedSet, id: string): Typography => {
  const t = set[id]
  if (t?.$type !== 'typography') throw new Error(`${id} is not a typography token`)
  return t.$value
}
const tokenOf = (set: TokenNormalizedSet, id: string): TokenNormalized => {
  const t = set[id]
  if (!t) throw new Error(`no token ${id}`)
  return t
}
const semantic = (theme: string) => {
  const tree: Tree = {}
  const dark = setOf(theme, 'dark')
  const light = setOf(theme, 'light')
  for (const [id, t] of Object.entries(base)) {
    const [cat, name] = category(id)
    if (fixedCategories.includes(cat)) continue
    const desc = t.$description
    if (cat === 'text') {
      // Each part of a text style is its own semantic token, so a theme or
      // mode can change any part, the font family included.
      const parts: [string, (v: Typography) => string][] = [
        ['fonts', (v) => css.fontFamily(v.fontFamily)],
        ['fontSizes', (v) => css.dimension(v.fontSize)],
        ['lineHeights', (v) => css.lineHeight(v.lineHeight)],
        ['fontWeights', (v) => String(v.fontWeight)],
        ['letterSpacings', (v) => css.dimension(v.letterSpacing)],
      ]
      for (const [c, format] of parts) put(branch(tree, c), `text.${name}`, leaf(sized((set) => format(typographyOf(set, id)), theme), `Part of the ${name} text style. Use textStyle: '${name}', not this token.`))
      const transform = t.$extensions?.['com.eshelton328.textTransform']
      textStyles[name] = {
        description: desc,
        value: { fontFamily: `text.${name}`, fontSize: `text.${name}`, lineHeight: `text.${name}`, fontWeight: `text.${name}`, letterSpacing: `text.${name}`, ...(typeof transform === 'string' ? { textTransform: transform } : {}) },
      }
      continue
    }
    put(branch(tree, cat), name, leaf(modal(cssValue(tokenOf(light, id)), cssValue(tokenOf(dark, id))), desc))
  }
  return tree
}
for (const [id, t] of Object.entries(base)) {
  const [cat, name] = category(id)
  if (fixedCategories.includes(cat)) put(branch(tokens, cat), name, leaf(cssValue(t), t.$description))
}
const otherThemes = themes.filter((t) => t !== defaultTheme)
const preset = {
  name: 'component-library-1701',
  // A class on <html> picks a text size, as the dark class picks the mode:
  // `.text-default &` is the condition _textDefault.
  conditions: { extend: Object.fromEntries(otherSizes.map(({ condition, className }) => [condition, `.${className} &`])) },
  theme: { extend: { tokens, semanticTokens: semantic(defaultTheme), textStyles } },
  themes: Object.fromEntries(otherThemes.map((t) => [t, { semanticTokens: semantic(t) }])),
  // Panda writes a theme's CSS only when staticCss lists it; then
  // data-panda-theme="<name>" on the root switches to it.
  ...(otherThemes.length ? { staticCss: { themes: otherThemes } } : {}),
}
const text = `// Generated by tokens/build.ts from tokens/*.json. Do not edit; change the
// JSON and run \`pnpm tokens\`.
import { definePreset } from '@pandacss/dev'

export default definePreset(${JSON.stringify(preset, null, 2)})
`

// A docs page with each colour token's value in each mode, for review.
const groups: Record<string, { name: string; desc: string | undefined; values: Record<string, string> }[]> = {}
for (const [id, t] of Object.entries(base)) {
  if (t.$type !== 'color') continue
  const name = id.slice(6)
  const values = Object.fromEntries(modes.flatMap((m) => themes.map((th) => [themes.length > 1 ? `${th} ${m}` : m, cssValue(tokenOf(setOf(th, m), id))])))
  const group = name.split('.')[0] ?? name
  ;(groups[group] ??= []).push({ name, desc: t.$description, values })
}
// JSX expressions with JSON strings, so quotes and braces in a description
// cannot break the MDX.
const docs = `{/* Generated by tokens/build.ts. Do not edit; change tokens/*.json and run \`pnpm tokens\`. */}
import { Meta, ColorPalette, ColorItem } from '@storybook/addon-docs/blocks'

<Meta title="Foundations/Colours" />

# Colours

Each semantic colour token with its value in each mode. Components use only
these names, for example \`css({ color: 'fg.muted' })\`.

${Object.entries(groups).map(([g, items]) => `## ${g}

<ColorPalette>
${items.map((i) => `  <ColorItem title={${JSON.stringify(i.name)}} subtitle={${JSON.stringify(i.desc)}} colors={${JSON.stringify(i.values)}} />`).join('\n')}
</ColorPalette>
`).join('\n')}`

const outputs: [string, string][] = [[presetOut, text], [docsOut, docs]]
if (check) {
  for (const [file, body] of outputs) {
    if (!existsSync(file) || readFileSync(file, 'utf8') !== body) fail('generated', `${file} is out of date; run pnpm tokens`)
  }
} else {
  mkdirSync(join(dir, 'generated'), { recursive: true })
  for (const [file, body] of outputs) writeFileSync(file, body)
}
report()
