import { defineSlotRecipe } from '@pandacss/dev'
import { scrollAreaNested } from './scroll-area'

// The bordered box that holds a list or side content, with an optional
// header: a title, a count or other meta, and actions at the end.
// - `list`: the Inbox list pane (D1 346:146, header 346:147).
// - `sidebar`: the Workbench sidebar (D2 105:611, header 105:612).
// - `section`: a Toolkit panel with an eyebrow title (D19 482:542, header 482:543).
// A `list` or `sidebar` panel fills the height of its parent, as a pane
// does; a `section` panel is as tall as its content.
// Every variant is glass (d-044): `surface.pane` with the `glass` blur.
// - `notice`: a card of one row, such as the Inbox waiting card (D2 346:772,
//   T3, M5 346:9897): 55 high in Figma, its text 10 under the 1 px border and
//   its icon 12 in from the side. The `section` padding (12/16) made it 64.
// `tone="needsYou"` marks a panel that waits for the user, such as the
// "waiting for this answer" box of Inbox D2 (346:772): Figma draws a 1 px
// border in #ffb86b at 0.35 and a 0.08 tint. The tint is
// status.needsYou.faint (0.08, as Figma; d-100), laid over the pane fill;
// fg.default and fg.muted pass 4.5:1 on it in both modes. The border stays
// status.needsYou.border (0.5): at Figma's 0.35 it is 2.0:1 against the
// tint, and 0.5 is the nearest value that keeps 3:1 in dark mode.
// `tone="accent"` is the Inbox run card (D6 346:2688, also D9-D11): Figma
// draws a 1 px border in #5ee1ff at 0.45 on #14263f, the look of a selected
// or running row: border.selected (0.5 dark, 0.75 light) on surface.selected, where
// fg.default, fg.muted and fg.accent pass 4.5:1 in both modes.
// `tone="done"` is D7's result card (346:3067), a pane with a green border:
// status.done.border. `tone="danger"` is the card of a removed task (D21
// 403:4261), a pane with a red border: status.danger.border. Figma's stroke
// alphas are not recorded, so both take their status border token, and the
// fill stays the pane.
// A `section` or `notice` panel is as tall as its content, so its body has nothing to scroll: its overflow is
// visible (R72). A scrolling body clips on both axes, and it cut the 44 px touch area of a `Button touch` at
// its edges, so a tap just past the dialog card's Send button missed it. A long section grows its page, which
// scrolls; a `list` or `sidebar` panel keeps the height of its parent and its body scrolls. As its body no longer
// scrolls, a section or notice panel does not shrink (flexShrink 0): in a flex column with a fixed height, a
// shrunk panel would draw its content over the items under it (Codex review of #361).
export const panel = defineSlotRecipe({
  className: 'panel',
  jsx: ['Panel'],
  staticCss: ['*'],
  slots: ['root', 'header', 'title', 'meta', 'actions', 'body'],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      minW: '0',
      minH: '0',
      bg: 'surface.pane',
      color: 'fg.default',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      backdropFilter: 'blur(token(blurs.glass))',
    },
    header: { display: 'flex', alignItems: 'center', gap: '8', minW: '0' },
    // TruncatedText inside cuts a long title and shows it whole in a tooltip.
    title: { minW: '0' },
    meta: { flexShrink: '0', color: 'fg.muted' },
    actions: { display: 'flex', alignItems: 'center', gap: '8', flexShrink: '0', ml: 'auto' },
    body: { display: 'flex', flexDirection: 'column', flex: '1', minH: '0', overflowY: 'auto', ...scrollAreaNested },
  },
  variants: {
    tone: {
      default: {},
      needsYou: {
        root: {
          borderColor: 'status.needsYou.border',
          backgroundImage: 'linear-gradient(token(colors.status.needsYou.faint), token(colors.status.needsYou.faint))',
        },
      },
      accent: { root: { bg: 'surface.selected', borderColor: 'border.selected' } },
      done: { root: { borderColor: 'status.done.border' } },
      danger: { root: { borderColor: 'status.danger.border' } },
    },
    variant: {
      list: {
        root: { h: '100%', py: '16', px: '12', gap: '2' },
        header: { px: '4', pb: '8' },
        title: { textStyle: 'paneTitle' },
        // The Inbox count (346:149) is #4a5675.
        meta: { textStyle: 'mono', color: 'fg.subtle' },
        body: { gap: '2' },
      },
      sidebar: {
        root: { h: '100%', py: '12', px: '10', gap: '4' },
        header: { px: '4', pb: '8' },
        title: { textStyle: 'paneTitle' },
        meta: { textStyle: 'mono' },
        body: { gap: '4' },
      },
      notice: {
        root: { h: 'fit-content', flexShrink: '0', py: '10', px: '12', gap: '8', borderRadius: 'xl' },
        title: { textStyle: 'eyebrow', textTransform: 'uppercase', color: 'fg.muted' },
        meta: { textStyle: 'small' },
        body: { gap: '8', overflowY: 'visible' },
      },
      section: {
        // fit-content keeps a Grid or a row from stretching it to its neighbours' height.
        root: { h: 'fit-content', flexShrink: '0', py: '12', px: '16', gap: '8', borderRadius: 'xl' },
        title: { textStyle: 'eyebrow', textTransform: 'uppercase', color: 'fg.muted' },
        meta: { textStyle: 'small' },
        body: { gap: '8', overflowY: 'visible' },
      },
    },
  },
  // The list meta is fg.subtle, which falls below 4.5:1 on the needs-you
  // tint in dark mode, so a needs-you list takes fg.muted. fg.subtle is not
  // for surface.selected, so an accent list takes fg.muted too.
  compoundVariants: [
    { tone: 'needsYou', variant: 'list', css: { meta: { color: 'fg.muted' } } },
    { tone: 'accent', variant: 'list', css: { meta: { color: 'fg.muted' } } },
  ],
  defaultVariants: { variant: 'section', tone: 'default' },
})
