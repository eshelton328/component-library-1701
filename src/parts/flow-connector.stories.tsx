import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css, cx } from '../../styled-system/css'
import { FlowBranch, FlowElbow, FlowLine, FlowLoop } from './flow-connector'

// Stand-in step cards; the connectors are what these stories check.
const card = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  py: '10',
  px: '12',
  bg: 'surface.raised',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'lg',
  textStyle: 'label',
  color: 'fg.default',
  overflowWrap: 'anywhere',
})
const note = css({ textStyle: 'small', color: 'fg.muted' })
const gate = css({ borderColor: 'status.needsYou.border' })
const stop = css({
  display: 'flex',
  alignItems: 'center',
  px: '12',
  textStyle: 'small',
  color: 'status.needsYou.fg',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'status.needsYou.border',
  borderRadius: 'md',
  whiteSpace: 'nowrap',
})
// Swatches of the expected tokens, so the play functions compare resolved colours.
const swatches = {
  muted: css({ bg: 'fg.muted' }),
  amber: css({ bg: 'status.needsYou.fg' }),
  // A strong border, as the browser draws it (1 px on a 1x screen, 1.5 on a 2x one).
  stroke: css({ borderTopWidth: 'strong', borderTopStyle: 'solid' }),
}

function Swatches() {
  return (
    <div hidden>
      {Object.entries(swatches).map(([name, className]) => (
        <span key={name} data-swatch={name} className={className} />
      ))}
    </div>
  )
}

// D13 `flow` (446:531): the stages left to right, 20 px connector columns
// between them (447:74), steps 4 and 5 one over the other 32 apart (447:31,
// 447:39) with a fork and a join (447:79 to 447:82), the gate's way out down
// to the stop (447:83, 447:68) and the dashed loop from Owner decides back to
// the stop (447:84). The rows: four card rows 32 apart (a single step spans
// the middle two, as the-bridge's flowLayout does), then the way out, then
// the stop in two 16 px halves, so the loop can end at its middle.
const desktopPage = css({ bg: 'bg.canvas', p: '24' })
const flowGrid = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr) token(spacing.20)) minmax(0, 0.5fr) minmax(0, 0.5fr)',
  gridTemplateRows:
    'minmax(0, 1fr) token(spacing.32) minmax(0, 1fr) token(spacing.32) minmax(0, 1fr) token(spacing.32) minmax(0, 1fr) token(spacing.32) token(spacing.40) token(spacing.16) token(spacing.16)',
})
// Where each card and connector sits in the grid.
const at = {
  card: css({ gridRow: '3 / 6' }),
  top: css({ gridColumn: '9', gridRow: '1 / 4' }),
  bottom: css({ gridColumn: '9', gridRow: '5 / 8' }),
  fork: css({ gridColumn: '8', gridRow: '1 / 8' }),
  join: css({ gridColumn: '10', gridRow: '1 / 8' }),
  exit: css({ gridColumn: '1', gridRow: '6 / 10' }),
  stop: css({ gridColumn: '1 / 3', gridRow: '10 / 12' }),
  loop: css({ gridColumn: '3 / 16', gridRow: '6 / 11' }),
}
const columns: Readonly<Record<string, string>> = {
  gate: css({ gridColumn: '1' }),
  s1: css({ gridColumn: '3' }),
  s2: css({ gridColumn: '5' }),
  s3: css({ gridColumn: '7' }),
  s6: css({ gridColumn: '11' }),
  s7: css({ gridColumn: '13' }),
  owner: css({ gridColumn: '15 / 17' }),
  'line-2': css({ gridColumn: '2' }),
  'line-4': css({ gridColumn: '4' }),
  'line-6': css({ gridColumn: '6' }),
  'line-12': css({ gridColumn: '12' }),
  'line-14': css({ gridColumn: '14' }),
}
const middle = css({ alignSelf: 'center' })
const centre = css({ justifySelf: 'center' })

type Stage = { id: string; title: string; note: string; gate?: boolean }
const stages: Stage[] = [
  { id: 'gate', title: 'Pre-registered?', note: 'The ledger names method 0.7.', gate: true },
  { id: 's1', title: 'Runs', note: 'Each case, model and repeat.' },
  { id: 's2', title: 'Facts', note: 'Jev scores prose.' },
  { id: 's3', title: 'Blinding', note: 'Hides which runs had the skill.' },
  { id: 's45', title: '', note: '' },
  { id: 's6', title: 'Aggregate', note: 'Then the paired difference.' },
  { id: 's7', title: 'Read', note: 'Findings go in the ledger.' },
  { id: 'owner', title: 'Owner decides', note: 'Done, iterate or redesign.', gate: true },
]

function Card({ step, className }: { step: Stage; className?: string }) {
  return (
    <div className={cx(card, step.gate === true ? gate : undefined, className)} data-testid={step.id}>
      {step.title}
      <span className={note}>{step.note}</span>
    </div>
  )
}

