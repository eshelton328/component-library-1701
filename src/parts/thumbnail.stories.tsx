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
      <span className={heading}>Compact unframed, and a framed banner</span>
      <div className={row}>
        <div className={w334} data-testid="compact-wide">
          <Thumbnail kind="doc" shape="compact" framed={false} />
        </div>
        <div className={w334} data-testid="banner-framed">
          <Thumbnail kind="ui" shape="banner" />
        </div>
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
      await expect(cbox.height).toBe(40)
      const frame = getComputedStyle(compact.root, '::after')
      await expect(cstyle.borderTopWidth).toBe('0px')
      await expect(frame.borderTopWidth).toBe('1px')
      await expect(frame.borderTopColor).toBe(swatch(canvasElement, 'border'))
      await expect(cstyle.borderTopLeftRadius).toBe('6px')
      await expect(frame.borderTopLeftRadius).toBe('6px')
    }
    // The ratio holds at any width, framed or not: 8:5 and 2:1 at 320.
    await expect(thumb(canvas.getByTestId('compact-wide')).root.getBoundingClientRect().height).toBe(200)
    await expect(thumb(canvas.getByTestId('banner-framed')).root.getBoundingClientRect().height).toBe(160)
    // Chart: nine visible bars, every third violet.
    const chart = thumb(canvas.getByTestId('wide-chart')).svg
    const bars = Array.from(chart.querySelectorAll('[data-bars] rect'))
    await expect(bars.length).toBe(9)
    for (const [i, bar] of bars.entries()) {
      const b = bar.getBoundingClientRect()
      await expect(b.width).toBeGreaterThan(0)
      await expect(b.height).toBeGreaterThan(10)
      await expect(getComputedStyle(bar).fill).toBe(swatch(canvasElement, i % 3 === 2 ? 'violet' : 'accent'))
    }
    // Diagram: the right-hand line meets the vertical line.
    const diagram = thumb(canvas.getByTestId('wide-diagram')).svg
    const [, right, vertical] = shapes(diagram, 'muted').map((el) => el.getBoundingClientRect())
    if (right === undefined || vertical === undefined) throw new Error('no lines')
    await expect(right.left).toBeLessThanOrEqual(vertical.right)
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

// The row sizes: sm (64 × 40, D2 403:194), md (76 × 48, M1 406:122) and lg
// (128 × 72 with shape wide, D4 403:8217). The default fill stays as it was.
function RowSizes() {
  return (
    <main className={page}>
      {(['sm', 'md'] as const).map((size) => (
        <div key={size} className={row}>
          {kinds.map((k) => (
            <div key={k} data-testid={`${size}-${k}`}>
              <Thumbnail kind={k} size={size} />
            </div>
          ))}
        </div>
      ))}
      <div className={row}>
        <div data-testid="lg-chart">
          <Thumbnail kind="chart" shape="wide" size="lg" />
        </div>
        <div className={w334} data-testid="fill-grid">
          <Thumbnail kind="grid" shape="compact" />
        </div>
      </div>
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const rowMeta = {
  render: () => <RowSizes />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)
    for (const [size, w, h, scale] of [
      ['sm', 64, 40, 1],
      ['md', 76, 48, 1.2],
    ] as const) {
      for (const k of kinds) {
        const t = thumb(canvas.getByTestId(`${size}-${k}`))
        const box = t.root.getBoundingClientRect()
        await expect(box.width).toBe(w)
        await expect(box.height).toBeCloseTo(h, 1)
        await expect(getComputedStyle(t.root, '::after').borderTopWidth).toBe('1px')
        await expect(getComputedStyle(t.root).borderTopLeftRadius).toBe('6px')
        // The row drawing's window bar is 4 high (at 64 wide) with three 5 px dots.
        const [chrome] = shapes(t.svg, 'chrome')
        if (chrome === undefined) throw new Error('no chrome')
        await expect(chrome.getBoundingClientRect().height).toBeCloseTo(4 * scale, 1)
        const dots = shapes(t.svg, 'dot')
        await expect(dots.length).toBe(3)
        for (const d of dots) await expect(d.getBoundingClientRect().width).toBeCloseTo(5 * scale, 1)
      }
      // Grid: six outlined cells, 12 × 10 with radius 3.5 at 64 wide, and no label bars.
      const grid = thumb(canvas.getByTestId(`${size}-grid`)).svg
      const cells = ['accentEdge', 'amberEdge', 'violetEdge', 'greenEdge'].flatMap((slot) => shapes(grid, slot))
      await expect(cells.length).toBe(6)
      for (const c of cells) {
        await expect(c.getBoundingClientRect().width).toBeCloseTo(12 * scale, 0)
        await expect(c.getAttribute('rx')).toBe('3.5')
      }
      await expect(shapes(grid, 'accent').length).toBe(0)
      // UI: a side bar 12 wide and four rows, each with a green pill.
      const ui = thumb(canvas.getByTestId(`${size}-ui`)).svg
      const [side] = shapes(ui, 'well')
      if (side === undefined) throw new Error('no side bar')
      await expect(side.getBoundingClientRect().width).toBeCloseTo(12 * scale, 1)
      await expect(getComputedStyle(side).fill).toBe(swatch(canvasElement, 'well'))
      await expect(shapes(ui, 'inset').length).toBe(4)
      await expect(shapes(ui, 'green').length).toBe(4)
      // Chart: nine bars 4 wide on the baseline, every third violet.
      const bars = Array.from(thumb(canvas.getByTestId(`${size}-chart`)).svg.querySelectorAll('[data-bars] rect'))
      await expect(bars.length).toBe(9)
      for (const [i, bar] of bars.entries()) {
        await expect(bar.getBoundingClientRect().width).toBeCloseTo(4 * scale, 1)
        await expect(getComputedStyle(bar).fill).toBe(swatch(canvasElement, i % 3 === 2 ? 'violet' : 'accent'))
      }
    }
    // lg is 128 × 72 at 16:9 with the card's drawing (its 17-high bar at 188 high).
    const lg = thumb(canvas.getByTestId('lg-chart'))
    const lbox = lg.root.getBoundingClientRect()
    await expect(lbox.width).toBe(128)
    await expect(lbox.height).toBe(72)
    await expect(lg.svg.querySelectorAll('[data-bars] rect').length).toBe(9)
    // fill (the default) keeps the card drawing at its container's width: labelled cells, 320 × 200.
    const fill = thumb(canvas.getByTestId('fill-grid'))
    await expect(fill.root.getBoundingClientRect().width).toBe(320)
    await expect(fill.root.getBoundingClientRect().height).toBe(200)
    await expect(shapes(fill.svg, 'accent').length).toBe(2)
  },
} satisfies StoryObj<typeof meta>

