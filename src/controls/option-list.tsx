import { RadioGroup as ArkRadioGroup } from '@ark-ui/react/radio-group'
import { useId, useRef, type KeyboardEvent, type MouseEvent } from 'react'
import { CheckIcon } from '../foundations/icons'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { optionList } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(optionList)
const Root = withProvider(ArkRadioGroup.Root, 'root')
const Item = withContext(ArkRadioGroup.Item, 'item')
const ItemBody = withContext('span', 'itemBody')
const ItemText = withContext(ArkRadioGroup.ItemText, 'itemText')
const ItemDescription = withContext('span', 'itemDescription')
const ItemControl = withContext(ArkRadioGroup.ItemControl, 'itemControl')

// Ark treats an empty string as no value, so every item value gets a prefix.
const prefix = 'option:'
const toArk = (value: string) => `${prefix}${value}`
const fromArk = (value: string) => (value.startsWith(prefix) ? value.slice(prefix.length) : value)

/** One choice in an `OptionList`. */
export type OptionListItem = {
  value: string
  label: string
  /** A line under the label that says what the choice does. */
  description?: string | undefined
  disabled?: boolean | undefined
}

export type OptionListProps = {
  /** Names the list for assistive technology, such as "Sort by". It does not show. */
  label: string
  items: readonly OptionListItem[]
  /** The chosen value, or `null` for none. Set it with `onValueChange` to control the list. */
  value?: string | null | undefined
  defaultValue?: string | null | undefined
  /** Called when the chosen value changes: a click, a tap, Space, Enter or an arrow key. */
  onValueChange?: ((value: string) => void) | undefined
  /**
   * Called when the user picks a row with a click, a tap, Space, Enter or a screen reader, also the row that is
   * already chosen. Arrow keys move the choice without calling it. Use it to close a sheet once a row is picked.
   */
  onItemSelect?: ((value: string) => void) | undefined
  disabled?: boolean | undefined
  /** The form field name. */
  name?: string | undefined
}

/**
 * A list of choices of which one is chosen, each with a label, an optional
 * description and a check on the chosen row: the sort sheet of Artifacts M4.
 * It is a radio group: Tab enters it, arrow keys move the choice.
 */
export function OptionList({ label, items, value, defaultValue, onValueChange, onItemSelect, disabled, name }: OptionListProps) {
  const baseId = useId()
  // A radio input that an arrow key checks also gets a click; that one is not a pick.
  const arrowKey = useRef(false)

  const onKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!event.key.startsWith('Arrow')) return
    arrowKey.current = true
    setTimeout(() => {
      arrowKey.current = false
    }, 0)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Enter picks the focused row, as a click does.
    const target = event.target
    if (event.key !== 'Enter' || !(target instanceof HTMLInputElement) || target.type !== 'radio') return
    event.preventDefault()
    target.click()
  }
  // A click on a row's label reaches its radio input as a second click, so only the input's click counts.
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target
    if (!(target instanceof HTMLInputElement) || target.type !== 'radio' || arrowKey.current) return
    onItemSelect?.(fromArk(target.value))
  }

  return (
    <Root
      aria-label={label}
      aria-labelledby={undefined}
      disabled={disabled === true ? true : undefined}
      {...(value === undefined ? {} : { value: value === null ? null : toArk(value) })}
      {...(defaultValue === undefined || defaultValue === null ? {} : { defaultValue: toArk(defaultValue) })}
      {...(name === undefined ? {} : { name })}
      onValueChange={(details) => {
        if (details.value !== null) onValueChange?.(fromArk(details.value))
      }}
      onKeyDownCapture={onKeyDownCapture}
      onKeyDown={onKeyDown}
      onClick={onClick}
    >
      {items.map((item) => {
        const descriptionId = `${baseId}-${item.value}-description`
        return (
          // Only `true` is passed: Ark lets an item's `false` clear a disabled group.
          <Item key={item.value} value={toArk(item.value)} disabled={item.disabled === true ? true : undefined}>
            <ItemBody>
              <ItemText>{item.label}</ItemText>
              {item.description === undefined ? null : <ItemDescription id={descriptionId}>{item.description}</ItemDescription>}
            </ItemBody>
            <ItemControl>
              <CheckIcon size="16" />
            </ItemControl>
            <ArkRadioGroup.ItemHiddenInput {...(item.description === undefined ? {} : { 'aria-describedby': descriptionId })} />
          </Item>
        )
      })}
    </Root>
  )
}
