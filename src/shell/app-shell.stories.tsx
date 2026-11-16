import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
import { Container } from '../controls/layout'
import { AppShell } from './app-shell'

// Stand-ins for the nav rail, panels and tab bar, which are Parts or not merged yet.
const desktopFrame = css({ h: 'shell.dialogLg' })
const narrowFrame = css({ h: 'shell.dialogLg', w: 'shell.popoverLg' })
const pane = css({ flex: '1', bg: 'surface.pane', borderWidth: 'default', borderColor: 'border.default', textStyle: 'body', color: 'fg.default', p: '12' })
const chrome = css({ flex: '1', bg: 'surface.chrome', textStyle: 'label', color: 'fg.default', p: '8' })
const tabs = css({ h: 'shell.tabBar', bg: 'surface.chrome', borderTopWidth: 'default', borderColor: 'border.default', textStyle: 'label', color: 'fg.default', p: '8' })
const text = css({ textStyle: 'body', color: 'fg.default' })

const lines = Array.from({ length: 60 }, (_, i) => `Line ${String(i + 1)} of the task`)

function Desktop() {
  return (
    <div className={desktopFrame}>
      <AppShell
        rail={<nav aria-label="Main" className={chrome}>Rail</nav>}
        list={<section aria-label="Inbox" className={pane}>Inbox list</section>}
        detail={
          <Container>
            <h1 className={text}>Approve the release plan</h1>
            <Button>Start</Button>
            {lines.map((l) => (
              <p key={l} className={text}>
                {l}
              </p>
            ))}
          </Container>
        }
        side={<section aria-label="Discussion" className={pane}>Discussion</section>}
        tabBar={<nav aria-label="Tabs">Tab bar</nav>}
      />
    </div>
  )
}

const rect = (el: Element) => el.getBoundingClientRect()
const slot = (root: HTMLElement, name: string) => {
  const el = root.querySelector(`.app-shell__${name}`)
  if (!(el instanceof HTMLElement)) throw new Error(`no ${name}`)
  return el
}

const meta = {
  title: 'Layout/App shell',
  component: Desktop,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const frame = canvasElement.querySelector('.backdrop')?.parentElement
    if (!(frame instanceof HTMLElement)) throw new Error('no frame')
    // Rail 64, list 420, side 380, detail the rest; they abut and fill the height.
    const rail = slot(canvasElement, 'rail')
    const list = slot(canvasElement, 'list')
    const detail = canvas.getByRole('main')
    const side = canvas.getByRole('complementary')
    await expect(Math.round(rect(rail).width)).toBe(64)
    await expect(Math.round(rect(list).width)).toBe(420)
    await expect(Math.round(rect(side).width)).toBe(380)
    await expect(Math.round(rect(detail).width)).toBe(Math.round(rect(frame).width) - 64 - 420 - 380)
    await expect(Math.round(rect(list).left)).toBe(Math.round(rect(rail).right))
    await expect(Math.round(rect(detail).left)).toBe(Math.round(rect(list).right))
    await expect(Math.round(rect(side).left)).toBe(Math.round(rect(detail).right))
    for (const el of [rail, list, detail, side]) await expect(Math.round(rect(el).height)).toBe(Math.round(rect(frame).height))
    // The rail's and list's content fill their slot.
    await expect(Math.round(rect(canvas.getByRole('navigation', { name: 'Main' })).height)).toBe(Math.round(rect(frame).height))
    // The desktop shows no tab bar, and sits on the desktop backdrop.
    await expect(canvas.queryByRole('navigation', { name: 'Tabs' })).toBeNull()
    await expect(canvasElement.querySelector('.backdrop--size_desktop')).not.toBeNull()
    // The detail pane scrolls on its own; the list does not move.
    await expect(detail.scrollHeight).toBeGreaterThan(detail.clientHeight)
    const top = rect(list).top
    detail.scrollTop = 300
    await expect(detail.scrollTop).toBe(300)
    await expect(rect(list).top).toBe(top)
  },
} satisfies Meta<typeof Desktop>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

