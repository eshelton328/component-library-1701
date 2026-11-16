import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { MapGraph, type MapGraphEdge, type MapGraphNode, MapLegend, MapSelectionCard } from './map-graph'

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
