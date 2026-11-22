#!/usr/bin/env node
// Runs tokens/build.ts on changed copies of tokens/ and checks each result.
// Each case is a defect the build must catch or an output it must write.
// Prints one JSON object and exits 1 on any mismatch.
import { cpSync, mkdtempSync, readFileSync, readdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawn } from 'node:child_process'

const here = new URL('.', import.meta.url).pathname
const theme = 'themes/viewscreen.json'

type Data = Record<string, unknown>
type Edit = (file: string, fn: (data: Data) => void) => void
type Mutate = (edit: Edit, dir: string) => void
type Problem = { check: string; detail: string }
type Result = { ok: boolean; problems: Problem[]; preset: string; docs: string }
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const isProblem = (v: unknown): v is Problem => isRecord(v) && typeof v['check'] === 'string' && typeof v['detail'] === 'string'
const crash = (detail: string) => ({ ok: false, problems: [{ check: 'crash', detail }] })
// The build prints { ok, problems }; anything else counts as a crash.
const parseBuild = (stdout: string, stderr: string) => {
  try {
    const data: unknown = JSON.parse(stdout)
    if (isRecord(data) && typeof data['ok'] === 'boolean' && Array.isArray(data['problems']) && data['problems'].every(isProblem)) {
      return { ok: data['ok'], problems: data['problems'].filter(isProblem) }
    }
  } catch (error) {
    return crash(`stdout is not JSON (${String(error)}): ${stderr.slice(0, 300)}`)
  }
  return crash(stderr.slice(0, 300))
}

// The cases change token JSON through a dotted path. A path that does not
// exist throws, so a case cannot pass by changing nothing.
const parentOf = (data: Data, path: string): [Data, string] => {
  const keys = path.split('.')
  const last = keys.pop()
  let node: unknown = data
  for (const k of keys) {
    if (!isRecord(node) || !(k in node)) throw new Error(`no ${path} in the token JSON`)
    node = node[k]
  }
  if (!isRecord(node) || last === undefined) throw new Error(`no ${path} in the token JSON`)
  return [node, last]
}
const set = (data: Data, path: string, value: unknown) => {
  const [node, key] = parentOf(data, path)
  node[key] = value
}
const remove = (data: Data, path: string) => {
  const [node, key] = parentOf(data, path)
  if (!(key in node)) throw new Error(`no ${path} in the token JSON`)
  Reflect.deleteProperty(node, key)
}

// A build takes about 0.1 s. Two CI runs hung in one build.ts child with
// no output (#315), so a build past the limit prints a Node report to
// stderr, is killed and fails its case. No retry.
const limitMs = 60_000
const reportWaitMs = 5_000
const sleep = (ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms) })
// The report is written after SIGUSR2; a file that does not parse yet is still being written.
const readReport = async (reports: string): Promise<unknown> => {
  for (let waited = 0; waited < reportWaitMs; waited += 100) {
    const name = readdirSync(reports).find((f) => f.endsWith('.json'))
    if (name !== undefined) {
      try {
        const data: unknown = JSON.parse(readFileSync(join(reports, name), 'utf8'))
        return data
      } catch (error) {
        // A SyntaxError means the file is not complete yet; read it again after the next wait.
        if (!(error instanceof SyntaxError)) throw error
      }
    }
    await sleep(100)
  }
  return undefined
}
const describeReport = (report: unknown) => {
  if (!isRecord(report)) return `no Node report in ${String(reportWaitMs / 1000)} s`
  const native = report['nativeStack']
  const frames: unknown[] = Array.isArray(native) ? native.slice(0, 30) : []
  return JSON.stringify({ javascriptStack: report['javascriptStack'], nativeStack: frames, libuv: report['libuv'] }, null, 1)
}
type Build = { stdout: string; stderr: string; hung: boolean }
async function build(name: string, dir: string): Promise<Build> {
  const reports = mkdtempSync(join(tmpdir(), 'tokens-report-'))
  const child = spawn('node', ['--report-on-signal', '--report-signal=SIGUSR2', '--report-directory', reports, join(here, 'build.ts'), '--dir', dir], { stdio: ['ignore', 'pipe', 'pipe'] })
  let stdout = ''
  let stderr = ''
  child.stdout.setEncoding('utf8').on('data', (s: string) => { stdout += s })
  child.stderr.setEncoding('utf8').on('data', (s: string) => { stderr += s })
  const closed = new Promise<void>((resolve) => {
    child.on('close', () => { resolve() })
    child.on('error', (error) => { stderr += String(error); resolve() })
  })
  let timer: ReturnType<typeof setTimeout> | undefined
  const limit = new Promise<boolean>((resolve) => { timer = setTimeout(() => { resolve(true) }, limitMs) })
  const hung = await Promise.race([closed.then(() => false), limit])
  clearTimeout(timer)
  if (hung) {
    child.kill('SIGUSR2')
    const report = await readReport(reports)
    console.error(`${name}: build.ts did not end in ${String(limitMs / 1000)} s\n${describeReport(report)}`)
    child.kill('SIGKILL')
    await closed
  }
  rmSync(reports, { recursive: true, force: true })
  return { stdout, stderr, hung }
}

