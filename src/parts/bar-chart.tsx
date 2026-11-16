import { createSlotRecipeContext } from '../../styled-system/jsx'
import { groupedBarChart, horizontalBarChart } from '../../styled-system/recipes'
import { TruncatedText } from '../controls/tooltip'

/** The colour of a series or a bar: the accent, grey, or a status colour. */
export type BarTone = 'accent' | 'muted' | 'running' | 'needsYou' | 'done' | 'danger'

// The geometry of Toolkit D20 (chart 482:1932, axis 482:1947), in px.
const BAR = 16
const BAR_GAP = 4
const GROUP_PITCH = 56
const GROUP_PAD = 20
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

const grouped = createSlotRecipeContext(groupedBarChart)
const GroupedRoot = grouped.withProvider('div', 'root')
const GroupedSvg = grouped.withContext('svg', 'svg')
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
}

/**
 * Grouped vertical bars, such as the pass rate with and without a skill in
 * each eval round. The chart is drawn in SVG and hidden from assistive
 * technology; a visually hidden table holds the same data.
 */
export function GroupedBarChart({ label, series, groups, max, formatValue = String }: GroupedBarChartProps) {
  const top = scaleMax(
    max,
    groups.flatMap((g) => g.values),
  )
  const span = series.length * BAR + Math.max(0, series.length - 1) * BAR_GAP
  const pitch = Math.max(GROUP_PITCH, span + GROUP_PAD)
  const width = groups.length * pitch
  const height = PLOT + AXIS_GAP + AXIS
  return (
    <GroupedRoot role="figure" aria-label={label}>
      <GroupedSvg width={width} height={height} viewBox={`0 0 ${String(width)} ${String(height)}`} aria-hidden="true" focusable="false">
        {groups.map((group, g) => {
          const left = g * pitch + (pitch - span) / 2
          return (
            <g key={`${String(g)}:${group.label}`}>
              {series.map((s, i) => {
                const h = (Math.min(finite(group.values[i] ?? 0), top) / top) * PLOT
                return <GroupedBar key={`${String(i)}:${s.name}`} data-tone={s.tone ?? (i === 0 ? 'accent' : 'muted')} x={left + i * (BAR + BAR_GAP)} y={PLOT - h} width={BAR} height={h} />
              })}
              <AxisLabel x={g * pitch + pitch / 2} y={PLOT + AXIS_GAP + AXIS / 2} textAnchor="middle" dominantBaseline="central">
                {group.label}
              </AxisLabel>
            </g>
          )
        })}
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
