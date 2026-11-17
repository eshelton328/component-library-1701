import type { ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { dragPreview } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(dragPreview)
const Root = withProvider('div', 'root')
const Card = withContext('div', 'card')
const Hint = withContext('span', 'hint')

export type DragPreviewProps = {
  /**
   * The copy of the dragged item, such as its `ListRow`. It is inert: hidden from assistive technology, and no
   * button or tooltip trigger in it takes the focus or a click.
   */
  children: ReactNode
  /** Turn the copy 3° clockwise, as a chat dragged from the Workbench sidebar is (D2 105:960). Straight when not set. */
  tilt?: boolean | undefined
  /** A pill under the copy that says what a drop does, such as "Drop to move drift check into the-bridge". */
  hint?: ReactNode
}

/**
 * What follows the pointer while a chat is dragged (Workbench D2 105:960,
 * D6 158:1034): a copy of its row, lifted with a cyan outline and a
 * shadow, and an optional hint pill under it. It takes no pointer events.
 * The caller places it at the pointer, outside any box that clips, such as
 * the sidebar's scrolling body.
 */
export function DragPreview({ children, tilt, hint }: DragPreviewProps) {
  return (
    <Root tilt={tilt}>
      <Card aria-hidden="true" inert>
        {children}
      </Card>
      {hint === undefined || hint === null || hint === '' ? null : <Hint>{hint}</Hint>}
    </Root>
  )
}
