import { type ReactNode, type RefObject, useEffect, useInsertionEffect, useRef } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { appShell, type AppShellVariantProps } from '../../styled-system/recipes'
import { token } from '../../styled-system/tokens'
import { editable } from '../controls/editable'
import { useInputModality } from '../controls/input-modality'
import type { Scalar } from '../controls/scalar'
import { Backdrop } from './backdrop'
import { cssCubicBezier, cssDuration, cssPx } from './css-values'
import { keyboardMeasures } from './keyboard-measures'
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
// The dock moves as the iOS keyboard does: `durations.keyboard` (250ms) on `easings.keyboard`, a curve close to
// UIKit's keyboard curve (cubic-bezier(0.38, 0.7, 0.125, 1)). The hook moves it frame by frame, so it reads both
// tokens as numbers, through strict readers that throw on a form they do not know (audit L-2).
const keyboardMotion = cssDuration(token('durations.keyboard'))
// The time fraction of a move up to which a new target keeps the move's end.
const keepEndUntil = 0.7
// The most time between two keyboard reports, in ms, for a keyboard that moves frame by frame: three of the frames
// the dock measured in its last move, at least 50 (three at 60 Hz) and at most 150. On a device whose frames are slow
// (60 ms on a loaded CI runner) the reports of such a keyboard come further apart than 50 ms, and a new move for each
// left the dock under the keyboard after it stopped. A single report 152 ms after the focus (the Workbench trace of
// screen review R25) still is not one.
const keyboardStepGap = 50
const keyboardStepGapMax = 150
// One frame at 60 Hz, and the time after a move's start past which its first frame is late (two frames), in ms.
const keyboardFrame = 1000 / 60
const keyboardFrameLate = 2 * keyboardFrame
// The frames a layout must stay short during an opening before the shell takes it as a browser that resizes it.
const layoutFrames = 2
// The largest keyboard step, in px, that the dock follows within its move, or at once after it: a frame's step of a
// keyboard near its end.
const keyboardFollow = 2
const keyboardCurve = cssCubicBezier(token('easings.keyboard'))
// The keyboard a field is expected to open before the browser reports it: the last one measured in that
// orientation, and on a first portrait open the iOS keyboard with Safari's form bar that Figma draws,
// `sizes.shell.keyboard` (380 on the 844 screen, Workbench M10 147:97). A landscape keyboard has no Figma frame, so
// the dock waits for its measure.
const figmaKeyboard = cssPx(token('sizes.shell.keyboard'))
// How long after a field takes the focus the dock waits for the keyboard's measure; with none by then, no on-screen
// keyboard opened (a hardware keyboard), and the dock follows the visual viewport as it is.
const keyboardWait = 1000
// A tap outside the focused field closes the keyboard and does nothing else: its click is swallowed if it comes
// within `tapClickWait` of the release (a click follows its release at once), and at the latest `tapClickWait` after
// the press, so a later tap is never eaten. A drag that scrolls ends in a pointercancel and no click.
const tapClickWait = 100
const tapPressWait = 1000
// Inside one of these, a tap keeps the keyboard and does its own action: Send, attach, a search's sort or filter.
const keyboardKeep = '[data-keyboard-keep]'
const fieldSelector = 'input, textarea, [contenteditable]'

// The curve's progress at the time fraction `t`: the bezier's y where its x is `t`, found by bisection.
const bezier = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3
const ease = (t: number) => {
  const [x1, y1, x2, y2] = keyboardCurve
  let low = 0
  let high = 1
  for (let i = 0; i < 24; i += 1) {
    const mid = (low + high) / 2
    if (bezier(x1, x2, mid) < t) low = mid
    else high = mid
  }
  return bezier(y1, y2, (low + high) / 2)
}
const media = (query: string) => typeof window.matchMedia === 'function' && window.matchMedia(query).matches
// Whether the page has had a user's press (`navigator.userActivation.hasBeenActive`); true where the browser does not
// say. iOS opens no keyboard for a focus that no press started, so a page that loads with its composer focused
// (the-bridge's Workspaces chat, autofocused) has none until the user taps: a guess there drew the footer 346 px up for
// the settle's second with no keyboard (the iPad mini in the iOS 26.5 Simulator, beta.98, `LoadFocus`).
const pressedBefore = () => {
  const activation: unknown = Reflect.get(navigator, 'userActivation')
  if (typeof activation !== 'object' || activation === null) return true
  return Reflect.get(activation, 'hasBeenActive') !== false
}
// Whether a field's focus will open an on-screen keyboard that only the visual viewport reports: a touch screen whose
// browser has no VirtualKeyboard API (iOS Safari), on a page the user has pressed. Chromium has the API and resizes
// the layout with `interactive-widget=resizes-content`, so it expects nothing.
const keyboardExpected = () => media('(pointer: coarse)') && Reflect.get(navigator, 'virtualKeyboard') === undefined && pressedBefore()

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
 * visible to the library; the removed field counts as not focused at the next event, which drops the fit. Without `visualViewport` (an old browser, or no window when rendered on the server)
 * nothing changes: the hook reads the window only in its effect.
 */
