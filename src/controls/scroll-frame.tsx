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
  /** Stays at the bottom while the body scrolls, such as a chat's `Composer`. It keeps its height unless the frame is too short for it (see `footerShrink`). */
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
 * The footer keeps its height; only a footer taller than the room the header
 * leaves shrinks and scrolls inside, unless `footerShrink` is `false`.
 * `footerShrink` sets what gives way when the frame is shorter than its
 * header and footer: `true` (the default) shrinks the footer to the room the
 * header leaves and scrolls it inside, so it never reaches past the frame;
 * `false` keeps the footer at its own height and only the body shrinks, for
 * a footer that caps its own height, such as a `Composer` with
 * `layout="inline"` in a pane that can be resized short. The footer then
 * reaches past the frame when even the body's 0 px is not enough.
 *
 * As the direct child of an `AppShell` detail with `tabBarOverlay`, the
 * frame reaches under the tab bar and lifts its footer and the end of its
 * body above it. `--scroll-frame-inset` holds that bottom offset (the
 * bar's height there, `0px` anywhere else). A sticky element inside the
 * body, such as a Start button kept at its foot, uses it as its offset,
 * `bottom: 'var(--scroll-frame-inset, 0px)'`, so it sticks above the bar;
 * the body's end spacer keeps its last line above that element.
 */
export function ScrollFrame({ header, footer, children, className, bodyClassName, gap, footerShrink }: ScrollFrameProps) {
  return (
    <Root gap={gap} footerShrink={footerShrink} className={className}>
      {header === undefined ? null : <Header>{header}</Header>}
      <Body tabIndex={0} className={bodyClassName}>
        {children}
      </Body>
      {footer === undefined ? null : <Footer>{footer}</Footer>}
    </Root>
  )
}
