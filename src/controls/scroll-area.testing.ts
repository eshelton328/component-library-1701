// Story checks for the library's scroll areas, the boxes that spread the
// shared `scrollArea` style (`../theme/recipes/scroll-area.ts`). Only story
// files import it; `../index.ts` never exports it.
import { expect, waitFor } from 'storybook/test'

const find = (root: ParentNode, selector: string): HTMLElement => {
  const box = root.querySelector(selector)
  if (!(box instanceof HTMLElement)) throw new Error(`no scroll area ${selector}`)
  return box
}

/**
 * Checks that each box that `selectors` names under `root` draws no scroll bar
 * (`scrollbar-width: none`) and keeps a scroll that reaches its end from
 * chaining to the page (`overscroll-behavior: contain` on both axes).
 */
export async function expectScrollAreas(root: ParentNode, ...selectors: readonly string[]): Promise<void> {
  for (const selector of selectors) {
    const style = getComputedStyle(find(root, selector))
    await expect({ selector, scrollbarWidth: style.scrollbarWidth }).toEqual({ selector, scrollbarWidth: 'none' })
    await expect({ selector, x: style.overscrollBehaviorX, y: style.overscrollBehaviorY }).toEqual({
      selector,
      x: 'contain',
      y: 'contain',
    })
  }
}

/**
 * Checks that a user can still scroll `box` down with no scroll bar: a mouse
 * wheel and then PageDown and ArrowDown, with the box focused, each move its
 * scrollTop. The box must be taller inside than out and take the focus. It
 * uses the test runner's real input (DevTools and Playwright through
 * `vitest/browser`), as a synthetic wheel or key event scrolls nothing, so a
 * story that calls it carries `tags: ['!dev']` and runs only in the story
 * test.
 */
export async function expectScrollsByWheelAndKeys(box: HTMLElement): Promise<void> {
  const { cdp, userEvent } = await import('vitest/browser')
  await expect(box.scrollHeight).toBeGreaterThan(box.clientHeight)

  // A wheel turn over the middle of the box, through the test runner's DevTools session.
  box.scrollTop = 0
  const r = box.getBoundingClientRect()
  const at = { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }
  await cdp().send('Input.dispatchMouseEvent', { type: 'mouseWheel', ...at, deltaX: 0, deltaY: 200 })
  await waitFor(() => expect(box.scrollTop).toBeGreaterThan(0))

  for (const key of ['{PageDown}', '{ArrowDown}']) {
    box.scrollTop = 0
    box.focus()
    await expect(box).toHaveFocus()
    await userEvent.keyboard(key)
    await waitFor(() => expect(box.scrollTop).toBeGreaterThan(0))
  }
  box.scrollTop = 0
  box.blur()
}
