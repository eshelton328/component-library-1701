import type { ComponentProps } from 'react'
import { styled } from '../../styled-system/jsx'
import { button, type ButtonVariantProps } from '../../styled-system/recipes'
import type { Scalar } from './scalar'

const StyledButton = styled('button', button)

/**
 * The props of a native button, plus the recipe's `variant`, `size`,
 * `textSize` and `iconOnly`, `pressed` and `indicator`. `textSize` sets the
 * label's text: `md` (the default) draws `label` (Medium 14/20), or `labelLg`
 * on a `text` button; `sm` draws `labelSm` (Medium 13/16) on every variant,
 * as the Inbox Newest, Filter and Keep it buttons do. It keeps the height and
 * padding of `size`.
 */
export type ButtonProps = ComponentProps<'button'> &
  Scalar<ButtonVariantProps> & {
    /**
     * Makes the button a toggle and says whether it is on. It sets
     * `aria-pressed` and, on a `secondary` button, the active colours: the
     * selected fill and the cyan border. Use it for Sort or Filter while a
     * sort or filter applies. Leave it unset for a button that is not a toggle.
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
