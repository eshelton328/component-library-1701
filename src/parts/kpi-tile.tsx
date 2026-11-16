import { createSlotRecipeContext } from '../../styled-system/jsx'
import { kpiTile } from '../../styled-system/recipes'
import { TruncatedText } from '../controls/tooltip'

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
 * bordered tile. Each stays on one line; a long one ends with an ellipsis
 * and shows in full in a tooltip. The caller formats the value and places
 * the tiles, for example in a `Grid`.
 */
export function KpiTile({ label, value, caption }: KpiTileProps) {
  return (
    <Root>
      <Label>
        <TruncatedText>{label}</TruncatedText>
      </Label>
      <Value>
        <TruncatedText>{value}</TruncatedText>
      </Value>
      {caption === undefined || caption === '' ? null : (
        <Caption>
          <TruncatedText>{caption}</TruncatedText>
        </Caption>
      )}
    </Root>
  )
}
