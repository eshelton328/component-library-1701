import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'

// The error and not-found states of the-bridge's error boundaries (d-086).
// Figma draws no error state, so this one is built from the tokens and the
// parts it sits beside:
// - `page`: a crash or not-found screen, centred in the space it gets. A
//   40 px tile (radius.lg, as a card) with a 24 px icon on the tone's tint,
//   as KindTile draws a kind; the title in `title` (the desktop page title,
//   as PageHeader), the description in `body` fg.muted, the actions 8 apart
//   as in a proposal block. 16 between the groups, 8 between title and
//   description. The content is at most sizes.shell.dialogLg wide, so the
//   text keeps a dialog's measure.
// - `pane`: the same, compact, for a pane whose content failed: the
//   kindTile.lg tile (36) with a 20 px icon, the title in `paneTitle` (as a
//   Panel), 12 between groups, 4 between title and description, at most
//   sizes.shell.dialog wide.
// - `inline`: one row for a block that failed: a 16 px icon in the tone's
//   colour, the title in `label`, the description in `small`, the actions
//   at the end. A 1 px border in the tone's border colour, radius.lg as a
//   row, padding 8 by 12, no fill, so its text sits on the pane it is in.
// `tone` picks the status colours: `danger` (status.danger, an error) or
// `neutral` (status.idle, not found). Title and description wrap, never cut.
// `details` is a disclosure: a quiet toggle and the message or stack in a
// surface.well box in `mono`, as ProposalCommand draws a command.
export const errorState = defineSlotRecipe({
  className: 'error-state',
  jsx: ['ErrorState'],
  staticCss: ['*'],
  slots: ['root', 'content', 'tile', 'text', 'title', 'description', 'actions', 'details', 'toggle', 'stack'],
  base: {
    root: { display: 'flex', flexDirection: 'column', minW: '0', color: 'fg.default' },
    content: { display: 'flex', minW: '0' },
    tile: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' },
    text: { display: 'flex', flexDirection: 'column', minW: '0' },
    // A page title gets focus from the app (tabIndex -1); it draws no ring for that.
    title: { m: '0', color: 'fg.default', overflowWrap: 'anywhere', outline: 'none' },
    description: { m: '0', color: 'fg.muted', overflowWrap: 'anywhere' },
    actions: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8', _empty: { display: 'none' } },
    details: { display: 'flex', flexDirection: 'column', gap: '8', minW: '0' },
    toggle: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4',
      h: 'control.sm',
      px: '4',
      textStyle: 'small',
      color: 'fg.muted',
      bg: 'transparent',
      borderWidth: '0',
      borderRadius: 'md',
      cursor: 'pointer',
      outline: 'none',
      _hover: { color: 'fg.default' },
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
    },
    stack: {
      m: '0',
      p: '8',
      bg: 'surface.well',
      borderRadius: 'sm',
      color: 'fg.default',
      textStyle: 'mono',
      textAlign: 'start',
      whiteSpace: 'pre-wrap',
      overflowWrap: 'anywhere',
      '& code': { font: 'inherit' },
    },
  },
  variants: {
    size: {
      page: {
        root: { flex: '1', w: '100%', minH: '100%', alignItems: 'center', justifyContent: 'safe center', gap: '16', p: '24' },
        content: { flexDirection: 'column', alignItems: 'center', gap: '16', w: '100%', maxW: 'shell.dialogLg', textAlign: 'center' },
        tile: { w: '40', h: '40', borderRadius: 'lg', '& svg': { w: 'icon.24!', h: 'icon.24!' } },
        text: { gap: '8', alignItems: 'center' },
        title: { textStyle: 'title' },
        description: { textStyle: 'body' },
        actions: { justifyContent: 'center' },
        details: { w: '100%', maxW: 'shell.dialogLg', alignItems: 'center' },
        stack: { alignSelf: 'stretch' },
      },
      pane: {
        root: { flex: '1', w: '100%', minH: '100%', alignItems: 'center', justifyContent: 'safe center', gap: '12', p: '16' },
        content: { flexDirection: 'column', alignItems: 'center', gap: '12', w: '100%', maxW: 'shell.dialog', textAlign: 'center' },
        tile: { w: 'kindTile.lg', h: 'kindTile.lg', borderRadius: 'md', '& svg': { w: 'icon.20!', h: 'icon.20!' } },
        text: { gap: '4', alignItems: 'center' },
        title: { textStyle: 'paneTitle' },
        description: { textStyle: 'body' },
        actions: { justifyContent: 'center' },
        details: { w: '100%', maxW: 'shell.dialog', alignItems: 'center' },
        stack: { alignSelf: 'stretch' },
      },
      inline: {
        root: { gap: '8', py: '8', px: '12', borderWidth: 'default', borderStyle: 'solid', borderRadius: 'lg' },
        content: { flexDirection: 'row', alignItems: 'center', gap: '8' },
        tile: { '& svg': { w: 'icon.16!', h: 'icon.16!' } },
        text: { flex: '1', gap: '2' },
        title: { textStyle: 'label' },
        description: { textStyle: 'small' },
        actions: { flexShrink: '0', ms: 'auto' },
        details: { alignItems: 'flex-start' },
        stack: { alignSelf: 'stretch' },
      },
    },
    tone: {
      danger: { root: { borderColor: 'status.danger.border' }, tile: { bg: 'status.danger.bg', color: 'status.danger.fg' } },
      neutral: { root: { borderColor: 'status.idle.border' }, tile: { bg: 'status.idle.bg', color: 'status.idle.fg' } },
    },
  },
  // An inline row draws its icon with no tile behind it.
  compoundVariants: [{ size: 'inline', css: { tile: { bg: 'transparent' } } }],
  defaultVariants: { size: 'page', tone: 'danger' },
})
