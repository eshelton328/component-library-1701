import { Checkbox as ArkCheckbox } from '@ark-ui/react/checkbox'
import { useId, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { checkbox } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(checkbox)
const Root = withProvider(ArkCheckbox.Root, 'root')
const Control = withContext(ArkCheckbox.Control, 'control')
const Indicator = withContext(ArkCheckbox.Indicator, 'indicator')
const Label = withContext(ArkCheckbox.Label, 'label')
const Group = withProvider(ArkCheckbox.Group, 'group')
const GroupLabel = withContext('span', 'groupLabel')
const Trailing = withContext('span', 'trailing')

// A slot given as `false`, `null` or an empty string is left out, as React leaves it out; `0` shows.
const shown = (node: ReactNode) => node !== undefined && node !== null && typeof node !== 'boolean' && node !== ''

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
  /** Shown at the end of the row, such as the number of items a filter matches. It is not part of the label. */
  trailing?: ReactNode
  /** `text` (the default) draws the label in `body`; `mono` in `mono`, as the project and tag rows of the Inbox Filter menu are. */
  labelStyle?: 'text' | 'mono' | undefined
  /**
   * The text size: `md` (the default) draws a text label in `body` and the `trailing` count in `mono`; `sm` draws the
   * label in `small` and the count in `monoSm`, as the Inbox Filter menu does. A `mono` label stays `mono` at both sizes.
   */
  size?: 'md' | 'sm' | undefined
}

/** A checkbox with a label, such as one filter in a filter popover, and an optional `trailing` count at the end. */
export function Checkbox({ label, checked, defaultChecked, onCheckedChange, disabled, value, name, trailing, labelStyle, size }: CheckboxProps) {
  return (
    <Root
      labelStyle={labelStyle}
      size={size}
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
      {shown(trailing) ? <Trailing>{trailing}</Trailing> : null}
      <ArkCheckbox.HiddenInput />
    </Root>
  )
}

/** One choice in a `CheckboxGroup`. */
export type CheckboxGroupItem = {
  value: string
  label: string
  disabled?: boolean | undefined
  /** Shown at the end of the row, such as a count. */
  trailing?: ReactNode
  /** `mono` draws the label in `mono`, as a project or tag name is; `text` (the default) in `body`. */
  labelStyle?: 'text' | 'mono' | undefined
}

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
  /** The text size of every box: `md` (the default) or `sm`, as the Inbox Filter menu draws it. See `CheckboxProps`. */
  size?: 'md' | 'sm' | undefined
}

/** A labelled group of checkboxes that gives the list of checked values. */
export function CheckboxGroup({ label, items, value, defaultValue, onValueChange, disabled, name, size }: CheckboxGroupProps) {
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
        // Only `true` is passed: Ark lets an item's `false` clear a disabled group.
        <Checkbox key={item.value} label={item.label} value={item.value} disabled={item.disabled === true ? true : undefined} trailing={item.trailing} labelStyle={item.labelStyle} size={size} />
      ))}
    </Group>
  )
}
