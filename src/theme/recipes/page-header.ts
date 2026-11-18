import { defineSlotRecipe } from '@pandacss/dev'

// The header at the top of a page or list pane: the title, its count and,
// at the end of the row, the page's actions (Edit or Done, +, a read-only
// pill, a view switch or a found status). Rows with gap 8, centred: Inbox
// D1 346:147 and M1 346:9009, Artifacts D1 402:15371, Toolkit D1 425:10 and
// M1 429:51. `size` picks the title style: `pane` for a list pane title
// (Inbox D1, 15), `page` for a desktop page (Artifacts and Toolkit D1, 20)
// and `phone` for tablet and phone (28; the inventory merges tablet's 26).
// Figma's desktop page title is 20 px in a 29 px box (Artifacts D1 402:15372
// and Toolkit D1 425:30, both 29 high; Workbench title 20/29, d-041), so
// `page` keeps `title` (20/28 on the grid).
export const pageHeader = defineSlotRecipe({
  className: 'page-header',
  jsx: ['PageHeader'],
  staticCss: ['*'],
  slots: ['root', 'title', 'count', 'countLabel', 'actions'],
  base: {
    root: { display: 'flex', alignItems: 'center', gap: '8', minW: '0' },
    // TruncatedText inside cuts a long title and shows it whole in a tooltip.
    title: { color: 'fg.default', m: '0', minW: '0' },
    count: { color: 'fg.muted', flexShrink: '0', fontVariantNumeric: 'tabular-nums' },
    countLabel: { srOnly: true },
    // Conditional actions that render nothing leave no slot, so no gap.
    actions: { display: 'flex', alignItems: 'center', gap: '8', flexShrink: '0', ms: 'auto', _empty: { display: 'none' } },
  },
  variants: {
    size: {
      // The Inbox pane count (346:149) is #4a5675; the page and phone counts (425:31, 429:53) are #8a97b8.
      pane: { title: { textStyle: 'paneTitle' }, count: { textStyle: 'mono', color: 'fg.subtle' } },
      page: { title: { textStyle: 'title' }, count: { textStyle: 'body' } },
      phone: { title: { textStyle: 'heading' }, count: { textStyle: 'body' } },
    },
    // The count's text style. `md` keeps the size's own count. `lg` sets
    // `pageCount` (Regular 16/20) on every size, as the Artifacts header
    // draws its count: "24" (D1 402:15373, T1 405:108) is 20 × 21 and
    // "3 of 24" (D4 403:7774) 53 × 21, where Toolkit's "27" (425:31) is
    // 16 × 20 in body. Figma's 21 px line takes 20 on the 4 px grid (d-100).
    // The size keeps the count's colour.
    countSize: {
      md: {},
      lg: { count: { textStyle: 'pageCount' } },
    },
  },
  defaultVariants: { size: 'page', countSize: 'md' },
})
