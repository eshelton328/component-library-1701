#!/usr/bin/env node
// Builds the Panda preset from the DTCG tokens and checks them.
//   node tokens/build.mjs          check, then write tokens/generated/preset.ts
//   node tokens/build.mjs --check  check, and fail if the preset is out of date
// Prints one JSON object. Exits 1 if a check fails.
//
// Checks, for every theme and mode the resolver lists:
//   complete     every theme and mode has the same tokens, with the same types
//   described    every token has a $description (in the default theme and mode)
//   hex          a colour's hex matches its components
//   contrast     each pair in tokens/contrast.json meets its minimum
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { parse, defineConfig, Logger } from '@terrazzo/parser'

const dir = new URL('.', import.meta.url).pathname
const out = join(dir, 'generated/preset.ts')
const check = process.argv.includes('--check')
const problems = []
const fail = (check, detail) => problems.push({ check, detail })

const config = defineConfig({ lint: { rules: {} } }, { cwd: new URL(`file://${dir}`) })
const src = readFileSync(join(dir, 'resolver.json'), 'utf8')
const { resolver } = await parse([{ src, filename: new URL(`file://${dir}resolver.json`) }], { config, logger: new Logger({ level: 'error' }) })
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

// complete
for (const [key, set] of Object.entries(sets)) {
  for (const id of Object.keys(base)) {
    if (!set[id]) fail('complete', `${key} has no ${id}`)
    else if (set[id].$type !== base[id].$type) fail('complete', `${key} ${id} is ${set[id].$type}, not ${base[id].$type}`)
  }
  for (const id of Object.keys(set)) if (!base[id]) fail('complete', `${key} has ${id}, which ${defaultTheme}/${defaultMode} lacks`)
}
// described
for (const [id, t] of Object.entries(base)) if (!t.$description?.trim()) fail('described', `${id} has no $description`)
// hex
const toHex = (c) => '#' + c.components.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')
for (const [key, set] of Object.entries(sets)) for (const [id, t] of Object.entries(set)) {
  if (t.$type === 'color' && t.$value.hex && toHex(t.$value) !== t.$value.hex.toLowerCase()) {
    fail('hex', `${key} ${id}: hex ${t.$value.hex} but components give ${toHex(t.$value)}`)
  }
}
// contrast
const rgb = (t) => ({ c: t.$value.components, a: t.$value.alpha ?? 1 })
const over = (top, bottom) => top.c.map((v, i) => v * top.a + bottom[i] * (1 - top.a))
const lum = (c) => {
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)
const { pairs } = JSON.parse(readFileSync(join(dir, 'contrast.json'), 'utf8'))
let measured = 0
for (const [key, set] of Object.entries(sets)) {
  const canvas = set['color.bg.canvas'].$value.components
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

const report = (extra = {}) => {
  console.log(JSON.stringify({ ok: problems.length === 0, themes, modes, tokens: Object.keys(base).length, contrastPairs: measured, problems, ...extra }, null, 1))
  process.exit(problems.length ? 1 : 0)
}
// The preset is built only from tokens that passed every check.
if (problems.length) report()

// emit
const css = {
  color: (v) => {
    const [r, g, b] = v.components.map((x) => Math.round(x * 255))
    const a = v.alpha ?? 1
    return a === 1 ? (v.hex ?? toHex(v)) : `rgba(${r}, ${g}, ${b}, ${a})`
  },
  dimension: (v) => `${v.value}${v.unit}`,
  number: (v) => String(v),
  fontFamily: (v) => v.map((f) => (/\s/.test(f) ? `"${f}"` : f)).join(', '),
  shadow: (v) => [v].flat().map((s) => `${css.dimension(s.offsetX)} ${css.dimension(s.offsetY)} ${css.dimension(s.blur)} ${css.dimension(s.spread)} ${css.color(s.color)}`).join(', '),
}
const category = (id, type) => {
  if (id.startsWith('color.')) return ['colors', id.slice(6)]
  if (id.startsWith('shadow.')) return ['shadows', id.slice(7)]
  if (id.startsWith('radius.')) return ['radii', id.slice(7)]
  if (id.startsWith('borderWidth.')) return ['borderWidths', id.slice(12)]
  if (id.startsWith('blur.')) return ['blurs', id.slice(5)]
  if (id.startsWith('opacity.')) return ['opacity', id.slice(8)]
  if (id.startsWith('font.family.')) return ['fonts', id.slice(12)]
  if (id.startsWith('text.')) return ['text', id.slice(5)]
  if (id.startsWith('spacing.')) return ['spacing', id.slice(8)]
  if (id.startsWith('size.')) return ['sizes', id.slice(5)]
  throw new Error(`no Panda category for ${id} (${type})`)
}
const layout = new Set(['spacing', 'sizes'])
const put = (tree, path, leaf) => {
  const parts = path.split('.')
  const last = parts.pop()
  for (const p of parts) tree = tree[p] ??= {}
  tree[last] = leaf
}
const leaf = (value, description) => (description ? { value, description } : { value })

const tokens = {}
const textStyles = {}
const semantic = (theme) => {
  const tree = {}
  const dark = sets[`${theme}/dark`]
  const light = sets[`${theme}/light`]
  for (const [id, t] of Object.entries(base)) {
    const [cat, name] = category(id, t.$type)
    if (layout.has(cat)) continue
    const desc = t.$description
    if (cat === 'text') {
      const d = dark[id].$value
      const l = light[id].$value
      const fam = (dark[id].partialAliasOf?.fontFamily ?? '').replace('font.family.', '')
      const parts = {
        fontSizes: [css.dimension(l.fontSize), css.dimension(d.fontSize)],
        lineHeights: [String(l.lineHeight), String(d.lineHeight)],
        fontWeights: [String(l.fontWeight), String(d.fontWeight)],
        letterSpacings: [css.dimension(l.letterSpacing), css.dimension(d.letterSpacing)],
      }
      for (const [c, [lv, dv]] of Object.entries(parts)) put(tree[c] ??= {}, name, leaf(lv === dv ? dv : { base: lv, _dark: dv }, `The ${name} text style. ${desc}`))
      if (theme === defaultTheme) {
        const transform = base[id].$extensions?.['com.eshelton328.textTransform']
        textStyles[name] = {
          description: desc,
          value: { fontFamily: fam, fontSize: name, lineHeight: name, fontWeight: name, letterSpacing: name, ...(transform ? { textTransform: transform } : {}) },
        }
      }
      continue
    }
    const fmt = css[t.$type]
    const lv = fmt(light[id].$value)
    const dv = fmt(dark[id].$value)
    put(tree[cat] ??= {}, name, leaf(lv === dv ? dv : { base: lv, _dark: dv }, desc))
  }
  return tree
}
for (const [id, t] of Object.entries(base)) {
  const [cat, name] = category(id, t.$type)
  if (layout.has(cat)) put(tokens[cat] ??= {}, name, leaf(css[t.$type](t.$value), t.$description))
}
const preset = {
  name: 'component-library-1701',
  theme: { extend: { tokens, semanticTokens: semantic(defaultTheme), textStyles } },
  themes: Object.fromEntries(themes.filter((t) => t !== defaultTheme).map((t) => [t, { semanticTokens: semantic(t) }])),
}
const text = `// Generated by tokens/build.mjs from tokens/*.json. Do not edit; change the
// JSON and run \`pnpm tokens\`.
import { definePreset } from '@pandacss/dev'

export default definePreset(${JSON.stringify(preset, null, 2)})
`
// A docs page with each colour token's dark and light value, for review.
const docsOut = join(dir, '../src/foundations/colours.mdx')
const groups = {}
for (const [id, t] of Object.entries(base)) {
  if (t.$type !== 'color') continue
  const name = id.slice(6)
  const values = Object.fromEntries(modes.flatMap((m) => themes.map((th) => [themes.length > 1 ? `${th} ${m}` : m, css.color(sets[`${th}/${m}`][id].$value)])))
  ;(groups[name.split('.')[0]] ??= []).push({ name, desc: t.$description, values })
}
const esc = (s) => s.replace(/[{}<>]/g, (c) => `&#${c.charCodeAt(0)};`)
const docs = `{/* Generated by tokens/build.mjs. Do not edit; change tokens/*.json and run \`pnpm tokens\`. */}
import { Meta, ColorPalette, ColorItem } from '@storybook/addon-docs/blocks'

<Meta title="Foundations/Colours" />

# Colours

Each semantic colour token with its value in each mode. Components use only
these names, for example \`css({ color: 'fg.muted' })\`.

${Object.entries(groups).map(([g, items]) => `## ${g}

<ColorPalette>
${items.map((i) => `  <ColorItem title="${i.name}" subtitle="${esc(i.desc)}" colors={${JSON.stringify(i.values)}} />`).join('\n')}
</ColorPalette>
`).join('\n')}`

const outputs = [[out, text], [docsOut, docs]]
if (check) {
  for (const [file, body] of outputs) {
    if (!existsSync(file) || readFileSync(file, 'utf8') !== body) fail('generated', `${file.replace(join(dir, '..'), '').slice(1)} is out of date; run pnpm tokens`)
  }
} else if (!problems.length) {
  mkdirSync(join(dir, 'generated'), { recursive: true })
  for (const [file, body] of outputs) writeFileSync(file, body)
}
report()
