import { defineSlotRecipe } from '@pandacss/dev'

// The context meter of Workbench (D2 105:807 and 105:712, M3 105:2776): ten
// 4 × 8 segments with a 2 px gap, and the percentage in mono text. A normal
// meter fills in the accent colour; a high one, and its text, in amber.
// Figma's meter is 83 wide (D1 105:187, D2 105:650, D2b 402:5378): 58 of
// segments, a 5 px gap, and "42%" at 11 px mono, 20 wide (D2b 402:5381).
// The gap is 4, the nearest step on the 4 px grid that keeps the meter
// inside 83 (d-100), and the text is monoSm.
export const contextMeter = defineSlotRecipe({
  className: 'context-meter',
  jsx: ['ContextMeter'],
  staticCss: ['*'],
  slots: ['root', 'segments', 'segment', 'value'],
  base: {
    root: { display: 'inline-flex', alignItems: 'center', gap: '4', flexShrink: '0' },
    segments: { display: 'flex', gap: '2' },
    segment: {
      w: '4',
      h: '8',
      borderRadius: 'hair',
      bg: 'border.default',
      '&[data-filled]': { bg: 'accent.default' },
    },
    value: { textStyle: 'monoSm', color: 'fg.muted', fontVariantNumeric: 'tabular-nums' },
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