export const RowSizeDark: StoryObj<typeof meta> = { ...rowMeta, globals: { mode: 'dark' } }
export const RowSizeLight: StoryObj<typeof meta> = { ...rowMeta, globals: { mode: 'light' } }

// A chart's reference line (D9 after Apply, 452:3705 and 452:3706): dashed
// in the needs-you colour across the plot at the value, with its label in
// mono at the plot's end, 4 above the line. A chart without it draws neither.
const refSwatches = {
  amber: css({ color: 'status.needsYou.fg' }),
  mono: css({ textStyle: 'mono' }),
}
function References() {
  return (
    <main className={page}>
      <div className={css({ w: 'shell.dialogLg' })} data-testid="reference">
        <Thumbnail kind="chart" shape="banner" reference={{ value: 71, label: 'median 71%' }} />
      </div>
      <div className={css({ w: 'shell.dialogLg' })} data-testid="no-reference">
        <Thumbnail kind="chart" shape="banner" />
      </div>
      <div hidden>
        {Object.entries(refSwatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

// A computed colour as sRGB channels 0 to 255 and alpha 0 to 1, read
// back from a canvas so any CSS colour syntax works.
const rgba = (colour: string): [number, number, number, number] => {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (ctx === null) throw new Error('no canvas')
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = colour
  ctx.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0, a = 0] = ctx.getImageData(0, 0, 1, 1).data
  return [r, g, b, a / 255]
}
const luminance = ([r, g, b]: readonly number[]) =>
  [r, g, b].map((c = 0) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }).reduce((sum, v, i) => sum + v * ([0.2126, 0.7152, 0.0722][i] ?? 0), 0)
const contrast = (a: readonly number[], b: readonly number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05)
}

const referenceMeta = {
  render: () => <References />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)
    const { root } = thumb(canvas.getByTestId('reference'))
    const box = root.getBoundingClientRect()
    // The label is text, visible, in mono and amber.
    const label = within(root).getByText('median 71%')
    await expect(label).toBeVisible()
    const mono = canvasElement.querySelector('[data-swatch="mono"]')
    if (mono === null) throw new Error('no mono swatch')
    const ls = getComputedStyle(label)
    await expect(ls.fontFamily).toBe(getComputedStyle(mono).fontFamily)
    await expect(ls.fontSize).toBe('12px')
    await expect(ls.lineHeight).toBe(getComputedStyle(mono).lineHeight)
    await expect(ls.color).toBe(swatch(canvasElement, 'amber'))
    // The label sits over the bars, so it has its own opaque fill that the
    // amber text reads on at WCAG AA (4.5:1 for 12 px text).
    const fill = rgba(ls.backgroundColor)
    await expect(fill[3]).toBe(1)
    await expect(contrast(rgba(ls.color), fill)).toBeGreaterThanOrEqual(4.5)
    // The line is dashed and amber, across the plot (27 to 307 of the
    // 334-wide drawing, centred in the banner's 376), at 71 on the axis:
    // 169 - 124 × 0.71 of 188.
    const line = root.querySelector('.thumbnail__referenceLine')
    if (!(line instanceof HTMLElement)) throw new Error('no line')
    const lstyle = getComputedStyle(line)
    await expect(lstyle.borderTopStyle).toBe('dashed')
    await expect(lstyle.borderTopColor).toBe(swatch(canvasElement, 'amber'))
    await expect(lstyle.borderTopWidth).toBe('1px')
    const l = line.getBoundingClientRect()
    const unit = box.width / 376
    await expect(l.top + l.height / 2).toBeCloseTo(box.top + (169 - 124 * 0.71) * unit, 0)
    await expect(l.left).toBeCloseTo(box.left + (21 + 27) * unit, 0)
    await expect(l.right).toBeCloseTo(box.left + (21 + 307) * unit, 0)
    // The label ends at the plot's end, its bottom 4 above the line.
    const t = label.getBoundingClientRect()
    await expect(t.right).toBeCloseTo(l.right, 0)
    await expect(l.top - t.bottom).toBeCloseTo(4, 0)
    // Without the prop there is no line and no label.
    const plain = thumb(canvas.getByTestId('no-reference')).root
    await expect(plain.querySelector('.thumbnail__referenceLine')).toBeNull()
    await expect(plain.querySelector('[data-reference]')).toBeNull()
    await expect(plain.textContent).toBe('')
  },
} satisfies StoryObj<typeof meta>

export const ReferenceDark: StoryObj<typeof meta> = { ...referenceMeta, globals: { mode: 'dark' } }
export const ReferenceLight: StoryObj<typeof meta> = { ...referenceMeta, globals: { mode: 'light' } }
