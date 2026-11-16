import type { ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { badge, type BadgeVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'

const ctx = createSlotRecipeContext(badge)
const Root = ctx.withProvider('span', 'root')
const Icon = ctx.withContext('span', 'icon')

export type BadgeProps = Scalar<BadgeVariantProps> & {
  /** The text, such as "New", "43 of 43 pass", "loop" or "Read-only". */
  label: string
  /**
   * An icon before the label, such as `<SparkIcon size="12" />`. It takes
   * the badge's colour. Figma draws it at 12 px, or 14 px in `quiet`.
   */
  icon?: ReactNode
}

/**
 * A small badge of the Toolkit and Artifacts pages. `variant` picks the
 * build: `pill` (a tinted pill, the default), `tag` (a tinted box in mono),
 * `outline` (a bordered box in mono) or `quiet` (a bordered muted pill, as
 * Read-only). `tone` picks the status colour: `working`, `running`,
 * `needsYou`, `idle` (the default), `done` or `danger`; `quiet` ignores it.
 */
export function Badge({ label, icon, variant, tone }: BadgeProps) {
  return (
    <Root variant={variant} tone={tone}>
      {icon === undefined || icon === null || icon === false ? null : <Icon aria-hidden="true">{icon}</Icon>}
      {label}
    </Root>
  )
}
