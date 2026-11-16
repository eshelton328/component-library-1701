import { defineSlotRecipe } from '@pandacss/dev'

// The frame that pages sit in, on the backdrop. It only places the slots;
// each slot brings its own surface (the nav rail, a Panel, the tab bar).
// - desktop (Inbox D1 346:5, Workbench D2 105:511): the rail (64,
//   sizes.shell.rail), a list pane (420, sizes.shell.listPane, or the
//   Workbench sidebar, 330, sizes.shell.sidebar), the detail pane, which
//   takes the rest, and an optional side panel (side chat 380,
//   sizes.shell.sidePane, or subagents 420, sizes.shell.widePane). The
//   panes abut, with no gap, and fill the height.
// - tablet and phone (Inbox T1 346:5353, M1 346:8982): one pane at a
//   time, the list or the detail, full width, above the tab bar. On the
//   phone with no tab bar (inside a chat), the home-indicator area stays
//   clear (sizes.shell.safeAreaBottom).
export const appShell = defineSlotRecipe({
  className: 'app-shell',
  jsx: ['AppShell'],
  staticCss: ['*'],
  slots: ['root', 'rail', 'list', 'detail', 'side', 'tabBar', 'safeArea'],
  base: {
    root: { display: 'flex', flex: '1', minW: '0', minH: '0', h: '100%' },
    rail: { display: 'flex', flexDirection: 'column', flexShrink: '0', w: 'shell.rail', minH: '0' },
    list: { display: 'flex', flexDirection: 'column', flexShrink: '0', minW: '0', minH: '0' },
    detail: { display: 'flex', flexDirection: 'column', flex: '1', minW: '0', minH: '0', overflowY: 'auto' },
    side: { display: 'flex', flexDirection: 'column', flexShrink: '0', minW: '0', minH: '0' },
    tabBar: { display: 'flex', flexDirection: 'column', flexShrink: '0' },
    safeArea: { flexShrink: '0', h: 'shell.safeAreaBottom' },
  },
  variants: {
    size: {
      desktop: { root: { flexDirection: 'row' } },
      tablet: { root: { flexDirection: 'column' } },
      phone: { root: { flexDirection: 'column' } },
    },
    listWidth: {
      list: { list: { w: 'shell.listPane' } },
      sidebar: { list: { w: 'shell.sidebar' } },
    },
    sideWidth: {
      side: { side: { w: 'shell.sidePane' } },
      wide: { side: { w: 'shell.widePane' } },
    },
  },
  defaultVariants: { size: 'desktop', listWidth: 'list', sideWidth: 'side' },
})
