import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { styled } from '../../styled-system/jsx'
import { clamp } from '../../styled-system/recipes'

const Root = styled('div', clamp)

// The recipe's variant names for each line count.
const lineVariants = { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 8: '8' } as const

export type ClampProps = {
  /** The text, in the text style of the parent. Plain text or inline elements; a block holds its lines. */
  children: ReactNode
  /** How many lines show before the text is cut; 4 when not set. */
  lines?: 1 | 2 | 3 | 4 | 5 | 6 | 8 | undefined
  /** Whether a cut text fades out at its end instead of ending in an ellipsis. A text that fits does not fade. */
  fade?: boolean | undefined
  /** Called with `true` when the text is longer than the lines, and `false` when it fits, such as to show a "Read the whole prompt" link. */
  onCutChange?: ((cut: boolean) => void) | undefined
}

/**
 * Shows the first `lines` lines of a text and cuts the rest, such as a
 * long prompt in the Inbox task. With `fade` the end fades out. It does not
 * open the rest; the caller shows a link or button that does.
 */
export function Clamp({ children, lines = 4, fade = false, onCutChange }: ClampProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [cut, setCut] = useState(false)
  // The latest callback, so a new function each render does not restart the observer.
  const report = useRef(onCutChange)
  useLayoutEffect(() => {
    report.current = onCutChange
  }, [onCutChange])
  useLayoutEffect(() => {
    const box = ref.current
    if (box === null) return
    const update = () => {
      // One pixel of slack: a zoomed page can leave a fractional height.
      const next = box.scrollHeight - box.clientHeight > 1
      setCut(next)
    }
    update()
    const sizes = new ResizeObserver(update)
    sizes.observe(box)
    return () => {
      sizes.disconnect()
    }
  }, [children, lines])
  // Tell the caller outside the state updater, which Strict Mode runs twice.
  const told = useRef(false)
  useEffect(() => {
    if (told.current === cut) return
    told.current = cut
    report.current?.(cut)
  }, [cut])
  return (
    <Root ref={ref} lines={lineVariants[lines]} fade={fade} data-cut={cut ? '' : undefined}>
      {children}
    </Root>
  )
}
