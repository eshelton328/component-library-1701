// expect: eslint @typescript-eslint/no-explicit-any
// scope: scripts too
export const read = (value: any): string => String(value)
