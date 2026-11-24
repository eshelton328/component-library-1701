import { Dialog as ArkDialog, useDialogContext } from '@ark-ui/react/dialog'
import { usePresence } from '@ark-ui/react/presence'
import { OverlayPortal } from './overlay-layer'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type RefObject, type ComponentProps, type PointerEvent as ReactPointerEvent, type ReactElement, type ReactNode } from 'react'
import { CloseIcon } from '../foundations/icons'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { bottomSheet, type BottomSheetVariantProps } from '../../styled-system/recipes'
import type { Scalar } from './scalar'
import { useInputModality } from './input-modality'

const { withRootProvider, withContext } = createSlotRecipeContext(bottomSheet)
const Root = withRootProvider(ArkDialog.Root)
const Backdrop = withContext(ArkDialog.Backdrop, 'backdrop')
const Positioner = withContext(ArkDialog.Positioner, 'positioner')
const Content = withContext(ArkDialog.Content, 'content')
const Grabber = withContext('div', 'grabber')
const Header = withContext('div', 'header')
const Title = withContext(ArkDialog.Title, 'title')
const HeaderLeading = withContext('div', 'headerLeading')
const HeaderActions = withContext('div', 'headerActions')
const CloseTrigger = withContext(ArkDialog.CloseTrigger, 'closeTrigger')
const Lifted = withContext('div', 'lifted')

/**
 * A copy of a page element that a sheet draws over its scrim, such as the held chat row of Workspaces M9 (146:252),
 * bright where the rest of the page is dimmed.
 */
export type BottomSheetLifted = {
  /**
   * The copy to draw, such as the row in a `DragPreview`'s border. It takes no pointer events: a tap on it reaches
   * the scrim and closes the sheet. It is hidden from assistive technology; the element it copies keeps its name.
   */
  content: ReactNode
  /**
   * The page element it lifts, or a ref to it. While the sheet is open, the copy takes the element's place and size,
   * measured as the sheet opens and again when the visual viewport resizes or scrolls, and the element keeps its
   * place with `visibility: hidden`, so the page does not move. The sheet's close shows it again.
   */
  anchor: HTMLElement | RefObject<HTMLElement | null> | null
}

/**
 * Give a sheet either a `title`, which shows in the title row and names the sheet for assistive technology, or a
 * `label`, which names a sheet that has no visible title, such as the chat actions sheet.
 */
