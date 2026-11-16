import type { ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { groupHeader, type GroupHeaderVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'

const { withProvider, withContext } = createSlotRecipeContext(groupHeader)
const Root = withProvider('div', 'root')
const Leading = withContext('span', 'leading')
const Toggle = withContext('button', 'toggle')
const Static = withContext('span', 'toggle')
const Chevron = withContext('svg', 'chevron')
const Label = withContext('span', 'label')
const Count = withContext('span', 'count')
const Dot = withContext('span', 'dot')
const Actions = withContext('span', 'actions')

// The chevron is part of the header, not an icon a caller picks: down when
// the group is open, right when it is closed.
function Arrow({ open }: { open: boolean }) {
  return (
    <Chevron viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={open ? 'M3 4.5 6 7.5l3-3' : 'M4.5 3 7.5 6l-3 3'} />
    </Chevron>
  )
}

// React renders nothing for null, undefined, booleans and the empty string,
// so a slot holding one of them is left out with its gap.
function present(node: ReactNode): boolean {
  return node !== null && node !== undefined && typeof node !== 'boolean' && node !== ''
}

export type GroupHeaderProps = Scalar<GroupHeaderVariantProps> & {
  /** The group name, such as "Needs you". The header shows it in capitals. */
  label: string
  /** The number of rows in the group. */
  count?: number | undefined
  /** Whether the group is open. With `onOpenChange`, the header is a button that opens and closes it. */
  open?: boolean | undefined
  /** Called with the new state when the header is pressed. Without it the header does not collapse. */
  onOpenChange?: ((open: boolean) => void) | undefined
  /** The id of the element that holds the group's rows, for `aria-controls`. */
  contentId?: string | undefined
  /** Content before the chevron, such as a drag handle. */
  leading?: ReactNode
  /** Actions at the end of the header, such as a row menu. */
  actions?: ReactNode
}

/**
 * The header above a group of rows: the group name in capitals, an
 * optional count, a dot in the status colour `dot`, and optional actions
 * at the end. With `onOpenChange` it is a button with a chevron that opens
 * and closes the group; the caller holds `open` and hides the rows
 * (d-069). `variant` is `list` (Inbox, the default) or `sidebar`
 * (Workbench).
 */
export function GroupHeader({ label, count, dot, open = true, onOpenChange, contentId, leading, actions, variant }: GroupHeaderProps) {
  const collapsible = onOpenChange !== undefined
  const body = (
    <>
      {collapsible ? <Arrow open={open} /> : null}
      <Label>{label}</Label>
      {count === undefined ? null : <Count>{count}</Count>}
      {dot === undefined ? null : <Dot aria-hidden="true" />}
    </>
  )
  return (
    <Root variant={variant} dot={dot} data-state={collapsible ? (open ? 'open' : 'closed') : undefined}>
      {present(leading) ? <Leading>{leading}</Leading> : null}
      {!collapsible ? (
        <Static>{body}</Static>
      ) : (
        <Toggle
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => {
            onOpenChange(!open)
          }}
        >
          {body}
        </Toggle>
      )}
      {present(actions) ? <Actions>{actions}</Actions> : null}
    </Root>
  )
}
