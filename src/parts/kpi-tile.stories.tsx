import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Grid } from '../controls/layout'
import { KpiTile } from './kpi-tile'
import { expectCutText } from '../controls/tooltip.testing'

// The tile row and the narrow tile stack 24 apart, so their borders never touch.
const page = css({ bg: 'bg.canvas', p: '24', display: 'grid', gap: '24' })
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
        <KpiTile value="1,234,567,890,123,456,789" label="tokens read by every agent in the last thirty days" caption="counted from the transcripts of every chat and headless run" />
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
    // The TruncatedText inside the term holds the text.
    const term = canvas.getByText('calls').closest('.kpi-tile__label')
    if (!(term instanceof HTMLElement)) throw new Error('no term')
    await expect(term.tagName).toBe('DT')
    const tile = term.closest('dl')
    if (!(tile instanceof HTMLElement)) throw new Error('no tile')
    await expect(Array.from(tile.querySelectorAll('dd')).map((d) => d.textContent)).toEqual(['330', 'since Oct 31'])
    const s = getComputedStyle(tile)
    await expect([s.backgroundColor, s.borderTopColor, s.borderTopWidth, s.borderTopLeftRadius]).toEqual([swatch('pane'), swatch('border'), '1px', '12px'])
    await expect([s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft, s.rowGap]).toEqual(['10px', '12px', '10px', '12px', '2px'])
    // The value is on top in the title style, then the label, then the muted caption: 86 px in all on the 4 px line grid (Figma draws 89).
    const value = within(tile).getByText('330')
    const caption = within(tile).getByText('since Oct 31')
    const v = getComputedStyle(value)
    await expect([v.fontSize, Math.round(Number.parseFloat(v.lineHeight)), v.fontWeight, v.color]).toEqual(['20px', 28, '600', swatch('text')])
    const l = getComputedStyle(term)
    await expect([l.fontSize, l.fontWeight, l.color, l.marginLeft]).toEqual(['12px', '400', swatch('text'), '0px'])
    await expect(getComputedStyle(caption).color).toBe(swatch('muted'))
    await expect(value.getBoundingClientRect().bottom).toBeLessThanOrEqual(term.getBoundingClientRect().top)
    await expect(term.getBoundingClientRect().bottom).toBeLessThanOrEqual(caption.getBoundingClientRect().top)
    await expect(Math.round(tile.getBoundingClientRect().height)).toBe(86)
    // A tile with an empty caption has one definition.
    const last = canvas.getByText('last used').closest('dl')
    if (!(last instanceof HTMLElement)) throw new Error('no last tile')
    await expect(last.querySelectorAll('dd')).toHaveLength(1)
    // A long value, label and caption each stay on one line, clipped inside the tile with an ellipsis.
    const lines = [
      [canvas.getByText('1,234,567,890,123,456,789'), 28],
      [canvas.getByText('tokens read by every agent in the last thirty days'), 16],
      [canvas.getByText('counted from the transcripts of every chat and headless run'), 16],
    ] as const
    for (const [line, height] of lines) {
      const ls = getComputedStyle(line)
      await expect([ls.overflowX, ls.whiteSpace, ls.textOverflow]).toEqual(['hidden', 'nowrap', 'ellipsis'])
      await expect(line.scrollWidth).toBeGreaterThan(line.clientWidth)
      await expect(Math.round(line.getBoundingClientRect().height)).toBe(height)
      const box = line.closest('dl')
      if (box === null) throw new Error('no tile')
      await expect(line.getBoundingClientRect().right).toBeLessThanOrEqual(box.getBoundingClientRect().right)
    }
  },
} satisfies Meta<typeof Tiles>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const narrowBox = css({ w: 'shell.popoverSm' })

const longValue = '1,234,567,890,123,456,789,012'
const longLabel = 'tokens read by every agent in the last thirty days'
const longCaption = 'counted from the transcripts of every chat and headless run'

/** A long value, label and caption are each cut to one line and show in full in a tooltip, on hover and on focus. */
export const LongText: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <div className={narrowBox}>
        <KpiTile value={longValue} label={longLabel} caption={longCaption} />
      </div>
    </main>
  ),
  play: async ({ canvasElement }) => {
    for (const [slot, full] of [['value', longValue], ['label', longLabel], ['caption', longCaption]] as const) {
      const el = canvasElement.querySelector(`.kpi-tile__${slot}`)
      if (el === null) throw new Error(`no ${slot}`)
      await expectCutText(el, full)
    }
  },
}

