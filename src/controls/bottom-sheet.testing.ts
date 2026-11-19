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

/**
 * Moves the test runner's real pointer onto `el`, a part of the sheet with no
 * hover style. The pointer keeps its place from the story before, and Chromium
 * can hover what opens under it a frame later, so a play function calls this
 * before it reads an idle fill. Only Vitest Browser Mode has that pointer;
 * in the Storybook UI the pointer is the viewer's, and `vitest/browser`
 * throws there, so this does nothing.
 */
export async function restPointerOn(el: Element) {
  if (!('__vitest_browser__' in globalThis)) return
  const { userEvent } = await import('vitest/browser')
  await userEvent.hover(el)
}