export type BottomSheetProps = ({ title: string; label?: undefined } | { title?: undefined; label: string }) & {
  /** The content under the title, such as the rows of a sort or snooze sheet. */
  children?: ReactNode
  /** The element that opens the sheet, such as a `Button`. Leave it out to open the sheet with `open`. */
  trigger?: ReactElement | undefined
  /** Whether the sheet is open. Set it with `onOpenChange` to control the sheet. When set, `defaultOpen` has no effect. */
  open?: boolean | undefined
  defaultOpen?: boolean | undefined
  onOpenChange?: ((open: boolean) => void) | undefined
  /** Show a close button at the end of the title row, as the tablet side chat does. It needs a `title`. */
  closeButton?: boolean | undefined
  /**
   * Buttons at the end of the title row, such as Done, Clear or Add. Wrap one in `BottomSheetClose` to close the
   * sheet with it. It needs a `title`.
   */
  actions?: ReactNode
  /**
   * A button at the start of the title row, such as Cancel. With it, the title is centred between the start and
   * the end of the row, as the Add a link sheet draws it. It needs a `title`.
   */
  leading?: ReactNode
  /** The element that gets the focus when the sheet opens. When not set, Ark picks the first element that takes the focus. */
  initialFocus?: (() => HTMLElement | null) | undefined
  /** `md` (the default) has a 17 px title, as the snooze and sort sheets do. `sm` has a 15 px title, as the Workbench chat actions sheet does. */
  size?: 'sm' | 'md' | undefined
  /**
   * `true` (the default) draws the `overlay.scrim` backdrop over the page behind the sheet. `false` draws no scrim,
   * so the page above the sheet keeps its full colour and stays readable, as the tablet side chat sheet does
   * (Workspaces T2 105:1914). The sheet behaves the same either way: it keeps the focus inside, and a press outside
   * it closes it (the press does not reach the page under it) and gives the focus back, unless `closeOn` says
   * otherwise.
   */
  scrim?: boolean | undefined
  /**
   * What closes the sheet. Not set (the default): Escape, the close button, `BottomSheetClose`, a swipe down from
   * the grabber, the title row or the content at its top, and a press or a focus outside the sheet. `explicit`: only
   * the close button, `BottomSheetClose`, a swipe down from the grabber and Escape, so a press on the page behind
   * (with no scrim), a swipe on the title or the content, a focus outside and the keyboard opening or closing never
   * close it, as the side chat needs while the user types (screen review R71). `scrim`: those and a press on the
   * scrim; with `scrim={false}` it is the same as `explicit`. A press outside that does not close the sheet does
   * not reach the page under it either.
   */
  closeOn?: 'explicit' | 'scrim' | undefined
  /**
   * Dock the sheet on the on-screen keyboard, as `AppShell` docks the composer: while a field in the sheet has the
   * focus, the sheet moves up with the keyboard, on the keyboard's curve and clock, until its content ends 8 px above
   * the keyboard, and it gets shorter where it would pass the top of the window. Only the sheet moves then; the
   * page's own composer stays where it is. The sheet also does not fix the page's body while it is open (Ark's
   * scroll lock), so iOS does not jump the page when the field takes the focus (screen review R71). It docks only on
   * a page in an `AppShell`, which runs the dock.
   */
  keyboardDock?: boolean | undefined
  /** A copy of a page element to draw over the scrim, at that element's place, such as a held row (M9). */
  lifted?: BottomSheetLifted | undefined
}

// Omit `size` from each member of the union, so the title or label choice stays.
type WithoutSize<T> = T extends unknown ? Omit<T, 'size'> : never

/**
 * A sheet at the bottom of the window on a scrim, with a grabber at the top: the snooze,
 * sort and chat actions sheets of the phone. With `scrim={false}` it draws no
 * scrim, as the tablet side chat does. It keeps the focus inside while it is
 * open; Escape, a click outside it (on the scrim, or on the page with no
 * scrim), `BottomSheetClose` and a swipe down close it, and the focus goes
 * back to the trigger. `closeOn` limits what closes it, and `keyboardDock`
 * docks it on the on-screen keyboard (the side chat, screen review R71).
 *
 * Swipe to close: a downward touch or pen drag from the grabber or the title
 * row, or from the content when it is scrolled to the top, moves the sheet
 * with the finger. A mouse moves it only by the grabber; a mouse drag
 * anywhere else selects text and leaves the sheet in place. A release past
 * 30% of the sheet's height, or a fast flick down, closes it through
 * `onOpenChange(false)`, as the scrim does; a shorter slow drag puts it back.
 * A drag inside content that is scrolled down scrolls the content and leaves
 * the sheet in place, and a drag in a text field never moves the sheet.
 *
 * Motion: the sheet slides up as its scrim fades in (`durations.sheetOpen`),
 * and the close reverses both (`durations.sheetClose`), on `easings.sheet`.
 * A swiped sheet slides down from where the finger let it go. With
 * prefers-reduced-motion the sheet only fades.
 */
export function BottomSheet(input: BottomSheetProps) {
  return <SizedBottomSheet {...input} />
}

type SizedBottomSheetProps = WithoutSize<BottomSheetProps> &
  Scalar<BottomSheetVariantProps> & {
    /**
     * Give the focus to the sheet itself when it opens, not to its first
     * element, so no item draws a focus ring until the user moves to one (the
     * More drawer). Tab then moves to the first element. `initialFocus` wins.
     */
    focusSheet?: boolean | undefined
  }

/**
 * The bottom sheet with every size, for the parts built on it: `sm` and
 * `md` are the sheets, `lg` the More drawer, with a larger title. The
 * package does not export it, so `BottomSheetProps` offers only `sm` and `md`.
 */
