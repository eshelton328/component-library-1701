import { createSlotRecipeContext } from '../../styled-system/jsx'
import { kpiTile } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(kpiTile)
const Root = withProvider('dl', 'root')
const Label = withContext('dt', 'label')
const Value = withContext('dd', 'value')
const Caption = withContext('dd', 'caption')

export type KpiTileProps = {
  /** What the number counts, such as "calls". */
  label: string
  /** The figure, already formatted, such as "330" or "Nov 13". */
  value: string
  /** A line under the label that qualifies the figure, such as "since Oct 31". */
  caption?: string | undefined
}

/**
 * One key figure: a large value, its label and an optional caption, in a
 * bordered tile. The caller formats the value and places the tiles, for
 * example in a `Grid`.
 */
export function KpiTile({ label, value, caption }: KpiTileProps) {
  return (
    <Root>
      <Label>{label}</Label>
      <Value>{value}</Value>
      {caption === undefined || caption === '' ? null : <Caption>{caption}</Caption>}
    </Root>
  )
}
