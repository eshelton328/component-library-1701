import { defineSlotRecipe } from '@pandacss/dev'

// The meta line under a row or card title, in `mono` (Inbox and Workbench
// draw Mono 11; d-041 sets every page in the `Workbench/*` styles). Inbox
// row 346:203 ("omni-brain · drift check"), Artifacts row 403:214 (kind
// mark and project) and card 402:15460 (kind mark, items, then the age
// pushed to the end). Items are 6 apart, with a "·" between.
export const metaLine = defineSlotRecipe({
  className: 'meta-line',
  jsx: ['MetaLine'],
  staticCss: ['*'],
  slots: ['root', 'leading', 'item', 'separator', 'trailing'],
  base: {
    root: {
      display: 'flex',
      alignItems: 'center',
      gap: '6',
      minW: '0',
      textStyle: 'mono',
      color: 'fg.muted',
      listStyle: 'none',
      m: '0',
      p: '0',
    },
    leading: {
      display: 'inline-flex',
      flexShrink: '0',
      '& svg': { w: 'icon.12', h: 'icon.12' },
    },
    item: { minW: '0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    separator: { flexShrink: '0' },
    trailing: { flexShrink: '0', ms: 'auto', whiteSpace: 'nowrap' },
  },
  variants: {
    // The card draws a 14 px kind mark; rows draw a 12 px one.
    icon: {
      sm: {},
      md: { leading: { '& svg': { w: 'icon.14', h: 'icon.14' } } },
    },
  },
  defaultVariants: { icon: 'sm' },
})
