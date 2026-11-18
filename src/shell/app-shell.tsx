import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { appShell, type AppShellVariantProps } from '../../styled-system/recipes'
import { editable } from '../controls/editable'
import type { Scalar } from '../controls/scalar'
import { Backdrop } from './backdrop'
import { shown } from './shown'

const { withProvider, withContext } = createSlotRecipeContext(appShell)
const Root = withProvider('div', 'root')
const Rail = withContext('div', 'rail')
const List = withContext('div', 'list')
const Detail = withContext('main', 'detail')
const Side = withContext('aside', 'side')
const TabBar = withContext('div', 'tabBar')
const SafeArea = withContext('div', 'safeArea')


// The custom properties that the recipe's root reads: the visible height and the visible area's top.
const visibleHeight = '--app-shell-visible-height'
const visibleTop = '--app-shell-visible-top'

/**
 * Keeps the shell inside the visual viewport when the browser does not resize the layout for the on-screen
 * keyboard. Chrome on Android with `interactive-widget=resizes-content` shrinks the layout viewport itself, so the
 * visual viewport stays as tall as the layout (`documentElement.clientHeight`) and nothing is set. iOS Safari
 * only shrinks `visualViewport` and may pan it down (`offsetTop`); then the root gets the visible height and top
 * as two custom properties, the measured runtime values, which the recipe turns into `max-height` and
 * `margin-top`. A zoom (`scale` above 1) shrinks the visual viewport's CSS height by the scale too, so the
 * keyboard-free part of the screen is `height * scale` CSS px: a pinch zoom with no keyboard gives the layout's
 * height and sets nothing, and Safari's focus zoom on a field under 16 px (the Composer's 14) keeps the fit while
 * the keyboard is open. The fit applies only while an editable field (`editable`: a textarea, a text-like input or
 * a contenteditable element) has the focus, the keyboard case: the browser's top and bottom bars also shrink the
 * visual viewport as they show and hide on a scroll, and following them would move the page under the user's
 * finger. With no focused field both properties are removed, and the shell keeps the stable height its parent
 * gives it. A `focusin` on a field starts the fit at once. When the focus leaves the fields (to a button, or to
 * nowhere on a blur), the fit stays until the next visualViewport `resize` or `scroll`, the keyboard closing: a
 * tap on the composer's Send takes the focus on its press, and if the shell grew then, the button would move
 * from under the finger before the click and the tap would miss it. A `focusout` whose `relatedTarget` is
 * another field keeps the fit too, so moving from one field to another never drops it. Without `visualViewport` (an
 * old browser, or no window when rendered on the server) nothing changes: the hook reads the window only in its
 * effect.
 */
function useVisualViewportFit(): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const viewport = window.visualViewport
    const root = ref.current
    if (!viewport || !root) return
    // The shell's top in the layout, kept between measures. At scale 1 it is `offsetTop`, where Safari panned the
    // visible area. Under a zoom `offsetTop` also holds the zoom's own pan inside that area, so following it would
    // push the shell's foot (the composer) below the screen. The zoom pans over a page that stays put, so the top
    // stays where the last scale-1 measure put it, moved only as far as needed for the shell to cover the visible
    // area (`offsetTop` to `offsetTop + height`), so no page shows above or below it.
    let top = 0
    // Whether a field that opens the keyboard has the focus; only then does the shell follow the visual viewport.
    let typing = editable(document.activeElement)
    const fit = () => {
      const layout = document.documentElement.clientHeight
      const visible = viewport.height * viewport.scale
      if (viewport.scale === 1) top = viewport.offsetTop
      // A field has the focus and the visible area is more than a pixel of rounding smaller: a keyboard covers the
      // layout. With no focused field it is the browser's bars, which the shell does not follow.
      if (typing && layout - visible > 1) {
        top = Math.min(Math.max(top, viewport.offsetTop + viewport.height - visible), viewport.offsetTop)
        root.style.setProperty(visibleHeight, `${String(visible)}px`)
        root.style.setProperty(visibleTop, `${String(top)}px`)
      } else {
        root.style.removeProperty(visibleHeight)
        root.style.removeProperty(visibleTop)
      }
    }
    // A field takes the focus: the fit starts at once. Another element taking it fits nothing here.
    const focusIn = () => {
      typing = editable(document.activeElement)
      if (typing) fit()
    }
    // During a focusout the focus is on no element yet; `relatedTarget` is the element that takes it next, if any.
    // Only `typing` changes, and nothing is fitted: the fit stays as it is, the leaving state, until the next
    // viewport event (the keyboard closing) fits with `typing` false and removes it. So a press that takes the
    // focus from the field (Send) lands where it started, and a move to another field never drops the fit.
    const focusOut = (event: FocusEvent) => {
      typing = editable(event.relatedTarget instanceof Element ? event.relatedTarget : null)
    }
    fit()
    viewport.addEventListener('resize', fit)
    viewport.addEventListener('scroll', fit)
    document.addEventListener('focusin', focusIn)
    document.addEventListener('focusout', focusOut)
    return () => {
      viewport.removeEventListener('resize', fit)
      viewport.removeEventListener('scroll', fit)
      document.removeEventListener('focusin', focusIn)
      document.removeEventListener('focusout', focusOut)
      root.style.removeProperty(visibleHeight)
      root.style.removeProperty(visibleTop)
    }
  }, [])
  return ref
}

