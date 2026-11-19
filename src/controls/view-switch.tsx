import { SegmentGroup } from '@ark-ui/react/segment-group'
import type { ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { viewSwitch, type ViewSwitchVariantProps } from '../../styled-system/recipes'
import type { Scalar } from './scalar'

const { withProvider, withContext } = createSlotRecipeContext(viewSwitch)
const Root = withProvider(SegmentGroup.Root, 'root')
const Indicator = withContext(SegmentGroup.Indicator, 'indicator')
const Item = withContext(SegmentGroup.Item, 'item')
const ItemText = withContext(SegmentGroup.ItemText, 'itemText')
const ItemControl = withContext(SegmentGroup.ItemControl, 'itemControl')

/** One view in the switch. */
export type ViewSwitchItem = {
  value: string
  label: string
  /** An icon before the label, or the item's only mark when the switch is `iconOnly`. */
  icon?: ReactNode
  disabled?: boolean | undefined
}

export type ViewSwitchProps = Scalar<ViewSwitchVariantProps> & {
  /** The accessible name of the group, such as "View". */
  label: string
  items: readonly ViewSwitchItem[]
  /** The selected view. Set it with `onValueChange` to control the switch. */
  value?: string | undefined
  /** The first selected view of an uncontrolled switch. */
  defaultValue?: string | undefined
  /** Called with the value of the view the user picks. */
  onValueChange?: ((value: string) => void) | undefined
  disabled?: boolean | undefined
}

/**
 * A segmented control that picks one view of a page, such as Grid or List.
 * `size` sets the height: `sm` 28, `md` 32 (the default) and `lg` 36; `sm`
 * and `md` draw 12 px icons, `lg` 16 px icons, as the Toolkit switch does.
 * `tone` sets the selected item's look: `default` draws the selected fill
 * with a `border.selected` border and the label in `fg.default`; `accent`
 * draws the selected fill with no border and the label and icon in
 * `fg.accent` (cyan), and leaves out the items' border, as the Toolkit
 * List, Map or Activity switch does.
 * `iconOnly` draws each item as its icon alone, as the Artifacts Grid or List
 * switch (402:15419): 16 px icons at every size, and at `md` 30 x 26 items, so
 * two items make a 68 px switch. Each item's `label` stays its accessible name;
 * give every item an `icon`. When not set, the items show their labels.
 * `fullWidth` makes the switch as wide as its parent, with its items sharing
 * that width equally, each icon and label centred, and draws every icon at 16
 * px at every size, as the Artifacts Source choice (D5 403:7557, Claude or
 * Codex). When not set, the switch is as wide as its items.
 */
export function ViewSwitch({ label, items, value, defaultValue, onValueChange, disabled, size, tone, iconOnly = false, fullWidth = false }: ViewSwitchProps) {
  return (
    <Root
      size={size}
      tone={tone}
      iconOnly={iconOnly}
      fullWidth={fullWidth}
      aria-label={label}
      orientation="horizontal"
      disabled={disabled}
      {...(value === undefined ? {} : { value })}
      {...(defaultValue === undefined ? {} : { defaultValue })}
      onValueChange={(details) => {
        // A form reset with no default can restore no value; report only a picked view.
        if (typeof details.value === 'string') onValueChange?.(details.value)
      }}
    >
      <Indicator />
      {items.map((item) => (
        <Item key={item.value} value={item.value} disabled={item.disabled}>
          {item.icon === undefined ? null : <span aria-hidden="true">{item.icon}</span>}
          {iconOnly ? null : <ItemText>{item.label}</ItemText>}
          <ItemControl />
          {/* With no visible label, the label names the item's radio. */}
          <SegmentGroup.ItemHiddenInput {...(iconOnly ? { 'aria-label': item.label } : {})} />
        </Item>
      ))}
    </Root>
  )
}
