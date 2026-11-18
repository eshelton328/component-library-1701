// A helper for the stories of the bottom sheet and the parts built on it.

/**
 * Waits until a bottom sheet and its scrim end their open or close motion
 * (`durations.sheetOpen`, `durations.sheetClose`), so a play function measures
 * where they rest, not a frame of the slide.
 */
export async function motionDone(sheet: Element) {
  const scrim = sheet.ownerDocument.querySelector('.bottom-sheet__backdrop')
  const parts = scrim === null ? [sheet] : [sheet, scrim]
  // A cancelled animation rejects `finished`; it has ended all the same.
  await Promise.all(parts.flatMap((el) => el.getAnimations()).map((a) => a.finished.catch(() => undefined)))
}
