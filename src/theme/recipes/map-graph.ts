import { defineSlotRecipe } from '@pandacss/dev'

const kinds = ['skill', 'agent', 'rule', 'workflow', 'hook'] as const

// The kind colour of an element with a data-kind attribute.
const kindColour = Object.fromEntries(kinds.map((k) => [`&[data-kind=${k}]`, { color: `kind.${k}` }]))

// A node of the Toolkit map, D2 424:1166: a 34 px row with a 1 px border in
// its kind colour on surface.raised (writing 426:464), radius 8, 10 px
// side padding and an 8 px gap. Label and meta are mono 12. A selected node
// (writer 426:512) has a 2 px cyan border on surface.selected and a cyan
// label; a dim node (ambitious 426:544) fades its icon and mutes its text.
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
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
      '&[data-state=selected]': { bg: 'surface.selected', borderWidth: 'ring' },
    },
    icon: { display: 'inline-flex', flexShrink: '0', '[data-state=dim] > &': { opacity: 'disabled' } },
    label: {
      textStyle: 'mono',
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
          root: { borderColor: `kind.${k}`, '&[data-state=dim]': { borderColor: 'border.default' }, '&[data-state=selected]': { borderColor: 'accent.default' } },
          icon: { color: `kind.${k}` },
          meta: { color: `kind.${k}`, '[data-state=dim] > &': { color: 'fg.muted' } },
        },
      ]),
    ),
  },
  defaultVariants: { kind: 'skill' },
})

// The map canvas, 426:362: surface.overlay (the opaque #0f1626 panel), a
// 1 px border and radius 12. Column labels (426:363) are mono 12 in muted.
// A lit link (426:446) is a 2 px cyan line with a 6 px dot at its end
// (426:447); the others (426:402, 426:369) are muted, 1.25 px in Figma.
// The legend sits 24 px from the bottom left and the selection card 24 px
// from the bottom right, as in Figma.
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
    scroller: { overflow: 'auto', maxW: '100%' },
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
