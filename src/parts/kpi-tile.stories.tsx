import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Grid } from '../controls/layout'
import { KpiTile } from './kpi-tile'

const page = css({ bg: 'bg.canvas', p: '24' })
const narrow = css({ w: 'shell.popoverSm' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  pane: css({ bg: 'surface.pane' }),
  border: css({ bg: 'border.default' }),
  text: css({ bg: 'fg.default' }),
  muted: css({ bg: 'fg.muted' }),
}

// The four tiles of Toolkit D17 (474:584).
function Tiles() {
  return (
    <main className={page}>
      <Grid columns="4" gap="12">
        <KpiTile value="330" label="calls" caption="since Oct 31" />
        <KpiTile value="327" label="headless" caption="skill eval runs" />
        <KpiTile value="3" label="from chats" caption="CLI and desktop app" />
        <KpiTile value="Nov 13" label="last used" caption="" />
      </Grid>
      <div className={narrow}>
        <KpiTile value="1,234,567,890,123,456,789" label="tokens read by every agent in the last thirty days" />
      </div>
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const meta = {
  title: 'Data display/KPI tile',
  component: Tiles,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const swatch = (name: string) => {
      const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
      if (el === null) throw new Error(`no swatch ${name}`)
      return getComputedStyle(el).backgroundColor
    }
    // A definition list: the label is the term and the value its definition.
    const term = canvas.getByText('calls')
    await expect(term.tagName).toBe('DT')
    const tile = term.closest('dl')
    if (!(tile instanceof HTMLElement)) throw new Error('no tile')
    await expect(Array.from(tile.querySelectorAll('dd')).map((d) => d.textContent)).toEqual(['330', 'since Oct 31'])
    const s = getComputedStyle(tile)
    await expect([s.backgroundColor, s.borderTopColor, s.borderTopWidth, s.borderTopLeftRadius]).toEqual([swatch('pane'), swatch('border'), '1px', '12px'])
    await expect([s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft, s.rowGap]).toEqual(['10px', '12px', '10px', '12px', '2px'])
    // The value is on top in the title style, then the label, then the muted caption: 89 px in all, as in Figma.
    const value = within(tile).getByText('330')
    const caption = within(tile).getByText('since Oct 31')
    const v = getComputedStyle(value)
    await expect([v.fontSize, Math.round(Number.parseFloat(v.lineHeight)), v.fontWeight, v.color]).toEqual(['20px', 29, '600', swatch('text')])
    const l = getComputedStyle(term)
    await expect([l.fontSize, l.fontWeight, l.color, l.marginLeft]).toEqual(['12px', '400', swatch('text'), '0px'])
    await expect(getComputedStyle(caption).color).toBe(swatch('muted'))
    await expect(value.getBoundingClientRect().bottom).toBeLessThanOrEqual(term.getBoundingClientRect().top)
    await expect(term.getBoundingClientRect().bottom).toBeLessThanOrEqual(caption.getBoundingClientRect().top)
    await expect(Math.round(tile.getBoundingClientRect().height)).toBe(89)
    // A tile with an empty caption has one definition.
    const last = canvas.getByText('last used').closest('dl')
    if (!(last instanceof HTMLElement)) throw new Error('no last tile')
    await expect(last.querySelectorAll('dd')).toHaveLength(1)
    // A long value and label stay on one line with an ellipsis.
    const long = canvas.getByText('1,234,567,890,123,456,789')
    await expect(long.scrollWidth).toBeGreaterThan(long.clientWidth)
    await expect(Math.round(long.getBoundingClientRect().height)).toBe(29)
    const longLabel = canvas.getByText('tokens read by every agent in the last thirty days')
    await expect(longLabel.scrollWidth).toBeGreaterThan(longLabel.clientWidth)
    await expect(Math.round(longLabel.getBoundingClientRect().height)).toBe(17)
  },
} satisfies Meta<typeof Tiles>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
