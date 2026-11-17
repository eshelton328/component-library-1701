import { Menu as ArkMenu, useMenu } from '@ark-ui/react/menu'
import { Portal } from '@ark-ui/react/portal'
import { useEffect, useId, useState, type ReactElement, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { menu } from '../../styled-system/recipes'
import { ChevronRightIcon } from '../foundations/icons'
import { dataAttributesOf } from './data-attributes'
import type { PopoverDataAttributes } from './popover'

const { withRootProvider, withContext } = createSlotRecipeContext(menu)
const Root = withRootProvider(ArkMenu.Root)
const RootProvider = withRootProvider(ArkMenu.RootProvider)
const Positioner = withContext(ArkMenu.Positioner, 'positioner')
const Content = withContext(ArkMenu.Content, 'content')
const Item = withContext(ArkMenu.Item, 'item')
// A row that opens a submenu takes the row's look.
const TriggerItem = withContext(ArkMenu.TriggerItem, 'item')
const ItemIcon = withContext('span', 'itemIcon')
const ItemChevron = withContext('span', 'itemChevron')
const ItemText = withContext(ArkMenu.ItemText, 'itemText')
const Separator = withContext(ArkMenu.Separator, 'separator')
const ItemGroup = withContext(ArkMenu.ItemGroup, 'itemGroup')
const ItemGroupLabel = withContext(ArkMenu.ItemGroupLabel, 'itemGroupLabel')
const ItemBody = withContext('span', 'itemBody')
const ItemDescription = withContext('span', 'itemDescription')
const ItemTrailing = withContext('span', 'itemTrailing')
const Footer = withContext('div', 'footer')
const RadioItemGroup = withContext(ArkMenu.RadioItemGroup, 'itemGroup')
const RadioItem = withContext(ArkMenu.RadioItem, 'item')
const ItemIndicator = withContext(ArkMenu.ItemIndicator, 'itemIndicator')

/** An action in the menu. */
export type MenuAction = {
  type?: 'action' | undefined
  value: string
  label: string
  /** An icon before the label. */
  icon?: ReactNode
  /** `danger` for an action that deletes or cannot be undone. */
  tone?: 'danger' | undefined
  disabled?: boolean | undefined
  /** Text at the end of the row, such as the time a snooze choice wakes the task ("11:40"). It is part of the action's name. */
  trailing?: ReactNode
  /**
   * A list that opens to the right of the row, such as Move to workspace's list of workspaces. The row then opens the
   * list instead of being picked: it draws a chevron at its end in place of `trailing`, and its `tone` is not drawn.
   * A `disabled` row shows the chevron and opens nothing.
   */
  submenu?: MenuSubmenu | undefined
}
/**
 * The list a row of a `Menu` opens to its right, 200 wide (`shell.submenu`), with the menu's `size` and `density`. Its
 * box starts at the row's top and 4 px past the menu's box (Workbench D1 105:473). Right Arrow or Enter on the row
 * opens it and moves the focus to its first action, Left Arrow or Escape closes it and returns the focus to the row,
 * and the pointer opens it on hover, as Ark UI's nested menu does.
 */
export type MenuSubmenu = {
  /** The list's actions. A pick calls the menu's `onSelect` with the action's value, so values must differ from the menu's own. */
  items: readonly MenuEntry[]
  /** Whether the list is open. Set it with `onOpenChange` to control it. */
  open?: boolean | undefined
  onOpenChange?: ((open: boolean) => void) | undefined
  /** The value of the list's highlighted action, as `Menu`'s `highlightedValue`. */
  highlightedValue?: string | null | undefined
  onHighlightChange?: ((value: string | null) => void) | undefined
}
/** A line between two groups of actions. */
export type MenuSeparator = { type: 'separator' }
export type MenuEntry = MenuAction | MenuSeparator

export type MenuProps = {
  /** The element that opens the menu, such as a `Button`. It must pass its props and ref to a DOM element. */
  trigger: ReactElement
  items: readonly MenuEntry[]
  /** Called with the value of the action the user picks. */
  onSelect?: ((value: string) => void) | undefined
  /** Whether the menu is open. Set it with `onOpenChange` to control the menu. */
  open?: boolean | undefined
  onOpenChange?: ((open: boolean) => void) | undefined
  /** Where the menu opens next to the trigger; `bottom-start` when not set. */
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | undefined
  /**
   * A heading over the actions before the first separator, such as "Snooze" over the snooze times. It shows in
   * capitals and names that group of actions for assistive technology.
   */
  heading?: string | undefined
  /**
   * The box width: `sm` 240, `sort` 280 (a menu whose choices have a description, as Inbox D9 Sort) or `md` 320 (the
   * Inbox D12 Snooze menu). When not set, the menu is as wide as its content and at least 240.
   */
  width?: 'sm' | 'sort' | 'md' | undefined
  /** The row size: `md` 32 (the default) with `label` text, or `lg` 44 with `bodyLg` (Regular 15/24) labels and 20 px icons, as the Inbox D12 Snooze menu. */
  size?: 'md' | 'lg' | undefined
  /**
   * The row pitch at `size="md"`. `default` puts the 32 px rows 2 apart with 10 px padding and gap. `compact` puts them
   * edge to edge with 8 px padding and gap, and draws the highlighted row's icon in `fg.accent`, as the Workbench pane
   * and chat actions menus (D1 105:421, D2b 402:5486). `size="lg"` keeps its own pitch.
   */
  density?: 'default' | 'compact' | undefined
  /**
   * The value of the highlighted action, the row filled as the pointer or the arrow keys leave it, such as a design
   * state that shows the row whose submenu is open. `null` highlights none. Set it with `onHighlightChange` to control
   * it; when not set, the menu keeps its own.
   */
  highlightedValue?: string | null | undefined
  /** Called with the value of the action the pointer or the arrow keys highlight, or `null` when none is. */
  onHighlightChange?: ((value: string | null) => void) | undefined
  /** A class added to the menu's box, after its own. */
  className?: string | undefined
} & PopoverDataAttributes

// A note given as `false`, `null` or an empty string is left out, as React leaves it out.
const shown = (node: ReactNode) => node !== undefined && node !== null && typeof node !== 'boolean' && node !== ''

// Ark treats an empty string as no value, so each value gets a prefix.
const toArk = (v: string) => `menu:${v}`
const fromArk = (v: string) => (v.startsWith('menu:') ? v.slice(5) : undefined)

/**
 * A menu of actions that a button opens, such as the chat actions or a row
 * menu. The arrow keys move between actions, Enter picks one, and Escape
 * closes the menu and returns the focus to the trigger. A row with a
 * `submenu` opens a list of more actions to its right.
 */
export function Menu({ trigger, items, onSelect, open, onOpenChange, placement = 'bottom-start', heading, width, size, density, highlightedValue, onHighlightChange, className, ...rest }: MenuProps) {
  const baseId = useId()
  const select = (details: { value: string }) => {
    const value = fromArk(details.value)
    if (value !== undefined) onSelect?.(value)
  }
  return (
    <Root
      width={width}
      size={size}
      density={density}
      positioning={{ placement, gutter: 4 }}
      {...(open === undefined ? {} : { open })}
      {...highlightOf(baseId, items, highlightedValue, onHighlightChange)}
      onOpenChange={(details) => {
        onOpenChange?.(details.open)
      }}
      id={baseId}
      onSelect={select}
    >
      <ArkMenu.Trigger asChild>{trigger}</ArkMenu.Trigger>
      <Portal>
        <Positioner>
          <Content {...dataAttributesOf(rest)} {...(className === undefined ? {} : { className })}>
            <Entries baseId={baseId} items={items} heading={heading} size={size} density={density} onSelect={select} />
          </Content>
        </Positioner>
      </Portal>
    </Root>
  )
}

// Ark names a submenu's row by its trigger id, not by a value, so each row gets an id made from its menu's own React
// id and the row's index, never from values (values joined with "-" can repeat across levels), and the highlighted
// value is mapped to and from it.
const submenuTriggerId = (baseId: string, index: number) => `${baseId}-submenu-${String(index)}`

function highlightOf(baseId: string, items: readonly MenuEntry[], value: string | null | undefined, onChange: ((value: string | null) => void) | undefined) {
  const submenus = new Map<string, string>()
  const triggers = new Map<string, string>()
  items.forEach((entry, index) => {
    if (entry.type === 'separator' || entry.submenu === undefined) return
    submenus.set(submenuTriggerId(baseId, index), entry.value)
    triggers.set(entry.value, submenuTriggerId(baseId, index))
  })
  const toItem = (v: string) => triggers.get(v) ?? toArk(v)
  return {
    ...(value === undefined ? {} : { highlightedValue: value === null ? null : toItem(value) }),
    onHighlightChange: (details: { highlightedValue: string | null }) => {
      const next = details.highlightedValue
      onChange?.(next === null ? null : (submenus.get(next) ?? fromArk(next) ?? null))
    },
  }
}

type SubmenuProps = {
  triggerId: string
  submenu: MenuSubmenu
  row: ReactNode
  size: MenuProps['size']
  density: MenuProps['density']
  onSelect: (details: { value: string }) => void
}

// A submenu level: its own React id names its Ark menu, so its list and items have ids no other level can repeat.
function Submenu({ triggerId, submenu, row, size, density, onSelect }: SubmenuProps) {
  const id = useId()
  const { api, service } = useMenu({
    id,
    ids: { trigger: triggerId },
    // Ark puts a submenu right of its row with no gap; the offset sets Figma's place (D1 105:473): 11 past the row's
    // end (the menu's padding 6 and border 1, then 4) and 7 below its top.
    positioning: { placement: 'right-start', offset: { mainAxis: 11, crossAxis: 7 } },
    ...(submenu.open === undefined ? {} : { open: submenu.open }),
    ...highlightOf(id, submenu.items, submenu.highlightedValue, submenu.onHighlightChange),
    onOpenChange: (details) => {
      submenu.onOpenChange?.(details.open)
    },
    onSelect,
  })
  // Ark closes the whole menu tree on Escape in a submenu. The ARIA menu pattern closes only the submenu and puts the
  // focus back on its row, as Left Arrow does, so this level takes the key before Ark's document listener and sends
  // Left Arrow's event. The window's capture phase runs before the document's.
  const contentId = api.getContentProps().id
  const open = api.open
  useEffect(() => {
    if (!open || contentId === undefined) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const content = document.getElementById(contentId)
      if (content === null || !(event.target instanceof Node) || !content.contains(event.target)) return
      event.preventDefault()
      event.stopPropagation()
      service.send({ type: 'ARROW_LEFT' })
    }
    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true })
    }
  }, [open, contentId, service])
  return (
    <RootProvider value={{ api, service }} width="submenu" size={size} density={density}>
      <TriggerItem>{row}</TriggerItem>
      <Portal>
        <Positioner>
          <Content>
            <Entries baseId={id} items={submenu.items} size={size} density={density} onSelect={onSelect} />
          </Content>
        </Positioner>
      </Portal>
    </RootProvider>
  )
}

