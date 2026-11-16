import type { ComponentProps } from 'react'
import { styled } from '../../styled-system/jsx'
import { button, type ButtonVariantProps } from '../../styled-system/recipes'

const StyledButton = styled('button', button)

/** The props of a native button, plus the recipe's `variant`, `size` and `iconOnly`. */
export type ButtonProps = ComponentProps<'button'> & ButtonVariantProps

/**
 * A button for an action on the page. It is `type="button"` unless you set
 * `type`, so it does not submit a form by accident. An icon-only button
 * needs an `aria-label`.
 */
export function Button({ type = 'button', ...props }: ButtonProps) {
  return <StyledButton type={type} {...props} />
}
