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
  /** `md` (the default): 32 high with 10 px sides and the `label` style, as the Toolkit draws them. `compact`: 30 high with 8 px sides and the `small` style, as the Inbox desktop list pane draws them. */
  size?: 'md' | 'compact' | undefined
  /**
   * The space around the chips. `default` pads the row 2 px, so a focused
   * chip's ring shows outside it. `none` puts the chips flush with the row's
   * edges, as the Toolkit chip row draws them, and draws the focus ring
   * inside the chip.
   */
  padding?: 'default' | 'none' | undefined
}

type Overflow = { start: boolean; end: boolean }

/**
 * Which edges of a scrolling row have more chips past them, from its scroll
 * position. It updates on scroll and when the row or a chip changes size
 * (a resize, a font load, new items). scrollLeft is negative in a
 * right-to-left row, so its size is the distance from the start.
 */
function useOverflow(items: readonly FilterChip[]) {
  const ref = useRef<HTMLDivElement>(null)
  const [overflow, setOverflow] = useState<Overflow>({ start: false, end: false })
  useLayoutEffect(() => {
    const row = ref.current
    if (row === null) return
    const update = () => {
      const scrolled = Math.abs(row.scrollLeft)
      // One pixel of slack: a zoomed page can leave a fractional scroll.
      const start = scrolled > 1
      const end = row.scrollWidth - row.clientWidth - scrolled > 1
      setOverflow((now) => (now.start === start && now.end === end ? now : { start, end }))
    }
    update()
    row.addEventListener('scroll', update, { passive: true })
    const sizes = new ResizeObserver(update)
    sizes.observe(row)
    for (const chip of row.children) sizes.observe(chip)
    return () => {
      row.removeEventListener('scroll', update)
      sizes.disconnect()
    }
  }, [items])
  return [ref, overflow] as const
}

// Ark treats an empty string as no value, so each value gets a prefix.
const toArk = (v: string) => `chip:${v}`
const fromArk = (vs: string[]) => vs.flatMap((v) => (v.startsWith('chip:') ? [v.slice(5)] : []))

/**
 * A row of filter chips with counts; each chip turns a filter on or off.
 * With `multiple={false}` the row is a radio group: the arrow keys move the
 * choice, and the chosen chip cannot be turned off.
 */
export function FilterChips({ label, items, value, defaultValue, onValueChange, multiple = true, disabled, size, padding }: FilterChipsProps) {
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
  const [rowRef, overflow] = useOverflow(items)
  return (
    <Root
      ref={rowRef}
      size={size}
      padding={padding}
      data-overflow-start={overflow.start ? '' : undefined}
      data-overflow-end={overflow.end ? '' : undefined}
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
