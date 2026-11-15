// expect: eslint @typescript-eslint/switch-exhaustiveness-check
type Mode = 'dark' | 'light' | 'system'
export function label(mode: Mode): string {
  switch (mode) {
    case 'dark':
      return 'Dark'
    case 'light':
      return 'Light'
    default:
      return 'Other'
  }
}
