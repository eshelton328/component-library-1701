import { defineStyles } from '@pandacss/dev'

// The styles of every box in the library that scrolls its own content
// (overflow auto on either axis). Erik's decision for the installed app
// (2026-11-18): the document never scrolls, only these boxes do, and they
// draw no scroll bar and never bounce the page, on every platform, desktop
// too.
// - scrollbarWidth none, and ::-webkit-scrollbar for Safari before 18.2:
//   no scroll bar and no gutter; the content keeps the box's whole width.
//   All three styles set it.
// - overscrollBehavior contain: a scroll that reaches the box's end stops
//   there and does not chain to the box or page behind it, so the page does
//   not bounce, pull-to-refresh does not start and a sideways swipe does not
//   go back in history. Chrome 144 and later apply it to a box that does not
//   overflow too, so a short box that contains an axis stops a wheel or a
//   drag on that axis from moving the box behind it. So only a box that
//   bounds a pane contains both axes:
//   - `scrollArea`: the AppShell detail, the ScrollFrame body and footer,
//     the Backdrop, the nav rail, a Pane body and the content of a menu,
//     popover, dialog or sheet.
//   - `scrollAreaX`: a box that scrolls sideways inside a page (the tab and
//     chip rows, CodeLines, a chart or map scroller). It contains only the x
//     axis, so a vertical wheel or drag on it still scrolls the page.
//   - `scrollAreaNested`: a box that scrolls vertically inside a page (a
//     Panel body, EmptyPane, a text area). It contains no axis, so a short
//     one does not stop the scroll of the pane around it.
// Touch, wheel, trackpad and keyboard still scroll the box, and a box that
// takes the focus keeps its focus ring. They set no overflow, size or
// layout: each recipe keeps its own overflow and spreads one beside it
// (`...scrollArea`). They are not recipes, so index.ts does not list them;
// components never import them.
export const scrollArea = defineStyles({
  overscrollBehavior: 'contain',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
})

export const scrollAreaX = defineStyles({
  overscrollBehaviorX: 'contain',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
})

export const scrollAreaNested = defineStyles({
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
})
