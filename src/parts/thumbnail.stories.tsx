import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Thumbnail, type ThumbnailKind } from './thumbnail'

const page = css({ bg: 'bg.canvas', p: '24', display: 'grid', gap: '16', justifyItems: 'start' })
const row = css({ display: 'flex', gap: '16', alignItems: 'flex-start', flexWrap: 'wrap' })
const heading = css({ textStyle: 'eyebrow', color: 'fg.muted' })
// The widths come from the Figma sizes; the caller sets the width.
const w64 = css({ w: 'shell.rail' })
const w334 = css({ w: 'shell.popover' })

const kinds = ['chart', 'diagram', 'doc', 'grid', 'ui'] as const satisfies readonly ThumbnailKind[]

const swatches = {
  well: css({ color: 'surface.well' }),
  dot: css({ color: 'status.idle.border' }),
  accent: css({ color: 'accent.default' }),
  violet: css({ color: 'status.running.fg' }),
  accentTint: css({ color: 'accent.subtle' }),
  violetTint: css({ color: 'status.running.bg' }),
  accentBorder: css({ color: 'status.working.border' }),
  amberBorder: css({ color: 'status.needsYou.border' }),
  border: css({ color: 'border.default' }),
}

function Thumbnails() {
  return (
    <main className={page}>
      <span className={heading}>Wide, in a card that clips</span>
      <div className={row}>
        {kinds.map((k) => (
          <div key={k} className={w334} data-testid={`wide-${k}`}>
            <Thumbnail kind={k} framed={false} />
          </div>
        ))}
      </div>
      <span className={heading}>Compact, framed</span>
      <div className={row}>
        {kinds.map((k) => (
          <div key={k} className={w64} data-testid={`compact-${k}`}>
            <Thumbnail kind={k} shape="compact" />
          </div>
        ))}
      </div>
      <span className={heading}>Banner</span>
      <div className={css({ w: 'shell.dialogLg' })} data-testid="banner">
        <Thumbnail kind="chart" shape="banner" framed={false} label="Chart preview" />
      </div>
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const swatch = (root: HTMLElement, name: string) => {
  const el = root.querySelector(`[data-swatch="${name}"]`)
  return el === null ? '' : getComputedStyle(el).color
}

const thumb = (el: HTMLElement) => {
  const root = el.firstElementChild
  const svg = root?.querySelector('svg')
  if (!(root instanceof HTMLElement) || !(svg instanceof SVGSVGElement)) throw new Error('no thumbnail')
  return { root, svg }
}

const shapes = (svg: SVGSVGElement, slot: string) => Array.from(svg.querySelectorAll(`.thumbnail__${slot}`))

const meta = {
  title: 'Data display/Thumbnail',
  component: Thumbnails,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const k of kinds) {
      // Wide is 16:9 with no frame: 320 wide is 180 high.
      const wide = thumb(canvas.getByTestId(`wide-${k}`))
      const box = wide.root.getBoundingClientRect()
      await expect(box.width).toBe(320)
      await expect(box.height).toBeCloseTo(180, 0)
      await expect(getComputedStyle(wide.root).borderTopWidth).toBe('0px')
      await expect(getComputedStyle(wide.root).backgroundImage).toContain('linear-gradient')
      await expect(wide.svg.getAttribute('aria-hidden')).toBe('true')
      // Every kind has the window bar and three dots.
      const [chrome] = shapes(wide.svg, 'chrome')
      if (chrome === undefined) throw new Error('no chrome')
      await expect(getComputedStyle(chrome).fill).toBe(swatch(canvasElement, 'well'))
      const dots = shapes(wide.svg, 'dot')
      await expect(dots.length).toBe(3)
      for (const d of dots) await expect(getComputedStyle(d).fill).toBe(swatch(canvasElement, 'dot'))
      // Compact at 64 wide is 40 high with the frame (403:194): border.default, radius 6.
      const compact = thumb(canvas.getByTestId(`compact-${k}`))
      const cbox = compact.root.getBoundingClientRect()
      const cstyle = getComputedStyle(compact.root)
      await expect(cbox.width).toBe(64)
      await expect(cbox.height).toBeCloseTo(40, 0)
      await expect(cstyle.borderTopWidth).toBe('1px')
      await expect(cstyle.borderTopColor).toBe(swatch(canvasElement, 'border'))
      await expect(cstyle.borderTopLeftRadius).toBe('6px')
    }
    // Chart: nine bars, every third violet.
    const chart = thumb(canvas.getByTestId('wide-chart')).svg
    const accentBars = shapes(chart, 'accent')
    const violetBars = shapes(chart, 'violet')
    await expect([accentBars.length, violetBars.length]).toEqual([7, 3])
    const [violetBar] = violetBars
    if (violetBar === undefined) throw new Error('no violet bar')
    await expect(getComputedStyle(violetBar).fill).toBe(swatch(canvasElement, 'violet'))
    // Doc: the chips use the accent and violet tints.
    const doc = thumb(canvas.getByTestId('wide-doc')).svg
    const [accentChip] = shapes(doc, 'accentTint')
    const [violetChip] = shapes(doc, 'violetTint')
    if (accentChip === undefined || violetChip === undefined) throw new Error('no chips')
    await expect(getComputedStyle(accentChip).fill).toBe(swatch(canvasElement, 'accentTint'))
    await expect(getComputedStyle(violetChip).fill).toBe(swatch(canvasElement, 'violetTint'))
    // Grid: six cells edged in their status border, 1 px at any size.
    const grid = thumb(canvas.getByTestId('wide-grid')).svg
    const [accentCell] = shapes(grid, 'accentEdge')
    const [amberCell] = shapes(grid, 'amberEdge')
    if (accentCell === undefined || amberCell === undefined) throw new Error('no cells')
    await expect(getComputedStyle(accentCell).stroke).toBe(swatch(canvasElement, 'accentBorder'))
    await expect(getComputedStyle(amberCell).stroke).toBe(swatch(canvasElement, 'amberBorder'))
    await expect(getComputedStyle(accentCell).fill).toBe(swatch(canvasElement, 'well'))
    await expect(accentCell.getAttribute('vector-effect')).toBe('non-scaling-stroke')
    // Banner is 2:1, and a label names it.
    const banner = canvas.getByRole('img', { name: 'Chart preview' }).getBoundingClientRect()
    await expect(banner.height).toBeCloseTo(banner.width / 2, 0)
  },
} satisfies Meta<typeof Thumbnails>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
