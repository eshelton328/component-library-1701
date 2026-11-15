#!/usr/bin/env node
// Builds the Panda preset from the DTCG tokens and checks them.
//   node tokens/build.mjs              check, then write the outputs
//   node tokens/build.mjs --check      check, and fail if an output is out of date
//   node tokens/build.mjs --dir <path> use the tokens in <path> and write the
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

const args = process.argv.slice(2)
const check = args.includes('--check')
const custom = args.includes('--dir') ? resolve(args[args.indexOf('--dir') + 1]) : null
const dir = custom ?? new URL('.', import.meta.url).pathname.replace(/\/$/, '')
const presetOut = join(dir, 'generated/preset.ts')
const docsOut = custom ? join(dir, 'generated/colours.mdx') : join(dir, '../src/foundations/colours.mdx')
const problems = []
const fail = (check, detail) => problems.push({ check, detail })

const config = defineConfig({ lint: { rules: {} } }, { cwd: new URL(`file://${dir}/`) })
const src = readFileSync(join(dir, 'resolver.json'), 'utf8')
const { resolver } = await parse([{ src, filename: new URL(`file://${dir}/resolver.json`) }], { config, logger: new Logger({ level: 'error' }) })
const modifiers = resolver.source.modifiers
const themes = Object.keys(modifiers.theme.contexts)
const modes = Object.keys(modifiers.mode.contexts)
const defaultTheme = modifiers.theme.default ?? themes[0]
const defaultMode = modifiers.mode.default ?? modes[0]

// Tokens under dark.* and light.* are the raw mode groups; modes/*.json
// extend them into color.* and shadow.*, so only the extended copies ship.
const isRaw = (id) => modes.some((m) => id.startsWith(`${m}.`))
const sets = {}
for (const theme of themes) for (const mode of modes) {
  const all = resolver.apply({ theme, mode })
  sets[`${theme}/${mode}`] = Object.fromEntries(Object.entries(all).filter(([id]) => !isRaw(id)))
}
const base = sets[`${defaultTheme}/${defaultMode}`]
const isLayout = (id) => id.startsWith('spacing.') || id.startsWith('size.')

