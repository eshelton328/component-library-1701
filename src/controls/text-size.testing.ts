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

/**
 * The font size and line height of each element that `selectors` find inside `root`, in order. Read it at Small and
 * again inside `atTextSize` at Default and Large: chrome with `data-text-fixed` (d-131) reads the same at each size.
 */
export function typeOf(root: Element, selectors: readonly string[]): string[] {
  return selectors.flatMap((selector) => {
    const found = [...root.querySelectorAll(selector)]
    if (found.length === 0) throw new Error(`nothing matches ${selector}`)
    return found.map((e) => {
      const s = getComputedStyle(e)
      return `${selector} ${s.fontSize}/${s.lineHeight}`
    })
  })
}

/**
 * A play function for chrome (d-131): the type of each element that `selectors` find keeps its Small font size and
 * line height at Default and Large. The story renders at Small (`globals: { textSize: 'small' }`).
 */
export function fixedTypePlay(selectors: readonly string[]) {
  return async ({ canvasElement }: { canvasElement: HTMLElement }): Promise<void> => {
    const small = typeOf(canvasElement, selectors)
    for (const size of textSizes) {
      if (size === 'small') continue
      await atTextSize(size, async () => {
        await expect(typeOf(canvasElement, selectors)).toEqual(small)
      })
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

/**
 * The words inside `root` that break across two lines inside the word ("Opu/s"), as `overflow-wrap: anywhere` does
 * in a box too narrow for the word; the same measure as the-bridge's `check:text-sizes`. A break after a hyphen or a
 * slash is a normal break point and does not count. An empty list means every word is whole.
 */
export function brokenWords(root: Element): string[] {
  const out: string[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const source = node.textContent ?? ''
    for (const match of source.matchAll(/[^\s\-/]+/g)) {
      const word = document.createRange()
      word.setStart(node, match.index)
      word.setEnd(node, match.index + match[0].length)
      const tops = new Set([...word.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)))
      if (tops.size > 1) out.push(match[0])
    }
  }
  return out
}

/** A text field whose line is taller than its content box, and by how many px; its placeholder or value is cut. */
export type ShortField = { name: string; by: number }

/**
 * The inputs and text areas inside `root` whose line of text is taller than their content box by more than 1 px, so
 * the top or the bottom of the text is cut; the same measure as the-bridge's `check:text-sizes`.
 */
export function shortFields(root: Element): ShortField[] {
  const out: ShortField[] = []
  for (const field of root.querySelectorAll('input, textarea')) {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) continue
    if (field instanceof HTMLInputElement && !['text', 'search', 'email', 'url', 'password', ''].includes(field.type)) continue
    const s = getComputedStyle(field)
    const content = field.clientHeight - Number.parseFloat(s.paddingTop) - Number.parseFloat(s.paddingBottom)
    const line = s.lineHeight === 'normal' ? Number.parseFloat(s.fontSize) * 1.2 : Number.parseFloat(s.lineHeight)
    const by = line - content
    if (by > 1) out.push({ name: field.getAttribute('aria-label') ?? field.placeholder, by: Math.round(by) })
  }
  return out
}
