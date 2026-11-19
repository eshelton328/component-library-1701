import { defineSlotRecipe } from '@pandacss/dev'

// The KPI tiles of Toolkit D17 (474:584): a box with a large value
// (474:586), a label under it (474:587) and an optional caption (474:588).
// The value comes first on screen; in the markup the label comes first, so
// a screen reader reads "calls, 330".
//
// Figma draws each caption whole on one 17 px line (T23 491:8077 "the message
// broke the rule", 151 px in a 169 px tile, runs into the tile's padding;
// D12 445:227). The library keeps the caption inside the padding: with the
// component's `captionLines` above 1 the caption wraps in a TruncatedText
// with `lines` (its own recipe, line-clamp in the `small` line height), so a
// long caption shows whole on a second line instead of being cut, and one
// longer than its lines shows whole in the cut-text tooltip.
export const kpiTile = defineSlotRecipe({
  className: 'kpi-tile',
  jsx: ['KpiTile'],
  staticCss: ['*'],
  slots: ['root', 'label', 'value', 'caption'],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2',
      minW: '0',
      py: '10',
      px: '12',
      bg: 'surface.pane',
      borderRadius: 'xl',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
    },
    // TruncatedText inside cuts a long value, label or one-line caption and shows it whole in a tooltip.
    value: { order: '1', minW: '0', textStyle: 'title', color: 'fg.default', fontVariantNumeric: 'tabular-nums' },
    label: { order: '2', minW: '0', textStyle: 'small', color: 'fg.default' },
    caption: { order: '3', minW: '0', textStyle: 'small', color: 'fg.muted' },
  },
})
