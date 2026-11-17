import { defineSlotRecipe } from '@pandacss/dev'

// The kind badge of the Toolkit item page (D3 427:252): a pill with the
// kind icon (13 px, 500:8143) and label in `Workbench/small` and the kind
// colour. Padding 9/4, gap 6, no border, filled with the kind's `kindTint`
// (d-074).
export const kindBadge = defineSlotRecipe({
  className: 'kind-badge',
  jsx: ['KindBadge'],
  staticCss: ['*'],
  slots: ['root', 'icon'],
  base: {
    root: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6',
      flexShrink: '0',
      px: '10',
      py: '4',
      borderRadius: 'full',
      textStyle: 'small',
      whiteSpace: 'nowrap',
    },
    icon: {
      display: 'inline-flex',
      flexShrink: '0',
      '& svg': { w: 'icon.12!', h: 'icon.12!' },
    },
  },
  variants: {
    kind: {
      skill: { root: { bg: 'kindTint.skill', color: 'kind.skill' } },
      agent: { root: { bg: 'kindTint.agent', color: 'kind.agent' } },
      rule: { root: { bg: 'kindTint.rule', color: 'kind.rule' } },
      workflow: { root: { bg: 'kindTint.workflow', color: 'kind.workflow' } },
      hook: { root: { bg: 'kindTint.hook', color: 'kind.hook' } },
    },
  },
  defaultVariants: { kind: 'skill' },
})
