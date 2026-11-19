import { defineSlotRecipe } from '@pandacss/dev'

// The list rows of Inbox (D1 346:195, 346:266; snoozed 346:1610; running
// 346:2205) and of the Workbench sidebar (D2 105:660, selected 105:643). The
// whole row is the target of its title button: the button's ::after covers
// the row, and the `actions` slot sits above it.
// A nested row (`level`), such as a subtask's chat under the chat that
// started it (Workbench D18 417:1204, D16 417:483): the row keeps its start
// padding (Figma 27, nearest token 24) and starts with a ↳ in Inter 13
// #8a97b8 (`body`, fg.muted), 10 before the kind mark (the row gap).
// A compact row (`density`) has the smaller text of the Inbox D1 list: the
// title Geist Medium 13 (346:202, `labelSm`, 17 tall in Figma, 16 here),
// the meta and the age Geist Mono 11 (346:203, 346:218, `monoSm`, 14 tall
// in Figma, 16 here). Figma's title and meta row (346:237) is 55 tall, with
// no border: 10 + 17 + 4 + 14 + 10. On the 4 px grid it is 56 (d-100 rule 3),
// so a compact row puts its lines 2 apart: 1 + 10 + 16 + 2 + 16 + 10 + 1.
// The same 2 sits between the meta and any more lines or actions.
// A compact sidebar row is the Workbench sidebar chat (D2 105:705, selected
// 105:643): Figma draws its kind mark 22 in, so a top-level row pads 20
// inside its 1 px border (21, nearest token; 24 drew it 25 in). The 4 px
// go to the meta, where the model and the 83 px context meter beside a
// Needs you pill (105:710, 155 wide in a 158 column) were cut 2 px. A
// nested row keeps 24, so its ↳ stays 25 in (Figma 27, 199:68).
// The Artifacts rows (all on the `inbox` variant; the defaults keep the
// Inbox look):
// - `padding="sm"` is the list beside an open artifact (D2 403:219): 8
//   inside the 1 px border, so a title and meta row is 1 + 8 + 40 + 8 + 1 =
//   58, Figma's height. `padding="phone"` is the phone's library (M1
//   406:121, 66 high at y 229; the 48 px preview 406:122 at y 238): 4 at
//   the sides (the preview 4 in) and 8 above and below. Figma's 9 is
//   measured from the row's edge, so it holds the 1 px border and 8
//   inside it, as D2's 9 is `sm`'s 8: a row with the 48 px preview is
//   1 + 8 + 48 + 8 + 1 = 66, Figma's height.
//   `padding="lg"` is the library's list
//   view (D4 403:8216): 12 inside the border, so the preview sits 13 in.
//   `padding="pane"` is the Toolkit list beside an open item (D03 427:94,
//   D14 459:193, D37 495:193, D10 440:1018): Figma's row is 386 x 53 with no
//   border, the 28 px kind tile 10 in and 12.5 down, the name (20) over the
//   path (17) with no gap, and the counts (427:102) centred at the end. 53 is
//   off the 4 px grid (d-100), so the row is 52: 6 above and below inside the
//   1 px border, the title and meta 2 apart, 1 + 6 + 20 + 2 + 16 + 6 + 1. 56
//   would be 3 off; 52 is 1 off and keeps more rows in the pane. The leading,
//   the body and the trailing are centred down the row, so the tile sits 12
//   down. The sides keep 10, so the tile is 11 in (Figma 10; 9 is no token,
//   d-072). The open item's row (427:166, 386 x 55 with the selected fill and
//   a cyan border) keeps the same 52: the border is there, clear, on every
//   row, so opening an item does not move the list.
// - `surface="card"` draws the D4 row's box: a 1 px border.default border
//   on surface.pane, as the Card has, in the row's own lg radius. A
//   selected or running row keeps the selected colours.
// - `trailingAlign="center"` centres the trailing column down the row, as
//   D2 draws the age (403:218 at y 185.5 of a 58 px row at 164) and D4 the
//   match place, age and Open (403:8241, 403:8243, 403:8244). The default
//   `start` keeps it on the title line, as Inbox and the phone (406:138).
// - `dot` ends the title row with a 6 px dot in the status colour, as the
//   New dot in status.working.fg (D2 403:213, D4 403:8233). With
//   `dotPosition="title"` (the default) it sits 8 after the title (D4
//   403:8233, the gap of the Card's title row); with `end` the title fills
//   the line and the dot ends it, 12 before the trailing column (D2 403:213
//   at x 420, the age at 438): the 10 px row gap and 2 more.
// - `leadingGap="16"` puts the body 16 after the leading, as D4's title
//   (403:8232 at x 253) after its 128 px preview (403:8217, x 109 to 237):
//   the 10 px row gap and 6 more after the leading. Without it the gap
//   stays 10. `leadingGap="12"` puts the body 12 after the leading, as the
//   Toolkit phone row's name (M1 429:96) after its 36 px kind tile.
// - `bodyAlign="center"` centres the body down the row, as D4's 62 px text
//   frame (403:8230 at y 218) in the 98 px row (403:8216 at y 200): 18 below
//   the row's top, not the 13 of the border and `lg`'s 12. `start`, the
//   default, keeps the body at the top.
// - `metaTrailing` (a prop, no variant) ends the meta line with a part, as
//   the phone search match row (M5) ends its meta line 408:94 (y 240) with
//   New (408:99, 48 x 16 at x 326, y 240.5) after a flexible spacer
//   (408:98, 112 wide there). The meta line becomes the `metaRow` slot: the
//   meta text fills it and the part sits at the body's right edge, centred
//   on the meta line. The 8 between them only keeps a long meta off the
//   part; Figma's spacer is the free width. Without the prop there is no
//   `metaRow`, and the meta is the body's own child as before.
// - `trailingPlacement="title"` is the phone search match row (M5 408:76,
//   366 wide): the age (408:93, 22 x 17 at x 352, y 218.5) ends the
//   title line (408:92, from x 104), and the meta line (408:94 at x 104,
//   270 wide) runs on under the age to x 374, where New (408:99) ends it.
//   So `trailing` moves into the title row, which becomes a flex row
//   (as with a dot), and sits at the body's right edge, centred on the
//   title line; the body runs the full width after the leading. The 8
//   between the title and the age only keeps a long title off the age.
//   The title button's ::after still covers the row, so a click on the
//   age selects it. `column`, the default, keeps the trailing column.
export const listRow = defineSlotRecipe({
  className: 'list-row',
  jsx: ['ListRow'],
  staticCss: ['*'],
  slots: ['root', 'nest', 'leading', 'body', 'titleRow', 'title', 'dot', 'meta', 'metaRow', 'metaTrailing', 'lines', 'actions', 'trailing'],
  base: {
    root: {
      position: 'relative',
      display: 'flex',
      gap: '10',
      borderRadius: 'lg',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'transparent',
      color: 'fg.default',
      // Cut text in a row with a title button sits above the button's hit area; it keeps the pointer cursor.
      '&:has(button.list-row__title)': { cursor: 'pointer' },
      // The keyboard focus of the title button rings the whole row.
      '&:has(.list-row__title:focus-visible)': { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
      '&[data-selected], &[data-running]': { bg: 'surface.selected', borderColor: 'border.selected' },
      // A selected or running row is not dimmed: its text must keep 4.5:1 on the selected colour.
      '&[data-snoozed]:not([data-selected]):not([data-running])': { opacity: 'snoozed' },
      // A finished row that is not open (Inbox D7 346:2940) draws its title in #8a97b8 (fg.muted) and fades its kind
      // tile: Figma to 0.6, here opacity.finished (0.75), the nearest value that keeps the kind icon at 3:1 (d-100).
      '&[data-finished]:not([data-selected]):not([data-running]) .list-row__title': { color: 'fg.muted' },
      '&[data-finished]:not([data-selected]):not([data-running]) .list-row__leading': { opacity: 'finished' },
      // Figma draws the age and tags in #4a5675 (fg.subtle). On surface.selected fg.subtle is not allowed,
      // and on a snoozed row's 0.85 opacity it falls under 4.5:1, so those rows keep fg.muted.
      '&:is([data-selected], [data-running], [data-snoozed]) :is(.list-row__trailing, .tags-line__root)': { color: 'fg.muted' },
    },
    // Level 2 has no Figma frame: its ↳ moves one step in, under the kind
    // mark of a level 1 row (24 + 13 + 10 = 47, so 23 more; nearest token 24).
    nest: { flexShrink: '0', textStyle: 'body', color: 'fg.muted', '[data-level="2"] > &': { ms: '24' } },
    leading: { display: 'inline-flex', flexShrink: '0' },
    body: { display: 'flex', flexDirection: 'column', gap: '4', flex: '1', minW: '0' },
    // The title and the dot. Without a dot the title row draws no box, so the title lays out as the body's own child.
    titleRow: { display: 'contents', '&:has(> .list-row__dot)': { display: 'flex', alignItems: 'center', gap: '8', minW: '0' } },
    dot: { flexShrink: '0', w: '6', h: '6', borderRadius: 'full' },
    title: {
      textStyle: 'label',
      color: 'fg.default',
      textAlign: 'start',
      bg: 'transparent',
      border: 'none',
      p: '0',
      outline: 'none',
      '&:is(button)': {
        cursor: 'pointer',
        _after: { content: '""', position: 'absolute', inset: '0', borderRadius: 'inherit' },
      },
    },
    meta: { textStyle: 'mono', color: 'fg.muted' },
    // The meta line with a `metaTrailing` part: the meta text takes the free width, so the part ends the line.
    // A long word in the meta wraps inside that width, so it never runs under the part.
    metaRow: { display: 'flex', alignItems: 'center', gap: '8', minW: '0', '& > .list-row__meta': { flex: '1', minW: '0', overflowWrap: 'anywhere' } },
    metaTrailing: { display: 'inline-flex', flexShrink: '0', ms: 'auto' },
    lines: { display: 'flex', flexDirection: 'column', gap: '4', textStyle: 'small', color: 'fg.muted' },
    // Buttons in the row, such as Approve. They sit above the title's ::after, so a click reaches them.
    // The space between the buttons passes clicks to the title cover; only the buttons take them.
    actions: { position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '6', pt: '4', pointerEvents: 'none', '& > *': { pointerEvents: 'auto' } },
    trailing: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6', flexShrink: '0', textStyle: 'mono', color: 'fg.subtle', whiteSpace: 'nowrap' },
  },
  variants: {
    variant: {
      // An Inbox row: its title and meta wrap, and the items sit at the top.
      inbox: { root: { alignItems: 'flex-start', p: '10' } },
      // A chat row of the Workbench sidebar: one line of title, centred items.
      sidebar: {
        root: { alignItems: 'center', py: '8', ps: '24', pe: '10' },
        // TruncatedText inside cuts a long title and shows it whole in a tooltip.
        title: { minW: '0' },
        // A text meta holds a TruncatedText, which cuts it and shows it whole in a tooltip; any other meta is cut here.
        meta: { minW: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', '&:has(> .truncated-text)': { overflow: 'visible' } },
      },
    },
    density: {
      default: {},
      compact: { body: { gap: '2' }, title: { textStyle: 'labelSm' }, meta: { textStyle: 'monoSm' }, trailing: { textStyle: 'monoSm' } },
    },
    // The padding of an `inbox` row; the compound variants below set it, so it wins over the variant's 10.
    padding: { default: {}, sm: {}, lg: {}, phone: {}, pane: {} },
    surface: {
      default: {},
      // The base's selected colours lose to a variant, so the card sets them again.
      card: {
        root: {
          bg: 'surface.pane',
          borderColor: 'border.default',
          '&[data-selected], &[data-running]': { bg: 'surface.selected', borderColor: 'border.selected' },
        },
      },
    },
    trailingAlign: {
      start: {},
      center: { trailing: { alignSelf: 'center' } },
    },
    dot: {
      working: { dot: { bg: 'status.working.fg' } },
      running: { dot: { bg: 'status.running.fg' } },
      needsYou: { dot: { bg: 'status.needsYou.fg' } },
      idle: { dot: { bg: 'status.idle.fg' } },
      done: { dot: { bg: 'status.done.fg' } },
      danger: { dot: { bg: 'status.danger.fg' } },
    },
    leadingGap: {
      '12': { leading: { me: '2' } },
      '16': { leading: { me: '6' } },
    },
    bodyAlign: {
      start: {},
      center: { body: { alignSelf: 'center' } },
    },
    trailingPlacement: {
      column: {},
      title: {
        titleRow: { display: 'flex', alignItems: 'center', gap: '8', minW: '0' },
        title: { minW: '0' },
        trailing: { ms: 'auto' },
      },
    },
    dotPosition: {
      title: {},
      end: { titleRow: { '&:has(> .list-row__dot) > .list-row__title': { flex: '1' } }, dot: { me: '2' } },
    },
  },
  compoundVariants: [
    { variant: 'sidebar', density: 'compact', css: { root: { ps: '20', '&[data-level]': { ps: '24' } } } },
    { variant: 'inbox', padding: 'sm', css: { root: { p: '8' } } },
    { variant: 'inbox', padding: 'lg', css: { root: { p: '12' } } },
    { variant: 'inbox', padding: 'phone', css: { root: { px: '4', py: '8' } } },
    { variant: 'inbox', padding: 'pane', css: { root: { alignItems: 'center', px: '10', py: '6' }, body: { gap: '2' } } },
  ],
  defaultVariants: { variant: 'inbox', density: 'default', padding: 'default', surface: 'default', trailingAlign: 'start', bodyAlign: 'start', dotPosition: 'title', trailingPlacement: 'column' },
})
