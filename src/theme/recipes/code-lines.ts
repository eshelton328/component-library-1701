import { defineSlotRecipe } from '@pandacss/dev'

// Code with line numbers, as the Toolkit D6 viewer draws a script
// (432:2304): Geist Mono 12/17 (`mono`), padding 14 (no token: 16, d-072),
// lines 2 apart, the number right-aligned and 14 before the code (16 here).
// Numbers are #8a97b8 (fg.muted), code #e6ecff (fg.default). No fill.
export const codeLines = defineSlotRecipe({
  className: 'code-lines',
  jsx: ['CodeLines'],
  staticCss: ['*'],
  slots: ['root', 'number', 'text'],
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
  },
})
