import { defineSlotRecipe } from '@pandacss/dev'

// A page or pane whose top bar and bottom bar stay in view while only the
// content between them scrolls (brain decision d-107: a Back bar sticks to
// the top and a chat box to the bottom of their page or pane). The frame
// fills its parent's height: the parent must be a flex column with a
// bounded height, such as the AppShell detail or a Pane body. `gap` sets
// the space between the header, the body and the footer (0 by default).
// The body takes the focus, so the keyboard can scroll it, with the ring
// inside, as the AppShell detail does.
// The frame does not cap the footer: a Composer in it caps its own long
// draft at 30% of the nearest size container (the composer recipe), so the
// body keeps room to read (d-107) and a composer at rest keeps its height,
// as Figma draws it. A footer cap of 30% clipped the 112 px Workbench
// composer at rest in a 373 px pane. The frame is not a size container
// itself: in a parent sized by its content (the Workspaces side chat) that
// shrank the parent; give the frame's bounded parent containerType 'size'.
export const scrollFrame = defineSlotRecipe({
  className: 'scroll-frame',
  jsx: ['ScrollFrame'],
  staticCss: ['*'],
  slots: ['root', 'header', 'body', 'footer'],
  base: {
    root: { display: 'flex', flexDirection: 'column', flex: '1', minW: '0', minH: '0' },
    header: { display: 'flex', flexDirection: 'column', flexShrink: '0', minW: '0' },
    body: {
      display: 'flex',
      flexDirection: 'column',
      flex: '1',
      minW: '0',
      minH: '0',
      overflowY: 'auto',
      overscrollBehavior: 'contain',
      // A flex column shrinks its children to fit; a child that clips (overflow hidden, such as a Card) would lose its
      // content instead of making the body scroll. The children keep their height.
      '& > *': { flexShrink: '0' },
      outline: 'none',
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '-2' },
    },
    footer: {
      display: 'flex',
      flexDirection: 'column',
      // A footer taller than the room the header leaves shrinks to it and scrolls inside, so it never reaches past
      // the frame. The body grows from 0, so the footer shrinks only when the body has no room left.
      flexShrink: '1',
      minW: '0',
      minH: '0',
      overflowY: 'auto',
      overscrollBehavior: 'contain',
      // A footer taller than the frame scrolls, so it clips what reaches past its box. Its 4 px of padding, taken back by the margin, keep a
      // child's focus ring (2 px, 2 out) inside it, and the content stays where it was.
      p: '4',
      m: '-4',
      // As in the body: a child that clips (a Card) keeps its height.
      '& > *': { flexShrink: '0' },
    },
  },
  variants: {
    gap: {
      '0': { root: { gap: '0' } },
      '4': { root: { gap: '4' } },
      '8': { root: { gap: '8' } },
      '12': { root: { gap: '12' } },
      '16': { root: { gap: '16' } },
      '24': { root: { gap: '24' } },
    },
  },
  defaultVariants: { gap: '0' },
})
