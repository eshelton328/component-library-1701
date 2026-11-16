import { defineRecipe } from '@pandacss/dev'

// The status pill of every page: Working, Running, Needs you, Idle, Done,
// Next step, Recommended, Edited and New, with an optional dot. Each tone
// is a status colour set: a 0.14 tint, a border and the text colour.
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
    textStyle: 'badge',
    whiteSpace: 'nowrap',
    borderRadius: 'full',
    borderWidth: 'default',
    borderStyle: 'solid',
    '& [data-dot]': { w: '6', h: '6', flexShrink: '0', borderRadius: 'full', bg: 'currentColor' },
  },
  variants: {
    tone: {
      working: { bg: 'status.working.bg', color: 'status.working.fg', borderColor: 'status.working.border' },
      running: { bg: 'status.running.bg', color: 'status.running.fg', borderColor: 'status.running.border' },
      needsYou: { bg: 'status.needsYou.bg', color: 'status.needsYou.fg', borderColor: 'status.needsYou.border' },
      idle: { bg: 'status.idle.bg', color: 'status.idle.fg', borderColor: 'status.idle.border' },
      done: { bg: 'status.done.bg', color: 'status.done.fg', borderColor: 'status.done.border' },
      danger: { bg: 'status.danger.bg', color: 'status.danger.fg', borderColor: 'status.danger.border' },
    },
  },
  defaultVariants: { tone: 'idle' },
})
