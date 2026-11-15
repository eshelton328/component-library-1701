#!/usr/bin/env node
// Runs tokens/build.mjs on changed copies of tokens/ and checks each result.
// Each case is a defect the build must catch or an output it must write.
// Prints one JSON object and exits 1 on any mismatch.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'

const here = new URL('.', import.meta.url).pathname
const theme = 'themes/viewscreen.json'

function run(mutate) {
  const dir = mkdtempSync(join(tmpdir(), 'tokens-'))
  cpSync(here, dir, { recursive: true, filter: (p) => !p.includes('/generated') && !p.endsWith('.mjs') })
  const edit = (file, fn) => {
    const path = join(dir, file)
    const data = JSON.parse(readFileSync(path, 'utf8'))
    fn(data)
    writeFileSync(path, JSON.stringify(data, null, 2))
  }
  mutate(edit, dir)
  const r = spawnSync('node', [join(here, 'build.mjs'), '--dir', dir], { encoding: 'utf8' })
  let out
  try { out = JSON.parse(r.stdout) } catch { out = { ok: false, problems: [{ check: 'crash', detail: r.stderr.slice(0, 300) }] } }
  const read = (f) => { try { return readFileSync(join(dir, 'generated', f), 'utf8') } catch { return '' } }
  const result = { ...out, preset: read('preset.ts'), docs: read('colours.mdx') }
  rmSync(dir, { recursive: true, force: true })
  return result
}
const has = (check, text = '') => (r) => !r.ok && r.problems.some((p) => p.check === check && p.detail.includes(text))
const ok = (test) => (r) => r.ok && test(r)

const cases = [
  ['unchanged tokens pass', () => {}, ok(() => true)],
  ['subtle on an inset in a pane is measured', (e) => e(theme, (d) => {
    Object.assign(d.dark.color.fg.subtle.$value, { components: [0.4627, 0.5098, 0.6392], hex: '#7682a3' })
  }), has('contrast', 'fg.subtle on surface.inset@surface.pane')],
  ['a second theme is emitted with staticCss', (e, dir) => {
    cpSync(join(dir, theme), join(dir, 'themes/alt.json'))
    e('resolver.json', (r) => { r.modifiers.theme.contexts.alt = [{ $ref: 'themes/alt.json' }] })
  }, ok((r) => r.preset.includes('"alt": {') && /"staticCss":\s*\{\s*"themes":\s*\[\s*"alt"/.test(r.preset))],
  ['a literal text font family is emitted', (e) => e(theme, (d) => { d.text.body.$value.fontFamily = ['Literal Sans', 'serif'] }),
    ok((r) => r.preset.includes('\\"Literal Sans\\", serif') && r.preset.includes('"fontFamily": "text.body"'))],
  ['a mode cannot change spacing', (e) => e('modes/light.json', (d) => { d.spacing = { 4: { $type: 'dimension', $value: { value: 99, unit: 'px' } } } }),
    has('layout', 'spacing.4')],
  ['a colour outside srgb fails', (e) => e(theme, (d) => { d.light.color.fg.subtle.$value.colorSpace = 'srgb-linear'; delete d.light.color.fg.subtle.$value.hex }),
    has('colorspace', 'fg.subtle')],
  ['a transparent canvas fails', (e) => e(theme, (d) => { d.dark.color.bg.canvas.$value.alpha = 0 }), has('canvas')],
  ['an inset shadow keeps inset', (e) => e(theme, (d) => { d.dark.shadow.overlay.$value.inset = true }),
    ok((r) => r.preset.includes('inset 0px 12px 32px'))],
  ['a quote in a description keeps the MDX valid', (e) => e(theme, (d) => { d.dark.color.fg.default.$description = 'Text labelled "primary" {x}.' }),
    ok((r) => r.docs.includes('subtitle={"Text labelled \\"primary\\" {x}."}'))],
  ['a wrong shadow colour hex fails', (e) => e(theme, (d) => { d.dark.shadow.overlay.$value.color.hex = '#ffffff' }),
    has('hex', 'shadow.overlay shadow layer 0')],
  ['a missing light token fails', (e) => e(theme, (d) => { delete d.light.color.kind.hook }), has('complete', 'color.kind.hook')],
  ['a missing description fails', (e) => e(theme, (d) => { delete d.radius.md.$description }), has('described', 'radius.md')],
]

const results = cases.map(([name, mutate, expect]) => {
  const r = run(mutate)
  return { name, ok: expect(r), problems: r.ok ? [] : r.problems.slice(0, 3) }
})
const failed = results.filter((r) => !r.ok)
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed }, null, 1))
process.exit(failed.length ? 1 : 0)
