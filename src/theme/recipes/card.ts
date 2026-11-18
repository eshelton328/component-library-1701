import { defineSlotRecipe } from '@pandacss/dev'

// The cards of Artifacts and Toolkit.
// - With media: the Artifacts card (D1 402:15468): a thumbnail on top
//   (402:15469), then a body (402:15496) with the title row and its badge,
//   a one-line description and a meta row.
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
    title: { minW: '0', textStyle: 'label', color: 'fg.default' },
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
  },
  compoundVariants: [{ media: false, padding: 'compact', css: { body: { py: '10', px: '12' } } }],
  defaultVariants: { media: false, padding: 'default' },
})