export function SizedBottomSheet({
  title,
  label,
  children,
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  closeButton = false,
  actions,
  leading,
  initialFocus,
  size,
  scrim = true,
  closeOn,
  keyboardDock = false,
  focusSheet = false,
  lifted,
}: SizedBottomSheetProps) {
  useInputModality()
  const hasLeading = present(leading)
  // The sheet's own id, so the focus can find it when it opens.
  const contentId = useId()
  const firstFocus = initialFocus ?? (focusSheet ? () => document.getElementById(contentId) : undefined)
  // The element that had the focus when the sheet opened, such as its trigger.
  const returnToRef = useRef<HTMLElement | null>(null)
  return (
    <Root
      size={size}
      lazyMount
      unmountOnExit
      {...(focusSheet ? { ids: { content: contentId } } : {})}
      {...(firstFocus === undefined ? {} : { initialFocusEl: firstFocus })}
      {...(open === undefined ? {} : { open })}
      {...(open === undefined && defaultOpen !== undefined ? { defaultOpen } : {})}
      {...(keyboardDock ? { preventScroll: false } : {})}
      {...(closeOn === undefined ? {} : outsideRules(closeOn === 'scrim' && scrim))}
      onOpenChange={(details) => {
        onOpenChange?.(details.open)
      }}
    >
      <FocusOrigin returnToRef={returnToRef} />
      {trigger === undefined ? null : <ArkDialog.Trigger asChild>{trigger}</ArkDialog.Trigger>}
      <OverlayPortal>
        {scrim ? <Backdrop /> : null}
        {lifted === undefined ? null : <LiftedCopy lifted={lifted} />}
        <Positioner data-keyboard-dock={keyboardDock ? '' : undefined}>
          {/* The name stays set when a title replaces the label while the sheet is open: Ark looks for the title only when it opens. */}
          <DraggableContent aria-label={title ?? label} returnToRef={returnToRef} grabberOnly={closeOn !== undefined} keepFocusInView={keyboardDock}>
            <Grabber aria-hidden="true" data-drag-handle="grabber" />
            {title === undefined ? null : (
              <Header data-leading={hasLeading ? '' : undefined} data-drag-handle="title">
                {hasLeading ? <HeaderLeading>{leading}</HeaderLeading> : null}
                <Title>{title}</Title>
                {present(actions) ? <HeaderActions>{actions}</HeaderActions> : null}
                {closeButton ? (
                  <CloseTrigger aria-label="Close">
                    <CloseIcon size="16" />
                  </CloseTrigger>
                ) : null}
              </Header>
            )}
            {children}
          </DraggableContent>
        </Positioner>
      </OverlayPortal>
    </Root>
  )
}

// The outside rules of a sheet with `closeOn`: a focus outside never closes it, and a press outside closes it only
// on a scrim (`onScrim`). The sheet's layer takes every press outside it (its positioner covers the window, over the
// scrim), so a press there is on the scrim when a scrim is drawn.
function outsideRules(onScrim: boolean) {
  return {
    closeOnInteractOutside: onScrim,
    onFocusOutside: (event: { preventDefault: () => void }) => {
      event.preventDefault()
    },
  }
}

// Notes the element that has the focus as the sheet opens, before Ark moves the focus into it.
function FocusOrigin({ returnToRef }: { returnToRef: RefObject<HTMLElement | null> }) {
  const { open } = useDialogContext()
  useLayoutEffect(() => {
    if (!open) return
    const active = document.activeElement
    returnToRef.current = active instanceof HTMLElement && active !== document.body ? active : null
  }, [open, returnToRef])
  return null
}

// When the sheet has unmounted, gives the focus back to the element that had it at the open, if the focus was lost
// with the sheet. Ark returns the focus only after its focus trap is on; a sheet closed in its first frames (a fast
// pick, before the open motion starts) unmounts with the focus inside it, and the focus would fall to the body.
function returnFocus(returnToRef: RefObject<HTMLElement | null>) {
  const target = returnToRef.current
  returnToRef.current = null
  const active = document.activeElement
  if (target === null || !target.isConnected) return
  if (active === null || active === document.body) target.focus({ preventScroll: true })
}

