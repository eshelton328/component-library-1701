import { Switch as ArkSwitch } from '@ark-ui/react/switch'
import { useId } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { switchRecipe } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(switchRecipe)
const Root = withProvider(ArkSwitch.Root, 'root')
const Control = withContext(ArkSwitch.Control, 'control')
const Thumb = withContext(ArkSwitch.Thumb, 'thumb')
const Label = withContext(ArkSwitch.Label, 'label')
const TextColumn = withContext('span', 'text')
const Hint = withContext('span', 'hint')

export type SwitchProps = {
  /** What the switch turns on or off, such as "Notifications". It is always the switch's accessible name. */
  label: string
  /**
   * A line under the label that says what the setting does, such as "Push alerts on this device". It is the
   * switch's accessible description (`aria-describedby`), not part of its name. No line when not set or empty.
   */
  hint?: string | undefined
  /** Whether the switch is on. Set it with `onCheckedChange` to control the switch. */
  checked?: boolean | undefined
  defaultChecked?: boolean | undefined
  /** Called with the new state when the user turns the switch on or off. */
  onCheckedChange?: ((checked: boolean) => void) | undefined
  /** A switch the user cannot turn; it is dimmed. */
  disabled?: boolean | undefined
  /**
   * `inline` (the default) draws a full-width row: the label in `label` (Medium 14/20, `fg.default`) and the hint in
   * `small` (`fg.muted`) at the start, the switch at the end, as a setting in the phone More drawer.
   * `stacked` draws the switch centred over a short label and the hint, both in `railLabel` (`fg.muted`), centred and
   * wrapping, so it fits the 64 px `NavRail`. The row is at least 44 px high (`control.xl`) in both layouts, for touch.
   */
  layout?: 'inline' | 'stacked' | undefined
}

/**
 * An on/off switch for a setting that takes effect at once, such as Notifications, with a label, an optional hint
 * line and a 36 x 20 track: `accent.default` when on, `border.control` when off. The whole row toggles it, and so
 * does Space when it has the focus. Use a `Checkbox` for a choice in a list or a form.
 */
export function Switch({ label, hint, checked, defaultChecked, onCheckedChange, disabled, layout }: SwitchProps) {
  const hintId = useId()
  const hinted = hint !== undefined && hint !== ''
  const control = (
    <Control>
      <Thumb />
    </Control>
  )
  const text = (
    <TextColumn>
      <Label>{label}</Label>
      {hinted ? <Hint id={hintId}>{hint}</Hint> : null}
    </TextColumn>
  )
  const stacked = layout === 'stacked'
  return (
    <Root
      layout={layout}
      disabled={disabled}
      {...(checked === undefined ? {} : { checked })}
      {...(defaultChecked === undefined ? {} : { defaultChecked })}
      onCheckedChange={(details) => {
        onCheckedChange?.(details.checked)
      }}
    >
      {stacked ? control : text}
      {stacked ? text : control}
      <ArkSwitch.HiddenInput role="switch" {...(hinted ? { 'aria-describedby': hintId } : {})} />
    </Root>
  )
}
