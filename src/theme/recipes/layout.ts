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

/**
 * The padding of a page's content, per frame size. The library has no
 * breakpoint tokens, so the page passes `size` (desktop, tablet, phone).
 * - desktop: the Inbox task, D1 346:306: 24 top, 28 bottom, 36 sides.
 *   The inventory merges 28 and 36 into 32 or 40; ties take the larger
 *   token (d-072), so 32 and 40.
 * - tablet: Inbox T1 content 346:5414: 12 top, 20 bottom, 22 sides (24, d-072).
 * - phone: Inbox M1 content 346:9007: 4 top, 12 bottom, 12 sides.
 * - detail: a detail column, such as the Inbox task (D1 346:306): the
 *   desktop padding, and its content at most `shell.detail` (748) wide,
 *   at the start of the pane. Figma draws 820 with 36 sides; 36 takes 40
 *   (d-072), so the column is at most 828 wide. The box is content-box,
 *   so the max width holds the content and the padding sits outside it.
 * The other sizes have no max width.
 */
export const layoutContainer = defineRecipe({
  className: 'container',
  jsx: ['Container'],
  staticCss: ['*'],
  base: { display: 'flex', flexDirection: 'column', minWidth: '0', w: '100%' },
  variants: {
    size: {
      desktop: { pt: '24', pb: '32', px: '40' },
      tablet: { pt: '12', pb: '20', px: '24' },
      phone: { pt: '4', pb: '12', px: '12' },
      detail: { pt: '24', pb: '32', px: '40', boxSizing: 'content-box', w: 'auto', maxW: 'shell.detail' },
    },
    gap,
  },
  defaultVariants: { size: 'desktop', gap: '0' },
})
