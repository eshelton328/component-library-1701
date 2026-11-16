import { defineSlotRecipe } from '@pandacss/dev'

// The tablet and phone tab bar: tablet Inbox 346:5574 and phone Workbench
// 252:2. Idle tab 346:5575 (label 346:5580), selected tab 346:5581 (label
// 346:5589), icon 346:5577. The selected tab changes only its colour.
export const tabBar = defineSlotRecipe({
  className: 'tab-bar',
  jsx: ['TabBar'],
  staticCss: ['*'],
  slots: ['root', 'list', 'item', 'icon', 'label', 'hint'],
  base: {
    root: {
      display: 'block',
      w: '100%',
      // 77 high with the home-indicator area: Figma 7 + a 42 tab + 28 left
      // empty. Here the 1 px top border and the 8 px top leave 26 empty.
      h: 'shell.tabBar',
      // Keep the height beside a scrolling page in a flex column.
      flexShrink: '0',
      // Figma top 7 takes `8`, the larger of 6 and 8 (d-072); phone sides 8.
      pt: '8',
      px: '8',
      bg: 'surface.chrome',
      borderTopWidth: 'default',
      borderTopStyle: 'solid',
      borderTopColor: 'border.default',
    },
    list: { display: 'flex', alignItems: 'flex-start', gap: '0', listStyle: 'none', m: '0', p: '0', '& > li': { flex: '1', minW: '0' } },
    item: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      // Figma 3 takes `4`, the larger of 2 and 4 (d-072). 2 + 24 + 4 + 12 = 42, Figma's tab height.
      gap: '4',
      w: '100%',
      pt: '2',
      pb: '0',
      px: '0',
      borderRadius: 'md',
      borderWidth: '0',
      bg: 'transparent',
      color: 'fg.muted',
      cursor: 'pointer',
      outline: 'none',
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
      '&[aria-current="page"]': { color: 'fg.accent' },
    },
    icon: { position: 'relative', display: 'inline-flex', w: 'icon.24', h: 'icon.24', '& > svg': { w: 'icon.24!', h: 'icon.24!' } },
    label: { textStyle: 'navLabel', color: 'inherit', maxW: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    // The badge count for screen readers; the badge itself is hidden from them.
    hint: { srOnly: true },
  },
})
