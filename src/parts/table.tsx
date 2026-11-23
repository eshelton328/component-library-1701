import type { ComponentProps, CSSProperties } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { table, type TableVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'

const { withProvider, withContext } = createSlotRecipeContext(table)
const Frame = withProvider('div', 'frame')
const TableElement = withContext('table', 'table')
const Head = withContext('thead', 'head')
const Body = withContext('tbody', 'body')
const Row = withContext('tr', 'row')
const HeaderCell = withContext('th', 'headerCell')
const Cell = withContext('td', 'cell')

/**
 * The prop a Markdown renderer such as react-markdown adds to each element
 * it hands to a component override: the syntax tree node. The table parts
 * drop it, so `components={{ table: Table, … }}` works with no wrapper.
 */
export type MarkdownNodeProps = {
  /** react-markdown's syntax tree node. Ignored: it never reaches the DOM. */
  node?: unknown
}

/** The alignment of a column, as a GFM delimiter row sets it: `:--` left, `:-:` center, `--:` right. */
export type TableAlign = 'left' | 'center' | 'right'

export type TableProps = ComponentProps<'table'> &
  MarkdownNodeProps & {
    /** The text size: `md` (the default) for `body` cells and `label` headers, `sm` for `bodySm` and `labelSm`, to match a MarkdownView with size sm. */
    size?: Scalar<TableVariantProps>['size']
  }
/** The props of a `thead`. */
export type TableHeadProps = ComponentProps<'thead'> & MarkdownNodeProps
/** The props of a `tbody`. */
export type TableBodyProps = ComponentProps<'tbody'> & MarkdownNodeProps
/** The props of a `tr`. */
export type TableRowProps = ComponentProps<'tr'> & MarkdownNodeProps
/**
 * The props of a `th`. `align`, or `style.textAlign` as react-markdown
 * writes GFM alignment, sets the cell's {@link TableAlign}; the cell draws it
 * from the recipe and sets no inline style, so the rest of `style` is not
 * drawn.
 */
export type TableHeaderCellProps = ComponentProps<'th'> & MarkdownNodeProps
/** The props of a `td`. `align` and `style.textAlign` work as on {@link TableHeaderCellProps}. */
export type TableCellProps = ComponentProps<'td'> & MarkdownNodeProps

/**
 * A table, such as a GFM table in a chat reply: pass `Table`, `TableHead`,
 * `TableBody`, `TableRow`, `TableHeaderCell` and `TableCell` to
 * react-markdown as the `table`, `thead`, `tbody`, `tr`, `th` and `td`
 * overrides, or write them yourself. The header row is in `label`
 * fg.default and the cells in `body` fg.muted, 8 by 12 apart, with 1 px
 * lines between the rows, in a bordered frame. The frame is as wide as the
 * table and at most as wide as its container; a wider table scrolls
 * sideways in it, with no scroll bar, and the page does not. Words stay
 * whole, so a column is never narrower than its longest word; inline code
 * and links (paths, hashes, URLs) break anywhere.
 */
export function Table({ size, ...props }: TableProps) {
  return (
    // The frame takes the focus, so the arrow keys scroll a wide table.
    <Frame size={size} tabIndex={0}>
      <TableElement {...dom(props)} />
    </Frame>
  )
}

/** The header rows of a {@link Table}, over a 1 px line. */
export function TableHead(props: TableHeadProps) {
  return <Head {...dom(props)} />
}

/** The body rows of a {@link Table}. */
export function TableBody(props: TableBodyProps) {
  return <Body {...dom(props)} />
}

/** A row of a {@link Table}; each row but the last has a 1 px line under it. */
export function TableRow(props: TableRowProps) {
  return <Row {...dom(props)} />
}

/** A header cell of a {@link Table}, in `label` (`labelSm` at size sm) fg.default, aligned at the start unless `align` says otherwise. */
export function TableHeaderCell({ align, style, ...props }: TableHeaderCellProps) {
  return <HeaderCell {...dom(props)} data-align={alignOf(align, style)} />
}

/** A cell of a {@link Table}, in the table's text style, aligned at the start unless `align` says otherwise. */
export function TableCell({ align, style, ...props }: TableCellProps) {
  return <Cell {...dom(props)} data-align={alignOf(align, style)} />
}

// The element props without react-markdown's `node`, which React would write to the DOM.
function dom<P extends MarkdownNodeProps>(props: P): P {
  const copy = { ...props }
  delete copy.node
  return copy
}

// GFM alignment: react-markdown writes `style={{ textAlign }}`, other renderers the `align` attribute.
function alignOf(align: string | undefined, style: CSSProperties | undefined): TableAlign | undefined {
  const value = style?.textAlign ?? align
  return value === 'left' || value === 'center' || value === 'right' ? value : undefined
}
