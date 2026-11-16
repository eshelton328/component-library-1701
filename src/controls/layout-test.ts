// Shared by the layout stories: the computed style of a story's element.
export const styleOf = (canvasElement: HTMLElement, testId: string) => {
  const el = canvasElement.querySelector(`[data-testid="${testId}"]`)
  if (!(el instanceof HTMLElement)) throw new Error(`no element ${testId}`)
  return getComputedStyle(el)
}
