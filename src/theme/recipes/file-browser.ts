import { defineSlotRecipe } from '@pandacss/dev'

// The Files tab's browser: the item's tree beside the selected file
// (`file browser` D6 432:2141, D10 440:1208, D33 494:397 to D36 494:2523).
// - `split`: one bordered box (radius xl); the tree column (`tree`
//   432:2142, 330 in Figma) is `shell.sidebar` (328, the file tree's width,
//   d-100) on `surface.well`, as high as the box, and the viewer (`viewer`
//   432:2290) fills the rest. The box grows to fill a flex parent, as
//   Figma's runs to the pane's foot.
// - `stacked`: a tablet's two boxes (T4 `tree` 434:408, `viewer` 434:485;
//   T32 to T35): the tree in a bordered box as high as its rows, the viewer
//   12 under it (Figma 14; no space token has 14, d-050). The viewer brings
//   its own box (a FileFrame with `variant="box"`).
export const fileBrowser = defineSlotRecipe({
  className: 'file-browser',
  jsx: ['FileBrowser'],
  staticCss: ['*'],
  slots: ['root', 'tree', 'viewer'],
  base: {
    root: { display: 'flex', minW: '0', color: 'fg.default' },
    tree: { display: 'flex', flexDirection: 'column', minW: '0', bg: 'surface.well', '& > *': { flexGrow: '1' } },
    viewer: { display: 'flex', flexDirection: 'column', minW: '0' },
  },
  variants: {
    layout: {
      split: {
        root: {
          flexDirection: 'row',
          flexGrow: '1',
          bg: 'surface.pane',
          borderWidth: 'default',
          borderStyle: 'solid',
          borderColor: 'border.default',
          borderRadius: 'xl',
          overflow: 'hidden',
        },
        tree: { w: 'shell.sidebar', flexShrink: '0' },
        viewer: { flexGrow: '1' },
      },
      stacked: {
        root: { flexDirection: 'column', gap: '12' },
        tree: { borderWidth: 'default', borderStyle: 'solid', borderColor: 'border.default', borderRadius: 'xl', overflow: 'hidden' },
      },
    },
  },
  defaultVariants: { layout: 'split' },
})
