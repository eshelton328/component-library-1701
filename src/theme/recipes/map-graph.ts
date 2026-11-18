import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'
import { scrollArea } from './scroll-area'

const kinds = ['skill', 'agent', 'rule', 'workflow', 'hook'] as const

// The kind colour of an element with a data-kind attribute.
const kindColour = Object.fromEntries(kinds.map((k) => [`&[data-kind=${k}]`, { color: `kind.${k}` }]))

// A node of the Toolkit map, D2 424:1166: a 34 px row with a 1 px border in
// its kind colour on surface.raised (writing 426:464), radius 8, 10 px
// side padding and an 8 px gap. Label and meta are mono 12. A selected node
// (writer 426:512) has a 2 px cyan border on surface.selected and a cyan
// label; a dim node (ambitious 426:544) fades its icon and mutes its text.
// On the Links tab (D19) a node that is not the open item has a softer
// border, set by data-tone: `muted` is kindBorder (about 60 % of the kind
// colour, the graph's side nodes 493:84 to 493:142) and `faint` is
// kindBorderFaint (about 45 %, the link rows' nodes 482:549 to 482:653);
// the icon keeps the full kind colour. Only a lit node takes the tone; a
// dim or selected node keeps its own border. `labelStyle: 'label'` is the
// graph's open item (writer 493:78, 150 x 40): its name in the label style
// (493:81, 14/20), with the icon and name centred in the node.
export const mapNode = defineSlotRecipe({
  className: 'map-node',
  jsx: ['MapNode', 'MapGraph'],
  staticCss: ['*'],
  slots: ['root', 'icon', 'label', 'meta'],
  base: {
    root: {
      display: 'flex',
      alignItems: 'center',
      gap: '8',
      w: '100%',
      h: '100%',
      px: '10',
      bg: 'surface.raised',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderRadius: 'md',
      color: 'fg.default',
      textAlign: 'start',
      cursor: 'pointer',
      outline: 'none',
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
      '&[data-state=selected]': { bg: 'surface.selected', borderWidth: 'ring' },
    },
    icon: { display: 'inline-flex', flexShrink: '0', '[data-state=dim] > &': { opacity: 'disabled' } },
    label: {
      // TruncatedText inside cuts a long label and shows it whole in a tooltip.
      minW: '0',
      // Figma fades a dim label to 0.42; muted text keeps 4.5:1 contrast.
      '[data-state=dim] > &': { color: 'fg.muted' },
      '[data-state=selected] > &': { color: 'fg.accent' },
    },
    meta: { textStyle: 'mono', ms: 'auto', flexShrink: '0', whiteSpace: 'nowrap' },
  },
  variants: {
    kind: Object.fromEntries(
      kinds.map((k) => [
        k,
        {
          // A variant wins over base, so the state border colours are set here.
          root: {
            borderColor: `kind.${k}`,
            // A tone sets only a lit node's border, so the dim and selected borders stay.
            '&[data-state=lit][data-tone=muted]': { borderColor: `kindBorder.${k}` },
            '&[data-state=lit][data-tone=faint]': { borderColor: `kindBorderFaint.${k}` },
            '&[data-state=dim]': { borderColor: 'border.default' },
            '&[data-state=selected]': { borderColor: 'accent.default' },
          },
          icon: { color: `kind.${k}` },
          meta: { color: `kind.${k}`, '[data-state=dim] > &': { color: 'fg.muted' } },
        },
      ]),
    ),
    labelStyle: {
      mono: { label: { textStyle: 'mono' } },
      label: { root: { justifyContent: 'center' }, label: { textStyle: 'label' } },
    },
  },
  defaultVariants: { kind: 'skill', labelStyle: 'mono' },
})

