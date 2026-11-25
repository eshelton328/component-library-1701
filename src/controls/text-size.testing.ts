// Story checks for the text sizes (d-122), shared by the stories of the
// parts that must grow with their text. Only story files import it;
// `../index.ts` never exports it.
import { expect, waitFor } from 'storybook/test'
import { textSizeClass, type TextSize } from '../foundations/text-size'

/** The three text sizes, Small first. */
export const textSizes = ['small', 'default', 'large'] as const satisfies readonly TextSize[]

const frame = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      resolve()
    })
  })

/**
 * Runs `check` with the class of `size` on `<html>`, as the app sets it, so
 * portalled parts such as a menu take the size too; then takes the class off
 * again. Use it in a story whose `globals` keep `textSize: 'small'`; the
 * preview sets the class from the globals again before the next story.
 */
export async function atTextSize(size: TextSize, check: () => Promise<void>): Promise<void> {
  const root = document.documentElement
  for (const s of textSizes) {
    const name = textSizeClass[s]
    if (name !== null) root.classList.toggle(name, s === size)
  }
  try {
    // Two frames: the style and layout, then a ResizeObserver's update (Clamp's data-cut).
    await frame()
    await frame()
    await check()
  } finally {
    for (const s of textSizes) {
      const name = textSizeClass[s]
      if (name !== null) root.classList.remove(name)
    }
  }
}

/**
 * Checks that the TruncatedText in each of `slots` (selectors inside `root`, such as `.card__description`) shows its
 * whole text: no ellipsis, nothing past its box on either axis, and no tab stop of its own (only cut text takes one).
 * Call it inside `atTextSize` at Default or Large (d-131) for the slots whose text has `grow`; at Small such a text
 * is cut as any TruncatedText is.
 */
export async function expectGrown(root: Element, slots: readonly string[]): Promise<void> {
  for (const slot of slots) {
    const texts = [...root.querySelectorAll(`${slot} .truncated-text, ${slot}.truncated-text`)]
    if (texts.length === 0) throw new Error(`no TruncatedText in ${slot}`)
    for (const text of texts) {
      if (!(text instanceof HTMLElement)) throw new Error(`${slot} is not an HTML element`)
      await expect(getComputedStyle(text).textOverflow).toBe('clip')
      await expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth)
      await expect(text.scrollHeight - text.clientHeight).toBeLessThanOrEqual(1)
      await waitFor(() => expect(text).not.toHaveAttribute('tabindex'))
    }
  }
}

/** A run of text that sticks out of its box, and by how many px. */
export type TextSpill = { text: string; by: number }

/**
 * The text inside `root` that an ancestor cuts (overflow hidden or clip, up
 * to the first box that scrolls) or that spills out of an element that lets
 * it overflow, by more than 1 px; the same measure as the-bridge's
 * `check:text-sizes`. Text that an ellipsis or a line clamp ends on purpose
 * is left out. An empty list means every line fits.
 */
export function textSpills(root: Element): TextSpill[] {
  const out: TextSpill[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const text = node.textContent?.trim() ?? ''
    const holder = node.parentElement
    if (text === '' || holder === null) continue
    const style = getComputedStyle(holder)
    if (style.visibility === 'hidden' || style.display === 'none') continue
    const range = document.createRange()
    range.selectNodeContents(node)
    const box = range.getBoundingClientRect()
    if (box.width === 0 || box.height === 0) continue
    let truncated = false
    let clipped = 0
    for (let a: Element | null = holder; a !== null && a !== document.documentElement; a = a.parentElement) {
      const s = getComputedStyle(a)
      if (s.textOverflow === 'ellipsis' || (s.webkitLineClamp !== '' && s.webkitLineClamp !== 'none')) truncated = true
      if ([s.overflowX, s.overflowY].some((o) => o === 'auto' || o === 'scroll')) break
      if ([s.overflowX, s.overflowY].some((o) => o === 'hidden' || o === 'clip')) {
        const c = a.getBoundingClientRect()
        clipped = Math.max(clipped, c.left - box.left, box.right - c.right, c.top - box.top, box.bottom - c.bottom)
      }
    }
    if (truncated) continue
    const h = holder.getBoundingClientRect()
    const visible = style.overflowX === 'visible' && style.overflowY === 'visible'
    const spill = visible ? Math.max(0, box.right - h.right, h.left - box.left) : 0
    const by = Math.max(clipped, spill)
    if (by > 1) out.push({ text: text.slice(0, 60), by: Math.round(by) })
  }
  return out
}
