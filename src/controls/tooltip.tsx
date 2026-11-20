import { OverlayPortal } from './overlay-layer'
import { Tooltip as ArkTooltip } from '@ark-ui/react/tooltip'
import { type ReactElement, type ReactNode, type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createSlotRecipeContext, styled } from '../../styled-system/jsx'
import { tooltip, truncatedText } from '../../styled-system/recipes'
import { Highlight } from './highlight'

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

// `cutText` marks the tooltip of TruncatedText, which only shows a cut text (see the tooltip recipe's comment). It
// is fixed to the window (Ark's `fixed` strategy), so near the window's foot, or with its text past the foot in a
// pane that clips it, it never makes the document taller; it flips and slides to stay in the window.
function TooltipBase({ children, content, open, onOpenChange, placement = 'top', disabled, cutText = false }: TooltipProps & { cutText?: boolean | undefined }) {
  return (
    <Root
      cutText={cutText}
      positioning={cutText ? { placement, gutter: 6, strategy: 'fixed', flip: true, slide: true } : { placement, gutter: 6 }}
      lazyMount
      unmountOnExit
      // The pointer can move onto a plain tooltip, and it stays open there (WCAG 1.4.13). The tooltip of cut text
      // is not interactive: Ark gives its content `pointer-events: none`, the recipe's `cutText` variant gives its
      // positioner the same, and a click there reaches the element under it.
      interactive={!cutText}
      {...(open === undefined ? {} : { open })}
      {...(disabled === undefined ? {} : { disabled })}
      onOpenChange={(details) => {
        onOpenChange?.(details.open)
      }}
    >
      <ArkTooltip.Trigger asChild>{children}</ArkTooltip.Trigger>
      <OverlayPortal>
        <Positioner>
          <Content>{content}</Content>
        </Positioner>
      </OverlayPortal>
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

// The recipe's variant names for each line count.
const lineVariants = { 1: '1', 2: '2', 3: '3' } as const

// Controls that own the text inside them: a link, a button, or a focusable element with the role of one.
const controls = 'a[href], button, summary, [role]'
// Roles of a control, and of items that take the focus by arrow keys (a roving tab index), so an item with
// tabindex -1 is still reached.
const ownerRoles = new Set(['button', 'link', 'treeitem', 'tab', 'option', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'gridcell', 'row', 'radio'])

// The nearest control around `node`, so the text inside it needs no tab stop of its own. A box that only has a
// tabindex is never one: the AppShell detail and a ScrollFrame body take the focus only so the keys scroll them, and
// as the owner a pointer anywhere in the pane would open the tooltip of every cut text in it. A dialog (tabindex -1)
// is no control either.
function focusOwner(node: HTMLElement): HTMLElement | null {
  let candidate = node.parentElement?.closest<HTMLElement>(controls) ?? null
  while (candidate !== null) {
    // An element with one of those roles takes the focus only with a tabindex (-1 for a roving item).
    const role = candidate.getAttribute('role') ?? ''
    if (candidate.matches('a[href], button, summary') || (ownerRoles.has(role) && candidate.hasAttribute('tabindex'))) return candidate
    candidate = candidate.parentElement?.closest<HTMLElement>(controls) ?? null
  }
  return null
}

export type TruncatedTextProps = {
  /** The text. It shows on `lines` lines and ends with an ellipsis when it does not fit. */
  children: string
  /**
   * How many lines the text may take. `1` (the default) keeps it on one line. `2` or `3` wraps it onto that many
   * lines; a text longer than those lines ends with an ellipsis on the last one and shows whole in the tooltip,
   * as a cut line does.
   */
  lines?: 1 | 2 | 3 | undefined
  /**
   * Where the tooltip opens; `bottom` when not set, below the text and away from a card's title above it. Where the
   * window has no room there, it flips to the other side, and it slides along the text to stay in the window.
   */
  placement?: TooltipProps['placement']
  /** A search query, or several, whose matches in the text are marked as `Highlight` marks them. The tooltip shows the plain text. */
  highlight?: string | readonly string[] | undefined
  /**
   * The element that owns the text when no link or button is around it, such as a clickable card whose description
   * sits beside its title button: the pointer resting on it, or the keyboard focus on a control inside it, opens the
   * tooltip, and the text takes no tab stop of its own. Without it, the nearest link, button or element with such a
   * role around the text owns it, and cut text with none is a tab stop of its own.
   */
  owner?: RefObject<HTMLElement | null> | undefined
}

// How long the pointer rests on an element before its tooltip opens, and how long the tooltip waits after the
// pointer leaves before it closes. Ark's tooltip uses the same delays, so cut text inside a focusable element opens
// and closes as cut text with its own tab stop does.
const OPEN_DELAY = 400
const CLOSE_DELAY = 150

/**
 * Text on one line (or on `lines` lines) that ends with an ellipsis when it is too long, and then
 * shows the whole text in a `Tooltip` while the pointer rests on it or it
 * has the keyboard focus. It measures itself again when its size changes.
 * When the text fits there is no tooltip. The element always holds the whole
 * text, so assistive technology reads all of it; the tooltip only shows it.
 *
 * Inside a button, a link or an element with the role of a control or a
 * roving item, such as a map node or a card's title button, the tooltip opens
 * while the pointer rests anywhere on that element or it has the keyboard
 * focus; so it does inside an `owner`, such as a clickable card. A box that
 * only has a tabindex, such as a scrolling pane, owns no text. Anywhere else,
 * cut text becomes a tab stop of its own; text that fits never does.
 *
 * The tooltip only shows: it takes no pointer events, so a click where it
 * covers a card's title or a row reaches that element, and the pointer
 * cannot rest on it. Escape closes it.
 */
export function TruncatedText({ children, placement = 'bottom', highlight, lines = 1, owner: ownerRef }: TruncatedTextProps) {
  const [element, setElement] = useState<HTMLSpanElement | null>(null)
  const [cut, setCut] = useState(false)
  const [owner, setOwner] = useState<HTMLElement | null>(null)
  const [hoverOpen, setHoverOpen] = useState(false)
  const [ownerHover, setOwnerHover] = useState(false)
  const [ownerFocus, setOwnerFocus] = useState(false)

  const ref = useCallback((node: HTMLSpanElement | null) => {
    setElement(node)
  }, [])
  // The given owner, read once the parent has drawn it, or else the nearest control around the text.
  useLayoutEffect(() => {
    setOwner(element === null ? null : (ownerRef?.current ?? focusOwner(element)))
  }, [element, ownerRef])

  // A new highlight can change the text's width without a change of its box, so it measures again then too. The
  // queries are joined into one string, so a new array with the same queries does not measure again.
  const marks = highlight === undefined ? undefined : typeof highlight === 'string' ? highlight : highlight.join('\u0000')

  // Measure on mount, when the text or its highlight changes and whenever the box changes size.
  useLayoutEffect(() => {
    if (element === null) return
    const measure = () => {
      // On more than one line the text is cut by height; one pixel of slack, as a zoomed page can leave a fractional height.
      setCut(lines === 1 ? element.scrollWidth > element.clientWidth : element.scrollHeight - element.clientHeight > 1)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [element, children, marks, lines])

  // Inside an element that takes the focus, follow its pointer and keyboard focus.
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const clearTimers = () => {
    clearTimeout(openTimer.current)
    clearTimeout(closeTimer.current)
    openTimer.current = undefined
  }
  const closeLater = () => {
    clearTimeout(openTimer.current)
    clearTimeout(closeTimer.current)
    openTimer.current = undefined
    closeTimer.current = setTimeout(() => {
      setOwnerHover(false)
    }, CLOSE_DELAY)
  }
  useEffect(() => {
    if (owner === null || !cut) return
    // The pointer over the owner or a child of it. Over another cut text that shows its own tip (one with a tab stop,
    // such as a card's subtitle), this one stays closed, as Ark shows one tooltip at a time.
    const onOver = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      clearTimeout(closeTimer.current)
      if (event.target instanceof Element && event.target.closest('.truncated-text[tabindex]') !== null) {
        clearTimeout(openTimer.current)
        openTimer.current = undefined
        setOwnerHover(false)
        return
      }
      if (openTimer.current !== undefined) return
      openTimer.current = setTimeout(() => {
        openTimer.current = undefined
        setOwnerHover(true)
      }, OPEN_DELAY)
    }
    const onDown = () => {
      clearTimers()
      setOwnerHover(false)
      setOwnerFocus(false)
    }
    // The focus on the owner or on a control inside it (a card's title button), from the keyboard.
    const onFocus = () => {
      if (owner.matches(':focus-visible') || owner.querySelector(':focus-visible') !== null) setOwnerFocus(true)
    }
    const onBlur = (event: FocusEvent) => {
      if (event.relatedTarget instanceof Node && owner.contains(event.relatedTarget)) return
      setOwnerFocus(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDown()
    }
    owner.addEventListener('pointerover', onOver)
    owner.addEventListener('pointerleave', closeLater)
    owner.addEventListener('pointerdown', onDown)
    owner.addEventListener('focusin', onFocus)
    owner.addEventListener('focusout', onBlur)
    // On the window, in the capture phase, so Ark's own Escape handler cannot stop it first.
    window.addEventListener('keydown', onKey, true)
    if (document.activeElement !== null && owner.contains(document.activeElement)) onFocus()
    return () => {
      owner.removeEventListener('pointerover', onOver)
      owner.removeEventListener('pointerleave', closeLater)
      owner.removeEventListener('pointerdown', onDown)
      owner.removeEventListener('focusin', onFocus)
      owner.removeEventListener('focusout', onBlur)
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
      cutText
    >
      <Text ref={ref} lines={lineVariants[lines]} {...(cut && !inOwner ? { tabIndex: 0 } : {})}>
        {highlight === undefined ? children : <Highlight text={children} query={highlight} />}
      </Text>
    </TooltipBase>
  )
}