function useVisualViewportFit(diagnostic: RefObject<((diagnostic: AppShellDiagnostic) => void) | undefined>): RefObject<HTMLDivElement | null> {
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
    // A field focused before this effect ran (a page that focuses its composer as it mounts, R23) is taken by the
    // focus path below, as if its focus came now. On a page with no press yet (a load with an autofocused field) no
    // keyboard opens, so that path expects none and only a reported keyboard docks (`keyboardExpected`).
    let typing = false
    // A field in a ScrollFrame footer docks only where that ScrollFrame is the detail's direct child: the recipes read
    // the keyboard there and reset it deeper down. A page that nests the frame deeper loses the dock with no other
    // sign, so the first such field that a keyboard covers is named once in the console (screen reviews R20, R21).
    let warned = false
    const warnUndocked = (detail: Element) => {
      const field = document.activeElement
      const frame = field?.closest('.scroll-frame__footer')?.closest('.scroll-frame__root')
      if (warned || !frame || frame.parentElement === detail || !detail.contains(frame)) return
      warned = true
      const message =
        'AppShell: the focused field is in the footer of a ScrollFrame that is not the detail\'s direct child, so it does not dock on the keyboard. Render that ScrollFrame as the detail.'
      // With `onDiagnostic` the app reports it (the-bridge's report(), audit L-8); without it, the console names it.
      const report = diagnostic.current
      if (report === undefined) console.warn(message, frame)
      else report({ code: 'undocked-field', message })
    }
    // Paints a keyboard `inset` px tall at the layout's foot: the property is how far it covers the detail.
    const paint = (inset: number) => {
      const detail = root.querySelector(':scope > .app-shell__detail')
      const keyboardTop = document.documentElement.clientHeight - inset
      // The detail's foot where it is with the document at its top: iOS scrolls the document as it reports the
      // keyboard, and `keepTop` takes it back, so a paint between the two must not read the scrolled place (the 9 px
      // step in the iPhone trace of screen review R25).
      // Only at scale 1, where `keepTop` takes that scroll back: under a zoom the user scrolls the document, and the
      // detail's foot is where it is (Codex review of #263).
      const scrolled = viewport.scale === 1 ? window.scrollY : 0
      const covered = detail === null ? 0 : Math.max(0, detail.getBoundingClientRect().bottom + scrolled - keyboardTop)
      // A docked thread (the ScrollFrame body that is the detail's child) keeps the line above the composer where it
      // is through the whole move, as in the Claude iOS app (screen review R22): a body at its end before this frame
      // stays at its end, and any other body scrolls by as much as its view shrinks or grows.
      // A body that holds the focused field is left to the browser, which keeps that field in view (Codex review of
      // #210): a form that fits its body would otherwise be pinned to its end, past the field.
      // Only a field (`editable`) counts: a tap on the thread that closes the keyboard gives the focus to the body
      // itself (its `tabIndex` 0), and a body skipped then lost the reader's place by the rest of the fall (the-bridge's
      // iPhone probe: 211 px on each open and close, `TapClosesKeyboard`).
      const focused = document.activeElement
      const field = editable(focused) ? focused : null
      const bodies = [...root.querySelectorAll(':scope > .app-shell__detail > .scroll-frame__root > .scroll-frame__body')]
        .filter((body) => field === null || !body.contains(field))
        .map((body) => ({ body, atEnd: body.scrollHeight - body.scrollTop - body.clientHeight <= 1, view: body.clientHeight, top: body.scrollTop }))
      // No keyboard docks nothing, even where the detail's foot lies below the layout's (a parent taller than the
      // screen).
      if (inset > 0 && covered > 0) root.style.setProperty(keyboardInset, `${String(covered)}px`)
      else root.style.removeProperty(keyboardInset)
      // The move is added to the scroll position read before the change: a view that grows has the browser clamp
      // `scrollTop` first, and adding to that would jump the thread (Codex review of #216).
      for (const { body, atEnd, view, top } of bodies) {
        if (atEnd) body.scrollTop = body.scrollHeight
        else if (body.clientHeight !== view) body.scrollTop = top + view - body.clientHeight
      }
      if (inset > 0 && covered > 0 && detail !== null) warnUndocked(detail)
    }
    // The dock moves to a new inset on the keyboard's curve over `keyboardMotion`, from where it is; a new target
    // during a move starts a new move from there. With reduced motion it is there at once.
    let shown = 0
    let target = 0
    let from = 0
    let origin = 0
    // When the last target came, and the direction of its step, for `keyboardStepGap`.
    let lastTargetAt = Number.NEGATIVE_INFINITY
    let lastDirection = 0
    let lastQuick = false
    // Until when a report in the same direction as a frame step is one too, at any gap (see `stepping`).
    let stepUntil = Number.NEGATIVE_INFINITY
    // When the dock's last frame of a move was drawn, and the time between its last two frames, for `keyboardStepGap`.
    let lastFrameAt = Number.NEGATIVE_INFINITY
    let frameGap = 0
    let start = 0
    let motion: number | undefined
    // Whether the move's next frame is its first, for `keyboardFrameLate`.
    let firstFrame = false
    // The clock is read here, not from the frame's timestamp, which can be earlier than the move's start, so the first
    // frame already moves.
    const step = () => {
      // iOS draws no frame of the page for 100 ms or more after a field's focus (the iPhone traces of screen review
      // R26: the first frame at +97 ms, at 30 fps). A move whose clock started at the focus was then 79 % done in its
      // first drawn frame, a jump. When the first frame of a move comes more than `keyboardFrameLate` after its start,
      // the move starts there, one 60 Hz frame back, so that frame shows the curve's first step.
      const drawn = performance.now()
      if (Number.isFinite(lastFrameAt)) frameGap = drawn - lastFrameAt
      lastFrameAt = drawn
      if (firstFrame) {
        firstFrame = false
        const at = performance.now()
        if (at - start > keyboardFrameLate) {
          start = at - keyboardFrame
          root.dataset.keyboardEnd = String(start + keyboardMotion)
        }
      }
      const t = Math.min(1, Math.max(0, (performance.now() - start) / keyboardMotion))
      shown = t === 1 ? target : from + (target - from) * ease(t)
      paint(shown)
      motion = t === 1 ? undefined : requestAnimationFrame(step)
    }
    const show = (inset: number) => {
      // The same inset again, as after a route change or a window resize, is painted again for the new layout.
      if (inset === target) {
        if (motion === undefined) paint(inset)
        return
      }
      const previous = target
      target = inset
      if (media('(prefers-reduced-motion: reduce)')) {
        if (motion !== undefined) cancelAnimationFrame(motion)
        motion = undefined
        shown = inset
        paint(inset)
        return
      }
      // A new target during a move keeps that move's end and curve: the rest of the curve takes the dock from where it
      // is to the new target, so a keyboard reported in the move makes one motion, not two (screen review R22). Late in
      // a move (past `keepEndUntil` of its time) the rest is too short for a change, so a new move starts.
      // A target back past where the move began (a reopen while the dock comes down, or a close after a correction)
      // starts a new move; a target on the same side of that place is a correction of this move. The place is kept in
      // `origin`: `from` is recomputed by a correction and can lie anywhere (Codex review of #236).
      const now = performance.now()
      const elapsed = Math.min(1, Math.max(0, (now - start) / keyboardMotion))
      const done = ease(elapsed)
      // The target must be past that place by more than a small step: a target back at it, within a float error or a
      // keyboard's 1 px step, is a reopen or a close, and a correction would rise or fall in the rest of the curve.
      const ahead = Math.sign(previous - origin) * (inset - origin) > keyboardFollow
      // A small step of the keyboard (at most `keyboardFollow` from the last target) keeps the move's end even late in
      // it: the rest of the curve still takes the dock onto the keyboard by that end (the-bridge keyboard:served on
      // Workspaces, beta.80).
      const small = Math.abs(inset - previous) <= keyboardFollow
      // A keyboard that reports its height in each frame as it moves (the-bridge keyboard:served): a target less than
      // `keyboardStepGap` after the last one, in the same direction as that one's step, which also came less than
      // `keyboardStepGap` after the one before (so a report soon after the focus's move is not one). Each report is where the
      // keyboard is in that frame, so the dock follows it at once, in a move or after it, and the composer moves with
      // the keyboard. A single late report (iOS) or a turn (a close after a 1 px step) is not one.
      const direction = Math.sign(inset - previous)
      const quick = now - lastTargetAt < Math.min(keyboardStepGapMax, Math.max(keyboardStepGap, 3 * frameGap))
      // A device or a runner that is slow at random times leaves one gap of 100 ms in a keyboard's frame steps: a report
      // in the same direction up to `keyboardStepGapMax` after a frame step is one too, so one gap does not make a new
      // 250 ms move that ends after the keyboard (`Frame Steps Later` failed on CI with the composer 9 px under it).
      const stepping = direction === lastDirection && direction !== 0 && ((quick && lastQuick) || now < stepUntil)
      stepUntil = stepping ? now + keyboardStepGapMax : Number.NEGATIVE_INFINITY
      lastTargetAt = now
      lastDirection = direction
      lastQuick = quick
      // "Late" is by time, not by the curve: the keyboard's curve is nine tenths done at 43 % of its time, and a report
      // at 152 ms (the Workbench trace of screen review R25) made a second 250 ms move. Up to `keepEndUntil` of the
      // time, the rest of the curve still has room for the correction; later, a correction would jump within a frame.
      // A frame step of the keyboard, in a move or after it, and after the move a small step, are followed at once: a
      // new 250 ms move for them would leave the dock off the keyboard for most of its curve.
      if (stepping || (motion === undefined && small && Math.abs(inset - shown) <= keyboardFollow)) {
        if (motion !== undefined) cancelAnimationFrame(motion)
        motion = undefined
        shown = inset
        origin = inset
        root.dataset.keyboardEnd = String(now)
        paint(inset)
        return
      }
      if (motion !== undefined && done < 1 && ahead && (elapsed < keepEndUntil || small)) {
        // Before the move's first frame nothing is drawn, and a late first frame restarts the clock (see `step`), so
        // the move still starts where the dock is (Codex review of #280).
        if (!firstFrame) from = (shown - inset * done) / (1 - done)
        return
      }
      from = shown
      origin = shown
      start = now
      // The time the move ends, for a test or a trace to read: a correction keeps it, a new move sets it, and a late
      // first frame moves it (see `step`).
      root.dataset.keyboardEnd = String(start + keyboardMotion)
      if (motion === undefined) {
        firstFrame = true
        lastFrameAt = Number.NEGATIVE_INFINITY
        motion = requestAnimationFrame(step)
      }
    }
    // The keyboards measured last, per orientation, and the opening of one: from a field's focus until the keyboard's
    // measure settles, the dock rises at once to the expected inset and does not come down for a smaller step of the
    // keyboard's rise. It takes the measure as it is `blurEndDelay` after the last resize (or `keyboardWait` after the
    // focus with none), and keeps it for the next open. A layout that shrinks meanwhile is a browser that resizes it
    // for the keyboard: nothing is expected there again.
    const measured = keyboardMeasures
    const orientation = () => (document.documentElement.clientWidth > document.documentElement.clientHeight ? 'landscape' : 'portrait')
    // The visible area's shortfall with no field focused (see `measure`).
    let rest = 0
    let opening = false
    let openLayout = 0
    // The keyboard the current opening expects, and whether it was measured (or is Figma's guess).
    let expectedInset = 0
    let expectedMeasured = false
    let settleTimer: ReturnType<typeof setTimeout> | undefined
    const settle = () => {
      settleTimer = undefined
      opening = false
      // The focus left the fields during the opening (a press on Send): the end of the fit brings the dock down after
      // the press's release, so the settle moves nothing (Codex review of #202).
      if (!typing || !editable(document.activeElement)) return
      const inset = measure()
      if (inset > 1) measured.set(orientation(), inset)
      show(inset)
    }
    const scheduleSettle = (delay: number) => {
      if (settleTimer !== undefined) clearTimeout(settleTimer)
      settleTimer = setTimeout(settle, delay)
    }
    // The keyboard's inset as the visual viewport reports it now, or 0 with no field focused.
    const measure = () => {
      // A field removed while it had the focus fires no focusout in WebKit: the focus is then on the body, and the
      // fit must not stay on for it.
      if (!editable(document.activeElement)) typing = false
      const layout = document.documentElement.clientHeight
      const visible = viewport.height * viewport.scale
      // At scale 1 the visible area's top, less the document scroll iOS adds as it reports the keyboard: that scroll is
      // taken back by `keepTop`, and iOS may count it in `offsetTop` for that event too (the iPhone trace of screen review R25).
      if (viewport.scale === 1) top = Math.max(0, viewport.offsetTop - window.scrollY)
      // A field has the focus and the visible area is more than a pixel of rounding smaller: a keyboard covers the
      // layout. With no focused field it is the browser's bars, which the shell does not follow.
      if (!typing || layout - visible <= 1) {
        // With no field focused, the visible area's shortfall is the rest one: iOS's standalone app keeps the visual
        // viewport 68 px short after the first close (the Workbench trace of screen review R25), and its bars do in
        // Safari. A focus counts no keyboard as open until a report goes past it.
        if (!typing && viewport.scale === 1) rest = Math.max(0, layout - visible)
        return 0
      }
      top = Math.min(Math.max(top, viewport.offsetTop + viewport.height - visible), viewport.offsetTop)
      return layout - top - visible
    }
    const fit = () => {
      const inset = measure()
      if (opening && typing && document.documentElement.clientHeight < openLayout - 1 && layoutCheck === undefined) checkLayout(layoutFrames)
      // During the opening, a report under the expected keyboard is an early step of its rise and holds the dock up,
      // when the expected keyboard is one measured before on this screen. A Figma guess can be wrong: a report of at
      // least three quarters of it is the whole keyboard and is taken at once, so the dock does not wait for the
      // settle to come down (screen review R22). The settle then only stores the measure.
      const early = opening && typing && inset < target && (expectedMeasured || inset < expectedInset * 0.75)
      // A report taken as the whole keyboard is kept for the next open at once: a blur before the settle (a press on
      // Send) would otherwise lose it.
      if (opening && typing && !early && inset > 1) measured.set(orientation(), inset)
      show(early ? target : inset)
    }
    // A layout that is shorter than at the focus during an opening: a browser that resizes the layout for the keyboard
    // (Firefox on Android) expects nothing again, but only when the layout is still short `layoutFrames` frames later.
    // iOS 18 shortens it for about one frame as it reports the keyboard and restores it with no event, so each frame
    // until then fits again, and the measure is kept for the next open.
    let layoutCheck: number | undefined
    const checkLayout = (frames: number) => {
      layoutCheck = requestAnimationFrame(() => {
        layoutCheck = undefined
        if (!opening || !typing) return
        if (document.documentElement.clientHeight >= openLayout - 1) {
          fit()
          return
        }
        if (frames > 1) {
          checkLayout(frames - 1)
          return
        }
        measured.set(orientation(), 0)
        opening = false
        fit()
      })
    }
    // A visualViewport resize during an opening is a step of the keyboard's rise: the measure settles after the last.
    const resize = () => {
      fit()
      if (opening) scheduleSettle(blurEndDelay)
    }
    // iOS scrolls the document to bring a focused field above the keyboard, so the whole shell, its top bar too,
    // slides up, and it comes back down when the keyboard closes (screen reviews R20 and R21). The dock keeps the
    // field above the keyboard, so while a field has the focus or the dock is set, the document goes back to its top
    // at once. Under a zoom the user pans the page, and nothing is reset.
    const keepTop = () => {
      // A field removed while it had the focus fires no focusout in WebKit, so the focus is read again here, as in
      // `fit` (Codex review of #200).
      if (!editable(document.activeElement)) typing = false
      if (viewport.scale !== 1 || window.scrollY === 0) return
      if (typing || root.style.getPropertyValue(keyboardInset) !== '') window.scrollTo(0, 0)
    }
    const scroll = () => {
      keepTop()
      fit()
    }
    // A field takes the focus: the fit starts at once. Another element taking it fits nothing here.
    // With no keyboard open yet, it rises to the expected keyboard before the browser reports one.
    const focusIn = () => {
      const was = typing
      typing = editable(document.activeElement)
      if (!typing) return
      cancelEnd()
      keepTop()
      const known = measured.get(orientation())
      const expected = known ?? (orientation() === 'portrait' ? figmaKeyboard : 0)
      expectedInset = expected
      expectedMeasured = known !== undefined
      if (!was && measure() <= rest + 1 && expected > 0 && keyboardExpected()) {
        opening = true
        openLayout = document.documentElement.clientHeight
        scheduleSettle(keyboardWait)
        // With reduced motion the dock jumps, so a guess would make two jumps (to Figma's 346, then to the real 369: the
        // iPhone recording of screen review R26). It waits for the keyboard's report instead, unless the keyboard
        // was measured, and jumps once.
        if (expectedMeasured || !media('(prefers-reduced-motion: reduce)')) show(expected)
      } else fit()
    }
    // During a focusout the focus is on no element yet; `relatedTarget` is the element that takes it next, if any.
    // Only `typing` changes, and nothing is fitted: the fit stays as it is, the leaving state, until the next
    // viewport event (the keyboard closing, or a `refit` event) fits with `typing` false and removes it. So a press
    // that takes the focus from the field (Send) lands where it started, and a move to another field never drops
    // the fit.
    const focusOut = (event: FocusEvent) => {
      // Only a field that leaves the focus changes the fit. An element that is not a field (the thread's body, a keep
      // element) and hands the focus to a field leaves `typing` false, so `focusIn` starts the rise to the expected
      // keyboard (the iPhone trace of screen review R25: a focusout of a div, then the focusin of the textarea, and no dock).
      if (!editable(event.target instanceof Element ? event.target : null)) return
      typing = editable(event.relatedTarget instanceof Element ? event.relatedTarget : null)
      // A close is never a frame step of the opening keyboard, however soon it comes (Codex review of #274).
      if (!typing) lastQuick = false
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
    // A touch or pen press inside the shell while a field has the focus, on neither a field nor a keep element:
    // the field is blurred at once, so the keyboard closes, and the click of that gesture is swallowed, so the tap
    // opens nothing (an Inbox row stays closed). A press on another field moves the focus as always, and a mouse or
    // a hardware keyboard changes nothing. The blur's focusout comes while the press is down, so the dock waits for
    // the release, as for any press that takes the focus.
    let swallowTimer: ReturnType<typeof setTimeout> | undefined
    const swallow = (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      stopSwallow()
    }
    const stopSwallow = () => {
      if (swallowTimer !== undefined) clearTimeout(swallowTimer)
      swallowTimer = undefined
      document.removeEventListener('click', swallow, true)
      document.removeEventListener('pointerup', afterTap, true)
      document.removeEventListener('pointercancel', stopSwallow, true)
    }
    const afterTap = () => {
      if (swallowTimer !== undefined) clearTimeout(swallowTimer)
      swallowTimer = setTimeout(stopSwallow, tapClickWait)
    }
    const tapOutside = (event: PointerEvent) => {
      const focused = document.activeElement
      const target = event.target instanceof Element ? event.target : null
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return
      if (!editable(focused) || target === null || !root.contains(target)) return
      if (editable(target.closest(fieldSelector)) || target.closest(keyboardKeep) !== null) return
      // A field's label moves the focus to its field, as a tap on the field does (Codex review of #213).
      const label = target.closest('label')
      if (label !== null && editable(label.control)) return
      // With no on-screen keyboard docked (a hardware keyboard), the tap acts at once (Codex review of #213).
      if (root.style.getPropertyValue(keyboardInset) === '') return
      stopSwallow()
      focused.blur()
      document.addEventListener('click', swallow, true)
      document.addEventListener('pointerup', afterTap, true)
      document.addEventListener('pointercancel', stopSwallow, true)
      swallowTimer = setTimeout(stopSwallow, tapPressWait)
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
    if (editable(document.activeElement)) focusIn()
    viewport.addEventListener('resize', resize)
    viewport.addEventListener('scroll', scroll)
    window.addEventListener('scroll', keepTop)
    document.addEventListener('focusin', focusIn)
    document.addEventListener('focusout', focusOut)
    document.addEventListener('pointerdown', press, true)
    document.addEventListener('pointerdown', tapOutside, true)
    document.addEventListener('pointerup', release, true)
    document.addEventListener('pointercancel', release, true)
    document.addEventListener('visibilitychange', refit)
    window.addEventListener('resize', refit)
    window.addEventListener('orientationchange', refit)
    window.addEventListener('pageshow', refit)
    return () => {
      viewport.removeEventListener('resize', resize)
      viewport.removeEventListener('scroll', scroll)
      window.removeEventListener('scroll', keepTop)
      document.removeEventListener('focusin', focusIn)
      document.removeEventListener('focusout', focusOut)
      document.removeEventListener('pointerdown', press, true)
      document.removeEventListener('pointerdown', tapOutside, true)
      stopSwallow()
      document.removeEventListener('pointerup', release, true)
      document.removeEventListener('pointercancel', release, true)
      document.removeEventListener('visibilitychange', refit)
      cancelEnd()
      if (settleTimer !== undefined) clearTimeout(settleTimer)
      if (layoutCheck !== undefined) cancelAnimationFrame(layoutCheck)
      if (motion !== undefined) cancelAnimationFrame(motion)
      window.removeEventListener('resize', refit)
      window.removeEventListener('orientationchange', refit)
      window.removeEventListener('pageshow', refit)
      root.style.removeProperty(keyboardInset)
    }
    // `diagnostic` is a ref: the same object on every render, so it never restarts the dock.
  }, [diagnostic])
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
  /**
   * Called once when the shell finds a mistake in the page that it can only see at run time, such as a focused field
   * in a ScrollFrame footer that does not dock on the keyboard (`undocked-field`). Without it, the shell writes the
   * message to the console. Pass the app's error reporter.
   */
  onDiagnostic?: ((diagnostic: AppShellDiagnostic) => void) | undefined
}

