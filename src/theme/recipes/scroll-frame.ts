import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'
import { scrollArea } from './scroll-area'

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
// M20, M22): the detail sets --app-shell-tab-bar-inset to the bar's
// height (tabBarHeight: sizes.shell.tabBar, more on a device whose
// home-indicator inset is more than 34) and --app-shell-tab-bar-spacer to block for its
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
// On the keyboard (AppShell's --app-shell-keyboard, how far an on-screen
// keyboard covers the detail's bottom, 0 when unset): the frame reaches
// through the detail's end padding (--app-shell-detail-end) to the
// detail's bottom, so its layout does not change. --scroll-frame-dock is
// the part of the keyboard's reach above the space under the footer (the
// inset): the footer moves up that far with translateY, onto the
// keyboard's top, and the body gets a clear bottom border as tall, so its
// view ends at the raised footer's top (with no footer, its end spacer
// ends above the keyboard). The border lies under the footer and the
// keyboard, so no band of blank page shows.
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
      '--scroll-frame-dock': 'max(0px, var(--app-shell-keyboard, 0px) - var(--scroll-frame-inset))',
      mb: 'calc(var(--app-shell-detail-end, 0px) * -1)',
    },
    header: { display: 'flex', flexDirection: 'column', flexShrink: '0', minW: '0' },
    body: {
      // The containing block of an absolute child (Message's screen-reader name), so it scrolls with the body and never
      // makes the Backdrop scroll, which iOS would scroll at a field's focus (screen review R22).
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      flex: '1',
      minW: '0',
      minH: '0',
      overflowY: 'auto',
      ...scrollArea,
      // A flex column shrinks its children to fit; a child that clips (overflow hidden, such as a Card) would lose its
      // content instead of making the body scroll. The children keep their height.
      '& > *': { flexShrink: '0' },
      outline: 'none',
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '-2' },
      // On the keyboard, the view ends at the raised footer's top: the border lies under the footer and the keyboard.
      borderBottomWidth: 'var(--scroll-frame-dock)',
      borderBottomStyle: 'solid',
      borderBottomColor: 'transparent',
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
      ...scrollArea,
      // The footer's box is its content's box and stays inside the frame: no padding and no negative margin, so
      // it never reaches past the frame (a 4 px margin made the-bridge's phone detail overflow, Workspaces #64).
      // A footer that scrolls clips what reaches past its box, so a control deeper in it keeps its focus ring (2
      // px, 2 out) inside its own padding: a Composer has 10 px around its buttons. Under a tab bar, the bottom
      // margin lifts the footer by the inset.
      mb: 'var(--scroll-frame-inset)',
      // On the keyboard, the footer rides up onto its top; its place in the layout stays.
      transform: 'translateY(calc(var(--scroll-frame-dock) * -1))',
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
    // Space under the footer's content, inside the footer, as Figma draws a reply box above the screen's foot (the-bridge
    // Inbox M8 346:10886, T5 346:6416). On the keyboard it shrinks by the dock's rise, down to 0, so the content sits
    // on the keyboard's top as a footer with no foot does (screen review R21). A page's own bottom padding stays under
    // the docked footer, so it would leave that gap above the keyboard.
    foot: {
      '0': {},
      '4': { footer: { pb: 'max(0px, calc(token(spacing.4) - var(--scroll-frame-dock)))' } },
      '6': { footer: { pb: 'max(0px, calc(token(spacing.6) - var(--scroll-frame-dock)))' } },
      '8': { footer: { pb: 'max(0px, calc(token(spacing.8) - var(--scroll-frame-dock)))' } },
      '12': { footer: { pb: 'max(0px, calc(token(spacing.12) - var(--scroll-frame-dock)))' } },
      '16': { footer: { pb: 'max(0px, calc(token(spacing.16) - var(--scroll-frame-dock)))' } },
    },
  },
  defaultVariants: { gap: '0', footerShrink: true, foot: '0' },
})