// The map canvas, 426:362: surface.overlay (the opaque #0f1626 panel), a
// 1 px border and radius 12. Column labels (426:363) are mono 12 in muted.
// A lit link (426:446) is a 2 px cyan line with a 6 px dot at its end
// (426:447); the others (426:402, 426:369) are muted, 1.25 px in Figma.
// The Links graph's lines (D19 493:89 to 493:147) end at the node's edge
// with no dot; `MapGraph`'s `edgeEnd="none"` draws them so.
// The legend sits 24 px from the bottom left and the selection card 24 px
// from the bottom right, as in Figma. The phone's upright Links graph (M17
// `links graph` 493:152, links 493:234 to 493:293) uses the same edge and
// dot styles; `MapGraph`'s `orientation="vertical"` routes its lines.
// The phone's map is a window (M11 `map viewport` 461:866) over the drawing
// (`map canvas` 461:867) that pinch zooms and drags both ways (M11 hint
// 461:1257). `zoomable` is that window: the scroller clips the drawing and
// takes every touch gesture (`touch-action: none`), and the drawing moves
// and scales from its top left corner by --map-graph-x, --map-graph-y and
// --map-graph-scale, the runtime values `MapGraph` sets with
// `style.setProperty`. With no value set it draws as it does without the
// variant. Without `zoomable` the map keeps no variant class at all.
export const mapGraph = defineSlotRecipe({
  className: 'map-graph',
  jsx: ['MapGraph'],
  staticCss: ['*'],
  slots: ['root', 'scroller', 'svg', 'columnLabel', 'edge', 'edgeEnd', 'node', 'links', 'legend', 'card'],
  base: {
    root: {
      position: 'relative',
      bg: 'surface.overlay',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      borderRadius: 'xl',
      overflow: 'hidden',
    },
    scroller: { overflow: 'auto', maxW: '100%', ...scrollArea },
    svg: { display: 'block', overflow: 'visible' },
    columnLabel: { textStyle: 'monoCaps', fill: 'fg.muted' },
    edge: {
      fill: 'none',
      stroke: 'fg.muted',
      strokeWidth: 'token(borderWidths.default)',
      '&[data-lit]': { stroke: 'accent.default', strokeWidth: 'token(borderWidths.ring)' },
    },
    edgeEnd: { fill: 'fg.muted', '&[data-lit]': { fill: 'accent.default' } },
    node: { overflow: 'visible' },
    // The links of each node, read by assistive technology and hidden from view.
    links: { srOnly: true },
    legend: { position: 'absolute', left: '24', bottom: '24' },
    // Figma's card is 300 px wide; shell.popover (320) is the nearest size token.
    card: { position: 'absolute', right: '24', bottom: '24', w: 'shell.popover' },
  },
  variants: {
    zoomable: {
      true: {
        // clip, not hidden: a node that takes the focus cannot scroll the window; MapGraph moves the drawing to it.
        scroller: { overflow: 'clip', touchAction: 'none', userSelect: 'none' },
        svg: {
          transformOrigin: 'top left',
          transform: 'translate(var(--map-graph-x, 0px), var(--map-graph-y, 0px)) scale(var(--map-graph-scale, 1))',
        },
      },
    },
  },
})

// The legend of the map, 426:610: one row of kind icons (13 px, here 14)
// with their names in small muted text, and a hint, on a 1 px bordered
// well with radius 8 and 8 × 12 padding.
export const mapLegend = defineSlotRecipe({
  className: 'map-legend',
  jsx: ['MapLegend'],
  staticCss: ['*'],
  slots: ['root', 'list', 'item', 'icon', 'hint'],
  base: {
    root: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '16',
      py: '8',
      px: '12',
      bg: 'surface.well',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      borderRadius: 'md',
    },
    list: { display: 'flex', flexWrap: 'wrap', gap: '16', listStyle: 'none', m: '0', p: '0' },
    item: { display: 'inline-flex', alignItems: 'center', gap: '6', textStyle: 'small', color: 'fg.muted' },
    icon: { display: 'inline-flex', ...kindColour },
    hint: { textStyle: 'small', color: 'fg.muted' },
  },
})

// The selection card, 426:595: surface.overlay with a 1 px cyan border,
// radius 12, 16 px padding and a 10 px gap. The title row (426:596) holds
// the 16 px kind icon, the name in the label style, the kind in mono in
// its kind colour and a close button; then the description in small muted
// text, the link counts in mono and a full-width primary button.
export const mapSelectionCard = defineSlotRecipe({
  className: 'map-selection-card',
  jsx: ['MapSelectionCard'],
  staticCss: ['*'],
  slots: ['root', 'title', 'icon', 'name', 'kind', 'close', 'description', 'counts', 'action'],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10',
      p: '16',
      bg: 'surface.overlay',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'accent.default',
      borderRadius: 'xl',
    },
    title: { display: 'flex', alignItems: 'center', gap: '8' },
    icon: { display: 'inline-flex', flexShrink: '0' },
    // TruncatedText inside cuts a long name and shows it whole in a tooltip.
    name: { textStyle: 'label', color: 'fg.default', minW: '0', m: '0' },
    kind: { textStyle: 'mono', flexShrink: '0' },
    close: { ms: 'auto', flexShrink: '0' },
    description: { textStyle: 'small', color: 'fg.muted', m: '0' },
    counts: { textStyle: 'mono', color: 'fg.default', m: '0' },
    action: { display: 'flex', '& > button': { w: '100%' } },
  },
  variants: {
    kind: Object.fromEntries(kinds.map((k) => [k, { icon: { color: `kind.${k}` }, kind: { color: `kind.${k}` } }])),
  },
})