// hung: the build passed the limit, so the case loop stops after this case.
async function run(name: string, mutate: Mutate): Promise<Result & { hung: boolean }> {
  const dir = mkdtempSync(join(tmpdir(), 'tokens-'))
  cpSync(here, dir, { recursive: true, filter: (p) => !p.includes('/generated') && !p.endsWith('.ts') })
  const edit: Edit = (file, fn) => {
    const path = join(dir, file)
    const data: unknown = JSON.parse(readFileSync(path, 'utf8'))
    if (!isRecord(data)) throw new Error(`${file} is not a JSON object`)
    fn(data)
    writeFileSync(path, JSON.stringify(data, null, 2))
  }
  mutate(edit, dir)
  const r = await build(name, dir)
  const out = r.hung ? crash(`build.ts did not end in ${String(limitMs / 1000)} s`) : parseBuild(r.stdout, r.stderr)
  const read = (f: string) => { try { return readFileSync(join(dir, 'generated', f), 'utf8') } catch { return '' } }
  const result = { ...out, preset: read('preset.ts'), docs: read('colours.mdx'), hung: r.hung }
  rmSync(dir, { recursive: true, force: true })
  return result
}
const has = (check: string, text = '') => (r: Result) => !r.ok && r.problems.some((p) => p.check === check && p.detail.includes(text))
const ok = (test: (r: Result) => boolean) => (r: Result) => r.ok && test(r)

