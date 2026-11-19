import type { ComponentProps } from 'react'
import { styled } from '../../styled-system/jsx'
import { button, type ButtonVariantProps } from '../../styled-system/recipes'
import type { Scalar } from './scalar'
import { useInputModality } from './input-modality'

const StyledButton = styled('button', button)

/**
 * The props of a native button, plus the recipe's `variant`, `size`,
 * `textSize`, `padding`, `keepIconSize`, `pressedTone`, `pressedBorder`, `expandedBorder` and
 * `iconOnly`, `iconOnlyWidth`, `pressed` and `indicator`. `size` sets the
 * height: `xs` 24 (such as Copy under a chat reply), `sm` 28, `md` 32 (the
 * default), `lg` 36 and `xl` 44. `textSize` sets the label's text: `md` (the
 * default) draws `label` (Medium 14/20), or `labelLg` on a `text` button;
 * `sm` draws `labelSm` (Medium 13/16) on every variant, as the Inbox Newest,
 * Filter and Keep it buttons do; `smStrong` draws `labelSmStrong` (SemiBold
 * 13/16), as Start and Remove task do; `xs` draws `labelXs` (Medium 12/16),
 * as the small Inbox buttons (Reset, Edit, Snooze, Dismiss) do. It keeps the
 * height and padding of `size`.
 *
 * `padding="compact"` pads a `lg` button 12 at the sides, where `default`
 * pads it 16, as Toolkit's Sort button (D1 425:62) does, and a `md` button
 * 10, where `default` pads it 12, as Artifacts' Sort and Filter (D1
 * 402:15404, 402:15413) do. It changes only a `md` or `lg` button that is
 * not `iconOnly`.
 *
 * `iconOnly` makes a square button for one icon. `iconOnlyWidth="lg"`
 * makes an `xs`, `sm` or `md` icon-only button 36 wide (`control.lg`) at its
 * own height, as the phone's 36 x 28 Discuss button on an open Toolkit item
 * (M2 496:2) is with `size="sm"`; `square` (the default) keeps it as wide as
 * it is high. A `lg` or `xl` icon-only button stays square.
 *
 * Every icon in a button draws at 16, whatever its `size`. With
 * `keepIconSize`, an icon given a `size` keeps it, such as the
 * `<ChevronDownIcon size="12" />` after Artifacts' Sort label (402:15410);
 * an icon without a `size` still draws at 16.
 *
 * `expandedBorder` sets the border while `aria-expanded` is true. `active`
 * (the default) draws `border.active` (cyan): keep it on the trigger of a
 * menu, popover or sheet, which draws the cyan border while open. `default`
 * keeps the variant's own border (`border.default` on `secondary`), for a
 * disclosure toggle that shows or hides a section in place, such as Hide
 * transcript on a subagent card. A disclosure toggle sets `aria-expanded`,
 * not `pressed`.
 *
 * `pressedBorder` sets the border while `pressed` is true. `active` (the
 * default) draws `border.active` (cyan), as Sort and Filter do. `discuss`
 * draws `accent.discuss` (solid violet, at least 3:1 on the page surfaces),
 * for the Discuss toggle while its discussion is open, and on a `secondary`
 * button also fills it with `surface.discuss` (violet at 30 %) in place of
 * `surface.selected`; the label stays `fg.default`, and primary and danger
 * buttons keep their own fill. `selected` draws `border.selected` (the
 * selected item's cyan border), for a selected toggle chip such as a
 * workspace's own folder or the chosen recent folder; `active` and
 * `selected` keep the pressed fill and label.
 */
export type ButtonProps = ComponentProps<'button'> &
  Scalar<ButtonVariantProps> & {
    /**
     * Makes the button a toggle and says whether it is on. It sets
     * `aria-pressed` and, on a `secondary` button, the active colours: the
     * selected fill and the cyan border. Use it for Sort or Filter while a
     * sort or filter applies. Leave it unset for a button that is not a toggle.
     * `pressedTone` sets the label and icon of a pressed button: `default`
     * keeps `fg.default`; `accent` draws them in `fg.accent` (cyan), as the
     * Toolkit phone's view buttons do.
     */
    pressed?: boolean | undefined
    /**
     * Shows a small cyan dot: after the label, or in the top end corner of an
     * icon-only button. It is not announced; `pressed` or the label says why.
     */
    indicator?: boolean | undefined
  }

/**
 * A button for an action on the page. It is `type="button"` unless you set
 * `type`, so it does not submit a form by accident. An icon-only button
 * needs an `aria-label`. A disabled `secondary` button keeps its fill and
 * border and mutes its label and icon to `fg.muted`; the other variants fade
 * the whole button (`opacity.disabled`).
 */
export function Button({ type = 'button', pressed, indicator = false, children, ...props }: ButtonProps) {
  useInputModality()
  return (
    <StyledButton type={type} aria-pressed={pressed} {...props}>
      {indicator ? (
        <>
          {children}
          <span className="button__indicator" aria-hidden="true" />
        </>
      ) : (
        children
      )}
    </StyledButton>
  )
}
