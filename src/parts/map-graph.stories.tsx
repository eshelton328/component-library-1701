import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { MapGraph, type MapGraphEdge, type MapGraphNode, MapLegend, MapNode, MapSelectionCard } from './map-graph'

const page = css({ bg: 'bg.canvas', p: '24' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  overlay: css({ bg: 'surface.overlay' }),
  raised: css({ bg: 'surface.raised' }),
  selected: css({ bg: 'surface.selected' }),
  border: css({ bg: 'border.default' }),
  accent: css({ bg: 'accent.default' }),
  fgAccent: css({ bg: 'fg.accent' }),
  text: css({ bg: 'fg.default' }),
  muted: css({ bg: 'fg.muted' }),
  well: css({ bg: 'surface.well' }),
  rule: css({ bg: 'kind.rule' }),
  agent: css({ bg: 'kind.agent' }),
  skill: css({ bg: 'kind.skill' }),
}

// A part of Toolkit D2 (426:362): four columns 360 px apart, rows 52 px apart.
const nodes: MapGraphNode[] = [
  { id: 'writing', label: 'writing', kind: 'rule', meta: 'every session', x: 40, y: 70 },
  { id: 'ste100', label: 'ste100', kind: 'rule', x: 40, y: 122 },
  { id: 'commit-msg', label: 'commit-msg', kind: 'hook', x: 40, y: 174 },
  { id: 'writer', label: 'writer', kind: 'skill', x: 400, y: 70 },
  { id: 'audit-slop', label: 'audit-slop', kind: 'skill', x: 400, y: 122 },
  { id: 'ambitious', label: 'ambitious', kind: 'skill', x: 400, y: 174 },
  { id: 'writing-reviewer', label: 'writing-reviewer', kind: 'agent', x: 760, y: 70 },
  { id: 'skill-eval-round', label: 'skill-eval-round', kind: 'workflow', x: 1120, y: 70 },
]
const edges: MapGraphEdge[] = [
  { from: 'writer', to: 'writing' },
  { from: 'writer', to: 'ste100' },
  { from: 'writer', to: 'writing-reviewer' },
  { from: 'writer', to: 'audit-slop' },
  { from: 'writing-reviewer', to: 'writer' },
  { from: 'audit-slop', to: 'writing' },
  { from: 'commit-msg', to: 'ste100' },
  { from: 'writing-reviewer', to: 'missing' },
]
const columns = [
  { label: 'Rules and hooks', x: 44, y: 30 },
  { label: 'Skills', x: 404, y: 30 },
  { label: 'Agents', x: 764, y: 30 },
  { label: 'Workflows', x: 1124, y: 30 },
]

function Map({ onSelect, onOpen, initial = null }: { onSelect: (id: string | null) => void; onOpen: () => void; initial?: string | null }) {
  const [selected, setSelected] = useState<string | null>(initial)
  const select = (id: string | null) => {
    setSelected(id)
    onSelect(id)
  }
  return (
    <main className={page}>
      <MapGraph
        label="Toolkit map"
        width={1384}
        height={460}
        nodes={nodes}
        edges={edges}
        columns={columns}
        selectedId={selected}
        onSelect={select}
        legend={<MapLegend hint="Select an item to light its links" />}
        card={
          selected === 'writer' ? (
            <MapSelectionCard
              name="writer"
              kind="skill"
              description="Sources every claim, fits the form, then lints and has the draft reviewed."
              linksTo={7}
              linkedFrom={4}
              actionLabel="Open writer"
              onAction={onOpen}
              onClose={() => { select(null); }}
            />
          ) : null
        }
      />
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const meta = {
  title: 'Data display/Map graph',
  component: Map,
  args: { onSelect: fn(), onOpen: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const swatch = (name: string) => {
      const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
      if (el === null) throw new Error(`no swatch ${name}`)
      return getComputedStyle(el).backgroundColor
    }
    const map = canvas.getByRole('group', { name: 'Toolkit map' })
    const m = getComputedStyle(map)
    await expect([m.backgroundColor, m.borderTopColor, m.borderTopWidth, m.borderTopLeftRadius]).toEqual([swatch('overlay'), swatch('border'), '1px', '12px'])
    // Each node is a button placed at its x and y, 220 × 34.
    const node = (name: string) => within(map).getByRole('button', { name })
    const writing = node('writing every session')
    const writer = node('writer')
    const box = (el: Element) => el.getBoundingClientRect()
    await expect([box(writing).width, box(writing).height]).toEqual([220, 34])
    await expect(Math.round(box(writer).left - box(writing).left)).toBe(360)
    await expect(Math.round(box(node('ste100')).top - box(writing).top)).toBe(52)
    // A node with nothing selected: raised, a 1 px border in its kind colour, radius 8, 10 px sides, mono 12.
    const w = getComputedStyle(writing)
    await expect([w.backgroundColor, w.borderTopColor, w.borderTopWidth, w.borderTopLeftRadius, w.paddingLeft, w.columnGap]).toEqual([
      swatch('raised'),
      swatch('rule'),
      '1px',
      '8px',
      '10px',
      '8px',
    ])
    await expect(getComputedStyle(node('writing-reviewer')).borderTopColor).toBe(swatch('agent'))
    const label = within(writing).getByText('writing')
    await expect([getComputedStyle(label).fontSize, getComputedStyle(label).color]).toEqual(['12px', swatch('text')])
    await expect(getComputedStyle(label).fontFamily).toContain('Geist Mono')
    await expect(getComputedStyle(within(writing).getByText('every session')).color).toBe(swatch('rule'))
    await expect(writer).toHaveAttribute('aria-pressed', 'false')
    // Each node's description names its links and their direction; a node with none has no description.
    await expect(writer).toHaveAccessibleDescription('Links to writing, ste100, writing-reviewer, audit-slop. Linked from writing-reviewer.')
    await expect(node('ste100')).toHaveAccessibleDescription('Linked from writer, commit-msg.')
    await expect(node('ambitious')).not.toHaveAttribute('aria-describedby')
    // Column headings are mono capitals in muted; the edge to an unknown id is not drawn.
    const heading = Array.from(map.querySelectorAll('text')).find((t) => t.textContent === 'Skills')
    if (heading === undefined) throw new Error('no heading')
    await expect([getComputedStyle(heading).textTransform, getComputedStyle(heading).fill]).toEqual(['uppercase', swatch('muted')])
    const paths = () => Array.from(map.querySelectorAll('path.map-graph__edge'))
    await expect(paths()).toHaveLength(7)
    await expect(paths().every((p) => !p.hasAttribute('data-lit'))).toBe(true)
    const dimLine = getComputedStyle(paths()[0] ?? map)
    await expect([dimLine.stroke, dimLine.strokeWidth]).toEqual([swatch('muted'), '1px'])
    // The legend lists the five kinds with icons in their colours.
    const kinds = within(map).getByRole('list', { name: 'Kinds' })
    await expect(within(kinds).getAllByRole('listitem').map((i) => i.textContent)).toEqual(['Rule', 'Hook', 'Skill', 'Agent', 'Workflow'])
    const legend = kinds.parentElement
    if (legend === null) throw new Error('no legend')
    const l = getComputedStyle(legend)
    await expect([l.backgroundColor, l.borderTopLeftRadius, l.paddingTop, l.paddingLeft, l.columnGap]).toEqual([swatch('well'), '8px', '8px', '12px', '16px'])
    await expect(getComputedStyle(kinds.querySelector('[data-kind="skill"]') ?? kinds).color).toBe(swatch('skill'))
    await expect(within(legend).getByText('Select an item to light its links')).toBeInTheDocument()

    // Keyboard: Tab reaches the nodes, and Enter selects one.
    writer.focus()
    await userEvent.keyboard('{Enter}')
    await expect(args.onSelect).toHaveBeenLastCalledWith('writer')
    await waitFor(() => expect(writer).toHaveAttribute('aria-pressed', 'true'))
    const s = getComputedStyle(writer)
    await expect([s.backgroundColor, s.borderTopColor, s.borderTopWidth]).toEqual([swatch('selected'), swatch('accent'), '2px'])
    await expect(getComputedStyle(within(writer).getByText('writer')).color).toBe(swatch('fgAccent'))
    // Its links light up; nodes it links to stay lit and the others go dim.
    const lit = paths().filter((p) => p.hasAttribute('data-lit'))
    // Links from and to the selected node: four out and one in.
    await expect(lit).toHaveLength(5)
    const litLine = getComputedStyle(lit[0] ?? map)
    await expect([litLine.stroke, litLine.strokeWidth]).toEqual([swatch('accent'), '2px'])
    const dot = map.querySelector('circle.map-graph__edgeEnd[data-lit]')
    if (dot === null) throw new Error('no dot')
    await expect([dot.getAttribute('r'), getComputedStyle(dot).fill]).toEqual(['3', swatch('accent')])
    await expect(node('writing every session')).toHaveAttribute('data-state', 'lit')
    const ambitious = node('ambitious')
    await expect(ambitious).toHaveAttribute('data-state', 'dim')
    await expect(getComputedStyle(ambitious).borderTopColor).toBe(swatch('border'))
    // A dim node mutes its text, which keeps 4.5:1 contrast, and fades its icon.
    await expect(getComputedStyle(within(ambitious).getByText('ambitious')).color).toBe(swatch('muted'))
    await expect(getComputedStyle(ambitious.firstElementChild ?? ambitious).opacity).toBe('0.45')
    // The selection card: name, kind in its colour, counts, open and close.
    const card = within(map).getByRole('region', { name: 'writer' })
    const c = getComputedStyle(card)
    await expect([c.backgroundColor, c.borderTopColor, c.borderTopLeftRadius, c.paddingTop, c.rowGap]).toEqual([swatch('overlay'), swatch('accent'), '12px', '16px', '10px'])
    await expect(box(card).width).toBe(320)
    await expect(getComputedStyle(within(card).getByText('Skill')).color).toBe(swatch('skill'))
    await expect(within(card).getByText('→ links to 7 ← linked from 4', { normalizer: (t) => t.replace(/\s+/g, ' ').trim() })).toBeInTheDocument()
    await userEvent.click(within(card).getByRole('button', { name: 'Open writer' }))
    await expect(args.onOpen).toHaveBeenCalledOnce()
    // Escape on a node clears the selection.
    node('ambitious').focus()
    await userEvent.keyboard('{Escape}')
    await expect(args.onSelect).toHaveBeenLastCalledWith(null)
    await waitFor(() => expect(writer).toHaveAttribute('aria-pressed', 'false'))
    await expect(node('ambitious')).toHaveAttribute('data-state', 'lit')
    // Selecting by click, then the card's close button clears it.
    await userEvent.click(writer)
    await userEvent.click(await within(map).findByRole('button', { name: 'Close writer' }))
    await expect(args.onSelect).toHaveBeenLastCalledWith(null)
    await waitFor(() => expect(within(map).queryByRole('region', { name: 'writer' })).toBeNull())
  },
} satisfies Meta<typeof Map>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

// The map with writer selected, so the accessibility check runs on dim nodes.
const selectedPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const map = within(canvasElement).getByRole('group', { name: 'Toolkit map' })
  await expect(within(map).getByRole('button', { name: 'writer' })).toHaveAttribute('aria-pressed', 'true')
  await expect(within(map).getByRole('button', { name: 'ambitious' })).toHaveAttribute('data-state', 'dim')
}
export const SelectedDark: StoryObj<typeof meta> = { globals: { mode: 'dark' }, args: { initial: 'writer' }, play: selectedPlay }
export const SelectedLight: StoryObj<typeof meta> = { globals: { mode: 'light' }, args: { initial: 'writer' }, play: selectedPlay }

const longLabel = 'skill-eval-round-with-held-out-cases'

/**
 * A label too long for its node ends with an ellipsis and shows in full in a
 * tooltip, on hover and when the node has the keyboard focus. The button's
 * name is still the whole label. A label that fits gets no tooltip, and the
 * selection card does the same for a long name.
 */
export const LongLabel: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <MapGraph
        label="Toolkit map"
        width={640}
        height={240}
        nodes={[
          { id: 'long', label: longLabel, kind: 'workflow', meta: 'weekly', x: 40, y: 40 },
          { id: 'writer', label: 'writer', kind: 'skill', x: 360, y: 40 },
        ]}
        edges={[{ from: 'long', to: 'writer' }]}
        selectedId="long"
        card={<MapSelectionCard name={`${longLabel}-and-a-trigger-set`} kind="workflow" description="Runs one eval round." />}
      />
    </main>
  ),
  play: async ({ canvasElement }) => {
    const map = within(canvasElement).getByRole('group', { name: 'Toolkit map' })
    const tip = () => within(document.body).queryByRole('tooltip')
    const node = within(map).getByRole('button', { name: `${longLabel} weekly` })
    const label = within(node).getByText(longLabel)
    // The label is cut with an ellipsis, but the element holds the whole text.
    await expect(getComputedStyle(label).textOverflow).toBe('ellipsis')
    await waitFor(() => expect(label.scrollWidth).toBeGreaterThan(label.clientWidth))
    // It is no tab stop of its own: the node button takes the focus.
    await expect(label).not.toHaveAttribute('tabindex')
    await userEvent.hover(label)
    await waitFor(() => expect(tip()).toHaveTextContent(longLabel))
    await userEvent.unhover(label)
    await waitFor(() => expect(tip()).toBeNull())
    // Keyboard focus on the node shows it too.
    await userEvent.tab()
    await expect(node).toHaveFocus()
    await waitFor(() => expect(tip()).toHaveTextContent(longLabel))
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(tip()).toBeNull())
    // A label that fits shows no tooltip.
    const short = within(map).getByRole('button', { name: 'writer' })
    await userEvent.hover(within(short).getByText('writer'))
    await new Promise((resolve) => setTimeout(resolve, 700))
    await expect(tip()).toBeNull()
    await userEvent.unhover(within(short).getByText('writer'))
    // The card's long name is cut and shows in full on hover.
    const card = within(map).getByRole('region', { name: `${longLabel}-and-a-trigger-set` })
    const name = within(card).getByText(`${longLabel}-and-a-trigger-set`)
    await waitFor(() => expect(name.scrollWidth).toBeGreaterThan(name.clientWidth))
    await userEvent.hover(name)
    await waitFor(() => expect(tip()).toHaveTextContent(`${longLabel}-and-a-trigger-set`))
    await userEvent.unhover(name)
  },
}

