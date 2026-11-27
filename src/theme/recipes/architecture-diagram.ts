import { defineSlotRecipe } from '@pandacss/dev'
import { scrollAreaX } from './scroll-area'

// A laid-out architecture diagram (the-bridge Projects, Architecture tab; Figma "NCC-1701 Projects"
// yJaVpShE9RVoQwUeUBnMQ4, System 224:2, the-bridge 230:2, phone 227:2, legend 224:204). The server lays it out, so
// the part draws only: the shapes at their boxes, the dashed boundaries, the arrows and their labels, then a legend
// and a caption. Figma's values are literals; each maps to the token with the same value:
// - Our code: fill #5EE1FF at 0.08 (accent.faint). Figma's stroke is that cyan at 0.5; the stroke here is
//   border.selected, so every outline keeps 3:1 against the card (ShapesDark, ShapesLight).
// - Third party: fill #17213A (surface.raised), stroke #8A97B8 at 0.7 (border.control).
// - Arrows: #8A97B8, here border.control, with a head at the end the arrow points to (Figma draws none; the spec and
//   the caption say each arrow points from the part that starts the call). The boundary: #7986A6 dashed 4.8 on
//   3.2 off, radius 10 (224:146), here border.control so it keeps 3:1 too.
// - Text: the phone sizes (227:96): names 13 bold (labelSmStrong), type lines 11 (smallXs, fg.muted), arrow labels
//   mono 11 (monoSm, fg.muted), boundary labels 12 bold (labelXsStrong, fg.muted). The layout is fixed in px, so the
//   drawing keeps the Small type at every text size (data-text-fixed, d-131); the list for screen readers carries
//   the same text.
// - Legend (224:206): 30 by 20 icons, 6 to the label (small 12/16, fg.muted), 16 between items, 8 between rows.
//   Caption and hint: small 12/16, fg.subtle (224:268, 227:156); the hint sits 6 under the scroll box.
export const architectureDiagram = defineSlotRecipe({
  className: 'architecture-diagram',
  jsx: ['ArchitectureDiagram'],
  staticCss: ['*'],
  slots: ['root', 'body', 'svg', 'shape', 'mark', 'dot', 'name', 'type', 'arrow', 'head', 'arrowLabel', 'boundary', 'boundaryLabel', 'hint', 'legend', 'legendItem', 'caption', 'text'],
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: '8', minW: '0', m: '0' },
    // The drawing scrolls sideways in its own box on a narrow screen (R16); the page does not.
    body: { minW: '0', overflowX: 'auto', overflowY: 'hidden', ...scrollAreaX, outline: 'none', borderRadius: 'md' },
    svg: { display: 'block', overflow: 'visible' },
    shape: {
      fill: 'surface.raised',
      stroke: 'border.control',
      strokeWidth: 'default',
      '[data-ours] > &': { fill: 'accent.faint', stroke: 'border.selected' },
    },
    mark: { fill: 'none', stroke: 'border.control', strokeWidth: 'default', '[data-ours] > &': { stroke: 'border.selected' } },
    dot: { fill: 'fg.subtle', '[data-ours] > &': { fill: 'accent.subtle' } },
    name: { textStyle: 'labelSmStrong', fill: 'fg.default' },
    type: { textStyle: 'smallXs', fill: 'fg.muted' },
    arrow: { fill: 'none', stroke: 'border.control', strokeWidth: 'default' },
    head: { fill: 'border.control' },
    arrowLabel: { textStyle: 'monoSm', fill: 'fg.muted' },
    boundary: { fill: 'none', stroke: 'border.control', strokeWidth: 'default', strokeDasharray: '5 3' },
    boundaryLabel: { textStyle: 'labelXsStrong', fill: 'fg.muted' },
    hint: { textStyle: 'small', color: 'fg.subtle', mt: '-2', px: '4', _hidden: { display: 'none' } },
    legend: { display: 'flex', flexWrap: 'wrap', columnGap: '16', rowGap: '8', m: '0', p: '0', listStyle: 'none' },
    legendItem: { display: 'inline-flex', alignItems: 'center', gap: '6', textStyle: 'small', color: 'fg.muted', '& svg': { flexShrink: '0' } },
    caption: { textStyle: 'small', color: 'fg.subtle' },
    text: { srOnly: true },
  },
})
