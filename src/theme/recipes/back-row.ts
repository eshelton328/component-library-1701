import { defineSlotRecipe } from '@pandacss/dev'

// The row at the top of a detail screen on tablet and phone: a back button
// (chevron and the name of the list it returns to) and, at the end of the
// row, the screen's actions. Inbox M3 346:9418, Artifacts T2 405:414,
// Toolkit T3 428:543 and M2 429:285: rows with gap 8, centred; the back
// button has a 20 px chevron and a 4 px gap, in the accent colour. Its label
// is Medium 16 (Inbox, Artifacts) or Regular 17 (Toolkit); d-074 merges both
// into `labelLg`.
//
// The design ideas draw the button with no padding, and no focus ring. The
// chevron's path starts 6.67 px inside its 20 px box, so with no padding the
// ring sat about 9 px from the chevron but 2 px from the end of the label.
// `pe: '6'` (6.67 rounds to the `6` token, d-072) evens the two sides.
export const backRow = defineSlotRecipe({
  className: 'back-row',
  jsx: ['BackRow'],
  staticCss: ['*'],
  slots: ['root', 'back', 'icon', 'label', 'actions'],
  base: {
    root: { display: 'flex', alignItems: 'center', gap: '8', minW: '0' },
    back: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4',
      minW: '0',
      minH: 'control.sm',
      p: '0',
      pe: '6',
      bg: 'transparent',
      borderWidth: '0',
      borderRadius: 'sm',
      color: 'fg.accent',
      textStyle: 'labelLg',
      cursor: 'pointer',
      outline: 'none',
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
    },
    icon: { w: 'icon.20', h: 'icon.20', flexShrink: '0' },
    label: { minW: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    // Conditional actions that render nothing leave no slot, so no gap.
    actions: { display: 'flex', alignItems: 'center', gap: '8', flexShrink: '0', ms: 'auto', _empty: { display: 'none' } },
  },
})
