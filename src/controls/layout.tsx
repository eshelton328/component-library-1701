import type { ComponentProps } from 'react'
import { styled } from '../../styled-system/jsx'
import {
  layoutChatColumn,
  layoutContainer,
  layoutGrid,
  layoutInline,
  layoutStack,
  type LayoutChatColumnVariantProps,
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
const StyledChatColumn = styled('div', layoutChatColumn)

/** The props of a div, plus `gap` (a spacing token) and `align`. */
export type StackProps = ComponentProps<'div'> & Scalar<LayoutStackVariantProps>
/** The props of a div, plus `gap`, `align`, `justify` and `wrap`. */
export type InlineProps = ComponentProps<'div'> & Scalar<LayoutInlineVariantProps>
/** The props of a div, plus `gap` and `columns` (1 to 6). */
export type GridProps = ComponentProps<'div'> & Scalar<LayoutGridVariantProps>

/** The props of a div, plus `size` (desktop, tablet, phone or detail) and `gap`. */
export type ContainerProps = ComponentProps<'div'> & Scalar<LayoutContainerVariantProps>

/** The props of a div, plus `gap`. */
export type ChatColumnProps = ComponentProps<'div'> & Scalar<LayoutChatColumnVariantProps>

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
 * `detail` pads as `desktop` does and keeps the content at most 748 px
 * wide (`shell.detail`), at the start of its parent: the Inbox task column.
 * Inside an `AppShell` detail at least 1600 px wide (`shell.detailWideFrom`),
 * `detail` keeps the content at most 1024 px wide (`shell.detailWide`), in the
 * middle of its parent.
 */
export function Container(props: ContainerProps) {
  return <StyledContainer {...props} />
}

/**
 * A chat's column: its messages, its empty state or its reply box. It
 * fills its parent up to 1076 px (`shell.thread`) and sits in the middle
 * of a wider parent, so a reply box in its own `ChatColumn` lines up with
 * the messages above it. Its children stack, `gap` apart (0 by default).
 */
export function ChatColumn(props: ChatColumnProps) {
  return <StyledChatColumn {...props} />
}