const cases: [string, Mutate, (r: Result) => boolean][] = [
  ['unchanged tokens pass', () => {}, ok(() => true)],
  ['subtle on an inset in a pane is measured', (e) => { e(theme, (d) => {
    set(d, 'dark.color.fg.subtle.$value.components', [0.4627, 0.5098, 0.6392])
    set(d, 'dark.color.fg.subtle.$value.hex', '#7682a3')
  }) }, has('contrast', 'fg.subtle on surface.inset@surface.pane')],
  ['a second theme is emitted with staticCss', (e, dir) => {
    cpSync(join(dir, theme), join(dir, 'themes/alt.json'))
    e('resolver.json', (r) => { set(r, 'modifiers.theme.contexts.alt', [{ $ref: 'themes/alt.json' }]) })
  }, ok((r) => r.preset.includes('"alt": {') && /"staticCss":\s*\{\s*"themes":\s*\[\s*"alt"/.test(r.preset))],
  // Each text size keeps the family of its style, so the case sets it in all three.
  ['a literal text font family is emitted', (e) => { e(theme, (d) => {
    for (const group of ['text', 'small.text', 'large.text']) set(d, `${group}.body.$value.fontFamily`, ['Literal Sans', 'serif'])
  }) },
    ok((r) => r.preset.includes('\\"Literal Sans\\", serif') && r.preset.includes('"fontFamily": "text.body"'))],
  ['a mode cannot change spacing', (e) => { e('modes/light.json', (d) => { set(d, 'spacing', { 4: { $type: 'dimension', $value: { value: 99, unit: 'px' } } }) }) },
    has('layout', 'spacing.4')],
  ['a colour outside srgb fails', (e) => { e(theme, (d) => { set(d, 'light.color.fg.subtle.$value.colorSpace', 'srgb-linear'); remove(d, 'light.color.fg.subtle.$value.hex') }) },
    has('colorspace', 'fg.subtle')],
  ['a transparent canvas fails', (e) => { e(theme, (d) => { set(d, 'dark.color.bg.canvas.$value.alpha', 0) }) }, has('canvas')],
  ['an inset shadow keeps inset', (e) => { e(theme, (d) => { set(d, 'dark.shadow.overlay.$value.inset', true) }) },
    ok((r) => r.preset.includes('inset 0px 12px 32px'))],
  ['a quote in a description keeps the MDX valid', (e) => { e(theme, (d) => { set(d, 'dark.color.fg.default.$description', 'Text labelled "primary" {x}.') }) },
    ok((r) => r.docs.includes('subtitle={"Text labelled \\"primary\\" {x}."}'))],
  ['a wrong shadow colour hex fails', (e) => { e(theme, (d) => { set(d, 'dark.shadow.overlay.$value.color.hex', '#ffffff') }) },
    has('hex', 'shadow.overlay shadow layer 0')],
  ['an empty contrast reference fails', (e) => { e('contrast.json', (c) => {
    const pairs = c['pairs']
    if (!Array.isArray(pairs)) throw new Error('contrast.json has no pairs')
    pairs.push({ fg: '', on: ['bg.canvas'], min: 4.5 })
  }) }, (r) => r.problems.some((p) => p.check === 'crash' && p.detail.includes('needs fg (a token name)'))],
  ['a token group named value is emitted', (e) => { e(theme, (d) => {
    set(d, 'radius.value', { sm: { $type: 'dimension', $value: { value: 3, unit: 'px' }, $description: 'Test radius inside a group named value.' } })
  }) }, ok((r) => /"value": \{\s*"sm": \{\s*"value": "3px"/.test(r.preset))],
  ['a missing light token fails', (e) => { e(theme, (d) => { remove(d, 'light.color.kind.hook') }) }, has('complete', 'color.kind.hook')],
  ['durations and easings are emitted as CSS values', () => {},
    ok((r) => /"durations": \{[\s\S]*"sheetOpen": \{\s*"value": "300ms"/.test(r.preset) && /"easings": \{[\s\S]*"sheet": \{\s*"value": "cubic-bezier\(0\.38, 0\.7, 0\.125, 1\)"/.test(r.preset))],
  ['a duration in seconds keeps its unit', (e) => { e('motion.json', (d) => { set(d, 'duration.keyboard.$value', { value: 0.25, unit: 's' }) }) },
    ok((r) => /"keyboard": \{\s*"value": "0\.25s"/.test(r.preset))],
  ['a mode cannot change a duration', (e) => { e('modes/light.json', (d) => { set(d, 'duration', { keyboard: { $type: 'duration', $value: { value: 999, unit: 'ms' } } }) }) },
    has('layout', 'duration.keyboard')],
  ['a mode cannot change an easing', (e) => { e('modes/light.json', (d) => { set(d, 'easing', { sheet: { $type: 'cubicBezier', $value: [0, 0, 1, 1] } }) }) },
    has('layout', 'easing.sheet')],
  ['a missing description fails', (e) => { e(theme, (d) => { remove(d, 'radius.md.$description') }) }, has('described', 'radius.md')],
  ['the text sizes are emitted under their class conditions', () => {},
    ok((r) => /"textSmall": "\.text-small &"/.test(r.preset) && /"textLarge": "\.text-large &"/.test(r.preset) &&
      /"body": \{\s*"value": \{\s*"base": "14px",\s*"_textSmall": "13px",\s*"_textLarge": "15px"/.test(r.preset))],
  ['a text size cannot change a font weight', (e) => { e(theme, (d) => { set(d, 'small.text.body.$value.fontWeight', 700) }) },
    has('size', 'text.body')],
  ['a text size cannot change a radius', (e) => { e('sizes/large.json', (d) => { set(d, 'radius', { md: { $type: 'dimension', $value: { value: 99, unit: 'px' } } }) }) },
    has('size', 'radius.md')],
  ['a line height off the 4 px grid fails', (e) => { e(theme, (d) => { set(d, 'large.text.body.$value.lineHeight', 1.5) }) },
    has('grid', 'text.body')],
  ['a line height just under the 4 px grid fails', (e) => { e(theme, (d) => { set(d, 'text.paneTitle.$value.lineHeight', 1.3333) }) },
    has('grid', 'viewscreen/dark/default text.paneTitle')],
  ['a default line height off the 4 px grid fails', (e) => { e(theme, (d) => { set(d, 'text.label.$value.lineHeight', 1.5) }) },
    has('grid', 'viewscreen/dark/default text.label')],
]

const results: { name: string; ok: boolean; problems: Problem[] }[] = []
// A hung build makes each later case wait the full limit too, so the run
// stops at the first hung build and counts the cases it did not run.
for (const [i, [name, mutate, expect]] of cases.entries()) {
  const r = await run(name, mutate)
  results.push({ name, ok: !r.hung && expect(r), problems: r.ok ? [] : r.problems.slice(0, 3) })
  if (r.hung) {
    const left = cases.length - i - 1
    results.push({ name: `stopped after the first hung build; ${String(left)} cases not run`, ok: false, problems: [] })
    break
  }
}
const failed = results.filter((r) => !r.ok)
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed }, null, 1))
process.exit(failed.length ? 1 : 0)
