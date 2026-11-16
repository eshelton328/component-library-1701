import { Portal } from '@ark-ui/react/portal'
import { Tooltip as ArkTooltip } from '@ark-ui/react/tooltip'
import { type ReactElement, type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createSlotRecipeContext, styled } from '../../styled-system/jsx'
import { tooltip, truncatedText } from '../../styled-system/recipes'

const { withRootProvider, withContext } = createSlotRecipeContext(tooltip)
const Root = withRootProvider(ArkTooltip.Root)
const Positioner = withContext(ArkTooltip.Positioner, 'positioner')
const Content = withContext(ArkTooltip.Content, 'content')

export type TooltipProps = {
  /** The element the tooltip describes. It must pass its props and ref to a DOM element. */
  children: ReactElement
  /** The text of the tooltip. */
  content: ReactNode
  /** Whether the tooltip is open. Set it with `onOpenChange` to control the tooltip. */
  open?: boolean | undefined
  onOpenChange?: ((open: boolean) => void) | undefined
  /** Where the tooltip opens next to the element; `top` when not set. */
  placement?: 'top' | 'top-start' | 'bottom' | 'bottom-start' | undefined
  /** When true, the tooltip never opens. */
  disabled?: boolean | undefined
}

// The pointer handlers of the tooltip box, for TruncatedText inside a focusable element.
type ContentPointer = { onPointerEnter?: (() => void) | undefined; onPointerLeave?: (() => void) | undefined }

function TooltipBase({ children, content, open, onOpenChange, placement = 'top', disabled, contentPointer }: TooltipProps & { contentPointer?: ContentPointer | undefined }) {
  return (
    <Root
      positioning={{ placement, gutter: 6 }}
      lazyMount
      unmountOnExit
      // The pointer can move onto the tooltip, and it stays open there (WCAG 1.4.13).
      interactive
      {...(open === undefined ? {} : { open })}
      {...(disabled === undefined ? {} : { disabled })}
      onOpenChange={(details) => {
        onOpenChange?.(details.open)
      }}
    >
      <ArkTooltip.Trigger asChild>{children}</ArkTooltip.Trigger>
      <Portal>
        <Positioner>
          <Content {...contentPointer}>{content}</Content>
        </Positioner>
      </Portal>
    </Root>
  )
}

/**
 * A short text that shows next to an element while the pointer rests on it
 * or it has the keyboard focus. The pointer can move onto the tooltip, and
 * it stays open there. Escape, a click or moving away closes it. Do not put
 * anything in it that the page shows nowhere else: touch screens never open
 * it.
 */
export function Tooltip(input: TooltipProps) {
  return <TooltipBase {...input} />
}

const Text = styled('span', truncatedText)

// Elements that can take the focus.
const focusable = 'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable="true"], [contenteditable=""]'
// Roles whose items take the focus by arrow keys (a roving tab index), so an item with tabindex -1 is still reached.
const rovingRoles = new Set(['treeitem', 'tab', 'option', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'gridcell', 'row', 'radio'])

// The nearest element around `node` that the keyboard reaches, so the text inside it needs no tab stop of its own.
// A container with tabindex -1, such as a dialog, is skipped: the keyboard never lands on it.
function focusOwner(node: HTMLElement): HTMLElement | null {
  let candidate = node.parentElement?.closest<HTMLElement>(focusable) ?? null
  while (candidate !== null) {
    if (candidate.tabIndex >= 0 || rovingRoles.has(candidate.getAttribute('role') ?? '')) return candidate
    candidate = candidate.parentElement?.closest<HTMLElement>(focusable) ?? null
  }
  return null
}

export type TruncatedTextProps = {
  /** The text. It shows on one line and ends with an ellipsis when it does not fit. */
  children: string
  /** Where the tooltip opens; `top` when not set. */
  placement?: TooltipProps['placement']
}

// How long the pointer rests on an element before its tooltip opens, and how long the tooltip waits after the
// pointer leaves before it closes, so the pointer can cross onto it. Ark's tooltip uses the same delays.
const OPEN_DELAY = 400
const CLOSE_DELAY = 150

