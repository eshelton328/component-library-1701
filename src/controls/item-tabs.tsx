import { Tabs } from '@ark-ui/react/tabs'
import type { ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { itemTabs, type ItemTabsVariantProps } from '../../styled-system/recipes'
import type { Scalar } from './scalar'

const { withProvider, withContext } = createSlotRecipeContext(itemTabs)
const Root = withProvider(Tabs.Root, 'root')
const List = withContext(Tabs.List, 'list')
const Trigger = withContext(Tabs.Trigger, 'trigger')
const Indicator = withContext(Tabs.Indicator, 'indicator')
const Content = withContext(Tabs.Content, 'content')

/** One tab and its panel. */
export type ItemTab = {
  value: string
  label: string
  /** An icon before the label. */
  icon?: ReactNode
  /** The panel the tab shows. */
  content: ReactNode
  disabled?: boolean | undefined
}

export type ItemTabsProps = Scalar<ItemTabsVariantProps> & {
  /** The accessible name of the tab list, such as "Skill sections". */
  label: string
  items: readonly ItemTab[]
  /** The selected tab. Set it with `onValueChange` to control the tabs. */
  value?: string | undefined
  /** The first selected tab of uncontrolled tabs; the first tab when not set. */
  defaultValue?: string | undefined
  /** Called with the value of the tab the user picks. */
  onValueChange?: ((value: string) => void) | undefined
}

/**
 * The tabs of an item page, such as a Toolkit item's sections. The arrow
 * keys move between tabs and select them; on a narrow screen the list
 * scrolls sideways.
 */
export function ItemTabs({ label, items, value, defaultValue, onValueChange, size }: ItemTabsProps) {
  const first = items.find((item) => item.disabled !== true)?.value
  const initial = defaultValue ?? first
  return (
    <Root
      size={size}
      {...(value === undefined ? {} : { value })}
      {...(initial === undefined ? {} : { defaultValue: initial })}
      onValueChange={(details) => {
        onValueChange?.(details.value)
      }}
    >
      <List aria-label={label}>
        {items.map((item) => (
          <Trigger key={item.value} value={item.value} disabled={item.disabled}>
            {item.icon === undefined ? null : <span aria-hidden="true">{item.icon}</span>}
            {item.label}
          </Trigger>
        ))}
        <Indicator />
      </List>
      {items.map((item) => (
        <Content key={item.value} value={item.value}>
          {item.content}
        </Content>
      ))}
    </Root>
  )
}
