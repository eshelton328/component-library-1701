// expect: eslint @typescript-eslint/no-explicit-any
export const read = (value: any): string => String(value)
