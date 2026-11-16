import type { ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { backRow } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(backRow)
const Root = withProvider('div', 'root')
const Back = withContext('button', 'back')
const Icon = withContext('svg', 'icon')
const Label = withContext('span', 'label')
const Actions = withContext('div', 'actions')

export type BackRowProps = {
  /** The name of the screen the back button returns to, such as "Inbox". */
  label: string
  /** The accessible name of the back button; "Back to" and the label when not set. */
  backLabel?: string | undefined
  /** Called when the back button is pressed. The caller changes the screen. */
  onBack?: (() => void) | undefined
  /** The screen's actions at the end of the row, such as Discuss, Snooze or Dismiss buttons. */
  children?: ReactNode
}

/**
 * The row at the top of a detail screen on tablet and phone: a back button
 * with a chevron and the name of the list it returns to, and the screen's
 * actions at the end of the row.
 */
export function BackRow({ label, backLabel, onBack, children }: BackRowProps) {
  return (
    <Root>
      <Back type="button" aria-label={backLabel ?? `Back to ${label}`} onClick={onBack}>
        <Icon viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M12.5 4.17 6.67 10l5.83 5.83" />
        </Icon>
        <Label>{label}</Label>
      </Back>
      {children === undefined || children === null ? null : <Actions>{children}</Actions>}
    </Root>
  )
}
