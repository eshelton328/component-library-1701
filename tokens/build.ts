#!/usr/bin/env node
// Builds the Panda preset from the DTCG tokens and checks them.
//   node tokens/build.ts              check, then write the outputs
//   node tokens/build.ts --check      check, and fail if an output is out of date
//   node tokens/build.ts --dir <path> use the tokens in <path> and write the
//                                      outputs to <path>/generated (for tests)
// Prints one JSON object. Exits 1 if a check fails.
//
// Checks, for every theme and mode the resolver lists:
//   complete    every theme and mode has the same tokens, with the same types
//   layout      spacing and sizes have the same value in every theme and mode
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
if (!themeModifier || !modeModifier) throw new Error('resolver.json needs a theme and a mode modifier')
const themes = Object.keys(themeModifier.contexts)
const modes = Object.keys(modeModifier.contexts)
const defaultTheme = themeModifier.default ?? themes[0]
const defaultMode = modeModifier.default ?? modes[0]
if (!defaultTheme || !defaultMode) throw new Error('resolver.json lists no theme or no mode')

// Tokens under dark.* and light.* are the raw mode groups; modes/*.json
// extend them into color.* and shadow.*, so only the extended copies ship.
const isRaw = (id: string) => modes.some((m) => id.startsWith(`${m}.`))
const sets: Record<string, TokenNormalizedSet> = {}
for (const theme of themes) for (const mode of modes) {
  const all = resolver.apply({ theme, mode })
  sets[`${theme}/${mode}`] = Object.fromEntries(Object.entries(all).filter(([id]) => !isRaw(id)))
}
const setOf = (theme: string, mode: string): TokenNormalizedSet => {
  const set = sets[`${theme}/${mode}`]
  if (!set) throw new Error(`no token set for ${theme}/${mode}`)
  return set
}
const base = setOf(defaultTheme, defaultMode)
const isLayout = (id: string) => id.startsWith('spacing.') || id.startsWith('size.')

// complete, layout
for (const [key, set] of Object.entries(sets)) {
  for (const id of Object.keys(base)) {
    const want = base[id]
    const got = set[id]
    if (!want) continue
    if (!got) fail('complete', `${key} has no ${id}`)
    else if (got.$type !== want.$type) fail('complete', `${key} ${id} is ${got.$type}, not ${want.$type}`)
    else if (isLayout(id) && JSON.stringify(got.$value) !== JSON.stringify(want.$value)) {
      fail('layout', `${key} changes ${id}; spacing and sizes are the same in every theme and mode (d-035)`)
    }
  }
  for (const id of Object.keys(set)) if (!base[id]) fail('complete', `${key} has ${id}, which ${defaultTheme}/${defaultMode} lacks`)
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
const isPair = (v: unknown): v is Pair =>
  isRecord(v) && typeof v['fg'] === 'string' && typeof v['min'] === 'number' &&
  Array.isArray(v['on']) && v['on'].every((s) => typeof s === 'string')
const parsePairs = (text: string): Pair[] => {
  const data: unknown = JSON.parse(text)
  if (!isRecord(data) || !Array.isArray(data['pairs'])) throw new Error('contrast.json needs a "pairs" array')
  const found: unknown[] = data['pairs']
  const bad = found.findIndex((p) => !isPair(p))
  if (bad >= 0) throw new Error(`contrast.json pair ${String(bad)} needs fg (string), on (string[]) and min (number)`)
  return found.filter(isPair)
}
const pairs = parsePairs(readFileSync(join(dir, 'contrast.json'), 'utf8'))
let measured = 0
for (const [key, set] of Object.entries(sets)) {
  const canvasColour = colourOf(set, 'bg.canvas')
  if (!canvasColour) { fail('canvas', `${key} has no color.bg.canvas`); continue }
  if (canvasColour.alpha !== 1) { fail('canvas', `${key} color.bg.canvas has alpha ${String(canvasColour.alpha)}; it must be opaque`); continue }
  const canvas = components(canvasColour)
  for (const p of pairs) for (const bg of p.on) {
    const ids = [p.fg, ...bg.split('@')]
    const missing = ids.find((id) => !colourOf(set, id))
    if (missing) { fail('contrast', `${key}: contrast.json names color.${missing}, which is not a colour token`); continue }
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
  console.log(JSON.stringify({ ok: problems.length === 0, themes, modes, tokens: Object.keys(base).length, contrastPairs: measured, problems }, null, 1))
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
    case 'boolean': case 'border': case 'cubicBezier': case 'duration': case 'gradient':
    case 'link': case 'string': case 'strokeStyle': case 'transition': case 'typography':
      throw new Error(`${t.id}: no CSS formatter for $type ${t.$type}`)
  }
}
const category = (id: string): [string, string] => {
  const map: [string, string][] = [['color.', 'colors'], ['shadow.', 'shadows'], ['radius.', 'radii'], ['borderWidth.', 'borderWidths'], ['blur.', 'blurs'], ['opacity.', 'opacity'], ['font.family.', 'fonts'], ['text.', 'text'], ['spacing.', 'spacing'], ['size.', 'sizes']]
  const hit = map.find(([prefix]) => id.startsWith(prefix))
  if (!hit) throw new Error(`no Panda category for ${id}`)
  return [hit[1], id.slice(hit[0].length)]
}
const isLeaf = (node: Tree | Leaf): node is Leaf => 'value' in node
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
const leaf = (value: unknown, description: string | undefined): Leaf => (description ? { value, description } : { value })
const modal = (light: string, dark: string) => (light === dark ? dark : { base: light, _dark: dark })

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
    if (cat === 'spacing' || cat === 'sizes') continue
    const desc = t.$description
    if (cat === 'text') {
      // Each part of a text style is its own semantic token, so a theme or
      // mode can change any part, the font family included.
      const d = typographyOf(dark, id)
      const l = typographyOf(light, id)
      const parts: [string, string, string][] = [
        ['fonts', css.fontFamily(l.fontFamily), css.fontFamily(d.fontFamily)],
        ['fontSizes', css.dimension(l.fontSize), css.dimension(d.fontSize)],
        ['lineHeights', css.lineHeight(l.lineHeight), css.lineHeight(d.lineHeight)],
        ['fontWeights', String(l.fontWeight), String(d.fontWeight)],
        ['letterSpacings', css.dimension(l.letterSpacing), css.dimension(d.letterSpacing)],
      ]
      for (const [c, lv, dv] of parts) put(branch(tree, c), `text.${name}`, leaf(modal(lv, dv), `Part of the ${name} text style. Use textStyle: '${name}', not this token.`))
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
  if (cat === 'spacing' || cat === 'sizes') put(branch(tokens, cat), name, leaf(cssValue(t), t.$description))
}
const otherThemes = themes.filter((t) => t !== defaultTheme)
const preset = {
  name: 'component-library-1701',
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
