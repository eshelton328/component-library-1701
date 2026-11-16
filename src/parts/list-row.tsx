import type { MouseEvent, ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { listRow, type ListRowVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'
import { Highlight } from '../controls/highlight'
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
  /** A search query, or several, whose matches in the title are marked with `Highlight`, as in search results. */
  highlight?: string | readonly string[] | undefined
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
export function ListRow({ title, highlight, meta, leading, trailing, children, actions, selected = false, running = false, snoozed = false, onSelect, variant }: ListRowProps) {
  // A sidebar row has one line of title; a cut title shows in full in a tooltip. An Inbox title wraps.
  // With `highlight`, the matches of the query are marked; a cut title's tooltip shows the plain title.
  const titleText =
    variant === 'sidebar' ? (
      <TruncatedText highlight={highlight}>{title}</TruncatedText>
    ) : highlight === undefined ? (
      title
    ) : (
      <Highlight text={title} query={highlight} />
    )
  // A sidebar row's text meta is one line too, and a cut one shows in full in a tooltip. Other meta is cut as it is.
  const metaText = variant === 'sidebar' && (typeof meta === 'string' || typeof meta === 'number') ? <TruncatedText>{String(meta)}</TruncatedText> : meta
  // Cut text with its own tab stop sits above the title button's hit area, so a click on it selects the row here.
  const selectFromText = (event: MouseEvent<HTMLElement>) => {
    if (onSelect !== undefined && event.target instanceof Element && event.target.closest('.truncated-text[tabindex]') !== null) onSelect()
  }
  return (
    <Root variant={variant} data-selected={selected ? '' : undefined} data-running={running ? '' : undefined} data-snoozed={snoozed ? '' : undefined} onClick={onSelect === undefined ? undefined : selectFromText}>
      {leading === undefined ? null : <Leading>{leading}</Leading>}
      <Body>
        {onSelect === undefined ? (
          <TitleText aria-current={selected ? 'true' : undefined}>{titleText}</TitleText>
        ) : (
          <TitleButton type="button" aria-current={selected ? 'true' : undefined} onClick={onSelect}>
            {titleText}
          </TitleButton>
        )}
        {meta === undefined ? null : <Meta>{metaText}</Meta>}
        {children === undefined ? null : <Lines>{children}</Lines>}
        {actions === undefined ? null : <Actions>{actions}</Actions>}
      </Body>
      {trailing === undefined ? null : <Trailing>{trailing}</Trailing>}
    </Root>
  )
}
