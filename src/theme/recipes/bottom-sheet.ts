import { dialogAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'

// The phone bottom sheets: Inbox M6 snooze (346:10207), Artifacts M4 sort
// (407:814) and Workbench M9 chat actions (146:273). A full-width box on a
// scrim, flush with the bottom of the window, with a grabber, an optional
// title row and content. The radius merges 18 and 24 into `2xl`.
export const bottomSheet = defineSlotRecipe({
  className: 'bottom-sheet',
  jsx: ['BottomSheet'],
  staticCss: ['*'],
  slots: [...dialogAnatomy.keys(), 'grabber', 'header'],
  base: {
    backdrop: { position: 'fixed', inset: '0', bg: 'overlay.scrim' },
    // The top padding keeps a strip of scrim above a tall sheet, so a click there can close it.
    positioner: { position: 'fixed', inset: '0', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pt: '40' },
    content: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2',
      w: '100%',
      maxH: '100%',
      overflowY: 'auto',
      pt: '8',
      px: '12',
      pb: 'token(sizes.shell.safeAreaBottom)',
      bg: 'surface.overlay',
      color: 'fg.default',
      borderTopLeftRadius: '2xl',
      borderTopRightRadius: '2xl',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      boxShadow: 'overlay',
      backdropFilter: 'blur(token(blurs.glass))',
      outline: 'none',
    },
    grabber: { flexShrink: '0', alignSelf: 'center', w: '40', h: '6', borderRadius: 'hair', bg: 'border.default' },
    header: { display: 'flex', alignItems: 'center', gap: '8', pt: '10', pb: '8', px: '4' },
    title: { flex: '1', textStyle: 'subtitle', color: 'fg.default' },
    // The close button of the tablet side chat (105:1925): an 18 px icon with no box.
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
      '& svg': { w: 'icon.18', h: 'icon.18' },
      _hover: { color: 'fg.default' },
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
    },
  },
})
