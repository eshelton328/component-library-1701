import { styled } from '../../styled-system/jsx'
import { statusPill, type StatusPillVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'

const Pill = styled('span', statusPill)

export type StatusPillProps = Scalar<StatusPillVariantProps> & {
  /** The status text, such as "Needs you" or "Next step". */
  label: string
  /** Show a dot before the label, as the running and working pills do. */
  dot?: boolean | undefined
}

/**
 * A small pill that names a status. `tone` picks the colours: `working`,
 * `running`, `needsYou`, `idle` (the default), `done` or `danger`.
 */
export function StatusPill({ label, dot = false, tone }: StatusPillProps) {
  return (
    <Pill tone={tone}>
      {dot ? <span data-dot="" aria-hidden="true" /> : null}
      {label}
    </Pill>
  )
}