function Desktop() {
  return (
    <main className={desktopPage}>
      <div className={flowGrid} data-testid="flow">
        {stages.map((step) => (step.id === 's45' ? null : <Card key={step.id} step={step} className={cx(at.card, columns[step.id])} />))}
        <Card step={{ id: 's4', title: 'Primary grades', note: 'The other family.' }} className={at.top} />
        <Card step={{ id: 's5', title: 'Second grades', note: 'The run’s own family.' }} className={at.bottom} />
        {['line-2', 'line-4', 'line-6', 'line-12', 'line-14'].map((id) => (
          <div key={id} className={cx(at.card, columns[id], middle)} data-testid={id}>
            <FlowLine />
          </div>
        ))}
        <div className={at.fork} data-testid="fork">
          <FlowBranch kind="fork" direction="right" gap="32" />
        </div>
        <div className={at.join} data-testid="join">
          <FlowBranch kind="join" direction="right" gap="32" />
        </div>
        <div className={cx(at.exit, centre)} data-testid="exit">
          <FlowLine direction="down" tone="needsYou" label="no" />
        </div>
        <div className={cx(at.stop, stop)} data-testid="stop">
          stop: run skill-eval-cases
        </div>
        <div className={at.loop} data-testid="loop">
          <FlowLoop label="new failure" />
        </div>
      </div>
      <Swatches />
    </main>
  )
}

