import type { ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { appShell, type AppShellVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'
import { Backdrop } from './backdrop'

const { withProvider, withContext } = createSlotRecipeContext(appShell)
const Root = withProvider('div', 'root')
const Rail = withContext('div', 'rail')
const List = withContext('div', 'list')
const Detail = withContext('main', 'detail')
const Side = withContext('aside', 'side')
const TabBar = withContext('div', 'tabBar')
const SafeArea = withContext('div', 'safeArea')

// A slot given as `false`, `null` or an empty string is left out, as React leaves it out.
const shown = (node: ReactNode) => node !== undefined && node !== null && typeof node !== 'boolean' && node !== ''

export type AppShellProps = Scalar<AppShellVariantProps> & {
  /** The desktop nav rail. Shown only at `size="desktop"`. */
  rail?: ReactNode
  /** The list pane, such as the Inbox list or the Workbench sidebar. */
  list?: ReactNode
  /** The detail pane: the open item. It takes the rest of the width and scrolls. */
  detail?: ReactNode
  /** The side panel, such as the side chat. Shown only at `size="desktop"`; on a tablet or phone, open it as a bottom sheet. */
  side?: ReactNode
  /** The tablet and phone tab bar. Not shown at `size="desktop"`. */
  tabBar?: ReactNode
  /** On a tablet or phone, which pane fills the screen: `list` (the default) or `detail`. With no list, the detail shows. */
  view?: 'list' | 'detail' | undefined
}

/**
 * The frame that pages sit in, on the `Backdrop`. `size` picks the layout,
 * because the library has no breakpoint tokens: `desktop` (the default)
 * places the rail, the list pane, the detail pane and the side panel side
 * by side; `tablet` and `phone` show one pane at a time above the tab bar.
 * `listWidth` is `list` (420, the default) or `sidebar` (330, Workbench);
 * `sideWidth` is `side` (380, the default) or `wide` (420). The slots bring
 * their own surfaces. It is as tall as its parent.
 */
export function AppShell({ size, listWidth, sideWidth, rail, list, detail, side, tabBar, view = 'list' }: AppShellProps) {
  const desktop = size === undefined || size === 'desktop'
  if (desktop) {
    return (
      <Backdrop size="desktop">
        <Root size="desktop" listWidth={listWidth} sideWidth={sideWidth}>
          {shown(rail) ? <Rail>{rail}</Rail> : null}
          {shown(list) ? <List>{list}</List> : null}
          <Detail>{detail}</Detail>
          {shown(side) ? <Side>{side}</Side> : null}
        </Root>
      </Backdrop>
    )
  }
  const pane = view === 'detail' || !shown(list) ? detail : list
  const hasTabBar = shown(tabBar)
  return (
    <Backdrop size={size}>
      <Root size={size} listWidth={listWidth} sideWidth={sideWidth}>
        <Detail>{pane}</Detail>
        {hasTabBar ? <TabBar>{tabBar}</TabBar> : null}
        {!hasTabBar && size === 'phone' ? <SafeArea aria-hidden="true" /> : null}
      </Root>
    </Backdrop>
  )
}
