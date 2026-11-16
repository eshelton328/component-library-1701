import { defineSlotRecipe } from '@pandacss/dev'

// The chat composer of Workbench (D2 105:889, composer states 402:8809,
// phone 402:8962, side chat 105:948): a surface.raised box with radius.xl,
// 10 px padding and an 8 px gap between the attachments, the text area and
// the row of buttons. Figma draws its border cyan on every frame; the
// inventory (inconsistency 13) makes it border.default, and border.selected
// while the composer has the focus.
export const composer = defineSlotRecipe({
  className: 'composer',
  jsx: ['Composer'],
  staticCss: ['*'],
  slots: ['root', 'attachment', 'attachmentIcon', 'attachmentName', 'attachmentRemove'],
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
    // An attached file (105:890): surface.overlay, a border.default border,
    // radius.sm, 4 × 8 padding and Medium 11 text.
    attachment: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6',
      minW: '0',
      maxW: 'full',
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
    attachmentIcon: { w: 'icon.12', h: 'icon.12', flexShrink: '0', color: 'fg.muted' },
    attachmentName: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
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
      '& svg': { w: 'icon.12', h: 'icon.12' },
    },
  },
})
