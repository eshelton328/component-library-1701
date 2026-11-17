import { defineSlotRecipe } from '@pandacss/dev'

// A page or pane whose top bar and bottom bar stay in view while only the
// content between them scrolls (brain decision d-107: a Back bar sticks to
// the top and a chat box to the bottom of their page or pane). The frame
// fills its parent's height: the parent must be a flex column with a
// bounded height, such as the AppShell detail or a Pane body. `gap` sets
// the space between the header, the body and the footer (0 by default).
// The body takes the focus, so the keyboard can scroll it, with the ring
// inside, as the AppShell detail does.
// The footer takes at most 30% of the frame's height and scrolls inside past
// that, so a long draft in a chat box still leaves the body room to read
// (d-107). In a 1232 x 400 window, a box capped at half the window left the
// Inbox discussion's messages 18 px; at 30% they keep 108 (Artifacts 60).
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
      flexShrink: '0',
      minW: '0',
      maxH: '30%',
      overflowY: 'auto',
      overscrollBehavior: 'contain',
      // A footer that scrolls clips what reaches past its box. Its 4 px of padding, taken back by the margin, keep a
      // child's focus ring (2 px, 2 out) inside it, and the content stays where it was.
      p: '4',
      m: '-4',
      // As in the body: a child that clips (a Card) keeps its height, so the footer scrolls instead of cutting it.
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
