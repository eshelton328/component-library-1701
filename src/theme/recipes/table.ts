import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'
import { scrollAreaX } from './scroll-area'

// A table in chat Markdown output (screen review R51: a GFM table in a reply
// drew as loose text). No Figma frame draws one; the look follows the
// MarkdownView it sits in, on the 4 px grid:
// - frame: a 1 px border.default box with radius lg, as wide as the table
//   and at most as wide as its container. A wider table scrolls sideways in
//   the frame (`scrollAreaX`), so the page never does, and the frame then
//   takes the keyboard focus to scroll it, as CodeLines does.
// - head: the header row in `label` (Medium 14/20) fg.default, as
//   MarkdownView draws its subheadings, over a 1 px border.default line.
// - cells: `body` (Regular 14/20) fg.muted, as MarkdownView's paragraphs,
//   padded 8 by 12, the top of each cell on the row's top line. Rows are
//   split by 1 px border.default lines; the last row has none, so the frame
//   closes the table.
// - size sm: `bodySm` and `labelSm`, as a MarkdownView with size sm.
// - Alignment comes from `data-align` (left, center or right), which the
//   component reads from GFM's `align` or `style.textAlign`; the default is
//   start.
// Width: words stay whole. The table sets overflow-wrap normal, which
// resets the `anywhere` MarkdownView sets on its root: `anywhere` drops a
// cell's least width to one letter, so a wide table squeezed every column,
// the first one included, to a letter per line instead of scrolling (the
// first word "checkout-gateway" took 4 lines on the phone, R51). Inline code
// and links, where paths, hashes and URLs sit, break anywhere, so they never
// widen a column; a long token in plain text widens its column and the
// frame scrolls. The first column does not wrap at all, not even at a
// hyphen: it holds each row's name, which stays on one line, and a longer
// table scrolls in the frame. It is not sticky: a sticky cell needs an
// opaque fill equal to the surface behind the table (a message bubble, a
// pane, an Inbox section), which the table cannot know, and it would take
// much of a 390 px phone's width.
export const table = defineSlotRecipe({
  className: 'table',
  jsx: ['Table', 'TableHead', 'TableBody', 'TableRow', 'TableHeaderCell', 'TableCell'],
  staticCss: ['*'],
  slots: ['frame', 'table', 'head', 'body', 'row', 'headerCell', 'cell'],
  base: {
    frame: {
      w: 'fit-content',
      maxW: '100%',
      minW: '0',
      overflowX: 'auto',
      ...scrollAreaX,
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      borderRadius: 'lg',
      outline: 'none',
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
    },
    table: {
      borderCollapse: 'collapse',
      textStyle: 'body',
      color: 'fg.muted',
      overflowWrap: 'normal',
    },
    head: {
      borderBottomWidth: 'default',
      borderBottomStyle: 'solid',
      borderBottomColor: 'border.default',
    },
    body: {},
    row: {
      '&:not(:last-child)': { borderBottomWidth: 'default', borderBottomStyle: 'solid', borderBottomColor: 'border.default' },
    },
    headerCell: {
      py: '8',
      px: '12',
      textStyle: 'label',
      color: 'fg.default',
      textAlign: 'start',
      verticalAlign: 'bottom',
      _first: { whiteSpace: 'nowrap' },
      '&[data-align=left]': { textAlign: 'left' },
      '&[data-align=center]': { textAlign: 'center' },
      '&[data-align=right]': { textAlign: 'right' },
    },
    cell: {
      py: '8',
      px: '12',
      textAlign: 'start',
      verticalAlign: 'top',
      _first: { whiteSpace: 'nowrap' },
      '& :where(code, a)': { overflowWrap: 'anywhere' },
      '&[data-align=left]': { textAlign: 'left' },
      '&[data-align=center]': { textAlign: 'center' },
      '&[data-align=right]': { textAlign: 'right' },
    },
  },
  variants: {
    size: {
      md: {},
      sm: { table: { textStyle: 'bodySm' }, headerCell: { textStyle: 'labelSm' } },
    },
  },
  defaultVariants: { size: 'md' },
})
