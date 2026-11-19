import { createSlotRecipeContext } from '../../styled-system/jsx'
import { kpiTile } from '../../styled-system/recipes'
import { Clamp, type ClampProps } from '../controls/clamp'
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
  /**
   * How many lines the caption may take. `1` (the default) keeps it on one line: a long one ends with an
   * ellipsis and shows in full in a tooltip. `2` or more wraps it, so a caption a little wider than the tile
   * shows whole on a second line, as Figma shows the whole caption (Toolkit T23 491:8077, D12 445:227); a
   * caption longer than those lines ends with an ellipsis on the last one, with no tooltip. The tile grows by
   * one `small` line (16 px) for each line the caption takes.
   */
  captionLines?: ClampProps['lines']
}

/**
 * One key figure: a large value, its label and an optional caption, in a
 * bordered tile. Each stays on one line; a long one ends with an ellipsis
 * and shows in full in a tooltip. With `captionLines` the caption wraps
 * onto that many lines instead. The caller formats the value and places
 * the tiles, for example in a `Grid`.
 */
export function KpiTile({ label, value, caption, captionLines = 1 }: KpiTileProps) {
  return (
    <Root>
      <Label>
        <TruncatedText>{label}</TruncatedText>
      </Label>
      <Value>
        <TruncatedText>{value}</TruncatedText>
      </Value>
      {caption === undefined || caption === '' ? null : (
        <Caption>{captionLines === 1 ? <TruncatedText>{caption}</TruncatedText> : <Clamp lines={captionLines}>{caption}</Clamp>}</Caption>
      )}
    </Root>
  )
}