export type AppShellProps = Scalar<AppShellVariantProps> & {
  /** The desktop nav rail. Shown only at `size="desktop"`. */
  rail?: ReactNode
  /** The list pane, such as the Inbox list or the Workbench sidebar. */
  list?: ReactNode
  /** The detail pane: the open item. It takes the rest of the width and scrolls. */
  detail?: ReactNode
  /** The side panel, such as the side chat. Shown only at `size="desktop"`; on a tablet or phone, open it as a bottom sheet. */
  side?: ReactNode
  /** The tablet and phone tab bar. Not shown at `size="desktop"`. */
  tabBar?: ReactNode
  /** On a tablet or phone, which pane fills the screen: `list` (the default) or `detail`. With no list, the detail shows. */
  view?: 'list' | 'detail' | undefined
}

/**
 * The frame that pages sit in, on the `Backdrop`. `size` picks the layout,
 * because the library has no breakpoint tokens: `desktop` (the default)
 * places the rail, the list pane, the detail pane and the side panel side
 * by side; `tablet` and `phone` show one pane at a time above the tab bar.
 * `listWidth` is `list` (420, the default) or `sidebar` (330, Workbench);
 * `sideWidth` is `side` (380, the default) or `wide` (420).
 * With no tab bar (inside a chat), a tablet or phone keeps the home
 * indicator's area (`shell.safeAreaBottom`, 34) clear under the pane, so a
 * composer at its foot does not end at the screen's edge.
 * `tabBarOverlay` (a tablet or phone with a tab bar; `false` by default)
 * lays the tab bar over the bottom of the pane, which then runs to the
 * bottom of the shell, as Figma draws the phone pages (Toolkit M02, M20,
 * M22). The pane's scroll ends with the bar's height (`shell.tabBar`) of
 * space, so its last item scrolls clear of the bar, and a `ScrollFrame`
 * that is the pane's own child lifts its footer and the end of its body
 * above the bar. Under the overlay the tab bar slot is filled with
 * `bg.canvas`, so a translucent bar (`surface.chrome`) is opaque over the
 * page and shows the colour it has on the backdrop. The slots bring their
 * own surfaces. It is as tall as its
 * parent, which should fill the screen from its top. When an on-screen
 * keyboard covers the bottom of the page and the browser does not resize
 * the layout for it (iOS Safari, which only shrinks `window.visualViewport`),
 * the shell shrinks to the visible area and moves with it, so a composer at
 * its foot stays above the keyboard. It does so only while a text field has
 * the focus, and after the focus leaves it until the keyboard closes (so a
 * tap on Send lands): otherwise the browser's bars that show and hide on a
 * scroll leave the shell at its parent's height; where the browser resizes the layout
 * (Chrome on Android with `interactive-widget=resizes-content`), or with no
 * `visualViewport`, it keeps its height. The scrolling pane is focusable, so the keyboard can scroll it
 * when it holds only text.
 */
export function AppShell({ size, listWidth, sideWidth, rail, list, detail, side, tabBar, view = 'list', tabBarOverlay = false }: AppShellProps) {
  const fit = useVisualViewportFit()
  const desktop = size === undefined || size === 'desktop'
  if (desktop) {
    return (
      <Backdrop size="desktop">
        <Root ref={fit} size="desktop" listWidth={listWidth} sideWidth={sideWidth}>
          {shown(rail) ? <Rail>{rail}</Rail> : null}
          {shown(list) ? <List>{list}</List> : null}
          <Detail tabIndex={0}>{detail}</Detail>
          {shown(side) ? <Side>{side}</Side> : null}
        </Root>
      </Backdrop>
    )
  }
  const showDetail = view === 'detail' || !shown(list)
  const hasTabBar = shown(tabBar)
  return (
    <Backdrop size={size}>
      <Root ref={fit} size={size} listWidth={listWidth} sideWidth={sideWidth} tabBarOverlay={tabBarOverlay && hasTabBar}>
        {/* Keyed, so the list's state never carries over into the detail. */}
        <Detail key={showDetail ? 'detail' : 'list'} tabIndex={0}>
          {showDetail ? detail : list}
        </Detail>
        {hasTabBar ? <TabBar>{tabBar}</TabBar> : null}
        {hasTabBar ? null : <SafeArea aria-hidden="true" />}
      </Root>
    </Backdrop>
  )
}