type EntriesProps = {
  baseId: string
  items: readonly MenuEntry[]
  heading?: string | undefined
  size: MenuProps['size']
  density: MenuProps['density']
  onSelect: (details: { value: string }) => void
}

function Entries({ baseId, items, heading, size, density, onSelect }: EntriesProps) {
  const renderEntry = (entry: MenuEntry, i: number) => {
    if (entry.type === 'separator') return <Separator key={`separator-${String(i)}`} />
    const icon = entry.icon === undefined ? null : <ItemIcon aria-hidden="true" data-part="item-icon">{entry.icon}</ItemIcon>
    const sub = entry.submenu
    const chevron = (
      <ItemChevron aria-hidden="true" data-part="item-chevron">
        <ChevronRightIcon size="12" />
      </ItemChevron>
    )
    if (sub === undefined) {
      return (
        <Item key={entry.value} value={toArk(entry.value)} valueText={entry.label} disabled={entry.disabled} data-tone={entry.tone}>
          {icon}
          <ItemText>{entry.label}</ItemText>
          {entry.trailing === undefined || entry.trailing === null || entry.trailing === false ? null : <ItemTrailing>{entry.trailing}</ItemTrailing>}
        </Item>
      )
    }
    // Ark's submenu row cannot be disabled, so a disabled one is a disabled action with the chevron, which opens nothing.
    if (entry.disabled === true) {
      return (
        <Item key={entry.value} value={toArk(entry.value)} valueText={entry.label} disabled aria-haspopup="menu">
          {icon}
          <ItemText>{entry.label}</ItemText>
          {chevron}
        </Item>
      )
    }
    return (
      <Submenu
        key={entry.value}
        triggerId={submenuTriggerId(baseId, i)}
        submenu={sub}
        size={size}
        density={density}
        onSelect={onSelect}
        row={
          <>
            {icon}
            <ItemText>{entry.label}</ItemText>
            {chevron}
          </>
        }
      />
    )
  }
  // With a heading, the actions before the first separator form a group that the heading names.
  const firstSeparator = items.findIndex((entry) => entry.type === 'separator')
  const groupEnd = heading === undefined ? 0 : firstSeparator === -1 ? items.length : firstSeparator
  return (
    <>
      {heading === undefined ? null : (
        <ItemGroup>
          <ItemGroupLabel>{heading}</ItemGroupLabel>
          {items.slice(0, groupEnd).map(renderEntry)}
        </ItemGroup>
      )}
      {items.slice(groupEnd).map((entry, i) => renderEntry(entry, i + groupEnd))}
    </>
  )
}

