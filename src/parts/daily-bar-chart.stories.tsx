import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Stack } from '../controls/layout'
import { DailyBarChart } from './bar-chart'
import { expectCutText } from '../controls/tooltip.testing'

const page = css({ bg: 'bg.canvas', p: '24' })
const panel = css({ bg: 'surface.pane', p: '16', borderRadius: 'xl', w: 'shell.listPane' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  accent: css({ bg: 'accent.default' }),
  running: css({ bg: 'status.running.fg' }),
  muted: css({ bg: 'fg.muted' }),
  text: css({ bg: 'fg.default' }),
  border: css({ bg: 'border.default' }),
}

// Toolkit D17 "calls per day" (444:581): 16 days, Oct 31 to Nov 15.
const days = Array.from({ length: 16 }, (_, i) => {
  const day = new Date(Date.UTC(2026, 9, 31 + i))
  return {
    date: day.toISOString().slice(0, 10),
    label: day.toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
  }
})
function series(values: Record<number, number>) {
  return days.map((d, i) => ({ ...d, value: values[i] ?? 0 }))
}
// Headless runs 444:586 and Chats 444:597.
const headless = series({ 7: 206, 8: 44, 9: 1777 })
const chats = series({ 1: 1, 2: 1, 7: 1, 8: 1, 9: 14, 13: 7 })

function Charts() {
  return (
    <main className={page}>
      <Stack gap="24">
        <div className={panel}>
          <Stack gap="12">
            <DailyBarChart label="Headless runs per day" legend="Headless runs" tone="running" valueLabel="calls" data={headless} axisLabels="none" />
            <DailyBarChart label="Chats per day" legend="Chats" valueLabel="calls" data={chats} highlight="2026-11-13" axisLabels="endsAndMiddle" />
          </Stack>
        </div>
        <div className={panel}>
          <DailyBarChart label="Edge cases" max={10} data={[{ date: 'a', value: 0 }, { date: 'b', value: 0.01 }, { date: 'c', value: 50 }]} formatValue={(v) => `${String(v)} runs`} />
        </div>
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
  title: 'Data display/Daily bar chart',
  component: Charts,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const swatch = (name: string) => {
      const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
      if (el === null) throw new Error(`no swatch ${name}`)
      return getComputedStyle(el).backgroundColor
    }
    const t = (n: number) => Math.round(n * 10) / 10
    const box = (el: Element) => {
      const r = el.getBoundingClientRect()
      return { left: t(r.left), right: t(r.right), top: t(r.top), bottom: t(r.bottom), width: t(r.width), height: t(r.height) }
    }
    const svgOf = (figure: HTMLElement) => {
      const svg = figure.querySelector('svg')
      if (svg === null) throw new Error('no svg')
      return svg
    }
    // The bars, without the baseline (the last rect).
    const barsOf = (figure: HTMLElement) => Array.from(figure.querySelectorAll('rect')).slice(0, -1)

    // A named figure whose data is in a hidden table: one row per day, with the unit as the column header.
    const runs = canvas.getByRole('figure', { name: 'Headless runs per day' })
    const table = within(runs).getByRole('table', { name: 'Headless runs per day' })
    await expect(within(table).getByRole('columnheader', { name: 'calls' })).toBeInTheDocument()
    await expect(within(table).getAllByRole('row')).toHaveLength(17)
    await expect(within(table).getByRole('row', { name: 'Nov 9 1777' })).toBeInTheDocument()
    await expect(box(table.parentElement ?? table).width).toBeLessThanOrEqual(1)
    const svg = svgOf(runs)
    await expect(svg).toHaveAttribute('aria-hidden', 'true')

    // A 78 px plot; the tallest bar is 64 px over a 1 px border.default baseline, as in Figma 444:592.
    await expect(box(svg).height).toBe(78)
    const baseline = Array.from(runs.querySelectorAll('rect')).at(-1)
    if (baseline === undefined) throw new Error('no baseline')
    await expect([box(baseline).height, box(baseline).bottom, box(baseline).width]).toEqual([1, box(svg).bottom, box(svg).width])
    await expect(getComputedStyle(baseline).fill).toBe(swatch('border'))
    const bars = barsOf(runs)
    // Days at 0 draw no bar; 206, 44 and 1777 of 1777 draw 7, 2 and 64 px, as Figma 444:594-596.
    await expect(bars).toHaveLength(3)
    const visible = (bar: Element) => t(box(svg).bottom - 1 - box(bar).top)
    await expect(bars.map(visible)).toEqual([7, 2, 64])
    const [, , tallest] = bars
    if (tallest === undefined) throw new Error('no bar')
    // Bars fill 26 of every 40.93 px; the 10th day of 16 starts at 9 slots.
    const pitch = box(svg).width / (15 + 26 / (614 / 15))
    await expect(Math.abs(box(tallest).width - pitch * (26 / (614 / 15)))).toBeLessThan(0.5)
    await expect(Math.abs(box(tallest).left - box(svg).left - 9 * pitch)).toBeLessThan(0.5)
    // Only the top corners are round: radii.xs, with the bottom drawn under the clipped baseline.
    await expect(getComputedStyle(tallest).rx).toBe('4px')
    await expect(box(tallest).bottom).toBeGreaterThan(box(svg).bottom)
    await expect(getComputedStyle(svg).overflow).toBe('hidden')
    await expect(getComputedStyle(tallest).fill).toBe(swatch('running'))

    // The legend: an 8 px swatch in the bar colour, the name in small text, "max N" in mono muted, 6 px apart; 6 px above the bars.
    const legendName = within(runs).getByText('Headless runs')
    const legend = legendName.closest('.daily-bar-chart__legend')
    if (legend === null) throw new Error('no legend')
    const legendSwatch = legend.firstElementChild
    if (legendSwatch === null) throw new Error('no swatch')
    await expect([box(legendSwatch).width, box(legendSwatch).height]).toEqual([8, 8])
    await expect(getComputedStyle(legendSwatch).backgroundColor).toBe(swatch('running'))
    await expect(getComputedStyle(legendSwatch).borderRadius).toBe('2px')
    const n = getComputedStyle(legendName)
    await expect([n.fontSize, n.color]).toEqual(['12px', swatch('text')])
    const max = within(runs).getByText('max 1777')
    const m = getComputedStyle(max)
    await expect([m.fontSize, m.color]).toEqual(['12px', swatch('muted')])
    await expect(m.fontFamily).toContain('Geist Mono')
    await expect(box(max).right).toBe(box(svg).right)
    await expect(t(box(svg).top - box(legend).bottom)).toBe(6)
    // `axisLabels="none"` draws no axis, so a chart above another shares its axis.
    await expect(runs.querySelector('.daily-bar-chart__axis')).toBeNull()

    // The second chart: accent bars, 1 and 7 of 14 draw 5 and 32 px (444:605, 444:610).
    const chatFigure = canvas.getByRole('figure', { name: 'Chats per day' })
    const chatBars = barsOf(chatFigure)
    const chatSvg = svgOf(chatFigure)
    await expect(chatBars.map((b) => t(box(chatSvg).bottom - 1 - box(b).top))).toEqual([5, 5, 5, 5, 64, 32])
    await expect(getComputedStyle(chatBars[0] ?? chatSvg).fill).toBe(swatch('accent'))
    // The highlighted day has a 1.5 px fg.default ring, and the table marks it as the current date.
    const highlighted = chatFigure.querySelectorAll('[data-highlighted]')
    await expect(highlighted).toHaveLength(1)
    await expect(highlighted[0]).toBe(chatBars[5])
    const ring = getComputedStyle(chatBars[5] ?? chatSvg)
    await expect([ring.stroke, ring.strokeWidth]).toEqual([swatch('text'), '1.5px'])
    await expect(getComputedStyle(chatBars[4] ?? chatSvg).strokeWidth).not.toBe('1.5px')
    const current = within(chatFigure).getByRole('row', { name: 'Nov 13 7' })
    await expect(current).toHaveAttribute('aria-current', 'date')
    // The axis names the first, middle and last days in mono muted, from edge to edge.
    const axis = chatFigure.querySelector('.daily-bar-chart__axis')
    if (axis === null) throw new Error('no axis')
    await expect(axis).toHaveAttribute('aria-hidden', 'true')
    const labels = Array.from(axis.children)
    await expect(labels.map((l) => l.textContent)).toEqual(['Oct 31', 'Nov 7', 'Nov 15'])
    const a = getComputedStyle(labels[0] ?? axis)
    await expect([a.fontSize, a.color]).toEqual(['12px', swatch('muted')])
    await expect(a.fontFamily).toContain('Geist Mono')
    await expect(box(labels[0] ?? axis).left).toBe(box(chatSvg).left)
    await expect(box(labels[2] ?? axis).right).toBe(box(chatSvg).right)
    await expect(Math.abs((box(labels[1] ?? axis).left + box(labels[1] ?? axis).right) / 2 - (box(chatSvg).left + box(chatSvg).right) / 2)).toBeLessThan(4)

    // Edge cases: a tiny value still draws 2 px; a value over max is a full bar; the default axis names the ends, from `date` when there is no label.
    const edge = canvas.getByRole('figure', { name: 'Edge cases' })
    const edgeSvg = svgOf(edge)
    await expect(barsOf(edge).map((b) => t(box(edgeSvg).bottom - 1 - box(b).top))).toEqual([2, 64])
    await expect(Array.from(edge.querySelectorAll('.daily-bar-chart__axisLabel')).map((l) => l.textContent)).toEqual(['a', 'c'])
    await expect(within(edge).getByRole('columnheader', { name: 'value' })).toBeInTheDocument()
    await expect(within(edge).getByRole('row', { name: 'c 50 runs' })).toBeInTheDocument()
    await expect(edge.querySelector('.daily-bar-chart__legend')).toBeNull()
  },
} satisfies Meta<typeof Charts>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const narrowBox = css({ w: 'shell.popoverSm' })

/** A long legend name is cut to one line and shows in full in a tooltip, on hover and on keyboard focus. */
export const LongLegend: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <div className={narrowBox}>
        <DailyBarChart label="Runs" legend="skill-eval-round-with-held-out-cases-and-a-trigger-set" data={chats} />
      </div>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const name = canvasElement.querySelector('.daily-bar-chart__name')
    if (name === null) throw new Error('no legend name')
    await expectCutText(name, 'skill-eval-round-with-held-out-cases-and-a-trigger-set')
    // The legend's "max N" keeps its room beside the cut name.
    const max = within(canvasElement).getByText('max 14')
    await expect(max.getBoundingClientRect().right).toBeLessThanOrEqual(name.parentElement?.getBoundingClientRect().right ?? 0)
  },
}

