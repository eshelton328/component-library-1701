import { defineRecipe } from '@pandacss/dev'

// The status pill of every page: Working, Running, Needs you, Idle, Done,
// Next step, Recommended, Edited and New, with an optional dot. Each tone
// is a status colour set: a 0.14 tint and the text colour. Figma fills the
// pill and draws no border (Inbox D2 346:731, D3 346:1249 and 346:1280:
// padding 8 / 3, radius 99, 20 high, the 14 px text line 3 under the top).
// The `pill` line is 16, so 2 above and below keeps Figma's 20 and its text
// centre. A transparent outline, not a border, marks the pill's edge in
// forced-colours mode with no layout height: a 1 px border made the pill 22
// high and moved every row under it 2 px down (Inbox M5 346:9868).
export const statusPill = defineRecipe({
  className: 'status-pill',
  jsx: ['StatusPill'],
  staticCss: ['*'],
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6',
    flexShrink: '0',
    px: '8',
    py: '2',
    textStyle: 'pill',
    whiteSpace: 'nowrap',
    borderRadius: 'full',
    outlineWidth: 'default',
    outlineStyle: 'solid',
    outlineColor: 'transparent',
    '& [data-dot]': { w: '6', h: '6', flexShrink: '0', borderRadius: 'full', bg: 'currentColor' },
  },
  variants: {
    tone: {
      working: { bg: 'status.working.bg', color: 'status.working.fg' },
      running: { bg: 'status.running.bg', color: 'status.running.fg' },
      needsYou: { bg: 'status.needsYou.bg', color: 'status.needsYou.fg' },
      idle: { bg: 'status.idle.bg', color: 'status.idle.fg' },
      done: { bg: 'status.done.bg', color: 'status.done.fg' },
      danger: { bg: 'status.danger.bg', color: 'status.danger.fg' },
    },
  },
  defaultVariants: { tone: 'idle' },
})
