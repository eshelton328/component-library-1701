// expect: eslint @typescript-eslint/no-unsafe-member-access
export const total = (text: string): unknown => JSON.parse(text).total