// T08 `steps` (448:216) and M09 `steps` (448:493) at the phone's width: the
// steps in one column, a down line between them (448:223, 448:500), a fork
// into steps 4 and 5 side by side 8 apart (502:2, 464:558) and a join out
// of them (502:8, 464:560), 24 high as on the phone.
const phonePage = css({ bg: 'bg.canvas', py: '12', px: '12' })
const columnFlow = css({ display: 'flex', flexDirection: 'column' })
const lineRow = css({ display: 'flex', justifyContent: 'center', h: 'icon.20' })
const branchRow = css({ h: 'control.xs' })
const parallel = css({ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8' })

function Column() {
  const step = (id: string, title: string, text: string, gated?: boolean) => (
    <Card step={{ id, title, note: text, gate: gated ?? false }} />
  )
  const down = (id: string) => (
    <div className={lineRow} data-testid={id}>
      <FlowLine direction="down" />
    </div>
  )
  return (
    <main className={phonePage}>
      <div className={columnFlow} data-testid="column">
        {step('c-gate', 'Pre-registered in the ledger?', 'Method 0.7 and a free eval lock (G2).', true)}
        {down('c-line-1')}
        {step('c-s3', 'Blinding', 'Hides which runs had the skill.')}
        <div className={branchRow} data-testid="c-fork">
          <FlowBranch kind="fork" />
        </div>
        <div className={parallel} data-testid="c-parallel">
          {step('c-s4', 'Primary grades', 'The other family.')}
          {step('c-s5', 'Second grades', 'Own family, 20 runs or more.')}
        </div>
        <div className={branchRow} data-testid="c-join">
          <FlowBranch kind="join" />
        </div>
        {step('c-s6', 'Aggregate', 'aggregate.json, then the paired difference.')}
        {down('c-line-2')}
        {step('c-owner', 'Owner decides', 'Done, iterate or redesign.', true)}
      </div>
      <Swatches />
    </main>
  )
}

// D08 `flow · by phase` (458:2): four lanes of steps in three rows, the
// lanes 40 px apart here (Figma 38, `arrow` 466:2; spacing.40 is the
// nearest token). Each card row is two equal grid rows, so a connector can
// start or end at a card's middle, and each lane two equal columns, so the
// loop can run from one lane's middle to another's. Blinding (row 3) forks
// into Primary grades (row 1) and Second grades (row 2) by two elbows that
// bend halfway (466:6); Second grades joins Aggregate (row 1) by an elbow
// that bends 8 from it, beside Primary grades' straight line (466:7); the
// gate's elbow into Facts (row 2) leaves from the top. The dashed loop runs
// under the lanes from Owner decides back up into the stop's foot (466:10).
const phaseGrid = css({
  display: 'grid',
  gridTemplateColumns:
    'repeat(3, minmax(0, 0.5fr) minmax(0, 0.5fr) token(spacing.40)) minmax(0, 0.5fr) minmax(0, 0.5fr)',
  gridTemplateRows:
    'minmax(0, 1fr) minmax(0, 1fr) token(spacing.16) minmax(0, 1fr) minmax(0, 1fr) token(spacing.16) minmax(0, 1fr) minmax(0, 1fr) token(spacing.32)',
  pb: '40',
})
const lanes: Readonly<Record<string, string>> = {
  gate: css({ gridColumn: '1 / 3', gridRow: '1 / 3' }),
  stop: css({ gridColumn: '1 / 3', gridRow: '7 / 9' }),
  runs: css({ gridColumn: '4 / 6', gridRow: '1 / 3' }),
  facts: css({ gridColumn: '4 / 6', gridRow: '4 / 6' }),
  blinding: css({ gridColumn: '4 / 6', gridRow: '7 / 9' }),
  primary: css({ gridColumn: '7 / 9', gridRow: '1 / 3' }),
  second: css({ gridColumn: '7 / 9', gridRow: '4 / 6' }),
  aggregate: css({ gridColumn: '10 / 12', gridRow: '1 / 3' }),
  read: css({ gridColumn: '10 / 12', gridRow: '4 / 6' }),
  owner: css({ gridColumn: '10 / 12', gridRow: '7 / 9' }),
}
const phaseAt = {
  'p-line-runs': css({ gridColumn: '3', gridRow: '1 / 3', alignSelf: 'center' }),
  'e-facts': css({ gridColumn: '3', gridRow: '2 / 5' }),
  'e-primary': css({ gridColumn: '6', gridRow: '2 / 8' }),
  'e-second': css({ gridColumn: '6', gridRow: '5 / 8' }),
  'p-line-aggregate': css({ gridColumn: '9', gridRow: '1 / 3', alignSelf: 'center' }),
  'e-aggregate': css({ gridColumn: '9', gridRow: '2 / 5' }),
  loop: css({ gridColumn: '2 / 11', gridRow: '9' }),
}
const phaseSteps: Stage[] = [
  { id: 'gate', title: 'Pre-registered?', note: 'The ledger names method 0.7.', gate: true },
  { id: 'stop', title: 'Stop', note: 'Run skill-eval-cases first.', gate: true },
  { id: 'runs', title: 'Runs', note: 'Each case, model and repeat.' },
  { id: 'facts', title: 'Facts', note: 'Jev, 4 at a time.' },
  { id: 'blinding', title: 'Blinding', note: 'Hides which runs had the skill.' },
  { id: 'primary', title: 'Primary grades', note: 'The other model family.' },
  { id: 'second', title: 'Second grades', note: 'Own family, 20 runs or more.' },
  { id: 'aggregate', title: 'Aggregate', note: 'Then the paired difference.' },
  { id: 'read', title: 'Read', note: 'Findings go in the ledger.' },
  { id: 'owner', title: 'Owner decides', note: 'Done, iterate or redesign.', gate: true },
]

function ByPhase() {
  return (
    <main className={desktopPage}>
      <div className={phaseGrid} data-testid="phase">
        {phaseSteps.map((step) => (
          <Card key={step.id} step={step} className={cx(lanes[step.id])} />
        ))}
        <div className={phaseAt['p-line-runs']} data-testid="p-line-runs">
          <FlowLine />
        </div>
        <div className={phaseAt['e-facts']} data-testid="e-facts">
          <FlowElbow from="top" />
        </div>
        <div className={phaseAt['e-primary']} data-testid="e-primary">
          <FlowElbow from="bottom" />
        </div>
        <div className={phaseAt['e-second']} data-testid="e-second">
          <FlowElbow from="bottom" />
        </div>
        <div className={phaseAt['p-line-aggregate']} data-testid="p-line-aggregate">
          <FlowLine />
        </div>
        <div className={phaseAt['e-aggregate']} data-testid="e-aggregate">
          <FlowElbow from="bottom" bend="8" />
        </div>
        <div className={phaseAt.loop} data-testid="loop">
          <FlowLoop end="up" label="new failure" />
        </div>
      </div>
      <Swatches />
    </main>
  )
}

type Side = 'left' | 'right' | 'top' | 'bottom'
type Direction = 'right' | 'down' | 'left' | 'up'

const box = (el: Element) => el.getBoundingClientRect()

function swatchEl(root: HTMLElement, name: string) {
  const el = root.querySelector(`[data-swatch="${name}"]`)
  if (el === null) throw new Error(`no swatch ${name}`)
  return el
}
const swatch = (root: HTMLElement, name: string) => getComputedStyle(swatchEl(root, name)).backgroundColor

function part(root: Element, selector: string): HTMLElement {
  const el = root.querySelector(selector)
  if (!(el instanceof HTMLElement)) throw new Error(`no ${selector}`)
  return el
}

function parts(root: Element, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll(selector)).filter((el) => el instanceof HTMLElement)
}

async function near(actual: number, expected: number, what: string) {
  await expect({ what, off: Math.abs(actual - expected) <= 1 }).toEqual({ what, off: true })
}

// Which way a head points: it draws two sides of a square turned 45° about
// their corner, and that corner is the tip.
function pointing(head: HTMLElement): Direction | 'none' {
  const s = getComputedStyle(head)
  const drawn = (side: Side) => Number.parseFloat(s.getPropertyValue(`border-${side}-width`)) > 0
  const sides = (['top', 'right', 'bottom', 'left'] as const).filter(drawn).join(' ')
  const turned = s.transform === 'matrix(0.707107, 0.707107, -0.707107, 0.707107, 0, 0)'
  if (!turned) return 'none'
  if (sides === 'top right') return 'right'
  if (sides === 'right bottom') return 'down'
  if (sides === 'bottom left') return 'left'
  if (sides === 'top left') return 'up'
  return 'none'
}

// Figma ends each arrow's tip 2 px (spacing `2`) before the step it points
// at (D13 447:74 to 447:83), and the dashed loop 4 px (spacing `4`) before
// the stop (447:84).
const tipGap = 2
const loopTipGap = 4

// The space between a head's tip and the edge of the target it points at.
function tipToTarget(head: HTMLElement, direction: Direction, target: DOMRect) {
  const h = box(head)
  if (direction === 'right') return target.left - h.right
  if (direction === 'left') return h.left - target.right
  if (direction === 'down') return target.top - h.bottom
  return h.top - target.bottom
}

// The tip stops `gap` px before the target's edge, within 0.5 px.
async function expectTipGap(head: HTMLElement, direction: Direction, target: DOMRect, gap: number, what: string) {
  const off = tipToTarget(head, direction, target)
  await expect({ what, gap: Math.abs(off - gap) <= 0.5 ? gap : off }).toEqual({ what, gap })
}

// The head points at the target, its tip stops `gap` px before the target's
// edge, and it sits at `at` across the line, in the middle of where the line
// meets the target.
async function expectHead(head: HTMLElement, direction: Direction, target: DOMRect, at: number, gap: number, what: string) {
  await expect({ what, pointing: pointing(head) }).toEqual({ what, pointing: direction })
  await expectTipGap(head, direction, target, gap, what)
  const h = box(head)
  const centre = { x: (h.left + h.right) / 2, y: (h.top + h.bottom) / 2 }
  if (direction === 'right' || direction === 'left') await near(centre.y, at, `${what} tip y`)
  else await near(centre.x, at, `${what} tip x`)
}

// Each connector, by its test id, with the steps it leaves and the steps its heads point at, in the heads' order.
type Link = { id: string; from: string[]; to: string[] }
const desktopLinks: Link[] = [
  { id: 'line-2', from: ['gate'], to: ['s1'] },
  { id: 'line-4', from: ['s1'], to: ['s2'] },
  { id: 'line-6', from: ['s2'], to: ['s3'] },
  { id: 'line-12', from: ['s6'], to: ['s7'] },
  { id: 'line-14', from: ['s7'], to: ['owner'] },
  { id: 'fork', from: ['s3'], to: ['s4', 's5'] },
  { id: 'join', from: ['s4', 's5'], to: ['s6'] },
  { id: 'exit', from: ['gate'], to: ['stop'] },
  { id: 'loop', from: ['owner'], to: ['stop'] },
]
const desktopCards = ['gate', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 'owner', 'stop']
const phaseLinks: Link[] = [
  { id: 'p-line-runs', from: ['gate'], to: ['runs'] },
  { id: 'e-facts', from: ['gate'], to: ['facts'] },
  { id: 'e-primary', from: ['blinding'], to: ['primary'] },
  { id: 'e-second', from: ['blinding'], to: ['second'] },
  { id: 'p-line-aggregate', from: ['primary'], to: ['aggregate'] },
  { id: 'e-aggregate', from: ['second'], to: ['aggregate'] },
  { id: 'loop', from: ['owner'], to: ['stop'] },
]
const phaseCards = phaseSteps.map((step) => step.id)
const columnLinks: Link[] = [
  { id: 'c-line-1', from: ['c-gate'], to: ['c-s3'] },
  { id: 'c-fork', from: ['c-s3'], to: ['c-s4', 'c-s5'] },
  { id: 'c-join', from: ['c-s4', 'c-s5'], to: ['c-s6'] },
  { id: 'c-line-2', from: ['c-s6'], to: ['c-owner'] },
]
const columnCards = ['c-gate', 'c-s3', 'c-s4', 'c-s5', 'c-s6', 'c-owner']

// The space between two boxes: positive when apart (along the axis that
// separates them), 0 when they meet, negative when they overlap.
function apartBy(a: DOMRect, b: DOMRect) {
  const across = Math.max(b.left - a.right, a.left - b.right)
  const along = Math.max(b.top - a.bottom, a.top - b.bottom)
  return Math.max(across, along)
}

// No drawn part of a connector (line, stem, spine, arm, loop stroke or head)
// touches or overlaps a step card: each stays at least 1.5 px from every
// card (the Design System gate counts boxes under 1.5 px apart as touching),
// except that it may start on the edge of a step it leaves, as Figma starts
// each arrow there. Each head's tip stops its gap before its target.
async function expectApart(canvasElement: HTMLElement, links: Link[], cards: string[]) {
  const canvas = within(canvasElement)
  for (const link of links) {
    const drawn = parts(canvas.getByTestId(link.id), '[class*="flow-"]:not([class*="__root"]):not([class*="__label"])')
    await expect(drawn.length).toBeGreaterThan(0)
    for (const piece of drawn) {
      for (const id of cards) {
        const gap = apartBy(box(piece), box(canvas.getByTestId(id)))
        const leaves = link.from.includes(id)
        const what = `${link.id} ${piece.className.split(' ')[0] ?? ''} and ${id}`
        await expect({ what, apart: leaves ? gap >= -1 : gap >= 1.5 }).toEqual({ what, apart: true })
      }
    }
    const heads = parts(canvas.getByTestId(link.id), '[class*="__head"]')
    await expect(heads).toHaveLength(link.to.length)
    for (const [i, head] of heads.entries()) {
      const target = link.to[i] ?? ''
      const direction = pointing(head)
      if (direction === 'none') throw new Error(`${link.id} head points nowhere`)
      await expectTipGap(head, direction, box(canvas.getByTestId(target)), link.id === 'loop' ? loopTipGap : tipGap, `${link.id} into ${target}`)
    }
  }
}

// Each stroke is borderWidths.strong (1.5 px) in the given colour and style.
async function expectStroke(el: HTMLElement, side: Side, colour: string, style: string, what: string) {
  const s = getComputedStyle(el)
  const strong = getComputedStyle(swatchEl(el.ownerDocument.body, 'stroke')).borderTopWidth
  await expect({ what, width: s.getPropertyValue(`border-${side}-width`), colour: s.getPropertyValue(`border-${side}-color`), style: s.getPropertyValue(`border-${side}-style`) }).toEqual({
    what,
    width: strong,
    colour,
    style,
  })
}

const midY = (r: DOMRect) => (r.top + r.bottom) / 2
const midX = (r: DOMRect) => (r.left + r.right) / 2

const horizontal: Meta<typeof Desktop>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const muted = swatch(canvasElement, 'muted')
  const amber = swatch(canvasElement, 'amber')
  const el = (id: string) => canvas.getByTestId(id)

  // Each straight line spans from its stage's right edge to the next stage's left edge, at the middle of the cards.
  const pairs: [string, string, string][] = [
    ['line-2', 'gate', 's1'],
    ['line-4', 's1', 's2'],
    ['line-6', 's2', 's3'],
    ['line-12', 's6', 's7'],
    ['line-14', 's7', 'owner'],
  ]
  for (const [id, from, to] of pairs) {
    const root = part(el(id), '.flow-line__root')
    const r = box(root)
    const a = box(el(from))
    const b = box(el(to))
    await near(r.left, a.right, `${id} starts at ${from}`)
    await near(r.right, b.left, `${id} ends at ${to}`)
    await near(midY(r), midY(b), `${id} at the cards' middle`)
    await expect(Math.round(r.height)).toBe(12)
    await expect(getComputedStyle(root).color).toBe(muted)
    const stroke = part(root, '.flow-line__line')
    await expectStroke(stroke, 'top', muted, 'solid', id)
    await near(box(stroke).left, a.right, `${id} line starts at ${from}`)
    await near(box(stroke).right, b.left - tipGap, `${id} line ends at the tip, 2 before ${to}`)
    await expectHead(part(root, '.flow-line__head'), 'right', b, midY(b), tipGap, id)
    await expect(root.querySelectorAll('.flow-line__label')).toHaveLength(0)
  }

  // The fork runs from step 3's right edge to the left edges of steps 4 and 5, its arms at their middles.
  const s3 = box(el('s3'))
  const s4 = box(el('s4'))
  const s5 = box(el('s5'))
  const s6 = box(el('s6'))
  const fork = part(el('fork'), '.flow-branch__root')
  await near(box(fork).left, s3.right, 'fork starts at step 3')
  await near(box(fork).right, s4.left, 'fork ends at step 4')
  await near(box(fork).right, s5.left, 'fork ends at step 5')
  await near(box(fork).top, s4.top, 'fork spans from step 4')
  await near(box(fork).bottom, s5.bottom, 'fork spans to step 5')
  await near(midY(box(part(fork, '.flow-branch__stem'))), midY(s3), 'fork stem at step 3 middle')
  await near(box(part(fork, '.flow-branch__stem')).left, s3.right, 'fork stem leaves step 3')
  const [forkStart, forkEnd] = parts(fork, '.flow-branch__arm')
  if (forkStart === undefined || forkEnd === undefined) throw new Error('fork arms')
  await near(midY(box(forkStart)), midY(s4), 'fork arm at step 4 middle')
  await near(midY(box(forkEnd)), midY(s5), 'fork arm at step 5 middle')
  await near(box(forkStart).right, s4.left - tipGap, 'fork arm ends 2 before step 4')
  await near(box(forkEnd).right, s5.left - tipGap, 'fork arm ends 2 before step 5')
  const spine = box(part(fork, '.flow-branch__spine'))
  await near(spine.top, midY(s4) - 0.75, 'fork spine from step 4')
  await near(spine.bottom, midY(s5) + 0.75, 'fork spine to step 5')
  for (const piece of [part(fork, '.flow-branch__stem'), forkStart, forkEnd]) await expectStroke(piece, 'top', muted, 'solid', 'fork')
  await expectStroke(part(fork, '.flow-branch__spine'), 'left', muted, 'solid', 'fork spine')
  const forkHeads = parts(fork, '.flow-branch__head')
  await expect(forkHeads).toHaveLength(2)
  await expectHead(forkHeads[0] ?? fork, 'right', s4, midY(s4), tipGap, 'fork into step 4')
  await expectHead(forkHeads[1] ?? fork, 'right', s5, midY(s5), tipGap, 'fork into step 5')
  await expect(fork).toHaveAttribute('aria-hidden', 'true')

  // The join runs from the right edges of steps 4 and 5 into step 6's left edge, at its middle.
  const join = part(el('join'), '.flow-branch__root')
  await near(box(join).left, s4.right, 'join starts at step 4')
  await near(box(join).left, s5.right, 'join starts at step 5')
  await near(box(join).right, s6.left, 'join ends at step 6')
  const [joinStart, joinEnd] = parts(join, '.flow-branch__arm')
  if (joinStart === undefined || joinEnd === undefined) throw new Error('join arms')
  await near(midY(box(joinStart)), midY(s4), 'join arm at step 4 middle')
  await near(midY(box(joinEnd)), midY(s5), 'join arm at step 5 middle')
  await near(box(joinStart).left, s4.right, 'join arm leaves step 4')
  await near(box(part(join, '.flow-branch__stem')).right, s6.left - tipGap, 'join stem ends 2 before step 6')
  const joinHeads = parts(join, '.flow-branch__head')
  await expect(joinHeads).toHaveLength(1)
  await expectHead(joinHeads[0] ?? join, 'right', s6, midY(s6), tipGap, 'join into step 6')

  // The gate's way out runs down from the gate's foot to the stop's top, in amber, with "no" 8 beside it and 12 under its start.
  const exit = part(el('exit'), '.flow-line__root')
  const gateBox = box(el('gate'))
  const stopBox = box(el('stop'))
  await near(box(exit).top, gateBox.bottom, 'exit starts at the gate')
  await near(box(exit).bottom, stopBox.top, 'exit ends at the stop')
  await near(midX(box(exit)), midX(gateBox), 'exit under the gate middle')
  await expect(Math.round(box(exit).width)).toBe(12)
  await expectStroke(part(exit, '.flow-line__line'), 'left', amber, 'solid', 'exit')
  await near(box(part(exit, '.flow-line__line')).top, gateBox.bottom, 'exit line starts at the gate')
  await near(box(part(exit, '.flow-line__line')).bottom, stopBox.top - tipGap, 'exit line ends 2 before the stop')
  await expectHead(part(exit, '.flow-line__head'), 'down', stopBox, midX(box(exit)), tipGap, 'exit into the stop')
  const no = within(el('exit')).getByText('no')
  const n = getComputedStyle(no)
  // The `small` text style, 12/16 on the 4 px grid (Figma draws 12/17).
  await expect([n.color, n.fontSize, Math.round(Number.parseFloat(n.lineHeight))]).toEqual([amber, '12px', 16])
  await near(box(no).left - midX(box(exit)), 8, 'no 8 from the line')
  await near(box(no).top - box(exit).top, 12, 'no 12 under the start')

  // The loop runs from under Owner decides, down and back into the stop's right edge at its middle: dashed and amber.
  const loop = part(el('loop'), '.flow-loop__root')
  const owner = box(el('owner'))
  const l = box(loop)
  await near(l.top, owner.bottom, 'loop starts under Owner decides')
  await near(l.right, midX(owner), 'loop turns under the middle of Owner decides')
  await near(l.left, stopBox.right, 'loop ends at the stop')
  await near(l.bottom, midY(stopBox), 'loop meets the stop at its middle')
  const down = part(loop, '.flow-loop__down')
  const back = part(loop, '.flow-loop__back')
  await expectStroke(down, 'right', amber, 'dashed', 'loop down')
  await expectStroke(back, 'bottom', amber, 'dashed', 'loop back')
  for (const stroke of [down, back]) {
    await expect([getComputedStyle(stroke).borderTopWidth, getComputedStyle(stroke).borderLeftWidth]).toEqual(['0px', '0px'])
  }
  // The strokes are centred on the box's right and bottom edges.
  await near(box(down).right - 0.75, l.right, 'loop down on the right edge')
  await near(box(back).bottom - 0.75, l.bottom, 'loop back on the bottom edge')
  // The way down starts right under Owner decides, as Figma's does; the way back ends at the tip, 4 before the stop.
  await near(box(down).top, owner.bottom, 'loop down starts under Owner decides')
  await near(box(back).left, stopBox.right + loopTipGap, 'loop back ends 4 before the stop')
  await expectHead(part(loop, '.flow-loop__head'), 'left', stopBox, midY(stopBox), loopTipGap, 'loop into the stop')
  await expect(getComputedStyle(part(loop, '.flow-loop__head')).borderBottomColor).toBe(amber)
  const label = within(el('loop')).getByText('new failure')
  const lb = getComputedStyle(label)
  await expect([lb.color, lb.fontFamily.includes('Mono'), lb.fontSize]).toEqual([amber, true, '12px'])
  await expect(box(label).top).toBeGreaterThan(l.bottom)
  await near(midX(box(label)), midX(l), 'label in the middle of the loop')

  await expectApart(canvasElement, desktopLinks, desktopCards)
}

