import { defineRecipe } from '@pandacss/dev'

// A square tile with a kind icon on a tint of the kind's colour: the Inbox
// kinds (Approval, Question, Review, Action, Next step) on the status tint
// the inventory maps their colour to, and the toolkit kinds (skill, agent,
// rule, workflow, hook) on their own `kindTint` (d-074).
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
      skill: { bg: 'kindTint.skill', color: 'kind.skill' },
      agent: { bg: 'kindTint.agent', color: 'kind.agent' },
      rule: { bg: 'kindTint.rule', color: 'kind.rule' },
      workflow: { bg: 'kindTint.workflow', color: 'kind.workflow' },
      hook: { bg: 'kindTint.hook', color: 'kind.hook' },
    },
    size: {
      sm: { w: 'kindTile.sm', h: 'kindTile.sm' },
      lg: { w: 'kindTile.lg', h: 'kindTile.lg' },
    },
  },
  defaultVariants: { kind: 'approval', size: 'sm' },
})
