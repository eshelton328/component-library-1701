import { Menu as ArkMenu } from '@ark-ui/react/menu'
import { Portal } from '@ark-ui/react/portal'
import { useId, useState, type ReactElement, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { menu } from '../../styled-system/recipes'
import { dataAttributesOf } from './data-attributes'
import type { PopoverDataAttributes } from './popover'

const { withRootProvider, withContext } = createSlotRecipeContext(menu)
const Root = withRootProvider(ArkMenu.Root)
const Positioner = withContext(ArkMenu.Positioner, 'positioner')
const Content = withContext(ArkMenu.Content, 'content')
const Item = withContext(ArkMenu.Item, 'item')
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
 * closes the menu and returns the focus to the trigger.
 */
export function Menu({ trigger, items, onSelect, open, onOpenChange, placement = 'bottom-start', heading, width, size, className, ...rest }: MenuProps) {
  const renderEntry = (entry: MenuEntry, i: number) =>
    entry.type === 'separator' ? (
      <Separator key={`separator-${String(i)}`} />
    ) : (
      <Item key={entry.value} value={toArk(entry.value)} valueText={entry.label} disabled={entry.disabled} data-tone={entry.tone}>
        {entry.icon === undefined ? null : <span aria-hidden="true">{entry.icon}</span>}
        <ItemText>{entry.label}</ItemText>
        {entry.trailing === undefined || entry.trailing === null || entry.trailing === false ? null : <ItemTrailing>{entry.trailing}</ItemTrailing>}
      </Item>
    )
  // With a heading, the actions before the first separator form a group that the heading names.
  const firstSeparator = items.findIndex((entry) => entry.type === 'separator')
  const groupEnd = heading === undefined ? 0 : firstSeparator === -1 ? items.length : firstSeparator
  return (
    <Root
      width={width}
      size={size}
      positioning={{ placement, gutter: 4 }}
      {...(open === undefined ? {} : { open })}
      onOpenChange={(details) => {
        onOpenChange?.(details.open)
      }}
      onSelect={(details) => {
        const value = fromArk(details.value)
        if (value !== undefined) onSelect?.(value)
      }}
    >
      <ArkMenu.Trigger asChild>{trigger}</ArkMenu.Trigger>
      <Portal>
        <Positioner>
          <Content {...dataAttributesOf(rest)} {...(className === undefined ? {} : { className })}>
            {heading === undefined ? null : (
              <ItemGroup>
                <ItemGroupLabel>{heading}</ItemGroupLabel>
                {items.slice(0, groupEnd).map(renderEntry)}
              </ItemGroup>
            )}
            {items.slice(groupEnd).map((entry, i) => renderEntry(entry, i + groupEnd))}
          </Content>
        </Positioner>
      </Portal>
    </Root>
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
