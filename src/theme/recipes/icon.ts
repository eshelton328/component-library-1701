import { defineRecipe } from '@pandacss/dev'

// The size of an icon from src/foundations/icons.tsx. Each icon is drawn on
// a 24 grid; the recipe scales it to one of the sizes.icon tokens.
export const icon = defineRecipe({
  className: 'icon',
  jsx: ['Icon'],
  staticCss: ['*'],
  base: {
    display: 'inline-block',
    flexShrink: '0',
    verticalAlign: 'middle',
  },
  variants: {
    size: {
      '12': { w: 'icon.12', h: 'icon.12' },
      '16': { w: 'icon.16', h: 'icon.16' },
      '20': { w: 'icon.20', h: 'icon.20' },
      '24': { w: 'icon.24', h: 'icon.24' },
    },
  },
  defaultVariants: { size: '24' },
})
