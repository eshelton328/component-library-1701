import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Glyph } from './glyph'
import { Stack } from './layout'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24' })
const pane = css({ bg: 'surface.pane', p: '12', borderRadius: 'xl', w: 'shell.listPane' })
// Toolkit D28 492:2185: the hook's test line in the `small` style (Geist 12/16) in fg.muted.
const small = css({ textStyle: 'small', color: 'fg.muted', whiteSpace: 'nowrap' })
const body = css({ textStyle: 'body', color: 'fg.default', whiteSpace: 'nowrap' })

function Glyphs() {
  return (
    <main className={page}>
      <div className={pane}>
        <Stack gap="8">
          <p className={small} data-testid="line">
            the rule’s <Glyph symbol="cross" /> and <Glyph symbol="check" /> examples
          </p>
          <p className={body} data-testid="large">
            <Glyph symbol="cross" size="16" /> fails, <Glyph symbol="check" size="16" /> passes
          </p>
        </Stack>
      </div>
    </main>
  )
}

const glyphsIn = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLElement>('[data-symbol]'))

const svgIn = (el: HTMLElement) => {
  const svg = el.querySelector('svg')
  if (!(svg instanceof SVGSVGElement)) throw new Error('no svg')
  return svg
}

/** The two ends of each stroke of a mark, in the 24 grid, top end first. */
const strokes = (svg: SVGSVGElement) =>
  Array.from(svg.querySelectorAll('path'), (path) => {
    const a = path.getPointAtLength(0)
    const b = path.getPointAtLength(path.getTotalLength())
    return a.y < b.y ? { top: a, bottom: b } : { top: b, bottom: a }
  })

const meta = {
  title: 'Data display/Glyph',
  component: Glyphs,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const line = canvas.getByTestId('line')
    // The characters stay in the text, so the line reads, copies and finds as Figma's string (492:2185).
    await expect(line.textContent).toBe('the rule’s ✗ and ✓ examples')
    const lineStyle = getComputedStyle(line)
    const textSize = Number.parseFloat(lineStyle.fontSize)
    await expect(textSize).toBe(12)
    // The glyphs do not make the line taller than its 16 px line height.
    await expect(line.getBoundingClientRect().height).toBeCloseTo(Number.parseFloat(lineStyle.lineHeight), 1)
    const [cross, check] = glyphsIn(line)
    if (cross === undefined || check === undefined) throw new Error('two glyphs')
    for (const [el, char] of [
      [cross, '✗'],
      [check, '✓'],
    ] as const) {
      const svg = svgIn(el)
      // The mark is the size of the text (12 by default) and paints in the line's colour.
      await expect(el.getBoundingClientRect().width).toBe(textSize)
      await expect(svg.getBoundingClientRect().width).toBe(textSize)
      await expect(svg.getBoundingClientRect().height).toBe(textSize)
      for (const path of Array.from(svg.querySelectorAll('path'))) await expect(getComputedStyle(path).stroke).toBe(lineStyle.color)
      // The icon is hidden from assistive technology; the character is the text it reads, painted in no colour.
      await expect(svg.getAttribute('aria-hidden')).toBe('true')
      const charEl = el.querySelector('span')
      if (charEl === null) throw new Error('no character')
      await expect(charEl.textContent).toBe(char)
      await expect(getComputedStyle(charEl).color).toBe('rgba(0, 0, 0, 0)')
      await expect(getComputedStyle(charEl).fontFamily).toBe(lineStyle.fontFamily)
      await expect(getComputedStyle(charEl).overflow).toBe('visible')
    }
    // Figma's ✗ leans right, as a hand-drawn cross: the middle of its top ends is right of the middle of its
    // bottom ends (an upright x, CloseIcon, has them level).
    const crossStrokes = strokes(svgIn(cross))
    await expect(crossStrokes).toHaveLength(2)
    const mid = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
    const lean = mid(crossStrokes.map((s) => s.top.x)) - mid(crossStrokes.map((s) => s.bottom.x))
    await expect(lean).toBeGreaterThanOrEqual(2)
    // Figma's ✓ is one stroke whose long arm rises to the top right, higher than its short arm starts.
    const [checkStroke] = strokes(svgIn(check))
    if (checkStroke === undefined) throw new Error('no check stroke')
    await expect(checkStroke.top.x).toBeGreaterThan(18)
    await expect(checkStroke.top.y).toBeLessThanOrEqual(5)
    // `size` sets the mark to another icon size, for text of that size.
    for (const el of glyphsIn(canvas.getByTestId('large'))) {
      await expect(svgIn(el).getBoundingClientRect().width).toBe(16)
      await expect(el.getBoundingClientRect().width).toBe(16)
    }
    await expect(canvas.getByTestId('large').textContent).toBe('✗ fails, ✓ passes')
  },
} satisfies Meta<typeof Glyphs>
export default meta

export const GlyphDark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const GlyphLight: StoryObj<typeof meta> = { globals: { mode: 'light' } }