// The phone's Links graph, Toolkit M17 `links graph` 493:152 (366 × 390, 364 × 388 inside its border), placed as
// the-bridge places it: 162 × 32 nodes two to a row, 15 in from each edge and 38 apart; the items that link to the
// open item (`LINKED FROM 4` 493:228, 493:229 to 493:247) over it, the open item (493:224) in the middle, and the
// items it links to (`LINKS TO 7` 493:253, 493:254 to 493:288) under it.
const phone = { m17: { name: 'Phone (M17)', styles: { width: '390px', height: '844px' } } }
const phoneItem = css({ bg: 'bg.canvas', p: '12', display: 'flex', flexDirection: 'column', gap: '24' })
const upright = { width: 364, height: 388, node: { width: 162, height: 32 } }
const sideNodes = (side: 'from' | 'to', top: number, items: readonly (readonly [string, MapGraphNode['kind']])[]): MapGraphNode[] =>
  items.map(([label, kind], i) => ({ id: `${side}:${label}`, label, kind, x: i % 2 === 0 ? 15 : 187, y: top + Math.floor(i / 2) * 38 }))
const uprightFrom = sideNodes('from', 41, [
  ['writer', 'agent'],
  ['writing-reviewer', 'agent'],
  ['ste100', 'rule'],
  ['writing', 'rule'],
])
const uprightTo = sideNodes('to', 225, [
  ['pr-description', 'skill'],
  ['audit-slop', 'skill'],
  ['writing-reviewer', 'agent'],
  ['readmes', 'rule'],
  ['writing', 'rule'],
  ['ste100', 'rule'],
  ['commits-and-prs', 'rule'],
])
const uprightNodes: MapGraphNode[] = [...uprightFrom, { id: 'item', label: 'writer', kind: 'skill', x: 101, y: 155 }, ...uprightTo]
const uprightEdges: MapGraphEdge[] = [...uprightFrom.map((n) => ({ from: n.id, to: 'item' })), ...uprightTo.map((n) => ({ from: 'item', to: n.id }))]

