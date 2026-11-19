// A story check for TruncatedText, shared by the stories of the components
// that cut text with it. Only story files import it; `../index.ts` never
// exports it.
import { expect, userEvent, waitFor, within } from 'storybook/test'

// The open tooltip that shows `full`; another cut text's tip may be open beside it (a card's description).
const tooltipWith = (full: string) => within(document.body).queryAllByRole('tooltip').find((tip) => tip.textContent.includes(full)) ?? null

/**
 * Checks that the TruncatedText in `slot` (or `slot` itself) is cut with an
 * ellipsis (on its last line, when it has `lines` above 1), keeps the whole
 * text, and shows it in a tooltip on hover and on
 * keyboard focus. `owner` is the element around the text whose hover opens
 * the tooltip (a button, a link, or a clickable card); `focusTarget` (the
 * owner when not given) is the control in it that takes the focus, such as
 * the card's title button. Without an owner, the cut text must be a tab stop
 * of its own.
 */
export async function expectCutText(slot: Element, full: string, owner?: HTMLElement, focusTarget: HTMLElement | undefined = owner): Promise<void> {
  const text = slot.matches('.truncated-text') ? slot : slot.querySelector('.truncated-text')
  if (!(text instanceof HTMLElement)) throw new Error(`no truncated text for ${full}`)
  await expect(text.textContent).toBe(full)
  await expect(getComputedStyle(text).textOverflow).toBe('ellipsis')
  // A TruncatedText with `lines` above 1 is clamped and cut by height; one on a single line is cut by width.
  if (getComputedStyle(text).webkitLineClamp === 'none') await waitFor(() => expect(text.scrollWidth).toBeGreaterThan(text.clientWidth))
  else await waitFor(() => expect(text.scrollHeight - text.clientHeight).toBeGreaterThan(1))
  if (owner === undefined) await waitFor(() => expect(text).toHaveAttribute('tabindex', '0'))
  else await expect(text).not.toHaveAttribute('tabindex')
  const target = owner ?? text
  const focused = focusTarget ?? text

  // Hover shows the whole text; moving away hides it.
  await userEvent.hover(target)
  await waitFor(() => expect(tooltipWith(full)).not.toBeNull())
  await userEvent.unhover(target)
  await waitFor(() => expect(tooltipWith(full)).toBeNull())

  // The keyboard: the target is in the tab order, and keyboard focus on it shows the text; Escape hides it. A key
  // press first makes the focus a keyboard focus (focus-visible), as a Tab would.
  await expect(focused.tabIndex).toBeGreaterThanOrEqual(0)
  await userEvent.keyboard('{Escape}')
  focused.focus()
  await expect(focused).toHaveFocus()
  await waitFor(() => expect(tooltipWith(full)).not.toBeNull())
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(tooltipWith(full)).toBeNull())
  focused.blur()
}
