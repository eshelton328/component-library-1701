// expect: eslint no-console
export function save(value: string): string {
  console.log(value)
  return value
}