/** `orientation="vertical"`: the phone's Links graph (M17) on a 390 px screen, with the open item selected. */
function Upright() {
  const [selected, setSelected] = useState<string | null>('item')
  return (
    <main className={phoneItem}>
      <MapGraph
        label="Links of writer"
        orientation="vertical"
        width={upright.width}
        height={upright.height}
        nodeSize={upright.node}
        nodes={uprightNodes}
        edges={uprightEdges}
        columns={[
          { label: 'Linked from 4', x: 15, y: 13 },
          { label: 'Links to 7', x: 15, y: 199 },
        ]}
        selectedId={selected}
        onSelect={setSelected}
      />
      {/* The default orientation keeps its side-to-side line. */}
      <MapGraph
        label="Default map"
        width={upright.width}
        height={120}
        nodeSize={{ width: 100, height: 32 }}
        nodes={[
          { id: 'a', label: 'a', kind: 'rule', x: 10, y: 10 },
          { id: 'b', label: 'b', kind: 'skill', x: 250, y: 70 },
        ]}
        edges={[{ from: 'a', to: 'b' }]}
      />
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const uprightPlay: NonNullable<StoryObj<typeof meta>['play']> = async ({ canvasElement }) => {
  const swatch = (name: string) => {
    const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
    if (el === null) throw new Error(`no swatch ${name}`)
    return getComputedStyle(el).backgroundColor
  }
  await expect(window.innerWidth).toBe(390)
  const map = within(canvasElement).getByRole('group', { name: 'Links of writer' })
  await expect(map.getBoundingClientRect().width).toBe(366)
  const svg = map.querySelector('svg')
  if (svg === null) throw new Error('no svg')
  const origin = svg.getBoundingClientRect()
  await expect([origin.width, origin.height]).toEqual([upright.width, upright.height])
  // Each node's box on the canvas, from the page.
  const buttons = within(map).getAllByRole('button')
  await expect(buttons).toHaveLength(uprightNodes.length)
  const boxes = buttons.map((b) => {
    const r = b.getBoundingClientRect()
    return { name: b.textContent, x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height }
  })
  const focus = boxes.find((b, i) => b.name === 'writer' && buttons[i]?.getAttribute('aria-pressed') === 'true')
  if (focus === undefined) throw new Error('no open item')
  const on = (p: { x: number; y: number }, b: (typeof boxes)[number]) =>
    p.x >= b.x - 0.5 && p.x <= b.x + b.w + 0.5 && p.y >= b.y - 0.5 && p.y <= b.y + b.h + 0.5 && (Math.abs(p.x - b.x) < 0.5 || Math.abs(p.x - b.x - b.w) < 0.5 || Math.abs(p.y - b.y) < 0.5 || Math.abs(p.y - b.y - b.h) < 0.5)
  const paths = Array.from(map.querySelectorAll<SVGPathElement>('path.map-graph__edge'))
  await expect(paths).toHaveLength(uprightEdges.length)
  const joined = new Set<(typeof boxes)[number]>()
  for (const path of paths) {
    const length = path.getTotalLength()
    const points = Array.from({ length: 101 }, (_, i) => path.getPointAtLength((length * i) / 100))
    const first = points[0]
    const last = points[100]
    if (first === undefined || last === undefined) throw new Error('no points')
    // One end on the open item's edge, the other on the edge of a linked node.
    const ends = [first, last].map((p) => boxes.filter((b) => on(p, b)))
    const other = ends.flat().find((b) => b !== focus)
    await expect(ends.some((e) => e.includes(focus)), 'a line ends on the open item').toBe(true)
    if (other === undefined) throw new Error(`line ${path.getAttribute('d') ?? ''} joins no linked node`)
    joined.add(other)
    for (const p of points) {
      // Inside the graph's box.
      await expect(p.x >= 0 && p.x <= upright.width && p.y >= 0 && p.y <= upright.height, 'a line stays inside the graph').toBe(true)
      // Through no node: no point lies more than half a pixel inside any node box.
      const crossed = boxes.find((b) => p.x > b.x + 0.5 && p.x < b.x + b.w - 0.5 && p.y > b.y + 0.5 && p.y < b.y + b.h - 0.5)
      await expect(crossed?.name, 'a line crosses no node').toBeUndefined()
    }
  }
  // Every linked node has its line.
  await expect(joined.size).toBe(uprightNodes.length - 1)

  // The selected open item keeps its look: surface.selected, a 2 px accent border and an accent name.
  const item = buttons.find((b) => b.getAttribute('aria-pressed') === 'true')
  if (item === undefined) throw new Error('no selected node')
  const s = getComputedStyle(item)
  await expect([s.backgroundColor, s.borderTopColor, s.borderTopWidth]).toEqual([swatch('selected'), swatch('accent'), '2px'])
  await expect(getComputedStyle(within(item).getByText('writer')).color).toBe(swatch('fgAccent'))
  // Each node links to it, so none goes dim, and every line is lit and shows: the point halfway along it hits a line, not a node.
  await expect(buttons.filter((b) => b.getAttribute('data-state') === 'dim')).toHaveLength(0)
  for (const path of paths) {
    await expect(path).toHaveAttribute('data-lit')
    const line = getComputedStyle(path)
    await expect([line.stroke, line.strokeWidth, line.visibility, line.opacity]).toEqual([swatch('accent'), '2px', 'visible', '1'])
    const mid = path.getPointAtLength(path.getTotalLength() / 2)
    const hit = document.elementFromPoint(origin.left + mid.x, origin.top + mid.y)
    await expect(hit?.classList.contains('map-graph__edge'), 'a lit line shows over the nodes').toBe(true)
  }
  // Selection works as on the desktop: a side node lights its one line and dims the nodes it does not link.
  const pr = within(map).getByRole('button', { name: 'pr-description' })
  await userEvent.click(pr)
  await waitFor(() => expect(pr).toHaveAttribute('aria-pressed', 'true'))
  await waitFor(() => expect(map.querySelectorAll('path.map-graph__edge[data-lit]')).toHaveLength(1))
  await expect(within(map).getAllByRole('button', { name: 'writer' }).map((b) => b.getAttribute('data-state'))).toEqual(['dim', 'lit'])
  await expect(within(map).getByRole('button', { name: 'readmes' })).toHaveAttribute('data-state', 'dim')
  await userEvent.click(within(map).getAllByRole('button', { name: 'writer' })[1] ?? map)
  await waitFor(() => expect(map.querySelectorAll('path.map-graph__edge[data-lit]')).toHaveLength(uprightEdges.length))

  // The default orientation is unchanged: a's right side to b's left side, curved with level ends.
  const plain = within(canvasElement).getByRole('group', { name: 'Default map' })
  await expect(plain.querySelector('path.map-graph__edge')?.getAttribute('d')).toBe('M 110 26 C 180 26 180 86 250 86')
}

export const UprightDark: StoryObj<typeof meta> = {
  render: () => <Upright />,
  play: uprightPlay,
  parameters: { viewport: { options: phone } },
  globals: { mode: 'dark', viewport: { value: 'm17' } },
}
export const UprightLight: StoryObj<typeof meta> = {
  render: () => <Upright />,
  play: uprightPlay,
  parameters: { viewport: { options: phone } },
  globals: { mode: 'light', viewport: { value: 'm17' } },
}

// Checks each line of an upright map from the page: it starts and ends on the edges of two different nodes, stays
// inside the graph's box and passes behind no node (no point lies more than half a pixel inside a node box).
const expectClearLines = async (map: HTMLElement, count: number) => {
  const svg = map.querySelector('svg')
  if (svg === null) throw new Error('no svg')
  const origin = svg.getBoundingClientRect()
  const boxes = within(map)
    .getAllByRole('button')
    .map((b) => {
      const r = b.getBoundingClientRect()
      return { name: b.textContent, x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height }
    })
  const on = (p: { x: number; y: number }, b: (typeof boxes)[number]) =>
    p.x >= b.x - 0.5 && p.x <= b.x + b.w + 0.5 && p.y >= b.y - 0.5 && p.y <= b.y + b.h + 0.5 && (Math.abs(p.x - b.x) < 0.5 || Math.abs(p.x - b.x - b.w) < 0.5 || Math.abs(p.y - b.y) < 0.5 || Math.abs(p.y - b.y - b.h) < 0.5)
  const paths = Array.from(map.querySelectorAll<SVGPathElement>('path.map-graph__edge'))
  await expect(paths).toHaveLength(count)
  for (const path of paths) {
    const d = path.getAttribute('d') ?? ''
    const length = path.getTotalLength()
    const points = Array.from({ length: 201 }, (_, i) => path.getPointAtLength((length * i) / 200))
    const first = points[0]
    const last = points[200]
    if (first === undefined || last === undefined) throw new Error('no points')
    const start = boxes.find((b) => on(first, b))
    const end = boxes.find((b) => on(last, b) && b !== start)
    await expect(start !== undefined && end !== undefined, `line ${d} joins two nodes`).toBe(true)
    for (const p of points) {
      await expect(p.x >= 0 && p.x <= origin.width && p.y >= 0 && p.y <= origin.height, `line ${d} stays inside the graph`).toBe(true)
      const crossed = boxes.find((b) => p.x > b.x + 0.5 && p.x < b.x + b.w - 0.5 && p.y > b.y + 0.5 && p.y < b.y + b.h - 0.5)
      await expect(crossed?.name, `line ${d} passes behind no node`).toBeUndefined()
    }
  }
}

/**
 * `orientation="vertical"`: the lane at the upper node's centre is clear, but
 * its turn into the lower node would cross `c`, which sits in the lower
 * node's row. The line takes the lower node's lane, whose turn is clear.
 */
function UprightTurn() {
  return (
    <main className={page}>
      <MapGraph
        label="Turn map"
        orientation="vertical"
        width={340}
        height={140}
        nodeSize={{ width: 100, height: 32 }}
        nodes={[
          { id: 'a', label: 'a', kind: 'rule', x: 0, y: 0 },
          { id: 'c', label: 'c', kind: 'hook', x: 110, y: 100 },
          { id: 'b', label: 'b', kind: 'skill', x: 220, y: 100 },
        ]}
        edges={[{ from: 'a', to: 'b' }]}
      />
    </main>
  )
}
const uprightTurnPlay: NonNullable<StoryObj<typeof meta>['play']> = async ({ canvasElement }) => {
  await expectClearLines(within(canvasElement).getByRole('group', { name: 'Turn map' }), 1)
}
export const UprightTurnDark: StoryObj<typeof meta> = { render: () => <UprightTurn />, play: uprightTurnPlay, globals: { mode: 'dark' } }
export const UprightTurnLight: StoryObj<typeof meta> = { render: () => <UprightTurn />, play: uprightTurnPlay, globals: { mode: 'light' } }

/**
 * `orientation="vertical"`: three nodes in one column, linked from the top
 * one to the bottom one. Both lanes run through `middle`, so the line goes
 * round it, down a lane in the free space beside the column.
 */
function UprightDetour() {
  return (
    <main className={page}>
      <MapGraph
        label="Detour map"
        orientation="vertical"
        width={200}
        height={160}
        nodeSize={{ width: 100, height: 32 }}
        nodes={[
          { id: 'top', label: 'top', kind: 'rule', x: 0, y: 0 },
          { id: 'middle', label: 'middle', kind: 'hook', x: 0, y: 60 },
          { id: 'bottom', label: 'bottom', kind: 'skill', x: 0, y: 120 },
        ]}
        edges={[{ from: 'top', to: 'bottom' }]}
      />
    </main>
  )
}
const uprightDetourPlay: NonNullable<StoryObj<typeof meta>['play']> = async ({ canvasElement }) => {
  await expectClearLines(within(canvasElement).getByRole('group', { name: 'Detour map' }), 1)
}
export const UprightDetourDark: StoryObj<typeof meta> = { render: () => <UprightDetour />, play: uprightDetourPlay, globals: { mode: 'dark' } }
export const UprightDetourLight: StoryObj<typeof meta> = { render: () => <UprightDetour />, play: uprightDetourPlay, globals: { mode: 'light' } }

/**
 * Per-node sizes: `a` (180 × 32) and `b` (150 × 40) overlap in x but sit in
 * different rows. In both orientations the lines, one each way, go round
 * the real boxes and pass behind neither node.
 */
function Overlap() {
  const nodes: MapGraphNode[] = [
    { id: 'a', label: 'a', kind: 'rule', x: 0, y: 0, size: { width: 180, height: 32 } },
    { id: 'b', label: 'b', kind: 'skill', x: 160, y: 80, size: { width: 150, height: 40 } },
  ]
  const links: MapGraphEdge[] = [
    { from: 'a', to: 'b' },
    { from: 'b', to: 'a' },
  ]
  return (
    <main className={phoneItem}>
      <MapGraph label="Overlap map" width={400} height={140} nodes={nodes} edges={links} />
      <MapGraph label="Upright overlap map" orientation="vertical" width={400} height={140} nodes={nodes} edges={links} />
    </main>
  )
}
const overlapPlay: NonNullable<StoryObj<typeof meta>['play']> = async ({ canvasElement }) => {
  await expectClearLines(within(canvasElement).getByRole('group', { name: 'Overlap map' }), 2)
  await expectClearLines(within(canvasElement).getByRole('group', { name: 'Upright overlap map' }), 2)
}
export const OverlapDark: StoryObj<typeof meta> = { render: () => <Overlap />, play: overlapPlay, globals: { mode: 'dark' } }
export const OverlapLight: StoryObj<typeof meta> = { render: () => <Overlap />, play: overlapPlay, globals: { mode: 'light' } }

// The Links tab of Toolkit D19 (`links graph` 493:6, 948 × 320, 946 × 318 inside its border): the four items that link
// to writer on the left (493:84 to 493:102), the open item `node · writer (focus)` (493:78, 150 × 40) in the middle and
// the seven it links to on the right (493:108 to 493:142), each 180 × 32; then the nodes of the Links panels' rows
// (482:549 to 482:653), each in a box `control.sm` high.
const linksSide = (side: 'from' | 'to', x: number, top: number, items: readonly (readonly [string, MapGraphNode['kind']])[]): MapGraphNode[] =>
  items.map(([label, kind], i) => ({ id: `${side}:${label}`, label, kind, x, y: top + i * 38 }))
const linksFrom = linksSide('from', 15, 103, [
  ['writer', 'agent'],
  ['writing-reviewer', 'agent'],
  ['ste100', 'rule'],
  ['writing', 'rule'],
])
const linksTo = linksSide('to', 751, 46, [
  ['pr-description', 'skill'],
  ['audit-slop', 'skill'],
  ['writing-reviewer', 'agent'],
  ['readmes', 'rule'],
  ['writing', 'rule'],
  ['ste100', 'rule'],
  ['commits-and-prs', 'rule'],
])
const linksFocus = { width: 150, height: 40 }
const linksNodes: MapGraphNode[] = [
  ...linksFrom,
  { id: 'item', label: 'writer', kind: 'skill', x: 398, y: 156, size: linksFocus, labelStyle: 'label' },
  ...linksTo,
]
const linksEdges: MapGraphEdge[] = [...linksFrom.map((n) => ({ from: n.id, to: 'item' })), ...linksTo.map((n) => ({ from: 'item', to: n.id }))]
const rowKinds = ['skill', 'agent', 'rule', 'workflow', 'hook'] as const
const rowBox = css({ display: 'flex', h: 'control.sm', w: 'max-content' })
const rowList = css({ display: 'flex', gap: '8' })
const linksSwatches = {
  selected: css({ bg: 'surface.selected' }),
  accent: css({ bg: 'accent.default' }),
  border: css({ bg: 'border.default' }),
  'kind.skill': css({ bg: 'kind.skill' }),
  'kindBorder.skill': css({ bg: 'kindBorder.skill' }),
  'kindBorderFaint.skill': css({ bg: 'kindBorderFaint.skill' }),
  'kind.agent': css({ bg: 'kind.agent' }),
  'kindBorder.agent': css({ bg: 'kindBorder.agent' }),
  'kindBorderFaint.agent': css({ bg: 'kindBorderFaint.agent' }),
  'kind.rule': css({ bg: 'kind.rule' }),
  'kindBorder.rule': css({ bg: 'kindBorder.rule' }),
  'kindBorderFaint.rule': css({ bg: 'kindBorderFaint.rule' }),
  'kind.workflow': css({ bg: 'kind.workflow' }),
  'kindBorder.workflow': css({ bg: 'kindBorder.workflow' }),
  'kindBorderFaint.workflow': css({ bg: 'kindBorderFaint.workflow' }),
  'kind.hook': css({ bg: 'kind.hook' }),
  'kindBorder.hook': css({ bg: 'kindBorder.hook' }),
  'kindBorderFaint.hook': css({ bg: 'kindBorderFaint.hook' }),
}
const labelText = css({ textStyle: 'label' })
const monoText = css({ textStyle: 'mono' })

/**
 * The Links graph (D19): `nodeTone="muted"` draws each lit node's border in
 * kindBorder, the open item has its own `size` (150 × 40) and
 * `labelStyle="label"`, and `edgeEnd="none"` ends each line at the node's
 * edge with no dot. Under it, the Links panels' row nodes with
 * `tone="faint"`.
 */
function LinksGraph() {
  const [selected, setSelected] = useState<string | null>('item')
  return (
    <main className={page}>
      <MapGraph
        label="Links of writer"
        width={946}
        height={318}
        nodeSize={{ width: 180, height: 32 }}
        nodeTone="muted"
        edgeEnd="none"
        nodes={linksNodes}
        edges={linksEdges}
        columns={[
          { label: 'Linked from 4', x: 15, y: 13 },
          { label: 'Links to 7', x: 751, y: 13 },
        ]}
        selectedId={selected}
        onSelect={setSelected}
      />
      <ul aria-label="Link rows" className={rowList}>
        {rowKinds.map((k) => (
          <li key={k} className={rowBox}>
            <MapNode label={`${k}-row`} kind={k} tone="faint" />
          </li>
        ))}
      </ul>
      <div hidden>
        {Object.entries(linksSwatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
        <span data-text="label" className={labelText} />
        <span data-text="mono" className={monoText} />
      </div>
    </main>
  )
}

const linksPlay: NonNullable<StoryObj<typeof meta>['play']> = async ({ canvasElement }) => {
  const swatch = (name: string) => {
    const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
    if (el === null) throw new Error(`no swatch ${name}`)
    return getComputedStyle(el).backgroundColor
  }
  const text = (name: string) => {
    const el = canvasElement.querySelector(`[data-text="${name}"]`)
    if (el === null) throw new Error(`no text ${name}`)
    const t = getComputedStyle(el)
    return [t.fontFamily, t.fontSize, t.lineHeight, t.fontWeight]
  }
  const map = within(canvasElement).getByRole('group', { name: 'Links of writer' })
  const svg = map.querySelector('svg')
  if (svg === null) throw new Error('no svg')
  const origin = svg.getBoundingClientRect()
  const buttons = within(map).getAllByRole('button')
  const focus = buttons.find((b) => b.getAttribute('aria-pressed') === 'true')
  if (focus === undefined) throw new Error('no open item')
  const sides = buttons.filter((b) => b !== focus)
  await expect(sides).toHaveLength(linksNodes.length - 1)

  // Each side node is lit, 180 × 32, its border the kind colour at about 60 % and its icon the full kind colour.
  for (const b of sides) {
    const kind = b.className.match(/map-node__root--kind_(\w+)/)?.[1] ?? ''
    await expect(b).toHaveAttribute('data-state', 'lit')
    const r = b.getBoundingClientRect()
    await expect([r.width, r.height]).toEqual([180, 32])
    const s = getComputedStyle(b)
    await expect([s.borderTopColor, s.borderTopWidth], `${b.textContent} border`).toEqual([swatch(`kindBorder.${kind}`), '1px'])
    await expect(s.borderTopColor).not.toBe(swatch(`kind.${kind}`))
    await expect(getComputedStyle(b.firstElementChild ?? b).color, `${b.textContent} icon`).toBe(swatch(`kind.${kind}`))
    // Its name stays mono 12.
    const name = within(b).getByText(b.textContent)
    const n = getComputedStyle(name)
    await expect([n.fontFamily, n.fontSize, n.lineHeight, n.fontWeight]).toEqual(text('mono'))
  }
  await expect(new Set(sides.map((b) => b.className.match(/map-node__root--kind_(\w+)/)?.[1]))).toEqual(new Set(['agent', 'rule', 'skill']))

  // The open item is 150 × 40, selected, with its name in the label style (14/20, weight 500) and its icon and name centred.
  const f = focus.getBoundingClientRect()
  await expect([f.width, f.height, f.left - origin.left, f.top - origin.top]).toEqual([150, 40, 398, 156])
  const fs = getComputedStyle(focus)
  await expect([fs.backgroundColor, fs.borderTopColor, fs.borderTopWidth]).toEqual([swatch('selected'), swatch('accent'), '2px'])
  const focusName = within(focus).getByText('writer')
  const fn = getComputedStyle(focusName)
  await expect([fn.fontFamily, fn.fontSize, fn.lineHeight, fn.fontWeight]).toEqual(text('label'))
  await expect([fn.fontSize, Math.round(parseFloat(fn.lineHeight)), fn.fontWeight]).toEqual(['14px', 20, '500'])
  await expect(fn.fontFamily).not.toContain('Mono')
  const icon = (focus.firstElementChild ?? focus).getBoundingClientRect()
  const nameBox = (focusName.parentElement ?? focusName).getBoundingClientRect()
  await expect(Math.abs(icon.left - f.left - (f.right - nameBox.right))).toBeLessThan(1)

  // Each line ends at the edges of the open item and a side node, and no line has a dot at its end.
  const paths = Array.from(map.querySelectorAll<SVGPathElement>('path.map-graph__edge'))
  await expect(paths).toHaveLength(linksEdges.length)
  await expect(map.querySelectorAll('circle')).toHaveLength(0)
  const fx = [f.left - origin.left, f.right - origin.left]
  for (const path of paths) {
    const length = path.getTotalLength()
    const ends = [path.getPointAtLength(0), path.getPointAtLength(length)]
    await expect(ends.some((p) => fx.some((x) => Math.abs(p.x - x) < 0.5) && p.y > f.top - origin.top && p.y < f.bottom - origin.top), `line ${path.getAttribute('d') ?? ''} meets the open item's edge`).toBe(true)
  }

  // A link row's node: its border the kind colour at about 45 %, its icon the full kind colour.
  const rows = within(canvasElement).getByRole('list', { name: 'Link rows' })
  for (const k of rowKinds) {
    const node = within(rows).getByRole('button', { name: `${k}-row` })
    const s = getComputedStyle(node)
    await expect(s.borderTopColor, `${k} row border`).toBe(swatch(`kindBorderFaint.${k}`))
    await expect(s.borderTopColor).not.toBe(swatch(`kindBorder.${k}`))
    await expect(getComputedStyle(node.firstElementChild ?? node).color, `${k} row icon`).toBe(swatch(`kind.${k}`))
  }

  // A tone sets only a lit node's border: selecting a side node dims the others to border.default.
  const pr = within(map).getByRole('button', { name: 'pr-description' })
  await userEvent.click(pr)
  await waitFor(() => expect(pr).toHaveAttribute('aria-pressed', 'true'))
  const readmes = within(map).getByRole('button', { name: 'readmes' })
  await expect(readmes).toHaveAttribute('data-state', 'dim')
  await expect(getComputedStyle(readmes).borderTopColor).toBe(swatch('border'))
  await expect(getComputedStyle(pr).borderTopColor).toBe(swatch('accent'))
}

export const LinksGraphDark: StoryObj<typeof meta> = { render: () => <LinksGraph />, play: linksPlay, globals: { mode: 'dark' } }
export const LinksGraphLight: StoryObj<typeof meta> = { render: () => <LinksGraph />, play: linksPlay, globals: { mode: 'light' } }

// The phone's map window (Toolkit M11 461:866) over a drawing wider than it: a 320 px frame round the 1384 × 460 map.
const zoomFrame = css({ w: 'shell.popover', display: 'flex', flexDirection: 'column', gap: '24' })

function ZoomMap({ onSelect }: { onSelect: (id: string | null) => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const select = (id: string | null) => {
    setSelected(id)
    onSelect(id)
  }
  return (
    <main className={page}>
      <div className={zoomFrame}>
        <MapGraph label="Zoom map" width={1384} height={460} nodes={nodes} edges={edges} columns={columns} selectedId={selected} onSelect={select} zoom={{ min: 0.5, max: 2 }} />
        <MapGraph label="Plain map" width={1384} height={460} nodes={nodes} edges={edges} columns={columns} />
      </div>
    </main>
  )
}

const zoomPlay: NonNullable<StoryObj<typeof meta>['play']> = async ({ canvasElement, args }) => {
  const map = within(canvasElement).getByRole('group', { name: 'Zoom map' })
  const scroller = map.querySelector<HTMLElement>('.map-graph__scroller')
  const svg = map.querySelector('svg')
  if (scroller === null || svg === null) throw new Error('no drawing')
  // The window takes its own gestures, clips the drawing and moves it from its top left corner.
  await expect(scroller).toHaveAttribute('data-allow-pinch', '')
  const sc = getComputedStyle(scroller)
  await expect([sc.touchAction, sc.overflowX, sc.overflowY]).toEqual(['none', 'clip', 'clip'])
  await expect(getComputedStyle(svg).transformOrigin).toBe('0px 0px')
  const windowWidth = scroller.clientWidth
  await expect(windowWidth).toBe(318)
  await expect(scroller.clientHeight).toBe(460)
  // Where the drawing is in the window, and how large: its left and top edges, width and height in px.
  const drawing = () => {
    const w = scroller.getBoundingClientRect()
    const d = svg.getBoundingClientRect()
    return { left: d.left - w.left, top: d.top - w.top, width: d.width, height: d.height }
  }
  const expectDrawing = async (expected: { left: number; top: number; width: number; height: number }) => {
    const d = drawing()
    for (const key of ['left', 'top', 'width', 'height'] as const) await expect(d[key], key).toBeCloseTo(expected[key], 1)
  }
  // A touch pointer event at x and y in the window.
  const pointer = (type: string, id: number, x: number, y: number, target: Element = scroller) => {
    const w = scroller.getBoundingClientRect()
    target.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', isPrimary: id === 1, clientX: w.left + x, clientY: w.top + y, bubbles: true, cancelable: true }))
  }
  await expectDrawing({ left: 0, top: 0, width: 1384, height: 460 })

  // One pointer drags the drawing.
  pointer('pointerdown', 1, 200, 100)
  pointer('pointermove', 1, 150, 100)
  await expectDrawing({ left: -50, top: 0, width: 1384, height: 460 })
  // At scale 1 the drawing is as high as the window, so it does not move up or down.
  pointer('pointermove', 1, 150, 300)
  await expectDrawing({ left: -50, top: 0, width: 1384, height: 460 })
  // It stops where its left edge meets the window's left edge, and its right edge the window's right edge.
  pointer('pointermove', 1, 5000, 100)
  await expectDrawing({ left: 0, top: 0, width: 1384, height: 460 })
  pointer('pointermove', 1, -5000, 100)
  await expectDrawing({ left: windowWidth - 1384, top: 0, width: 1384, height: 460 })
  pointer('pointermove', 1, 5000, 100)
  pointer('pointerup', 1, 5000, 100)
  await expectDrawing({ left: 0, top: 0, width: 1384, height: 460 })

  // Two pointers that move apart scale the drawing up about their midpoint: from 40 to 80 px apart is scale 2, and
  // the drawing point under the first midpoint (120, 100) goes under the new one (140, 100).
  pointer('pointerdown', 1, 100, 100)
  pointer('pointerdown', 2, 140, 100)
  pointer('pointermove', 2, 180, 100)
  await expectDrawing({ left: 140 - 240, top: 100 - 200, width: 2768, height: 920 })
  // Further apart, the scale stops at max (2).
  pointer('pointermove', 2, 300, 100)
  await expect(drawing().width).toBeCloseTo(2768, 1)
  // At scale 2 one pointer drags it down and up too, until its top edge meets the window's top edge.
  pointer('pointerup', 2, 300, 100)
  pointer('pointermove', 1, 100, 160)
  await expect(drawing().top).toBeCloseTo(-40, 1)
  pointer('pointermove', 1, 100, 5000)
  await expect(drawing().top).toBeCloseTo(0, 1)
  pointer('pointerup', 1, 100, 5000)

  // Two pointers that move together scale it down, and the scale stops at min (0.5).
  pointer('pointerdown', 1, 100, 100)
  pointer('pointerdown', 2, 300, 100)
  pointer('pointermove', 1, 150, 100)
  pointer('pointermove', 2, 250, 100)
  await expect(drawing().width).toBeCloseTo(1384, 1)
  pointer('pointermove', 1, 195, 100)
  pointer('pointermove', 2, 205, 100)
  await expect([drawing().width, drawing().height]).toEqual([692, 230])
  pointer('pointerup', 1, 195, 100)
  pointer('pointerup', 2, 205, 100)
  // At scale 0.5 the drawing is lower than the window, so it stays inside it: its foot stops at the window's foot.
  pointer('pointerdown', 1, 100, 100)
  pointer('pointermove', 1, 100, 5000)
  await expect(drawing().top).toBeCloseTo(460 - 230, 1)
  pointer('pointerup', 1, 100, 5000)

  // A tap on a node still selects it.
  const node = (name: string) => within(map).getByRole('button', { name })
  await userEvent.click(node('writer'))
  await expect(args.onSelect).toHaveBeenLastCalledWith('writer')
  // A press that moves less than 4 px is a tap too.
  const ambitious = node('ambitious')
  pointer('pointerdown', 1, 50, 50, ambitious)
  pointer('pointermove', 1, 52, 51, ambitious)
  pointer('pointerup', 1, 52, 51, ambitious)
  ambitious.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }))
  await expect(args.onSelect).toHaveBeenLastCalledWith('ambitious')
  // A drag that starts and ends on a node moves the drawing and selects nothing.
  const ste100 = node('ste100')
  const before = drawing().left
  pointer('pointerdown', 1, 150, 50, ste100)
  pointer('pointermove', 1, 120, 50, ste100)
  pointer('pointerup', 1, 120, 50, ste100)
  // A pointer's click has detail 1; HTMLElement.click() would send detail 0, a keyboard click.
  ste100.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }))
  await expect(drawing().left).toBeCloseTo(before - 30, 1)
  await expect(args.onSelect).toHaveBeenLastCalledWith('ambitious')
  await expect(args.onSelect).not.toHaveBeenCalledWith('ste100')

  // Without `zoom` the map is as before: no pinch attribute, no variant class, no view properties, and it scrolls.
  const plain = within(canvasElement).getByRole('group', { name: 'Plain map' })
  const plainScroller = plain.querySelector<HTMLElement>('.map-graph__scroller')
  const plainSvg = plain.querySelector('svg')
  if (plainScroller === null || plainSvg === null) throw new Error('no plain drawing')
  await expect(plainScroller).not.toHaveAttribute('data-allow-pinch')
  await expect(plainScroller).not.toHaveAttribute('style')
  await expect([plain.className, plainScroller.className]).toEqual(['map-graph__root', 'map-graph__scroller'])
  const ps = getComputedStyle(plainScroller)
  await expect([ps.touchAction, ps.overflowX, getComputedStyle(plainSvg).transform]).toEqual(['auto', 'auto', 'none'])
  await expect(plainScroller.scrollWidth).toBe(1384)
}

