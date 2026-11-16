import { defineSlotRecipe } from '@pandacss/dev'

// The bar colours, one per tone. Figma draws the eval chart in cyan (with
// the skill) and grey (without), Toolkit D20 482:1933 and 482:1934; the
// other tones are the status colours, for charts Figma has not drawn yet.
const tones = {
  '&[data-tone=accent]': { fill: 'accent.default' },
  '&[data-tone=muted]': { fill: 'fg.muted' },
  '&[data-tone=running]': { fill: 'status.running.fg' },
  '&[data-tone=needsYou]': { fill: 'status.needsYou.fg' },
  '&[data-tone=done]': { fill: 'status.done.fg' },
  '&[data-tone=danger]': { fill: 'status.danger.fg' },
}

// Grouped vertical bars: Toolkit D20 chart 482:1932 and axis 482:1947. The
// geometry (16 px bars, a 4 px gap in a group, a 56 px group pitch and a
// 110 px plot) lives in the component as SVG coordinates; the colours,
// radius and type come from here.
export const groupedBarChart = defineSlotRecipe({
  className: 'grouped-bar-chart',
  jsx: ['GroupedBarChart'],
  staticCss: ['*'],
  slots: ['root', 'svg', 'bar', 'axisLabel', 'data'],
  base: {
    root: { display: 'block', maxW: '100%', overflowX: 'auto' },
    svg: { display: 'block', overflow: 'visible' },
    bar: { rx: 'token(radii.hair)', ...tones },
    axisLabel: { textStyle: 'mono', fill: 'fg.muted' },
    // The data table, read by assistive technology and hidden from view.
    data: { srOnly: true },
  },
})

// Horizontal bars: Toolkit D17 "calls per day" 474:602 and "where it ran"
// 474:620. A label, a 10 px bar and its value, 8 px apart, with 8 px
// between rows. A bar is at least 4 px long, as Figma draws the small ones.
export const horizontalBarChart = defineSlotRecipe({
  className: 'horizontal-bar-chart',
  jsx: ['HorizontalBarChart'],
  staticCss: ['*'],
  slots: ['root', 'row', 'label', 'track', 'svg', 'bar', 'value', 'room'],
  base: {
    root: {
      display: 'grid',
      // A long label takes at most half the width, so the bars keep room.
      // The last column is as wide as the widest value: a value after a
      // full bar runs into it, so it never overflows the chart.
      gridTemplateColumns: 'fit-content(50%) minmax(0, 1fr) max-content',
      columnGap: '8',
      rowGap: '8',
      listStyle: 'none',
      m: '0',
      p: '0',
    },
    row: { display: 'grid', gridColumn: '1 / -1', gridTemplateColumns: 'subgrid', alignItems: 'center' },
    label: { textStyle: 'small', color: 'fg.default', overflowX: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
    track: { display: 'flex', alignItems: 'center', gap: '8', minW: '0' },
    // A bar with a value above 0 is at least 4 px long.
    svg: { display: 'block', flexShrink: '0', h: '10', overflow: 'visible', '&[data-filled]': { minW: '4' } },
    bar: { rx: 'token(radii.hair)', ...tones },
    value: { textStyle: 'mono', color: 'fg.muted', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flexShrink: '0' },
    // A hidden copy of the value that sizes the last column.
    room: { textStyle: 'mono', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', visibility: 'hidden' },
  },
})
