// expect: eslint no-restricted-syntax
// scope: scripts too
export function read(flag: boolean): string {
  let value!: string
  if (flag) value = 'set'
  return value
}
