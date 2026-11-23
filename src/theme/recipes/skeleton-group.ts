import { defineSlotRecipe } from '@pandacss/dev'

// The place that waits for content (SkeletonGroup). The label is for screen readers only: the status says it
// once, as text, after the region is in place, so a screen reader announces it.
export const skeletonGroup = defineSlotRecipe({
  className: 'skeleton-group',
  jsx: ['SkeletonGroup'],
  staticCss: ['*'],
  slots: ['root', 'label'],
  base: {
    root: { minW: '0' },
    label: { srOnly: true },
  },
})
