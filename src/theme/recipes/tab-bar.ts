import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'
import { tabBarHeight } from './tab-bar-height'

// The tablet and phone tab bar: tablet Inbox 346:5574 and phone Workbench
// 252:2. Idle tab 346:5575 (label 346:5580), selected tab 346:5581 (label
// 346:5589), icon 346:5577. The selected tab changes only its colour.
// size phone (the default): the tabs share the whole width (252:3).
// size tablet: the bar spans the 756 px frame (Toolkit T01 424:3863) and
// the tabs form one centred group, shell.tabGroup (456) wide, x 150 to
// 606: six tabs of 76 (Toolkit T01 424:3864, 424:3870, 424:3879, 424:3888,
// 424:3894, 424:3899) or five of 91.2 (Inbox T1 346:5575 to 346:5605).
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
      // The bar grows only where the device's home-indicator inset
      // (env(safe-area-inset-bottom)) is taller than the token for it,
      // sizes.shell.safeAreaBottom (34): by the difference, so the tabs
      // stay clear of it (tabBarHeight, shared with the app-shell overlay
      // inset). Every iPhone and iPad inset is 34 or less, and env() is 0
      // in Chromium and with no viewport-fit=cover, so the bar stays 77
      // there. Padding the bar with max(34, env()) instead would make it
      // 85 (1 + 8 + 42 + 34), taller than every Figma frame.
      h: tabBarHeight,
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
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
      '&[aria-current="page"]': { color: 'fg.accent' },
    },
    icon: { position: 'relative', display: 'inline-flex', w: 'icon.24', h: 'icon.24', '& > svg': { w: 'icon.24!', h: 'icon.24!' } },
    // TruncatedText inside cuts a long label and shows it whole in a tooltip.
    label: { textStyle: 'navLabel', color: 'inherit', minW: '0', maxW: '100%' },
    // The badge count for screen readers; the badge itself is hidden from them.
    hint: { srOnly: true },
  },
  variants: {
    size: {
      phone: {},
      // The bar keeps its 8 px sides, so the group is centred in the frame.
      tablet: { list: { w: '100%', maxW: 'shell.tabGroup', mx: 'auto' } },
    },
  },
  defaultVariants: { size: 'phone' },
})
