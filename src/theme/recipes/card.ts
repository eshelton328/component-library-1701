import { defineSlotRecipe } from '@pandacss/dev'

// The cards of Artifacts and Toolkit.
// - With media: the Artifacts card (D1 402:15468): a thumbnail on top
//   (402:15469), then a body (402:15496) with the title row and its badge,
//   a description and a meta row. Figma draws one line of description; the
//   Artifacts page passes `descriptionLines={2}`, which keeps the slot two
//   lines high with or without text, so every artifact card has one height
//   (the-bridge review R77, the owner: "Artifact cards should always be the
//   same height").
// - Without media: the Toolkit card (D1 425:77): a leading tile (425:79), the
//   name and its path (425:82), a description, and a footer at the bottom.
// When the card has `onSelect`, its title is a button whose hit area covers
// the whole card.
// - `padding="compact"` is the Toolkit tablet row (T1 `toolkit row ·
//   agents-md` 428:59, 352 x 59): 10 above and below and 12 at the sides
//   inside the 1 px border, so the kind tile (428:60) starts 13 in and the
//   name (20) and path sit 11 under the row's top. With the name and the
//   path the row is 1 + 10 + 38 + 10 + 1 = 60 (Figma 59, its path line is
//   17, here 16 with the 2 px heading gap). `default` keeps the 16 inset.
//   Only a card without media takes it; the artifact card keeps its body.
// - `trailing` (a prop, no variant) ends the header row with a part, centred
//   down it, such as the counts `→0 ←1` (428:67, mono) after T1's spacer
//   (428:66): the heading takes the free width, so the part sits at the
//   row's end, in `mono` fg.muted as the meta row. Without it there is no
//   `trailing` slot.
// - `metaSpacer` adds Figma's 14 px spacer (D1 425:86) and the 10 px gap
//   after it above the meta row, as `pt` 24: the counts sit 10 + 24 = 34
//   under the description, Figma's 10 + 14 + 10, and the card is 148 high
//   (Figma 150; its description and counts lines are 17, here 16). The meta
//   row keeps `mt: auto`, so in a taller grid row it still ends the card.
// - `badgePosition="end"` is the Artifacts card's title row (D1 402:15452,
//   304 x 20 at x 111): the title (402:15453) is 244 wide and `badge · New`
//   (402:15454) runs from x 363 to 415, the row's end. The title takes the
//   free width, so the badge ends the row; a long title is still cut with
//   its tooltip, 8 before the badge. T1's New (405:187) ends its row too.
//   `title`, the default, keeps the badge 8 after the title.
// - The media body pads 12 above (402:15458 sits 12 under the body
//   402:15451's top at y 389, after the 20 px title row at y 401), and 16
//   at the sides and below, where Figma pads 14: a tie between 12 and 16
//   takes the larger token (d-072). The description and meta lines keep
//   16 (Figma 17), on the 4 px grid.
export const card = defineSlotRecipe({
  className: 'card',
  jsx: ['Card'],
  staticCss: ['*'],
  slots: ['root', 'media', 'body', 'header', 'leading', 'heading', 'titleRow', 'title', 'action', 'badge', 'subtitle', 'description', 'meta', 'trailing'],
  base: {
    root: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      minW: '0',
      overflow: 'hidden',
      bg: 'surface.pane',
      color: 'fg.default',
      borderRadius: 'lg',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      // Cut text in a card with a title button sits above the button's hit area; it keeps the pointer cursor.
      '&:has(.card__action)': { cursor: 'pointer' },
      '&:has(.card__action:focus-visible)': { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
    },
    media: { display: 'block', flexShrink: '0', overflow: 'hidden', '& > *': { display: 'block', w: '100%' } },
    body: { display: 'flex', flexDirection: 'column', flex: '1', minW: '0' },
    header: { display: 'flex', alignItems: 'center', minW: '0' },
    leading: { display: 'flex', flexShrink: '0' },
    heading: { display: 'flex', flexDirection: 'column', gap: '2', flex: '1', minW: '0' },
    titleRow: { display: 'flex', alignItems: 'center', gap: '8', minW: '0' },
    // TruncatedText inside cuts a long title and shows it whole in a tooltip.
    // A loading card's title takes the free width, so its Skeleton line has a width to take a part of.
    title: { minW: '0', textStyle: 'label', color: 'fg.default', '[data-loading] &': { flex: '1' } },
    // The title button of a card with onSelect: no box of its own, and a hit area over the whole card.
    action: {
      display: 'block',
      maxW: '100%',
      p: '0',
      bg: 'transparent',
      borderWidth: '0',
      color: 'inherit',
      font: 'inherit',
      textAlign: 'start',
      cursor: 'pointer',
      outline: 'none',
      _after: { content: '""', position: 'absolute', inset: '0' },
    },
    badge: { display: 'flex', flexShrink: '0' },
    // TruncatedText inside cuts a long subtitle or description and shows it whole in a tooltip.
    subtitle: { minW: '0', textStyle: 'mono', color: 'fg.muted' },
    description: { minW: '0', textStyle: 'small', color: 'fg.muted' },
    meta: { display: 'flex', alignItems: 'center', minW: '0', textStyle: 'mono', color: 'fg.muted' },
    trailing: { display: 'flex', alignItems: 'center', gap: '6', flexShrink: '0', textStyle: 'mono', color: 'fg.muted', whiteSpace: 'nowrap' },
  },
  variants: {
    media: {
      true: {
        body: { pt: '12', px: '16', pb: '16', gap: '4' },
        meta: { gap: '6', pt: '4' },
      },
      false: {
        body: { p: '16', gap: '10' },
        header: { gap: '10' },
        meta: { gap: '12', mt: 'auto' },
      },
    },
    // The inset of a card without media; the compound variant below sets it, so it wins over `media`'s 16.
    padding: { default: {}, compact: {} },
    metaSpacer: {
      true: { meta: { pt: '24' } },
      false: {},
    },
    badgePosition: {
      title: {},
      end: { title: { flex: '1' } },
    },
    // `2` gives the description exactly two lines of its own line height (`lh`, so it scales with the text size),
    // with text or without; Card clamps the text to two lines. `1` lets the slot take its text's height.
    descriptionLines: {
      '1': {},
      '2': { description: { h: 'calc(2 * 1lh)', flexShrink: '0' } },
    },
  },
  compoundVariants: [{ media: false, padding: 'compact', css: { body: { py: '10', px: '12' } } }],
  defaultVariants: { media: false, padding: 'default', metaSpacer: false, badgePosition: 'title', descriptionLines: '1' },
})
