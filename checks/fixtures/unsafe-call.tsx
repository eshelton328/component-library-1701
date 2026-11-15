// expect: eslint @typescript-eslint/no-unsafe-call
// scope: scripts too
export const run = (raw: string): unknown => JSON.parse(raw)()
