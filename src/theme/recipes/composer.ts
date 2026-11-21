import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'
import { scrollAreaNested } from './scroll-area'

// The chat composer of Workbench (D2 105:889, composer states 402:8809,
// phone 402:8962, side chat 105:948): a surface.raised box with radius.xl,
// 10 px padding and an 8 px gap between the attachments, the text area and
// the row of buttons. Figma draws its border cyan on every frame; the
// inventory (inconsistency 13) makes it border.default, and border.selected
// while the composer has the focus.
//
// The attach button draws a 16 px paperclip, or the glyph the caller gives
// in `attachIcon` at that icon's own size (`keepIconSize`): Workspaces D04's
// add button (137:5, 27 px) draws a 13 px plus (137:6), which a caller
// gives as `<PlusIcon size="12" />` (icon.12, d-100).
//
// `layout="inline"` is the side chat in a pane (Workspaces D5 158:545): one
// 300 × 40 row with the placeholder (158:546) and a 22 px send button
// (158:548, icon/up 12, 158:549) at its end, padded 8 above and below, 10 at
// the start and 8 at the end (Figma's 9 and 11 less the 1 px border). d-100
// picks: the send button is Button size xs (control.xs, 24; Figma 22), so
// the row is 42 high (Figma 40) with Figma's 8 px padding; the arrow is
// icon.16 unless the caller sets `sendIconSize="12"` (Figma 12, 158:549),
// which the Button keeps with `keepIconSize`; the text keeps `body` (14/20), as the
// stacked composer does, with 2 px above and below so its first line lines
// up with the 24 px button. The button sits at the row's end and stays at
// the bottom as the text wraps.
//
// Attachment states (the-bridge W1b, uploads of any file up to 1 GB; Figma
// draws only the ready chip, 105:890, so each state takes library tokens):
// an `uploading` chip draws a 2 px bar (spacing.2, radius.hair) along its
// foot, inside its 8 px side padding: the track border.default and the fill
// accent.default, as ContextMeter draws its empty and filled segments. The
// component sets the fill's share in --composer-progress. A `failed` chip
// draws its border in status.danger.border and a 12 px warning sign in
// status.danger.fg, and a Retry text button in the chip's pill style and
// fg.accent, with the focus ring the remove button has. Many chips wrap and
// stop at two and a half 28 px rows (2.5 × control.sm, 70), so a sliver of
// the third shows; past that they scroll inside the composer, which so keeps
// Send in view at 390 px wide. With `onAddFiles`, a file dragged over the
// composer dashes its border in border.active (a drop target), over the
// focus colour.
export const composer = defineSlotRecipe({
  className: 'composer',
  jsx: ['Composer'],
  staticCss: ['*'],
  slots: [
    'root',
    'row',
    'text',
    'model',
    'attachments',
    'attachment',
    'attachmentIcon',
    'attachmentName',
    'attachmentRemove',
    'attachmentRetry',
    'attachmentProgress',
    'attachmentProgressFill',
  ],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8',
      minW: '0',
      p: '10',
      bg: 'surface.raised',
      color: 'fg.default',
      borderRadius: 'xl',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      _focusWithin: { borderColor: 'border.selected' },
      // A file is over the composer (onAddFiles); it wins over the focus colour.
      '&[data-drop-target], &[data-drop-target]:focus-within': { borderColor: 'border.active', borderStyle: 'dashed' },
      // The caret is the accent colour, as Workbench D1 105:240 draws it.
      // A long draft grows the text to at most 30% of the nearest size container (a pane, or the parent of a
      // ScrollFrame; with none, 30% of the window), less the composer's own padding, border, gap and button
      // row, so the whole box stops at 30%. Past that the text scrolls inside. The cap never goes below one
      // line, so a composer at rest keeps its height in any frame and nothing clips it (d-107).
      '& textarea': {
        caretColor: 'accent.default',
        maxH: 'max(token(spacing.20), calc(30cqh - 2 * token(spacing.10) - token(spacing.8) - token(sizes.control.sm) - 2 * token(borderWidths.default)))',
      },
    },
    // The one row of `layout="inline"`: the text, then the buttons, bottom-aligned.
    // When the row is too narrow, it stays one row, as Figma draws it (d-100):
    // the text keeps at least 40 % of the row, the buttons keep their size, and
    // the model control shrinks; a ModelChip cuts its text and shows it whole
    // in a tooltip. Send so stays inside the border.
    row: { display: 'flex', alignItems: 'flex-end', gap: '8', minW: '0' },
    text: { flex: '1', minW: '40%' },
    model: { display: 'flex', flexShrink: '1', minW: '0' },
    // The chips: they wrap, and past two and a half rows they scroll inside the composer.
    attachments: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6',
      minW: '0',
      flexShrink: '0',
      maxH: 'calc(2.5 * token(sizes.control.sm))',
      overflowX: 'hidden',
      overflowY: 'auto',
      ...scrollAreaNested,
      // A long name never widens the composer: the list takes its width from the composer, not from its chips.
      contain: 'inline-size',
      borderRadius: 'xs',
      outline: 'none',
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
    },
    // An attached file (105:890): surface.overlay, a border.default border,
    // radius.sm, 4 × 8 padding and Medium 11 text.
    attachment: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6',
      minW: '0',
      maxW: '100%',
      py: '4',
      px: '8',
      bg: 'surface.overlay',
      color: 'fg.default',
      textStyle: 'pill',
      borderRadius: 'sm',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      '&[data-status="failed"]': { borderColor: 'status.danger.border' },
    },
    // The clip is fg.default and the remove icon fg.muted, as Figma draws them (105:891, 105:894).
    attachmentIcon: {
      display: 'inline-flex',
      flexShrink: '0',
      color: 'fg.default',
      '[data-status="failed"] > &': { color: 'status.danger.fg' },
    },
    // TruncatedText inside cuts a long file name and shows it whole in a tooltip.
    attachmentName: { minW: '0' },
    attachmentRemove: {
      display: 'inline-flex',
      flexShrink: '0',
      p: '0',
      color: 'fg.muted',
      bg: 'transparent',
      borderWidth: '0',
      borderRadius: 'xs',
      cursor: 'pointer',
      outline: 'none',
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
      _disabled: { cursor: 'not-allowed' },
    },
    attachmentRetry: {
      display: 'inline-flex',
      flexShrink: '0',
      p: '0',
      color: 'fg.accent',
      bg: 'transparent',
      textStyle: 'pill',
      borderWidth: '0',
      borderRadius: 'xs',
      cursor: 'pointer',
      outline: 'none',
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
      _disabled: { cursor: 'not-allowed' },
    },
    attachmentProgress: {
      position: 'absolute',
      insetInline: '8',
      bottom: '0',
      h: '2',
      overflow: 'hidden',
      borderRadius: 'hair',
      bg: 'border.default',
    },
    attachmentProgressFill: {
      display: 'block',
      h: '100%',
      w: 'calc(var(--composer-progress, 0) * 100%)',
      bg: 'accent.default',
    },
  },
  variants: {
    layout: {
      stacked: {},
      inline: {
        root: {
          py: '8',
          ps: '10',
          pe: '8',
          // One row: the text (2 px above and below its line, a control.xs high) beside the buttons.
          '& textarea': {
            py: '2',
            maxH: 'max(token(sizes.control.xs), calc(30cqh - 2 * token(spacing.8) - 2 * token(borderWidths.default)))',
          },
        },
      },
    },
    // `collapsed` (screen review R31): the stacked composer at rest on a phone, one row at the same width, as the
    // Claude iOS app draws its message box with the keyboard closed. The paperclip, the text on one line with its
    // placeholder, then Send; the model and Stop are not drawn. The composer keeps its DOM: the button rows lay out
    // their buttons in the root's own row (`display: contents`), and the start row's buttons come before the text.
    // The root's padding and its 8 px gap stay, so the row is 50 high (10 + control.sm 28 + 10 and the border).
    // The text keeps one line: it stops at one 20 px line (`body`) and scrolls past it.
    collapsed: {
      true: {
        root: {
          flexDirection: 'row',
          alignItems: 'center',
          // The text field: the rest of the row.
          '& > [data-scope="field"]': { flex: '1', minW: '0' },
          '& > [data-composer-controls], & > [data-composer-controls] > div': { display: 'contents' },
          '& [data-composer-group="start"] > *': { order: '-1' },
          '& textarea': { maxH: 'token(spacing.20)' },
        },
      },
      false: {},
    },
  },
  defaultVariants: { layout: 'stacked', collapsed: false },
})
