import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'
import { tabBarHeight } from './tab-bar-height'
import { scrollArea } from './scroll-area'

// The frame that pages sit in, on the backdrop. It only places the slots;
// each slot brings its own surface (the nav rail, a Panel, the tab bar).
// - desktop (Inbox D1 346:5, Workbench D2 105:511): the rail (64,
//   sizes.shell.rail), a list pane (420, sizes.shell.listPane, or the
//   Workbench sidebar, 330, sizes.shell.sidebar), the detail pane, which
//   takes the rest, and an optional side panel (side chat 380,
//   sizes.shell.sidePane, or subagents 420, sizes.shell.widePane). The
//   panes abut, with no gap, and fill the height.
// - tablet and phone (Inbox T1 346:5353, M1 346:8982): one pane at a
//   time, the list or the detail, full width, above the tab bar. With no
//   tab bar (inside a chat), the home-indicator area stays clear
//   (sizes.shell.safeAreaBottom, 34) on the phone and on the tablet: the
//   tablet chat's composer ends over the iPad's home indicator (Workbench
//   T2b 402:5783, 37 there; 34 is the token, d-100).
// - tabBarOverlay (phone Toolkit M02, M20, M22): the tab bar lies over the
//   bottom of the detail, which runs to the bottom of the shell, as Figma
//   draws the page under the bar. The detail's own scroll ends with the
//   bar's height of padding (tabBarHeight, the tab-bar recipe's own
//   height: sizes.shell.tabBar, more where the home-indicator inset is
//   more than sizes.shell.safeAreaBottom), so its last item scrolls clear
//   of the bar, and the same scroll padding, so a control that takes the focus
//   under the bar scrolls out from under it. The detail also sets two
//   custom properties for itself and its direct child, and back to their
//   defaults deeper down:
//   --app-shell-tab-bar-inset (that height; 0px deeper) and
//   --app-shell-tab-bar-spacer (block; none deeper). A ScrollFrame that is
//   the detail's child reads them to reach under the bar and lift its
//   footer and the end of its body above it (the scroll-frame recipe); a
//   ScrollFrame deeper in the page, or outside AppShell, keeps 0.
//   The tab bar slot is filled with bg.canvas under the overlay, so the
//   bar's translucent surface.chrome (0.96) lies over the canvas and not
//   over the page: the page does not show through behind the icons and
//   labels. Figma's bars (Artifacts M1 406:28, Workspaces M1 252:2, Toolkit
//   T1 424:3863, Inbox T1 346:5574: #0F1626 at 0.96, no effects) have only
//   the dark backdrop behind them, so this is the colour Figma shows, from
//   the two tokens and no new value. A bar below the page (no overlay)
//   keeps its fill over the backdrop, as before.
// - Keyboard dock (every size): --app-shell-keyboard on the root, how far
//   an on-screen keyboard covers the detail's bottom (0px when unset). The
//   detail sets --app-shell-detail-end, its end padding and scroll padding,
//   to that value (under tabBarOverlay the larger of it and the bar's
//   height), so its own content and a focused control end above the
//   keyboard; a ScrollFrame that is the detail's child reaches through that
//   padding and docks its footer on the keyboard (the scroll-frame recipe).
//   Both are reset deeper down, as the tab bar's are. AppShell sets the
//   property from window.visualViewport while a field has the focus and
//   the browser does not resize the layout for the keyboard (iOS Safari);
//   the root keeps its full height, and the tab bar and the safe area stay
//   under the keyboard. Unset, nothing moves.
// The keyboard's reach over a pane's bottom, as its end padding; its direct child reads it, deeper it is 0.
const paneEnd = {
  '--app-shell-detail-end': 'var(--app-shell-keyboard, 0px)',
  pb: 'var(--app-shell-detail-end)',
  '& > * *': { '--app-shell-keyboard': '0px', '--app-shell-detail-end': '0px' },
} as const

export const appShell = defineSlotRecipe({
  className: 'app-shell',
  jsx: ['AppShell'],
  staticCss: ['*'],
  slots: ['root', 'rail', 'list', 'detail', 'side', 'tabBar', 'safeArea'],
  base: {
    root: {
      display: 'flex',
      flex: '1',
      minW: '0',
      minH: '0',
      h: '100%',
    },
    rail: { display: 'flex', flexDirection: 'column', flexShrink: '0', w: 'shell.rail', minH: '0' },
    // A list or side pane beside the detail ends above the keyboard too (an iPad at 1232 px and wider, the-bridge #151
    // review): its end padding is the keyboard's reach, so a scroller in it ends its view above the keyboard, and a
    // ScrollFrame that is its child reaches through the padding and docks, as in the detail.
    list: { display: 'flex', flexDirection: 'column', flexShrink: '0', minW: '0', minH: '0', ...paneEnd },
    detail: {
      display: 'flex',
      flexDirection: 'column',
      flex: '1',
      minW: '0',
      minH: '0',
      overflowY: 'auto',
      ...scrollArea,
      // A query container for its width: a detail Container widens and centres itself in a wide one (layout recipe).
      // Its width comes from the row, never from its content, so the containment changes no size.
      containerType: 'inline-size',
      // Its end padding and scroll padding: the on-screen keyboard's reach over its bottom (0px with none), so its
      // last item and a focused control end above the keyboard. Its direct child reads the value; deeper it is 0.
      '--app-shell-detail-end': 'var(--app-shell-keyboard, 0px)',
      pb: 'var(--app-shell-detail-end)',
      scrollPaddingBottom: 'var(--app-shell-detail-end)',
      '& > * *': { '--app-shell-keyboard': '0px', '--app-shell-detail-end': '0px' },
      // It takes focus so the keyboard can scroll it; the ring sits inside, as the pane abuts its neighbours.
      outline: 'none',
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '-2' },
    },
    side: { display: 'flex', flexDirection: 'column', flexShrink: '0', minW: '0', minH: '0', ...paneEnd },
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
          '--app-shell-tab-bar-inset': tabBarHeight,
          '--app-shell-tab-bar-spacer': 'block',
          // The end padding lets the last item scroll clear; the scroll padding makes focus (Tab) scroll a control out
          // from under the bar, too, as the browser scrolls only a control outside the padded view. With the keyboard
          // open over the bar, the keyboard's reach is the larger.
          '--app-shell-detail-end': 'max(var(--app-shell-tab-bar-inset), var(--app-shell-keyboard, 0px))',
          '& > * *': { '--app-shell-tab-bar-inset': '0px', '--app-shell-tab-bar-spacer': 'none' },
        },
        tabBar: { position: 'absolute', insetInline: '0', bottom: '0', bg: 'bg.canvas' },
      },
    },
  },
  defaultVariants: { size: 'desktop', listWidth: 'list', sideWidth: 'side', tabBarOverlay: false },
})
