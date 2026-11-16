// Pure functions of the Figma token sync, so test.ts can test them: turn
// the DTCG tokens into Figma variables and text styles, render the
// use_figma scripts, and make the hashes that check the file afterwards.
// The collections follow design-system.md (Figma section) and d-070:
//   Theme  - one mode per theme: the dark/* and light/* colours (hidden,
//            no scopes), radius, border width, blur, opacity, font family.
//   Color  - modes Dark and Light; each colour aliases its Theme variable.
//   Layout - one mode: spacing and sizes, the same in every theme (d-035).
// Text styles come from text/*. Each shadow/* token becomes one effect
// style whose colour is bound to a Color variable (shadow/<name>), so the
// style follows the Dark and Light modes; its offset, blur and spread are
// the same in both schemes.
import { effectStylesTemplate, fingerprintScript, textStylesTemplate, upsertTemplate } from './templates.ts'

export type Rgba = { r: number; g: number; b: number; a: number }
export type Value = Rgba | number | string
export type VariableType = 'COLOR' | 'FLOAT' | 'STRING'
export type FigmaVariable = {
  name: string
  type: VariableType
  scopes: string[]
  hidden?: true
  description: string
  web?: string
  values?: Record<string, Value>
  aliases?: Record<string, string>
}
export type Collection = { name: string; modes: string[]; variables: FigmaVariable[] }
export type TextStyle = {
  name: string
  description: string
  fontFamilyVariable: string
  fontSize: number
  fontWeight: number
  lineHeightPercent: number
  letterSpacingPx: number
  textCase: TextCase
}
/** A drop or inner shadow; its colour comes from the Color variable colorVariable. */
export type EffectStyle = {
  name: string
  type: 'DROP_SHADOW' | 'INNER_SHADOW'
  description: string
  colorVariable: string
  offsetX: number
  offsetY: number
  radius: number
  spread: number
}
export type TextCase = 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE'
/** The CSS text-transform values a token may set, as Figma text cases. */
const textCases: Record<string, TextCase> = { none: 'ORIGINAL', uppercase: 'UPPER', lowercase: 'LOWER', capitalize: 'TITLE' }
export type FigmaTokens = {
  source: { repo: string; commit: string; tokensSha256: string }
  collections: Collection[]
  textStyles: TextStyle[]
  effectStyles: EffectStyle[]
  notExported: string[]
}

type Node = Record<string, unknown>
const isRecord = (v: unknown): v is Node => typeof v === 'object' && v !== null && !Array.isArray(v)
const fail = (message: string): never => {
  throw new Error(message)
}
const field = (node: Node, key: string): Node => {
  const v = node[key]
  return isRecord(v) ? v : fail(`missing group ${key}`)
}
const num = (v: unknown, where: string): number => (typeof v === 'number' ? v : fail(`${where} is not a number`))
const description = (tok: Node) => (typeof tok['$description'] === 'string' ? tok['$description'] : '')

/** Each token under a group, with its path: a token is an object with $value. */
function* leaves(node: Node, path: string[] = []): Generator<[string[], Node]> {
  if ('$value' in node) {
    yield [path, node]
    return
  }
  for (const [key, child] of Object.entries(node)) {
    if (!key.startsWith('$') && isRecord(child)) yield* leaves(child, [...path, key])
  }
}

const dash = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
/** The CSS variable Panda writes for a token, as Figma's WEB code syntax. */
const web = (category: string, path: string[]) => `var(--${category}-${path.map(dash).join('-')})`

const rgba = (v: unknown, where: string): Rgba => {
  if (!isRecord(v) || !Array.isArray(v['components'])) return fail(`${where} is not a colour`)
  const [r, g, b] = v['components'].map((c) => num(c, where))
  if (r === undefined || g === undefined || b === undefined) return fail(`${where} has fewer than 3 components`)
  return { r, g, b, a: num(v['alpha'], where) }
}
const px = (v: unknown, where: string): number => {
  if (!isRecord(v) || v['unit'] !== 'px') return fail(`${where} is not a px dimension`)
  return num(v['value'], where)
}

