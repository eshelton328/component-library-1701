// Strict readers for the CSS values that the shell's keyboard dock reads from tokens as numbers (audit L-2). Each
// throws on a value it does not know, so a token written in another form fails when the module loads, not as a dock
// that moves in 0.25 ms or on a straight line.

const number = String.raw`-?(?:\d+\.?\d*|\.\d+)`

/** A CSS `<time>` in ms: `250ms` or `0.25s`. Throws on any other form, such as `0.25 s` or a bare number. */
export function cssDuration(value: string): number {
  const match = new RegExp(`^(${number})(ms|s)$`).exec(value.trim())
  const amount = match?.[1]
  const unit = match?.[2]
  if (amount === undefined || unit === undefined) throw new Error(`Not a CSS duration in ms or s: "${value}"`)
  return unit === 's' ? Number(amount) * 1000 : Number(amount)
}

/** A CSS length in px, such as `380px`. Throws on any other unit or form. */
export function cssPx(value: string): number {
  const amount = new RegExp(`^(${number})px$`).exec(value.trim())?.[1]
  if (amount === undefined) throw new Error(`Not a CSS length in px: "${value}"`)
  return Number(amount)
}

/**
 * The four numbers of a CSS `cubic-bezier(x1, y1, x2, y2)`, with both x in 0 to 1 as CSS requires. Throws on a
 * keyword (`ease`), `linear(...)`, `steps(...)` or any other form.
 */
export function cssCubicBezier(value: string): readonly [number, number, number, number] {
  const match = new RegExp(`^cubic-bezier\\(\\s*(${number})\\s*,\\s*(${number})\\s*,\\s*(${number})\\s*,\\s*(${number})\\s*\\)$`).exec(
    value.trim(),
  )
  const [, a, b, c, d] = match ?? []
  if (a === undefined || b === undefined || c === undefined || d === undefined)
    throw new Error(`Not a CSS cubic-bezier(): "${value}"`)
  const curve = [Number(a), Number(b), Number(c), Number(d)] as const
  if (curve[0] < 0 || curve[0] > 1 || curve[2] < 0 || curve[2] > 1)
    throw new Error(`A cubic-bezier() x is outside 0 to 1: "${value}"`)
  return curve
}
