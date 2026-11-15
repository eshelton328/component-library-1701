// expect: tsc TS2345
const double = (value: number) => value * 2
export const result = double.call(undefined, 'two')
