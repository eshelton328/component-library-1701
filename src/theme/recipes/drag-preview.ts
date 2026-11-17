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
      true: { card: { transform: 'rotate(3deg)' } },
    },
  },
  defaultVariants: { tilt: false },
})
