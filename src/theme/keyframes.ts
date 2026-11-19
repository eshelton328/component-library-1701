// The keyframes the recipes animate with, added to the Panda theme by
// ../../panda.config.ts. A recipe names one in `animationName` and takes its
// duration and curve from the motion tokens (`durations`, `easings`).
export const keyframes = {
  // A bottom sheet slides up from below the window (screen review R13).
  sheetIn: { from: { translate: '0 100%' }, to: { translate: '0 0' } },
  // It slides back down, from where a swipe let it go: the drag offset the
  // component leaves set, or 0 when Escape, the scrim or a button closes it.
  sheetOut: { from: { translate: '0 var(--bottom-sheet-drag, 0px)' }, to: { translate: '0 100%' } },
  // The scrim, and the sheet itself under prefers-reduced-motion.
  fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
  fadeOut: { from: { opacity: '1' }, to: { opacity: '0' } },
}
