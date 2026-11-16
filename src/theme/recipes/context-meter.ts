import { defineSlotRecipe } from '@pandacss/dev'

// The context meter of Workbench (D2 105:807 and 105:712, M3 105:2776): ten
// 4 × 8 segments with a 2 px gap, and the percentage in mono text. A normal
// meter fills in the accent colour; a high one, and its text, in amber.
export const contextMeter = defineSlotRecipe({
  className: 'context-meter',
  jsx: ['ContextMeter'],
  staticCss: ['*'],
  slots: ['root', 'segments', 'segment', 'value'],
  base: {
    root: { display: 'inline-flex', alignItems: 'center', gap: '6', flexShrink: '0' },
    segments: { display: 'flex', gap: '2' },
    segment: {
      w: '4',
      h: '8',
      borderRadius: 'hair',
      bg: 'border.default',
      '&[data-filled]': { bg: 'accent.default' },
    },
    value: { textStyle: 'mono', color: 'fg.muted', fontVariantNumeric: 'tabular-nums' },
  },
  variants: {
    level: {
      normal: {},
      high: {
        segment: { '&[data-filled]': { bg: 'status.needsYou.fg' } },
        value: { color: 'status.needsYou.fg' },
      },
    },
  },
  defaultVariants: { level: 'normal' },
})
