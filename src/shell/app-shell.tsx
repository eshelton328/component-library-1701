import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { appShell, type AppShellVariantProps } from '../../styled-system/recipes'
import { editable } from '../controls/editable'
import { useInputModality } from '../controls/input-modality'
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


// The custom property that the recipes read: how far the on-screen keyboard covers the bottom of the detail, in px.
const keyboardInset = '--app-shell-keyboard'
// How long the fit stays after the focus leaves the fields with no pointer down (the keyboard's Done, the iOS form
// bar's check, a blur from code) when no viewport event ends it first. iOS animates the keyboard away in 250 ms and
// reports the visual viewport's resize during it, so 300 lets that resize come first and end the fit in step with
// the keyboard. Only an iOS standalone app that reports the resize late, in steps or never needs the timer.
const blurEndDelay = 300

/**
 * Docks the foot of the page on the on-screen keyboard (the fit) when the browser does not resize the layout for
 * it. Chrome on Android with `interactive-widget=resizes-content` shrinks the layout viewport itself, so the
 * visual viewport stays as tall as the layout (`documentElement.clientHeight`) and nothing is set. iOS Safari
 * only shrinks `visualViewport` and may pan it down (`offsetTop`); the keyboard's top is then the visible area's
 * bottom, and the root gets `--app-shell-keyboard`, the measured runtime value of how far the keyboard covers the
 * detail's bottom. The shell keeps its full height and nothing in the layout moves: the detail ends its scroll that
 * far up, and a `ScrollFrame` that is its child moves its footer onto the keyboard with `translateY` and ends its
 * body's view above it (the recipes), while the tab bar or the safe area stays under the keyboard. A zoom (`scale` above 1) shrinks the visual viewport's CSS height by the scale too, so the
 * keyboard-free part of the screen is `height * scale` CSS px: a pinch zoom with no keyboard gives the layout's
 * height and sets nothing, and Safari's focus zoom on a field under 16 px (the Composer's 14) keeps the fit while
 * the keyboard is open. The fit applies only while an editable field (`editable`: a textarea, a text-like input or
 * a contenteditable element) has the focus, the keyboard case: the browser's top and bottom bars also shrink the
 * visual viewport as they show and hide on a scroll, and following them would move the page under the user's
 * finger. With no focused field the property is removed. A `focusin` on a field starts the fit at once. When the focus leaves the fields (to a button, or to
 * nowhere on a blur), the fit stays until the next visualViewport `resize` or `scroll`, the keyboard closing: a
 * tap on the composer's Send takes the focus on its press, and if the dock fell then, the button would move
 * from under the finger before the click and the tap would miss it. With no such event the fit ends on its own,
 * as iOS standalone may grow the visual viewport late, in steps or never: one frame after the release of the press
 * that took the focus (`pointerup` or `pointercancel`, after its click), or 300 ms after a focusout with no pointer
 * down (the keyboard's Done, a blur from code); a field taking the focus first cancels it. An end that comes while a
 * pointer is down (a press on Send within the 300 ms) waits for that press's release and one frame, so its click
 * lands on the button before the dock falls. A `focusout` whose
 * `relatedTarget` is another field keeps the fit too, so moving from one field to another never drops it. The
 * window's `resize`,
 * `orientationchange` and `pageshow` (a page back from the back-forward cache) and the document's
 * `visibilitychange` (an installed app back on screen) count as such an event: they read the focus again and fit,
 * so a fit that no focused field needs is dropped there too, and a stale small visual viewport with no field
 * focused docks nothing. Every fit also checks that a field still has the focus (`document.activeElement`),
 * not only the flag the focus events keep: WebKit fires no `focusout` when the focused field is removed from the
 * page (a route change, or a closed dialog), so the flag alone would keep the dock following the visual viewport,
 * and a later shrink with no field focused would lift the page's foot for nothing. A route change is not
 * visible to the library; the removed field counts as not focused at the next event, which drops the fit.
 * Without `visualViewport` (an old browser, or no window when rendered on the server) nothing changes: the hook
 * reads the window only in its effect.
 */
