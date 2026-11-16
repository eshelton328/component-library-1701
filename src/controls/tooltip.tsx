import { Portal } from '@ark-ui/react/portal'
import { Tooltip as ArkTooltip } from '@ark-ui/react/tooltip'
import { type ReactElement, type ReactNode, useCallback, useEffect, useLayoutEffect, useState } from 'react'
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

/**
 * A short text that shows next to an element while the pointer rests on it
 * or it has the keyboard focus. Escape, a click or moving away closes it.
 * Do not put anything in it that the page shows nowhere else: touch screens
 * never open it.
 */
export function Tooltip({ children, content, open, onOpenChange, placement = 'top', disabled }: TooltipProps) {
  return (
    <Root
      positioning={{ placement, gutter: 6 }}
      lazyMount
      unmountOnExit
      {...(open === undefined ? {} : { open })}
      {...(disabled === undefined ? {} : { disabled })}
      onOpenChange={(details) => {
        onOpenChange?.(details.open)
      }}
    >
      <ArkTooltip.Trigger asChild>{children}</ArkTooltip.Trigger>
      <Portal>
        <Positioner>
          <Content>{content}</Content>
        </Positioner>
      </Portal>
    </Root>
  )
}

const Text = styled('span', truncatedText)

// An element that takes the focus itself, so the text inside it needs no tab stop of its own.
const focusable = 'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable="true"], [contenteditable=""]'

export type TruncatedTextProps = {
  /** The text. It shows on one line and ends with an ellipsis when it does not fit. */
  children: string
  /** Where the tooltip opens; `top` when not set. */
  placement?: TooltipProps['placement']
}

// How long the pointer rests on an element before its tooltip opens, as in Ark's tooltip.
const OPEN_DELAY = 400

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
    setOwner(node?.parentElement?.closest<HTMLElement>(focusable) ?? null)
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

  // Inside an element that takes the focus, follow its pointer and keyboard focus.
  useEffect(() => {
    if (owner === null || !cut) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const onEnter = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      clearTimeout(timer)
      timer = setTimeout(() => {
        setOwnerHover(true)
      }, OPEN_DELAY)
    }
    const onLeave = () => {
      clearTimeout(timer)
      setOwnerHover(false)
    }
    const onFocus = () => {
      if (owner.matches(':focus-visible')) setOwnerFocus(true)
    }
    const onBlur = () => {
      setOwnerFocus(false)
    }
    owner.addEventListener('pointerenter', onEnter)
    owner.addEventListener('pointerleave', onLeave)
    owner.addEventListener('pointerdown', onLeave)
    owner.addEventListener('focus', onFocus)
    owner.addEventListener('blur', onBlur)
    if (document.activeElement === owner) onFocus()
    return () => {
      clearTimeout(timer)
      owner.removeEventListener('pointerenter', onEnter)
      owner.removeEventListener('pointerleave', onLeave)
      owner.removeEventListener('pointerdown', onLeave)
      owner.removeEventListener('focus', onFocus)
      owner.removeEventListener('blur', onBlur)
    }
  }, [owner, cut])

  const inOwner = owner !== null
  return (
    <Tooltip
      content={children}
      placement={placement}
      // Inside an owner, its events open the tooltip, so Ark's own trigger events are off.
      disabled={inOwner || !cut}
      open={cut && (inOwner ? ownerHover || ownerFocus : hoverOpen)}
      onOpenChange={(next) => {
        setHoverOpen(next)
        // Escape closes it until the pointer or the focus comes back.
        if (!next) {
          setOwnerHover(false)
          setOwnerFocus(false)
        }
      }}
    >
      <Text ref={ref} {...(cut && !inOwner ? { tabIndex: 0 } : {})}>
        {children}
      </Text>
    </Tooltip>
  )
}