const column: Meta<typeof Column>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const muted = swatch(canvasElement, 'muted')
  const el = (id: string) => canvas.getByTestId(id)
  await expect(window.innerWidth).toBe(390)

  // A down line spans from one card's foot to the next card's top, in the column's middle.
  for (const [id, from, to] of [
    ['c-line-1', 'c-gate', 'c-s3'],
    ['c-line-2', 'c-s6', 'c-owner'],
  ] as const) {
    const root = part(el(id), '.flow-line__root')
    const r = box(root)
    const a = box(el(from))
    const b = box(el(to))
    await near(r.top, a.bottom, `${id} starts at ${from}`)
    await near(r.bottom, b.top, `${id} ends at ${to}`)
    await near(midX(r), midX(b), `${id} in the middle`)
    await expectStroke(part(root, '.flow-line__line'), 'left', muted, 'solid', id)
    await near(box(part(root, '.flow-line__line')).bottom, b.top - tipGap, `${id} line ends at the tip, 2 before ${to}`)
    await expectHead(part(root, '.flow-line__head'), 'down', b, midX(b), tipGap, id)
  }

  // The fork runs from step 3's foot to the tops of steps 4 and 5, its arms at their middles.
  const s3 = box(el('c-s3'))
  const s4 = box(el('c-s4'))
  const s5 = box(el('c-s5'))
  const s6 = box(el('c-s6'))
  const fork = part(el('c-fork'), '.flow-branch__root')
  await near(box(fork).top, s3.bottom, 'fork starts at step 3')
  await near(box(fork).bottom, s4.top, 'fork ends at step 4')
  await near(box(fork).left, s4.left, 'fork spans from step 4')
  await near(box(fork).right, s5.right, 'fork spans to step 5')
  await near(midX(box(part(fork, '.flow-branch__stem'))), midX(s3), 'fork stem at step 3 middle')
  const [a4, a5] = parts(fork, '.flow-branch__arm')
  if (a4 === undefined || a5 === undefined) throw new Error('fork arms')
  await near(midX(box(a4)), midX(s4), 'arm at step 4 middle')
  await near(midX(box(a5)), midX(s5), 'arm at step 5 middle')
  await near(box(a4).bottom, s4.top - tipGap, 'arm ends 2 before step 4')
  await near(box(a5).bottom, s5.top - tipGap, 'arm ends 2 before step 5')
  const spine = box(part(fork, '.flow-branch__spine'))
  await near(spine.left, midX(s4) - 0.75, 'spine from step 4')
  await near(spine.right, midX(s5) + 0.75, 'spine to step 5')
  await expectStroke(part(fork, '.flow-branch__spine'), 'top', muted, 'solid', 'fork spine')
  for (const piece of [part(fork, '.flow-branch__stem'), a4, a5]) await expectStroke(piece, 'left', muted, 'solid', 'fork')
  const heads = parts(fork, '.flow-branch__head')
  await expect(heads).toHaveLength(2)
  await expectHead(heads[0] ?? fork, 'down', s4, midX(s4), tipGap, 'fork into step 4')
  await expectHead(heads[1] ?? fork, 'down', s5, midX(s5), tipGap, 'fork into step 5')
  await expect(Math.round(box(fork).height)).toBe(24)

  // The join runs from the feet of steps 4 and 5 into step 6's top, in its middle.
  const join = part(el('c-join'), '.flow-branch__root')
  await near(box(join).top, Math.max(s4.bottom, s5.bottom), 'join starts at steps 4 and 5')
  await near(box(join).bottom, s6.top, 'join ends at step 6')
  const [j4, j5] = parts(join, '.flow-branch__arm')
  if (j4 === undefined || j5 === undefined) throw new Error('join arms')
  await near(midX(box(j4)), midX(s4), 'join arm at step 4 middle')
  await near(midX(box(j5)), midX(s5), 'join arm at step 5 middle')
  await near(box(part(join, '.flow-branch__stem')).bottom, s6.top - tipGap, 'join stem ends 2 before step 6')
  const joinHeads = parts(join, '.flow-branch__head')
  await expect(joinHeads).toHaveLength(1)
  await expectHead(joinHeads[0] ?? join, 'down', s6, midX(s6), tipGap, 'join into step 6')

  // Nothing runs past the 390 px phone.
  await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390)
  for (const node of Array.from(el('column').querySelectorAll('*'))) {
    await expect(box(node).right).toBeLessThanOrEqual(390 + 0.5)
    await expect(box(node).left).toBeGreaterThanOrEqual(-0.5)
  }

  await expectApart(canvasElement, columnLinks, columnCards)
}

