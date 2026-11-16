import { defineSlotRecipe } from '@pandacss/dev'

// The cards of Artifacts and Toolkit.
// - With media: the Artifacts card (D1 402:15468): a thumbnail on top
//   (402:15469), then a body (402:15496) with the title row and its badge,
//   a one-line description and a meta row.
// - Without media: the Toolkit card (D1 425:77): a leading tile (425:79), the
//   name and its path (425:82), a description, and a footer at the bottom.
// When the card has `onSelect`, its title is a button whose hit area covers
// the whole card.
export const card = defineSlotRecipe({
  className: 'card',
  jsx: ['Card'],
  staticCss: ['*'],
  slots: ['root', 'media', 'body', 'header', 'leading', 'heading', 'titleRow', 'title', 'action', 'badge', 'subtitle', 'description', 'meta'],
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
      '&:has(.card__action:focus-visible)': { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
    },
    media: { display: 'block', flexShrink: '0', overflow: 'hidden', '& > *': { display: 'block', w: '100%' } },
    body: { display: 'flex', flexDirection: 'column', flex: '1', minW: '0' },
    header: { display: 'flex', alignItems: 'center', minW: '0' },
    leading: { display: 'flex', flexShrink: '0' },
    heading: { display: 'flex', flexDirection: 'column', gap: '2', flex: '1', minW: '0' },
    titleRow: { display: 'flex', alignItems: 'center', gap: '8', minW: '0' },
    title: { minW: '0', textStyle: 'label', color: 'fg.default', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
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
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      cursor: 'pointer',
      outline: 'none',
      _after: { content: '""', position: 'absolute', inset: '0' },
    },
    badge: { display: 'flex', flexShrink: '0' },
    subtitle: { textStyle: 'mono', color: 'fg.muted', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    description: { textStyle: 'small', color: 'fg.muted', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    meta: { display: 'flex', alignItems: 'center', minW: '0', textStyle: 'mono', color: 'fg.muted' },
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
  },
  defaultVariants: { media: false },
})
