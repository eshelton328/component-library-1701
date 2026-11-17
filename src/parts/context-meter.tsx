import { createSlotRecipeContext } from '../../styled-system/jsx'
import { contextMeter } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(contextMeter)
const Root = withProvider('span', 'root')
const Segments = withContext('span', 'segments')
const Segment = withContext('span', 'segment')
const Value = withContext('span', 'value')

const SEGMENTS = 10

export type ContextMeterProps = {
  /** The share of the context window in use, from 0 to 100. */
  value: number
  /** Show the meter in amber, when the context is almost full. The caller decides the limit. */
  high?: boolean | undefined
  /** The accessible name of the meter; "Context used" when not set. */
  label?: string | undefined
}

/**
 * Shows how much of a chat's context window is in use: ten segments and
 * the percentage. Each segment is ten per cent. The percentage is one text
 * node ("42%"), as Figma's one text layer, and the meter is about 82 px
 * wide at "42%", inside Figma's 83.
 */
export function ContextMeter({ value, high = false, label = 'Context used' }: ContextMeterProps) {
  const percent = Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0
  const filled = Math.round(percent / (100 / SEGMENTS))
  return (
    <Root level={high ? 'high' : 'normal'} role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={`${String(percent)}%`}>
      <Segments aria-hidden="true">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <Segment key={i} data-filled={i < filled ? '' : undefined} />
        ))}
      </Segments>
      <Value aria-hidden="true">{`${String(percent)}%`}</Value>
    </Root>
  )
}
