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
  /** An icon before the label. */
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

/** A segmented control that picks one view of a page, such as Grid or List. */
export function ViewSwitch({ label, items, value, defaultValue, onValueChange, disabled, size }: ViewSwitchProps) {
  return (
    <Root
      size={size}
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
          <ItemText>{item.label}</ItemText>
          <ItemControl />
          <SegmentGroup.ItemHiddenInput />
        </Item>
      ))}
    </Root>
  )
}
