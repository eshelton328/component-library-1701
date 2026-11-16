import { Tabs } from '@ark-ui/react/tabs'
import { useState, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { workspaceTabs } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(workspaceTabs)
const Root = withProvider(Tabs.Root, 'root')
const Bar = withContext('div', 'bar')
const List = withContext(Tabs.List, 'list')
const Trigger = withContext(Tabs.Trigger, 'trigger')
const Count = withContext('span', 'count')
const Actions = withContext('div', 'actions')
const Content = withContext(Tabs.Content, 'content')

/** One workspace: its tab and the panes it shows. */
export type WorkspaceTab = {
  value: string
  label: string
  /** The number of chats in the workspace, after the label. */
  count?: number | undefined
  /** What the workspace shows below the tabs, usually its split panes. */
  content: ReactNode
}

export type WorkspaceTabsProps = {
  /** The accessible name of the tab list, such as "Workspaces". */
  label: string
  items: readonly WorkspaceTab[]
  /** The selected workspace. Set it with `onValueChange` to control the tabs. */
  value?: string | undefined
  /** The first selected workspace of uncontrolled tabs; the first when not set. */
  defaultValue?: string | undefined
  /** Called with the value of the workspace the user picks. */
  onValueChange?: ((value: string) => void) | undefined
  /** After the tabs, such as the button that starts a chat in the workspace. */
  actions?: ReactNode
}

/**
 * The Workbench's workspace tabs, with the selected workspace's content
 * below them in a 10 px padded area that fills the rest of the height.
 * The arrow keys move between tabs and select them.
 */
export function WorkspaceTabs({ label, items, value, defaultValue, onValueChange, actions }: WorkspaceTabsProps) {
  // Uncontrolled tabs keep their own selection, so that it follows the items:
  // when the selected workspace goes away, the first one is selected.
  const [picked, setPicked] = useState(defaultValue)
  const selected = value ?? (items.some((item) => item.value === picked) ? picked : items[0]?.value)
  return (
    <Root
      // Ark treats an empty string as no value, so each value gets a prefix.
      value={selected === undefined ? null : toArk(selected)}
      onValueChange={(details) => {
        const next = fromArk(details.value)
        if (next === undefined) return
        if (value === undefined) setPicked(next)
        onValueChange?.(next)
      }}
    >
      <Bar>
        <List aria-label={label}>
          {items.map((item) => (
            <Trigger key={item.value} value={toArk(item.value)}>
              {item.label}
              {item.count === undefined ? null : <Count>{item.count}</Count>}
            </Trigger>
          ))}
        </List>
        {actions === undefined || actions === null || actions === false ? null : <Actions>{actions}</Actions>}
      </Bar>
      {items.map((item) => (
        <Content key={item.value} value={toArk(item.value)}>
          {item.content}
        </Content>
      ))}
    </Root>
  )
}

const toArk = (v: string) => `workspace:${v}`
const fromArk = (v: string | null) => (v?.startsWith('workspace:') === true ? v.slice(10) : undefined)
