import { defineSlotRecipe } from '@pandacss/dev'

// The Workbench column (D9 402:1564): the workspace tabs and their panes
// over a status bar.
// - Status bar 402:1619: padding 6 top, 8 bottom, 16 sides, gap 18 (20,
//   d-072); no fill or border. Text Geist Mono 11, merged into `mono`: the
//   summary #5ee1ff (fg.accent, 402:1620), the hints #8a97b8 (fg.muted,
//   402:1621), and the needs-you note #ffb86b at the end
//   (status.needsYou.fg, 402:1626).
export const workbench = defineSlotRecipe({
  className: 'workbench',
  jsx: ['Workbench'],
  staticCss: ['*'],
  slots: ['root', 'status', 'summary', 'hint', 'alert'],
  base: {
    root: { display: 'flex', flexDirection: 'column', h: '100%', minW: '0', minH: '0' },
    status: {
      display: 'flex',
      alignItems: 'center',
      gap: '20',
      flexShrink: '0',
      minW: '0',
      overflow: 'hidden',
      pt: '6',
      pb: '8',
      px: '16',
      textStyle: 'mono',
      whiteSpace: 'nowrap',
    },
    summary: { color: 'fg.accent', flexShrink: '0' },
    hint: { color: 'fg.muted', minW: '0', overflow: 'hidden', textOverflow: 'ellipsis' },
    alert: { color: 'status.needsYou.fg', ml: 'auto', flexShrink: '0' },
  },
})
