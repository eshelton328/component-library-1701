// expect: eslint @typescript-eslint/no-unsafe-return
// scope: scripts too
export const read = (text: string): string => JSON.parse(text)
