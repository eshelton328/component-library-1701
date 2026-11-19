// A helper for stories that read a part's idle style while the test runner's real pointer may be over it.

/**
 * Moves the test runner's real pointer onto the top-left corner of `el`, a
 * place with no hover style, such as a sheet's title row or the story's
 * canvas padding. The pointer keeps its place from the story before, and
 * Chromium can hover what renders under it a frame later, so a play function
 * calls this before it reads an idle fill. Only Vitest Browser Mode has that
 * pointer; in the Storybook UI the pointer is the viewer's, and
 * `vitest/browser` throws there, so this does nothing.
 */
export async function restPointerOn(el: Element) {
  if (!('__vitest_browser__' in globalThis)) return
  const { userEvent } = await import('vitest/browser')
  await userEvent.hover(el, { position: { x: 0, y: 0 } })
}
