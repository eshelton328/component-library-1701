import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'

// A link inside running text that names a thing the app can open: a file
// (`FileChip`, the path in mono) or a chat (`MentionChip`). No Figma frame
// draws it; it takes the tokens of the chips beside it (meta chip:
// surface.inset, border.default, radius sm) and the accent of a Markdown
// link, so it reads as a link. The chip is inline, not a box: its text
// takes the font size and line height of the text around it, so it grows
// with the text sizes (d-122) and with a `sm` MarkdownView, and a long
// path breaks anywhere and wraps with its fill and border on each line
// (`boxDecorationBreak: clone`). The icon is 12 at Small and 16 at
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
      mention: { label: { fontWeight: 'text.heading' } },
    },
  },
  defaultVariants: { kind: 'file' },
})
