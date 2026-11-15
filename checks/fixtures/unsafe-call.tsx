// expect: eslint @typescript-eslint/no-unsafe-call
export const run = (raw: string): unknown => JSON.parse(raw)()
