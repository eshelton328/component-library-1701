import type { ComponentProps } from 'react'
import { styled } from '../../styled-system/jsx'
import {
  layoutContainer,
  layoutGrid,
  layoutInline,
  layoutStack,
  type LayoutContainerVariantProps,
  type LayoutGridVariantProps,
  type LayoutInlineVariantProps,
  type LayoutStackVariantProps,
} from '../../styled-system/recipes'
import type { Scalar } from './scalar'

const StyledStack = styled('div', layoutStack)
const StyledInline = styled('div', layoutInline)
const StyledGrid = styled('div', layoutGrid)
const StyledContainer = styled('div', layoutContainer)

/** The props of a div, plus `gap` (a spacing token) and `align`. */
export type StackProps = ComponentProps<'div'> & Scalar<LayoutStackVariantProps>
/** The props of a div, plus `gap`, `align`, `justify` and `wrap`. */
export type InlineProps = ComponentProps<'div'> & Scalar<LayoutInlineVariantProps>
/** The props of a div, plus `gap` and `columns` (1 to 6). */
export type GridProps = ComponentProps<'div'> & Scalar<LayoutGridVariantProps>

/** The props of a div, plus `size` (desktop, tablet or phone) and `gap`. */
export type ContainerProps = ComponentProps<'div'> & Scalar<LayoutContainerVariantProps>

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

/**
 * Pads a page's content for the frame size: `desktop` (the default),
 * `tablet` or `phone`. Its children stack, `gap` apart (0 by default).
 * The library has no breakpoint tokens, so the page picks `size`.
 */
export function Container(props: ContainerProps) {
  return <StyledContainer {...props} />
}