// A caption wider than its tile, as Toolkit D12's "claude -p and the SDK, mostly skill evals" (445:227) in the
// narrower view, and one longer than two lines.
const wideCaption = 'claude -p and the SDK, mostly skill evals and the review hooks'
const tooLongCaption = 'counted from the transcripts of every chat, every headless run and every hook that blocked a commit in the last thirty days'

function CaptionLinesTiles() {
  return (
    <main className={page}>
      <div className={narrowBox}>
        <KpiTile value="2,027" label="from headless runs" caption={wideCaption} captionLines={2} />
      </div>
      <div className={narrowBox}>
        <KpiTile value="9" label="rejected" caption={tooLongCaption} captionLines={2} />
      </div>
      <div className={narrowBox}>
        <KpiTile value="2,052" label="toolkit calls" caption={wideCaption} />
      </div>
      <div hidden>
        <span data-swatch="muted" className={swatches.muted} />
      </div>
    </main>
  )
}

const captionLinesPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const tileOf = (label: string) => {
    const tile = canvas.getByText(label).closest('dl')
    if (!(tile instanceof HTMLElement)) throw new Error(`no tile ${label}`)
    const caption = tile.querySelector('.kpi-tile__caption')
    if (!(caption instanceof HTMLElement)) throw new Error(`no caption in ${label}`)
    const text = caption.firstElementChild
    if (!(text instanceof HTMLElement)) throw new Error(`no caption text in ${label}`)
    return { tile, caption, text }
  }
  // captionLines={2}: the caption wraps onto a second `small` line (12/16, muted) and shows whole, inside the padding.
  const wrapped = tileOf('from headless runs')
  const w = getComputedStyle(wrapped.text)
  await expect([w.fontSize, Math.round(Number.parseFloat(w.lineHeight)), w.whiteSpace, w.webkitLineClamp]).toEqual(['12px', 16, 'normal', '2'])
  const muted = canvasElement.querySelector('[data-swatch="muted"]')
  if (muted === null) throw new Error('no muted swatch')
  await expect(w.color).toBe(getComputedStyle(muted).backgroundColor)
  await expect(wrapped.text.textContent).toBe(wideCaption)
  await expect(Math.round(wrapped.text.getBoundingClientRect().height)).toBe(32)
  await expect(wrapped.text.scrollHeight - wrapped.text.clientHeight).toBeLessThanOrEqual(1)
  await expect(wrapped.text.getBoundingClientRect().right).toBeLessThanOrEqual(wrapped.caption.getBoundingClientRect().right)
  // The tile grows by the caption's second line: 86 + 16.
  await expect(Math.round(wrapped.tile.getBoundingClientRect().height)).toBe(102)
  // A caption longer than its two lines is cut on the second with an ellipsis.
  const cut = tileOf('rejected')
  await expect(Math.round(cut.text.getBoundingClientRect().height)).toBe(32)
  await expect(cut.text.scrollHeight).toBeGreaterThan(cut.text.clientHeight)
  await expect(getComputedStyle(cut.text).webkitLineClamp).toBe('2')
  // Without the prop the caption keeps today's look: one line, cut with an ellipsis, in an 86 px tile.
  const single = tileOf('toolkit calls')
  const s = getComputedStyle(single.text)
  await expect([s.whiteSpace, s.textOverflow, s.overflowX]).toEqual(['nowrap', 'ellipsis', 'hidden'])
  await expect(single.text.scrollWidth).toBeGreaterThan(single.text.clientWidth)
  await expect(Math.round(single.text.getBoundingClientRect().height)).toBe(16)
  await expect(Math.round(single.tile.getBoundingClientRect().height)).toBe(86)
}

/** `captionLines={2}`: a caption wider than the tile wraps and shows whole; one longer than two lines is cut on the second. */
export const CaptionLinesDark: StoryObj<typeof meta> = { globals: { mode: 'dark' }, render: () => <CaptionLinesTiles />, play: captionLinesPlay }
/** The same tiles in the light mode. */
export const CaptionLinesLight: StoryObj<typeof meta> = { globals: { mode: 'light' }, render: () => <CaptionLinesTiles />, play: captionLinesPlay }