// D08's flow by phase. Each elbow's box runs from its source's right edge to
// its target's left edge and from one card's middle to the other's; the way
// out leaves the source at its middle, the way across sits at the bend, and
// the way in ends at the head, whose tip stops 2 before the target at its
// middle. The loop comes back under the lanes and up into the stop's foot,
// its head pointing up 4 under it.
const byPhase: Meta<typeof ByPhase>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const muted = swatch(canvasElement, 'muted')
  const amber = swatch(canvasElement, 'amber')
  const el = (id: string) => canvas.getByTestId(id)
  const strong = Number.parseFloat(getComputedStyle(swatchEl(canvasElement, 'stroke')).borderTopWidth)

  // [test id, source, target, the edge it leaves on, the bend from the source (undefined: halfway)]
  const elbows: [string, string, string, 'top' | 'bottom', number | undefined][] = [
    ['e-facts', 'gate', 'facts', 'top', undefined],
    ['e-primary', 'blinding', 'primary', 'bottom', undefined],
    ['e-second', 'blinding', 'second', 'bottom', undefined],
    ['e-aggregate', 'second', 'aggregate', 'bottom', 8],
  ]
  for (const [id, from, to, edge, bendAt] of elbows) {
    const root = part(el(id), '.flow-elbow__root')
    const r = box(root)
    const a = box(el(from))
    const b = box(el(to))
    const outY = midY(a)
    const inY = midY(b)
    await near(r.left, a.right, `${id} starts at ${from}`)
    await near(r.right, b.left, `${id} ends at ${to}`)
    await near(edge === 'top' ? r.top : r.bottom, outY, `${id} leaves ${from} at its middle`)
    await near(edge === 'top' ? r.bottom : r.top, inY, `${id} enters ${to} at its middle`)
    await expect(root).toHaveAttribute('aria-hidden', 'true')
    await expect(getComputedStyle(root).color).toBe(muted)
    const out = part(root, '.flow-elbow__out')
    const across = part(root, '.flow-elbow__across')
    const into = part(root, '.flow-elbow__in')
    await expectStroke(out, 'top', muted, 'solid', `${id} out`)
    await expectStroke(across, 'left', muted, 'solid', `${id} across`)
    await expectStroke(into, 'top', muted, 'solid', `${id} in`)
    // The bend: halfway, or the given spacing from the source.
    const bendX = bendAt === undefined ? midX(r) : a.right + bendAt
    await near(midX(box(across)), bendX, `${id} bends at ${bendAt === undefined ? 'the middle' : String(bendAt)}`)
    await near(midY(box(out)), outY, `${id} out at ${from}'s middle`)
    await near(box(out).left, a.right, `${id} out leaves ${from}`)
    await near(box(out).right, bendX + strong / 2, `${id} out runs to the bend`)
    await near(box(across).top, Math.min(outY, inY) - strong / 2, `${id} across from the upper line`)
    await near(box(across).bottom, Math.max(outY, inY) + strong / 2, `${id} across to the lower line`)
    await near(midY(box(into)), inY, `${id} in at ${to}'s middle`)
    await near(box(into).left, bendX - strong / 2, `${id} in starts at the bend`)
    await near(box(into).right, b.left - tipGap, `${id} in ends at the tip, 2 before ${to}`)
    const heads = parts(root, '.flow-elbow__head')
    await expect(heads).toHaveLength(1)
    await expectHead(heads[0] ?? root, 'right', b, inY, tipGap, `${id} into ${to}`)
  }

  // The loop: down from under Owner decides, back under the lanes, and up into the stop's foot.
  const loop = part(el('loop'), '.flow-loop__root')
  const l = box(loop)
  const stopBox = box(el('stop'))
  const owner = box(el('owner'))
  await near(l.left, midX(stopBox), 'loop ends under the middle of the stop')
  await near(l.right, midX(owner), 'loop leaves under the middle of Owner decides')
  await near(l.top, stopBox.bottom, 'loop box starts at the stop foot')
  await near(l.top, owner.bottom, 'loop box starts at Owner decides foot')
  const down = part(loop, '.flow-loop__down')
  const back = part(loop, '.flow-loop__back')
  const up = part(loop, '.flow-loop__up')
  await expectStroke(down, 'right', amber, 'dashed', 'loop down')
  await expectStroke(back, 'bottom', amber, 'dashed', 'loop back')
  await expectStroke(up, 'left', amber, 'dashed', 'loop up')
  await near(box(down).top, owner.bottom, 'loop down starts under Owner decides')
  await near(box(back).left, l.left - strong / 2, 'loop back runs to the way up')
  await near(midX(box(up)), l.left, 'loop up on the left edge')
  await near(box(up).bottom, l.bottom + strong / 2, 'loop up starts at the way back')
  await near(box(up).top, stopBox.bottom + loopTipGap, 'loop up ends 4 under the stop')
  const head = part(loop, '.flow-loop__head')
  await expectHead(head, 'up', stopBox, midX(stopBox), loopTipGap, 'loop up into the stop')
  await expect(getComputedStyle(head).borderTopColor).toBe(amber)
  const label = within(el('loop')).getByText('new failure')
  await expect(box(label).top).toBeGreaterThan(l.bottom)

  await expectApart(canvasElement, phaseLinks, phaseCards)
}

