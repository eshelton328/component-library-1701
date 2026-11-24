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
// - The end group keeps its width, so the copy icon and Read-only stay in
//   the box at any width. On the phone (M20 487:1650) Figma cuts Read-only
//   at the box's edge (487:1660 starts past it); here the meta, then the
//   name, give way first and end with an ellipsis (TruncatedText shows them
//   whole in a tooltip), so the copy icon can always be pressed.
// - foot: the line on what uses the file (`used by` 432:2347): a 12 px icon
//   (Figma 13; icon.12, d-100) 12 in, the text in small muted text 8 after
//   it, 10 above and below.
// - `variant="box"` is the bordered box (radius xl, as a Panel section);
//   `variant="flush"` has no border and fills its column, for the viewer
//   inside a FileBrowser (D6 432:2290).
// - `barEnd: 'keep'` (the default) keeps the end group in the box and lets
//   the meta, then the name, give way; `barEnd: 'cut'` gives the end group
//   only the room the name and the meta leave, so its content runs on past
//   the box's border, where the box cuts it, as Figma's phone preview does
//   (M20 487:1650, Read-only 487:1660 past the box). The end group's track
//   is 0 wide when the name and the meta fill the bar, and `safe` alignment
//   puts its content at the track's start then, so it overflows to the
//   right, never over the meta. A name and meta wider than the bar still
//   shrink and show their tooltip. Use it only where the end holds no
//   control.
// - Text sizes (d-122): `barEnd: 'cut'` cuts Read-only at Small only, the
//   size of the Figma frames. At Default and Large the text is wider, so the
//   bar wraps: the end group keeps its own width and moves to a row of its
//   own when it does not fit after the name, at the bar's end, 8 under the
//   name's row (the bar's gap). The meta takes only the room the name and
//   the end group leave on the first row, so it gives way first, as at
//   Small; a name too long for its row still ends with an ellipsis.
// The fill is `surface.pane` with no glass blur, as Figma draws the box.
// `barEnd: 'cut'` at Default and Large: the bar wraps and the end group keeps its width.
const wrappedBar = { flexWrap: 'wrap' } as const
const wrappedMeta = { flexBasis: '0', flexGrow: '1' } as const
const wrappedEnd = { flexBasis: 'auto', flexGrow: '0', minW: 'auto', ms: 'auto', justifyContent: 'flex-start' } as const

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
    // The meta gives way before the name: it shrinks 4 times as fast.
    name: { textStyle: 'mono', color: 'fg.default', whiteSpace: 'nowrap', minW: '0', flexShrink: '1' },
    meta: { textStyle: 'mono', color: 'fg.muted', whiteSpace: 'nowrap', minW: '0', flexShrink: '4', overflow: 'hidden' },
    end: { display: 'inline-flex', alignItems: 'center', gap: '8', ms: 'auto', flexShrink: '0' },
    readOnly: { display: 'inline-flex', alignItems: 'center', gap: '8', textStyle: 'small', whiteSpace: 'nowrap' },
    // In a bounded parent (a FileBrowser in a pane) the body scrolls, so a long file stays reachable.
    // Its content keeps its height (a CodeLines, whose overflowX would let it shrink and scroll on its own), so
    // the body is the one scroll for code and Markdown.
    body: { display: 'flex', flexDirection: 'column', flexGrow: '1', minW: '0', minH: '0', overflowY: 'auto', '& > *': { flexShrink: '0' } },
    foot: { display: 'flex', alignItems: 'center', gap: '8', px: '12', py: '10', textStyle: 'small', color: 'fg.muted' },
    // The caller passes the icon in, so `!` wins over its own size (../AGENTS.md).
    footIcon: { display: 'inline-flex', flexShrink: '0', '& svg': { w: 'icon.12!', h: 'icon.12!' } },
  },
  variants: {
    variant: {
      box: {
        root: { borderWidth: 'default', borderStyle: 'solid', borderColor: 'border.default', borderRadius: 'xl', overflow: 'hidden' },
      },
      flush: { root: { flexGrow: '1', minH: '0' } },
    },
    barEnd: {
      keep: {},
      cut: {
        bar: { _textDefault: wrappedBar, _textLarge: wrappedBar },
        meta: { _textDefault: wrappedMeta, _textLarge: wrappedMeta },
        end: {
          flexBasis: '0',
          flexGrow: '1',
          minW: '0',
          ms: '0',
          justifyContent: 'safe flex-end',
          _textDefault: wrappedEnd,
          _textLarge: wrappedEnd,
        },
      },
    },
  },
  defaultVariants: { variant: 'box', barEnd: 'keep' },
})
