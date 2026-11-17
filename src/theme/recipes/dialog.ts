import { dialogAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'

// The dialogs of Inbox (D20 confirm, 403:3914) and Workbench (D3 New chat,
// 105:1379): a box on a scrim, with a title, a description, content and a
// row of buttons at the end. `md` is the confirm dialog and `lg` the form.
export const dialog = defineSlotRecipe({
  className: 'dialog',
  jsx: ['Dialog'],
  staticCss: ['*'],
  slots: [...dialogAnatomy.keys(), 'header', 'footer'],
  base: {
    backdrop: { position: 'fixed', inset: '0', bg: 'overlay.scrim' },
    positioner: { position: 'fixed', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', p: '16' },
    content: {
      display: 'flex',
      flexDirection: 'column',
      maxW: '100%',
      maxH: '100%',
      overflowY: 'auto',
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
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
    },
    footer: { display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '8' },
  },
  variants: {
    size: {
      md: { content: { w: 'shell.dialog', gap: '12' }, title: { textStyle: 'subtitle' } },
      lg: { content: { w: 'shell.dialogLg', gap: '16' }, title: { textStyle: 'title' } },
    },
  },
  defaultVariants: { size: 'md' },
})
