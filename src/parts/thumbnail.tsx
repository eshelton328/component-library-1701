import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { thumbnail, type ThumbnailVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'

const { withProvider, withContext } = createSlotRecipeContext(thumbnail)
const Root = withProvider('div', 'root')
const Svg = withContext('svg', 'svg')
const Dots = withContext('svg', 'dots')
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

/**
 * The colour of one artifact's preview: `accent` (cyan, the default),
 * `violet`, `amber` or `green`, as the Artifacts page colours each preview
 * (D1: the Agent factory doc green 402:15656, the Type safety doc violet
 * 402:15716, the readme cold-reader chart amber 402:15776).
 */
export type ThumbnailTone = 'accent' | 'violet' | 'amber' | 'green'

export type ThumbnailProps = Scalar<ThumbnailVariantProps> & {
  kind?: ThumbnailKind | undefined
  shape?: ThumbnailShape | undefined
  /**
   * With `kind="chart"`, a dashed line across the plot at `value` with its
   * label in mono above the line's end, both in the needs-you colour (the
   * Artifacts page's D9 median line, 452:3705 and 452:3706). The label is
   * text, unscaled, so it keeps the mono size at any width; when there is
   * no room above the line, it is drawn under it. Other kinds and
   * the row sizes (`sm`, `md`) ignore it; without it nothing is drawn.
   */
  reference?: ThumbnailReference | undefined
  /**
   * The preview's colour. `doc` draws its title bar in the tone and its
   * first chip in the tone's tint; `chart` draws its title bar and its main
   * bars in the tone, and every third bar stays violet. At the row sizes
   * (`sm`, `md`) the doc's title bar and the chart's title bar and main bars
   * take the tone too. `diagram`, `grid` and `ui` draw their own fixed
   * colours and ignore it. Without it the preview draws in `accent`, as before.
   */
  tone?: ThumbnailTone | undefined
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

type Fill = 'muted' | 'title' | 'well' | 'inset' | 'accent' | 'violet' | 'amber' | 'green' | 'accentTint' | 'violetTint' | 'amberTint' | 'greenTint' | 'accentEdge' | 'violetEdge' | 'amberEdge' | 'greenEdge'

// The class of each fill slot, from the generated recipe.
const slots = thumbnail()

// Each tone's solid fill and its tint, slots of the recipe.
const tones: Record<ThumbnailTone, { solid: Fill; tint: Fill }> = {
  accent: { solid: 'accent', tint: 'accentTint' },
  violet: { solid: 'violet', tint: 'violetTint' },
  amber: { solid: 'amber', tint: 'amberTint' },
  green: { solid: 'green', tint: 'greenTint' },
}

// `width` is the drawing's viewBox width (`widths[shape]`); only the chart,
// laid out on the whole width, reads it.
type DrawingProps = { tone: ThumbnailTone; width: number }

function Rect({ x, y, w, h, r = 2, fill }: { x: number; y: number; w: number; h: number; r?: number; fill: Fill }) {
  const edged = fill.endsWith('Edge')
  return <rect x={x} y={y} width={w} height={h} rx={r} className={slots[fill]} strokeWidth={edged ? 1 : undefined} vectorEffect={edged ? 'non-scaling-stroke' : undefined} />
}

// The chart's plot, in the viewBox of a drawing `width` wide. Figma scales
// the chart with the thumbnail's width, not with the 334-wide content the
// other kinds centre: at every width from 334 to 748 (D1 402:15450, T1
// 405:183, M1 407:991, M2 406:406, T2 405:466, D2 403:498) the axis starts
// 8 % of the width in and is 84 % of it wide (D2: 60 and 628 of 748). The
// nine bars split the axis into ninths, each bar 0.64 of its ninth wide,
// the first 2 % of the axis from its start, so the last ends 2 % short of
// its end (D2: 72.56 and 630.782, 44.658 wide). The title bar starts at the
// axis and is 33.6 % of the width wide (D2 251.2, T2 239.2, D1 112); its
// height follows the height, 4 % of it (D2 14.96 of 374, T2 16 of 400),
// where D1 draws 8 of 188.
const chartPlot = (width: number) => {
  const start = width * 0.08
  const axis = width * 0.84
  return { start, axis, end: start + axis, pitch: axis / 9, bar: (axis / 9) * 0.64, first: start + axis * 0.02 }
}

// Chart 402:15435: a title bar, nine bars on a baseline, every third violet.
const bars = [95.354, 65.876, 103.593, 47.916, 107.205, 38.774, 105.949, 57.34, 99.909]
function Chart({ tone, width }: DrawingProps) {
  const { solid } = tones[tone]
  const p = chartPlot(width)
  return (
    <>
      <Rect x={p.start} y={32} w={width * 0.336} h={7.52} fill={solid} />
      <g data-bars="">
        {bars.map((h, i) => (
          <Rect key={String(i)} x={p.first + i * p.pitch} y={169 - h} w={p.bar} h={h} fill={i % 3 === 2 ? 'violet' : solid} />
        ))}
      </g>
      <Rect x={p.start} y={169} w={p.axis} h={1} r={0} fill="muted" />
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
function Doc({ tone }: DrawingProps) {
  const { solid, tint } = tones[tone]
  return (
    <>
      <Rect x={27} y={32} w={154} h={10} fill={solid} />
      {lines.map((w, i) => (
        <Rect key={String(i)} x={27} y={54 + i * 12} w={w} h={5} fill="muted" />
      ))}
      <Rect x={27} y={142} w={84} h={21.6} r={4} fill={tint} />
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

const drawings: Record<ThumbnailKind, (props: DrawingProps) => ReactNode> = { chart: Chart, diagram: Diagram, doc: Doc, grid: Grid, ui: Ui }

// The chart's value axis: 0 on the baseline (169) and 100 at y 45, 124
// above it, where 71 lands at Figma's D9 median line (452:3705, 161.4 of
// the 374-high banner, 81 of 188). The plot runs from the baseline's start
// to its end (`chartPlot`).
const plot = { base: 169, span: 124 }
const percent = (n: number) => `${String(n * 100)}%`

// The line and label are drawn in an SVG with no viewBox over the drawing,
// placed in percentages of the box, so the label's text and the dash are
// not scaled with the drawing. The label sits above the line's end; when
// the box above the line is shorter than the label and its gap (a small
// thumbnail with a value near 100), it moves under the line, so it stays
// inside the thumbnail while the line stays at the value.
function ChartReference({ width, reference }: { width: number; reference: ThumbnailReference }) {
  const value = Math.min(100, Math.max(0, reference.value))
  const { start, axis } = chartPlot(width)
  const y = (plot.base - (plot.span * value) / 100) / height
  const x = start / width
  const w = axis / width
  const above = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const [below, setBelow] = useState(false)
  useLayoutEffect(() => {
    const box = above.current
    if (box === null) return
    const place = () => {
      const text = label.current
      if (text === null) return
      const style = getComputedStyle(text)
      const gap = Math.max(parseFloat(style.marginTop), parseFloat(style.marginBottom))
      setBelow(box.clientHeight < text.offsetHeight + gap)
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(box)
    return () => {
      observer.disconnect()
    }
  }, [])
  const text = <ReferenceLabel ref={label}>{reference.label}</ReferenceLabel>
  return (
    <Reference data-reference="">
      <foreignObject x={percent(x)} y="0" width={percent(w)} height={percent(y)}>
        <ReferenceBox ref={above}>
          {below ? null : text}
          <ReferenceLine aria-hidden />
        </ReferenceBox>
      </foreignObject>
      {below ? (
        <foreignObject x={percent(x)} y={percent(y)} width={percent(w)} height={percent(1 - y)}>
          <ReferenceBox data-placement="below">{text}</ReferenceBox>
        </foreignObject>
      ) : null}
    </Reference>
  )
}

// The row drawings, on Figma's 64 × 40 row preview (D2 403:194 and its
// siblings): each kind drawn for its size, with no labels, as the card
// drawing scaled down would cut its shapes to slivers. The values are read
// from the saved frame at 1:1.

// Chart 403:194: a title bar, nine bars on a baseline, every third violet.
const rowBars = [10, 23, 9, 22, 13, 21, 17, 20, 20]
function RowChart({ tone }: DrawingProps) {
  const { solid } = tones[tone]
  return (
    <>
      <Rect x={5} y={7} w={21} h={3} r={1.5} fill={solid} />
      <g data-bars="">
        {rowBars.map((h, i) => (
          <Rect key={String(i)} x={6 + i * 6} y={36 - h} w={4} h={h} r={1} fill={i % 3 === 2 ? 'violet' : solid} />
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
function RowDoc({ tone }: DrawingProps) {
  return (
    <>
      <Rect x={5} y={7} w={29} h={3} r={1.5} fill={tones[tone].solid} />
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

const rowDrawings: Record<ThumbnailKind, (props: DrawingProps) => ReactNode> = { chart: RowChart, diagram: RowDiagram, doc: RowDoc, grid: RowGrid, ui: RowUi }

// The phone row drawings, on Figma's 76 × 48 row preview (M1 406:122 to
// 406:278): drawn for the phone, with a 76-wide top bar and no window dots,
// and larger shapes than the desktop drawing. Figma gives each layer's place
// inside the 1 px frame border, so each x and y here is Figma's plus 1, as
// in the desktop drawings. A radius larger than half a shape's height is
// drawn at half its height, as Figma and CSS clamp it.

// Chart 406:122: a title bar (406:124), nine bars on a baseline (406:125 to
// 406:133), every third violet, and the baseline (406:134).
const phoneBars = [11.454, 27.777, 10.987, 27.206, 15.737, 25.411, 20.025, 22.511, 23.565]
function PhoneChart({ tone }: DrawingProps) {
  const { solid } = tones[tone]
  return (
    <>
      <Rect x={6} y={8} w={25.6} h={3} r={1.5} fill={solid} />
      <g data-bars="">
        {phoneBars.map((h, i) => (
          <Rect key={String(i)} x={7.28 + i * 7.11} y={43 - h} w={4.551} h={h} fill={i % 3 === 2 ? 'violet' : solid} />
        ))}
      </g>
      <Rect x={6} y={43} w={64} h={1} r={0} fill="muted" />
    </>
  )
}

// Diagram 406:176: one line (406:178) under four violet-edged nodes
// (406:179 to 406:182).
const phoneNodes = [
  [11.12, 16.75],
  [32.88, 12.2],
  [32.88, 27.25],
  [54.64, 19.55],
] as const
function PhoneDiagram() {
  return (
    <>
      <Rect x={18.8} y={20.25} w={16} h={1.5} r={0} fill="muted" />
      {phoneNodes.map(([x, y]) => (
        <Rect key={`${String(x)}-${String(y)}`} x={x} y={y} w={12.8} h={8.4} r={3} fill="violetEdge" />
      ))}
    </>
  )
}

// Doc 414:799 (and 406:221; 406:259 in green): a title bar (414:801) and
// seven text lines (414:802 to 414:808), 3.12 apart; no chips.
const phoneLines = [60.8, 60.8, 38.4, 60.8, 60.8, 38.4, 60.8]
function PhoneDoc({ tone }: DrawingProps) {
  return (
    <>
      <Rect x={6} y={8} w={35.2} h={3} r={1.5} fill={tones[tone].solid} />
      {phoneLines.map((w, i) => (
        <Rect key={String(i)} x={6} y={13.76 + i * 3.12} w={w} h={2} r={1} fill="muted" />
      ))}
    </>
  )
}

// Grid 406:204 (and 406:240): two rows of three outlined cells, 18.667 ×
// 15.5 with radius 3 (406:206 to 406:211), no labels.
function PhoneGrid() {
  return (
    <>
      {cells.map(([edge], i) => (
        <Rect key={String(i)} x={6 + (i % 3) * 22.665} y={i < 3 ? 8 : 27.5} w={18.667} h={15.5} r={3} fill={edge} />
      ))}
    </>
  )
}

// UI 406:149: a side bar (406:151) and four rows (406:152 to 406:158), each
// with a green pill (406:153 to 406:159).
function PhoneUi() {
  return (
    <>
      <Rect x={6} y={8} w={14.08} h={35} r={3} fill="well" />
      {[0, 1, 2, 3].map((i) => {
        const y = 8 + i * 8.75
        return (
          <g key={`row-${String(i)}`}>
            <Rect x={22.64} y={y} w={47.36} h={5.75} r={2.875} fill="inset" />
            <Rect x={63.6} y={y + 3} w={3.84} h={2.4} r={1.2} fill="green" />
          </g>
        )
      })}
    </>
  )
}

const phoneDrawings: Record<ThumbnailKind, (props: DrawingProps) => ReactNode> = { chart: PhoneChart, diagram: PhoneDiagram, doc: PhoneDoc, grid: PhoneGrid, ui: PhoneUi }

// The row sizes: sm is the desktop row's 64 × 40 (D2 403:194) with its
// window dots, md the phone row's 76 × 48 (M1 406:122) with none.
const rowBoxes = {
  sm: { w: 64, h: 40, dots: [10.5, 19.5, 28.5], drawings: rowDrawings },
  md: { w: 76, h: 48, dots: [], drawings: phoneDrawings },
} as const

function RowThumbnail({ kind, tone, size, framed, label }: { kind: ThumbnailKind; tone: ThumbnailTone; size: keyof typeof rowBoxes; framed: boolean | undefined; label: string | undefined }) {
  const box = rowBoxes[size]
  const Drawing = box.drawings[kind]
  const dots: readonly number[] = box.dots
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
        <g>
          <rect x={0} y={0} width={box.w} height={4} className={slots.chrome} />
          {dots.map((cx) => (
            <circle key={String(cx)} cx={cx} cy={2} r={2.5} className={slots.dot} />
          ))}
          <Drawing tone={tone} width={box.w} />
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
 * at the start of a desktop artifact row, with the window bar's three
 * dots, and `md` the 76 × 48 one of a phone row, drawn for the phone: a top
 * bar with no dots and larger shapes. Both draw each kind's row drawing (a
 * grid of six round-cornered cells, a window with a side bar and rows), not
 * the card's drawing scaled down, and ignore `shape`. `lg` is 128 wide at `shape`'s ratio
 * with the card's drawing, 128 × 72 with `shape="wide"`, as the desktop
 * list view and search results draw it.
 *
 * `tone` colours one artifact's preview: the doc's title bar and the
 * chart's title bar and main bars (see `ThumbnailTone`). *
 * At `fill` and `lg` the window bar scales with the width, but its three
 * dots stay 5 px, 9 apart, at x 8, 17 and 26, as Figma draws them at every
 * width; and the chart lays its plot out on the whole width (its axis 8 %
 * in from each side), so it keeps Figma's proportions at any width.
 */
export function Thumbnail({ kind = 'doc', shape = 'wide', tone = 'accent', framed, size, label, reference }: ThumbnailProps) {
  if (size === 'sm' || size === 'md') return <RowThumbnail kind={kind} tone={tone} size={size} framed={framed} label={label} />
  const width = widths[shape]
  const Drawing = drawings[kind]
  // The chart is laid out on the whole width (`chartPlot`); the other kinds
  // centre their 334-wide content.
  const offset = kind === 'chart' ? 0 : (width - 334) / 2
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
        <g transform={`translate(${String(offset)} 0)`}>
          <Drawing tone={tone} width={width} />
        </g>
      </Svg>
      {/* The window dots keep Figma's 5 px at x 8, 17 and 26 (403:485 to
          403:487, 405:453, 406:393, 402:15437) at any width, so they are
          drawn in an SVG with no viewBox over the drawing: cx and r are CSS
          px, cy the bar's middle as a percentage of the height (8.5 of 188). */}
      <Dots aria-hidden focusable="false">
        {[10.5, 19.5, 28.5].map((cx) => (
          <circle key={String(cx)} cx={cx} cy={percent(8.5 / height)} r={2.5} className={slots.dot} />
        ))}
      </Dots>
      {kind === 'chart' && reference !== undefined ? <ChartReference width={width} reference={reference} /> : null}
    </Root>
  )
}
