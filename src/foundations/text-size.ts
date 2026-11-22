// The text sizes of the type tokens (d-119). A class on <html> picks Small
// or Large, as the dark class picks the mode; Default needs no class. The
// sizes and line heights are in tokens/sizes/AGENTS.md.

/** A text size: Small, Default or Large. */
export type TextSize = 'small' | 'default' | 'large'

/**
 * The class on `<html>` that picks each text size, or `null` for Default,
 * which needs none. Set at most one, before the first paint.
 */
export const textSizeClass = {
  small: 'text-small',
  default: null,
  large: 'text-large',
} as const satisfies Record<TextSize, string | null>
