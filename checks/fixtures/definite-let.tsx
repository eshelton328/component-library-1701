// expect: eslint no-restricted-syntax
export function read(flag: boolean): string {
  let value!: string
  if (flag) value = 'set'
  return value
}