export const ZoomDark: StoryObj<typeof meta> = { render: (args) => <ZoomMap onSelect={args.onSelect} />, play: zoomPlay, globals: { mode: 'dark' } }
export const ZoomLight: StoryObj<typeof meta> = { render: (args) => <ZoomMap onSelect={args.onSelect} />, play: zoomPlay, globals: { mode: 'light' } }

// The window's size in px, and a touch pointer event at x and y in it, for the zoom stories.
const zoomParts = (canvasElement: HTMLElement) => {
  const map = within(canvasElement).getByRole('group', { name: 'Zoom map' })
  const scroller = map.querySelector<HTMLElement>('.map-graph__scroller')
  const svg = map.querySelector('svg')
  if (scroller === null || svg === null) throw new Error('no drawing')
  const drawing = () => {
    const w = scroller.getBoundingClientRect()
    const d = svg.getBoundingClientRect()
    return { left: d.left - w.left, top: d.top - w.top, width: d.width, height: d.height }
  }
  const pointer = (type: string, id: number, x: number, y: number, target: Element = scroller) => {
    const w = scroller.getBoundingClientRect()
    target.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', isPrimary: id === 1, clientX: w.left + x, clientY: w.top + y, bubbles: true, cancelable: true }))
  }
  return { map, scroller, svg, drawing, pointer, node: (name: string) => within(map).getByRole('button', { name }) }
}
const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0))

