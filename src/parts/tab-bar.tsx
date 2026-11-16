import { createSlotRecipeContext } from '../../styled-system/jsx'
import { tabBar } from '../../styled-system/recipes'
import { TruncatedText } from '../controls/tooltip'
import { badgeCount, badgeText, NavBadge, type NavItem } from './nav-item'

const { withProvider, withContext } = createSlotRecipeContext(tabBar)
const Root = withProvider('nav', 'root')
const List = withContext('ul', 'list')
const Item = withContext('button', 'item')
const Icon = withContext('span', 'icon')
const Label = withContext('span', 'label')
const Hint = withContext('span', 'hint')

export type TabBarProps = {
  /** The tabs, in order: at most five on the phone, with More last (d-045, d-047). */
  items: readonly NavItem[]
  /** The value of the current page. Its tab has the selected colour and `aria-current="page"`. */
  selected?: string | undefined
  /** Called with the value of the tab the user picks. The app does the navigation. */
  onSelect?: ((value: string) => void) | undefined
  /** The accessible name of the navigation landmark; "Main" when not set. */
  label?: string | undefined
}

/**
 * The tablet and phone tab bar: the pages as equal tabs, each an icon over
 * a short label, with the needs-you badge on an icon when the page has a
 * count. It is 77 px high with the home-indicator area; the caller places
 * it at the bottom of the screen. Picking a tab calls `onSelect`; the bar
 * does no routing (d-068).
 */
export function TabBar({ items, selected, onSelect, label = 'Main' }: TabBarProps) {
  return (
    <Root aria-label={label}>
      <List>
        {items.map((item) => {
          const count = badgeCount(item)
          return (
            <li key={item.value}>
              <Item
                type="button"
                aria-current={item.value === selected ? 'page' : undefined}
                onClick={() => {
                  onSelect?.(item.value)
                }}
              >
                <Icon aria-hidden="true">
                  {item.icon}
                  {count === undefined ? null : <NavBadge count={count} />}
                </Icon>
                <Label>
                  <TruncatedText>{item.label}</TruncatedText>
                </Label>
                {count === undefined ? null : <Hint>{badgeText(count)}</Hint>}
              </Item>
            </li>
          )
        })}
      </List>
    </Root>
  )
}
