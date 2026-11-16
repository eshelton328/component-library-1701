import type { ComponentProps } from 'react'
import { styled } from '../../styled-system/jsx'
import {
  layoutGrid,
  layoutInline,
  layoutStack,
  type LayoutGridVariantProps,
  type LayoutInlineVariantProps,
  type LayoutStackVariantProps,
} from '../../styled-system/recipes'

const StyledStack = styled('div', layoutStack)
const StyledInline = styled('div', layoutInline)
const StyledGrid = styled('div', layoutGrid)

/** The props of a div, plus `gap` (a spacing token) and `align`. */
export type StackProps = ComponentProps<'div'> & LayoutStackVariantProps
/** The props of a div, plus `gap`, `align`, `justify` and `wrap`. */
export type InlineProps = ComponentProps<'div'> & LayoutInlineVariantProps
/** The props of a div, plus `gap` and `columns` (1 to 6). */
export type GridProps = ComponentProps<'div'> & LayoutGridVariantProps

/** Places its children one under the other, `gap` apart. */
export function Stack(props: StackProps) {
  return <StyledStack {...props} />
}

/** Places its children in a row, `gap` apart; `wrap` lets them wrap. */
export function Inline(props: InlineProps) {
  return <StyledInline {...props} />
}

/** Places its children in `columns` equal columns, `gap` apart. */
export function Grid(props: GridProps) {
  return <StyledGrid {...props} />
}
