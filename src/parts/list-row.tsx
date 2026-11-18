import type { MouseEvent, ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { listRow, type ListRowVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'
import { Highlight } from '../controls/highlight'
import { TruncatedText } from '../controls/tooltip'

const { withProvider, withContext } = createSlotRecipeContext(listRow)
const Root = withProvider('div', 'root')
const Nest = withContext('span', 'nest')
const Leading = withContext('span', 'leading')
const Body = withContext('div', 'body')
const TitleRow = withContext('span', 'titleRow')
const TitleButton = withContext('button', 'title')
const TitleText = withContext('span', 'title')
const Dot = withContext('span', 'dot')
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
  /** A finished item, such as a done task. Unless the row is selected or running, its title is muted and its `leading` tile fades (`opacity.finished`). */
  finished?: boolean | undefined
  /**
   * How deep the row is nested: `1` for a subtask's or a fork's chat under
   * the chat that started it, `2` for one more step. A nested row starts
   * with a ↳ that screen readers skip; say the parent in `meta` when it
   * matters. Defaults to `0`, a top-level row.
   */
  level?: 0 | 1 | 2 | undefined
  /** Called when the user clicks the row or presses Enter on it. Without it, the row is not a button. */
  onSelect?: (() => void) | undefined
  /** What a screen reader reads for the `dot`, such as "New". Without it the dot is hidden from screen readers. */
  dotLabel?: string | undefined
}

/**
 * A row in a list: an Inbox item (`inbox`, the default) or a chat in the
 * Workbench sidebar (`sidebar`). With `onSelect`, the title is a button and
 * a click anywhere on the row selects it. `density="compact"` draws the
 * title in `labelSm` and the meta and age in `monoSm`, with its lines 2
 * apart, so a title and meta row is 56 tall, as the Inbox list draws it;
 * the default keeps `label` and `mono`, 4 apart. A compact `sidebar` row
 * at level 0 pads 20 at the start, where Figma draws the Workbench sidebar
 * chat's kind mark (D2 105:705), so a model and a context meter fit beside
 * a status pill; a nested row keeps 24.
 *
 * The Artifacts rows add, on the `inbox` variant:
 * - `padding`: `default` pads 10 inside the 1 px border; `sm` pads 8, so a
 *   title and meta row is 58 tall (Artifacts D2); `lg` pads 12 (the list
 *   view, D4); `phone` pads 4 at the sides and 10 above and below (M1).
 * - `surface="card"` draws the row on `surface.pane` in a `border.default`
 *   border, as a Card; `default` has no fill and a clear border.
 * - `trailingAlign="center"` centres the trailing items down the row (D2's
 *   age, D4's age and Open); `start`, the default, puts them on the title line.
 * - `dot` ends the title row with a 6 px dot in that status colour, such as
 *   `working` for a new item; `dotLabel` names it for screen readers.
 *   `dotPosition="title"` (the default) puts it 8 after the title (D4);
 *   `end` puts it at the end of the title line, 12 before the trailing
 *   items (D2).
 */
export function ListRow({ title, highlight, meta, leading, trailing, children, actions, selected = false, running = false, snoozed = false, finished = false, level = 0, onSelect, dotLabel, variant, density, padding, surface, trailingAlign, dot, dotPosition }: ListRowProps) {
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
  const titleNode =
    onSelect === undefined ? (
      <TitleText aria-current={selected ? 'true' : undefined}>{titleText}</TitleText>
    ) : (
      <TitleButton type="button" aria-current={selected ? 'true' : undefined} onClick={onSelect}>
        {titleText}
      </TitleButton>
    )
  return (
    <Root variant={variant} density={density} padding={padding} surface={surface} trailingAlign={trailingAlign} dot={dot} dotPosition={dotPosition} data-selected={selected ? '' : undefined} data-running={running ? '' : undefined} data-snoozed={snoozed ? '' : undefined} data-finished={finished ? '' : undefined} data-level={level === 0 ? undefined : level} onClick={onSelect === undefined ? undefined : selectFromText}>
      {level === 0 ? null : <Nest aria-hidden="true">↳</Nest>}
      {leading === undefined ? null : <Leading>{leading}</Leading>}
      <Body>
        {/* The title row is always there, so the title button keeps its focus when the dot comes or goes. */}
        <TitleRow>
          {titleNode}
          {dot === undefined ? null : dotLabel === undefined ? <Dot aria-hidden="true" /> : <Dot role="img" aria-label={dotLabel} />}
        </TitleRow>
        {meta === undefined ? null : <Meta>{metaText}</Meta>}
        {children === undefined ? null : <Lines>{children}</Lines>}
        {actions === undefined ? null : <Actions>{actions}</Actions>}
      </Body>
      {trailing === undefined ? null : <Trailing>{trailing}</Trailing>}
    </Root>
  )
}
