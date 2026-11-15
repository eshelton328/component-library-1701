// expect: eslint @typescript-eslint/no-unsafe-member-access
// scope: scripts too
export const total = (text: string): unknown => JSON.parse(text).total
