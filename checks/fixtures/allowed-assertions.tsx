// expect: clean
// scope: scripts too
// Literal-preserving forms and checked narrowing are allowed.
export const modes = ['dark', 'light'] as const
type Mode = (typeof modes)[number]
export const fallback = { mode: 'dark' } satisfies { mode: Mode }
export const isMode = (value: unknown): value is Mode =>
  typeof value === 'string' && modes.some((mode) => mode === value)
export function label(mode: Mode): string {
  switch (mode) {
    case 'dark':
      return 'Dark'
    case 'light':
      return 'Light'
  }
}
