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
