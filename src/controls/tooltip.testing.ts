// A story check for TruncatedText, shared by the stories of the components
// that cut text with it. Only story files import it; `../index.ts` never
// exports it.
import { expect, userEvent, waitFor, within } from 'storybook/test'

const tooltipOf = () => within(document.body).queryByRole('tooltip')

/**
 * Checks that the TruncatedText in `slot` (or `slot` itself) is cut with an
 * ellipsis, keeps the whole text, and shows it in a tooltip on hover and on
 * keyboard focus. `owner` is the button or link around the text that takes
 * the focus; without it, the cut text must be a tab stop of its own.
 */
export async function expectCutText(slot: Element, full: string, owner?: HTMLElement): Promise<void> {
  const text = slot.matches('.truncated-text') ? slot : slot.querySelector('.truncated-text')
  if (!(text instanceof HTMLElement)) throw new Error(`no truncated text for ${full}`)
  await expect(text.textContent).toBe(full)
  await expect(getComputedStyle(text).textOverflow).toBe('ellipsis')
  await waitFor(() => expect(text.scrollWidth).toBeGreaterThan(text.clientWidth))
  if (owner === undefined) await waitFor(() => expect(text).toHaveAttribute('tabindex', '0'))
  else await expect(text).not.toHaveAttribute('tabindex')
  const target = owner ?? text

  // Hover shows the whole text; moving away hides it.
  await userEvent.hover(target)
  await waitFor(() => expect(tooltipOf()).toHaveTextContent(full))
  await userEvent.unhover(target)
  await waitFor(() => expect(tooltipOf()).toBeNull())

  // The keyboard: the target is in the tab order, and keyboard focus on it shows the text; Escape hides it. A key
  // press first makes the focus a keyboard focus (focus-visible), as a Tab would.
  await expect(target.tabIndex).toBeGreaterThanOrEqual(0)
  await userEvent.keyboard('{Escape}')
  target.focus()
  await expect(target).toHaveFocus()
  await waitFor(() => expect(tooltipOf()).toHaveTextContent(full))
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(tooltipOf()).toBeNull())
  target.blur()
}
