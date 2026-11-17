import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Stack } from '../controls/layout'
import { ContextMeter } from './context-meter'

const page = css({ bg: 'bg.canvas', p: '24' })
const pane = css({ bg: 'surface.pane', p: '16', borderRadius: 'xl' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  accent: css({ bg: 'accent.default' }),
  amber: css({ bg: 'status.needsYou.fg' }),
  empty: css({ bg: 'border.default' }),
  muted: css({ bg: 'fg.muted' }),
}

function Meters() {
  return (
    <main className={page}>
      <Stack gap="12">
        <ContextMeter value={42} label="Context used, chat 1" />
        <ContextMeter value={78} high label="Context used, chat 2" />
        <div className={pane}>
          <Stack gap="12">
            <ContextMeter value={0} label="Empty" />
            <ContextMeter value={100} high label="Full" />
            <ContextMeter value={133.4} label="Over" />
            <ContextMeter value={42.6} label="Fraction" />
            <ContextMeter value={-5} label="Under" />
          </Stack>
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
  title: 'Status/Context meter',
  component: Meters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const normal = canvas.getByRole('meter', { name: 'Context used, chat 1' })
    const high = canvas.getByRole('meter', { name: 'Context used, chat 2' })
    await expect(normal).toHaveAttribute('aria-valuenow', '42')
    await expect(normal).toHaveAttribute('aria-valuetext', '42%')
    await expect(normal).toHaveTextContent('42%')
    const segmentsOf = (m: HTMLElement) => Array.from(m.querySelectorAll<HTMLElement>('.context-meter__segment'))
    const filledOf = (m: HTMLElement) => segmentsOf(m).filter((s) => s.hasAttribute('data-filled'))
    // Ten 4 × 8 segments with a 2 px gap; 42% fills four and 78% fills eight.
    await expect(segmentsOf(normal)).toHaveLength(10)
    const [a, b] = segmentsOf(normal)
    if (a === undefined || b === undefined) throw new Error('no segments')
    await expect([a.getBoundingClientRect().width, a.getBoundingClientRect().height]).toEqual([4, 8])
    await expect(b.getBoundingClientRect().left - a.getBoundingClientRect().right).toBe(2)
    await expect(filledOf(normal)).toHaveLength(4)
    await expect(filledOf(high)).toHaveLength(8)
    // A filled segment differs from an empty one, and a high meter fills and writes in another colour.
    const bg = (el: Element | undefined) => (el === undefined ? '' : getComputedStyle(el).backgroundColor)
    await expect(bg(filledOf(normal)[0])).not.toBe(bg(segmentsOf(normal)[9]))
    await expect(bg(filledOf(high)[0])).not.toBe(bg(filledOf(normal)[0]))
    await expect(bg(segmentsOf(high)[9])).toBe(bg(segmentsOf(normal)[9]))
    const text = (m: HTMLElement) => getComputedStyle(m.lastElementChild ?? m).color
    // Each colour is its token: accent and amber fills, the empty segment, and muted and amber text.
    const swatch = (name: string) => bg(canvasElement.querySelector(`[data-swatch="${name}"]`) ?? undefined)
    await expect(bg(filledOf(normal)[0])).toBe(swatch('accent'))
    await expect(bg(filledOf(high)[0])).toBe(swatch('amber'))
    await expect(bg(segmentsOf(normal)[9])).toBe(swatch('empty'))
    await expect(text(normal)).toBe(swatch('muted'))
    await expect(text(high)).toBe(swatch('amber'))
    // The value is clamped and rounded.
    await expect(filledOf(canvas.getByRole('meter', { name: 'Empty' }))).toHaveLength(0)
    await expect(filledOf(canvas.getByRole('meter', { name: 'Full' }))).toHaveLength(10)
    const over = canvas.getByRole('meter', { name: 'Over' })
    await expect(over).toHaveAttribute('aria-valuenow', '100')
    await expect(filledOf(over)).toHaveLength(10)
    // 42.6 rounds to 43, which fills four segments; a value under 0 shows 0.
    const fraction = canvas.getByRole('meter', { name: 'Fraction' })
    await expect(fraction).toHaveAttribute('aria-valuenow', '43')
    await expect(fraction).toHaveTextContent('43%')
    await expect(filledOf(fraction)).toHaveLength(4)
    const under = canvas.getByRole('meter', { name: 'Under' })
    await expect(under).toHaveAttribute('aria-valuenow', '0')
    await expect(under).toHaveTextContent('0%')
  },
} satisfies Meta<typeof Meters>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

// Figma's meter (D2b 402:5378, 83 wide): the percentage is one text layer
// (402:5381) in 11 px mono, 4 px after the segments (Figma 5, on the 4 px
// grid), so the meter fits the 83 px a compact sidebar row gives it.
function Percent() {
  return (
    <main className={page}>
      <div className={pane}>
        <Stack gap="12">
          <ContextMeter value={42} label="Sidebar chat" />
          <ContextMeter value={78} high label="High chat" />
          <ContextMeter value={100} label="Full chat" />
        </Stack>
      </div>
      <div hidden>
        <span data-swatch="muted" className={swatches.muted} />
      </div>
    </main>
  )
}

const percentPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const meter = canvas.getByRole('meter', { name: 'Sidebar chat' })
  const value = meter.querySelector<HTMLElement>('.context-meter__value')
  const segments = meter.querySelector<HTMLElement>('.context-meter__segments')
  if (value === null || segments === null) throw new Error('no value or segments')
  // One text node, "42%", as Figma's one text layer.
  await expect(Array.from(value.childNodes).map((n) => [n.nodeType, n.textContent])).toEqual([[Node.TEXT_NODE, '42%']])
  // Screen readers keep the meter's value text.
  await expect(meter).toHaveAttribute('aria-valuetext', '42%')
  // The monoSm text style: 11 px Geist Mono, 400, 16 px line height, in fg.muted.
  const style = getComputedStyle(value)
  await expect(style.fontSize).toBe('11px')
  await expect(Math.round(Number.parseFloat(style.lineHeight))).toBe(16)
  await expect(style.fontWeight).toBe('400')
  await expect(style.fontFamily).toContain('Geist Mono')
  const swatch = canvasElement.querySelector('[data-swatch="muted"]')
  await expect(style.color).toBe(swatch === null ? '' : getComputedStyle(swatch).backgroundColor)
  // Ten 4 px segments 2 apart (58), a 4 px gap, then the number: inside Figma's 83.
  await expect(segments.getBoundingClientRect().width).toBe(58)
  await expect(value.getBoundingClientRect().left - segments.getBoundingClientRect().right).toBe(4)
  await expect(value.getBoundingClientRect().right - segments.getBoundingClientRect().left).toBeLessThanOrEqual(83)
  // "100%" is one text node too.
  await expect(canvas.getByRole('meter', { name: 'Full chat' }).querySelector('.context-meter__value')?.childNodes).toHaveLength(1)
  await expect(canvas.getByRole('meter', { name: 'High chat' })).toHaveTextContent('78%')
}

export const PercentDark: StoryObj<typeof meta> = { render: () => <Percent />, play: percentPlay, globals: { mode: 'dark' } }
export const PercentLight: StoryObj<typeof meta> = { render: () => <Percent />, play: percentPlay, globals: { mode: 'light' } }
