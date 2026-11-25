import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'

// A link inside running text that names a thing the app can open: a file
// (`FileChip`, the path in mono) or a chat (`MentionChip`). No Figma frame
// draws it; it takes the tokens of the chips beside it (meta chip:
// surface.inset, border.default, radius sm) and the accent of a Markdown
// link, so it reads as a link. Its text takes the font size and line
// height of the text around it, so it grows with the text sizes (d-122)
// and with a `sm` MarkdownView. A file chip is inline, not a box: a long
// path breaks anywhere and wraps with its fill and border on each line
// (`boxDecorationBreak: clone`). A mention chip never breaks (the owner,
// R75: "It should never break"): it is one inline flex box that moves to
// the next line whole. Its box is 4 px shorter than the line, with a 2 px
// margin above and below, so its line is no taller than the text round it
// and a chip on the next line keeps a gap (the Design System gate's
// no-touching-boxes, beta.129). A name wider than the
// column ends with an ellipsis (TruncatedText). Its text and icon are
// fg.default, not the accent (R75: "the chat links have white text"). The icon is 12 at Small and 16 at
// Default and Large (no 14 size token). Like a Markdown link it takes no
// touch target (d-121): a target round a word in a paragraph would take
// the taps of the lines above and below it.
export const inlineChip = defineSlotRecipe({
  className: 'inline-chip',
  jsx: ['FileChip', 'MentionChip'],
  staticCss: ['*'],
  slots: ['root', 'icon', 'label', 'detail'],
  base: {
    root: {
      display: 'inline',
      px: '4',
      bg: 'surface.inset',
      color: 'fg.accent',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      borderRadius: 'sm',
      boxDecorationBreak: 'clone',
      overflowWrap: 'anywhere',
      textDecoration: 'none',
      cursor: 'pointer',
      outline: 'none',
      _hover: { borderColor: 'border.active' },
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
    },
    icon: {
      display: 'inline-block',
      verticalAlign: 'middle',
      me: '4',
      '& svg': { w: 'icon.12!', h: 'icon.12!', display: 'block' },
      _textDefault: { '& svg': { w: 'icon.16!', h: 'icon.16!' } },
      _textLarge: { '& svg': { w: 'icon.16!', h: 'icon.16!' } },
    },
    label: {},
    detail: { color: 'fg.muted' },
  },
  variants: {
    kind: {
      file: { label: { fontFamily: 'mono' }, detail: { fontFamily: 'mono' } },
      mention: {
        root: {
          display: 'inline-flex',
          alignItems: 'center',
          verticalAlign: 'top',
          maxW: '100%',
          h: 'calc(1lh - token(spacing.4))',
          my: '2',
          color: 'fg.default',
        },
        icon: { flexShrink: '0' },
        label: { minW: '0', fontWeight: 'text.heading' },
      },
    },
  },
  defaultVariants: { kind: 'file' },
})
