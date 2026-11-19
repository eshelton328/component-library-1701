import { defineSlotRecipe } from '@pandacss/dev'

// A symbol character inside a line of text, such as the ✗ (U+2717) and ✓
// (U+2713) of the hook's test line on Toolkit D28 (492:2185), T27 (492:3729)
// and M30 (492:4990): "…the rule’s ✗ and ✓ examples…". Figma draws the cross
// slanted, as a hand-drawn mark. The text fonts (Geist) have neither
// character, so a browser draws them in its fallback font, where ✗ looks like
// the sign ×. The glyph keeps the character in the text, so the line reads,
// copies and finds as Figma's string, and draws it as a mark icon:
//
// - `root` is an inline box the size of the icon, in the line's colour,
//   centred on the line as an icon in text is.
// - `char` holds the character over the icon, in the line's font, with no
//   colour (`transparent`), so it is text that assistive technology reads
//   and a selection copies, but never paints. It does not clip, so its
//   whole glyph stays in view.
// - The icon (`CrossMarkIcon`, `CheckMarkIcon`) paints in currentColor.
export const glyph = defineSlotRecipe({
  className: 'glyph',
  jsx: ['Glyph'],
  staticCss: ['*'],
  slots: ['root', 'char'],
  base: {
    root: {
      position: 'relative',
      display: 'inline-flex',
      verticalAlign: 'middle',
      flexShrink: '0',
    },
    char: {
      position: 'absolute',
      inset: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
      whiteSpace: 'nowrap',
      color: 'transparent',
    },
  },
})
