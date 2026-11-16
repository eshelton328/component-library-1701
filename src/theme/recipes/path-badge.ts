import { defineSlotRecipe } from '@pandacss/dev'

// The path badge of the Toolkit item page (D3 457:46): folder icon, the
// path in mono, an optional trailing action (Figma draws a copy icon).
// Padding 8/3, gap 6, radius 6, `surface.raised` fill and a 1 px border.
export const pathBadge = defineSlotRecipe({
  className: 'path-badge',
  jsx: ['PathBadge'],
  staticCss: ['*'],
  slots: ['root', 'icon', 'path', 'trailing'],
  base: {
    root: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6',
      minW: '0',
      maxW: 'full',
      px: '8',
      py: '4',
      bg: 'surface.raised',
      color: 'fg.default',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      borderRadius: 'sm',
      textStyle: 'mono',
      whiteSpace: 'nowrap',
    },
    icon: {
      display: 'inline-flex',
      flexShrink: '0',
      '& svg': { w: 'icon.12', h: 'icon.12' },
    },
    path: { minW: '0', overflow: 'hidden', textOverflow: 'ellipsis', textStyle: 'mono' },
    trailing: { display: 'inline-flex', flexShrink: '0', '& svg': { w: 'icon.12', h: 'icon.12' } },
  },
})
