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
// Under a tab bar (the AppShell detail with tabBarOverlay, Toolkit M02,
// M20, M22): the detail sets --app-shell-tab-bar-inset to
// sizes.shell.tabBar and --app-shell-tab-bar-spacer to block for its
// direct child, and 0px and none deeper down. The frame takes them as
// --scroll-frame-inset and --scroll-frame-spacer (0 and none when unset,
// so a frame anywhere else draws as before), reaches that far down into
// the detail's end padding, to the bottom of the shell, and lifts its
// footer by the inset, so a sticky Start button sits just above the bar.
// With no footer, the body ends with a spacer of that height (shown only
// under the bar, so it adds no gap elsewhere), so its last line scrolls
// above the bar. --scroll-frame-inset is public: a sticky element inside
// the body (the-bridge DetailFrame's Start) sticks at
// bottom: var(--scroll-frame-inset, 0px), and the spacer below it keeps
// the body's last line above it at the end of the scroll.
export const scrollFrame = defineSlotRecipe({
  className: 'scroll-frame',
  jsx: ['ScrollFrame'],
  staticCss: ['*'],
  slots: ['root', 'header', 'body', 'footer'],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      flex: '1',
      minW: '0',
      minH: '0',
      // Read here, on the detail's child; the detail resets both below it, so a frame nested in this one keeps 0.
      '--scroll-frame-inset': 'var(--app-shell-tab-bar-inset, 0px)',
      '--scroll-frame-spacer': 'var(--app-shell-tab-bar-spacer, none)',
      mb: 'calc(var(--scroll-frame-inset) * -1)',
    },
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
      // With no footer, the body is the last slot: it ends with the inset, below its own padding.
      // With no footer, a control that takes the focus under the bar scrolls out from under it (0 elsewhere).
      '&:last-child': { scrollPaddingBottom: 'var(--scroll-frame-inset)' },
      '&:last-child::after': {
        content: '""',
        display: 'var(--scroll-frame-spacer)',
        flexShrink: '0',
        h: 'var(--scroll-frame-inset)',
      },
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
      // The footer's box is its content's box and stays inside the frame: no padding and no negative margin, so
      // it never reaches past the frame (a 4 px margin made the-bridge's phone detail overflow, Workspaces #64).
      // A footer that scrolls clips what reaches past its box, so a control deeper in it keeps its focus ring (2
      // px, 2 out) inside its own padding: a Composer has 10 px around its buttons. Under a tab bar, the bottom
      // margin lifts the footer by the inset.
      mb: 'var(--scroll-frame-inset)',
      // A direct child sits at the footer's edge, so its ring would be cut: it draws the ring inside its own box
      // instead (Codex review of #134). The ring colour, border.focus, is also the primary button's fill, so a
      // 2 px line in bg.canvas inside the ring keeps it visible on a primary button as on any other.
      '& > :focus-visible': {
        outlineOffset: 'calc(token(borderWidths.strong) * -1)',
        boxShadow: 'inset 0 0 0 token(spacing.4) token(colors.bg.canvas)',
      },
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
    // Whether the footer gives up height when the frame is too short for it. true (the default): it shrinks to the
    // room the header leaves and scrolls inside, so it never reaches past the frame. false: it keeps its own height
    // and the body takes all the loss; for a footer that caps its own height, such as Composer layout="inline" in
    // the Workbench D5 side chat (the-bridge #58), which the shrink cut to 8 px in a pane resized short.
    footerShrink: {
      true: {},
      false: { footer: { flexShrink: '0' } },
    },
  },
  defaultVariants: { gap: '0', footerShrink: true },
})
