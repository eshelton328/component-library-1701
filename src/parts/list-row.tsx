import type { ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { listRow, type ListRowVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'
import { TruncatedText } from '../controls/tooltip'

const { withProvider, withContext } = createSlotRecipeContext(listRow)
const Root = withProvider('div', 'root')
const Leading = withContext('span', 'leading')
const Body = withContext('div', 'body')
const TitleButton = withContext('button', 'title')
const TitleText = withContext('span', 'title')
const Meta = withContext('span', 'meta')
const Lines = withContext('div', 'lines')
const Actions = withContext('div', 'actions')
const Trailing = withContext('span', 'trailing')

export type ListRowProps = Scalar<ListRowVariantProps> & {
  /** The row title, such as the task or chat name. */
  title: string
  /** The meta line under the title, such as the project and the source. */
  meta?: ReactNode
  /** The element before the text, such as a kind tile or a kind mark. */
  leading?: ReactNode
  /** The elements at the end, such as the age and a status pill. */
  trailing?: ReactNode
  /** More lines under the meta line, such as "Snoozed until 9:00". */
  children?: ReactNode
  /** Buttons in the row, such as Approve and Deny. They do not select the row. */
  actions?: ReactNode
  /** The open item. The row has the selected colours and `aria-current`. */
  selected?: boolean | undefined
  /** A running item. The row has the selected colours, without `aria-current`. */
  running?: boolean | undefined
  /** A snoozed item. The row is dimmed. */
  snoozed?: boolean | undefined
  /** Called when the user clicks the row or presses Enter on it. Without it, the row is not a button. */
  onSelect?: (() => void) | undefined
}

/**
 * A row in a list: an Inbox item (`inbox`, the default) or a chat in the
 * Workbench sidebar (`sidebar`). With `onSelect`, the title is a button and
 * a click anywhere on the row selects it.
 */
export function ListRow({ title, meta, leading, trailing, children, actions, selected = false, running = false, snoozed = false, onSelect, variant }: ListRowProps) {
  // A sidebar row has one line of title; a cut title shows in full in a tooltip. An Inbox title wraps.
  const titleText = variant === 'sidebar' ? <TruncatedText>{title}</TruncatedText> : title
  return (
    <Root variant={variant} data-selected={selected ? '' : undefined} data-running={running ? '' : undefined} data-snoozed={snoozed ? '' : undefined}>
      {leading === undefined ? null : <Leading>{leading}</Leading>}
      <Body>
        {onSelect === undefined ? (
          <TitleText aria-current={selected ? 'true' : undefined}>{titleText}</TitleText>
        ) : (
          <TitleButton type="button" aria-current={selected ? 'true' : undefined} onClick={onSelect}>
            {titleText}
          </TitleButton>
        )}
        {meta === undefined ? null : <Meta>{meta}</Meta>}
        {children === undefined ? null : <Lines>{children}</Lines>}
        {actions === undefined ? null : <Actions>{actions}</Actions>}
      </Body>
      {trailing === undefined ? null : <Trailing>{trailing}</Trailing>}
    </Root>
  )
}
