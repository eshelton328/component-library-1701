import { defineStyles } from '@pandacss/dev'

// The style of every box in the library that scrolls its own content
// (overflow auto on either axis): the AppShell detail, the ScrollFrame body
// and footer, a Pane or Panel body, a menu, popover, dialog or sheet, the
// tab and chip rows, CodeLines, a chart or map scroller and a text area.
// Erik's decision for the installed app (2026-11-18): the document never
// scrolls, only these boxes do, and they draw no scroll bar and never
// bounce the page, on every platform, desktop too.
// - overscrollBehavior contain: a scroll that reaches the box's end stops
//   there. It does not chain to the box or page behind it, so the page
//   does not bounce, pull-to-refresh does not start and a sideways swipe
//   at a row's end does not go back in history.
// - scrollbarWidth none, and ::-webkit-scrollbar for Safari before 18.2:
//   no scroll bar and no gutter; the content keeps the box's whole width.
// Touch, wheel, trackpad and keyboard still scroll the box, and a box that
// takes the focus keeps its focus ring. It sets no overflow, size or
// layout: each recipe keeps its own overflow and spreads this beside it
// (`...scrollArea`). Not a recipe of its own, so it is not listed in
// index.ts; components never import it.
export const scrollArea = defineStyles({
  overscrollBehavior: 'contain',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
})
