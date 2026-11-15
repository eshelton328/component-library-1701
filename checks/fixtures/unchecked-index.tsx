// expect: tsc TS2322
export function first(items: number[]): number {
  const item: number = items[0]
  return item
}
