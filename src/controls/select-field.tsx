import { useId, useState, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { selectField, type SelectFieldVariantProps } from '../../styled-system/recipes'
import { ChevronDownIcon } from '../foundations/icons'
import { RadioMenu, type RadioMenuOption } from './menu'
import type { Scalar } from './scalar'
import { TruncatedText } from './tooltip'

const { withProvider, withContext } = createSlotRecipeContext(selectField)
const Root = withProvider('div', 'root')
const Label = withContext('span', 'label')
const Trigger = withContext('button', 'trigger')
const Icon = withContext('span', 'icon')
const Value = withContext('span', 'value')
const Chevron = withContext('span', 'chevron')

export type SelectFieldProps = Scalar<SelectFieldVariantProps> & {
  /** The visible label over the field, such as "Project". It names the field and its list of choices. */
  label: string
  options: readonly RadioMenuOption[]
  /** The picked value. Set it with `onValueChange` to control the field. */
  value?: string | undefined
  defaultValue?: string | undefined
  onValueChange?: ((value: string) => void) | undefined
  /** The text the field shows while no choice is picked, in `fg.subtle`. */
  placeholder?: string | undefined
  /** An icon before the value, such as `<FolderIcon />`; it draws at 16 in `fg.muted`. */
  icon?: ReactNode
  /** Whether the list is open. Set it with `onOpenChange` to control it. */
  open?: boolean | undefined
  onOpenChange?: ((open: boolean) => void) | undefined
  disabled?: boolean | undefined
}

/**
 * A form value picked from a `RadioMenu`, drawn as a `TextField`: the label,
 * an inset box with an optional leading `icon`, the picked label (cut, whole
 * in a tooltip) and a chevron. `size`: `sm` 28, `md` 32 (default), `lg` 36,
 * `xl` 44. `mono` sets the value in `mono`; `labelHidden` hides the label.
 */
export function SelectField({ label, options, value, defaultValue, onValueChange, placeholder, icon, open, onOpenChange, disabled, size, mono, labelHidden }: SelectFieldProps) {
  const id = useId()
  const [picked, setPicked] = useState(defaultValue)
  const selected = value ?? picked
  const option = options.find((o) => o.value === selected)
  const text = option?.label ?? placeholder ?? ''
  return (
    <Root size={size} mono={mono} labelHidden={labelHidden}>
      <Label id={`${id}-label`}>{label}</Label>
      <RadioMenu
        label={label}
        options={options}
        value={selected}
        onValueChange={(next) => {
          if (value === undefined) setPicked(next)
          onValueChange?.(next)
        }}
        open={open}
        onOpenChange={onOpenChange}
        trigger={
          <Trigger type="button" aria-labelledby={`${id}-label ${id}-value`} disabled={disabled === true ? true : undefined}>
            {icon === undefined || icon === null ? null : <Icon aria-hidden="true">{icon}</Icon>}
            <Value id={`${id}-value`} {...(option === undefined ? { 'data-placeholder': '' } : {})}>
              {text === '' ? null : <TruncatedText>{text}</TruncatedText>}
            </Value>
            <Chevron aria-hidden="true">
              <ChevronDownIcon size="16" />
            </Chevron>
          </Trigger>
        }
      />
    </Root>
  )
}
