import { defineSlotRecipe } from '@pandacss/dev'

// The KPI tiles of Toolkit D17 (474:584): a box with a large value
// (474:586), a label under it (474:587) and an optional caption (474:588).
// The value comes first on screen; in the markup the label comes first, so
// a screen reader reads "calls, 330".
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
    value: { order: '1', textStyle: 'title', color: 'fg.default', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    label: { order: '2', textStyle: 'small', color: 'fg.default', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    caption: { order: '3', textStyle: 'small', color: 'fg.muted', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  },
})
