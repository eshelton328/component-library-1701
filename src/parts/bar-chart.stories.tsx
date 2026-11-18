import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Stack } from '../controls/layout'
import { GroupedBarChart, HorizontalBarChart } from './bar-chart'
import { expectCutText } from '../controls/tooltip.testing'
import { expectScrollAreas } from '../controls/scroll-area.testing'

const page = css({ bg: 'bg.canvas', p: '24' })
const panel = css({ bg: 'surface.pane', p: '16', borderRadius: 'xl', w: 'shell.listPane' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  accent: css({ bg: 'accent.default' }),
  muted: css({ bg: 'fg.muted' }),
  text: css({ bg: 'fg.default' }),
  done: css({ bg: 'status.done.fg' }),
  danger: css({ bg: 'status.danger.fg' }),
}

// Toolkit D20 (482:1932): Opus pass rate by round, with and without the skill.
const rounds = [
  { label: 'r1', values: [87, 67] },
  { label: 'r2', values: [96, 63] },
  { label: 'r3', values: [96, 69] },
  { label: 'r4', values: [96, 69] },
  { label: 'r5', values: [97, 70] },
  { label: 'r6', values: [100, 73] },
  { label: 'x1', values: [90, 63] },
]

function Charts() {
  return (
    <main className={page}>
      <Stack gap="24">
        <div className={panel}>
          <GroupedBarChart
            label="Opus pass rate by round"
            series={[{ name: 'with the skill' }, { name: 'without' }]}
            groups={rounds}
            max={100}
            formatValue={(v) => `${String(v)}%`}
          />
        </div>
        <div className={panel}>
          <HorizontalBarChart
            label="Calls per day"
            rows={[
              { label: 'Nov 8', value: 2 },
              { label: 'Nov 9', value: 326 },
              { label: 'Nov 13', value: 2 },
            ]}
          />
        </div>
        <div className={panel}>
          <HorizontalBarChart
            label="Where it ran"
            tone="done"
            max={400}
            rows={[
              { label: 'writer evals', value: 302 },
              { label: 'nothing', value: 0 },
              { label: 'too many', value: 900 },
            ]}
          />
        </div>
        <div className={panel}>
          <HorizontalBarChart
            label="Edge cases"
            max={100000}
            formatValue={(v) => `${v.toLocaleString('en')} calls`}
            rows={[
              { label: 'rare', value: 1 },
              { label: 'projects/ncc-1701/component-library-1701-worktrees/charts/src/parts/bar-chart.stories.tsx', value: 100000 },
            ]}
          />
        </div>
        <GroupedBarChart label="Three series" series={[{ name: 'a', tone: 'done' }, { name: 'b' }, { name: 'c', tone: 'danger' }]} groups={[{ label: 'g1', values: [1, 2, 3] }]} />
      </Stack>
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const meta = {
  title: 'Data display/Bar chart',
  component: Charts,
  play: async ({ canvasElement }) => {
    // The chart scrolls sideways with no scroll bar and keeps a swipe at its end from moving the page.
    await expectScrollAreas(canvasElement, 'x', '.grouped-bar-chart__root')
    const canvas = within(canvasElement)
    const swatch = (name: string) => {
      const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
      if (el === null) throw new Error(`no swatch ${name}`)
      return getComputedStyle(el).backgroundColor
    }
    // Each edge rounded to a tenth of a pixel, so subpixel layout does not fail a check.
    const box = (el: Element) => {
      const r = el.getBoundingClientRect()
      const t = (n: number) => Math.round(n * 10) / 10
      return { left: t(r.left), right: t(r.right), top: t(r.top), bottom: t(r.bottom), width: t(r.width), height: t(r.height) }
    }

    // Grouped bars: a named figure whose data is in a hidden table.
    const grouped = canvas.getByRole('figure', { name: 'Opus pass rate by round' })
    const table = within(grouped).getByRole('table', { name: 'Opus pass rate by round' })
    await expect(within(table).getByRole('columnheader', { name: 'with the skill' })).toBeInTheDocument()
    await expect(within(table).getByRole('row', { name: 'r1 87% 67%' })).toBeInTheDocument()
    await expect(box(table.parentElement ?? table).width).toBeLessThanOrEqual(1)
    const svg = grouped.querySelector('svg')
    if (svg === null) throw new Error('no svg')
    await expect(svg).toHaveAttribute('aria-hidden', 'true')
    // Seven groups at a 56 px pitch over a 110 px plot, an 8 px gap and a 17 px axis, as in Figma.
    await expect([box(svg).width, box(svg).height]).toEqual([392, 135])
    const bars = Array.from(grouped.querySelectorAll('rect'))
    await expect(bars).toHaveLength(14)
    const [with1, without1, with2] = bars
    if (with1 === undefined || without1 === undefined || with2 === undefined) throw new Error('no bars')
    await expect([box(with1).width, box(with1).height]).toEqual([16, 95.7])
    await expect(box(without1).left - box(with1).right).toBe(4)
    await expect(box(with1).left - box(svg).left).toBe(10)
    await expect(box(with2).left - box(with1).left).toBe(56)
    // Bars stand on one baseline, and the radius is radius.hair.
    await expect(box(with1).bottom).toBe(box(without1).bottom)
    await expect(getComputedStyle(with1).rx).toBe('2px')
    await expect(getComputedStyle(with1).fill).toBe(swatch('accent'))
    await expect(getComputedStyle(without1).fill).toBe(swatch('muted'))
    // The axis labels are mono 12 in muted, centred under each group.
    const axis = Array.from(grouped.querySelectorAll('text'))
    await expect(axis.map((t) => t.textContent)).toEqual(rounds.map((r) => r.label))
    const a = getComputedStyle(axis[0] ?? svg)
    await expect([a.fontSize, a.fill]).toEqual(['12px', swatch('muted')])
    await expect(a.fontFamily).toContain('Geist Mono')
    await expect(Math.round((box(axis[0] ?? svg).left + box(axis[0] ?? svg).right) / 2 - box(svg).left)).toBe(28)
    // A third series takes its own tone; the default for a later series is muted.
    const three = Array.from(canvas.getByRole('figure', { name: 'Three series' }).querySelectorAll('rect'))
    await expect(three.map((r) => getComputedStyle(r).fill)).toEqual([swatch('done'), swatch('muted'), swatch('danger')])

    // Horizontal bars: a named list; each item reads its label and value.
    const days = canvas.getByRole('list', { name: 'Calls per day' })
    const items = within(days).getAllByRole('listitem')
    // Each item reads its label and value; the copy that sizes the value column is hidden from assistive technology.
    const visible = (i: HTMLElement) => Array.from(i.children).filter((c) => c.getAttribute('aria-hidden') !== 'true').map((c) => c.textContent)
    await expect(items.map(visible)).toEqual([['Nov 8', '2'], ['Nov 9', '326'], ['Nov 13', '2']])
    const [small, full] = items
    if (small === undefined || full === undefined) throw new Error('no rows')
    const label = within(full).getByText('Nov 9')
    const value = within(full).getAllByText('326')[0] ?? full
    const bar = full.querySelector('svg')
    const smallBar = small.querySelector('svg')
    if (bar === null || smallBar === null) throw new Error('no bar')
    await expect(bar).toHaveAttribute('aria-hidden', 'true')
    // A 10 px bar 8 px after the label and 8 px before its value; rows 8 px apart.
    await expect(box(bar).height).toBe(10)
    await expect(Math.round(box(bar).left - box(label).right)).toBeGreaterThanOrEqual(8)
    await expect(Math.round(box(value).left - box(bar).right)).toBe(8)
    await expect(Math.round(box(full).top - box(small).bottom)).toBe(8)
    // Bars start in one column, whatever the label width.
    await expect(box(bar).left).toBe(box(smallBar).left)
    // A small bar is drawn 4 px long, so it still shows; the full one fills the track up to the value room.
    const drawn = (s: Element) => Math.max(...Array.from(s.querySelectorAll('rect')).map((r) => box(r).width))
    await expect(drawn(smallBar)).toBe(4)
    await expect(Math.round(drawn(bar))).toBeGreaterThan(200)
    // 1 of 100,000 still draws 4 px; a long label stops at half the width with an ellipsis,
    // leaving the bars room; a long value fits inside the row after a full bar.
    const edge = within(canvas.getByRole('list', { name: 'Edge cases' })).getAllByRole('listitem')
    const [rare, long] = edge
    if (rare === undefined || long === undefined) throw new Error('no edge rows')
    await expect(drawn(rare.querySelector('svg') ?? rare)).toBe(4)
    const longLabel = long.firstElementChild
    const longBar = long.querySelector('svg')
    if (longLabel === null || longBar === null) throw new Error('no long row')
    await expect(box(longLabel).width).toBeLessThanOrEqual(box(long).width / 2)
    // The TruncatedText in the label cuts it.
    const longText = longLabel.querySelector('.truncated-text')
    if (longText === null) throw new Error('no truncated text')
    await expect(longText.scrollWidth).toBeGreaterThan(longText.clientWidth)
    await expect(box(longBar).width).toBeGreaterThan(20)
    await expect(box(within(long).getAllByText('100,000 calls')[0] ?? long).right).toBeLessThanOrEqual(box(long).right)
    await expect(box(value).right).toBeLessThanOrEqual(box(full).right)
    const rect = bar.querySelector('rect')
    if (rect === null) throw new Error('no rect')
    await expect([getComputedStyle(rect).fill, getComputedStyle(rect).rx]).toEqual([swatch('accent'), '2px'])
    const l = getComputedStyle(label)
    const v = getComputedStyle(value)
    await expect([l.fontSize, l.color, v.fontSize, v.color]).toEqual(['12px', swatch('text'), '12px', swatch('muted')])
    await expect(v.fontFamily).toContain('Geist Mono')

    // A zero value draws no bar; a value over max is capped at a full bar; a tone colours the bars.
    const where = within(canvas.getByRole('list', { name: 'Where it ran' })).getAllByRole('listitem')
    const [first, zero, over] = where
    if (first === undefined || zero === undefined || over === undefined) throw new Error('no rows')
    await expect(zero.querySelectorAll('rect')).toHaveLength(0)
    await expect(within(zero).getAllByText('0')).toHaveLength(2)
    const fullOf = (row: Element) => row.querySelector('svg')?.getBoundingClientRect().width ?? 0
    await expect(fullOf(first) / fullOf(over)).toBeCloseTo(302 / 400, 2)
    await expect(getComputedStyle(first.querySelector('rect') ?? first).fill).toBe(swatch('done'))
  },
} satisfies Meta<typeof Charts>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const narrowBox = css({ w: 'shell.popoverSm' })

/** A long row label is cut to one line and shows in full in a tooltip, on hover and on keyboard focus. */
export const LongLabel: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <div className={narrowBox}>
        <HorizontalBarChart label="Calls" rows={[{ label: 'skill-eval-round-with-held-out-cases-and-a-trigger-set', value: 12 }, { label: 'writer', value: 4 }]} />
      </div>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const label = within(canvasElement).getAllByRole('listitem')[0]?.firstElementChild
    if (label === null || label === undefined) throw new Error('no label')
    await expectCutText(label, 'skill-eval-round-with-held-out-cases-and-a-trigger-set')
  },
}
