import { Tabs } from '@ark-ui/react/tabs'
import { useState, type ReactNode } from 'react'
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
 * `size` sets the tabs' height: `sm` 28, `md` 32 (the default) and `lg` 36.
 * `density` sets the space around the tabs: `default` pads the list 2 px,
 * so a focused tab's ring shows outside it, and each tab 12 px at its sides;
 * `compact` starts the tabs at the list's edge with 10 px sides, as the
 * Toolkit item draws them on a phone and a tablet, and draws the focus ring
 * inside the tab.
 * Only the selected tab draws a 1 px border, outside its padding, so it is
 * 2 px wider and its label 1 px further in than when it is not selected.
 * `tone` sets the selected tab's look: `default` draws the selected fill
 * with a `border.selected` border and the label in `fg.default`; `accent`
 * keeps the fill and the border and draws the label and icon in `fg.accent`
 * (cyan), as the Toolkit item's tabs do.
 */
export function ItemTabs({ label, items, value, defaultValue, onValueChange, size, density, tone }: ItemTabsProps) {
  // Uncontrolled tabs keep their own selection here, not in Ark, so that it
  // follows the items: when the selected tab goes away or is disabled, the
  // first enabled tab is selected and stays in the tab order.
  const [picked, setPicked] = useState(defaultValue)
  const enabled = items.filter((item) => item.disabled !== true)
  const selected = value ?? (enabled.some((item) => item.value === picked) ? picked : enabled[0]?.value)
  return (
    <Root
      size={size}
      density={density}
      tone={tone}
      // Ark treats an empty string as no value, so each value gets a prefix.
      value={selected === undefined ? null : toArk(selected)}
      onValueChange={(details) => {
        const next = fromArk(details.value)
        if (next === undefined) return
        if (value === undefined) setPicked(next)
        onValueChange?.(next)
      }}
    >
      <List aria-label={label}>
        {items.map((item) => (
          <Trigger key={item.value} value={toArk(item.value)} disabled={item.disabled}>
            {item.icon === undefined ? null : <span aria-hidden="true">{item.icon}</span>}
            {item.label}
          </Trigger>
        ))}
        <Indicator />
      </List>
      {items.map((item) => (
        <Content key={item.value} value={toArk(item.value)}>
          {item.content}
        </Content>
      ))}
    </Root>
  )
}

const toArk = (v: string) => `tab:${v}`
const fromArk = (v: string | null) => (v?.startsWith('tab:') === true ? v.slice(4) : undefined)
