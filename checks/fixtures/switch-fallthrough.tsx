// expect: tsc TS7029
export function size(name: string): number {
  let n = 0
  switch (name) {
    case 'sm':
      n = 1
    case 'md':
      n = 2
      break
  }
  return n
}
