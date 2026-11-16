import type { ReactNode } from 'react'
import { Splitter } from '../controls/splitter'

/** One pane of the split: its id (unique in the split) and its content, usually a `Pane`. */
export type SplitPane = {
  id: string
  content: ReactNode
}

/**
 * The three splitters of a split: `columns` (left and right) and the rows
 * of the `left` and `right` columns. Sizes are percentages.
 */
export type SplitPart = 'columns' | 'left' | 'right'

export type SplitPanesProps = {
  /** One to four panes. Panes after the fourth are not shown. */
  panes: readonly SplitPane[]
  /** The sizes of each splitter, in percent. Set them with `onSizeChange` to control the split. */
  sizes?: Partial<Record<SplitPart, readonly number[]>> | undefined
  /** Called with the part and its new sizes while the user resizes. */
  onSizeChange?: ((part: SplitPart, size: number[]) => void) | undefined
}

/**
 * The Workbench split: one to four panes, 10 apart, with a resize handle
 * between each pair (Workbench D9, D11, D12). One pane fills the space;
 * two sit side by side; three put the first on the left and the second
 * over the third on the right; four put the fourth under the first, so the
 * panes run clockwise from the top left. A pane keeps its place, and its
 * React state, when a pane is added after it or removed after it; a pane
 * that moves to the other column is mounted again. It fills its parent.
 */
export function SplitPanes({ panes, sizes, onSizeChange }: SplitPanesProps) {
  const [a, b, c, d] = panes
  if (a === undefined) return null
  const props = (part: SplitPart) => ({
    size: sizes?.[part],
    onSizeChange: (size: number[]) => onSizeChange?.(part, size),
  })
  // Every pane sits at the same depth, in a vertical splitter inside a
  // column, so adding a pane never moves the others to a new parent.
  const column = (id: 'left' | 'right', rows: readonly (SplitPane | undefined)[]) => {
    const shown = rows.filter((r): r is SplitPane => r !== undefined)
    return {
      id,
      content: <Splitter orientation="vertical" handleLabel="Resize rows" panels={shown} {...props(id)} />,
    }
  }
  const columns = b === undefined ? [column('left', [a])] : [column('left', [a, d]), column('right', [b, c])]
  return <Splitter handleLabel="Resize columns" panels={columns} {...props('columns')} />
}
