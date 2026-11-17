import { defineSlotRecipe } from '@pandacss/dev'

// The bordered box that holds a list or side content, with an optional
// header: a title, a count or other meta, and actions at the end.
// - `list`: the Inbox list pane (D1 346:146, header 346:147).
// - `sidebar`: the Workbench sidebar (D2 105:611, header 105:612).
// - `section`: a Toolkit panel with an eyebrow title (D19 482:542, header 482:543).
// A `list` or `sidebar` panel fills the height of its parent, as a pane
// does; a `section` panel is as tall as its content.
// Every variant is glass (d-044): `surface.pane` with the `glass` blur.
// `tone="needsYou"` marks a panel that waits for the user, such as the
// "waiting for this answer" box of Inbox D2 (346:772): Figma draws a 1 px
// border in #ffb86b at 0.35 and a 0.08 tint. They take the status tokens
// status.needsYou.border (0.5) and status.needsYou.bg (0.14), laid over the
// pane fill; fg.default and fg.muted pass 4.5:1 on it in both modes.
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
    body: { display: 'flex', flexDirection: 'column', flex: '1', minH: '0', overflowY: 'auto' },
  },
  variants: {
    tone: {
      default: {},
      needsYou: {
        root: {
          borderColor: 'status.needsYou.border',
          backgroundImage: 'linear-gradient(token(colors.status.needsYou.bg), token(colors.status.needsYou.bg))',
        },
      },
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
      section: {
        // fit-content keeps a Grid or a row from stretching it to its neighbours' height.
        root: { h: 'fit-content', py: '12', px: '16', gap: '8', borderRadius: 'xl' },
        title: { textStyle: 'eyebrow', textTransform: 'uppercase', color: 'fg.muted' },
        meta: { textStyle: 'small' },
        body: { gap: '8' },
      },
    },
  },
  defaultVariants: { variant: 'section', tone: 'default' },
})
