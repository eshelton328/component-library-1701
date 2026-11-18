import { Tabs } from '@ark-ui/react/tabs'
import { useState, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { workspaceTabs } from '../../styled-system/recipes'
import { GripIcon } from '../foundations/icons'

const { withProvider, withContext } = createSlotRecipeContext(workspaceTabs)
const Root = withProvider(Tabs.Root, 'root')
const Bar = withContext('div', 'bar')
const List = withContext(Tabs.List, 'list')
const Trigger = withContext(Tabs.Trigger, 'trigger')
const Grip = withContext('span', 'grip')
const Count = withContext('span', 'count')
const Dot = withContext('span', 'dot')
const Hint = withContext('span', 'hint')
const Leading = withContext('div', 'leading')
const Actions = withContext('div', 'actions')
const Trailing = withContext('div', 'trailing')
const Content = withContext(Tabs.Content, 'content')

/** One workspace: its tab and the panes it shows. */
export type WorkspaceTab = {
  value: string
  label: string
  /** The number of chats in the workspace, after the label. */
  count?: number | undefined
  /** A chat in the workspace needs the user. The tab shows an amber dot, and screen readers hear "needs you". */
  needsYou?: boolean | undefined
  /**
   * Shows a grip handle before the label, for workspaces the user can
   * reorder. The library draws the handle only; the app adds the drag and
   * saves the new order.
   */
  draggable?: boolean | undefined
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
  /** Before the tabs, at the start of the bar, such as the button that opens the workspace sidebar. */
  leading?: ReactNode
  /** After the tabs, such as the button that starts a chat in the workspace. */
  actions?: ReactNode
  /** At the right end of the bar, such as the button that resets the pane sizes. */
  trailing?: ReactNode
  /**
   * The height of the bar and the padding above the panes. `md` (the
   * default) pads the bar 12 above and 10 below the tabs and the panes 10 on
   * every side. `compact` is the 52 px bar of the desktop Workbench
   * (Workbench D1): the tabs 12 down, and the panes right under the bar
   * with no top padding, 10 at the sides and bottom.
   */
  size?: 'md' | 'compact' | undefined
}

/**
 * The Workbench's workspace tabs, with the selected workspace's content
 * below them in a 10 px padded area that fills the rest of the height.
 * The arrow keys move between tabs and select them. Uncontrolled tabs keep
 * the selected workspace while others are added, moved or removed.
 */
export function WorkspaceTabs({ label, items, value, defaultValue, onValueChange, leading, actions, trailing, size }: WorkspaceTabsProps) {
  // Uncontrolled tabs store the workspace they show, so adding, moving or
  // restoring other workspaces never changes it. When it goes away, the
  // first workspace is selected and stored.
  const [picked, setPicked] = useState(defaultValue ?? items[0]?.value)
  let selected = value ?? picked
  if (value === undefined && !items.some((item) => item.value === picked)) {
    const first = items[0]?.value
    if (first !== picked) setPicked(first)
    selected = first
  }
  return (
    <Root
      size={size}
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
        {isEmpty(leading) ? null : <Leading>{leading}</Leading>}
        <List aria-label={label}>
          {items.map((item) => (
            <Trigger key={item.value} value={toArk(item.value)}>
              {item.draggable === true ? (
                <Grip>
                  <GripIcon size="12" />
                </Grip>
              ) : null}
              {item.label}
              {item.count === undefined ? null : <Count>{item.count}</Count>}
              {item.needsYou === true ? (
                <>
                  <Dot aria-hidden="true" />
                  <Hint>, needs you</Hint>
                </>
              ) : null}
            </Trigger>
          ))}
        </List>
        {isEmpty(actions) ? null : <Actions>{actions}</Actions>}
        {isEmpty(trailing) ? null : <Trailing>{trailing}</Trailing>}
      </Bar>
      {items.map((item) => (
        <Content key={item.value} value={toArk(item.value)}>
          {item.content}
        </Content>
      ))}
    </Root>
  )
}

const isEmpty = (node: ReactNode) => node === undefined || node === null || node === false
const toArk = (v: string) => `workspace:${v}`
const fromArk = (v: string | null) => (v?.startsWith('workspace:') === true ? v.slice(10) : undefined)
