import type { ComponentProps, ReactNode } from 'react'
import { styled } from '../../styled-system/jsx'
import { bareIconButton } from '../../styled-system/recipes'
import { useInputModality } from './input-modality'

const StyledButton = styled('button', bareIconButton)

/** The props of a native button, less its children and `aria-label`, plus the icon and its `label`. */
export type BareIconButtonProps = Omit<ComponentProps<'button'>, 'children' | 'aria-label'> & {
  /** The accessible name, such as "Copy toolkit/skills/writer/". The button has no visible text. */
  label: string
  /** The icon, such as `<CopyIcon />`. It draws at 12 px in `fg.muted` (`fg.default` on hover), whatever its `size`. */
  icon: ReactNode
}

/**
 * A bare 12 px icon that is a button: no fill, no border and no padding, so
 * it fits inside a line of 12 px text, such as the copy icon at the end of a
 * `PathBadge` (which draws one with `onCopy`) or in the Files viewer's bar. A
 * `Button` is at least 24 high (`size="xs"`); use it where the design draws
 * a box. It draws the focus ring 2 outside the icon on keyboard focus. It is
 * `type="button"` unless you set `type`, and reports the press through
 * `onClick`; it does not copy anything itself.
 */
export function BareIconButton({ label, icon, type = 'button', ...props }: BareIconButtonProps) {
  useInputModality()
  return (
    <StyledButton type={type} aria-label={label} {...props}>
      {icon}
    </StyledButton>
  )
}
