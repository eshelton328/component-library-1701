import { defineSlotRecipe } from '@pandacss/dev'

// Code with line numbers, as the Toolkit D6 viewer draws a script
// (432:2304): Geist Mono 12/17 (`mono`), padding 14 (no token: 16, d-072),
// lines 2 apart, the number right-aligned and 14 before the code (16 here).
// Numbers are #8a97b8 (fg.muted), code #e6ecff (fg.default). No fill.
// Syntax colours: the caller splits a line into segments, and each segment's
// data-kind picks a `code.*` token. Figma colours only the shebang line,
// #6ee7a8 (`green`, 432:2307), which is code.comment; the other kinds take
// the kind palette's hues, and Light mode takes the kind palette's light
// values, all at least 4.5:1 on the surfaces the code sits on.
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
})