/** A choice in a `RadioMenu`. */
export type RadioMenuOption = {
  value: string
  label: string
  /** A second line under the label that says what the choice does, such as "Most recent activity at the top". It describes the choice for assistive technology. */
  description?: string | undefined
  disabled?: boolean | undefined
}

export type RadioMenuProps = {
  /** The element that opens the menu, such as a `Button`. It must pass its props and ref to a DOM element. */
  trigger: ReactElement
  /** The accessible name of the list of choices, such as "Sort by". */
  label: string
  options: readonly RadioMenuOption[]
  /** The picked value. Set it with `onValueChange` to control the menu. */
  value?: string | undefined
  defaultValue?: string | undefined
  /** Called with the value the user picks. */
  onValueChange?: ((value: string) => void) | undefined
  open?: boolean | undefined
  onOpenChange?: ((open: boolean) => void) | undefined
  /** Where the menu opens next to the trigger; `bottom-start` when not set. */
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | undefined
  /** A heading over the choices, such as "Sort by", shown in capitals. When set, it names the list instead of `label`. */
  heading?: string | undefined
  /** A note at the end under a line, such as "Sorting applies inside each group." It describes the menu. */
  note?: ReactNode
  /**
   * The box width: `sm` 240, `sort` 280 (a menu whose choices have a description, as Inbox D9 Sort) or `md` 320 (the
   * Inbox D12 Snooze menu). When not set, the menu is as wide as its content and at least 240.
   */
  width?: 'sm' | 'sort' | 'md' | undefined
  /** The row size: `md` 32 (the default) with `label` text, or `lg` 44 with `bodyLg` (Regular 15/24) labels and 20 px icons, as the Inbox D12 Snooze menu. */
  size?: 'md' | 'lg' | undefined
  /** A class added to the menu's box, after its own. */
  className?: string | undefined
} & PopoverDataAttributes

