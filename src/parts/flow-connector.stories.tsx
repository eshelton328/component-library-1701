import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css, cx } from '../../styled-system/css'
import { FlowBranch, FlowLine, FlowLoop } from './flow-connector'

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

// The head points at the target and its tip touches the target's edge, in the middle of where the line meets it.
async function expectHead(head: HTMLElement, direction: Direction, tip: { x: number; y: number }, what: string) {
  await expect({ what, pointing: pointing(head) }).toEqual({ what, pointing: direction })
  const h = box(head)
  const centre = { x: (h.left + h.right) / 2, y: (h.top + h.bottom) / 2 }
  if (direction === 'right') {
    await near(h.right, tip.x, `${what} tip x`)
    await near(centre.y, tip.y, `${what} tip y`)
  } else if (direction === 'left') {
    await near(h.left, tip.x, `${what} tip x`)
    await near(centre.y, tip.y, `${what} tip y`)
  } else if (direction === 'down') {
    await near(h.bottom, tip.y, `${what} tip y`)
    await near(centre.x, tip.x, `${what} tip x`)
  } else {
    await near(h.top, tip.y, `${what} tip y`)
    await near(centre.x, tip.x, `${what} tip x`)
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
    await near(box(stroke).right, b.left, `${id} line reaches ${to}`)
    await expectHead(part(root, '.flow-line__head'), 'right', { x: b.left, y: midY(b) }, id)
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
  await near(box(forkStart).right, s4.left, 'fork arm reaches step 4')
  const spine = box(part(fork, '.flow-branch__spine'))
  await near(spine.top, midY(s4) - 0.75, 'fork spine from step 4')
  await near(spine.bottom, midY(s5) + 0.75, 'fork spine to step 5')
  for (const piece of [part(fork, '.flow-branch__stem'), forkStart, forkEnd]) await expectStroke(piece, 'top', muted, 'solid', 'fork')
  await expectStroke(part(fork, '.flow-branch__spine'), 'left', muted, 'solid', 'fork spine')
  const forkHeads = parts(fork, '.flow-branch__head')
  await expect(forkHeads).toHaveLength(2)
  await expectHead(forkHeads[0] ?? fork, 'right', { x: s4.left, y: midY(s4) }, 'fork into step 4')
  await expectHead(forkHeads[1] ?? fork, 'right', { x: s5.left, y: midY(s5) }, 'fork into step 5')
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
  await near(box(part(join, '.flow-branch__stem')).right, s6.left, 'join stem reaches step 6')
  const joinHeads = parts(join, '.flow-branch__head')
  await expect(joinHeads).toHaveLength(1)
  await expectHead(joinHeads[0] ?? join, 'right', { x: s6.left, y: midY(s6) }, 'join into step 6')

  // The gate's way out runs down from the gate's foot to the stop's top, in amber, with "no" 8 beside it and 12 under its start.
  const exit = part(el('exit'), '.flow-line__root')
  const gateBox = box(el('gate'))
  const stopBox = box(el('stop'))
  await near(box(exit).top, gateBox.bottom, 'exit starts at the gate')
  await near(box(exit).bottom, stopBox.top, 'exit ends at the stop')
  await near(midX(box(exit)), midX(gateBox), 'exit under the gate middle')
  await expect(Math.round(box(exit).width)).toBe(12)
  await expectStroke(part(exit, '.flow-line__line'), 'left', amber, 'solid', 'exit')
  await expectHead(part(exit, '.flow-line__head'), 'down', { x: midX(box(exit)), y: stopBox.top }, 'exit into the stop')
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
  const path = part(loop, '.flow-loop__path')
  await expectStroke(path, 'right', amber, 'dashed', 'loop down')
  await expectStroke(path, 'bottom', amber, 'dashed', 'loop back')
  await expect([getComputedStyle(path).borderTopWidth, getComputedStyle(path).borderLeftWidth]).toEqual(['0px', '0px'])
  // The strokes are centred on the box's right and bottom edges.
  await near(box(path).right - 0.75, l.right, 'loop down on the right edge')
  await near(box(path).bottom - 0.75, l.bottom, 'loop back on the bottom edge')
  await expectHead(part(loop, '.flow-loop__head'), 'left', { x: stopBox.right, y: midY(stopBox) }, 'loop into the stop')
  await expect(getComputedStyle(part(loop, '.flow-loop__head')).borderBottomColor).toBe(amber)
  const label = within(el('loop')).getByText('new failure')
  const lb = getComputedStyle(label)
  await expect([lb.color, lb.fontFamily.includes('Mono'), lb.fontSize]).toEqual([amber, true, '12px'])
  await expect(box(label).top).toBeGreaterThan(l.bottom)
  await near(midX(box(label)), midX(l), 'label in the middle of the loop')
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
    await expectHead(part(root, '.flow-line__head'), 'down', { x: midX(b), y: b.top }, id)
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
  await near(box(a4).bottom, s4.top, 'arm reaches step 4')
  const spine = box(part(fork, '.flow-branch__spine'))
  await near(spine.left, midX(s4) - 0.75, 'spine from step 4')
  await near(spine.right, midX(s5) + 0.75, 'spine to step 5')
  await expectStroke(part(fork, '.flow-branch__spine'), 'top', muted, 'solid', 'fork spine')
  for (const piece of [part(fork, '.flow-branch__stem'), a4, a5]) await expectStroke(piece, 'left', muted, 'solid', 'fork')
  const heads = parts(fork, '.flow-branch__head')
  await expect(heads).toHaveLength(2)
  await expectHead(heads[0] ?? fork, 'down', { x: midX(s4), y: s4.top }, 'fork into step 4')
  await expectHead(heads[1] ?? fork, 'down', { x: midX(s5), y: s5.top }, 'fork into step 5')
  await expect(Math.round(box(fork).height)).toBe(24)

  // The join runs from the feet of steps 4 and 5 into step 6's top, in its middle.
  const join = part(el('c-join'), '.flow-branch__root')
  await near(box(join).top, Math.max(s4.bottom, s5.bottom), 'join starts at steps 4 and 5')
  await near(box(join).bottom, s6.top, 'join ends at step 6')
  const [j4, j5] = parts(join, '.flow-branch__arm')
  if (j4 === undefined || j5 === undefined) throw new Error('join arms')
  await near(midX(box(j4)), midX(s4), 'join arm at step 4 middle')
  await near(midX(box(j5)), midX(s5), 'join arm at step 5 middle')
  await near(box(part(join, '.flow-branch__stem')).bottom, s6.top, 'join stem reaches step 6')
  const joinHeads = parts(join, '.flow-branch__head')
  await expect(joinHeads).toHaveLength(1)
  await expectHead(joinHeads[0] ?? join, 'down', { x: midX(s6), y: s6.top }, 'join into step 6')

  // Nothing runs past the 390 px phone.
  await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390)
  for (const node of Array.from(el('column').querySelectorAll('*'))) {
    await expect(box(node).right).toBeLessThanOrEqual(390 + 0.5)
    await expect(box(node).left).toBeGreaterThanOrEqual(-0.5)
  }
}

const meta = {
  title: 'Data display/Flow connector',
  component: Desktop,
} satisfies Meta<typeof Desktop>
export default meta

type Story = StoryObj<typeof meta>

const desktop = { d13: { name: 'Desktop (D13)', styles: { width: '1512px', height: '982px' } } }
const phone = { m09: { name: 'Phone (M09)', styles: { width: '390px', height: '844px' } } }

/** D13's flow: stages joined by lines, a fork and a join around steps 4 and 5, the gate's way out with "no", and the dashed loop back to the stop. */
export const HorizontalDark: Story = { render: () => <Desktop />, parameters: { viewport: { options: desktop } }, globals: { mode: 'dark', viewport: { value: 'd13' } }, play: horizontal }
export const HorizontalLight: Story = { ...HorizontalDark, globals: { mode: 'light', viewport: { value: 'd13' } } }

/** T08 and M09's column on a 390 px phone: down lines between steps, and the fork and join around steps 4 and 5 side by side. */
export const ColumnDark: Story = { render: () => <Column />, parameters: { viewport: { options: phone } }, globals: { mode: 'dark', viewport: { value: 'm09' } }, play: column }
export const ColumnLight: Story = { ...ColumnDark, globals: { mode: 'light', viewport: { value: 'm09' } } }
