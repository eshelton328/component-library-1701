import { defineSlotRecipe } from '@pandacss/dev'

// The items of the phone More drawer: Artifacts M8 (415:315) and Toolkit M4
// (424:6940). The drawer itself is the `lg` bottom sheet. Selected
// (415:320), idle (429:512) and disabled (415:332) items; the "Later" group
// label (415:331).
export const moreDrawer = defineSlotRecipe({
  className: 'more-drawer',
  jsx: ['MoreDrawer'],
  staticCss: ['*'],
  slots: ['group', 'groupLabel', 'list', 'item', 'tile', 'body', 'label', 'description', 'count', 'chevron'],
  base: {
    group: { display: 'flex', flexDirection: 'column', gap: '4' },
    // Figma pt 14 takes `16`, the larger of 12 and 16 (d-072).
    groupLabel: { textStyle: 'eyebrow', textTransform: 'uppercase', color: 'fg.muted', pt: '16', pb: '2', ps: '4' },
    list: { display: 'flex', flexDirection: 'column', gap: '4', listStyle: 'none', m: '0', p: '0' },
    item: {
      display: 'flex',
      alignItems: 'center',
      gap: '12',
      w: '100%',
      p: '12',
      borderRadius: 'lg',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'transparent',
      bg: 'transparent',
      color: 'fg.default',
      textAlign: 'start',
      cursor: 'pointer',
      outline: 'none',
      _hover: { bg: 'accent.faint' },
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
      '&[aria-current="page"]': { bg: 'surface.selected', borderColor: 'border.selected' },
      _disabled: { opacity: 'disabled', cursor: 'default', bg: 'transparent', '& .more-drawer__tile': { bg: 'surface.inset' } },
    },
    tile: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: '0',
      w: 'kindTile.lg',
      h: 'kindTile.lg',
      borderRadius: 'md',
      bg: 'accent.subtle',
      '& svg': { w: 'icon.20!', h: 'icon.20!' },
    },
    body: { display: 'flex', flexDirection: 'column', gap: '2', flex: '1', minW: '0' },
    // Figma's Medium 15 (415:320) merges into `labelLg` (d-074).
    label: { textStyle: 'labelLg', color: 'fg.default' },
    description: { textStyle: 'small', color: 'fg.muted' },
    count: { flexShrink: '0', textStyle: 'mono', color: 'fg.muted' },
    chevron: { flexShrink: '0', w: 'icon.16', h: 'icon.16', color: 'fg.muted' },
  },
})
