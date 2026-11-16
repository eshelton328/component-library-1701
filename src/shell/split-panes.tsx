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
  /** One to four panes, in reading order. Panes after the fourth are not shown. */
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
 * over the third on the right; four make two columns, the first and third
 * on the left and the second and fourth on the right, so the reading
 * order runs left to right, then top to bottom. It fills its parent.
 */
export function SplitPanes({ panes, sizes, onSizeChange }: SplitPanesProps) {
  const [a, b, c, d] = panes
  if (a === undefined) return null
  const props = (part: SplitPart) => ({
    size: sizes?.[part],
    onSizeChange: (size: number[]) => onSizeChange?.(part, size),
  })
  const column = (id: string, top: SplitPane, bottom: SplitPane | undefined, part: SplitPart): SplitPane =>
    bottom === undefined
      ? { id, content: top.content }
      : { id, content: <Splitter orientation="vertical" handleLabel="Resize rows" panels={[top, bottom]} {...props(part)} /> }
  if (b === undefined) return <Splitter panels={[a]} />
  const left = column('left', a, c !== undefined && d !== undefined ? c : undefined, 'left')
  const right = column('right', b, d ?? c, 'right')
  return <Splitter handleLabel="Resize columns" panels={[left, right]} {...props('columns')} />
}
