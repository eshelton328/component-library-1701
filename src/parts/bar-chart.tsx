import { useLayoutEffect, useRef, useState } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { dailyBarChart, groupedBarChart, horizontalBarChart } from '../../styled-system/recipes'
import { TruncatedText } from '../controls/tooltip'

/** The colour of a series or a bar: the accent, grey, or a status colour. */
export type BarTone = 'accent' | 'muted' | 'running' | 'needsYou' | 'done' | 'danger'

// The geometry of the Toolkit eval chart, in px: a 110 px plot, the axis 8
// under it and 17 high, bars 4 apart in a group (D20 chart 482:1932, axis
// 482:1947). Each size sets the bar width, the narrowest group step and the
// room a group keeps beside its bars: `md` is D20's (16 px bars, a group
// every 56) and `sm` the phone's (M18 482:2602, bars 482:2603 to 482:2616:
// 12 px bars, a group every 44).
const GROUPED_SIZES = {
  md: { bar: 16, pitch: 56, pad: 20 },
  sm: { bar: 12, pitch: 44, pad: 16 },
} as const
const BAR_GAP = 4
const PLOT = 110
const AXIS_GAP = 8
const AXIS = 17

function finite(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}

function scaleMax(max: number | undefined, values: readonly number[]): number {
  if (max !== undefined && Number.isFinite(max) && max > 0) return max
  const largest = Math.max(0, ...values.map(finite))
  return largest > 0 ? largest : 1
}

/**
 * Whether a box scrolls sideways: its content is wider than the box. It
 * updates when the box or its first child changes size (a resize, a new
 * frame, new groups). One pixel of slack: a zoomed page can leave a
 * fractional width.
 */
function useScrollsX<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [scrolls, setScrolls] = useState(false)
  useLayoutEffect(() => {
    const box = ref.current
    if (box === null) return
    const update = () => {
      setScrolls(box.scrollWidth - box.clientWidth > 1)
    }
    update()
    const sizes = new ResizeObserver(update)
    sizes.observe(box)
    if (box.firstElementChild !== null) sizes.observe(box.firstElementChild)
    return () => {
      sizes.disconnect()
    }
  }, [])
  return [ref, scrolls] as const
}

const grouped = createSlotRecipeContext(groupedBarChart)
const GroupedRoot = grouped.withProvider('div', 'root')
const GroupedSvg = grouped.withContext('svg', 'svg')
const GroupedGroup = grouped.withContext('svg', 'group')
const GroupedBar = grouped.withContext('rect', 'bar')
const AxisLabel = grouped.withContext('text', 'axisLabel')
const Data = grouped.withContext('div', 'data')

export type BarSeries = {
  /** The series name, read in the data table, such as "with the skill". */
  name: string
  /** The bar colour. Defaults to `accent` for the first series and `muted` for the others. */
  tone?: BarTone | undefined
}

export type BarGroup = {
  /** The axis label under the group, such as "r1". */
  label: string
  /** One value for each series, in the order of `series`. */
  values: readonly number[]
}

export type GroupedBarChartProps = {
  /** The accessible name of the chart, such as "Opus pass rate by round". */
  label: string
  /** The series, one bar in each group. */
  series: readonly BarSeries[]
  /** The groups, left to right. */
  groups: readonly BarGroup[]
  /** The value of a full-height bar. Defaults to the largest value. */
  max?: number | undefined
  /** Writes a value in the data table. Defaults to the number as it is. */
  formatValue?: ((value: number) => string) | undefined
  /**
   * The bar size. `md` (the default) draws 16 px bars with a group every
   * 56 px, as the desktop and tablet Figma frames; `sm` draws 12 px bars
   * with a group every 44 px, as the phone frame. Bars are 4 px apart in
   * both.
   */
  size?: 'md' | 'sm' | undefined
  /**
   * How wide the chart is. `content` (the default) is as wide as its
   * groups at the size's group step (7 groups: 392 px at `md`, 308 at
   * `sm`). `fill` spreads the groups over the width of the chart's box,
   * one equal slot each with the bars and the axis label centred in it,
   * as the tablet frame spreads 7 groups over 630 px; the bars keep their
   * size. In a box narrower than the `content` width, `fill` keeps that
   * width and the chart scrolls sideways.
   */
  width?: 'content' | 'fill' | undefined
}