const ringSwatch = css({ bg: 'fg.default' })

/** A highlighted day at 0 still shows its mark: the ring on an empty 2 px slot at the baseline. */
export const HighlightedZero: StoryObj<typeof meta> = {
  globals: { mode: 'light' },
  render: () => (
    <main className={page}>
      <div className={panel}>
        <DailyBarChart label="Calls today" valueLabel="calls" data={chats} highlight="2026-11-15" />
      </div>
      <span hidden data-swatch="ring" className={ringSwatch} />
    </main>
  ),
  play: async ({ canvasElement }) => {
    const figure = within(canvasElement).getByRole('figure', { name: 'Calls today' })
    const svg = figure.querySelector('svg')
    const swatch = canvasElement.querySelector('[data-swatch="ring"]')
    if (svg === null || swatch === null) throw new Error('no svg')
    // Six days above 0 draw bars; the highlighted day at 0 adds one marker, and the other zero days draw nothing.
    const bars = Array.from(figure.querySelectorAll('rect')).slice(0, -1)
    await expect(bars).toHaveLength(7)
    const marker = figure.querySelector('[data-highlighted]')
    if (marker === null) throw new Error('no highlight marker')
    await expect(marker).toBe(bars[6])
    await expect(marker).toHaveAttribute('data-empty')
    const s = getComputedStyle(marker)
    await expect([s.fill, s.stroke, s.strokeWidth]).toEqual(['none', getComputedStyle(swatch).backgroundColor, '1.5px'])
    // The marker stands 2 px over the baseline in the last slot, which ends at the right edge.
    const r = marker.getBoundingClientRect()
    const box = svg.getBoundingClientRect()
    await expect(Math.round(box.bottom - 1 - r.top)).toBe(2)
    await expect(Math.abs(r.right - box.right)).toBeLessThan(0.5)
    await expect(within(figure).getByRole('row', { name: 'Nov 15 0' })).toHaveAttribute('aria-current', 'date')
  },
}
