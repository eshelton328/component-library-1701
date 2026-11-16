// Shared by the layout stories: the computed style of a story's element.
export const styleOf = (canvasElement: HTMLElement, testId: string) => {
  const el = canvasElement.querySelector(`[data-testid="${testId}"]`)
  if (!(el instanceof HTMLElement)) throw new Error(`no element ${testId}`)
  return getComputedStyle(el)
}

// Every variant value, in lists. Panda cannot read a value from a list, so
// a story that renders these gets their CSS only from staticCss.
export const gaps = ['0', '2', '4', '6', '8', '10', '12', '16', '20', '24', '32', '40'] as const
export const columns = ['1', '2', '3', '4', '5', '6'] as const
export const aligns = [
  ['start', 'start'],
  ['center', 'center'],
  ['end', 'end'],
  ['stretch', 'stretch'],
] as const
export const justifies = [
  ['start', 'start'],
  ['center', 'center'],
  ['end', 'end'],
  ['between', 'space-between'],
] as const
