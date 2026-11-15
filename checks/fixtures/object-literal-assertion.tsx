// expect: eslint @typescript-eslint/consistent-type-assertions
// scope: scripts too
type Order = { id: string; total: number }
export const mock = { id: 'a' } as Order