function useVisualViewportFit(): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const viewport = window.visualViewport
    const root = ref.current
    if (!viewport || !root) return
    // The visible area's top in the layout, kept between measures. At scale 1 it is `offsetTop`, where Safari panned
    // it. Under a zoom `offsetTop` also holds the zoom's own pan inside that area, so following it would
    // put the keyboard's top, and the composer, below the screen. The zoom pans over a page that stays put, so the
    // top stays where the last scale-1 measure put it, moved only as far as needed for the keyboard-free area to
    // cover the visible area (`offsetTop` to `offsetTop + height`).
    let top = 0
    // Whether a field that opens the keyboard has the focus; only then does the shell follow the visual viewport.
    let typing = editable(document.activeElement)
    // Shows a keyboard `inset` px tall at the layout's foot: the property is how far it covers the detail.
    const show = (inset: number) => {
      const detail = root.querySelector(':scope > .app-shell__detail')
      const keyboardTop = document.documentElement.clientHeight - inset
      const covered = detail === null ? 0 : Math.max(0, detail.getBoundingClientRect().bottom - keyboardTop)
      if (covered > 0) root.style.setProperty(keyboardInset, `${String(covered)}px`)
      else root.style.removeProperty(keyboardInset)
    }
    const fit = () => {
      // A field removed while it had the focus fires no focusout in WebKit: the focus is then on the body, and the
      // fit must not stay on for it.
      if (!editable(document.activeElement)) typing = false
      const layout = document.documentElement.clientHeight
      const visible = viewport.height * viewport.scale
      if (viewport.scale === 1) top = viewport.offsetTop
      // A field has the focus and the visible area is more than a pixel of rounding smaller: a keyboard covers the
      // layout. With no focused field it is the browser's bars, which the shell does not follow.
      if (typing && layout - visible > 1) {
        top = Math.min(Math.max(top, viewport.offsetTop + viewport.height - visible), viewport.offsetTop)
        show(layout - top - visible)
      } else {
        show(0)
      }
    }
    // A field takes the focus: the fit starts at once. Another element taking it fits nothing here.
    const focusIn = () => {
      typing = editable(document.activeElement)
      if (!typing) return
      cancelEnd()
      fit()
    }
    // During a focusout the focus is on no element yet; `relatedTarget` is the element that takes it next, if any.
    // Only `typing` changes, and nothing is fitted: the fit stays as it is, the leaving state, until the next
    // viewport event (the keyboard closing, or a `refit` event) fits with `typing` false and removes it. So a press
    // that takes the focus from the field (Send) lands where it started, and a move to another field never drops
    // the fit.
    const focusOut = (event: FocusEvent) => {
      typing = editable(event.relatedTarget instanceof Element ? event.relatedTarget : null)
      if (!typing) scheduleEnd()
    }
    // The end of the fit after the focus left the fields, when the browser reports no viewport change (iOS standalone
    // may grow the visual viewport late, in steps, or not at all). With a pointer down at the focusout (the press
    // on Send), it comes one frame after that press's release (`pointerup` or `pointercancel`), so the press's
    // `click` lands on the button where it started first. With no pointer down, it comes after `blurEndDelay`; if a
    // press is down by then, it waits for that press's release and a frame the same way. The first viewport or
    // window event before then ends the fit at once, as a real change of the screen, and a field taking the focus
    // cancels the end. If the viewport is still short then, no fit starts again: with no field focused it is the
    // bars.
    let pressing = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let frame: number | undefined
    const press = () => {
      pressing = true
    }
    const release = () => {
      pressing = false
    }
    // An end that comes while a pointer is down (a press that started after a blur, within `blurEndDelay`) waits
    // for that press's release and one frame more, as the press path does, so the shell does not grow under the
    // finger before the click.
    const end = () => {
      cancelEnd()
      if (pressing) waitForRelease()
      else if (!editable(document.activeElement)) refit()
    }
    const waitForRelease = () => {
      document.addEventListener('pointerup', afterRelease)
      document.addEventListener('pointercancel', afterRelease)
    }
    const afterRelease = () => {
      document.removeEventListener('pointerup', afterRelease)
      document.removeEventListener('pointercancel', afterRelease)
      frame = requestAnimationFrame(end)
    }
    const cancelEnd = () => {
      if (timer !== undefined) clearTimeout(timer)
      if (frame !== undefined) cancelAnimationFrame(frame)
      timer = undefined
      frame = undefined
      document.removeEventListener('pointerup', afterRelease)
      document.removeEventListener('pointercancel', afterRelease)
    }
    const scheduleEnd = () => {
      cancelEnd()
      if (pressing) waitForRelease()
      else timer = setTimeout(end, blurEndDelay)
    }
    // The window resizes or turns, the page comes back from the back-forward cache, or the installed app comes
    // back on screen: these may change the viewport with no visualViewport event, and they end a tap, so they
    // read the focus again and fit. A fit that no focused field needs is dropped, and one a field needs is measured
    // again.
    const refit = () => {
      typing = editable(document.activeElement)
      fit()
    }
    fit()
    viewport.addEventListener('resize', fit)
    viewport.addEventListener('scroll', fit)
    document.addEventListener('focusin', focusIn)
    document.addEventListener('focusout', focusOut)
    document.addEventListener('pointerdown', press, true)
    document.addEventListener('pointerup', release, true)
    document.addEventListener('pointercancel', release, true)
    document.addEventListener('visibilitychange', refit)
    window.addEventListener('resize', refit)
    window.addEventListener('orientationchange', refit)
    window.addEventListener('pageshow', refit)
    return () => {
      viewport.removeEventListener('resize', fit)
      viewport.removeEventListener('scroll', fit)
      document.removeEventListener('focusin', focusIn)
      document.removeEventListener('focusout', focusOut)
      document.removeEventListener('pointerdown', press, true)
      document.removeEventListener('pointerup', release, true)
      document.removeEventListener('pointercancel', release, true)
      document.removeEventListener('visibilitychange', refit)
      cancelEnd()
      window.removeEventListener('resize', refit)
      window.removeEventListener('orientationchange', refit)
      window.removeEventListener('pageshow', refit)
      root.style.removeProperty(keyboardInset)
    }
  }, [])
  return ref
}