// D13's flow squeezed to the widths the Design System gate checks (390 and
// 1200 px): no connector part touches or overlaps a step card, and each tip
// keeps its gap.
const apartAt =
  (width: number, links: Link[] = desktopLinks, cards: string[] = desktopCards): NonNullable<Meta<typeof Desktop>['play']> =>
  async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(width)
    await expectApart(canvasElement, links, cards)
  }

const meta = {
  title: 'Data display/Flow connector',
  component: Desktop,
} satisfies Meta<typeof Desktop>
export default meta

type Story = StoryObj<typeof meta>

const desktop = { d13: { name: 'Desktop (D13)', styles: { width: '1512px', height: '982px' } } }
const d08 = { d08: { name: 'Desktop (D08)', styles: { width: '1512px', height: '982px' } } }
const phone = { m09: { name: 'Phone (M09)', styles: { width: '390px', height: '844px' } } }
const narrow = { narrow: { name: 'Narrow (390)', styles: { width: '390px', height: '844px' } } }
const medium = { medium: { name: 'Medium (1200)', styles: { width: '1200px', height: '900px' } } }

/** D13's flow: stages joined by lines, a fork and a join around steps 4 and 5, the gate's way out with "no", and the dashed loop back to the stop. */
export const HorizontalDark: Story = { render: () => <Desktop />, parameters: { viewport: { options: desktop } }, globals: { mode: 'dark', viewport: { value: 'd13' } }, play: horizontal }
export const HorizontalLight: Story = { ...HorizontalDark, globals: { mode: 'light', viewport: { value: 'd13' } }, play: horizontal }