// A drag released outside the window fires no click there, and must not swallow the next key press or tap.
const releaseOutsidePlay: NonNullable<StoryObj<typeof meta>['play']> = async ({ canvasElement, args }) => {
  const { drawing, pointer, node } = zoomParts(canvasElement)
  pointer('pointerdown', 1, 200, 100)
  pointer('pointermove', 1, 150, 100)
  pointer('pointerup', 1, 150, 600, document.body)
  await expect(drawing().left).toBeCloseTo(-50, 1)
  await nextTask()
  // Enter on a node selects it.
  const writer = node('writer')
  writer.focus()
  await userEvent.keyboard('{Enter}')
  await expect(args.onSelect).toHaveBeenLastCalledWith('writer')
  // A key press right after a drag that ends on a node selects too: only a pointer click is swallowed.
  const ambitious = node('ambitious')
  pointer('pointerdown', 1, 150, 50, ambitious)
  pointer('pointermove', 1, 120, 50, ambitious)
  pointer('pointerup', 1, 120, 50, ambitious)
  ambitious.focus()
  await userEvent.keyboard('{Enter}')
  await expect(args.onSelect).toHaveBeenLastCalledWith('ambitious')
  // After a drag released outside, a later pointer click on a node selects it.
  pointer('pointerdown', 1, 150, 100)
  pointer('pointermove', 1, 120, 100)
  pointer('pointerup', 1, 120, 600, document.body)
  await nextTask()
  node('ste100').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }))
  await expect(args.onSelect).toHaveBeenLastCalledWith('ste100')
}

