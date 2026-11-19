// Story checks for the library's scroll areas, the boxes that spread the
// shared `scrollArea` style (`../theme/recipes/scroll-area.ts`). Only story
// files import it; `../index.ts` never exports it.
import { expect, waitFor } from 'storybook/test'

const find = (root: ParentNode, selector: string): HTMLElement => {
  const box = root.querySelector(selector)
  if (!(box instanceof HTMLElement)) throw new Error(`no scroll area ${selector}`)
  return box
}

/** The axes on which a scroll area keeps a scroll at its end from chaining on: its style in `scroll-area.ts`. */
export type Contain = 'both' | 'x' | 'none'

const behaviour = { both: { x: 'contain', y: 'contain' }, x: { x: 'contain', y: 'auto' }, none: { x: 'auto', y: 'auto' } } as const

/**
 * Checks that each box that `selectors` names under `root` draws no scroll bar
 * (`scrollbar-width: none`) and has `overscroll-behavior: contain` on the
 * `contain` axes and `auto` on the others: `both` for a box that bounds a
 * pane (`scrollArea`), `x` for a row that scrolls sideways (`scrollAreaX`)
 * and `none` for a box in a page's flow (`scrollAreaNested`).
 */
export async function expectScrollAreas(root: ParentNode, contain: Contain, ...selectors: readonly string[]): Promise<void> {
  for (const selector of selectors) {
    const style = getComputedStyle(find(root, selector))
    await expect({ selector, scrollbarWidth: style.scrollbarWidth }).toEqual({ selector, scrollbarWidth: 'none' })
    await expect({ selector, x: style.overscrollBehaviorX, y: style.overscrollBehaviorY }).toEqual({ selector, ...behaviour[contain] })
  }
}

/**
 * Checks that a vertical mouse wheel over `box`, a scroll area in the flow of
 * `scroller`, scrolls `scroller` when `box` has no room to scroll down.
 * Chrome 144 and later stop it when `box` contains the y axis, even when
 * `box` does not overflow. It uses the test runner's real wheel (DevTools
 * through `vitest/browser`), so a story that calls it carries
 * `tags: ['!dev']`.
 */
export async function expectWheelScrollsPast(box: HTMLElement, scroller: HTMLElement): Promise<void> {
  const { cdp } = await import('vitest/browser')
  await expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight)
  scroller.scrollTop = 0
  box.scrollTop = box.scrollHeight
  const r = box.getBoundingClientRect()
  const at = { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + Math.min(r.height, scroller.clientHeight) / 2) }
  await cdp().send('Input.dispatchMouseEvent', { type: 'mouseWheel', ...at, deltaX: 0, deltaY: 200 })
  await waitFor(() => expect(scroller.scrollTop).toBeGreaterThan(0))
  scroller.scrollTop = 0
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
  const { userEvent } = await import('vitest/browser')
  await expectScrollsByWheel(box)
  for (const key of ['{PageDown}', '{ArrowDown}']) {
    box.focus()
    await expect(box).toHaveFocus()
    await scrolls(box, () => userEvent.keyboard(key), () => userEvent.keyboard('{Home}'))
  }
  box.blur()
}

/**
 * Checks that a mouse wheel over the middle of `box` scrolls it down, with no scroll bar, through the test runner's
 * DevTools session. A story that calls it carries `tags: ['!dev']`.
 */
export async function expectScrollsByWheel(box: HTMLElement): Promise<void> {
  const { cdp } = await import('vitest/browser')
  await expect(box.scrollHeight).toBeGreaterThan(box.clientHeight)
  await expect(box.scrollTop).toBe(0)
  const r = box.getBoundingClientRect()
  const at = { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }
  const wheel = (deltaY: number) => cdp().send('Input.dispatchMouseEvent', { type: 'mouseWheel', ...at, deltaX: 0, deltaY })
  await scrolls(
    box,
    () => wheel(200),
    () => wheel(-box.scrollHeight),
  )
}

// Resolves at the first animation frame in which `done` is true, or after `frames` frames. It counts frames, not
// clock time: a busy CI runner can hold the next frame for seconds, and a scroll moves only in frames.
async function inFrames(done: () => boolean, frames: number): Promise<void> {
  for (let i = 0; i < frames && !done(); i++) await new Promise((resolve) => requestAnimationFrame(resolve))
}

// The frames a scroll gets to start (Chromium on Linux starts a key scroll after the focus about 270 ms late) and to
// end (it animates wheel and key scrolls). At 60 frames a second, 60 and 120 frames are one and two seconds.
const startFrames = 60
const endFrames = 120

// Checks that `input` scrolls the box down from the top, waits until it stops, and puts it back at its top with
// `back`, a real input too. A reset from code (scrollTop = 0) reaches Chromium's compositor only in a later frame,
// and a key scroll that starts before that frame starts from the old place: it then ends at 0 px when the reset
// lands, which a user who reads and then presses a key never sees.
async function scrolls(box: HTMLElement, input: () => Promise<unknown>, back: () => Promise<unknown>): Promise<void> {
  await input()
  await inFrames(() => box.scrollTop > 0, startFrames)
  await expect(box.scrollTop).toBeGreaterThan(0)
  await settled(box)
  await back()
  await inFrames(() => box.scrollTop === 0, endFrames)
  await expect(box.scrollTop).toBe(0)
  await settled(box)
}

// Resolves when the box's scrollTop has stayed the same for three frames: a smooth scroll still under way would
// otherwise go on into the next check.
async function settled(box: HTMLElement): Promise<void> {
  let last = box.scrollTop
  let same = 0
  await inFrames(() => {
    if (box.scrollTop === last) same++
    else {
      same = 0
      last = box.scrollTop
    }
    return same >= 3
  }, endFrames)
}