/** T08 and M09's column on a 390 px phone: down lines between steps, and the fork and join around steps 4 and 5 side by side. */
export const ColumnDark: Story = { render: () => <Column />, parameters: { viewport: { options: phone } }, globals: { mode: 'dark', viewport: { value: 'm09' } }, play: column }
export const ColumnLight: Story = { ...ColumnDark, globals: { mode: 'light', viewport: { value: 'm09' } }, play: column }

/** D13's flow at 390 px, as the Design System gate draws it: no connector touches a step card. */
export const HorizontalNarrowDark: Story = {
  render: () => <Desktop />,
  parameters: { viewport: { options: narrow } },
  globals: { mode: 'dark', viewport: { value: 'narrow' } },
  play: apartAt(390),
}
export const HorizontalNarrowLight: Story = { ...HorizontalNarrowDark, globals: { mode: 'light', viewport: { value: 'narrow' } }, play: apartAt(390) }

/** D13's flow at 1200 px, as the Design System gate draws it: no connector touches a step card. */
export const HorizontalMediumDark: Story = {
  render: () => <Desktop />,
  parameters: { viewport: { options: medium } },
  globals: { mode: 'dark', viewport: { value: 'medium' } },
  play: apartAt(1200),
}
export const HorizontalMediumLight: Story = { ...HorizontalMediumDark, globals: { mode: 'light', viewport: { value: 'medium' } }, play: apartAt(1200) }

