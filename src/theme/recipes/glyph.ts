import { defineSlotRecipe } from '@pandacss/dev'

// A symbol character inside a line of text, such as the ✗ (U+2717) and ✓
// (U+2713) of the hook's test line on Toolkit D28 (492:2185), T27 (492:3729)
// and M30 (492:4990): "…the rule’s ✗ and ✓ examples…". Figma draws the cross
// slanted, as a hand-drawn mark. The text fonts (Geist) have neither
// character, so a browser draws them in its fallback font, where ✗ looks like
// the sign ×. The glyph keeps the character in the text, so the line reads,
// copies and finds as Figma's string, and draws it as a mark icon:
//
// - `root` is a plain inline box, so the character stays in the line's inline
//   text flow: a find in page (Ctrl+F, `window.find`) matches across it, such
//   as "✗ and ✓", and a copy and `innerText` give Figma's string. An
//   inline-block, inline-flex, inline-grid or absolutely placed character
//   breaks the match in Chromium (Codex review, PR #209). `nowrap` keeps the
//   icon and its character on one line.
// - The icon (`CrossMarkIcon`, `CheckMarkIcon`) is in the flow beside the
//   character, centred on the line by the `icon` recipe (`verticalAlign:
//   middle`), and paints in currentColor. Its width is the glyph's width, the
//   icon size, as the text around it has no character of that width.
// - `char` holds the character at font size 0 and line height 0, with no
//   colour (`transparent`): it is text that assistive technology reads once
//   (the icon is `aria-hidden`), a selection copies and a find matches, but it
//   takes no width, paints nothing and does not make the line taller.
export const glyph = defineSlotRecipe({
  className: 'glyph',
  jsx: ['Glyph'],
  staticCss: ['*'],
  slots: ['root', 'char'],
  base: {
    root: {
      display: 'inline',
      whiteSpace: 'nowrap',
    },
    char: {
      display: 'inline',
      fontSize: '0',
      lineHeight: '0',
      color: 'transparent',
    },
  },
})
