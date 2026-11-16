import { tabsAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'

// The workspace tabs above the Workbench panes (D9 402:1565), with the
// selected workspace's panes below them.
// - Bar 402:1565: padding 12 top, 10 bottom, 16 sides, gap 8; no fill.
// - Tab group 402:1570: gap 4, 12 at the start.
// - Tab 402:1571 (selected) and 402:1582 (idle): radius 8 (radius.md),
//   padding 8 start and 10 end, gap 6, 30 high (control.md, 32). Idle: no
//   fill, 1 px border.default, label Geist Medium 12 #8a97b8 (`label`,
//   fg.muted). Selected: #14263f (surface.selected), 1 px
//   rgba(94,225,255,0.7) (border.active), label SemiBold 12 #e6ecff
//   (`label`, fg.default).
// - Count: Geist Mono 11 #4a5675, so `mono` in fg.subtle; on the selected
//   tab's surface.selected it is fg.muted.
// - Panes area 402:1618: padding 10.
// - Grip and needs-you dot, Workbench D1 105:109: icon/grip 12 (icon.12) in
//   #4a5675 (fg.subtle; fg.muted on the selected tab, as the count) before the
//   label, and a 6 px #ffb86b dot (status.needsYou.fg) after the count; all
//   6 apart (the tab gap).
export const workspaceTabs = defineSlotRecipe({
  className: 'workspace-tabs',
  jsx: ['WorkspaceTabs'],
  staticCss: ['*'],
  slots: [...tabsAnatomy.keys(), 'bar', 'grip', 'count', 'dot', 'hint', 'actions'],
  base: {
    root: { display: 'flex', flexDirection: 'column', flex: '1', minW: '0', minH: '0' },
    bar: { display: 'flex', alignItems: 'center', gap: '8', flexShrink: '0', minW: '0', pt: '12', pb: '10', px: '16' },
    list: {
      display: 'flex',
      alignItems: 'center',
      gap: '4',
      minW: '0',
      pl: '12',
      // The list scrolls sideways, which clips anything outside it; the padding keeps the focus ring visible.
      py: '2',
      pr: '2',
      overflowX: 'auto',
      scrollbarWidth: 'none',
    },
    // Each tab shows its own selected state, so the moving indicator is not drawn.
    indicator: { display: 'none' },
    trigger: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6',
      flexShrink: '0',
      h: 'control.md',
      pl: '8',
      pr: '10',
      textStyle: 'label',
      whiteSpace: 'nowrap',
      borderRadius: 'md',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      color: 'fg.muted',
      bg: 'transparent',
      cursor: 'pointer',
      _selected: { bg: 'surface.selected', color: 'fg.default', borderColor: 'border.active' },
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '0' },
    },
    grip: { display: 'inline-flex', flexShrink: '0', color: 'fg.subtle', '[data-selected] > &': { color: 'fg.muted' } },
    count: { textStyle: 'mono', color: 'fg.subtle', '[data-selected] > &': { color: 'fg.muted' } },
    dot: { flexShrink: '0', w: '6', h: '6', borderRadius: 'full', bg: 'status.needsYou.fg' },
    // The needs-you dot's words for screen readers.
    hint: { srOnly: true },
    actions: { display: 'inline-flex', alignItems: 'center', gap: '4', flexShrink: '0' },
    content: {
      display: 'flex',
      flexDirection: 'column',
      flex: '1',
      minW: '0',
      minH: '0',
      p: '10',
      // Ark can mark a panel closed before it sets `hidden`; a closed panel never shows.
      _closed: { display: 'none' },
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '-2' },
    },
  },
})
