import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Thumbnail, type ThumbnailKind, type ThumbnailTone } from './thumbnail'

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

const shapes = (svg: Element, slot: string) => Array.from(svg.querySelectorAll(`.thumbnail__${slot}`))

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
      // Every kind has the window bar and three dots (in their own layer, WindowDots).
      const [chrome] = shapes(wide.svg, 'chrome')
      if (chrome === undefined) throw new Error('no chrome')
      await expect(getComputedStyle(chrome).fill).toBe(swatch(canvasElement, 'well'))
      const dots = shapes(wide.root, 'dot')
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

// The row sizes: sm (64 × 40, D2 403:194, with window dots), md (76 × 48,
// M1 406:122, the phone drawing with no dots) and lg (128 × 72 with shape
// wide, D4 403:8217). The default fill stays as it was.
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
    // sm keeps D2's desktop drawing, window dots and all.
    for (const [size, w, h, scale] of [['sm', 64, 40, 1]] as const) {
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
    // md is M1's phone drawing (406:122 to 406:278): 76 × 48 in its frame,
    // a 76 × 4 top bar with no window dots, and Figma's boxes, each placed
    // 1 in from Figma's (its values are inside the 1 px frame border).
    const near = async (shape: Element | undefined, origin: DOMRect, [x, y, w, h]: readonly [number, number, number, number]) => {
      if (shape === undefined) throw new Error('no shape')
      const b = shape.getBoundingClientRect()
      await expect(b.left - origin.left).toBeCloseTo(x + 1, 1)
      await expect(b.top - origin.top).toBeCloseTo(y + 1, 1)
      await expect(b.width).toBeCloseTo(w, 1)
      await expect(b.height).toBeCloseTo(h, 1)
    }
    for (const k of kinds) {
      const t = thumb(canvas.getByTestId(`md-${k}`))
      const box = t.root.getBoundingClientRect()
      await expect(box.width).toBe(76)
      await expect(box.height).toBe(48)
      await expect(getComputedStyle(t.root, '::after').borderTopWidth).toBe('1px')
      await expect(getComputedStyle(t.root, '::after').borderTopColor).toBe(swatch(canvasElement, 'border'))
      await expect(getComputedStyle(t.root).borderTopLeftRadius).toBe('6px')
      await expect(shapes(t.svg, 'dot').length).toBe(0)
      await near(shapes(t.svg, 'chrome')[0], box, [-1, -1, 76, 4])
    }
    const mdBox = (k: ThumbnailKind) => thumb(canvas.getByTestId(`md-${k}`))
    // Chart 406:122: title bar 406:124, first bar 406:125, the violet third
    // bar 406:127, baseline 406:134.
    {
      const { root, svg } = mdBox('chart')
      const box = root.getBoundingClientRect()
      const bars = Array.from(svg.querySelectorAll('[data-bars] rect'))
      await expect(bars.length).toBe(9)
      await near(svg.querySelector('[data-bars]')?.previousElementSibling ?? undefined, box, [5, 7, 25.6, 3])
      await near(bars[0], box, [6.28, 30.55, 4.551, 11.454])
      await near(bars[2], box, [20.5, 31.01, 4.551, 10.987])
      await near(bars[8], box, [63.17, 18.43, 4.551, 23.565])
      await near(shapes(svg, 'muted')[0], box, [5, 42, 64, 1])
      for (const [i, bar] of bars.entries()) await expect(getComputedStyle(bar).fill).toBe(swatch(canvasElement, i % 3 === 2 ? 'violet' : 'accent'))
    }
    // UI 406:149: side bar 406:151, first row 406:152 and its pill 406:153, last row 406:158.
    {
      const { root, svg } = mdBox('ui')
      const box = root.getBoundingClientRect()
      await near(shapes(svg, 'well')[0], box, [5, 7, 14.08, 35])
      const rows = shapes(svg, 'inset')
      await expect(rows.length).toBe(4)
      await near(rows[0], box, [21.64, 7, 47.36, 5.75])
      await near(rows[3], box, [21.64, 33.25, 47.36, 5.75])
      const pills = shapes(svg, 'green')
      await expect(pills.length).toBe(4)
      await near(pills[0], box, [62.6, 10, 3.84, 2.4])
      await expect(shapes(svg, 'muted').length).toBe(0)
    }
    // Diagram 406:176: one line 406:178 and four nodes, 406:179 and 406:182.
    {
      const { root, svg } = mdBox('diagram')
      const box = root.getBoundingClientRect()
      const lines = shapes(svg, 'muted')
      await expect(lines.length).toBe(1)
      await near(lines[0], box, [17.8, 19.25, 16, 1.5])
      const nodes = shapes(svg, 'violetEdge')
      await expect(nodes.length).toBe(4)
      await near(nodes[0], box, [10.12, 15.75, 12.8, 8.4])
      await near(nodes[3], box, [53.64, 18.55, 12.8, 8.4])
    }
    // Doc 414:799: title bar 414:801, the first line 414:802, the short third 414:804, the last 414:808.
    {
      const { root, svg } = mdBox('doc')
      const box = root.getBoundingClientRect()
      const lines = shapes(svg, 'muted')
      await expect(lines.length).toBe(7)
      await near(shapes(svg, 'accent')[0], box, [5, 7, 35.2, 3])
      await near(lines[0], box, [5, 12.76, 60.8, 2])
      await near(lines[2], box, [5, 19, 38.4, 2])
      await near(lines[6], box, [5, 31.48, 60.8, 2])
      await expect(shapes(svg, 'accentTint').length).toBe(0)
    }
    // Grid 406:204: six cells in Figma's order (cyan, amber, violet, green,
    // cyan, amber), the first 406:206 and the last 406:211.
    {
      const { root, svg } = mdBox('grid')
      const box = root.getBoundingClientRect()
      const cells = Array.from(svg.querySelectorAll('[class*="Edge"]'))
      await expect(cells.map((c) => c.getAttribute('class')?.match(/thumbnail__(\w+Edge)/)?.[1])).toEqual(['accentEdge', 'amberEdge', 'violetEdge', 'greenEdge', 'accentEdge', 'amberEdge'])
      await near(cells[0], box, [5, 7, 18.667, 15.5])
      await near(cells[5], box, [50.33, 26.5, 18.667, 15.5])
      await expect(getComputedStyle(cells[0] ?? svg).stroke).toBe(swatch(canvasElement, 'accentBorder'))
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
// The label stays inside the thumbnail at the axis' ends, in every shape,
// with the line at the value: the 128-wide lg size leaves no room above
// the line at 100.
const edgeSizes = ['lg', 'fill'] as const
const edgeShapes = ['wide', 'compact', 'banner'] as const
const edgeValues = [0, 100] as const

function References() {
  return (
    <main className={page}>
      <div className={css({ w: 'shell.dialogLg' })} data-testid="reference">
        <Thumbnail kind="chart" shape="banner" reference={{ value: 71, label: 'median 71%' }} />
      </div>
      <div className={css({ w: 'shell.dialogLg' })} data-testid="no-reference">
        <Thumbnail kind="chart" shape="banner" />
      </div>
      {edgeSizes.map((size) => (
        <div key={size} className={row}>
          {edgeShapes.flatMap((shape) =>
            edgeValues.map((value) => (
              <div key={`${shape}-${String(value)}`} className={size === 'fill' ? w334 : undefined} data-testid={`edge-${size}-${shape}-${String(value)}`}>
                <Thumbnail kind="chart" shape={shape} size={size} reference={{ value, label: `median ${String(value)}%` }} />
              </div>
            )),
          )}
        </div>
      ))}
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
    // The line is dashed and amber, across the plot (8 % to 92 % of the
    // width, the axis of ChartPlot), at 71 on the axis: 169 - 124 × 0.71 of 188.
    const line = root.querySelector('.thumbnail__referenceLine')
    if (!(line instanceof HTMLElement)) throw new Error('no line')
    const lstyle = getComputedStyle(line)
    await expect(lstyle.borderTopStyle).toBe('dashed')
    await expect(lstyle.borderTopColor).toBe(swatch(canvasElement, 'amber'))
    await expect(lstyle.borderTopWidth).toBe('1px')
    const l = line.getBoundingClientRect()
    const unit = box.width / 376
    await expect(l.top + l.height / 2).toBeCloseTo(box.top + (169 - 124 * 0.71) * unit, 0)
    await expect(l.left).toBeCloseTo(box.left + box.width * 0.08, 0)
    await expect(l.right).toBeCloseTo(box.left + box.width * 0.92, 0)
    // The label ends at the plot's end, its bottom 4 above the line.
    const t = label.getBoundingClientRect()
    await expect(t.right).toBeCloseTo(l.right, 0)
    await expect(l.top - t.bottom).toBeCloseTo(4, 0)
    // Without the prop there is no line and no label.
    const plain = thumb(canvas.getByTestId('no-reference')).root
    await expect(plain.querySelector('.thumbnail__referenceLine')).toBeNull()
    await expect(plain.querySelector('[data-reference]')).toBeNull()
    await expect(plain.textContent).toBe('')
    // At 0 and 100, in each shape and at lg and fill, the label is inside
    // the thumbnail and the line still sits at the value.
    for (const size of edgeSizes) {
      for (const shape of edgeShapes) {
        for (const value of edgeValues) {
          const edge = thumb(canvas.getByTestId(`edge-${size}-${shape}-${String(value)}`)).root
          const r = edge.getBoundingClientRect()
          const text = within(edge).getByText(`median ${String(value)}%`).getBoundingClientRect()
          await expect(text.top).toBeGreaterThanOrEqual(r.top)
          await expect(text.bottom).toBeLessThanOrEqual(r.bottom)
          await expect(text.left).toBeGreaterThanOrEqual(r.left)
          await expect(text.right).toBeLessThanOrEqual(r.right)
          const edgeLine = edge.querySelector('.thumbnail__referenceLine')
          if (!(edgeLine instanceof HTMLElement)) throw new Error('no line')
          const el = edgeLine.getBoundingClientRect()
          const u = r.height / 188
          await expect(el.top + el.height / 2).toBeCloseTo(r.top + (169 - 124 * (value / 100)) * u, 0)
          await expect(el.right).toBeCloseTo(r.left + r.width * 0.92, 0)
        }
      }
    }
  },
} satisfies StoryObj<typeof meta>

export const ReferenceDark: StoryObj<typeof meta> = { ...referenceMeta, globals: { mode: 'dark' } }
export const ReferenceLight: StoryObj<typeof meta> = { ...referenceMeta, globals: { mode: 'light' } }

// One tone per artifact (D1 400:14): the doc's title bar (green 402:15656,
// violet 402:15716) and first chip (402:15664), the chart's title bar and
// main bars (amber 402:15776 to 402:15784, cyan 402:15441), with every
// third bar violet (402:15443, 402:15779). Without `tone` it draws accent,
// as before.
const tones = ['accent', 'violet', 'amber', 'green'] as const satisfies readonly ThumbnailTone[]
const toneSwatches = {
  accent: css({ color: 'accent.default' }),
  violet: css({ color: 'status.running.fg' }),
  amber: css({ color: 'status.needsYou.fg' }),
  green: css({ color: 'status.done.fg' }),
  accentTint: css({ color: 'accent.subtle' }),
  violetTint: css({ color: 'status.running.bg' }),
  amberTint: css({ color: 'status.needsYou.bg' }),
  greenTint: css({ color: 'status.done.bg' }),
}
const toneKeys = ['default', ...tones] as const

function Tones() {
  return (
    <main className={page}>
      {toneKeys.map((tone) => (
        <div key={tone} className={row}>
          {(['doc', 'chart'] as const).map((k) => (
            <div key={k} className={row}>
              <div className={w334} data-testid={`tone-${tone}-${k}`}>
                {tone === 'default' ? <Thumbnail kind={k} framed={false} /> : <Thumbnail kind={k} tone={tone} framed={false} />}
              </div>
              {(['sm', 'md'] as const).map((size) => (
                <div key={size} data-testid={`tone-${tone}-${k}-${size}`}>
                  {tone === 'default' ? <Thumbnail kind={k} size={size} /> : <Thumbnail kind={k} tone={tone} size={size} />}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
      <div hidden>
        {Object.entries(toneSwatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const fillOf = (el: Element | null | undefined) => {
  if (!(el instanceof SVGElement)) throw new Error('no shape')
  return getComputedStyle(el).fill
}

const toneMeta = {
  render: () => <Tones />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)
    for (const key of toneKeys) {
      const tone = key === 'default' ? 'accent' : key
      const solid = swatch(canvasElement, tone)
      const tint = swatch(canvasElement, `${tone}Tint`)
      const violet = swatch(canvasElement, 'violet')
      await expect(solid).not.toBe('')
      // Doc: the title bar (the drawing's first shape) in the tone, the
      // first chip in its tint, the second chip violet's tint.
      const doc = thumb(canvas.getByTestId(`tone-${key}-doc`)).svg
      await expect(fillOf(doc.querySelector(':scope > g > rect'))).toBe(solid)
      const chips = Array.from(doc.querySelectorAll(':scope > g > rect')).filter((r) => r.getAttribute('rx') === '4')
      await expect(chips.length).toBe(2)
      await expect(fillOf(chips[0])).toBe(tint)
      await expect(fillOf(chips[1])).toBe(swatch(canvasElement, 'violetTint'))
      // Chart: the title bar and main bars in the tone, every third bar violet.
      for (const id of [`tone-${key}-chart`, `tone-${key}-chart-sm`, `tone-${key}-chart-md`]) {
        const chart = thumb(canvas.getByTestId(id)).svg
        const group = chart.querySelector('[data-bars]')
        await expect(fillOf(group?.previousElementSibling)).toBe(solid)
        const bars = Array.from(group?.querySelectorAll('rect') ?? [])
        await expect(bars.length).toBe(9)
        for (const [i, bar] of bars.entries()) await expect(fillOf(bar)).toBe(i % 3 === 2 ? violet : solid)
      }
      // The row doc's title bar (after the window bar) takes the tone.
      for (const size of ['sm', 'md'] as const) {
        const rowDoc = thumb(canvas.getByTestId(`tone-${key}-doc-${size}`)).svg
        await expect(fillOf(rowDoc.querySelectorAll(':scope > g > rect')[1])).toBe(solid)
      }
    }
    // Each tone draws its own colour: four tones, four colours.
    const titles = tones.map((t) => fillOf(thumb(canvas.getByTestId(`tone-${t}-doc`)).svg.querySelector(':scope > g > rect')))
    await expect(new Set(titles).size).toBe(4)
    // Without tone, the colours are those of tone="accent", as on main.
    for (const id of ['doc', 'chart', 'doc-sm', 'chart-sm', 'doc-md', 'chart-md']) {
      const plain = Array.from(thumb(canvas.getByTestId(`tone-default-${id}`)).svg.querySelectorAll('rect')).map(fillOf)
      const accent = Array.from(thumb(canvas.getByTestId(`tone-accent-${id}`)).svg.querySelectorAll('rect')).map(fillOf)
      await expect(plain).toEqual(accent)
    }
  },
} satisfies StoryObj<typeof meta>

export const ToneDark: StoryObj<typeof meta> = { ...toneMeta, globals: { mode: 'dark' } }
export const ToneLight: StoryObj<typeof meta> = { ...toneMeta, globals: { mode: 'light' } }

// The card drawings at Figma's narrowest and widest widths: D1's 334-wide
// cards (402:15435, 402:15469) and D2's 748-wide banner (403:483).
// No size token is 334 wide: the box is the 328-wide sidebar size, and the
// thumbnail's own box reaches 6 past its end.
const box334 = { outer: css({ w: 'shell.sidebar' }), inner: css({ me: '-6' }) }
const box748 = { outer: css({ w: 'shell.detail' }), inner: undefined }
const previews = [
  { id: '334', box: box334, shape: 'wide' },
  { id: '748', box: box748, shape: 'banner' },
] as const

function PreviewWidths() {
  return (
    <main className={page}>
      {previews.map(({ id, box, shape }) => (
        <div key={id} className={row}>
          {kinds.map((k) => (
            <div key={k} className={box.outer}>
              <div className={box.inner} data-testid={`preview-${id}-${k}`}>
                <Thumbnail kind={k} shape={shape} framed={false} />
              </div>
            </div>
          ))}
          <div className={box.outer}>
            <div className={box.inner} data-testid={`preview-${id}-reference`}>
              <Thumbnail kind="chart" shape={shape} framed={false} reference={{ value: 71, label: 'median 71%' }} />
            </div>
          </div>
        </div>
      ))}
      <div data-testid="preview-lg">
        <Thumbnail kind="chart" size="lg" />
      </div>
    </main>
  )
}

// The window dots are 5 px, 9 apart, at x 8, 17 and 26 at any width (D1
// 402:15437 and 402:15471 at 334, D2 403:485 to 403:487 at 748, and lg),
// centred in the bar, which scales.
const windowDotsMeta = {
  render: () => <PreviewWidths />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)
    const ids = [...previews.flatMap(({ id }) => kinds.map((k) => `preview-${id}-${k}`)), 'preview-lg']
    for (const id of ids) {
      const { root, svg } = thumb(canvas.getByTestId(id))
      const box = root.getBoundingClientRect()
      const [chrome] = shapes(svg, 'chrome')
      if (chrome === undefined) throw new Error('no chrome')
      const bar = chrome.getBoundingClientRect()
      await expect(bar.height).toBeCloseTo((17 / 188) * box.height, 1)
      const dots = shapes(root, 'dot').map((d) => d.getBoundingClientRect())
      await expect(dots.length).toBe(3)
      for (const [i, d] of dots.entries()) {
        await expect(d.width).toBeCloseTo(5, 1)
        await expect(d.height).toBeCloseTo(5, 1)
        await expect(d.left - box.left).toBeCloseTo(8 + i * 9, 1)
        await expect(d.top + d.height / 2).toBeCloseTo(bar.top + bar.height / 2, 1)
      }
    }
  },
} satisfies StoryObj<typeof meta>

export const WindowDotsDark: StoryObj<typeof meta> = { ...windowDotsMeta, globals: { mode: 'dark' } }
export const WindowDotsLight: StoryObj<typeof meta> = { ...windowDotsMeta, globals: { mode: 'light' } }

// The chart's plot at Figma's place, within 1 px: D1 at 334 (axis 402:15450
// at x 27, 280 wide; first bar 32.6, last 281.489, 19.911 wide; title bar
// 402:15436 at 27, 112 × 8) and D2 at 748 (axis 403:498 at x 60, 628 wide;
// first bar 72.56, last 630.782, 44.658 wide; title bar 403:484 at 60,
// 251.2 × 14.96). The reference line spans the axis at its value.
const figmaPlots = {
  '334': { axis: [27, 280], first: 32.6, last: 281.489, bar: 19.911, title: [27, 112, 8] },
  '748': { axis: [60, 628], first: 72.56, last: 630.782, bar: 44.658, title: [60, 251.2, 14.96] },
} as const

const within1 = async (actual: number, expected: number) => {
  await expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1)
}

const chartPlotMeta = {
  render: () => <PreviewWidths />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)
    for (const { id } of previews) {
      const figma = figmaPlots[id]
      const { root, svg } = thumb(canvas.getByTestId(`preview-${id}-chart`))
      const box = root.getBoundingClientRect()
      await expect(box.width).toBe(Number(id))
      const [axis] = shapes(svg, 'muted').map((el) => el.getBoundingClientRect())
      if (axis === undefined) throw new Error('no axis')
      await within1(axis.left - box.left, figma.axis[0])
      await within1(axis.width, figma.axis[1])
      await within1(box.right - axis.right, figma.axis[0])
      const bars = Array.from(svg.querySelectorAll('[data-bars] rect')).map((el) => el.getBoundingClientRect())
      await expect(bars.length).toBe(9)
      const first = bars[0]
      const last = bars[8]
      if (first === undefined || last === undefined) throw new Error('no bars')
      await within1(first.left - box.left, figma.first)
      await within1(last.left - box.left, figma.last)
      for (const b of bars) await within1(b.width, figma.bar)
      const title = svg.querySelector('[data-bars]')?.previousElementSibling?.getBoundingClientRect()
      if (title === undefined) throw new Error('no title bar')
      await within1(title.left - box.left, figma.title[0])
      await within1(title.width, figma.title[1])
      await within1(title.height, figma.title[2])
      // The reference line runs along the axis, at 71 on the value scale.
      const ref = thumb(canvas.getByTestId(`preview-${id}-reference`)).root
      const line = ref.querySelector('.thumbnail__referenceLine')
      if (!(line instanceof HTMLElement)) throw new Error('no line')
      const l = line.getBoundingClientRect()
      const r = ref.getBoundingClientRect()
      await within1(l.left - r.left, figma.axis[0])
      await within1(l.width, figma.axis[1])
      await expect(l.top + l.height / 2).toBeCloseTo(r.top + ((169 - 124 * 0.71) / 188) * r.height, 0)
    }
  },
} satisfies StoryObj<typeof meta>

export const ChartPlotDark: StoryObj<typeof meta> = { ...chartPlotMeta, globals: { mode: 'dark' } }
export const ChartPlotLight: StoryObj<typeof meta> = { ...chartPlotMeta, globals: { mode: 'light' } }
