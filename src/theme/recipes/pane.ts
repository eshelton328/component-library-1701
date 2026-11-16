import { defineSlotRecipe } from '@pandacss/dev'

// One Workbench chat pane in the split (D9 402:1145): pane A 402:1628 is
// focused, pane B 402:1699 idle.
// - Fill rgba(15,22,38,0.8), merged into surface.pane (0.85); radius 12
//   (radius.xl); the glass blur (d-044).
// - Idle: 1 px #24314f (border.default). Focused: 1.5 px #5ee1ff, which is
//   border.focus at borderWidths.strong.
// - Header 402:1629: padding 8 by 12, gap 7 (8, d-072), items centred; a
//   1 px border.default rule below (402:1651).
// - Title: Geist SemiBold 13 #e6ecff in both states, merged into `label`
//   (the inventory puts Workbench 13 and 12 titles there), fg.default.
// - Model: Geist Mono 11 #8a97b8, merged into `mono`, fg.muted.
export const pane = defineSlotRecipe({
  className: 'pane',
  jsx: ['Pane'],
  staticCss: ['*'],
  slots: ['root', 'header', 'leading', 'title', 'meta', 'actions', 'body'],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      flex: '1',
      minW: '0',
      minH: '0',
      overflow: 'hidden',
      bg: 'surface.pane',
      color: 'fg.default',
      borderRadius: 'xl',
      borderStyle: 'solid',
      borderWidth: 'default',
      borderColor: 'border.default',
      backdropFilter: 'blur(token(blurs.glass))',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '8',
      flexShrink: '0',
      minW: '0',
      px: '12',
      py: '8',
      borderBottomStyle: 'solid',
      borderBottomWidth: 'default',
      borderBottomColor: 'border.default',
    },
    leading: { display: 'inline-flex', flexShrink: '0' },
    // TruncatedText inside cuts a long title and shows it whole in a tooltip.
    title: { minW: '0', textStyle: 'label', color: 'fg.default' },
    meta: { display: 'inline-flex', alignItems: 'center', gap: '8', flexShrink: '0', textStyle: 'mono', color: 'fg.muted' },
    actions: { display: 'inline-flex', alignItems: 'center', gap: '4', flexShrink: '0', ml: 'auto' },
    body: { display: 'flex', flexDirection: 'column', flex: '1', minH: '0', overflowY: 'auto' },
  },
  variants: {
    focused: {
      true: { root: { borderWidth: 'strong', borderColor: 'border.focus' } },
      false: {},
    },
  },
  defaultVariants: { focused: false },
})
