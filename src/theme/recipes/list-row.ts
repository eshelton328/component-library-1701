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
export const listRow = defineSlotRecipe({
  className: 'list-row',
  jsx: ['ListRow'],
  staticCss: ['*'],
  slots: ['root', 'nest', 'leading', 'body', 'title', 'meta', 'lines', 'actions', 'trailing'],
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
  },
  defaultVariants: { variant: 'inbox', density: 'default' },
})
