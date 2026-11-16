import { defineSlotRecipe } from '@pandacss/dev'

// The Span logo, `logo · Span (home)` at the top of the nav rail (402:15331,
// the same on every desktop screen): a bridge in the accent colour (Figma
// #5EE1FF, `fg.accent`) under a spark in the text colour (Figma #E6ECFF,
// `fg.default`). The bridge strokes in currentColor, which the root sets to
// `fg.accent`, so the logo looks the same inside any text colour.
export const logo = defineSlotRecipe({
  className: 'logo',
  jsx: ['Logo'],
  staticCss: ['*'],
  slots: ['root', 'spark'],
  base: {
    root: { display: 'inline-block', flexShrink: '0', verticalAlign: 'middle', color: 'fg.accent' },
    spark: { fill: 'fg.default' },
  },
  variants: {
    size: {
      // Figma draws the logo at 28 px; `kindTile.sm` is the 28 px size token,
      // the same box as the kind tiles beside it in lists.
      '28': { root: { w: 'kindTile.sm', h: 'kindTile.sm' } },
      // A smaller logo for a rail item's 24 px icon box.
      '24': { root: { w: 'icon.24', h: 'icon.24' } },
    },
  },
  defaultVariants: { size: '28' },
})
