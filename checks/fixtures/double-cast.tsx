// expect: eslint @typescript-eslint/no-unsafe-type-assertion
type Order = { id: string }
export const read = (value: number) => value as unknown as Order
