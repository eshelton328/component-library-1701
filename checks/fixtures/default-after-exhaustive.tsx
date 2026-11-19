// expect: eslint @typescript-eslint/switch-exhaustiveness-check
// scope: scripts too
type Tone = 'info' | 'warn'

// Every member has a case, so the default is dead code.
export function label(tone: Tone): string {
  switch (tone) {
    case 'info':
      return 'Info'
    case 'warn':
      return 'Warning'
    default:
      return 'Unknown'
  }
}