// The copy of `lifted.anchor` over the scrim, while the sheet is open. It comes after the scrim in the sheet's layer,
// so it paints over it, and before the sheet's box, which paints over it where they meet.
const placeTries = 10

function LiftedCopy({ lifted }: { lifted: BottomSheetLifted }) {
  const { open } = useDialogContext()
  const ref = useRef<HTMLDivElement>(null)
  const { anchor } = lifted
  // A ref to an element later in the tree than the sheet is set only after this effect runs in the sheet's first
  // commit (a sheet open from the start). The effect then tries again on the next frames, at most `placeTries` times,
  // so a ref that is never set does not render on each frame; the copy stays hidden until it is placed (`data-placed`).
  const [tries, setTries] = useState(0)
  // Each open gets its own tries, also after an open that spent them all.
  const [triedOpen, setTriedOpen] = useState(open)
  if (open !== triedOpen) {
    setTriedOpen(open)
    setTries(0)
  }
  // The copy stays, and the anchor hidden, until the scrim has faded (`_closed` holds it for sheetClose).
  const presence = usePresence({ present: open, lazyMount: true, unmountOnExit: true })
  const { present: shown, ref: presenceRef } = presence
  const setCopy = useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node
      presenceRef(node)
    },
    [presenceRef],
  )
  useLayoutEffect(() => {
    const target = anchor instanceof HTMLElement ? anchor : (anchor?.current ?? null)
    const copy = ref.current
    if (!shown || copy === null) return undefined
    if (target === null) {
      if (tries >= placeTries) return undefined
      const frame = requestAnimationFrame(() => {
        setTries((n) => n + 1)
      })
      return () => {
        cancelAnimationFrame(frame)
      }
    }
    copy.setAttribute('data-placed', '')
    const place = () => {
      const box = target.getBoundingClientRect()
      copy.style.setProperty('--bottom-sheet-lifted-top', `${String(box.top)}px`)
      copy.style.setProperty('--bottom-sheet-lifted-left', `${String(box.left)}px`)
      copy.style.setProperty('--bottom-sheet-lifted-width', `${String(box.width)}px`)
      copy.style.setProperty('--bottom-sheet-lifted-height', `${String(box.height)}px`)
    }
    place()
    const visibility = target.style.getPropertyValue('visibility')
    const priority = target.style.getPropertyPriority('visibility')
    target.style.setProperty('visibility', 'hidden')
    const viewport = target.ownerDocument.defaultView?.visualViewport ?? null
    viewport?.addEventListener('resize', place)
    viewport?.addEventListener('scroll', place)
    return () => {
      viewport?.removeEventListener('resize', place)
      viewport?.removeEventListener('scroll', place)
      if (visibility === '') target.style.removeProperty('visibility')
      else target.style.setProperty('visibility', visibility, priority)
    }
  }, [shown, anchor, tries])
  if (presence.unmounted === true || !shown) return null
  return (
    <Lifted ref={setCopy} aria-hidden="true" data-state={open ? 'open' : 'closed'}>
      {lifted.content}
    </Lifted>
  )
}

function present(node: ReactNode) {
  return node !== undefined && node !== null && node !== false
}

/** An element that closes the sheet it is in, such as a Cancel button or a row that picks a value. Wrap it in this. */
export function BottomSheetClose({ children }: { children: ReactElement }) {
  // Ark gives every close trigger of a dialog the same id; each one gets its own.
  const id = useId()
  return (
    <ArkDialog.CloseTrigger asChild id={id}>
      {children}
    </ArkDialog.CloseTrigger>
  )
}

