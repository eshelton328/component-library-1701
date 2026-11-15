// expect: tsc TS18046
export function message(run: () => void): string {
  try {
    run()
    return ''
  } catch (error) {
    return error.message
  }
}
