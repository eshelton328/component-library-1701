import type { ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { detailSplit } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(detailSplit)
const Root = withProvider('div', 'root')
const Item = withContext('div', 'item')
const Side = withContext('div', 'side')

export type DetailSplitProps = {
  /** The open item, such as the Inbox task in its `Container size="detail"`. */
  children?: ReactNode
  /** The pane beside the item, such as its discussion. */
  side?: ReactNode
}

/**
 * An open item and a side pane beside it, as the child of an `AppShell`
 * detail: the Inbox task and its discussion (D14), an artifact and its
 * discussion. The item keeps its content's width (a detail `Container` with
 * long text fills its 748 or 1024 px column) and the side takes the rest of
 * the row, up to 1108 px (`shell.discussionPane`, a 1076 px chat column and
 * the panel's padding). On a wider screen the item takes what is left and
 * its detail `Container` centres itself in it. Both fill the height, so
 * each one's `ScrollFrame` scrolls on its own. With no `side`, the item
 * fills the row.
 */
export function DetailSplit({ children, side }: DetailSplitProps) {
  return (
    <Root>
      <Item>{children}</Item>
      {side === undefined ? null : <Side>{side}</Side>}
    </Root>
  )
}