// Swipe to close (screen review R13).
/** Pixels a press moves down before it becomes a drag, so a tap on a row or a button still clicks. */
const dragStart = 8
/** The share of the sheet's height past which a release closes it. */
const closeShare = 0.3
/** Pixels per millisecond: a release faster than this closes the sheet, however short the drag. */
const flickSpeed = 0.5
/** Milliseconds of the last moves that set the release speed. */
const flickWindow = 100
/** Milliseconds a swiped sheet waits for its close to start; after that its owner kept it open, and it springs back. */
const refuseWait = 100
/** The offset of a dragged sheet; the recipe moves the content by it while `data-dragging` is set. */
const dragOffset = '--bottom-sheet-drag'

/** The elements a press selects text in, so a drag there is a selection, not a swipe. */
const editableTarget = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])'

type Sample = { y: number; t: number }
type Drag = { pointerId: number; startY: number; handle: boolean; active: boolean; samples: Sample[]; stop: () => void }

// True when the press is inside content that is scrolled down, so a drag there scrolls it.
function scrolledDown(target: Element, sheet: HTMLElement) {
  for (let el: Element | null = target; el !== null; el = el.parentElement) {
    if (el.scrollTop > 0) return true
    if (el === sheet) return false
  }
  return false
}

function releaseSpeed(samples: Sample[], now: number) {
  const recent = samples.filter((s) => now - s.t <= flickWindow)
  const first = recent[0]
  const last = recent[recent.length - 1]
  if (first === undefined || last === undefined || first === last) return 0
  return (last.y - first.y) / Math.max(1, last.t - first.t)
}

// Puts a dragged sheet back at its rest.
function reset(sheet: HTMLElement) {
  sheet.removeAttribute('data-dragging')
  sheet.style.removeProperty(dragOffset)
}

