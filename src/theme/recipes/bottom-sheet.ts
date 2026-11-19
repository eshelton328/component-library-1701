import { dialogAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'
import { scrollArea } from './scroll-area'

// The phone bottom sheets: Inbox M6 snooze (346:10207), Artifacts M4 sort
// (407:814) and Workbench M9 chat actions (146:273). A full-width box on a
// scrim, flush with the bottom of the window, with a grabber, an optional
// title row and content. The radius merges 18 and 24 into `2xl`.
//
// Header actions: Inbox T8 (346:7175) and M7 (346:10487), Artifacts M6
// (407:1097) and T3 (407:1620) put Done or Clear at the end of the title row,
// 8 after a spacer, centred on the title. Artifacts M7 (408:706) puts Cancel
// at the start and Add at the end, with the title centred between them by
// two equal spacers. The caller passes the buttons; the row keeps its gap 8.
//
// No scrim: the tablet side chat sheet (Workspaces T2 105:1914) draws no scrim, so the chat above it keeps its
// colour. `BottomSheet scrim={false}` leaves the `backdrop` slot out; the positioner has no fill of its own.
export const bottomSheet = defineSlotRecipe({
  className: 'bottom-sheet',
  jsx: ['BottomSheet'],
  staticCss: ['*'],
  slots: [...dialogAnatomy.keys(), 'grabber', 'header', 'headerLeading', 'headerActions'],
  base: {
    // Open and close motion (screen review R13): the scrim fades in while the sheet slides up, and the close
    // reverses both. The close keeps its last frame, so nothing shows again before Ark unmounts the sheet.
    backdrop: {
      position: 'fixed',
      inset: '0',
      bg: 'overlay.scrim',
      _open: { animationName: 'fadeIn', animationDuration: 'sheetOpen', animationTimingFunction: 'sheet' },
      _closed: { animationName: 'fadeOut', animationDuration: 'sheetClose', animationTimingFunction: 'sheet', animationFillMode: 'forwards' },
    },
    // The top padding keeps a strip of scrim above a tall sheet, so a click there can close it.
    positioner: { position: 'fixed', inset: '0', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pt: '40' },
    content: {
      display: 'flex',
      flexDirection: 'column',
      w: '100%',
      maxH: '100%',
      overflowY: 'auto',
      ...scrollArea,
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
      // Swipe to close (screen review R13): the content's own scroll stops at its ends and does not
      // scroll the page behind the scrim, and a dragged sheet follows the finger by the offset the
      // component sets. No translate at rest, so the box makes no containing block.
      overscrollBehavior: 'contain',
      '&[data-dragging]': { translate: '0 var(--bottom-sheet-drag, 0px)' },
      // The sheet slides up as it opens and down as it closes; with prefers-reduced-motion it only fades.
      _open: {
        animationName: 'sheetIn',
        animationDuration: 'sheetOpen',
        animationTimingFunction: 'sheet',
        _motionReduce: { animationName: 'fadeIn' },
      },
      _closed: {
        animationName: 'sheetOut',
        animationDuration: 'sheetClose',
        animationTimingFunction: 'sheet',
        animationFillMode: 'forwards',
        _motionReduce: { animationName: 'fadeOut' },
      },
    },
    // The grabber (Inbox M6 346:10209, Artifacts M4 407:816, More drawer 415:317): 36x5 (d-074 merges
    // Workbench's 40x5 into it), centred at the top. Figma's radius 3 on a 5 px bar draws a full pill, as
    // `radius.full` does. Figma fills it #24314f, or #8a97b8 at 0.5 or 0.6; d-074 sets `border.default`.
    // The grabber and the title row take a touch drag themselves (`touchAction: 'none'`), so it moves the sheet.
    grabber: { flexShrink: '0', touchAction: 'none', alignSelf: 'center', w: 'grabber.width', h: 'grabber.height', borderRadius: 'full', bg: 'border.default' },
    header: { display: 'flex', alignItems: 'center', gap: '8', px: '4', touchAction: 'none' },
    title: { flex: '1', color: 'fg.default', '[data-leading] > &': { textAlign: 'center' } },
    headerLeading: { display: 'inline-flex', alignItems: 'center', gap: '8', flexShrink: '0' },
    headerActions: { display: 'inline-flex', alignItems: 'center', gap: '8', flexShrink: '0' },
    // The close button of the tablet side chat (105:1925): a 16 px icon with no box (Figma draws 18).
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
  },
  variants: {
    size: {
      // A sheet: Inbox M6, Artifacts M4, Workbench T2.
      md: { content: { gap: '2', pt: '8' }, header: { pt: '10', pb: '8' }, title: { textStyle: 'subtitle' } },
      // The Workbench M9 chat actions sheet (146:273), whose title is SemiBold 15 (146:276): `paneTitle`.
      sm: { content: { gap: '2', pt: '8' }, header: { pt: '10', pb: '8' }, title: { textStyle: 'paneTitle' } },
      // The More drawer: Artifacts M8 (415:315) and Toolkit M4 (424:6940). Figma pt 9 takes `10` (d-072).
      // The grabber row has 6 below the grabber (415:316).
      lg: { content: { gap: '4', pt: '10' }, grabber: { mb: '6' }, header: { pt: '0', pb: '6' }, title: { textStyle: 'title' } },
    },
  },
  defaultVariants: { size: 'md' },
})