/**
 * A menu in which the user picks one value, such as the sort menu. The
 * picked value has a check. Picking a value closes the menu. A choice can
 * have a description line, and the list a heading, as Inbox D9 Sort does.
 */
export function RadioMenu({ trigger, label, options, value, defaultValue, onValueChange, open, onOpenChange, placement = 'bottom-start', heading, note, width, size, className, ...rest }: RadioMenuProps) {
  const [picked, setPicked] = useState(defaultValue)
  const baseId = useId()
  const selected = value ?? picked
  return (
    <Root
      width={width}
      size={size}
      positioning={{ placement, gutter: 4 }}
      {...(open === undefined ? {} : { open })}
      onOpenChange={(details) => {
        onOpenChange?.(details.open)
      }}
    >
      <ArkMenu.Trigger asChild>{trigger}</ArkMenu.Trigger>
      <Portal>
        <Positioner>
          <Content
            {...dataAttributesOf(rest)}
            {...(className === undefined ? {} : { className })}
            {...(shown(note) ? { 'aria-describedby': `${baseId}-note` } : {})}
          >
            <RadioItemGroup
              aria-label={label}
              value={selected === undefined ? '' : toArk(selected)}
              onValueChange={(details) => {
                const next = fromArk(details.value)
                if (next === undefined || next === selected) return
                if (value === undefined) setPicked(next)
                onValueChange?.(next)
              }}
            >
              {heading === undefined ? null : <ItemGroupLabel>{heading}</ItemGroupLabel>}
              {options.map((option, index) => (
                <RadioItem
                  key={option.value}
                  value={toArk(option.value)}
                  valueText={option.label}
                  disabled={option.disabled}
                  closeOnSelect
                  {...(option.description === undefined
                    ? {}
                    : {
                        // The name is the label alone; the description describes the choice.
                        'aria-labelledby': `${baseId}-${String(index)}-label`,
                        'aria-describedby': `${baseId}-${String(index)}-description`,
                        'data-has-description': '',
                      })}
                >
                  {option.description === undefined ? (
                    <ItemText>{option.label}</ItemText>
                  ) : (
                    <ItemBody>
                      <ItemText id={`${baseId}-${String(index)}-label`}>{option.label}</ItemText>
                      <ItemDescription id={`${baseId}-${String(index)}-description`}>{option.description}</ItemDescription>
                    </ItemBody>
                  )}
                  <ItemIndicator>
                    <Check />
                  </ItemIndicator>
                </RadioItem>
              ))}
            </RadioItemGroup>
            {shown(note) ? <Footer id={`${baseId}-note`}>{note}</Footer> : null}
          </Content>
        </Positioner>
      </Portal>
    </Root>
  )
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  )
}
