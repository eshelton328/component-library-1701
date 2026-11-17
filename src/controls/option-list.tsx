import { RadioGroup as ArkRadioGroup } from '@ark-ui/react/radio-group'
import { useId, useRef, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { CheckIcon } from '../foundations/icons'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { optionList } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(optionList)
const Root = withProvider(ArkRadioGroup.Root, 'root')
const Item = withContext(ArkRadioGroup.Item, 'item')
const ItemLeading = withContext('span', 'itemLeading')
const ItemBody = withContext('span', 'itemBody')
const ItemHeading = withContext('span', 'itemHeading')
const ItemText = withContext(ArkRadioGroup.ItemText, 'itemText')
const ItemBadge = withContext('span', 'itemBadge')
const ItemDescription = withContext('span', 'itemDescription')
const ItemControl = withContext(ArkRadioGroup.ItemControl, 'itemControl')
const ItemTrailing = withContext('span', 'itemTrailing')

// A slot given as `false`, `null` or an empty string is left out, as React leaves it out.
const shown = (node: ReactNode) => node !== undefined && node !== null && typeof node !== 'boolean' && node !== ''


/** One choice in an `OptionList`. */
export type OptionListItem = {
  /** A non-empty string, unique in the list: Ark treats an empty string as no value. A form gets it as the field value. */
  value: string
  label: string
  /** A line under the label that says what the choice does. */
  description?: string | undefined
  /**
   * A pill after the label, such as `<Badge label="Recommended" tone="working" />` on the option a question
   * recommends. It describes the radio for assistive technology, before the description.
   */
  badge?: ReactNode
  /** A mark before the text, such as a 16 px agent mark or a plus. It is decoration; the label names the row. */
  leading?: ReactNode
  /**
   * An element at the end of the row, such as a status pill. The chosen row still shows its check after it; a row
   * that is not chosen gives the check's space to it. It describes the radio, after the description.
   */
  trailing?: ReactNode
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
  /** `text` (the default) draws the description in `small`; `mono` in `mono`, as the Run in picker's meta lines are. */
  descriptionStyle?: 'text' | 'mono' | undefined
}

/**
 * A list of choices of which one is chosen, each with a label, an optional
 * badge, an optional description and a check on the chosen row: the sort
 * sheet of Artifacts M4 and the Choose one list of Inbox D2, T3 and M5.
 * It is a radio group: Tab enters it, arrow keys move the choice.
 */
export function OptionList({ label, items, value, defaultValue, onValueChange, onItemSelect, disabled, name, descriptionStyle }: OptionListProps) {
  const baseId = useId()
  // Ark builds element ids from the item value, so a value with a space would break `aria-labelledby`.
  // These ids use the item's position instead.
  const position = (itemValue: string) => String(items.findIndex((item) => item.value === itemValue))
  const ids = {
    item: (itemValue: string) => `${baseId}-item-${position(itemValue)}`,
    itemLabel: (itemValue: string) => `${baseId}-label-${position(itemValue)}`,
    itemControl: (itemValue: string) => `${baseId}-control-${position(itemValue)}`,
    itemHiddenInput: (itemValue: string) => `${baseId}-input-${position(itemValue)}`,
  }
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
    onItemSelect?.(target.value)
  }

  return (
    <Root
      aria-label={label}
      aria-labelledby={undefined}
      descriptionStyle={descriptionStyle}
      disabled={disabled === true ? true : undefined}
      ids={ids}
      {...(value === undefined ? {} : { value })}
      {...(defaultValue === undefined ? {} : { defaultValue })}
      {...(name === undefined ? {} : { name })}
      onValueChange={(details) => {
        // A form reset can give no value.
        const next: unknown = details.value
        if (typeof next === 'string' && next !== '') onValueChange?.(next)
      }}
      onKeyDownCapture={onKeyDownCapture}
      onKeyDown={onKeyDown}
      onClick={onClick}
    >
      {items.map((item, index) => {
        const descriptionId = `${baseId}-${String(index)}-description`
        const badgeId = `${baseId}-${String(index)}-badge`
        const trailingId = `${baseId}-${String(index)}-trailing`
        const hasBadge = shown(item.badge)
        const hasTrailing = shown(item.trailing)
        const describedBy = [hasBadge ? badgeId : null, item.description === undefined ? null : descriptionId, hasTrailing ? trailingId : null]
          .filter((id) => id !== null)
          .join(' ')
        return (
          // Only `true` is passed: Ark lets an item's `false` clear a disabled group.
          <Item key={item.value} value={item.value} disabled={item.disabled === true ? true : undefined}>
            {shown(item.leading) ? <ItemLeading aria-hidden="true">{item.leading}</ItemLeading> : null}
            <ItemBody>
              {hasBadge ? (
                <ItemHeading>
                  <ItemText>{item.label}</ItemText>
                  <ItemBadge id={badgeId}>{item.badge}</ItemBadge>
                </ItemHeading>
              ) : (
                <ItemText>{item.label}</ItemText>
              )}
              {item.description === undefined ? null : <ItemDescription id={descriptionId}>{item.description}</ItemDescription>}
            </ItemBody>
            {hasTrailing ? <ItemTrailing id={trailingId}>{item.trailing}</ItemTrailing> : null}
            <ItemControl>
              <CheckIcon size="16" />
            </ItemControl>
            <ArkRadioGroup.ItemHiddenInput {...(describedBy === '' ? {} : { 'aria-describedby': describedBy })} />
          </Item>
        )
      })}
    </Root>
  )
}
