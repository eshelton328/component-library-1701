import { useId, type ReactElement, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { moreDrawer } from '../../styled-system/recipes'
import { BottomSheetClose, SizedBottomSheet } from '../controls/bottom-sheet'

const { withProvider, withContext } = createSlotRecipeContext(moreDrawer)
const Group = withProvider('div', 'group')
const GroupLabel = withContext('div', 'groupLabel')
const List = withContext('ul', 'list')
const Item = withContext('button', 'item')
const Tile = withContext('span', 'tile')
const Body = withContext('span', 'body')
const Label = withContext('span', 'label')
const Description = withContext('span', 'description')
const Count = withContext('span', 'count')
const Chevron = withContext('svg', 'chevron')
const Footer = withProvider('div', 'footer')

/** A page in the drawer, such as Artifacts or Toolkit. */
export type MoreDrawerItem = {
  value: string
  label: string
  /** A line under the label that says what the page holds. */
  description?: string | undefined
  /** The page's icon, drawn in a tile before the label. */
  icon: ReactNode
  /** A count at the end of the item, such as the number of artifacts. */
  count?: number | undefined
  /** A page that is not built yet. It is dimmed and cannot be picked. */
  disabled?: boolean | undefined
}

/** A group of items, with an optional label above it, such as "Later". */
export type MoreDrawerGroup = {
  label?: string | undefined
  items: readonly MoreDrawerItem[]
}

export type MoreDrawerProps = {
  groups: readonly MoreDrawerGroup[]
  /** The value of the current page. Its item has the selected colours and `aria-current="page"`. */
  selected?: string | undefined
  /** Called with the value of the item the user picks. The drawer then closes. */
  onSelect?: ((value: string) => void) | undefined
  /** The drawer title; "More" when not set. */
  title?: string | undefined
  /** The element that opens the drawer, such as the More tab. Leave it out to open the drawer with `open`. */
  trigger?: ReactElement | undefined
  /** Whether the drawer is open. Set it with `onOpenChange` to control the drawer. */
  open?: boolean | undefined
  defaultOpen?: boolean | undefined
  onOpenChange?: ((open: boolean) => void) | undefined
  /**
   * Content below the groups, such as a `Switch` for the Notifications setting (d-118). It sits 16 below the last
   * group, as a labelled group does, and is not a page item: a control in it does not close the drawer, and
   * `onSelect` is not called. No footer when not set.
   */
  footer?: ReactNode
}

function DrawerGroup({ group, selected, onSelect }: { group: MoreDrawerGroup; selected: string | undefined; onSelect: ((value: string) => void) | undefined }) {
  const labelId = useId()
  return (
    <Group>
      {group.label === undefined ? null : <GroupLabel id={labelId}>{group.label}</GroupLabel>}
      <List {...(group.label === undefined ? {} : { 'aria-labelledby': labelId })}>
        {group.items.map((item) => {
          const disabled = item.disabled === true
          const button = (
            <Item
              type="button"
              disabled={disabled ? true : undefined}
              aria-current={item.value === selected ? 'page' : undefined}
              onClick={() => {
                onSelect?.(item.value)
              }}
            >
              <Tile aria-hidden="true">{item.icon}</Tile>
              <Body>
                <Label>{item.label}</Label>
                {item.description === undefined ? null : <Description>{item.description}</Description>}
              </Body>
              {disabled || item.count === undefined ? null : <Count>{item.count}</Count>}
              {disabled ? null : (
                <Chevron viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 3.5l4.5 4.5L6 12.5" />
                </Chevron>
              )}
            </Item>
          )
          return <li key={item.value}>{disabled ? button : <BottomSheetClose>{button}</BottomSheetClose>}</li>
        })}
      </List>
    </Group>
  )
}

/**
 * The phone's More drawer: the pages that do not fit in the tab bar, as a
 * bottom sheet with a list of items. Picking an item calls `onSelect` and
 * closes the drawer. The app does the navigation. When it opens, the drawer
 * itself takes the focus, so no item draws a focus ring (Figma M4 draws
 * none); Tab moves to the first item.
 */
export function MoreDrawer({ groups, selected, onSelect, title = 'More', trigger, open, defaultOpen, onOpenChange, footer }: MoreDrawerProps) {
  const hasFooter = footer !== undefined && footer !== null && typeof footer !== 'boolean' && footer !== ''
  return (
    <SizedBottomSheet
      size="lg"
      focusSheet
      title={title}
      trigger={trigger}
      {...(open === undefined ? {} : { open })}
      {...(defaultOpen === undefined ? {} : { defaultOpen })}
      onOpenChange={onOpenChange}
    >
      {groups.map((group, i) => (
        // Labels need not be unique, so the position is the key; the items inside have their values as keys.
        <DrawerGroup key={`group-${String(i)}`} group={group} selected={selected} onSelect={onSelect} />
      ))}
      {hasFooter ? <Footer>{footer}</Footer> : null}
    </SizedBottomSheet>
  )
}
