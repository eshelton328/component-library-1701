// expect: tsc TS2322
const upper = (value: string) => value.toUpperCase()
export const format: (value: string | number) => string = upper
