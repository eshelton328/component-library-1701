import { Children, Fragment, isValidElement, useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { appShell, type AppShellVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'
import { Backdrop } from './backdrop'

const { withProvider, withContext } = createSlotRecipeContext(appShell)
const Root = withProvider('div', 'root')
const Rail = withContext('div', 'rail')
const List = withContext('div', 'list')
const Detail = withContext('main', 'detail')
const Side = withContext('aside', 'side')
const TabBar = withContext('div', 'tabBar')
const SafeArea = withContext('div', 'safeArea')

// A slot that renders nothing is left out: `false`, `null`, `''`, an empty
// array, or a fragment of those.
const shown = (node: ReactNode): boolean =>
  Children.toArray(node).some((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment ? shown(child.props.children) : child !== '',
  )

// The custom properties that the recipe's root reads: the visible height and the visible area's top.
const visibleHeight = '--app-shell-visible-height'
const visibleTop = '--app-shell-visible-top'

/**
 * Keeps the shell inside the visual viewport when the browser does not resize the layout for the on-screen
 * keyboard. Chrome on Android with `interactive-widget=resizes-content` shrinks the layout viewport itself, so the
 * visual viewport stays as tall as the layout (`documentElement.clientHeight`) and nothing is set. iOS Safari
 * only shrinks `visualViewport` and may pan it down (`offsetTop`); then the root gets the visible height and top
 * as two custom properties, the measured runtime values, which the recipe turns into `max-height` and
 * `margin-top`. A pinch zoom (`scale` not 1) also shrinks the visual viewport, but the page must not shrink with
 * it, so it is left alone. Without `visualViewport` (an old browser, or no window when rendered on the server)
 * nothing changes: the hook reads the window only in its effect.
 */
function useVisualViewportFit(): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const viewport = window.visualViewport
    const root = ref.current
    if (!viewport || !root) return
    const fit = () => {
      const layout = document.documentElement.clientHeight
      // More than a pixel of rounding smaller, at no zoom: a keyboard (or other browser chrome) covers the layout.
      if (viewport.scale === 1 && layout - viewport.height > 1) {
        root.style.setProperty(visibleHeight, `${String(viewport.height)}px`)
        root.style.setProperty(visibleTop, `${String(viewport.offsetTop)}px`)
      } else {
        root.style.removeProperty(visibleHeight)
        root.style.removeProperty(visibleTop)
      }
    }
    fit()
    viewport.addEventListener('resize', fit)
    viewport.addEventListener('scroll', fit)
    return () => {
      viewport.removeEventListener('resize', fit)
      viewport.removeEventListener('scroll', fit)
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
 * its foot stays above the keyboard; where the browser resizes the layout
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
