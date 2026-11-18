import { useRef, type ReactNode, type TouchEvent } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { scrollFrame, type ScrollFrameVariantProps } from '../../styled-system/recipes'
import { editable } from './editable'
import type { Scalar } from './scalar'

const { withProvider, withContext } = createSlotRecipeContext(scrollFrame)
const Root = withProvider('div', 'root')
const Header = withContext('div', 'header')
const Body = withContext('div', 'body')
const Footer = withContext('div', 'footer')

// How far a press may move, in px, and still be a tap; a press that moves further is a drag of the body.
const dragSlop = 10
// A press on one of these does its own action and leaves the keyboard alone.
const control = 'a, button, input, textarea, select, [role=button], [contenteditable]'
// Blurs the focused element only when it is a text field, so the on-screen keyboard closes; its text stays.
const closeKeyboard = () => {
  const focused = document.activeElement
  if (editable(focused)) focused.blur()
}

type Press = { x: number; y: number; dragged: boolean; onControl: boolean; inField: boolean }

/**
 * On a touch screen (`pointer: coarse`), a user's drag of the body by more than `dragSlop` px, or a tap on it
 * that is not on a control, closes the keyboard of a focused text field (a drag that starts in a text field does not), as a native chat does, so the user can
 * scroll up and read. It reads touch events, never the scroll event, so a scroll from code (an auto-scroll to a
 * new message) never closes it. With a mouse nothing changes.
 */
function useKeyboardClose() {
  const press = useRef<Press | null>(null)
  return {
    onTouchStart: (event: TouchEvent<HTMLDivElement>) => {
      const touch = event.touches[0]
      const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
      press.current =
        event.touches.length === 1 && touch !== undefined && coarse
          ? {
              x: touch.clientX,
              y: touch.clientY,
              dragged: false,
              onControl: event.target instanceof Element && event.target.closest(control) !== null,
              // A drag that starts in a text field scrolls or selects its text, so it keeps the keyboard.
              inField: event.target instanceof Element && editable(event.target.closest('input, textarea, [contenteditable]')),
            }
          : null
    },
    onTouchMove: (event: TouchEvent<HTMLDivElement>) => {
      const start = press.current
      const touch = event.touches[0]
      if (start === null || touch === undefined || start.dragged || start.inField) return
      if (Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > dragSlop) {
        start.dragged = true
        closeKeyboard()
      }
    },
    onTouchEnd: () => {
      const start = press.current
      press.current = null
      if (start !== null && !start.dragged && !start.onControl) closeKeyboard()
    },
    onTouchCancel: () => {
      press.current = null
    },
  }
}

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
 *
 * On a touch screen, a drag of the body by more than 10 px, or a tap on it
 * that is not on a link, button or field, blurs a focused text field (such
 * as the `Composer` in the footer), so the on-screen keyboard closes and the
 * user can scroll up and read. The draft stays, and a tap on the field opens
 * the keyboard again. A scroll from code never closes it; with a mouse
 * nothing changes.
 */
export function ScrollFrame({ header, footer, children, className, bodyClassName, gap, footerShrink }: ScrollFrameProps) {
  const keyboardClose = useKeyboardClose()
  return (
    <Root gap={gap} footerShrink={footerShrink} className={className}>
      {header === undefined ? null : <Header>{header}</Header>}
      <Body tabIndex={0} className={bodyClassName} {...keyboardClose}>
        {children}
      </Body>
      {footer === undefined ? null : <Footer>{footer}</Footer>}
    </Root>
  )
}
