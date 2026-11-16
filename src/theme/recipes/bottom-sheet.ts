import { dialogAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'

// The phone bottom sheets: Inbox M6 snooze (346:10207), Artifacts M4 sort
// (407:814) and Workbench M9 chat actions (146:273). A full-width box on a
// scrim, flush with the bottom of the window, with an optional title row
// and content. The grabber waits for a size token: Figma draws it 36x5 or
// 40x5, and d-072 covers only spacing. The radius merges 18 and 24 into `2xl`.
export const bottomSheet = defineSlotRecipe({
  className: 'bottom-sheet',
  jsx: ['BottomSheet'],
  staticCss: ['*'],
  slots: [...dialogAnatomy.keys(), 'header'],
  base: {
    backdrop: { position: 'fixed', inset: '0', bg: 'overlay.scrim' },
    // The top padding keeps a strip of scrim above a tall sheet, so a click there can close it.
    positioner: { position: 'fixed', inset: '0', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pt: '40' },
    content: {
      display: 'flex',
      flexDirection: 'column',
      w: '100%',
      maxH: '100%',
      overflowY: 'auto',
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
    header: { display: 'flex', alignItems: 'center', gap: '8', px: '4' },
    title: { flex: '1', color: 'fg.default' },
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
  variants: {
    size: {
      // A sheet: Inbox M6, Artifacts M4, Workbench M9.
      md: { content: { gap: '2', pt: '8' }, header: { pt: '10', pb: '8' }, title: { textStyle: 'subtitle' } },
      // The More drawer: Artifacts M8 (415:315) and Toolkit M4 (424:6940). Figma pt 9 takes `10` (d-072).
      lg: { content: { gap: '4', pt: '10' }, header: { pt: '0', pb: '6' }, title: { textStyle: 'title' } },
    },
  },
  defaultVariants: { size: 'md' },
})