/** The Figma pickers where a colour of this group may appear. */
export function colourScopes(path: readonly string[]): string[] {
  const group = path[0]
  const last = path[path.length - 1]
  const fill = ['FRAME_FILL', 'SHAPE_FILL']
  if (group === 'fg') return ['TEXT_FILL', 'SHAPE_FILL']
  if (group === 'border') return ['STROKE_COLOR']
  if (group === 'status' || group === 'diff') {
    if (last === 'fg') return ['TEXT_FILL', 'SHAPE_FILL']
    if (last === 'bg') return fill
    if (last === 'border') return ['STROKE_COLOR']
    return fail(`no scopes for color/${path.join('/')}`)
  }
  if (group === 'accent') return [...fill, 'STROKE_COLOR']
  if (group === 'kind' || group === 'agent') return [...fill, 'TEXT_FILL']
  return fill // bg, surface, overlay, backdrop
}

export type TokenSources = {
  /** One entry per file in tokens/themes/, by file name without .json. */
  themes: { name: string; json: unknown }[]
  layout: unknown
  commit: string
  tokensSha256: string
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Turns the DTCG tokens into the variables and text styles of the Figma file. */
export function exportTokens(src: TokenSources): FigmaTokens {
  const themeVars = new Map<string, FigmaVariable>()
  const colourVars = new Map<string, FigmaVariable>()
  const textStyles = new Map<string, TextStyle>()
  const effectStyles = new Map<string, EffectStyle>()
  const themeModes: string[] = []
  const valuesOf = (v: FigmaVariable) => (v.values ??= {})
  for (const { name: file, json } of src.themes) {
    if (!isRecord(json)) return fail(`theme ${file} is not an object`)
    const mode = capital(file)
    themeModes.push(mode)
    for (const scheme of ['dark', 'light']) {
      for (const [path, tok] of leaves(field(field(json, scheme), 'color'))) {
        const name = `${scheme}/color/${path.join('/')}`
        const v = themeVars.get(name) ?? { name, type: 'COLOR', scopes: [], hidden: true, description: description(tok), values: {} }
        themeVars.set(name, v)
        valuesOf(v)[mode] = rgba(tok['$value'], name)
        const key = path.join('/')
        const c = colourVars.get(key) ?? { name: `color/${key}`, type: 'COLOR', scopes: colourScopes(path), description: description(tok), web: web('colors', path), aliases: {} }
        colourVars.set(key, c)
        ;(c.aliases ??= {})[capital(scheme)] = name
      }
      for (const [path, tok] of leaves(field(field(json, scheme), 'shadow'))) {
        const key = path.join('/')
        const where = `${scheme}/shadow/${key}`
        const val = tok['$value']
        if (!isRecord(val)) return fail(`${where} is not a shadow value`)
        // The colour changes with the scheme: a hidden Theme primitive per
        // scheme, and one Color variable that aliases them by mode.
        const name = `${scheme}/shadow/${key}`
        const v = themeVars.get(name) ?? { name, type: 'COLOR', scopes: [], hidden: true, description: description(tok), values: {} }
        themeVars.set(name, v)
        valuesOf(v)[mode] = rgba(val['color'], where)
        const cname = `shadow/${key}`
        const c = colourVars.get(cname) ?? { name: cname, type: 'COLOR', scopes: ['EFFECT_COLOR'], description: '', aliases: {} }
        colourVars.set(cname, c)
        ;(c.aliases ??= {})[capital(scheme)] = name
        // One effect style serves both schemes, so its geometry must match.
        const inset = val['inset'] ?? false
        if (typeof inset !== 'boolean') return fail(`${where} has an inset that is not true or false`)
        const style: EffectStyle = {
          name: cname,
          type: inset ? 'INNER_SHADOW' : 'DROP_SHADOW',
          description: '',
          colorVariable: cname,
          offsetX: px(val['offsetX'], where),
          offsetY: px(val['offsetY'], where),
          radius: px(val['blur'], where),
          spread: px(val['spread'], where),
        }
        const before = effectStyles.get(cname)
        const geometry = (e: EffectStyle) => [e.type, e.offsetX, e.offsetY, e.radius, e.spread].join(',')
        if (before !== undefined && geometry(before) !== geometry(style)) {
          return fail(`${cname} has another inset, offset, blur or spread in ${where}; a Figma effect style binds only its colour to a mode`)
        }
        // Only one scheme may describe the token; keep the first description found.
        const text = before?.description || description(tok)
        effectStyles.set(cname, { ...style, description: text })
        c.description ||= text
      }
    }
    const singles: [string, string, string][] = [
      ['radius', 'radii', 'CORNER_RADIUS'],
      ['borderWidth', 'border-widths', 'STROKE_FLOAT'],
      ['blur', 'blurs', 'EFFECT_FLOAT'],
      ['opacity', 'opacity', 'OPACITY'],
    ]
    for (const [key, category, scope] of singles) {
      for (const [path, tok] of leaves(field(json, key))) {
        const name = `${key}/${path.join('/')}`
        // A Figma opacity variable is a percent: 45 on a node reads as 0.45.
        const value = key === 'opacity' ? num(tok['$value'], name) * 100 : px(tok['$value'], name)
        const v = themeVars.get(name) ?? { name, type: 'FLOAT', scopes: [scope], description: description(tok), web: web(category, path), values: {} }
        themeVars.set(name, v)
        valuesOf(v)[mode] = value
      }
    }
    for (const [path, tok] of leaves(field(field(json, 'font'), 'family'))) {
      const name = `font/${path[path.length - 1] ?? ''}`
      const families = tok['$value']
      // Figma names the static family, not the variable font.
      const family = Array.isArray(families) ? families.find((f): f is string => typeof f === 'string' && !f.includes('Variable')) : undefined
      if (family === undefined) return fail(`${name} has no static font family`)
      const v = themeVars.get(name) ?? { name, type: 'STRING', scopes: ['FONT_FAMILY'], description: description(tok), web: web('fonts', path), values: {} }
      themeVars.set(name, v)
      valuesOf(v)[mode] = family
    }
    for (const [path, tok] of leaves(field(json, 'text'))) {
      const name = `text/${path.join('/')}`
      const val = tok['$value']
      if (!isRecord(val)) return fail(`${name} is not a typography value`)
      const ref = typeof val['fontFamily'] === 'string' ? /^\{font\.family\.(\w+)\}$/.exec(val['fontFamily'])?.[1] : undefined
      if (ref === undefined) return fail(`${name} does not reference a font family`)
      const ext = tok['$extensions']
      const transform = isRecord(ext) ? ext['com.eshelton328.textTransform'] : undefined
      const textCase = transform === undefined ? 'ORIGINAL' : typeof transform === 'string' ? textCases[transform] : undefined
      if (textCase === undefined) return fail(`${name} has a text transform Figma cannot show: ${String(transform)}`)
      const style: TextStyle = {
        name,
        description: description(tok),
        fontFamilyVariable: `font/${ref}`,
        fontSize: px(val['fontSize'], name),
        fontWeight: num(val['fontWeight'], name),
        lineHeightPercent: Math.round(num(val['lineHeight'], name) * 100 * 100) / 100,
        letterSpacingPx: px(val['letterSpacing'], name),
        textCase,
      }
      // One Figma text style serves every theme, and only its font family
      // is bound to a Theme variable. A theme with another size, weight,
      // line height, spacing or case would overwrite the first theme's.
      const before = textStyles.get(path.join('/'))
      if (before !== undefined && JSON.stringify(before) !== JSON.stringify(style)) {
        return fail(`${name} differs between themes; a Figma text style can hold only one value for each property`)
      }
      textStyles.set(path.join('/'), style)
    }
  }
  if (!isRecord(src.layout)) return fail('layout is not an object')
  const layoutVars: FigmaVariable[] = []
  for (const [path, tok] of leaves(src.layout)) {
    const [group, ...rest] = path
    const category = group === 'spacing' ? 'spacing' : group === 'size' ? 'sizes' : fail(`unknown layout group ${String(group)}`)
    const name = path.join('/')
    layoutVars.push({
      name,
      type: 'FLOAT',
      scopes: group === 'spacing' ? ['GAP'] : ['WIDTH_HEIGHT'],
      description: description(tok),
      web: web(category, rest),
      values: { Value: px(tok['$value'], name) },
    })
  }
  return {
    source: { repo: 'component-library-1701', commit: src.commit, tokensSha256: src.tokensSha256 },
    collections: [
      { name: 'Theme', modes: themeModes, variables: [...themeVars.values()] },
      { name: 'Color', modes: ['Dark', 'Light'], variables: [...colourVars.values()] },
      { name: 'Layout', modes: ['Value'], variables: layoutVars },
    ],
    textStyles: [...textStyles.values()],
    effectStyles: [...effectStyles.values()],
    notExported: [],
  }
}

/** The collection a collection's aliases point into. */
const aliasFrom: Record<string, string> = { Color: 'Theme' }

/**
 * The use_figma scripts, in the order they must run: Theme before Color,
 * because Color aliases Theme, and the font variables before the text
 * styles. The last one, fingerprint.js, is read-only.
 */
export function renderScripts(doc: FigmaTokens): { file: string; code: string }[] {
  const scripts = doc.collections.map((c) => {
    const vars = c.variables.map((v) => ({
      n: v.name,
      t: v.type,
      s: v.scopes,
      d: v.description,
      ...(v.hidden ? { h: true } : {}),
      ...(v.web ? { w: v.web } : {}),
      ...(v.values ? { v: v.values } : {}),
      ...(v.aliases ? { a: v.aliases } : {}),
    }))
    const data = { name: c.name, modes: c.modes, aliasFrom: aliasFrom[c.name] ?? null, vars }
    return { file: `${c.name.toLowerCase()}.js`, code: upsertTemplate.replace('__DATA__', () => JSON.stringify(data)) }
  })
  // The effect styles run in the same call as the text styles, after the
  // Color variables they bind; the text styles' counts stay the reply's
  // created, updated and total, and the effect styles' go in effectStyles.
  const effects = effectStylesTemplate.replace('__EFFECTS__', () => JSON.stringify(doc.effectStyles))
  scripts.push({ file: 'text-styles.js', code: textStylesTemplate.replace('__DATA__', () => JSON.stringify(doc.textStyles)).replace('__EFFECT_STYLES__', () => effects) })
  scripts.push({ file: 'fingerprint.js', code: fingerprintScript })
  return scripts
}

/** 32-bit FNV-1a over UTF-16 code units, as fingerprint.js computes it in Figma. */
export function fnv(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

/** Figma stores descriptions HTML-escaped; run 1 saw ' read back as &#39;. */
export const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const f4 = (x: number) => x.toFixed(4)
const show = (x: Value) => (typeof x === 'string' ? x : typeof x === 'number' ? f4(x) : [x.r, x.g, x.b, x.a].map(f4).join(','))
const fontStyle: Record<number, string> = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold' }

/** The hash fingerprint.js should return for each variable and text style. */
export function expectedHashes(doc: FigmaTokens): Record<string, string> {
  const out: Record<string, string> = {}
  for (const c of doc.collections) {
    out[`col|${c.name}`] = fnv([[...c.modes].sort().join(','), '0'].join('|'))
    for (const v of c.variables) {
      const vals: Record<string, string> = {}
      for (const [m, x] of Object.entries(v.values ?? {})) vals[m] = show(x)
      for (const [m, t] of Object.entries(v.aliases ?? {})) vals[m] = `@${t}`
      const modes = [...c.modes].sort().map((m) => `${m}=${vals[m] ?? 'undefined'}`).join(';')
      out[`var|${c.name}|${v.name}`] = fnv([v.type, [...v.scopes].sort().join(','), v.web ?? '', v.hidden ? '1' : '0', escapeHtml(v.description), modes].join('|'))
    }
  }
  for (const t of doc.textStyles) {
    const style = fontStyle[t.fontWeight] ?? fail(`${t.name}: no font style for weight ${String(t.fontWeight)}`)
    out[`style|${t.name}`] = fnv([style, f4(t.fontSize), 'PERCENT', t.lineHeightPercent.toFixed(2), 'PIXELS', f4(t.letterSpacingPx), t.textCase, 'NONE', f4(0), f4(0), f4(0), 'NONE', '0', '0', 'AUTO', 'fontFamily', t.fontFamilyVariable, escapeHtml(t.description)].join('|'))
  }
  for (const e of doc.effectStyles) {
    out[`effect|${e.name}`] = fnv(['1', e.type, f4(e.offsetX), f4(e.offsetY), f4(e.radius), f4(e.spread), '1', 'NORMAL', '0', 'color', `@${e.colorVariable}`, escapeHtml(e.description)].join('|'))
  }
  return out
}

/** Every key that is missing in Figma, extra in Figma, or has another hash. */
export function compareHashes(expected: Record<string, string>, got: Record<string, unknown>): string[] {
  return [
    ...Object.keys(expected).filter((k) => !(k in got)).map((k) => `missing ${k}`),
    ...Object.keys(got).filter((k) => !(k in expected)).map((k) => `extra ${k}`),
    ...Object.keys(expected).filter((k) => k in got && got[k] !== expected[k]).map((k) => `changed ${k}`),
  ]
}
