import { defineRecipe } from '@pandacss/dev'

// A square tile with a kind icon on a 0.14 tint of the kind's colour: the
// Inbox kinds (Approval, Question, Review, Action, Next step) and the
// toolkit kinds (skill, agent, rule, workflow, hook). Each tint is the
// status tint the inventory maps that colour to.
export const kindTile = defineRecipe({
  className: 'kind-tile',
  jsx: ['KindTile'],
  staticCss: ['*'],
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: '0',
    borderRadius: 'md',
  },
  variants: {
    kind: {
      approval: { bg: 'status.needsYou.bg', color: 'status.needsYou.fg' },
      question: { bg: 'status.needsYou.bg', color: 'status.needsYou.fg' },
      review: { bg: 'status.needsYou.bg', color: 'status.needsYou.fg' },
      action: { bg: 'status.needsYou.bg', color: 'status.needsYou.fg' },
      next: { bg: 'status.working.bg', color: 'status.working.fg' },
      skill: { bg: 'status.working.bg', color: 'kind.skill' },
      agent: { bg: 'status.running.bg', color: 'kind.agent' },
      rule: { bg: 'status.needsYou.bg', color: 'kind.rule' },
      workflow: { bg: 'status.done.bg', color: 'kind.workflow' },
      // No token holds kind.hook at 0.14, so the hook tile has no tint yet.
      hook: { color: 'kind.hook' },
    },
    size: {
      sm: { w: 'kindTile.sm', h: 'kindTile.sm' },
      lg: { w: 'kindTile.lg', h: 'kindTile.lg' },
    },
  },
  defaultVariants: { kind: 'approval', size: 'sm' },
})
