import { Checkbox as ArkCheckbox } from '@ark-ui/react/checkbox'
import { useId } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { checkbox } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(checkbox)
const Root = withProvider(ArkCheckbox.Root, 'root')
const Control = withContext(ArkCheckbox.Control, 'control')
const Indicator = withContext(ArkCheckbox.Indicator, 'indicator')
const Label = withContext(ArkCheckbox.Label, 'label')
const Group = withProvider(ArkCheckbox.Group, 'group')
const GroupLabel = withContext('span', 'groupLabel')

// The check and the dash are part of the control, not icons a caller picks.
function Check() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 6.2 5 8.5l4.5-5" />
    </svg>
  )
}
function Dash() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M3 6h6" />
    </svg>
  )
}

export type CheckboxProps = {
  label: string
  /** Whether the box is checked; `'indeterminate'` for a group that is partly checked. Set it with `onCheckedChange` to control the box. */
  checked?: boolean | 'indeterminate' | undefined
  defaultChecked?: boolean | undefined
  onCheckedChange?: ((checked: boolean) => void) | undefined
  disabled?: boolean | undefined
  /** The value the box gives a `CheckboxGroup` or a form. */
  value?: string | undefined
  /** The form field name. */
  name?: string | undefined
}

/** A checkbox with a label, such as one filter in a filter popover. */
export function Checkbox({ label, checked, defaultChecked, onCheckedChange, disabled, value, name }: CheckboxProps) {
  return (
    <Root
      disabled={disabled}
      {...(checked === undefined ? {} : { checked })}
      {...(defaultChecked === undefined ? {} : { defaultChecked })}
      {...(value === undefined ? {} : { value })}
      {...(name === undefined ? {} : { name })}
      onCheckedChange={(details) => {
        onCheckedChange?.(details.checked === true)
      }}
    >
      <Control>
        <Indicator>
          <Check />
        </Indicator>
        <Indicator indeterminate>
          <Dash />
        </Indicator>
      </Control>
      <Label>{label}</Label>
      <ArkCheckbox.HiddenInput />
    </Root>
  )
}

/** One choice in a `CheckboxGroup`. */
export type CheckboxGroupItem = { value: string; label: string; disabled?: boolean | undefined }

export type CheckboxGroupProps = {
  /** The group's name, such as "Kind". It labels the group. */
  label: string
  items: readonly CheckboxGroupItem[]
  /** The checked values. Set it with `onValueChange` to control the group. */
  value?: readonly string[] | undefined
  defaultValue?: readonly string[] | undefined
  onValueChange?: ((value: string[]) => void) | undefined
  disabled?: boolean | undefined
  /** The form field name of every box. */
  name?: string | undefined
}

/** A labelled group of checkboxes that gives the list of checked values. */
export function CheckboxGroup({ label, items, value, defaultValue, onValueChange, disabled, name }: CheckboxGroupProps) {
  const labelId = useId()
  return (
    <Group
      role="group"
      aria-labelledby={labelId}
      disabled={disabled}
      {...(value === undefined ? {} : { value: [...value] })}
      {...(defaultValue === undefined ? {} : { defaultValue: [...defaultValue] })}
      {...(name === undefined ? {} : { name })}
      onValueChange={(next) => {
        onValueChange?.(next)
      }}
    >
      <GroupLabel id={labelId}>{label}</GroupLabel>
      {items.map((item) => (
        <Checkbox key={item.value} label={item.label} value={item.value} disabled={item.disabled} />
      ))}
    </Group>
  )
}
