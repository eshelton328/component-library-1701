import { defineRecipe } from '@pandacss/dev'
import { gap } from './gap'

// The layout components of d-066. Pages and parts place children only
// with these, because jsxStyleProps is 'none'. They are recipes, not Panda
// patterns: a pattern writes CSS only for the prop values it finds in the
// source, and a value an app passes would get none.

const align = {
  start: { alignItems: 'start' },
  center: { alignItems: 'center' },
  end: { alignItems: 'end' },
  stretch: { alignItems: 'stretch' },
} as const

/** Children one under the other. */
export const layoutStack = defineRecipe({
  className: 'stack',
  jsx: ['Stack'],
  staticCss: ['*'],
  base: { display: 'flex', flexDirection: 'column', minWidth: '0' },
  variants: { gap, align },
  defaultVariants: { gap: '12', align: 'stretch' },
})

/** Children in a row, optionally wrapped onto more rows. */
export const layoutInline = defineRecipe({
  className: 'inline',
  jsx: ['Inline'],
  staticCss: ['*'],
  base: { display: 'flex', flexDirection: 'row', minWidth: '0' },
  variants: {
    gap,
    align: { ...align, baseline: { alignItems: 'baseline' } },
    justify: {
      start: { justifyContent: 'start' },
      center: { justifyContent: 'center' },
      end: { justifyContent: 'end' },
      between: { justifyContent: 'space-between' },
    },
    wrap: { true: { flexWrap: 'wrap' }, false: { flexWrap: 'nowrap' } },
  },
  defaultVariants: { gap: '8', align: 'center', justify: 'start', wrap: false },
})

/** Children in equal columns. */
export const layoutGrid = defineRecipe({
  className: 'grid',
  jsx: ['Grid'],
  staticCss: ['*'],
  base: { display: 'grid', minWidth: '0' },
  variants: {
    gap,
    columns: {
      '1': { gridTemplateColumns: 'repeat(1, minmax(0, 1fr))' },
      '2': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
      '3': { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
      '4': { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' },
      '5': { gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' },
      '6': { gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' },
    },
  },
  defaultVariants: { gap: '16', columns: '1' },
})
