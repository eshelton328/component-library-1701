import { Menu as ArkMenu } from '@ark-ui/react/menu'
import { Portal } from '@ark-ui/react/portal'
import { useState, type ReactElement, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { menu } from '../../styled-system/recipes'

const { withRootProvider, withContext } = createSlotRecipeContext(menu)
const Root = withRootProvider(ArkMenu.Root)
const Positioner = withContext(ArkMenu.Positioner, 'positioner')
const Content = withContext(ArkMenu.Content, 'content')
const Item = withContext(ArkMenu.Item, 'item')
const ItemText = withContext(ArkMenu.ItemText, 'itemText')
const Separator = withContext(ArkMenu.Separator, 'separator')
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
}

// Ark treats an empty string as no value, so each value gets a prefix.
const toArk = (v: string) => `menu:${v}`
const fromArk = (v: string) => (v.startsWith('menu:') ? v.slice(5) : undefined)

/**
 * A menu of actions that a button opens, such as the chat actions or a row
 * menu. The arrow keys move between actions, Enter picks one, and Escape
 * closes the menu and returns the focus to the trigger.
 */
export function Menu({ trigger, items, onSelect, open, onOpenChange, placement = 'bottom-start' }: MenuProps) {
  return (
    <Root
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
          <Content>
            {items.map((entry, i) =>
              entry.type === 'separator' ? (
                <Separator key={`separator-${String(i)}`} />
              ) : (
                <Item key={entry.value} value={toArk(entry.value)} valueText={entry.label} disabled={entry.disabled} data-tone={entry.tone}>
                  {entry.icon === undefined ? null : <span aria-hidden="true">{entry.icon}</span>}
                  <ItemText>{entry.label}</ItemText>
                </Item>
              ),
            )}
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
}

/**
 * A menu in which the user picks one value, such as the sort menu. The
 * picked value has a check. Picking a value closes the menu.
 */
export function RadioMenu({ trigger, label, options, value, defaultValue, onValueChange, open, onOpenChange, placement = 'bottom-start' }: RadioMenuProps) {
  const [picked, setPicked] = useState(defaultValue)
  const selected = value ?? picked
  return (
    <Root
      positioning={{ placement, gutter: 4 }}
      {...(open === undefined ? {} : { open })}
      onOpenChange={(details) => {
        onOpenChange?.(details.open)
      }}
    >
      <ArkMenu.Trigger asChild>{trigger}</ArkMenu.Trigger>
      <Portal>
        <Positioner>
          <Content>
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
              {options.map((option) => (
                <RadioItem
                  key={option.value}
                  value={toArk(option.value)}
                  valueText={option.label}
                  disabled={option.disabled}
                  closeOnSelect
                >
                  <ItemText>{option.label}</ItemText>
                  <ItemIndicator>
                    <Check />
                  </ItemIndicator>
                </RadioItem>
              ))}
            </RadioItemGroup>
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
