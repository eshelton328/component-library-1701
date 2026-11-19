import { defineSlotRecipe } from '@pandacss/dev'
import { scrollAreaX } from './scroll-area'

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
    root: { display: 'block', maxW: '100%', overflowX: 'auto', ...scrollAreaX },
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
    // TruncatedText inside cuts a long row label and shows it whole in a tooltip.
    label: { minW: '0', textStyle: 'small', color: 'fg.default' },
    track: { display: 'flex', alignItems: 'center', gap: '8', minW: '0' },
    // A bar with a value above 0 is at least 4 px long.
    svg: { display: 'block', flexShrink: '0', h: '10', overflow: 'visible', '&[data-filled]': { minW: '4' } },
    bar: { rx: 'token(radii.hair)', ...tones },
    value: { textStyle: 'mono', color: 'fg.muted', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flexShrink: '0' },
    // A hidden copy of the value that sizes the last column.
    room: { textStyle: 'mono', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', visibility: 'hidden' },
  },
})

// The legend swatch colours, the same tones as the bars.
const swatchTones = {
  '&[data-tone=accent]': { bg: 'accent.default' },
  '&[data-tone=muted]': { bg: 'fg.muted' },
  '&[data-tone=running]': { bg: 'status.running.fg' },
  '&[data-tone=needsYou]': { bg: 'status.needsYou.fg' },
  '&[data-tone=done]': { bg: 'status.done.fg' },
  '&[data-tone=danger]': { bg: 'status.danger.fg' },
}

// Vertical bars, one per day: Toolkit D17 "calls per day" panel 444:581,
// charts 444:586 (Headless runs, purple = status.running.fg) and 444:597
// (Chats, cyan = accent.default). A legend (8 px swatch 444:588 at
// radius 2, the name in small, "max N" in mono muted, 6 px apart), 6 px
// above the bars 444:592; a 1 px border.default baseline 444:593; the axis
// 444:611 in mono muted, its labels spread from edge to edge. The bar
// geometry (a 78 px plot, bars 64 % of their slot) lives in the component
// as SVG coordinates. Figma rounds the bar tops 3 px; no radius token is
// 3 px, so the bars take radii.xs (4 px), the larger of the two nearest
// (d-072). Figma draws no highlighted day; a highlighted bar gets a
// 1.5 px fg.default ring (borderWidths.strong), our choice; a
// highlighted day at 0 gets the ring on an empty 2 px slot at the baseline.
export const dailyBarChart = defineSlotRecipe({
  className: 'daily-bar-chart',
  jsx: ['DailyBarChart'],
  staticCss: ['*'],
  slots: ['root', 'legend', 'swatch', 'name', 'max', 'svg', 'bar', 'baseline', 'axis', 'axisLabel', 'data'],
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: '6', minW: '0' },
    legend: { display: 'flex', alignItems: 'center', gap: '6', minW: '0' },
    swatch: { flexShrink: '0', w: '8', h: '8', borderRadius: 'hair', ...swatchTones },
    // TruncatedText inside cuts a long name and shows it whole in a tooltip.
    name: { flex: '1', minW: '0', textStyle: 'small', color: 'fg.default' },
    max: { flexShrink: '0', textStyle: 'mono', color: 'fg.muted', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' },
    // The plot clips the part of each bar drawn under the baseline, so only its top is round.
    svg: { display: 'block', overflow: 'hidden' },
    bar: {
      rx: 'token(radii.xs)',
      ...tones,
      '&[data-highlighted]': { stroke: 'fg.default', strokeWidth: 'token(borderWidths.strong)' },
      // A highlighted day at 0: an empty outline on the baseline, so the ring still shows.
      '&[data-empty]': { fill: 'none' },
    },
    baseline: { fill: 'border.default' },
    axis: { display: 'flex', justifyContent: 'space-between', gap: '8', textStyle: 'mono', color: 'fg.muted' },
    axisLabel: { whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' },
    // The data table, read by assistive technology and hidden from view.
    data: { srOnly: true },
  },
})