export type AppShellProps = Scalar<AppShellVariantProps> & {
  /** The desktop nav rail. Shown only at `size="desktop"`. */
  rail?: ReactNode
  /** The list pane, such as the Inbox list or the Workbench sidebar. */
  list?: ReactNode
  /** The detail pane: the open item. It takes the rest of the width and scrolls, with no scroll bar. */
  detail?: ReactNode
  /** The side panel, such as the side chat. Shown only at `size="desktop"`; on a tablet or phone, open it as a bottom sheet. */
  side?: ReactNode
  /** The tablet and phone tab bar. Not shown at `size="desktop"`. */
  tabBar?: ReactNode
  /** On a tablet or phone, which pane fills the screen: `list` (the default) or `detail`. With no list, the detail shows. */
  view?: 'list' | 'detail' | undefined
}

/**
 * The frame that pages sit in, on the `Backdrop`. It starts the input
 * tracker (`useInputModality`), so a page's own block under `focusRing`
 * hides its ring after a pointer press. `size` picks the layout,
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
 * M22). The pane's scroll ends with the bar's height (`shell.tabBar`, or
 * more where the device's home-indicator inset is more than
 * `shell.safeAreaBottom`) of space, so its last item scrolls clear of the bar, and a `ScrollFrame`
 * that is the pane's own child lifts its footer and the end of its body
 * above the bar. Under the overlay the tab bar slot is filled with
 * `bg.canvas`, so a translucent bar (`surface.chrome`) is opaque over the
 * page and shows the colour it has on the backdrop. The slots bring their
 * own surfaces. It is as tall as its
 * parent, which should fill the screen from its top. When an on-screen
 * keyboard covers the bottom of the page and the browser does not resize
 * the layout for it (iOS Safari, which only shrinks `window.visualViewport`),
 * the shell keeps its height and a `ScrollFrame` in the detail moves its
 * footer (a composer) up onto the keyboard, while the tab bar or the safe
 * area stays under it. It does so only while a text field has
 * the focus, and after the focus leaves it until the keyboard closes, the
 * tap that took the focus ends or 300 ms pass (so a tap on Send lands):
 * otherwise the browser's bars that show and hide on a
 * scroll move nothing; where the browser resizes the layout
 * (Chrome on Android with `interactive-widget=resizes-content`), or with no
 * `visualViewport`, nothing docks. The scrolling pane is focusable, so the keyboard can scroll it
 * when it holds only text. It draws no scroll bar, and a scroll that reaches its end stops there and does not move
 * the page (the shared `scrollArea` style); a wheel, a trackpad, a touch drag and the keys still scroll it.
 */
export function AppShell({ size, listWidth, sideWidth, rail, list, detail, side, tabBar, view = 'list', tabBarOverlay = false }: AppShellProps) {
  useInputModality()
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
