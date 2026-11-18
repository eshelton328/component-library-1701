import { defineSlotRecipe } from '@pandacss/dev'

// The chat composer of Workbench (D2 105:889, composer states 402:8809,
// phone 402:8962, side chat 105:948): a surface.raised box with radius.xl,
// 10 px padding and an 8 px gap between the attachments, the text area and
// the row of buttons. Figma draws its border cyan on every frame; the
// inventory (inconsistency 13) makes it border.default, and border.selected
// while the composer has the focus.
//
// `layout="inline"` is the side chat in a pane (Workspaces D5 158:545): one
// 300 × 40 row with the placeholder (158:546) and a 22 px send button
// (158:548, icon/up 12, 158:549) at its end, padded 8 above and below, 10 at
// the start and 8 at the end (Figma's 9 and 11 less the 1 px border). d-100
// picks: the send button is Button size xs (control.xs, 24; Figma 22), so
// the row is 42 high (Figma 40) with Figma's 8 px padding; the icon stays
// the Button's icon.16 (Figma 12); the text keeps `body` (14/20), as the
// stacked composer does, with 2 px above and below so its first line lines
// up with the 24 px button. The button sits at the row's end and stays at
// the bottom as the text wraps.
export const composer = defineSlotRecipe({
  className: 'composer',
  jsx: ['Composer'],
  staticCss: ['*'],
  slots: ['root', 'row', 'text', 'model', 'attachment', 'attachmentIcon', 'attachmentName', 'attachmentRemove'],
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
      // The caret is the accent colour, as Workbench D1 105:240 draws it.
      '& textarea': { caretColor: 'accent.default' },
    },
    // The one row of `layout="inline"`: the text, then the buttons, bottom-aligned.
    // When the row is too narrow, it stays one row, as Figma draws it (d-100):
    // the text keeps at least 40 % of the row, the buttons keep their size, and
    // the model control shrinks; a ModelChip cuts its text and shows it whole
    // in a tooltip. Send so stays inside the border.
    row: { display: 'flex', alignItems: 'flex-end', gap: '8', minW: '0' },
    text: { flex: '1', minW: '40%' },
    model: { display: 'flex', flexShrink: '1', minW: '0' },
    // An attached file (105:890): surface.overlay, a border.default border,
    // radius.sm, 4 × 8 padding and Medium 11 text.
    attachment: {
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
    },
    // The clip is fg.default and the remove icon fg.muted, as Figma draws them (105:891, 105:894).
    attachmentIcon: { display: 'inline-flex', flexShrink: '0', color: 'fg.default' },
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
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
      _disabled: { cursor: 'not-allowed' },
    },
  },
  variants: {
    layout: {
      stacked: {},
      inline: {
        root: { py: '8', ps: '10', pe: '8', '& textarea': { py: '2' } },
      },
    },
  },
  defaultVariants: { layout: 'stacked' },
})
