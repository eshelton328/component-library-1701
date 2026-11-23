// The text sizes of the type tokens (d-122). Small is the base type and
// needs no class; a class on <html> picks Default or Large, as the dark
// class picks the mode. The sizes and line heights are in
// tokens/sizes/AGENTS.md.

/** A text size: Small, Default or Large. */
export type TextSize = 'small' | 'default' | 'large'

/**
 * The class on `<html>` that picks each text size, or `null` for Small,
 * which needs none. Set at most one, before the first paint.
 */
export const textSizeClass = {
  small: null,
  default: 'text-default',
  large: 'text-large',
} as const satisfies Record<TextSize, string | null>
