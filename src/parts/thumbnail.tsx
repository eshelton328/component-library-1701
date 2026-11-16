import type { ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { thumbnail, type ThumbnailVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'

const { withProvider, withContext } = createSlotRecipeContext(thumbnail)
const Root = withProvider('div', 'root')
const Svg = withContext('svg', 'svg')

/** The kind of sample content a thumbnail draws. */
export type ThumbnailKind = 'chart' | 'diagram' | 'doc' | 'grid' | 'ui'

/**
 * The shape of a thumbnail: `wide` (16:9, the default), `compact` (8:5) or
 * `banner` (2:1). The thumbnail fills its container's width.
 */
export type ThumbnailShape = 'wide' | 'compact' | 'banner'

export type ThumbnailProps = Scalar<ThumbnailVariantProps> & {
  kind?: ThumbnailKind | undefined
  shape?: ThumbnailShape | undefined
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

/**
 * The preview of an artifact: a window bar and sample content for its
 * kind (`chart`, `diagram`, `doc`, `grid` or `ui`), as on the Artifacts
 * page. It fills its container's width at its `shape`'s ratio, so the
 * caller sets the size. `framed` (the default) draws a border and radius
 * for a thumbnail on its own; set it to `false` inside a card that clips.
 */
export function Thumbnail({ kind = 'doc', shape = 'wide', framed, label }: ThumbnailProps) {
  const width = widths[shape]
  const Drawing = drawings[kind]
  const named = label !== undefined && label.trim() !== ''
  return (
    <Root framed={framed} data-kind={kind} data-shape={shape}>
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
    </Root>
  )
}