/** D08's flow by phase: elbows from a step at one row into steps at others, halfway or 8 from the source, and the dashed loop back up into the stop's foot. */
export const ByPhaseDark: Story = { render: () => <ByPhase />, parameters: { viewport: { options: d08 } }, globals: { mode: 'dark', viewport: { value: 'd08' } }, play: byPhase }
export const ByPhaseLight: Story = { ...ByPhaseDark, globals: { mode: 'light', viewport: { value: 'd08' } }, play: byPhase }

/** D08's flow by phase at 390 px, as the Design System gate draws it: no elbow or loop touches a step card. */
export const ByPhaseNarrowDark: Story = {
  render: () => <ByPhase />,
  parameters: { viewport: { options: narrow } },
  globals: { mode: 'dark', viewport: { value: 'narrow' } },
  play: apartAt(390, phaseLinks, phaseCards),
}
export const ByPhaseNarrowLight: Story = { ...ByPhaseNarrowDark, globals: { mode: 'light', viewport: { value: 'narrow' } }, play: apartAt(390, phaseLinks, phaseCards) }

/** D08's flow by phase at 1200 px, as the Design System gate draws it: no elbow or loop touches a step card. */
export const ByPhaseMediumDark: Story = {
  render: () => <ByPhase />,
  parameters: { viewport: { options: medium } },
  globals: { mode: 'dark', viewport: { value: 'medium' } },
  play: apartAt(1200, phaseLinks, phaseCards),
}
export const ByPhaseMediumLight: Story = { ...ByPhaseMediumDark, globals: { mode: 'light', viewport: { value: 'medium' } }, play: apartAt(1200, phaseLinks, phaseCards) }
