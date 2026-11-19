import type { ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { thumbnail, type ThumbnailVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'

const { withProvider, withContext } = createSlotRecipeContext(thumbnail)
const Root = withProvider('div', 'root')
const Svg = withContext('svg', 'svg')
const Reference = withContext('svg', 'reference')
const ReferenceBox = withContext('div', 'referenceBox')
const ReferenceLabel = withContext('span', 'referenceLabel')
const ReferenceLine = withContext('span', 'referenceLine')

/** The kind of sample content a thumbnail draws. */
export type ThumbnailKind = 'chart' | 'diagram' | 'doc' | 'grid' | 'ui'

/**
 * The shape of a thumbnail: `wide` (16:9, the default), `compact` (8:5) or
 * `banner` (2:1). With `size="fill"` the thumbnail fills its container's
 * width; `sm` and `md` are always compact.
 */
export type ThumbnailShape = 'wide' | 'compact' | 'banner'

/**
 * A reference line on a chart thumbnail, such as a median. `value` is a
 * percentage on the chart's value axis: 0 is the baseline and 100 the top
 * of the plot, the scale the sample bars use (they read 31 to 86). Values
 * outside 0 to 100 are clamped. `label` is the text drawn above the line at
 * the plot's end, such as "median 71%".
 */
export type ThumbnailReference = { value: number; label: string }

export type ThumbnailProps = Scalar<ThumbnailVariantProps> & {
  kind?: ThumbnailKind | undefined
  shape?: ThumbnailShape | undefined
  /**
   * With `kind="chart"`, a dashed line across the plot at `value` with its
   * label in mono above the line's end, both in the needs-you colour (the
   * Artifacts page's D9 median line, 452:3705 and 452:3706). The label is
   * text, unscaled, so it keeps the mono size at any width. Other kinds and
   * the row sizes (`sm`, `md`) ignore it; without it nothing is drawn.
   */
  reference?: ThumbnailReference | undefined
  /**
   * A name for a thumbnail that stands alone, such as "Chart preview".
   * Without one the thumbnail is hidden from assistive technology, because
   * the artifact's title names it.
   */
  label?: string | undefined
}

// The drawing is laid out on Figma's 334 × 188 frame (402:15435 and its
// siblings). Each shape keeps that height, takes the exact width of its
// ratio and centres the 334-wide content.
const height = 188
const widths: Record<ThumbnailShape, number> = { wide: (height * 16) / 9, compact: (height * 8) / 5, banner: height * 2 }

type Fill = 'muted' | 'title' | 'well' | 'inset' | 'accent' | 'violet' | 'amber' | 'green' | 'accentTint' | 'violetTint' | 'accentEdge' | 'violetEdge' | 'amberEdge' | 'greenEdge'

// The class of each fill slot, from the generated recipe.
const slots = thumbnail()

function Rect({ x, y, w, h, r = 2, fill }: { x: number; y: number; w: number; h: number; r?: number; fill: Fill }) {
  const edged = fill.endsWith('Edge')
  return <rect x={x} y={y} width={w} height={h} rx={r} className={slots[fill]} strokeWidth={edged ? 1 : undefined} vectorEffect={edged ? 'non-scaling-stroke' : undefined} />
}

// Chart 402:15435: a title bar, nine bars on a baseline, every third violet.
const bars = [95.354, 65.876, 103.593, 47.916, 107.205, 38.774, 105.949, 57.34, 99.909]
function Chart() {
  return (
    <>
      <Rect x={27} y={32} w={112} h={8} fill="accent" />
      <g data-bars="">
        {bars.map((h, i) => (
          <Rect key={String(i)} x={32.6 + i * 31.11} y={169 - h} w={19.911} h={h} fill={i % 3 === 2 ? 'violet' : 'accent'} />
        ))}
      </g>
      <Rect x={27} y={169} w={280} h={1} r={0} fill="muted" />
    </>
  )
}

// Diagram 402:15516: four violet-edged nodes joined by three lines.
const nodes = [
  [49.4, 66.25],
  [144.6, 48.44],
  [144.6, 107.35],
  [239.8, 77.21],
] as const
function Diagram() {
  return (
    <>
      <Rect x={83} y={79.95} w={70} h={1.5} r={0} fill="muted" />
      {/* Figma starts this line at 181, 7 short of the vertical line; it is drawn from the vertical line here. */}
      <Rect x={172.6} y={100.5} w={78.4} h={1.5} r={0} fill="muted" />
      <Rect x={172.6} y={73.1} w={1.5} h={47.95} r={0} fill="muted" />
      {nodes.map(([x, y]) => (
        <g key={`${String(x)}-${String(y)}`}>
          <Rect x={x} y={y} w={56} h={32.88} r={6} fill="violetEdge" />
          <Rect x={x + 6} y={y + 8} w={28} h={4} fill="violet" />
        </g>
      ))}
    </>
  )
}

// Doc 402:15589: a title, seven text lines and two chips.
const lines = [266, 266, 168, 266, 266, 168, 266]
function Doc() {
  return (
    <>
      <Rect x={27} y={32} w={154} h={10} fill="accent" />
      {lines.map((w, i) => (
        <Rect key={String(i)} x={27} y={54 + i * 12} w={w} h={5} fill="muted" />
      ))}
      <Rect x={27} y={142} w={84} h={21.6} r={4} fill="accentTint" />
      <Rect x={122.2} y={142} w={84} h={21.6} r={4} fill="violetTint" />
    </>
  )
}

// Grid 402:15558: six cells, each edged and labelled in its colour.
const cells = [
  ['accentEdge', 'accent'],
  ['amberEdge', 'amber'],
  ['violetEdge', 'violet'],
  ['greenEdge', 'green'],
  ['accentEdge', 'accent'],
  ['amberEdge', 'amber'],
] as const satisfies readonly (readonly [Fill, Fill])[]
function Grid() {
  return (
    <>
      {cells.map(([edge, label], i) => {
        const x = 27 + (i % 3) * 96
        const y = i < 3 ? 32 : 104.5
        return (
          <g key={String(i)}>
            <Rect x={x} y={y} w={88} h={64.5} r={4} fill={edge} />
            <Rect x={x + 6} y={y + 6} w={44} h={4} fill={label} />
          </g>
        )
      })}
    </>
  )
}

// UI 402:15469: a sidebar of five items (the second green) and four rows,
// each with a title, a subtitle and a green pill.
function Ui() {
  return (
    <>
      <Rect x={27} y={32} w={61.6} h={137} r={4} fill="well" />
      {[0, 1, 2, 3, 4].map((i) => (
        <Rect key={`item-${String(i)}`} x={33} y={40 + i * 14} w={39.2} h={5} fill={i === 1 ? 'green' : 'muted'} />
      ))}
      {[0, 1, 2, 3].map((i) => {
        const y = 32 + i * 34.25
        return (
          <g key={`row-${String(i)}`}>
            <Rect x={99.8} y={y} w={207.2} h={28.25} r={4} fill="inset" />
            <Rect x={108.2} y={y + 8} w={98} h={5} fill="title" />
            <Rect x={108.2} y={y + 18} w={61.6} h={4} fill="muted" />
            <Rect x={279} y={y + 8} w={16.8} h={8} r={4} fill="green" />
          </g>
        )
      })}
    </>
  )
}

const drawings: Record<ThumbnailKind, () => ReactNode> = { chart: Chart, diagram: Diagram, doc: Doc, grid: Grid, ui: Ui }

// The chart's value axis: 0 on the baseline (169) and 100 at y 45, 124
// above it, where 71 lands at Figma's D9 median line (452:3705, 161.4 of
// the 374-high banner, 81 of 188). The plot runs from the baseline's start
// (27) to its end (307) in the 334-wide drawing.
const plot = { base: 169, span: 124, start: 27, end: 307 }
const percent = (n: number) => `${String(n * 100)}%`

// The line and label are drawn in an SVG with no viewBox over the drawing,
// placed in percentages of the box, so the label's text and the dash are
// not scaled with the drawing.
function ChartReference({ width, reference }: { width: number; reference: ThumbnailReference }) {
  const value = Math.min(100, Math.max(0, reference.value))
  const offset = (width - 334) / 2
  const y = (plot.base - (plot.span * value) / 100) / height
  const x = (offset + plot.start) / width
  const w = (plot.end - plot.start) / width
  return (
    <Reference data-reference="">
      <foreignObject x={percent(x)} y="0" width={percent(w)} height={percent(y)}>
        <ReferenceBox>
          <ReferenceLabel>{reference.label}</ReferenceLabel>
          <ReferenceLine aria-hidden />
        </ReferenceBox>
      </foreignObject>
    </Reference>
  )
}

// The row drawings, on Figma's 64 × 40 row preview (D2 403:194 and its
// siblings): each kind drawn for its size, with no labels, as the card
// drawing scaled down would cut its shapes to slivers. The values are read
// from the saved frame at 1:1.

// Chart 403:194: a title bar, nine bars on a baseline, every third violet.
const rowBars = [10, 23, 9, 22, 13, 21, 17, 20, 20]
function RowChart() {
  return (
    <>
      <Rect x={5} y={7} w={21} h={3} r={1.5} fill="accent" />
      <g data-bars="">
        {rowBars.map((h, i) => (
          <Rect key={String(i)} x={6 + i * 6} y={36 - h} w={4} h={h} r={1} fill={i % 3 === 2 ? 'violet' : 'accent'} />
        ))}
      </g>
      <Rect x={5} y={36} w={54} h={1} r={0} fill="muted" />
    </>
  )
}

// Diagram 403:246: four violet-edged nodes, joined as the card's are.
const rowNodes = [
  [9.5, 14.5],
  [28, 10.5],
  [28, 23],
  [46.5, 16.5],
] as const
function RowDiagram() {
  return (
    <>
      <Rect x={19.5} y={17.25} w={15.5} h={1} r={0} fill="muted" />
      <Rect x={34.5} y={17} w={1} h={6} r={0} fill="muted" />
      <Rect x={34.5} y={21.25} w={12} h={1} r={0} fill="muted" />
      {rowNodes.map(([x, y]) => (
        <Rect key={`${String(x)}-${String(y)}`} x={x} y={y} w={10} h={6.5} r={3} fill="violetEdge" />
      ))}
    </>
  )
}

// Doc 414:759: a title and seven text lines, as the card's; no chips.
const rowLines = [51, 51, 32, 51, 51, 32, 51]
function RowDoc() {
  return (
    <>
      <Rect x={5} y={7} w={29} h={3} r={1.5} fill="accent" />
      {rowLines.map((w, i) => (
        <Rect key={String(i)} x={5} y={12 + i * 2.5} w={w} h={1.5} r={0.75} fill="muted" />
      ))}
    </>
  )
}

// Grid 403:274: two rows of three outlined cells with wide rounded corners, no labels.
function RowGrid() {
  return (
    <>
      {cells.map(([edge], i) => (
        <Rect key={String(i)} x={5.5 + (i % 3) * 20.5} y={i < 3 ? 7.5 : 25} w={12} h={10} r={3.5} fill={edge} />
      ))}
    </>
  )
}

// UI 403:220: a window with a side bar and four rows, each with a green pill.
function RowUi() {
  return (
    <>
      <Rect x={5} y={7} w={12} h={29} r={2} fill="well" />
      {[0, 1, 2, 3].map((i) => {
        const y = 7 + (i * 22) / 3
        return (
          <g key={`row-${String(i)}`}>
            <Rect x={19} y={y} w={39} h={4.5} r={1.5} fill="inset" />
            <Rect x={53.5} y={y + 3} w={3.5} h={2} r={1} fill="green" />
          </g>
        )
      })}
    </>
  )
}

const rowDrawings: Record<ThumbnailKind, () => ReactNode> = { chart: RowChart, diagram: RowDiagram, doc: RowDoc, grid: RowGrid, ui: RowUi }

// The row sizes' boxes. md is 76 × 48 (M1 406:122): the 64 × 40 drawing at
// 1.2, 76.8 wide, centred, so 0.4 of the window bar's ends is cut.
const rowBoxes = { sm: { w: 64, h: 40, scale: 1 }, md: { w: 76, h: 48, scale: 1.2 } } as const

function RowThumbnail({ kind, size, framed, label }: { kind: ThumbnailKind; size: keyof typeof rowBoxes; framed: boolean | undefined; label: string | undefined }) {
  const box = rowBoxes[size]
  const Drawing = rowDrawings[kind]
  const named = label !== undefined && label.trim() !== ''
  return (
    <Root framed={framed} size={size} data-kind={kind} data-shape="compact" data-size={size}>
      <Svg
        viewBox={`0 0 ${String(box.w)} ${String(box.h)}`}
        role={named ? 'img' : undefined}
        aria-label={named ? label : undefined}
        aria-hidden={named ? undefined : true}
        focusable="false"
      >
        <g transform={`translate(${String((box.w - 64 * box.scale) / 2)} 0) scale(${String(box.scale)})`}>
          <rect x={0} y={0} width={64} height={4} className={slots.chrome} />
          {[10.5, 19.5, 28.5].map((cx) => (
            <circle key={String(cx)} cx={cx} cy={2} r={2.5} className={slots.dot} />
          ))}
          <Drawing />
        </g>
      </Svg>
    </Root>
  )
}

/**
 * The preview of an artifact: a window bar and sample content for its
 * kind (`chart`, `diagram`, `doc`, `grid` or `ui`), as on the Artifacts
 * page. `framed` (the default) draws a border and radius for a thumbnail
 * on its own; set it to `false` inside a card that clips.
 *
 * `size` sets the width. `fill` (the default) fills the container's width
 * at `shape`'s ratio, with the card's drawing. `sm` is the 64 × 40 preview
 * at the start of a desktop artifact row and `md` the 76 × 48 one of a
 * phone row; both draw each kind's row drawing (a grid of six round-cornered
 * cells, a window with a side bar and rows), not the card's drawing
 * scaled down, and ignore `shape`. `lg` is 128 wide at `shape`'s ratio
 * with the card's drawing, 128 × 72 with `shape="wide"`, as the desktop
 * list view and search results draw it.
 */
export function Thumbnail({ kind = 'doc', shape = 'wide', framed, size, label, reference }: ThumbnailProps) {
  if (size === 'sm' || size === 'md') return <RowThumbnail kind={kind} size={size} framed={framed} label={label} />
  const width = widths[shape]
  const Drawing = drawings[kind]
  const named = label !== undefined && label.trim() !== ''
  return (
    <Root framed={framed} size={size} data-kind={kind} data-shape={shape}>
      <Svg
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        role={named ? 'img' : undefined}
        aria-label={named ? label : undefined}
        aria-hidden={named ? undefined : true}
        focusable="false"
      >
        <rect x={0} y={0} width={width} height={17} className={slots.chrome} />
        {[10.5, 19.5, 28.5].map((cx) => (
          <circle key={String(cx)} cx={cx} cy={8.5} r={2.5} className={slots.dot} />
        ))}
        <g transform={`translate(${String((width - 334) / 2)} 0)`}>
          <Drawing />
        </g>
      </Svg>
      {kind === 'chart' && reference !== undefined ? <ChartReference width={width} reference={reference} /> : null}
    </Root>
  )
}
