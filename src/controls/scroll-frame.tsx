import type { ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { scrollFrame, type ScrollFrameVariantProps } from '../../styled-system/recipes'
import type { Scalar } from './scalar'

const { withProvider, withContext } = createSlotRecipeContext(scrollFrame)
const Root = withProvider('div', 'root')
const Header = withContext('div', 'header')
const Body = withContext('div', 'body')
const Footer = withContext('div', 'footer')

export type ScrollFrameProps = Scalar<ScrollFrameVariantProps> & {
  /** Stays at the top while the body scrolls, such as a Back bar. */
  header?: ReactNode
  /** Stays at the bottom while the body scrolls, such as a chat's `Composer`. */
  footer?: ReactNode
  /** The content between the bars; only it scrolls. */
  children?: ReactNode
  /** A class added to the frame's root, after its own, such as the page's padding. */
  className?: string | undefined
  /** A class added to the body, after its own, such as the gap of its content. */
  bodyClassName?: string | undefined
}

/**
 * A page or pane with a header that stays at the top and a footer that
 * stays at the bottom, while only the body between them scrolls (d-107).
 * It fills the height of its parent, which must be a flex column with a
 * bounded height, such as the AppShell detail. The body takes the focus,
 * so the keyboard can scroll it. `gap` sets the space between the three.
 */
export function ScrollFrame({ header, footer, children, className, bodyClassName, gap }: ScrollFrameProps) {
  return (
    <Root gap={gap} className={className}>
      {header === undefined ? null : <Header>{header}</Header>}
      <Body tabIndex={0} className={bodyClassName}>
        {children}
      </Body>
      {footer === undefined ? null : <Footer>{footer}</Footer>}
    </Root>
  )
}
