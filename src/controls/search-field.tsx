import { Field } from '@ark-ui/react/field'
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { searchField, type SearchFieldVariantProps } from '../../styled-system/recipes'
import type { Scalar } from './scalar'

const { withProvider, withContext } = createSlotRecipeContext(searchField)
const Root = withProvider(Field.Root, 'root')
const Input = withContext(Field.Input, 'input')
const Icon = withContext('span', 'icon')
const Clear = withContext('button', 'clear')

export type SearchFieldProps = Scalar<SearchFieldVariantProps> & {
  /** The accessible name of the field, such as "Search the inbox". */
  label: string
  /** The text. Set it with `onValueChange` to control the field. */
  value?: string | undefined
  /** The first text of an uncontrolled field. */
  defaultValue?: string | undefined
  /** Called with the new text on each change, and with '' on clear. */
  onValueChange?: ((value: string) => void) | undefined
  placeholder?: string | undefined
  /** The icon before the text, such as a magnifying glass. */
  icon?: ReactNode
  /** The icon of the clear button, such as `CloseCircleIcon`. Without it the button shows ×. */
  clearIcon?: ReactNode
  /** The accessible name of the clear button. */
  clearLabel?: string | undefined
  disabled?: boolean | undefined
}

/**
 * A search input. The clear button shows when the field has text; it and
 * Escape empty the field and keep the focus in it.
 */
export function SearchField({
  label,
  value,
  defaultValue = '',
  onValueChange,
  placeholder,
  icon,
  clearIcon,
  clearLabel = 'Clear search',
  disabled,
  size,
  clearSize,
}: SearchFieldProps) {
  const [own, setOwn] = useState(defaultValue)
  const input = useRef<HTMLInputElement>(null)
  const text = value ?? own
  const change = (next: string) => {
    if (value === undefined) setOwn(next)
    onValueChange?.(next)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Escape during IME composition cancels the candidate, not the search.
    if (e.key === 'Escape' && text !== '' && !e.nativeEvent.isComposing) {
      e.preventDefault()
      change('')
    }
  }
  return (
    <Root size={size} clearSize={clearSize} disabled={disabled}>
      {icon === undefined ? null : <Icon aria-hidden="true">{icon}</Icon>}
      <Input
        ref={input}
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          change(e.currentTarget.value)
        }}
        onKeyDown={onKeyDown}
      />
      {/* The field can be disabled by its prop or by a disabled Fieldset. */}
      <Field.Context>
        {(field) =>
          text === '' || field.disabled ? null : (
            <Clear
              type="button"
              aria-label={clearLabel}
              onClick={() => {
                change('')
                input.current?.focus()
              }}
            >
              {clearIcon ?? '×'}
            </Clear>
          )
        }
      </Field.Context>
    </Root>
  )
}
