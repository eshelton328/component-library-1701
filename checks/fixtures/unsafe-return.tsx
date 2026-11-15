// expect: eslint @typescript-eslint/no-unsafe-return
export const read = (text: string): string => JSON.parse(text)