export const ZoomReleaseOutsideDark: StoryObj<typeof meta> = { render: (args) => <ZoomMap onSelect={args.onSelect} />, play: releaseOutsidePlay, globals: { mode: 'dark' } }
export const ZoomReleaseOutsideLight: StoryObj<typeof meta> = { render: (args) => <ZoomMap onSelect={args.onSelect} />, play: releaseOutsidePlay, globals: { mode: 'light' } }

// When the window grows, the drawing is clamped again, so its right edge stays at the window's right edge.
const resizePlay: NonNullable<StoryObj<typeof meta>['play']> = async ({ canvasElement }) => {
  const { map, scroller, drawing, pointer } = zoomParts(canvasElement)
  const frame = map.parentElement
  if (frame === null) throw new Error('no frame')
  pointer('pointerdown', 1, 200, 100)
  pointer('pointermove', 1, -5000, 100)
  pointer('pointerup', 1, -5000, 100)
  await expect(drawing().left).toBeCloseTo(318 - 1384, 1)
  // The test widens the frame from 320 to 600 px, so the window is 598 wide.
  frame.style.width = '600px'
  await waitFor(() => expect(scroller.clientWidth).toBe(598))
  await waitFor(() => expect(drawing().left).toBeCloseTo(598 - 1384, 1))
  // Narrower again, the drawing still covers the window, so it stays where it is.
  frame.style.removeProperty('width')
  await waitFor(() => expect(scroller.clientWidth).toBe(318))
  await expect(drawing().left).toBeCloseTo(598 - 1384, 1)
}

