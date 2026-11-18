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
    leading: { display: 'inline-flex', flexShrink: '0' },
    // A text item holds a TruncatedText, which cuts it and shows it whole in a tooltip; any other item is cut here.
    item: { minW: '0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', '&:has(> .truncated-text)': { overflow: 'visible' } },
    separator: { flexShrink: '0' },
    trailing: { flexShrink: '0', ms: 'auto', whiteSpace: 'nowrap' },
  },
  variants: {
    // Figma draws a 12 px kind mark in rows (`sm`) and a 14 px one on the
    // Artifacts card (`md`, `kind · claude` 402:15461; T1 405:193 and
    // 405:222). 14 is a tie between 12 and 16 on the 4 px icon scale, so
    // `md` takes the larger, 16 (d-072, d-100); it fits the 16 px mono
    // line. Each variant sets the size, not base: `!` wins over the icon's
    // own size, and an important base style would also win over the
    // variant.
    icon: {
      sm: { leading: { '& svg': { w: 'icon.12!', h: 'icon.12!' } } },
      md: { leading: { '& svg': { w: 'icon.16!', h: 'icon.16!' } } },
    },
  },
  defaultVariants: { icon: 'sm' },
})
