import { CheckMarkIcon, CrossMarkIcon, type IconProps, type IconSize } from '../foundations/icons'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { glyph } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(glyph)
const Root = withProvider('span', 'root')
const Char = withContext('span', 'char')

/** A symbol that `Glyph` draws: `check` is ✓ (U+2713), `cross` is ✗ (U+2717). */
export type GlyphSymbol = 'check' | 'cross'

const symbols = {
  check: { char: '✓', Icon: CheckMarkIcon },
  cross: { char: '✗', Icon: CrossMarkIcon },
} as const satisfies Record<GlyphSymbol, { char: string; Icon: (props: IconProps) => React.JSX.Element }>

export type GlyphProps = {
  /**
   * The character in the text. `check` draws ✓ (U+2713) as a thin check with
   * a long bowed stroke; `cross` draws ✗ (U+2717) as a slanted, hand-drawn
   * cross, as Figma draws them in text (Toolkit D28 492:2185).
   */
  symbol: GlyphSymbol
  /** The mark's size in px, from the `sizes.icon` tokens: the font size of the text around it. Defaults to `12` (the `small` style). */
  size?: IconSize | undefined
}

/**
 * A symbol character inside a line of text, such as the ✗ and ✓ of "the
 * rule’s ✗ and ✓ examples". The text fonts have neither character, so the
 * glyph keeps the character in the text (a screen reader reads it, a copy
 * and a find in page matches across it, as it stays in the inline text flow)
 * and draws the library's mark in its place, in the colour of the text.
 * Place it inline in the text; it sets no text style.
 */
export function Glyph({ symbol, size = '12' }: GlyphProps) {
  const { char, Icon } = symbols[symbol]
  return (
    <Root data-symbol={symbol}>
      <Icon size={size} />
      <Char>{char}</Char>
    </Root>
  )
}
