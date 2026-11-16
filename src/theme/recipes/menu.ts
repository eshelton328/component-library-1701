import { menuAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'

// The menus of Workbench (chat actions, D2b and M9), the row menu and the
// sort menu: items with an icon, separators, a highlighted item, a danger
// item and, for sort, a checked item.
export const menu = defineSlotRecipe({
  className: 'menu',
  jsx: ['Menu'],
  staticCss: ['*'],
  slots: menuAnatomy.keys(),
  base: {
    content: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2',
      minW: 'shell.popoverSm',
      // Ark measures the space between the trigger and the screen edge; a long menu scrolls.
      maxH: 'var(--available-height)',
      overflowY: 'auto',
      p: '6',
      bg: 'surface.overlay',
      color: 'fg.default',
      borderRadius: 'xl',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      boxShadow: 'overlay',
      outline: 'none',
      _closed: { display: 'none' },
    },
    item: {
      display: 'flex',
      flexShrink: '0',
      alignItems: 'center',
      gap: '10',
      h: 'control.md',
      px: '10',
      textStyle: 'label',
      borderRadius: 'lg',
      color: 'fg.default',
      cursor: 'pointer',
      userSelect: 'none',
      outline: 'none',
      '& svg': { width: 'icon.16!', height: 'icon.16!', flexShrink: '0', color: 'fg.muted' },
      // The check of a picked choice is the accent colour, not the icon colour.
      '& [data-part=item-indicator] svg': { color: 'accent.default' },
      _highlighted: { bg: 'surface.selected' },
      _disabled: { cursor: 'not-allowed', opacity: 'disabled' },
      // A danger item, such as Delete.
      '&[data-tone=danger]': { color: 'status.danger.fg', '& svg': { color: 'status.danger.fg' } },
    },
    itemIndicator: { display: 'inline-flex', ms: 'auto', color: 'accent.default' },
    itemText: { flex: '1', whiteSpace: 'nowrap' },
    itemGroupLabel: { px: '10', py: '6', textStyle: 'small', color: 'fg.subtle' },
    separator: { borderTopWidth: 'default', borderTopStyle: 'solid', borderColor: 'border.default', my: '4', mx: '0' },
  },
})
