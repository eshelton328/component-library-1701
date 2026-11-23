import { useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { listRow, type ListRowVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'
import { Highlight } from '../controls/highlight'
import { TruncatedText } from '../controls/tooltip'
import { Skeleton } from './skeleton'

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
const MetaRow = withContext('span', 'metaRow')
const MetaTrailing = withContext('span', 'metaTrailing')
const Lines = withContext('div', 'lines')
const Actions = withContext('div', 'actions')
const Trailing = withContext('span', 'trailing')

export type ListRowProps = Scalar<ListRowVariantProps> & {
  /** The row title, such as the task or chat name. */
  title: string
  /**
   * A row whose content is still loading: the title is a `Skeleton` line in the title's text style, and the
   * row is not a button. Pass skeletons as `leading`, `meta` and `trailing` too, so the row has the size of the
   * row that replaces it. Put loading rows in a `SkeletonGroup`.
   */
  loading?: boolean | undefined
  /** A search query, or several, whose matches in the title are marked with `Highlight`, as in search results. */
  highlight?: string | readonly string[] | undefined
  /** The meta line under the title, such as the project and the source. */
  meta?: ReactNode
  /**
   * A part that ends the meta line, such as a New badge in a search match
   * row (Artifacts M5). The meta line becomes a row: the meta text first,
   * a flexible gap, then this part at the body's right edge, centred on
   * the meta line. Without it the meta line is as before.
   */
  metaTrailing?: ReactNode
  /** The element before the text, such as a kind tile or a kind mark. */
  leading?: ReactNode
  /**
   * The elements at the end, such as the age and a status pill. With
   * `trailingPlacement="title"` they end the title line instead of
   * standing in their own column.
   */
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
  /**
   * Called when the user clicks the row or presses Enter on it. Without it, the row is not a button.
   * With it, the row takes the selected fill while a finger or the mouse is down on it (not on a button in
   * `actions`), and drops it when the press ends, so a tap shows without leaving the row highlighted.
   */
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
 *   view, D4); `phone` pads 4 at the sides and 8 above and below, so a
 *   row with a 48 px leading is 66 tall (M1); `pane` pads 6 above and
 *   below and 10 at the sides, puts the title and meta 2 apart and centres
 *   the leading, body and trailing down the row, so a title and meta row is
 *   52 tall, selected or not (the Toolkit list beside an open item, D03).
 *   `flush` pads 6 above and below and 0 at the sides inside the clear
 *   border, with the same centring and 2 px gap, so a title and meta row is
 *   52 tall and its leading and trailing sit 1 in from the row's edges (the
 *   Toolkit Activity list, D17).
 * - `metaStyle="small"` draws the meta line in the `small` sans style
 *   (12/16, the Activity list's time and place); `mono`, the default, keeps
 *   the `mono` meta (`monoSm` on a compact row).
 * - `surface="card"` draws the row on `surface.pane` in a `border.default`
 *   border, as a Card; `default` has no fill and a clear border.
 * - `trailingAlign="center"` centres the trailing items down the row (D2's
 *   age, D4's age and Open); `start`, the default, puts them on the title line.
 * - `dot` ends the title row with a 6 px dot in that status colour, such as
 *   `working` for a new item; `dotLabel` names it for screen readers.
 *   `dotPosition="title"` (the default) puts it 8 after the title (D4);
 *   `end` puts it at the end of the title line, 12 before the trailing
 *   items (D2).
 * - `leadingGap="16"` puts the body 16 after the leading (D4), and
 *   `leadingGap="12"` 12 after it (the Toolkit phone row, M1); without it
 *   the gap is 10.
 * - `bodyAlign="center"` centres the body down the row (D4's text beside
 *   its 72 px preview); `start`, the default, puts it at the row's top.
 * - `metaTrailing` ends the meta line with a part at the body's right
 *   edge, level with the meta text, such as the New badge of a phone
 *   search match row (M5).
 * - `trailingPlacement="title"` puts `trailing` at the end of the title
 *   line, after the title and the dot, at the body's right edge and
 *   centred on the title line; the body then runs the full width after
 *   `leading`, so a `metaTrailing` part ends under the age (M5).
 *   `column`, the default, keeps `trailing` in its own column after the
 *   body.
 */
export function ListRow({ title, loading = false, highlight, meta, metaTrailing, leading, trailing, children, actions, selected = false, running = false, snoozed = false, finished = false, level = 0, onSelect, dotLabel, variant, density, padding, metaStyle, surface, trailingAlign, leadingGap, bodyAlign, dot, dotPosition, trailingPlacement }: ListRowProps) {
  // A sidebar row has one line of title; a cut title shows in full in a tooltip. An Inbox title wraps.
  // With `highlight`, the matches of the query are marked; a cut title's tooltip shows the plain title.
  const titleText = loading ? (
    <Skeleton width="long" />
  ) : variant === 'sidebar' ? (
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
  // The pressed fill (screen review R38): from a primary press on the row, not on a button in `actions`, to its end.
  // Touch fires pointercancel when the press becomes a scroll, so a scroll drops the fill too.
  const [pressed, setPressed] = useState(false)
  const press = (event: PointerEvent<HTMLElement>) => {
    if (event.button === 0 && event.target instanceof Element && event.target.closest('.list-row__actions') === null) setPressed(true)
  }
  const release = () => {
    setPressed(false)
  }
  const pressable = onSelect !== undefined && !loading
  const trailingNode = trailing === undefined ? null : <Trailing>{trailing}</Trailing>
  const trailingInTitle = trailingPlacement === 'title'
  const titleNode =
    !pressable ? (
      <TitleText aria-current={selected ? 'true' : undefined}>{titleText}</TitleText>
    ) : (
      <TitleButton type="button" aria-current={selected ? 'true' : undefined} onClick={onSelect}>
        {titleText}
      </TitleButton>
    )
  return (
    <Root variant={variant} density={density} padding={padding} metaStyle={metaStyle} surface={surface} trailingAlign={trailingAlign} leadingGap={leadingGap} bodyAlign={bodyAlign} dot={dot} dotPosition={dotPosition} trailingPlacement={trailingPlacement} data-selected={selected ? '' : undefined} data-running={running ? '' : undefined} data-snoozed={snoozed ? '' : undefined} data-finished={finished ? '' : undefined} data-loading={loading ? '' : undefined} data-level={level === 0 ? undefined : level} data-pressed={pressable && pressed ? '' : undefined} onClick={pressable ? selectFromText : undefined} onPointerDown={pressable ? press : undefined} onPointerUp={pressable ? release : undefined} onPointerCancel={pressable ? release : undefined} onPointerLeave={pressable ? release : undefined}>
      {level === 0 ? null : <Nest aria-hidden="true">↳</Nest>}
      {leading === undefined ? null : <Leading>{leading}</Leading>}
      <Body>
        {/* The title row is always there, so the title button keeps its focus when the dot comes or goes. */}
        <TitleRow>
          {titleNode}
          {dot === undefined ? null : dotLabel === undefined ? <Dot aria-hidden="true" /> : <Dot role="img" aria-label={dotLabel} />}
          {trailingInTitle ? trailingNode : null}
        </TitleRow>
        {metaTrailing === undefined ? (
          meta === undefined ? null : <Meta>{metaText}</Meta>
        ) : (
          <MetaRow>
            {meta === undefined ? null : <Meta>{metaText}</Meta>}
            <MetaTrailing>{metaTrailing}</MetaTrailing>
          </MetaRow>
        )}
        {children === undefined ? null : <Lines>{children}</Lines>}
        {actions === undefined ? null : <Actions>{actions}</Actions>}
      </Body>
      {trailingInTitle ? null : trailingNode}
    </Root>
  )
}