// The sheet's box, with the drag that closes it. It must render inside the dialog's Root.
// With `grabberOnly` (a sheet with `closeOn`), only a drag that starts on the grabber moves the sheet. With
// `keepFocusInView` (a `keyboardDock` sheet), a sheet that gets shorter scrolls its content so the focused element
// stays in view.
function DraggableContent({
  children,
  returnToRef,
  grabberOnly,
  keepFocusInView,
  ...props
}: ComponentProps<typeof Content> & { returnToRef: RefObject<HTMLElement | null>; grabberOnly: boolean; keepFocusInView: boolean }) {
  const dialog = useDialogContext()
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)

  // When the content unmounts, this cleanup runs after React has removed it, and gives the focus back if it was
  // lost with the sheet. In Strict Mode, React also runs it once while the sheet stays in the page; the sheet is
  // still connected then, so it does nothing and keeps the element to return to.
  useEffect(() => {
    const sheet = ref.current
    return () => {
      if (sheet !== null && !sheet.isConnected) returnFocus(returnToRef)
    }
  }, [returnToRef])

  // A docked sheet gets shorter by the keyboard's height at the open's end (its recipe's max height), and its content
  // keeps its scroll position, so a field near the content's end went under the sheet's end (Codex review of #347).
  // When the sheet gets shorter, its content scrolls just enough to show the focused element again. The observer
  // reports after the layout and before the paint, so no frame shows the field cut off.
  useEffect(() => {
    const sheet = ref.current
    if (!keepFocusInView || sheet === null || typeof ResizeObserver === 'undefined') return undefined
    let height = sheet.clientHeight
    const watch = new ResizeObserver(() => {
      const was = height
      height = sheet.clientHeight
      const focused = sheet.ownerDocument.activeElement
      if (height >= was || !(focused instanceof HTMLElement) || focused === sheet || !sheet.contains(focused)) return
      const view = sheet.getBoundingClientRect().top + sheet.clientTop + sheet.clientHeight - (Number.parseFloat(getComputedStyle(sheet).paddingBottom) || 0)
      const below = focused.getBoundingClientRect().bottom - view
      if (below > 0) sheet.scrollTop += below
    })
    watch.observe(sheet)
    return () => {
      watch.disconnect()
    }
  }, [keepFocusInView])

  // A sheet that opens again while its swipe close still runs keeps its element, so it drops the drag offset
  // that the close slid down from, and opens at its rest.
  useEffect(() => {
    const sheet = ref.current
    if (dialog.open && sheet !== null && drag.current === null) reset(sheet)
  }, [dialog.open])

  useEffect(() => {
    const sheet = ref.current
    if (sheet === null) return undefined
    // A touch drag of the content would scroll the page or start a pull to refresh; a sheet drag takes it.
    const hold = (event: TouchEvent) => {
      if (drag.current?.active === true) event.preventDefault()
    }
    sheet.addEventListener('touchmove', hold, { passive: false })
    return () => {
      sheet.removeEventListener('touchmove', hold)
      drag.current?.stop()
    }
  }, [])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    props.onPointerDown?.(event)
    if (!event.isPrimary || event.button !== 0 || drag.current !== null) return
    const sheet = event.currentTarget
    const target = event.target
    if (!(target instanceof Element)) return
    const handle = target.closest(grabberOnly ? '[data-drag-handle="grabber"]' : '[data-drag-handle]') !== null
    if (grabberOnly && !handle) return
    // A mouse drag selects text, so with a mouse only the grabber, which has no text, moves the sheet.
    if (event.pointerType === 'mouse' && target.closest('[data-drag-handle="grabber"]') === null) return
    // A press in a text field selects text or moves the caret; it never drags the sheet.
    if (!handle && target.closest(editableTarget) !== null) return
    if (!handle && scrolledDown(target, sheet)) return
    const win = sheet.ownerDocument.defaultView ?? window
    const move = (e: PointerEvent) => {
      const d = drag.current
      if (d === null || e.pointerId !== d.pointerId) return
      const dy = e.clientY - d.startY
      if (!d.active) {
        // An upward move in the content is a scroll, not a drag.
        if (dy < -dragStart && !d.handle) d.stop()
        if (dy <= dragStart) return
        d.active = true
        sheet.setAttribute('data-dragging', '')
      }
      e.preventDefault()
      d.samples.push({ y: e.clientY, t: performance.now() })
      sheet.style.setProperty(dragOffset, `${String(Math.max(0, dy))}px`)
    }
    const up = (e: PointerEvent) => {
      const d = drag.current
      if (d === null || e.pointerId !== d.pointerId) return
      d.stop()
      if (!d.active) return
      // The press ended a drag, so it is not a click on the row or button under it.
      const swallow = (c: MouseEvent) => {
        c.stopPropagation()
        c.preventDefault()
      }
      win.addEventListener('click', swallow, { capture: true, once: true })
      win.setTimeout(() => {
        win.removeEventListener('click', swallow, { capture: true })
      }, 0)
      const offset = Math.max(0, e.clientY - d.startY)
      const far = offset > sheet.getBoundingClientRect().height * closeShare
      const fast = releaseSpeed(d.samples, performance.now()) > flickSpeed
      if (!(far || fast)) {
        // Too short and too slow: the sheet springs back.
        reset(sheet)
        return
      }
      // The close slides the sheet down from the drag offset, so it keeps the offset until it unmounts. A
      // controlled sheet whose owner keeps it open springs back.
      dialog.setOpen(false)
      win.setTimeout(() => {
        if (sheet.getAttribute('data-state') !== 'closed') reset(sheet)
      }, refuseWait)
    }
    const cancel = (e: PointerEvent) => {
      const d = drag.current
      if (d === null || e.pointerId !== d.pointerId) return
      d.stop()
      reset(sheet)
    }
    const stop = () => {
      win.removeEventListener('pointermove', move)
      win.removeEventListener('pointerup', up)
      win.removeEventListener('pointercancel', cancel)
      drag.current = null
    }
    drag.current = { pointerId: event.pointerId, startY: event.clientY, handle, active: false, samples: [{ y: event.clientY, t: performance.now() }], stop }
    win.addEventListener('pointermove', move)
    win.addEventListener('pointerup', up)
    win.addEventListener('pointercancel', cancel)
  }

  return (
    <Content {...props} ref={ref} onPointerDown={onPointerDown}>
      {children}
    </Content>
  )
}
