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
export const thumbnail = defineSlotRecipe({
  className: 'thumbnail',
  jsx: ['Thumbnail'],
  staticCss: ['*'],
  slots: ['root', 'svg', 'chrome', 'dot', 'muted', 'title', 'well', 'inset', 'accent', 'violet', 'amber', 'green', 'accentTint', 'violetTint', 'accentEdge', 'violetEdge', 'amberEdge', 'greenEdge'],
  base: {
    root: {
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
  },
  variants: {
    framed: {
      true: { root: { borderWidth: 'default', borderStyle: 'solid', borderColor: 'border.default', borderRadius: 'sm' } },
      false: {},
    },
  },
  defaultVariants: { framed: true },
})
