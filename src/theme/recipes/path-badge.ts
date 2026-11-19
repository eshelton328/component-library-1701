import { defineSlotRecipe } from '@pandacss/dev'

// The path badge of the Toolkit item page (D3 457:46): folder icon, the
// path in mono, an optional trailing action and the copy icon (`onCopy`).
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
      maxW: '100%',
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
    icon: { display: 'inline-flex', flexShrink: '0' },
    // TruncatedText inside cuts a long path and shows it whole in a tooltip.
    path: { minW: '0', textStyle: 'mono' },
    // The trailing action, then the copy icon that `onCopy` draws: a bare
    // 12 px `icon/copy` (D3 457:50, M2 457:192, T17 487:498, D10 457:127), a
    // BareIconButton, so the badge stays 25 high (213 x 25 in D3 457:46).
    trailing: { display: 'inline-flex', alignItems: 'center', gap: '6', flexShrink: '0', '& svg': { w: 'icon.12!', h: 'icon.12!' } },
  },
  variants: {
    // A file's own page on the phone draws a 16 px code icon (M06 435:494,
    // M08 440:1522); every other badge draws 12. The variant sets the
    // size, not base, so `!` wins over the icon's own size.
    iconSize: {
      sm: { icon: { '& svg': { w: 'icon.12!', h: 'icon.12!' } } },
      md: { icon: { '& svg': { w: 'icon.16!', h: 'icon.16!' } } },
    },
  },
  defaultVariants: { iconSize: 'sm' },
})
