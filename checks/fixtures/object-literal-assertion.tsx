// expect: eslint @typescript-eslint/consistent-type-assertions
type Order = { id: string; total: number }
export const mock = { id: 'a' } as Order
