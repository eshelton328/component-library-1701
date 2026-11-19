import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'
import { scrollAreaX } from './scroll-area'

// Code with line numbers, as the Toolkit D6 viewer draws a script
// (432:2304): Geist Mono 12/17 (`mono`), padding 14 (no token: 16, d-072),
// lines 2 apart, the number right-aligned and 14 before the code (16 here).
// Numbers are #8a97b8 (fg.muted), code #e6ecff (fg.default). No fill.
// Syntax colours: the caller splits a line into segments, and each segment's
// data-kind picks a `code.*` token. Figma colours only the shebang line,
// #6ee7a8 (`green`, 432:2307), which is code.comment; the other kinds take
// the kind palette's hues, and Light mode takes the kind palette's light
// values, all at least 4.5:1 on the surfaces the code sits on.
// wrap: on the phone a line longer than the box wraps under itself, as the
// Toolkit M22 script draws it (`code` 487:2231): lines 3, 4, 5 and 8
// (487:2238, 487:2241, 487:2244, 487:2253) are two lines high in the text
// column, the number on the first. Same tokens; only white-space changes.
export const codeLines = defineSlotRecipe({
  className: 'code-lines',
  jsx: ['CodeLines'],
  staticCss: ['*'],
  slots: ['root', 'number', 'text', 'segment'],
  base: {
    root: {
      display: 'grid',
      gridTemplateColumns: 'auto minmax(0, 1fr)',
      columnGap: '16',
      rowGap: '2',
      m: '0',
      p: '16',
      textStyle: 'mono',
      color: 'fg.default',
      overflowX: 'auto',
      ...scrollAreaX,
      // The box is a tab stop when it can scroll sideways (not with wrap), so the keyboard can scroll it.
      outline: 'none',
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '-2' },
    },
    number: {
      textAlign: 'end',
      color: 'fg.muted',
      userSelect: 'none',
      fontVariantNumeric: 'tabular-nums',
    },
    text: { whiteSpace: 'pre', minW: '0' },
    segment: {
      '&[data-kind=keyword]': { color: 'code.keyword' },
      '&[data-kind=string]': { color: 'code.string' },
      '&[data-kind=comment]': { color: 'code.comment' },
      '&[data-kind=number]': { color: 'code.number' },
      '&[data-kind=function]': { color: 'code.function' },
    },
  },
  variants: {
    // false (the default): each line stays on one line and the box scrolls sideways. true: a long line wraps
    // inside the text column, keeping its spaces and breaking a word longer than the column, so nothing is cut and
    // nothing scrolls sideways; the number stays at the top of its grid row, on the line's first visual line.
    wrap: {
      true: {
        root: { overflowX: 'visible' },
        text: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
      },
      false: {},
    },
  },
  defaultVariants: { wrap: false },
})
