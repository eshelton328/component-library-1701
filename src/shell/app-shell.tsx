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
// How long the fit stays after the focus leaves the fields with no pointer down (a blur from code, the keyboard's Done)
// when no viewport event ends it first, where no on-screen keyboard slides (a mouse; see `slides`), and how long the
// keyboard's measure waits after its last resize to settle. Where iOS slides its keyboard, the fall starts with the
// keyboard at the focusout instead (screen review R37).
const blurEndDelay = 300
// The dock moves as the iOS keyboard does: `durations.keyboard` on `easings.keyboard`, a cubic-bezier fitted to
// the iOS 26 keyboard (screen review R37: a 60 fps recording of the iPad mini, where the keyboard moves as a
// critically damped spring, 1 - (1 + wt) e^(-wt) with w about 23.5/s, up and down; the curve over 300 ms stays within
// 1.1 % of it). The hook animates it on that curve and also places it on the curve by hand (a correction, a new
// target), so it reads both tokens as numbers, through strict readers that throw on a form they do not know (audit L-2).
const keyboardMotion = cssDuration(token('durations.keyboard'))
// How long the iOS keyboard has been moving when Safari reports it. iOS reports an opening keyboard once, with its
// whole height, in the frame that first draws it, and that frame already shows the keyboard 43 to 63 ms into its
// motion (R37, the four opens fitted to the spring); a close is reported 25 to 80 ms after the focusout that started
// it (the iPad mini and iPhone traces of 2026-11-19 to 21). A move that starts at a report starts its clock this far
// back, not before the focus, so its first frame shows the dock where the keyboard is.
const keyboardReportLag = 50
// The time fraction of a move up to which a new target keeps the move's end.
const keepEndUntil = 0.7
// The most time between two keyboard reports, in ms, for a keyboard that moves frame by frame: three of the frames
// the dock measured in its last move, at least 50 (three at 60 Hz) and at most 150. On a device whose frames are slow
// (60 ms on a loaded CI runner) the reports of such a keyboard come further apart than 50 ms, and a new move for each
// left the dock under the keyboard after it stopped. A single report 152 ms after the focus (the Workbench trace of
// screen review R25) still is not one.
const keyboardStepGap = 50
const keyboardStepGapMax = 150
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
// The curve's own parameter where its x (the time fraction) is `t`.
const paramAt = (t: number) => {
  const [x1, , x2] = keyboardCurve
  let low = 0
  let high = 1
  for (let i = 0; i < 40; i += 1) {
    const mid = (low + high) / 2
    if (bezier(x1, x2, mid) < t) low = mid
    else high = mid
  }
  return (low + high) / 2
}
const ease = (t: number) => {
  const [, y1, , y2] = keyboardCurve
  return bezier(y1, y2, paramAt(t))
}
// The time, in ms from the keyboard's start, at which its curve reaches `progress` (0 to 1): the inverse of `ease`.
const curveTime = (progress: number) => {
  const [x1, y1, x2, y2] = keyboardCurve
  let low = 0
  let high = 1
  for (let i = 0; i < 40; i += 1) {
    const mid = (low + high) / 2
    if (bezier(y1, y2, mid) < progress) low = mid
    else high = mid
  }
  return bezier(x1, x2, (low + high) / 2) * keyboardMotion
}
// The keyboard's curve between its parameters `from` and `to`, as a CSS easing over that part: the part of a cubic
// bezier is a cubic bezier (its control points are the curve's blossom at the two ends), scaled to the part's time and
// progress. A keyframe with it moves on the curve itself, not on a straight line between two points of it (a line
// under the curve put the composer 0.05 px under the keyboard on CI, `LateFirstFrame`).
const partEasing = (from: number, to: number) => {
  const [x1, y1, x2, y2] = keyboardCurve
  const blossom = (a: number, b: number, u: number, v: number, w: number) =>
    a * (u * (1 - v) * (1 - w) + (1 - u) * v * (1 - w) + (1 - u) * (1 - v) * w) +
    b * (u * v * (1 - w) + u * (1 - v) * w + (1 - u) * v * w) +
    u * v * w
  const xs = [blossom(x1, x2, from, from, from), blossom(x1, x2, from, from, to), blossom(x1, x2, from, to, to), blossom(x1, x2, to, to, to)]
  const ys = [blossom(y1, y2, from, from, from), blossom(y1, y2, from, from, to), blossom(y1, y2, from, to, to), blossom(y1, y2, to, to, to)]
  const [x0 = 0, xa = 0, xb = 0, x3 = 1] = xs
  const [y0 = 0, ya = 0, yb = 0, y3 = 1] = ys
  if (x3 - x0 < 1e-9 || Math.abs(y3 - y0) < 1e-9) return 'linear'
  const time = (x: number) => Math.min(1, Math.max(0, (x - x0) / (x3 - x0)))
  const progress = (y: number) => (y - y0) / (y3 - y0)
  return `cubic-bezier(${String(time(xa))}, ${String(progress(ya))}, ${String(time(xb))}, ${String(progress(yb))})`
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
// the layout with `interactive-widget=resizes-content`, so it expects nothing. `slides` is the device part alone: an
// on-screen keyboard that iOS slides in and out, which the dock follows in its motion, also with reduced motion (iOS
// still slides its keyboard then, so following it adds no motion of the page's own; screen review R37).
const slides = () => media('(pointer: coarse)') && Reflect.get(navigator, 'virtualKeyboard') === undefined
const keyboardExpected = () => slides() && pressedBefore()
// A press on one of these acts on its click, so the dock does not move from under it before the release (Send).
const pressControl = 'a, button, input, select, textarea, label, summary, [role=button], [role=link], [contenteditable]'

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
 * finger. With no focused field the property is removed. A `focusin` on a field starts the fit at once, and the dock
 * rises with the keyboard's first report, on the keyboard's clock. Where iOS slides its keyboard (a touch screen with
 * no VirtualKeyboard API), a focusout to no field starts the dock's fall in the next frame, as the keyboard starts its
 * own then, unless a press on a control is down (below). Elsewhere, or under such a press, when the focus leaves the
 * fields (to a button, or to nowhere on a blur), the fit stays until the next visualViewport `resize` or `scroll`, the
 * keyboard closing: a tap on the composer's Send takes the focus on its press, and if the dock fell then, the button
 * would move from under the finger before the click and the tap would miss it. With no such event the fit ends on its own,
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
    // The ScrollFrame parts that the dock moves: each footer in the shell (the keyboard's inset lifts every frame's
    // footer, also in the list or side pane of the desktop layout on an iPad: Codex review of #314), and each body of
    // the detail that does not hold the focused field. A body that holds the focused field is left to the browser,
    // which keeps that field in view (Codex review of #210): a form that fits its body would otherwise be pinned to its
    // end, past the field. Only a field (`editable`) counts: a tap on the thread that closes the keyboard gives the
    // focus to the body itself (its `tabIndex` 0), and a body skipped then lost the reader's place by the rest of the
    // fall (the-bridge's iPhone probe: 211 px on each open and close, `TapClosesKeyboard`).
    const dockedParts = () => {
      const focused = document.activeElement
      const field = editable(focused) ? focused : null
      const slots = (frames: string, name: string) =>
        [...root.querySelectorAll(frames)]
          .flatMap((frame) => [...frame.querySelectorAll(`:scope > .scroll-frame__${name}`)])
          .filter((el) => el instanceof HTMLElement)
      return {
        footers: slots('.scroll-frame__root', 'footer'),
        bodies: slots(':scope > .app-shell__detail > .scroll-frame__root', 'body').filter((body) => field === null || !body.contains(field)),
      }
    }
    // The inset the layout shows now: the property is set for it.
    let applied = 0
    // Lays the page out for a keyboard `inset` px tall at the layout's foot: the property is how far it covers the detail.
    const lay = (inset: number) => {
      applied = inset
      const detail = root.querySelector(':scope > .app-shell__detail')
      const keyboardTop = document.documentElement.clientHeight - inset
      // The detail's foot where it is with the document at its top: iOS scrolls the document as it reports the
      // keyboard, and `keepTop` takes it back, so a paint between the two must not read the scrolled place (the 9 px
      // step in the iPhone trace of screen review R25).
      // Only at scale 1, where `keepTop` takes that scroll back: under a zoom the user scrolls the document, and the
      // detail's foot is where it is (Codex review of #263).
      const scrolled = viewport.scale === 1 ? window.scrollY : 0
      const covered = detail === null ? 0 : Math.max(0, detail.getBoundingClientRect().bottom + scrolled - keyboardTop)
      // No keyboard docks nothing, even where the detail's foot lies below the layout's (a parent taller than the
      // screen).
      if (inset > 0 && covered > 0) root.style.setProperty(keyboardInset, `${String(covered)}px`)
      else root.style.removeProperty(keyboardInset)
      if (inset > 0 && covered > 0 && detail !== null) warnUndocked(detail)
    }
    // A body's view's bottom in the layout: where a footer above the keyboard ends its view, or the keyboard its spacer.
    const viewBottom = (body: HTMLElement) => body.getBoundingClientRect().top + body.clientTop + body.clientHeight
    // A footer's content's bottom: its box's bottom less the space under its content, which the keyboard's inset may
    // size and which then changes at a move's edge (ScrollFrame `foot`, or a page's padding that reads
    // `--scroll-frame-dock`). The dock moves the content's bottom, so that change does not move the content (Codex review
    // of #314). The space is the footer's bottom padding and border, its `foot` spacer (`::after`), and its last
    // child's bottom margin, padding and border.
    const px = (value: string) => Number.parseFloat(value) || 0
    const footerBase = (footer: HTMLElement) => {
      const own = getComputedStyle(footer)
      const spacer = getComputedStyle(footer, '::after')
      const last = footer.lastElementChild
      const child = last === null ? null : getComputedStyle(last)
      const under =
        px(own.paddingBottom) +
        px(own.borderBottomWidth) +
        (spacer.display === 'none' ? 0 : px(spacer.height)) +
        (child === null ? 0 : px(child.marginBottom) + px(child.paddingBottom) + px(child.borderBottomWidth))
      return footer.getBoundingClientRect().bottom - under
    }
    const atEndOf = (body: HTMLElement) => body.scrollHeight - body.scrollTop - body.clientHeight <= 1
    const translateOf = (el: Element) => {
      const transform = getComputedStyle(el).transform
      return transform === '' || transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42
    }
    // A move of the dock is the compositor's (screen review R39: on the iPad mini a dock that laid the page out in
    // each frame drew its frames 19 to 60 ms apart, and the screen showed the composer's last steps 33 to 133 ms
    // apart). It starts once, as transform animations on the keyboard's curve and clock: each footer moves from where
    // it is drawn to where the move's end docks it, and the content of each docked body moves with its view's bottom,
    // so the thread keeps its line above the composer through the whole move, as in the Claude iOS app (screen review
    // R22): a body at its end stays at its end, and any other body scrolls by as much as its view shrinks or grows.
    // The layout changes only at the move's edges, and during the move it keeps the larger view of the two, so no
    // content is cut off: a fall lays the page out for its end at its start, and a rise at its end, in the frame its
    // animations end. In between, the dock writes no style and no scroll position and changes no box, so a page that
    // works on each resize or scroll of its thread has nothing to do mid-move (`DockFrameWork`).
    // A part moves as the keyboard covers its frame: not while the keyboard is under the detail's foot (the safe area)
    // or the space under the footer (a tab bar), and with each px of it above that. So each animation holds the
    // curve's values at `motionSteps` points, even in the curve's own parameter, and at the bend where the keyboard
    // comes over the frame, each with the curve's part up to the next point as its easing (`partEasing`).
    // Before the time of its start (`now`, which a busy frame can draw: its time is when the frame began) a part holds
    // where it starts.
    const motionSteps = 48
    // At each point: its time (`offsets`), the part's value, the curve's progress and the easing to the next point.
    type Track = { from: number; to: number; offsets: number[]; values: number[]; progress: number[]; easings: string[] }
    type Motion = {
      start: number
      target: number
      clock: Animation
      animations: Animation[]
      // Where each footer's content's bottom is drawn (`footerBase`), and each body's view's bottom and scroll position
      // as drawn, through the move. The bottom, not the top: a footer that grows or shrinks during the move does so at
      // its top, as in the layout, and stays on the keyboard.
      footers: Map<HTMLElement, Track>
      // `real` is the scroll position the move set or kept: a scroll by the reader or the page during the move moves
      // the end's by as much.
      bodies: Map<HTMLElement, { bottom: Track; scroll: Track; atEnd: boolean; real: number }>
      // Called when the move ends: each body's scroll listener and child observer of the move.
      cleanups: (() => void)[]
    }
    let moving: Motion | undefined
    // A track's value at `now`: between its values at the two points around that time, at the curve's progress then
    // (a part's value is a straight line in the progress between two points, as its animation draws it).
    const valueAt = (move: Motion, track: Track, now: number) => {
      const time = Math.min(1, Math.max(0, (now - move.start) / keyboardMotion))
      const next = track.offsets.findIndex((offset) => offset >= time)
      if (next <= 0) return next === 0 ? (track.values[0] ?? track.to) : track.to
      const a = track.progress[next - 1] ?? 0
      const b = track.progress[next] ?? 1
      const low = track.values[next - 1] ?? track.to
      const high = track.values[next] ?? track.to
      const progress = Math.min(Math.max(ease(time), Math.min(a, b)), Math.max(a, b))
      return Math.abs(b - a) < 1e-9 ? high : low + ((high - low) * (progress - a)) / (b - a)
    }
    // Where a part is drawn now: on its move's track, or where the layout has it.
    const drawn = (now: number) => {
      const move = moving
      const footerBottom = (footer: HTMLElement) => {
        const track = move?.footers.get(footer)
        return move === undefined || track === undefined ? footerBase(footer) : valueAt(move, track, now)
      }
      const body = (el: HTMLElement) => {
        const tracks = move?.bodies.get(el)
        if (move === undefined || tracks === undefined) return { bottom: viewBottom(el), scroll: el.scrollTop, atEnd: atEndOf(el) }
        // A view that grew at its end (a footer that shrank during the move) pulls a body at its end back by as much:
        // that is no scroll by the reader, and the body stays at its end, drawn where it was, so the thread's last line
        // keeps its place in that frame and the move closes the gap (GrowOnDock, with the growth a frame late, as React
        // commits it on a slow runner: the line jumped 28 px and the thread ended 28 px under the composer).
        const moved = el.scrollTop - tracks.real
        const pulled = tracks.atEnd && Math.abs(moved) > 1 && atEndOf(el)
        return {
          bottom: valueAt(move, tracks.bottom, now),
          // A scroll by the reader or the page during the move moves the drawn place by as much, and leaves the end.
          scroll: valueAt(move, tracks.scroll, now) + (pulled ? 0 : moved),
          atEnd: tracks.atEnd && (Math.abs(moved) <= 1 || pulled),
        }
      }
      return { footerBottom, body }
    }
    const stopMotion = () => {
      const move = moving
      moving = undefined
      if (move === undefined) return
      move.clock.onfinish = null
      move.clock.cancel()
      for (const animation of move.animations) animation.cancel()
      for (const cleanup of move.cleanups) cleanup()
    }
    // Tells the page that the dock moves to `inset`, before it measures the page: a listener may change the layout
    // there (a composer that grows with the keyboard), and the move takes that change on the keyboard's curve.
    const announce = (inset: number) => {
      root.dispatchEvent(new CustomEvent<AppShellDockDetail>(appShellDockEvent, { detail: { inset } }))
    }
    // The dock at `inset` at once: a keyboard that reports each frame of its move, a mouse with reduced motion, or the
    // same inset laid out again for a new layout.
    const jump = (inset: number) => {
      const now = performance.now()
      const look = drawn(now)
      const bodies = dockedParts().bodies.map((body) => ({ el: body, ...look.body(body) }))
      stopMotion()
      announce(inset)
      lay(inset)
      // The move is added to the scroll position read before the change: a view that grows has the browser clamp
      // `scrollTop` first, and adding to that would jump the thread (Codex review of #216).
      for (const { el, atEnd, bottom, scroll } of bodies) {
        const next = viewBottom(el)
        if (atEnd) el.scrollTop = el.scrollHeight
        else if (Math.abs(next - bottom) > 0.5 || Math.abs(el.scrollTop - scroll) > 0.5) el.scrollTop = scroll + bottom - next
      }
    }
    // The space under a frame's footer, or under its body with no footer: the part of the keyboard's reach that does
    // not move it (a tab bar under the frame; 0 elsewhere).
    const frameInset = (frame: Element) => {
      const footer = frame.querySelector(':scope > .scroll-frame__footer')
      if (footer !== null) return Number.parseFloat(getComputedStyle(footer).marginBottom) || 0
      const body = frame.querySelector(':scope > .scroll-frame__body')
      const spacer = body === null ? null : getComputedStyle(body, '::after')
      return spacer === null || spacer.display === 'none' ? 0 : Number.parseFloat(spacer.height) || 0
    }
    // Each footer's height as the move laid it out, and the footers watched for a change of it (`resized`, below).
    const sizes = new Map<Element, number>()
    const watched = new Set<Element>()
    // A footer whose height changes during a move (a composer that grows as the keyboard opens, from a page's
    // `appShellDockEvent` listener, or shrinks at a blur as it closes) changes the move's end: the move goes on from where
    // the dock is drawn to the new end, on the same curve. The observer reports the change after the layout and before
    // the frame paints, so no frame shows the old move on the new layout: the footer's bottom stays on its track and its
    // top takes the change, and each body's content moves on from where it is drawn (screen review R39: the composer's
    // 28 px growth came at the tap, a step of its own before the keyboard moved).
    const resized =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver((entries) => {
            let changed = false
            for (const entry of entries) {
              const height = entry.target.getBoundingClientRect().height
              const was = sizes.get(entry.target)
              sizes.set(entry.target, height)
              if (was !== undefined && Math.abs(was - height) > 0.5) changed = true
            }
            const move = moving
            if (changed && move !== undefined) glide(move.target, move.start, from, shownAt(performance.now()))
          })
    // The dock moves to `target` on the keyboard's curve, which started at `start` from the inset `fromInset` (the
    // start can be in the past: a frame shows the dock where the keyboard is then). `drawnInset` is where the dock is
    // drawn now.
    const glide = (target: number, start: number, fromInset: number, drawnInset: number) => {
      const now = performance.now()
      const look = drawn(now)
      const parts = dockedParts()
      const footersNow = parts.footers.map((el) => ({ el, bottom: look.footerBottom(el) }))
      const bodiesNow = parts.bodies.map((el) => ({ el, ...look.body(el) }))
      stopMotion()
      announce(target)
      // The layout of the move: the one the page has, when its view is already the larger; else the larger view, of
      // the dock where it is drawn now or of the target.
      const low = Math.min(drawnInset, target)
      const layout = applied <= low + 0.5 ? applied : low
      const keptScroll = bodiesNow.map(({ el }) => el.scrollTop)
      // Measured once, at the target's layout: where each footer and each view's bottom end.
      if (applied !== target) lay(target)
      const ends = {
        footers: footersNow.map(({ el }) => footerBase(el)),
        bodies: bodiesNow.map(({ el }) => ({ bottom: viewBottom(el), view: el.clientHeight, height: el.scrollHeight })),
      }
      if (layout !== target) lay(layout)
      // How far the keyboard reaches over a frame's moving parts at an inset: none under the detail's foot, and none
      // under the space below the footer.
      const detail = root.querySelector(':scope > .app-shell__detail')
      const scrolled = viewport.scale === 1 ? window.scrollY : 0
      const below = detail === null ? 0 : document.documentElement.clientHeight - detail.getBoundingClientRect().bottom - scrolled
      const reach = (frame: Element | null) => {
        const under = below + (frame === null ? 0 : frameInset(frame))
        return (inset: number) => Math.max(0, inset - under)
      }
      // The points of the keyboard's curve, as (time, progress), and a part's values at them: from its value now, at the
      // drawn inset, to its value at the end, in step with the keyboard's reach over its frame.
      const [x1, y1, x2, y2] = keyboardCurve
      const begun = Math.min(1, Math.max(0, (now - start) / keyboardMotion))
      const curve = Array.from({ length: motionSteps + 1 }, (_, i) => ({
        param: i / motionSteps,
        time: bezier(x1, x2, i / motionSteps),
        progress: bezier(y1, y2, i / motionSteps),
      }))
      const track = (frame: Element | null, valueNow: number, to: number): Track => {
        const over = reach(frame)
        const span = over(target) - over(drawnInset)
        const begunParam = paramAt(begun)
        const points = [...curve, { param: begunParam, time: begun, progress: bezier(y1, y2, begunParam) }]
        // The bend: the progress at which the keyboard comes over the frame, and its time on the curve.
        const under = frame === null ? below : below + frameInset(frame)
        const bend = target === fromInset ? -1 : (under - fromInset) / (target - fromInset)
        if (bend > 0 && bend < 1) {
          let lowS = 0
          let highS = 1
          for (let i = 0; i < 30; i += 1) {
            const mid = (lowS + highS) / 2
            if (bezier(y1, y2, mid) < bend) lowS = mid
            else highS = mid
          }
          points.push({ param: highS, time: bezier(x1, x2, highS), progress: bezier(y1, y2, highS) })
        }
        points.sort((a, b) => a.param - b.param)
        const startProgress = bezier(y1, y2, begunParam)
        const value = (progress: number) => {
          const inset = fromInset + (target - fromInset) * Math.max(progress, startProgress)
          return Math.abs(span) < 0.01 ? to : valueNow + ((to - valueNow) * (over(inset) - over(drawnInset))) / span
        }
        const offsets = points.map((point) => point.time)
        const values = points.map((point) => value(point.progress))
        // Before the start's point a part holds still, so the easing there does not matter.
        const easings = points.map((point, i) => partEasing(point.param, points[i + 1]?.param ?? point.param))
        return { from: values[0] ?? valueNow, to, offsets, values, progress: points.map((point) => point.progress), easings }
      }
      const move: Motion = { start, target, clock: root.animate([], { duration: keyboardMotion }), animations: [], footers: new Map(), bodies: new Map(), cleanups: [] }
      const timing: KeyframeAnimationOptions = { duration: keyboardMotion, easing: 'linear', fill: 'both' }
      // A footer's animation replaces its transform, the dock's own; a body's child's adds to the child's own transform
      // (Codex review of #314).
      const animate = (el: HTMLElement, steps: Track, values: number[], composite: CompositeOperation = 'replace') => {
        const animation = el.animate(
          values.map((value, i) => ({
            offset: steps.offsets[i] ?? 1,
            easing: steps.easings[i] ?? 'linear',
            transform: `translateY(${String(value)}px)`,
          })),
          { ...timing, composite },
        )
        animation.startTime = start
        move.animations.push(animation)
      }
      // Every read of the page comes before the first animation: an animation started between two reads makes the
      // second lay the page out again, once per thread line (the iPad Simulator drew no frame for 140 to 200 ms after a
      // close's start with the reads and the starts mixed). First the scroll positions of the move's layout, then the
      // reads, then the animations.
      const bodyMoves = bodiesNow.flatMap(({ el, bottom, scroll, atEnd }, i) => {
        const end = ends.bodies[i]
        if (end === undefined) return []
        const room = Math.max(0, end.height - end.view)
        const toScroll = atEnd ? room : Math.min(room, Math.max(0, scroll + bottom - end.bottom))
        // The scroll position of the move's layout: the end's, where the end's layout is the move's, else as it was.
        const real = layout === target ? toScroll : (keptScroll[i] ?? el.scrollTop)
        if (Math.abs(el.scrollTop - real) > 0.5) el.scrollTop = real
        return [{ el, bottom, scroll, atEnd, end, toScroll }]
      })
      const footerMoves = footersNow.map(({ el, bottom }, i) => ({
        el,
        steps: track(el.parentElement, bottom, ends.footers[i] ?? bottom),
        // The layout's own place for the footer, without its transform: the animation's transform replaces it.
        place: footerBase(el) - translateOf(el),
        height: el.getBoundingClientRect().height,
      }))
      // For a body that does not move: no child joins its move.
      const noChild = (child: Element): child is HTMLElement => child !== child
      const bodyShifts = bodyMoves.map(({ el, bottom, scroll, atEnd, end, toScroll }) => {
        const tracks = {
          bottom: track(el.parentElement, bottom, end.bottom),
          scroll: track(el.parentElement, scroll, toScroll),
          atEnd,
          real: el.scrollTop,
        }
        const shifts = tracks.scroll.values.map((value) => el.scrollTop - value)
        if (shifts.every((shift) => Math.abs(shift) < 0.5)) return { el, tracks, shifts, inView: noChild, children: [] }
        // Only the children in view at some time of the move move, each as one layer: a long thread does not become a
        // layer per entry.
        // A child left out is drawn at its place in the layout, a shift of 0: a move that starts part way (a keyboard
        // reported late) has no shift of 0, and a child at the view's edge that was out of view at every shift of the
        // move was still drawn there, and the moved children over it (screen review R44, the iPhone at 19:47: two layers
        // of the thread at its top as the keyboard opened).
        const top = el.getBoundingClientRect().top + el.clientTop
        const foot = top + el.clientHeight
        const lowest = Math.min(0, ...shifts)
        const highest = Math.max(0, ...shifts)
        const inView = (child: Element): child is HTMLElement => {
          if (!(child instanceof HTMLElement)) return false
          const box = child.getBoundingClientRect()
          return box.bottom + highest > top && box.top + lowest < foot
        }
        return { el, tracks, shifts, inView, children: [...el.children].filter(inView) }
      })
      for (const { el, steps, place, height } of footerMoves) {
        move.footers.set(el, steps)
        sizes.set(el, height)
        if (resized !== undefined && !watched.has(el)) {
          watched.add(el)
          resized.observe(el)
        }
        animate(
          el,
          steps,
          steps.values.map((value) => value - place),
        )
      }
      for (const { el, tracks, shifts, inView, children } of bodyShifts) {
        move.bodies.set(el, tracks)
        for (const child of children) animate(child, tracks.scroll, shifts, 'add')
        // A scroll during the move (a reader's flick, or a page that keeps its thread at the end) brings other children
        // into view, and a page may add a child (a new entry): each one in view moves with the others from then on, so
        // none is drawn at its place in the layout among them. The observer runs before the frame paints.
        if (shifts.some((shift) => Math.abs(shift) >= 0.5)) {
          const moved = new Set<Element>(children)
          const scrolled = () => {
            // All the reads first, then the animations (see above).
            const entering = [...el.children].filter((child) => !moved.has(child)).filter(inView)
            for (const child of entering) {
              moved.add(child)
              animate(child, tracks.scroll, shifts, 'add')
            }
          }
          el.addEventListener('scroll', scrolled, { passive: true })
          const added = typeof MutationObserver === 'undefined' ? undefined : new MutationObserver(scrolled)
          added?.observe(el, { childList: true })
          move.cleanups.push(() => {
            el.removeEventListener('scroll', scrolled)
            added?.disconnect()
          })
        }
      }
      move.clock.startTime = start
      moving = move
      // The move's end: the layout of the target and the bodies' end scroll positions, in the frame the animations end.
      move.clock.onfinish = () => {
        if (moving !== move) return
        stopMotion()
        if (applied !== move.target) lay(move.target)
        for (const [body, tracks] of move.bodies) {
          const end = body.scrollTop + tracks.scroll.to - tracks.real
          if (Math.abs(body.scrollTop - end) > 0.5) body.scrollTop = end
        }
        motionDone()
      }
    }
    // The dock moves to a new inset on the keyboard's curve over `keyboardMotion`, from where it is, on the keyboard's
    // own clock: a move starts when the keyboard started (`since`), so each frame shows the dock where the keyboard is
    // then, also a frame that comes late. A new target during a move starts a new move from there. With reduced
    // motion and no keyboard that slides (a mouse), it is there at once.
    let target = 0
    let from = 0
    let origin = 0
    // When the last target came, and the direction of its step, for `keyboardStepGap`.
    let lastTargetAt = Number.NEGATIVE_INFINITY
    let lastDirection = 0
    let lastQuick = false
    // Until when a report in the same direction as a frame step is one too, at any gap (see `stepping`).
    let stepUntil = Number.NEGATIVE_INFINITY
    // The time between two frames at the start of the dock's last move, for `keyboardStepGap`.
    let frameGap = 0
    let start = 0
    // The two frames at a move's start that time the frame gap; no frame of the move does anything else.
    let gapFrame: number | undefined
    // Whether the move has drawn no frame yet: until then the dock is still where the move began.
    let firstFrame = false
    const timeFrames = () => {
      if (gapFrame !== undefined) cancelAnimationFrame(gapFrame)
      gapFrame = requestAnimationFrame(() => {
        firstFrame = false
        const first = performance.now()
        gapFrame = requestAnimationFrame(() => {
          gapFrame = undefined
          frameGap = performance.now() - first
        })
      })
    }
    const motionDone = () => {
      from = target
    }
    // Where the dock is drawn at `now`, as an inset: on the move's curve, or at its target.
    const shownAt = (now: number) =>
      moving === undefined ? target : from + (target - from) * ease(Math.min(1, Math.max(0, (now - start) / keyboardMotion)))
    // `since` is when the keyboard started the motion that this target ends (see `keyboardSince`); now by default.
    const show = (inset: number, since = performance.now()) => {
      // The same inset again, as after a route change or a window resize, is laid out again for the new layout.
      if (inset === target) {
        if (moving === undefined) jump(inset)
        return
      }
      const now = performance.now()
      const shown = shownAt(now)
      const previous = target
      target = inset
      if (media('(prefers-reduced-motion: reduce)') && !slides()) {
        from = inset
        jump(inset)
        return
      }
      // A new target during a move keeps that move's end and curve: the rest of the curve takes the dock from where it
      // is to the new target, so a keyboard reported in the move makes one motion, not two (screen review R22). Late in
      // a move (past `keepEndUntil` of its time) the rest is too short for a change, so a new move starts.
      // A target back past where the move began (a reopen while the dock comes down, or a close after a correction)
      // starts a new move; a target on the same side of that place is a correction of this move. The place is kept in
      // `origin`: `from` is recomputed by a correction and can lie anywhere (Codex review of #236).
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
      if (stepping || (moving === undefined && small && Math.abs(inset - shown) <= keyboardFollow)) {
        from = inset
        origin = inset
        root.dataset.keyboardEnd = String(now)
        jump(inset)
        return
      }
      if (moving !== undefined && done < 1 && ahead && (elapsed < keepEndUntil || small)) {
        // Before the move's first frame nothing is drawn, so the move still starts where the dock is (Codex review of
        // #280).
        if (!firstFrame) from = (shown - inset * done) / (1 - done)
        glide(inset, start, from, shown)
        return
      }
      const wasMoving = moving !== undefined
      from = shown
      origin = shown
      start = Math.min(now, since)
      // The time the move ends, for a test or a trace to read: a correction keeps it and a new move sets it.
      root.dataset.keyboardEnd = String(start + keyboardMotion)
      if (!wasMoving) {
        firstFrame = true
        timeFrames()
      }
      glide(inset, start, from, shown)
    }
    // The keyboards measured last, per orientation, and the opening of one: from a field's focus until the keyboard's
    // measure settles, the dock rises with the keyboard's first report, to the reported inset, or to the expected one
    // for a report of an early step of the keyboard's rise, and does not come down for a smaller step of that rise.
    // It does not rise at the focus: iOS starts the keyboard 60 to 120 ms later, and a dock that rose at the focus was
    // up before the keyboard showed (screen review R37). It takes the measure as it is `blurEndDelay` after the last
    // resize (or `keyboardWait` after the focus with none), and keeps it for the next open. A layout that shrinks
    // meanwhile is a browser that resizes it for the keyboard: nothing is expected there again.
    const measured = keyboardMeasures
    const orientation = () => (document.documentElement.clientWidth > document.documentElement.clientHeight ? 'landscape' : 'portrait')
    // The visible area's shortfall with no field focused (see `measure`).
    let rest = 0
    let opening = false
    let openLayout = 0
    // The keyboard the current opening expects, and whether it was measured (or is Figma's guess).
    let expectedInset = 0
    let expectedMeasured = false
    // The distinct keyboard reports of the current opening, and whether this page saw a keyboard rise in frame steps:
    // an earlier opening with more than one report. iOS in a home screen app almost always reports a whole keyboard
    // once, so it seldom sets it there; Safari in a tab reports in frame steps, and sets it.
    let openReports = 0
    let lastReport = 0
    let steppedRise = false
    let settleTimer: ReturnType<typeof setTimeout> | undefined
    // When a field last took the focus, and when the focus last left the fields: the keyboard starts its motion no
    // earlier than these, and a close starts at the focusout.
    let focusedAt = Number.NEGATIVE_INFINITY
    let closedAt = Number.NEGATIVE_INFINITY
    // When the keyboard started the motion that a report shows: a close at its focusout (when that came within the
    // keyboard's motion), and anything else `keyboardReportLag` before the report, but not before the focus that
    // opened it.
    // `lag` is how long the keyboard has moved at the report, `keyboardReportLag` by default.
    const keyboardSince = (lag = keyboardReportLag) => {
      const now = performance.now()
      if (typing) return Math.max(focusedAt, now - lag)
      return now - closedAt <= keyboardMotion ? closedAt : now - keyboardReportLag
    }
    const settle = () => {
      settleTimer = undefined
      opening = false
      if (openReports > 1) steppedRise = true
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
      // During the opening, a report under the dock's target (while the dock is still down, the keyboard measured before
      // on this screen) is an early step of the keyboard's rise: it takes the dock to that target, or holds it there,
      // when the expected keyboard is one measured before on this screen. A Figma guess can be wrong: a report of at
      // least three quarters of it is the whole keyboard and is taken at once, so the dock does not wait for the settle
      // to come down (screen review R22). With the dock down and only a guess, a report is followed as it is: a
      // keyboard that reports in each frame starts under three quarters of the guess for several frames, and a move to
      // the guess would turn back on its next reports (`FrameStepsJank` on CI). The settle then only stores the measure.
      const hold = target > 0 ? target : expectedMeasured ? expectedInset : 0
      const early = opening && typing && inset > 1 && inset < hold && (expectedMeasured || inset < expectedInset * 0.75)
      // A report taken as the whole keyboard is kept for the next open at once: a blur before the settle (a press on
      // Send) would otherwise lose it.
      if (opening && typing && !early && inset > 1) measured.set(orientation(), inset)
      if (opening && typing && inset > 1 && inset !== lastReport) {
        openReports += 1
        lastReport = inset
      }
      // A late partial report: the first report of an opening that shows only part of the expected keyboard (r/E < 1)
      // can come well after the keyboard started, when the page's frame is held (a busy main thread). The curve says how
      // long the keyboard has moved to reach that part, so the move starts that far back, not only `keyboardReportLag`,
      // and ends with the keyboard (`FirstReportHeld`; a dock 50 ms behind left the composer up to 4 px under it after
      // it stopped, `FrameStepsJank` on CI). A full first report keeps `keyboardReportLag`: iOS in a home screen app
      // reports a whole keyboard once, and the curve would date it 300 ms back. Only a measured keyboard tells a part
      // from the whole: a first open's whole keyboard can be under Figma's guess (336 against 380, `KeyboardFollow`).
      // And only a page that saw a keyboard rise in frame steps (`steppedRise`) gets a partial first report: a second
      // open's whole keyboard can be shorter than the measured one (a number pad, an accessory bar), and its one full
      // report would read as a part and date the move back past the keyboard's start (`ShorterKeyboard`, Codex review
      // of #319).
      const partial = steppedRise && opening && typing && expectedMeasured && target === 0 && inset > 1 && inset < expectedInset
      const lag = partial ? Math.max(keyboardReportLag, curveTime(inset / expectedInset)) : keyboardReportLag
      show(early ? hold : inset, keyboardSince(lag))
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
    // With no keyboard open yet, an opening starts: the dock rises with the keyboard's first report (see `fit`).
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
      if (!was) focusedAt = performance.now()
      if (!was && measure() <= rest + 1 && expected > 0 && keyboardExpected()) {
        opening = true
        openReports = 0
        lastReport = 0
        openLayout = document.documentElement.clientHeight
        scheduleSettle(keyboardWait)
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
      if (typing) return
      // A close is never a frame step of the opening keyboard, however soon it comes (Codex review of #274).
      lastQuick = false
      closedAt = performance.now()
      scheduleEnd()
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
    // Whether the press that is down is on a control that acts on its click (`pressControl`), and whether the shell
    // blurs the field for a tap outside it, whose click it swallows.
    let pressOnControl = false
    let tapClosing = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let frame: number | undefined
    const press = (event: PointerEvent) => {
      pressing = true
      pressOnControl = event.target instanceof Element && event.target.closest(pressControl) !== null
    }
    // Whether the dock must stay up for the press that is down: a press on a control, whose click must land where it
    // started. A tap that the shell turns into a close swallows its click, and a press elsewhere (a drag of the thread)
    // has no click to miss, so the dock falls with the keyboard under them.
    const holdForPress = () => pressing && pressOnControl && !tapClosing
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
      tapClosing = true
      try {
        focused.blur()
      } finally {
        tapClosing = false
      }
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
    // Where iOS slides its keyboard, the keyboard starts to fall at the focusout, and so does the dock, on the
    // keyboard's clock from the focusout (`closedAt`), in its next frame, unless a field has the focus again once the
    // task that blurred is done (a script that moves the focus with a blur and a focus). It does not wait for the
    // visual viewport's report, which iOS sends 25 to 80 ms into the fall (screen review R37). Only a press on a
    // control holds it until the release, as below.
    const scheduleEnd = () => {
      cancelEnd()
      if (slides() && !holdForPress()) timer = setTimeout(fall, 0)
      else if (pressing) waitForRelease()
      else timer = setTimeout(end, blurEndDelay)
    }
    // The fall does not measure: iOS has not reported the close yet, so the visual viewport is still short by the
    // keyboard, and a measure with no field focused would keep that as the rest shortfall. A field focused again before
    // the report would then count no keyboard as open and leave the dock down until the settle (Codex review of #312).
    // The report that comes later measures and fits as usual.
    const fall = () => {
      timer = undefined
      if (editable(document.activeElement)) return
      typing = false
      show(0, keyboardSince())
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
      if (gapFrame !== undefined) cancelAnimationFrame(gapFrame)
      stopMotion()
      resized?.disconnect()
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

/**
 * The event that `AppShell` sends its root element (`.app-shell__root`, not bubbling) at the start of each move of the
 * keyboard dock, before it measures the page: a `CustomEvent` whose `detail` is an `AppShellDockDetail`. A listener
 * may change the page's layout in it, at once (in React, with `flushSync`), such as a composer that grows while the
 * keyboard is open: the move then takes that change on the keyboard's curve, so it does not jump before or after.
 */
export const appShellDockEvent = 'app-shell-dock'

/** The `detail` of the `appShellDockEvent`. */
export type AppShellDockDetail = {
  /** How tall the on-screen keyboard is at the move's end, in CSS px; 0 when the move closes it. */
  inset: number
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
 * area stays under it. Where the keyboard slides (iOS), each move is a set of
 * transform animations on the keyboard's curve, started once: the layout
 * changes only at the move's start (a close) or end (an open), and
 * `appShellDockEvent` tells the page when a move starts. It does so only while a text field has
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