/**
 * Grouped vertical bars, such as the pass rate with and without a skill in
 * each eval round. The chart is drawn in SVG and hidden from assistive
 * technology; a visually hidden table holds the same data. In a box
 * narrower than its content the chart scrolls sideways, and only then is
 * it a tab stop with a focus ring, named by `label`, so the arrow keys
 * scroll it.
 */
export function GroupedBarChart({ label, series, groups, max, formatValue = String, size = 'md', width = 'content' }: GroupedBarChartProps) {
  const top = scaleMax(
    max,
    groups.flatMap((g) => g.values),
  )
  const { bar, pitch: step, pad } = GROUPED_SIZES[size]
  const span = series.length * bar + Math.max(0, series.length - 1) * BAR_GAP
  const pitch = Math.max(step, span + pad)
  const contentWidth = groups.length * pitch
  const height = PLOT + AXIS_GAP + AXIS
  const [rootRef, scrolls] = useScrollsX<HTMLDivElement>()
  return (
    // A chart that scrolls takes the focus, so the keyboard can scroll it (axe scrollable-region-focusable); one
    // that fits is no tab stop.
    <GroupedRoot ref={rootRef} role="figure" aria-label={label} width={width} tabIndex={scrolls ? 0 : undefined}>
      {/* No viewBox: one user unit is one CSS px, so with `fill` the SVG grows
          past its content width and each group sits at its share of it. */}
      <GroupedSvg width={contentWidth} height={height} aria-hidden="true" focusable="false">
        {groups.map((group, g) => (
          // Each group is drawn around the centre of its equal slot.
          <GroupedGroup key={`${String(g)}:${group.label}`} x={`${String(((g + 0.5) * 100) / groups.length)}%`}>
            {series.map((s, i) => {
              const h = (Math.min(finite(group.values[i] ?? 0), top) / top) * PLOT
              return <GroupedBar key={`${String(i)}:${s.name}`} data-tone={s.tone ?? (i === 0 ? 'accent' : 'muted')} x={i * (bar + BAR_GAP) - span / 2} y={PLOT - h} width={bar} height={h} />
            })}
            <AxisLabel x={0} y={PLOT + AXIS_GAP + AXIS / 2} textAnchor="middle" dominantBaseline="central">
              {group.label}
            </AxisLabel>
          </GroupedGroup>
        ))}
      </GroupedSvg>
      <Data>
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <td />
              {series.map((s, i) => (
                <th key={`${String(i)}:${s.name}`} scope="col">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group, g) => (
              <tr key={`${String(g)}:${group.label}`}>
                <th scope="row">{group.label}</th>
                {series.map((s, i) => {
                  const value = group.values[i]
                  return <td key={`${String(i)}:${s.name}`}>{value === undefined ? '' : formatValue(value)}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Data>
    </GroupedRoot>
  )
}

const horizontal = createSlotRecipeContext(horizontalBarChart)
const HorizontalRoot = horizontal.withProvider('ul', 'root')
const Row = horizontal.withContext('li', 'row')
const RowLabel = horizontal.withContext('span', 'label')
const Track = horizontal.withContext('span', 'track')
const HorizontalSvg = horizontal.withContext('svg', 'svg')
const HorizontalBar = horizontal.withContext('rect', 'bar')
const Value = horizontal.withContext('span', 'value')
const Room = horizontal.withContext('span', 'room')

export type BarRow = {
  /** The row label, such as a day or a folder. */
  label: string
  /** The value; the bar length is its share of `max`. */
  value: number
}

export type HorizontalBarChartProps = {
  /** The accessible name of the chart, such as "Calls per day". */
  label: string
  /** The rows, top to bottom. */
  rows: readonly BarRow[]
  /** The value of a full-length bar. Defaults to the largest value. */
  max?: number | undefined
  /** The bar colour. Defaults to `accent`. */
  tone?: BarTone | undefined
  /** Writes a value after its bar. Defaults to the number as it is. */
  formatValue?: ((value: number) => string) | undefined
}

/**
 * Horizontal bars: a label, a bar and its value on each row, such as the
 * calls of a skill on each day. A list, so a screen reader reads each label
 * with its value; the bars are hidden from it.
 */
export function HorizontalBarChart({ label, rows, max, tone = 'accent', formatValue = String }: HorizontalBarChartProps) {
  const top = scaleMax(
    max,
    rows.map((r) => r.value),
  )
  return (
    <HorizontalRoot aria-label={label}>
      {rows.map((row, r) => {
        const share = Math.min(finite(row.value), top) / top
        const percent = `${String(Math.round(share * 10000) / 100)}%`
        return (
          <Row key={`${String(r)}:${row.label}`}>
            <RowLabel>
              <TruncatedText>{row.label}</TruncatedText>
            </RowLabel>
            <Track>
              <HorizontalSvg width={percent} data-filled={share > 0 ? '' : undefined} aria-hidden="true" focusable="false">
                {share > 0 ? <HorizontalBar data-tone={tone} x="0" y="0" width="100%" height="100%" /> : null}
              </HorizontalSvg>
              <Value>{formatValue(row.value)}</Value>
            </Track>
            <Room aria-hidden="true">{formatValue(row.value)}</Room>
          </Row>
        )
      })}
    </HorizontalRoot>
  )
}

// The geometry of Toolkit D17 "calls per day" (bars 444:592), in px: a
// 78 px plot whose tallest bar is 64 px, standing on a 1 px baseline. Each
// day takes an equal slot, and a bar fills 26 of every 40.93 px of it, so
// the first bar starts at the left edge and the last ends at the right.
const DAY_PLOT = 78
const DAY_TALLEST = 64
const DAY_BASELINE = 1
const DAY_BAR_SHARE = 26 / (614 / 15)
// A bar above 0 is at least 2 px tall, as Figma draws 44 of 1777 (444:595).
const DAY_MIN_BAR = 2
// The bar is drawn this much below the baseline, where the plot clips it,
// so only its top corners show the radii.xs rounding.
const DAY_RADIUS = 4

const daily = createSlotRecipeContext(dailyBarChart)
const DailyRoot = daily.withProvider('div', 'root')
const Legend = daily.withContext('div', 'legend')
const Swatch = daily.withContext('span', 'swatch')
const LegendName = daily.withContext('span', 'name')
const LegendMax = daily.withContext('span', 'max')
const DailySvg = daily.withContext('svg', 'svg')
const DailyBarRect = daily.withContext('rect', 'bar')
const Baseline = daily.withContext('rect', 'baseline')
const Axis = daily.withContext('div', 'axis')
const DailyAxisLabel = daily.withContext('span', 'axisLabel')
const DailyData = daily.withContext('div', 'data')

export type DailyBar = {
  /** The day, unique in the chart, such as "2026-11-09". `highlight` names a day by it. */
  date: string
  /** The value of the day, such as its number of calls. */
  value: number
  /** The day as the axis and the data table write it, such as "Nov 9". Defaults to `date`. */
  label?: string | undefined
}

/** Which days the axis under the bars names: the first and last, those and the middle one, or none. */
export type DailyAxisLabels = 'ends' | 'endsAndMiddle' | 'none'

export type DailyBarChartProps = {
  /** The accessible name of the chart, such as "Headless runs per day". */
  label: string
  /** The days, oldest first, one bar each. A day with no value is a 0. */
  data: readonly DailyBar[]
  /** The value of a full-height bar. Defaults to the largest value. */
  max?: number | undefined
  /** The unit of a value, read as the data table's column header, such as "calls". Defaults to "value". */
  valueLabel?: string | undefined
  /** The `date` of the day to mark, such as today or the selected day. */
  highlight?: string | undefined
  /** The bar colour. Defaults to `accent`. */
  tone?: BarTone | undefined
  /** The series name shown above the bars with its colour and "max N", such as "Headless runs". No legend when absent. */
  legend?: string | undefined
  /** The days the axis names. Defaults to `ends`; `none` when charts stacked above one another share the axis of the last. */
  axisLabels?: DailyAxisLabels | undefined
  /** Writes a value in the legend and the data table. Defaults to the number as it is. */
  formatValue?: ((value: number) => string) | undefined
}

function axisDays(data: readonly DailyBar[], axisLabels: DailyAxisLabels): DailyBar[] {
  const first = data[0]
  const last = data[data.length - 1]
  if (axisLabels === 'none' || first === undefined || last === undefined) return []
  if (data.length === 1) return [first]
  const middle = data[Math.floor((data.length - 1) / 2)]
  if (axisLabels === 'endsAndMiddle' && middle !== undefined && data.length > 2) return [first, middle, last]
  return [first, last]
}

/**
 * Vertical bars, one per day, such as the toolkit calls on each of the last
 * 16 days. The bars fill the width they are given. The chart is drawn in SVG
 * and hidden from assistive technology; a visually hidden table holds the
 * same data and marks the highlighted day as the current date.
 */
export function DailyBarChart({
  label,
  data,
  max,
  valueLabel = 'value',
  highlight,
  tone = 'accent',
  legend,
  axisLabels = 'ends',
  formatValue = String,
}: DailyBarChartProps) {
  const top = scaleMax(
    max,
    data.map((d) => d.value),
  )
  const plot = DAY_PLOT - DAY_BASELINE
  const pitch = 100 / Math.max(1, data.length - 1 + DAY_BAR_SHARE)
  const percent = (n: number) => `${String(Math.round(n * 1000) / 1000)}%`
  return (
    <DailyRoot role="figure" aria-label={label}>
      {legend === undefined ? null : (
        <Legend>
          <Swatch data-tone={tone} />
          <LegendName>
            <TruncatedText>{legend}</TruncatedText>
          </LegendName>
          <LegendMax>max {formatValue(top)}</LegendMax>
        </Legend>
      )}
      <DailySvg width="100%" height={DAY_PLOT} aria-hidden="true" focusable="false">
        {data.map((day, i) => {
          const share = Math.min(finite(day.value), top) / top
          const highlighted = day.date === highlight
          // A day at 0 draws no bar, unless it is highlighted: then an empty
          // 2 px outline on the baseline carries the ring, so the mark still shows.
          if (share <= 0 && !highlighted) return null
          const h = share > 0 ? Math.max(DAY_MIN_BAR, Math.round(share * DAY_TALLEST)) : DAY_MIN_BAR
          return (
            <DailyBarRect
              key={day.date}
              data-tone={tone}
              data-highlighted={highlighted ? '' : undefined}
              data-empty={share > 0 ? undefined : ''}
              x={percent(i * pitch)}
              y={plot - h}
              width={percent(pitch * DAY_BAR_SHARE)}
              height={h + DAY_RADIUS}
            />
          )
        })}
        <Baseline x="0" y={plot} width="100%" height={DAY_BASELINE} />
      </DailySvg>
      {axisLabels === 'none' ? null : (
        <Axis aria-hidden="true">
          {axisDays(data, axisLabels).map((day) => (
            <DailyAxisLabel key={day.date}>{day.label ?? day.date}</DailyAxisLabel>
          ))}
        </Axis>
      )}
      <DailyData>
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">day</th>
              <th scope="col">{valueLabel}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((day) => (
              <tr key={day.date} aria-current={day.date === highlight ? 'date' : undefined}>
                <th scope="row">{day.label ?? day.date}</th>
                <td>{formatValue(day.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DailyData>
    </DailyRoot>
  )
}