// complete, layout
for (const [key, set] of Object.entries(sets)) {
  for (const id of Object.keys(base)) {
    if (!set[id]) fail('complete', `${key} has no ${id}`)
    else if (set[id].$type !== base[id].$type) fail('complete', `${key} ${id} is ${set[id].$type}, not ${base[id].$type}`)
    else if (isLayout(id) && JSON.stringify(set[id].$value) !== JSON.stringify(base[id].$value)) {
      fail('layout', `${key} changes ${id}; spacing and sizes are the same in every theme and mode (d-035)`)
    }
  }
  for (const id of Object.keys(set)) if (!base[id]) fail('complete', `${key} has ${id}, which ${defaultTheme}/${defaultMode} lacks`)
}
// described
for (const [id, t] of Object.entries(base)) if (!t.$description?.trim()) fail('described', `${id} has no $description`)
// colorspace, hex: every colour value, including the colour of each shadow layer
const toHex = (c) => '#' + c.components.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')
const coloursOf = (t) => (t.$type === 'color' ? [['', t.$value]] : t.$type === 'shadow' ? [t.$value].flat().map((s, i) => [` shadow layer ${i}`, s.color]) : [])
for (const [key, set] of Object.entries(sets)) for (const [id, t] of Object.entries(set)) {
  for (const [where, c] of coloursOf(t)) {
    if (c.colorSpace !== 'srgb') fail('colorspace', `${key} ${id}${where} is in ${c.colorSpace}; use srgb`)
    else if (c.hex && toHex(c) !== c.hex.toLowerCase()) fail('hex', `${key} ${id}${where}: hex ${c.hex} but components give ${toHex(c)}`)
  }
}
// canvas, contrast
const rgb = (t) => ({ c: t.$value.components, a: t.$value.alpha ?? 1 })
// A browser stores each blended colour as 8-bit channels, so round the same
// way; otherwise the build can pass a pair that axe fails by 0.01.
const over = (top, bottom) => top.c.map((v, i) => Math.round((v * top.a + bottom[i] * (1 - top.a)) * 255) / 255)
const lum = (c) => {
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)
const { pairs } = JSON.parse(readFileSync(join(dir, 'contrast.json'), 'utf8'))
let measured = 0
for (const [key, set] of Object.entries(sets)) {
  const canvasToken = set['color.bg.canvas']
  if (!canvasToken) { fail('canvas', `${key} has no color.bg.canvas`); continue }
  if ((canvasToken.$value.alpha ?? 1) !== 1) { fail('canvas', `${key} color.bg.canvas has alpha ${canvasToken.$value.alpha}; it must be opaque`); continue }
  const canvas = canvasToken.$value.components
  const layer = (spec) => spec.split('@').reverse().reduce((below, id) => over(rgb(set[`color.${id}`]), below), canvas)
  for (const p of pairs) for (const bg of p.on) {
    const missing = [p.fg, ...bg.split('@')].find((id) => !set[`color.${id}`])
    if (missing) { fail('contrast', `${key}: contrast.json names color.${missing}, which does not exist`); continue }
    const back = layer(bg)
    const r = ratio(over(rgb(set[`color.${p.fg}`]), back), back)
    measured++
    if (r < p.min) fail('contrast', `${key}: ${p.fg} on ${bg} is ${r.toFixed(2)}, needs ${p.min}`)
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
  color: (v) => {
    const [r, g, b] = v.components.map((x) => Math.round(x * 255))
    const a = v.alpha ?? 1
    return a === 1 ? toHex(v) : `rgba(${r}, ${g}, ${b}, ${a})`
  },
  dimension: (v) => `${v.value}${v.unit}`,
  number: (v) => String(v),
  fontFamily: (v) => [v].flat().map((f) => (/\s/.test(f) ? `"${f}"` : f)).join(', '),
  shadow: (v) => [v].flat().map((s) => `${s.inset ? 'inset ' : ''}${css.dimension(s.offsetX)} ${css.dimension(s.offsetY)} ${css.dimension(s.blur)} ${css.dimension(s.spread)} ${css.color(s.color)}`).join(', '),
}
const category = (id) => {
  const map = [['color.', 'colors'], ['shadow.', 'shadows'], ['radius.', 'radii'], ['borderWidth.', 'borderWidths'], ['blur.', 'blurs'], ['opacity.', 'opacity'], ['font.family.', 'fonts'], ['text.', 'text'], ['spacing.', 'spacing'], ['size.', 'sizes']]
  const hit = map.find(([prefix]) => id.startsWith(prefix))
  if (!hit) throw new Error(`no Panda category for ${id}`)
  return [hit[1], id.slice(hit[0].length)]
}
const put = (tree, path, leaf) => {
  const parts = path.split('.')
  const last = parts.pop()
  for (const p of parts) tree = tree[p] ??= {}
  tree[last] = leaf
}
const leaf = (value, description) => (description ? { value, description } : { value })
const modal = (light, dark) => (light === dark ? dark : { base: light, _dark: dark })

const tokens = {}
const textStyles = {}
const semantic = (theme) => {
  const tree = {}
  const dark = sets[`${theme}/dark`]
  const light = sets[`${theme}/light`]
  for (const [id, t] of Object.entries(base)) {
    const [cat, name] = category(id)
    if (cat === 'spacing' || cat === 'sizes') continue
    const desc = t.$description
    if (cat === 'text') {
      // Each part of a text style is its own semantic token, so a theme or
      // mode can change any part, the font family included.
      const d = dark[id].$value
      const l = light[id].$value
      const parts = {
        fonts: [css.fontFamily(l.fontFamily), css.fontFamily(d.fontFamily)],
        fontSizes: [css.dimension(l.fontSize), css.dimension(d.fontSize)],
        lineHeights: [String(l.lineHeight), String(d.lineHeight)],
        fontWeights: [String(l.fontWeight), String(d.fontWeight)],
        letterSpacings: [css.dimension(l.letterSpacing), css.dimension(d.letterSpacing)],
      }
      for (const [c, [lv, dv]] of Object.entries(parts)) put(tree[c] ??= {}, `text.${name}`, leaf(modal(lv, dv), `Part of the ${name} text style. Use textStyle: '${name}', not this token.`))
      const transform = base[id].$extensions?.['com.eshelton328.textTransform']
      textStyles[name] = {
        description: desc,
        value: { fontFamily: `text.${name}`, fontSize: `text.${name}`, lineHeight: `text.${name}`, fontWeight: `text.${name}`, letterSpacing: `text.${name}`, ...(transform ? { textTransform: transform } : {}) },
      }
      continue
    }
    const fmt = css[t.$type]
    put(tree[cat] ??= {}, name, leaf(modal(fmt(light[id].$value), fmt(dark[id].$value)), desc))
  }
  return tree
}
for (const [id, t] of Object.entries(base)) {
  const [cat, name] = category(id)
  if (cat === 'spacing' || cat === 'sizes') put(tokens[cat] ??= {}, name, leaf(css[t.$type](t.$value), t.$description))
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
const text = `// Generated by tokens/build.mjs from tokens/*.json. Do not edit; change the
// JSON and run \`pnpm tokens\`.
import { definePreset } from '@pandacss/dev'

export default definePreset(${JSON.stringify(preset, null, 2)})
`

// A docs page with each colour token's value in each mode, for review.
const groups = {}
for (const [id, t] of Object.entries(base)) {
  if (t.$type !== 'color') continue
  const name = id.slice(6)
  const values = Object.fromEntries(modes.flatMap((m) => themes.map((th) => [themes.length > 1 ? `${th} ${m}` : m, css.color(sets[`${th}/${m}`][id].$value)])))
  ;(groups[name.split('.')[0]] ??= []).push({ name, desc: t.$description, values })
}
// JSX expressions with JSON strings, so quotes and braces in a description
// cannot break the MDX.
const docs = `{/* Generated by tokens/build.mjs. Do not edit; change tokens/*.json and run \`pnpm tokens\`. */}
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

const outputs = [[presetOut, text], [docsOut, docs]]
if (check) {
  for (const [file, body] of outputs) {
    if (!existsSync(file) || readFileSync(file, 'utf8') !== body) fail('generated', `${file} is out of date; run pnpm tokens`)
  }
} else {
  mkdirSync(join(dir, 'generated'), { recursive: true })
  for (const [file, body] of outputs) writeFileSync(file, body)
}
report()