/**
 * Text on one line that ends with an ellipsis when it is too long, and then
 * shows the whole text in a `Tooltip` while the pointer rests on it or it
 * has the keyboard focus. It measures itself again when its size changes.
 * When the text fits there is no tooltip. The element always holds the whole
 * text, so assistive technology reads all of it; the tooltip only shows it.
 *
 * Inside a button, link or other element that takes the focus, such as a map
 * node or a card's title button, the tooltip opens while the pointer rests
 * anywhere on that element or it has the keyboard focus. Anywhere else, cut
 * text becomes a tab stop of its own; text that fits never does.
 */
export function TruncatedText({ children, placement }: TruncatedTextProps) {
  const [element, setElement] = useState<HTMLSpanElement | null>(null)
  const [cut, setCut] = useState(false)
  const [owner, setOwner] = useState<HTMLElement | null>(null)
  const [hoverOpen, setHoverOpen] = useState(false)
  const [ownerHover, setOwnerHover] = useState(false)
  const [ownerFocus, setOwnerFocus] = useState(false)

  const ref = useCallback((node: HTMLSpanElement | null) => {
    setElement(node)
    setOwner(node === null ? null : focusOwner(node))
  }, [])

  // Measure on mount, when the text changes and whenever the box changes size.
  useLayoutEffect(() => {
    if (element === null) return
    const measure = () => {
      setCut(element.scrollWidth > element.clientWidth)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [element, children])

  // Inside an element that takes the focus, follow its pointer and keyboard focus. The timers are shared with the
  // tooltip box, so the pointer can move from the owner onto the tooltip and back.
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const clearTimers = () => {
    clearTimeout(openTimer.current)
    clearTimeout(closeTimer.current)
  }
  const closeLater = () => {
    clearTimeout(openTimer.current)
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => {
      setOwnerHover(false)
    }, CLOSE_DELAY)
  }
  useEffect(() => {
    if (owner === null || !cut) return
    const onEnter = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      clearTimeout(closeTimer.current)
      clearTimeout(openTimer.current)
      openTimer.current = setTimeout(() => {
        setOwnerHover(true)
      }, OPEN_DELAY)
    }
    const onDown = () => {
      clearTimers()
      setOwnerHover(false)
      setOwnerFocus(false)
    }
    const onFocus = () => {
      if (owner.matches(':focus-visible')) setOwnerFocus(true)
    }
    const onBlur = () => {
      setOwnerFocus(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDown()
    }
    owner.addEventListener('pointerenter', onEnter)
    owner.addEventListener('pointerleave', closeLater)
    owner.addEventListener('pointerdown', onDown)
    owner.addEventListener('focus', onFocus)
    owner.addEventListener('blur', onBlur)
    // On the window, in the capture phase, so Ark's own Escape handler cannot stop it first.
    window.addEventListener('keydown', onKey, true)
    if (document.activeElement === owner) onFocus()
    return () => {
      owner.removeEventListener('pointerenter', onEnter)
      owner.removeEventListener('pointerleave', closeLater)
      owner.removeEventListener('pointerdown', onDown)
      owner.removeEventListener('focus', onFocus)
      owner.removeEventListener('blur', onBlur)
      window.removeEventListener('keydown', onKey, true)
      // The listeners that would close it are gone, so it starts closed when the text is cut again.
      clearTimers()
      setOwnerHover(false)
      setOwnerFocus(false)
    }
  }, [owner, cut])

  const inOwner = owner !== null
  return (
    <TooltipBase
      content={children}
      placement={placement}
      // Inside an owner, its events open and close the tooltip, so Ark's own events are off and ignored.
      disabled={inOwner || !cut}
      open={cut && (inOwner ? ownerHover || ownerFocus : hoverOpen)}
      onOpenChange={(next) => {
        if (!inOwner) setHoverOpen(next)
      }}
      contentPointer={
        inOwner
          ? {
              onPointerEnter: () => {
                clearTimeout(closeTimer.current)
              },
              onPointerLeave: closeLater,
            }
          : undefined
      }
    >
      <Text ref={ref} {...(cut && !inOwner ? { tabIndex: 0 } : {})}>
        {children}
      </Text>
    </TooltipBase>
  )
}
