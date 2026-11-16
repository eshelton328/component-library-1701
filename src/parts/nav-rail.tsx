import type { ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { navRail } from '../../styled-system/recipes'
import { badgeCount, badgeText, NavBadge, type NavItem } from './nav-item'

const { withProvider, withContext } = createSlotRecipeContext(navRail)
const Root = withProvider('nav', 'root')
const Logo = withContext('div', 'logo')
const Divider = withContext('div', 'divider')
const List = withContext('ul', 'list')
const Item = withContext('button', 'item')
const Icon = withContext('span', 'icon')
const Label = withContext('span', 'label')
const Hint = withContext('span', 'hint')

export type NavRailProps = {
  /** The pages, in order. More comes last (d-047). */
  items: readonly NavItem[]
  /** The value of the current page. Its item has the selected colours and `aria-current="page"`. */
  selected?: string | undefined
  /** Called with the value of the item the user picks. The app does the navigation. */
  onSelect?: ((value: string) => void) | undefined
  /**
   * The logo at the top, such as a home link around `<Logo title="Span" />`
   * (Figma `logo · Span (home)`); a line separates it from the items.
   */
  logo?: ReactNode
  /** The accessible name of the navigation landmark; "Main" when not set. */
  label?: string | undefined
}

/**
 * The desktop nav rail: a 64 px column of pages, each an icon over a short
 * label, with the needs-you badge on an icon when the page has a count.
 * Picking an item calls `onSelect`; the rail does no routing (d-068).
 */
export function NavRail({ items, selected, onSelect, logo, label = 'Main' }: NavRailProps) {
  const hasLogo = logo !== undefined && logo !== null && logo !== false
  return (
    <Root aria-label={label}>
      {hasLogo ? (
        <>
          <Logo>{logo}</Logo>
          <Divider aria-hidden="true" />
        </>
      ) : null}
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
                <Label>{item.label}</Label>
                {count === undefined ? null : <Hint>{badgeText(count)}</Hint>}
              </Item>
            </li>
          )
        })}
      </List>
    </Root>
  )
}
