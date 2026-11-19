// expect: eslint no-restricted-syntax
// scope: scripts too
// A comment keeps the core no-empty rule quiet, so only the empty-catch
// selector can catch this.
export function parse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    // ignore
  }
  return undefined
}
