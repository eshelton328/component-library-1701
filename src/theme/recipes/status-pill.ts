import { defineRecipe } from '@pandacss/dev'

// The status pill of every page: Working, Running, Needs you, Idle, Done,
// Next step, Recommended, Edited and New, with an optional dot. Each tone
// is a status colour set: a 0.14 tint and the text colour. Figma fills the
// pill and draws no border (Inbox D2 346:731, D3 346:1249 and 346:1280:
// padding 8 / 3, radius 99), so the 1 px border is transparent: it keeps
// the box Figma's 3 px above and below the text with 2 px padding.
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
    borderWidth: 'default',
    borderStyle: 'solid',
    borderColor: 'transparent',
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