export const ZoomResizeDark: StoryObj<typeof meta> = { render: (args) => <ZoomMap onSelect={args.onSelect} />, play: resizePlay, globals: { mode: 'dark' } }
export const ZoomResizeLight: StoryObj<typeof meta> = { render: (args) => <ZoomMap onSelect={args.onSelect} />, play: resizePlay, globals: { mode: 'light' } }

function KeysMap() {
  return (
    <main className={page}>
      <div className={zoomFrame}>
        <MapGraph label="Zoom map" width={1384} height={460} nodes={nodes} edges={edges} columns={columns} zoom={{ min: 0.5, max: 2 }} />
        <MapGraph label="Empty zoom map" width={1384} height={460} nodes={[]} columns={columns} zoom={{ min: 0.5, max: 2 }} />
        <MapGraph label="Plain map" width={1384} height={460} nodes={nodes} edges={edges} columns={columns} />
      </div>
    </main>
  )
}

// Zoom without two pointers: keys when the focus is in the map, about the window's centre, and Control or Command
// with the wheel, about the pointer. Each step is 1.25 times.
const keysPlay: NonNullable<StoryObj<typeof meta>['play']> = async ({ canvasElement }) => {
  const { map, scroller, drawing, pointer, node } = zoomParts(canvasElement)
  const keys = 'Pinch, or press plus or minus, to zoom, and 0 to zoom out fully. Control or Command with the mouse wheel zooms too. Drag to move.'
  await expect(map).toHaveAccessibleDescription(keys)
  await expect(scroller).toHaveAttribute('aria-keyshortcuts', '+ = - 0')
  // The nodes already take the focus, so the window is not in the tab order.
  await expect(scroller).not.toHaveAttribute('tabindex')
  // The drawing point under the window's centre.
  const centre = () => {
    const d = drawing()
    const scale = d.width / 1384
    return { x: (scroller.clientWidth / 2 - d.left) / scale, y: (scroller.clientHeight / 2 - d.top) / scale }
  }
  const expectCentre = async (before: { x: number; y: number }) => {
    const after = centre()
    await expect(after.x).toBeCloseTo(before.x, 1)
    await expect(after.y).toBeCloseTo(before.y, 1)
  }
  node('writer').focus()
  await expect(drawing().width).toBeCloseTo(1384, 1)
  let c = centre()
  await userEvent.keyboard('+')
  await expect(drawing().width).toBeCloseTo(1384 * 1.25, 1)
  await expectCentre(c)
  c = centre()
  await userEvent.keyboard('=')
  await expect(drawing().width).toBeCloseTo(1384 * 1.25 ** 2, 1)
  await expectCentre(c)
  // It stops at max (2).
  await userEvent.keyboard('++')
  await expect(drawing().width).toBeCloseTo(2768, 1)
  await userEvent.keyboard('-')
  await expect(drawing().width).toBeCloseTo(2768 / 1.25, 1)
  // 0 zooms out to min (0.5); a key with Control is the browser's, not the map's.
  await userEvent.keyboard('0')
  await expect(drawing().width).toBeCloseTo(692, 1)
  await userEvent.keyboard('{Control>}+{/Control}')
  await expect(drawing().width).toBeCloseTo(692, 1)

  // Control or Command with the wheel zooms about the pointer and keeps the page from zooming; a plain wheel does not.
  const wheel = (init: WheelEventInit) => {
    const w = scroller.getBoundingClientRect()
    const event = new WheelEvent('wheel', { clientX: w.left + 100, clientY: w.top + 100, bubbles: true, cancelable: true, ...init })
    scroller.dispatchEvent(event)
    return event.defaultPrevented
  }
  await expect(wheel({ deltaY: -100, ctrlKey: true })).toBe(true)
  await expect(drawing().width).toBeCloseTo(692 * 1.25, 1)
  await expect(wheel({ deltaY: 100, metaKey: true })).toBe(true)
  await expect(drawing().width).toBeCloseTo(692, 1)
  await expect(wheel({ deltaY: -100 })).toBe(false)
  await expect(drawing().width).toBeCloseTo(692, 1)
  // Seven steps in from 0.5 would be 2.38; it stops at max (2).
  await expect(wheel({ deltaY: -700, ctrlKey: true })).toBe(true)
  await expect(drawing().width).toBeCloseTo(2768, 1)
  // About the pointer: the drawing point under it stays under it while the drawing still covers the window. A drag
  // first moves the drawing's top left corner away from the window's, so the zoom out is not clamped.
  pointer('pointerdown', 1, 200, 200)
  pointer('pointermove', 1, 100, 100)
  pointer('pointerup', 1, 100, 100)
  await expect(drawing().top).toBeLessThan(-50)
  const d0 = drawing()
  const under = { x: (100 - d0.left) / 2, y: (100 - d0.top) / 2 }
  wheel({ deltaY: 100, ctrlKey: true })
  const d1 = drawing()
  await expect((100 - d1.left) / 1.6).toBeCloseTo(under.x, 1)
  await expect((100 - d1.top) / 1.6).toBeCloseTo(under.y, 1)

  // A map with no nodes has no other way in, so its window takes the focus and the keys.
  const empty = within(canvasElement).getByRole('group', { name: 'Empty zoom map' })
  const emptyScroller = empty.querySelector<HTMLElement>('.map-graph__scroller')
  const emptySvg = empty.querySelector('svg')
  if (emptyScroller === null || emptySvg === null) throw new Error('no empty drawing')
  await expect(emptyScroller).toHaveAttribute('tabindex', '0')
  await expect(emptyScroller).toHaveAccessibleDescription(keys)
  emptyScroller.focus()
  await userEvent.keyboard('+')
  await expect(emptySvg.getBoundingClientRect().width).toBeCloseTo(1384 * 1.25, 1)

  // Without zoom the keys do nothing and the map has no description, tab stop or shortcuts.
  const plain = within(canvasElement).getByRole('group', { name: 'Plain map' })
  const plainScroller = plain.querySelector<HTMLElement>('.map-graph__scroller')
  const plainSvg = plain.querySelector('svg')
  if (plainScroller === null || plainSvg === null) throw new Error('no plain drawing')
  await expect(plain).not.toHaveAttribute('aria-describedby')
  await expect(plainScroller).not.toHaveAttribute('tabindex')
  await expect(plainScroller).not.toHaveAttribute('aria-keyshortcuts')
  within(plain).getByRole('button', { name: 'writer' }).focus()
  await userEvent.keyboard('+')
  await expect(plainSvg.getBoundingClientRect().width).toBe(1384)
}

export const ZoomKeysDark: StoryObj<typeof meta> = { render: () => <KeysMap />, play: keysPlay, globals: { mode: 'dark' } }
export const ZoomKeysLight: StoryObj<typeof meta> = { render: () => <KeysMap />, play: keysPlay, globals: { mode: 'light' } }
