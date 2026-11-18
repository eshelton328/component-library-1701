import { Dialog as ArkDialog, useDialogContext } from '@ark-ui/react/dialog'
import { Portal } from '@ark-ui/react/portal'
import { useEffect, useId, useRef, type ComponentProps, type PointerEvent as ReactPointerEvent, type ReactElement, type ReactNode } from 'react'
import { CloseIcon } from '../foundations/icons'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { bottomSheet, type BottomSheetVariantProps } from '../../styled-system/recipes'
import type { Scalar } from './scalar'

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
}

// Omit `size` from each member of the union, so the title or label choice stays.
type WithoutSize<T> = T extends unknown ? Omit<T, 'size'> : never

/**
 * A sheet at the bottom of the window on a scrim, with a grabber at the top: the snooze,
 * sort and chat actions sheets of the phone. It keeps the focus inside while
 * it is open; Escape, a click on the scrim, `BottomSheetClose` and a swipe
 * down close it, and the focus goes back to the trigger.
 *
 * Swipe to close: a downward drag from the grabber or the title row, or from
 * the content when it is scrolled to the top, moves the sheet with the finger
 * (or the mouse). A release past 30% of the sheet's height, or a fast flick
 * down, closes it through `onOpenChange(false)`, as the scrim does; a shorter
 * slow drag puts it back. A drag inside content that is scrolled down scrolls
 * the content and leaves the sheet in place.
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
export function SizedBottomSheet({ title, label, children, trigger, open, defaultOpen, onOpenChange, closeButton = false, actions, leading, initialFocus, size, focusSheet = false }: SizedBottomSheetProps) {
  const hasLeading = present(leading)
  // The sheet's own id, so the focus can find it when it opens.
  const contentId = useId()
  const firstFocus = initialFocus ?? (focusSheet ? () => document.getElementById(contentId) : undefined)
  return (
    <Root
      size={size}
      lazyMount
      unmountOnExit
      {...(focusSheet ? { ids: { content: contentId } } : {})}
      {...(firstFocus === undefined ? {} : { initialFocusEl: firstFocus })}
      {...(open === undefined ? {} : { open })}
      {...(open === undefined && defaultOpen !== undefined ? { defaultOpen } : {})}
      onOpenChange={(details) => {
        onOpenChange?.(details.open)
      }}
    >
      {trigger === undefined ? null : <ArkDialog.Trigger asChild>{trigger}</ArkDialog.Trigger>}
      <Portal>
        <Backdrop />
        <Positioner>
          {/* The name stays set when a title replaces the label while the sheet is open: Ark looks for the title only when it opens. */}
          <DraggableContent aria-label={title ?? label}>
            <Grabber aria-hidden="true" data-drag-handle="" />
            {title === undefined ? null : (
              <Header data-leading={hasLeading ? '' : undefined} data-drag-handle="">
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
      </Portal>
    </Root>
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
/** The offset of a dragged sheet; the recipe moves the content by it while `data-dragging` is set. */
const dragOffset = '--bottom-sheet-drag'

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

// The sheet's box, with the drag that closes it. It must render inside the dialog's Root.
function DraggableContent({ children, ...props }: ComponentProps<typeof Content>) {
  const dialog = useDialogContext()
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)

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

  const reset = (sheet: HTMLElement) => {
    sheet.removeAttribute('data-dragging')
    sheet.style.removeProperty(dragOffset)
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    props.onPointerDown?.(event)
    if (!event.isPrimary || event.button !== 0 || drag.current !== null) return
    const sheet = event.currentTarget
    const target = event.target
    if (!(target instanceof Element)) return
    const handle = target.closest('[data-drag-handle]') !== null
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
      // Back in place; a closing sheet unmounts before the next frame, an open one springs back.
      reset(sheet)
      if (far || fast) dialog.setOpen(false)
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
