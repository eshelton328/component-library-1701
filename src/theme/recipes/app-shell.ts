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
// - tabBarOverlay (phone Toolkit M02, M20, M22): the tab bar lies over the
//   bottom of the detail, which runs to the bottom of the shell, as Figma
//   draws the page under the bar. The detail's own scroll ends with
//   sizes.shell.tabBar of padding, so its last item scrolls clear of the
//   bar. The detail also sets two custom properties for itself and its
//   direct child, and back to their defaults deeper down:
//   --app-shell-tab-bar-inset (that height; 0px deeper) and
//   --app-shell-tab-bar-spacer (block; none deeper). A ScrollFrame that is
//   the detail's child reads them to reach under the bar and lift its
//   footer and the end of its body above it (the scroll-frame recipe); a
//   ScrollFrame deeper in the page, or outside AppShell, keeps 0.
export const appShell = defineSlotRecipe({
  className: 'app-shell',
  jsx: ['AppShell'],
  staticCss: ['*'],
  slots: ['root', 'rail', 'list', 'detail', 'side', 'tabBar', 'safeArea'],
  base: {
    root: { display: 'flex', flex: '1', minW: '0', minH: '0', h: '100%' },
    rail: { display: 'flex', flexDirection: 'column', flexShrink: '0', w: 'shell.rail', minH: '0' },
    list: { display: 'flex', flexDirection: 'column', flexShrink: '0', minW: '0', minH: '0' },
    detail: {
      display: 'flex',
      flexDirection: 'column',
      flex: '1',
      minW: '0',
      minH: '0',
      overflowY: 'auto',
      // It takes focus so the keyboard can scroll it; the ring sits inside, as the pane abuts its neighbours.
      outline: 'none',
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '-2' },
    },
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
    tabBarOverlay: {
      false: {},
      true: {
        root: { position: 'relative' },
        detail: {
          '--app-shell-tab-bar-inset': 'token(sizes.shell.tabBar)',
          '--app-shell-tab-bar-spacer': 'block',
          pb: 'var(--app-shell-tab-bar-inset)',
          '& > * *': { '--app-shell-tab-bar-inset': '0px', '--app-shell-tab-bar-spacer': 'none' },
        },
        tabBar: { position: 'absolute', insetInline: '0', bottom: '0' },
      },
    },
  },
  defaultVariants: { size: 'desktop', listWidth: 'list', sideWidth: 'side', tabBarOverlay: false },
})
