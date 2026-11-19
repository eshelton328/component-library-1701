import { defineSlotRecipe } from '@pandacss/dev'

// A file shown read-only: a bar over the file's body, and an optional line
// at its foot. The Toolkit's Overview preview (`file preview` D3 427:273,
// `preview bar` 427:274; D9 433:1572, T17 487:509, M20 487:1649, M22
// 487:2220) and the Files viewer (`viewer` D6 432:2290, `viewer bar`
// 432:2291, `used by` 432:2347; T4 434:485).
// - bar: 37 high in Figma: 10 + the 12/16 mono line + 10 + the 1 px rule
//   under it. The 14 px `icon/file` or `icon/code` (427:275, 433:1574) draws
//   at icon.16 (no 14 token, d-050), 12 in from the box's border, so its
//   centre is where Figma's 14 px icon, 14 in, has it. The name (mono,
//   fg.default) and the meta (mono, fg.muted, D7 433:567, 432:2295) follow 8
//   apart. The end group (the caller's actions, the 12 px copy icon 432:2297
//   and the 12 px `icon/lock` with Read-only in small text) starts at the
//   bar's end; its items are 8 apart.
// - The name and the end keep their width: on the phone (M20 487:1650) the
//   bar is one line and the box cuts Read-only at its edge (487:1660 starts
//   past the box), so nothing ends with an ellipsis.
// - foot: the line on what uses the file (`used by` 432:2347): a 12 px icon
//   (Figma 13; icon.12, d-100) 12 in, the text in small muted text 8 after
//   it, 10 above and below.
// - `variant="box"` is the bordered box (radius xl, as a Panel section);
//   `variant="flush"` has no border and fills its column, for the viewer
//   inside a FileBrowser (D6 432:2290).
// The fill is `surface.pane` with no glass blur, as Figma draws the box.
export const fileFrame = defineSlotRecipe({
  className: 'file-frame',
  jsx: ['FileFrame'],
  staticCss: ['*'],
  slots: ['root', 'bar', 'icon', 'name', 'meta', 'end', 'readOnly', 'body', 'foot', 'footIcon'],
  base: {
    root: { display: 'flex', flexDirection: 'column', minW: '0', bg: 'surface.pane', color: 'fg.default' },
    bar: {
      display: 'flex',
      alignItems: 'center',
      gap: '8',
      minW: '0',
      px: '12',
      py: '10',
      borderBottomWidth: 'default',
      borderBottomStyle: 'solid',
      borderBottomColor: 'border.default',
      color: 'fg.muted',
    },
    icon: { display: 'inline-flex', flexShrink: '0' },
    name: { textStyle: 'mono', color: 'fg.default', whiteSpace: 'nowrap', flexShrink: '0' },
    meta: { textStyle: 'mono', color: 'fg.muted', whiteSpace: 'nowrap', flexShrink: '0' },
    end: { display: 'inline-flex', alignItems: 'center', gap: '8', ms: 'auto', flexShrink: '0' },
    readOnly: { display: 'inline-flex', alignItems: 'center', gap: '8', textStyle: 'small', whiteSpace: 'nowrap' },
    body: { display: 'flex', flexDirection: 'column', flexGrow: '1', minW: '0', minH: '0' },
    foot: { display: 'flex', alignItems: 'center', gap: '8', px: '12', py: '10', textStyle: 'small', color: 'fg.muted' },
    // The caller passes the icon in, so `!` wins over its own size (../AGENTS.md).
    footIcon: { display: 'inline-flex', flexShrink: '0', '& svg': { w: 'icon.12!', h: 'icon.12!' } },
  },
  variants: {
    variant: {
      box: {
        root: { borderWidth: 'default', borderStyle: 'solid', borderColor: 'border.default', borderRadius: 'xl', overflow: 'hidden' },
      },
      flush: { root: { flexGrow: '1' } },
    },
  },
  defaultVariants: { variant: 'box' },
})
