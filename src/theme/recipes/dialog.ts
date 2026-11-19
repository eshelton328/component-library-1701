import { dialogAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'
import { scrollArea } from './scroll-area'

// The dialogs of Inbox (D20 confirm, 403:3914) and Workbench (D3 New chat,
// 105:1379): a box on a scrim, with a title, a description, content and a
// row of buttons at the end. `md` is the confirm dialog and `lg` the form.
// `wide` is the Inbox suggested prompt (D8 346:3543): 720 wide, padding
// 20/16/34 (34 takes 32, d-072), gap 4, the title SemiBold 17 (`subtitle`)
// and Done at the end of the title row (346:3547) in a 10/0 padded row,
// centred on the title (346:3544).
// `meta` is the line under the confirm dialog's title (D20 403:3917): the
// title and it share one frame (403:3915), 4 apart, so they sit in a
// `heading` column with gap 4 in place of the box's gap. Figma sets it in
// Mono 11 in #8a97b8: `monoSm` (11/16, d-090) and `fg.muted`.
export const dialog = defineSlotRecipe({
  className: 'dialog',
  jsx: ['Dialog'],
  staticCss: ['*'],
  slots: [...dialogAnatomy.keys(), 'header', 'headerAction', 'heading', 'meta', 'footer'],
  base: {
    backdrop: { position: 'fixed', inset: '0', bg: 'overlay.scrim' },
    positioner: { position: 'fixed', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', p: '16' },
    content: {
      display: 'flex',
      flexDirection: 'column',
      maxW: '100%',
      maxH: '100%',
      overflowY: 'auto',
      ...scrollArea,
      p: '20',
      bg: 'surface.overlay',
      color: 'fg.default',
      borderRadius: '2xl',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      boxShadow: 'dialog',
      backdropFilter: 'blur(token(blurs.glass))',
      outline: 'none',
    },
    header: { display: 'flex', alignItems: 'flex-start', gap: '8' },
    title: { flex: '1', color: 'fg.default' },
    heading: { display: 'flex', flexDirection: 'column', gap: '4', flex: '1', minW: '0' },
    meta: { textStyle: 'monoSm', color: 'fg.muted', m: '0' },
    description: { textStyle: 'body', color: 'fg.muted' },
    // The close button of the New chat dialog: a 16 px icon with no box (Figma draws 18).
    closeTrigger: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: '0',
      w: 'control.sm',
      h: 'control.sm',
      color: 'fg.muted',
      bg: 'transparent',
      borderRadius: 'md',
      cursor: 'pointer',
      outline: 'none',
      '& svg': { w: 'icon.16', h: 'icon.16' },
      _hover: { color: 'fg.default' },
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
    },
    headerAction: { display: 'flex', alignItems: 'center', flexShrink: '0', ms: 'auto' },
    footer: { display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '8' },
  },
  variants: {
    size: {
      md: { content: { w: 'shell.dialog', gap: '12' }, title: { textStyle: 'subtitle' } },
      lg: { content: { w: 'shell.dialogLg', gap: '16' }, title: { textStyle: 'title' } },
      wide: {
        content: { w: 'shell.dialogWide', gap: '4', pt: '20', px: '16', pb: '32' },
        header: { alignItems: 'center', py: '10' },
        title: { textStyle: 'subtitle' },
      },
    },
  },
  defaultVariants: { size: 'md' },
})
