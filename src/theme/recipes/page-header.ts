import { defineSlotRecipe } from '@pandacss/dev'

// The header at the top of a page or list pane: the title, its count and,
// at the end of the row, the page's actions (Edit or Done, +, a read-only
// pill, a view switch or a found status). Rows with gap 8, centred: Inbox
// D1 346:147 and M1 346:9009, Artifacts D1 402:15371, Toolkit D1 425:10 and
// M1 429:51. `size` picks the title style: `pane` for a list pane title
// (Inbox D1, 15), `page` for a desktop page (Artifacts and Toolkit D1, 20)
// and `phone` for tablet and phone (28; the inventory merges tablet's 26).
export const pageHeader = defineSlotRecipe({
  className: 'page-header',
  jsx: ['PageHeader'],
  staticCss: ['*'],
  slots: ['root', 'title', 'count', 'countLabel', 'actions'],
  base: {
    root: { display: 'flex', alignItems: 'center', gap: '8', minW: '0' },
    title: { color: 'fg.default', m: '0', minW: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    count: { color: 'fg.muted', flexShrink: '0', fontVariantNumeric: 'tabular-nums' },
    countLabel: { srOnly: true },
    // Conditional actions that render nothing leave no slot, so no gap.
    actions: { display: 'flex', alignItems: 'center', gap: '8', flexShrink: '0', ms: 'auto', _empty: { display: 'none' } },
  },
  variants: {
    size: {
      pane: { title: { textStyle: 'paneTitle' }, count: { textStyle: 'mono' } },
      page: { title: { textStyle: 'title' }, count: { textStyle: 'body' } },
      phone: { title: { textStyle: 'heading' }, count: { textStyle: 'body' } },
    },
  },
  defaultVariants: { size: 'page' },
})