/** The Workbench widths: the 330 sidebar and the 420 subagents pane; a slot left out takes no room. */
export const Widths: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <div className={desktopFrame}>
      <AppShell
        listWidth="sidebar"
        sideWidth="wide"
        list={<section aria-label="Workspaces" className={pane}>Sidebar</section>}
        detail={<p className={text}>Chat</p>}
        side={<section aria-label="Subagents" className={pane}>Subagents</section>}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(Math.round(rect(slot(canvasElement, 'list')).width)).toBe(330)
    await expect(Math.round(rect(canvas.getByRole('complementary')).width)).toBe(420)
    // No rail: the sidebar starts at the left edge.
    await expect(canvasElement.querySelector('.app-shell__rail')).toBeNull()
    await expect(Math.round(rect(slot(canvasElement, 'list')).left)).toBe(Math.round(rect(slot(canvasElement, 'root')).left))
  },
}

function Narrow({ size, view, withTabBar }: { size: 'tablet' | 'phone'; view: 'list' | 'detail'; withTabBar: boolean }) {
  return (
    <div className={narrowFrame} data-testid={`${size}-${view}-${String(withTabBar)}`}>
      <AppShell
        size={size}
        view={view}
        rail={<nav aria-label="Main">Rail</nav>}
        list={<section aria-label="Inbox" className={pane}>Inbox list</section>}
        detail={<section aria-label="Task" className={pane}>Task page</section>}
        side={<aside aria-label="Discussion">Discussion</aside>}
        tabBar={withTabBar ? <nav aria-label="Tabs" className={tabs}>Tab bar</nav> : null}
      />
    </div>
  )
}

const box = (root: HTMLElement) => {
  const el = root.querySelector('[data-testid]')
  if (!(el instanceof HTMLElement)) throw new Error('no frame')
  return el
}

/** Tablet: one pane at a time above the tab bar; no rail and no side panel. */
export const Tablet: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => <Narrow size="tablet" view="list" withTabBar />,
  play: async ({ canvasElement }) => {
    const tablet = within(canvasElement)
    // The list fills the width; the detail, rail and side panel are not shown.
    await expect(tablet.getByRole('region', { name: 'Inbox' })).toBeVisible()
    await expect(tablet.queryByRole('region', { name: 'Task' })).toBeNull()
    await expect(tablet.queryByRole('navigation', { name: 'Main' })).toBeNull()
    await expect(tablet.queryByText('Discussion')).toBeNull()
    await expect(canvasElement.querySelector('.backdrop--size_tablet')).not.toBeNull()
    // The tab bar sits at the bottom, below the pane, full width.
    const frame = rect(box(canvasElement))
    const bar = rect(tablet.getByRole('navigation', { name: 'Tabs' }))
    await expect(Math.round(bar.bottom)).toBe(Math.round(frame.bottom))
    await expect(Math.round(bar.width)).toBe(Math.round(frame.width))
    await expect(Math.round(rect(tablet.getByRole('main')).bottom)).toBe(Math.round(bar.top))
    await expect(canvasElement.querySelector('.app-shell__safeArea')).toBeNull()
  },
}

/** Phone with `view="detail"`: the detail fills the screen above the tab bar. */
export const Phone: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => <Narrow size="phone" view="detail" withTabBar />,
  play: async ({ canvasElement }) => {
    const phone = within(canvasElement)
    await expect(phone.getByRole('region', { name: 'Task' })).toBeVisible()
    await expect(phone.queryByRole('region', { name: 'Inbox' })).toBeNull()
    await expect(canvasElement.querySelector('.backdrop--size_phone')).not.toBeNull()
    await expect(canvasElement.querySelector('.app-shell__safeArea')).toBeNull()
  },
}

/** Phone with no tab bar, as inside a chat: the 34 px home-indicator area stays clear. */
export const PhoneNoTabBar: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => <Narrow size="phone" view="detail" withTabBar={false} />,
  play: async ({ canvasElement }) => {
    const bare = box(canvasElement)
    const safe = bare.querySelector('.app-shell__safeArea')
    if (!(safe instanceof HTMLElement)) throw new Error('no safe area')
    await expect(Math.round(rect(safe).height)).toBe(34)
    await expect(Math.round(rect(safe).bottom)).toBe(Math.round(rect(bare).bottom))
    await expect(Math.round(rect(within(bare).getByRole('main')).bottom)).toBe(Math.round(rect(safe).top))
  },
}

/** A list left out on a phone shows the detail, whatever `view` says. */
export const NoList: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <div className={narrowFrame}>
      <AppShell size="phone" detail={<Button>Only the detail</Button>} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Only the detail' })).toBeVisible()
  },
}
