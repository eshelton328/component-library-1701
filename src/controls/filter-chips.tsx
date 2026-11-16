import { ToggleGroup } from '@ark-ui/react/toggle-group'
import { useLayoutEffect, useRef, useState } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { filterChips } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(filterChips)
const Root = withProvider(ToggleGroup.Root, 'root')
const Item = withContext(ToggleGroup.Item, 'item')
const Dot = withContext('span', 'dot')
const Count = withContext('span', 'count')

/** A Toolkit kind, shown as a coloured dot before the label. */
export type FilterChipKind = 'skill' | 'agent' | 'rule' | 'workflow' | 'hook'

/** One filter chip. */
export type FilterChip = {
  value: string
  label: string
  /** The number of matching items, shown after the label. */
  count?: number | undefined
  kind?: FilterChipKind | undefined
  disabled?: boolean | undefined
}

export type FilterChipsProps = {
  /** The accessible name of the chip row, such as "Filter by kind". */
  label: string
  items: readonly FilterChip[]
  /** The selected chips. Set it with `onValueChange` to control the row. */
  value?: readonly string[] | undefined
  defaultValue?: readonly string[] | undefined
  /** Called with the values of the selected chips. */
  onValueChange?: ((value: string[]) => void) | undefined
  /** Whether more than one chip can be selected; `true` when not set. */
  multiple?: boolean | undefined
  disabled?: boolean | undefined
}

// Ark treats an empty string as no value, so each value gets a prefix.
const toArk = (v: string) => `chip:${v}`
const fromArk = (vs: string[]) => vs.flatMap((v) => (v.startsWith('chip:') ? [v.slice(5)] : []))

/**
 * A row of filter chips with counts; each chip turns a filter on or off.
 * With `multiple={false}` the row is a radio group: the arrow keys move the
 * choice, and the chosen chip cannot be turned off.
 */
export function FilterChips({ label, items, value, defaultValue, onValueChange, multiple = true, disabled }: FilterChipsProps) {
  const [picked, setPicked] = useState<readonly string[]>(defaultValue ?? [])
  const selected = value ?? picked
  // The latest selection, so a focus and a click in the same frame see each other's change.
  const latest = useRef(selected)
  useLayoutEffect(() => {
    latest.current = selected
  }, [selected])
  const change = (next: string[]) => {
    const now = latest.current
    if (next.length === now.length && next.every((v, i) => v === now[i])) return
    latest.current = next
    if (value === undefined) setPicked(next)
    onValueChange?.(next)
  }
  return (
    <Root
      aria-label={label}
      multiple={multiple}
      deselectable={multiple}
      disabled={disabled}
      loopFocus
      value={selected.map(toArk)}
      onValueChange={(details) => {
        change(fromArk(details.value))
      }}
    >
      {items.map((item) => (
        // Only `true` is passed, so an item's `false` cannot clear a disabled row.
        <Item
          key={item.value}
          value={toArk(item.value)}
          disabled={item.disabled === true ? true : undefined}
          onFocus={(e) => {
            // Ark focuses without scrolling, so a chip outside a narrow row is brought into view.
            e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' })
            // A radio group picks the chip that gets focus.
            if (!multiple && disabled !== true && item.disabled !== true) change([item.value])
          }}
        >
          {item.kind === undefined ? null : <Dot data-kind={item.kind} aria-hidden="true" />}
          {item.label}
          {item.count === undefined ? null : <Count>{item.count}</Count>}
        </Item>
      ))}
    </Root>
  )
}