/** A mistake in the page that `AppShell` found at run time, for `onDiagnostic`. It holds no element or page text. */
export type AppShellDiagnostic = {
  /** `undocked-field`: the focused field is in the footer of a ScrollFrame that is not the detail's direct child. */
  code: 'undocked-field'
  /** What is wrong and how to fix it, in English. */
  message: string
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
 * `visualViewport`, nothing docks. With the keyboard open, a touch or pen
 * tap in the shell that is not on a field or inside `[data-keyboard-keep]`
 * (Send, a search's sort or filter) closes the keyboard and opens nothing:
 * its click is swallowed once. A tap on another field moves the focus, a
 * drag still scrolls, and a mouse changes nothing. The scrolling pane is focusable, so the keyboard can scroll it
 * when it holds only text. It draws no scroll bar, and a scroll that reaches its end stops there and does not move
 * the page (the shared `scrollArea` style); a wheel, a trackpad, a touch drag and the keys still scroll it.
 */
export function AppShell({ size, listWidth, sideWidth, rail, list, detail, side, tabBar, view = 'list', tabBarOverlay = false, onDiagnostic }: AppShellProps) {
  useInputModality()
  // The latest callback, read when a diagnostic comes, so a new callback does not restart the keyboard dock. It is
  // copied in an insertion effect, which runs before any layout effect and before a field's autofocus in the same
  // commit, so a field that takes the focus as the callback changes reports to the new one (Codex review of #284).
  const diagnostic = useRef(onDiagnostic)
  useInsertionEffect(() => {
    diagnostic.current = onDiagnostic
  })
  const fit = useVisualViewportFit(diagnostic)
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
