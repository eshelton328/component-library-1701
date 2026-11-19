import { defineSlotRecipe } from '@pandacss/dev'

// The preview of an artifact (Artifacts page 400:14, frames named
// "thumbnail · <kind>"). Each one fills left to right from #17213a to
// #0f1626 (surface.raised to surface.overlay), has a window bar
// rgba(7,11,20,0.6) (surface.well) with three dots in #8a97b8 at 0.5
// (status.idle.border), and sample content in the accent and status
// colours at alphas from 0.18 to 0.9, which the inventory maps to those
// tokens: solid shapes to the colour, 0.18 chips to its tint, 0.7 to 0.8
// edges to its border. Ink shapes (rgba(7,11,20, 0.7 to 0.9)) are
// surface.well; the UI rows (rgba(23,33,58,0.8)) surface.inset; muted lines
// (#8a97b8 at 0.35 to 0.6) status.idle.border. The 64 × 40 size (403:194)
// draws a 1 px #24314f border with radius 6; the larger sizes sit in a card
// that clips them.
//
// `size` fixes the width for an artifact row; `fill` (the default) takes the
// container's. `sm` is the desktop row's 64 × 40 (D2 403:194), `md` the
// phone row's 76 × 48 (M1 406:122) and `lg` the list view's 128 × 72 (D4
// 403:8217, with shape wide). The component draws sm and md with each kind's
// row layers (D2 403:194, 403:220, 403:246, 414:759, 403:274) and sets
// their box itself, so the height follows from the drawing's ratio.
//
// A chart's reference line (D9 after Apply, `median line` 452:3705 and its
// label 452:3706): a dashed line across the plot in amber, the needs-you
// colour (status.needsYou.fg, as the grid's amber cells and the dashed
// FlowLoop), with its label in mono (12/16) at the plot's end, 4 (spacing.4)
// above the line (Figma: 16 high, its top 20 above the line). The line is a
// dashed border (borderWidths.default), centred on the value. `reference` is
// an SVG with no viewBox over the drawing; the component places a
// foreignObject from the plot's start to its end and from the top down to
// the value, and `referenceBox` puts the label and line at its bottom end.
export const thumbnail = defineSlotRecipe({
  className: 'thumbnail',
  jsx: ['Thumbnail'],
  staticCss: ['*'],
  slots: ['root', 'svg', 'chrome', 'dot', 'muted', 'title', 'well', 'inset', 'accent', 'violet', 'amber', 'green', 'accentTint', 'violetTint', 'accentEdge', 'violetEdge', 'amberEdge', 'greenEdge', 'reference', 'referenceBox', 'referenceLabel', 'referenceLine'],
  base: {
    root: {
      position: 'relative',
      display: 'block',
      w: '100%',
      overflow: 'hidden',
      bgGradient: 'to-r',
      gradientFrom: 'surface.raised',
      gradientTo: 'surface.overlay',
    },
    svg: { display: 'block', w: '100%', h: 'auto' },
    chrome: { fill: 'surface.well' },
    dot: { fill: 'status.idle.border' },
    muted: { fill: 'status.idle.border' },
    title: { fill: 'fg.muted' },
    well: { fill: 'surface.well' },
    inset: { fill: 'surface.inset' },
    accent: { fill: 'accent.default' },
    violet: { fill: 'status.running.fg' },
    amber: { fill: 'status.needsYou.fg' },
    green: { fill: 'status.done.fg' },
    accentTint: { fill: 'accent.subtle' },
    violetTint: { fill: 'status.running.bg' },
    accentEdge: { fill: 'surface.well', stroke: 'status.working.border' },
    violetEdge: { fill: 'surface.well', stroke: 'status.running.border' },
    amberEdge: { fill: 'surface.well', stroke: 'status.needsYou.border' },
    greenEdge: { fill: 'surface.well', stroke: 'status.done.border' },
    reference: { position: 'absolute', inset: '0', w: '100%', h: '100%', overflow: 'visible', pointerEvents: 'none', '& foreignObject': { overflow: 'visible' } },
    referenceBox: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-end', h: '100%' },
    referenceLabel: { textStyle: 'mono', color: 'status.needsYou.fg', whiteSpace: 'nowrap', mb: '4' },
    referenceLine: {
      display: 'block',
      w: '100%',
      h: '0',
      borderTopWidth: 'default',
      borderTopStyle: 'dashed',
      borderColor: 'status.needsYou.fg',
      mb: 'calc(token(borderWidths.default) / -2)',
    },
  },
  variants: {
    framed: {
      // The frame is drawn over the edge, so it does not change the size.
      true: {
        root: {
          borderRadius: 'sm',
          _after: {
            content: '""',
            position: 'absolute',
            inset: '0',
            borderWidth: 'default',
            borderStyle: 'solid',
            borderColor: 'border.default',
            borderRadius: 'inherit',
            pointerEvents: 'none',
          },
        },
      },
      false: {},
    },
    size: {
      fill: {},
      sm: { root: { w: 'thumbnail.sm', flexShrink: '0' } },
      md: { root: { w: 'thumbnail.md', flexShrink: '0' } },
      lg: { root: { w: 'thumbnail.lg', flexShrink: '0' } },
    },
  },
  defaultVariants: { framed: true, size: 'fill' },
})
