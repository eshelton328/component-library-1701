import { defineSlotRecipe } from '@pandacss/dev'

// A chat being dragged (Workbench D2 105:960, D6 158:1034): a copy of its
// row on the opaque overlay surface, outlined in cyan (border.active, the
// lifted row's border) with the lifted shadow (shadow.lift), radius.lg.
// `tilt` turns it 3° clockwise, as D2 draws it over the sidebar's edge
// (292 × 67 with the turn); D6 draws it straight. No token holds an angle,
// so the turn is written here. The hint under it (105:976, 230 × 24) is a
// pill of Medium 11 text (`pill`, 11/16) in fg.accent on surface.overlay
// with a border.active outline, 24 tall (`control.xs`), padded 12 at the
// sides (Figma about 11). Neither takes the pointer, so the drop reaches
// the target under them.
// The hint sits 4 (spacing 4) under the copy's box as drawn: under a
// turned copy, under its turned bounding box, so the copy's low corner
// never meets the pill. The turn adds half of width × sin 3° under the
// straight box; a percentage margin is a share of the width the copy
// fills, so `tilt` adds 50% × sin 3° to the hint's top margin. (The
// height's share, h × (1 − cos 3°) / 2, is under 0.1 px.) Figma draws
// the hint 2.5 under the straight copy (105:960 turned box 351 to 418.1,
// straight 358.5 to 410.5; 105:976 from 413), so the pill crosses the
// turned box and touches the copy's corner; this keeps the 4 of the
// straight copy instead.
export const dragPreview = defineSlotRecipe({
  className: 'drag-preview',
  jsx: ['DragPreview'],
  staticCss: ['*'],
  slots: ['root', 'card', 'hint'],
  base: {
    root: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4', pointerEvents: 'none' },
    card: {
      alignSelf: 'stretch',
      bg: 'surface.overlay',
      borderRadius: 'lg',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.active',
      boxShadow: 'lift',
    },
    hint: {
      display: 'flex',
      alignItems: 'center',
      h: 'control.xs',
      px: '12',
      textStyle: 'pill',
      color: 'fg.accent',
      bg: 'surface.overlay',
      borderRadius: 'full',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.active',
    },
  },
  variants: {
    tilt: {
      false: {},
      true: { card: { transform: 'rotate(3deg)' }, hint: { mt: 'calc(50% * sin(3deg))' } },
    },
  },
  defaultVariants: { tilt: false },
})
