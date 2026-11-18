import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
import { Container } from '../controls/layout'
import { ScrollFrame } from '../controls/scroll-frame'
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

const slotOf = (root: HTMLElement, className: string) => {
  const el = root.querySelector(`.${className}`)
  if (!(el instanceof HTMLElement)) throw new Error(`no ${className}`)
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
    // With only text in it, the detail takes focus, so the keyboard can scroll it.
    await expect(detail).toHaveAttribute('tabindex', '0')
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
    await expect(Math.round(rect(slot(canvasElement, 'list')).width)).toBe(328)
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
    await expect(Math.round(rect(tablet.getByRole('region', { name: 'Inbox' })).width)).toBe(Math.round(rect(box(canvasElement)).width))
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

// The iPad screen of Workbench T2b (744 x 1133). The frame fills the viewport, so the shell is the screen.
const tabletScreen = { t02b: { name: 'Tablet (T2b)', styles: { width: '744px', height: '1133px' } } }
const screenFrame = css({ display: 'flex', flexDirection: 'column', h: 'dvh' })

function TabletChat({ withTabBar }: { withTabBar: boolean }) {
  return (
    <div className={screenFrame} data-testid="tablet">
      <AppShell
        size="tablet"
        view="detail"
        list={<section aria-label="Workspaces" className={pane}>Workspaces</section>}
        detail={<section aria-label="Chat" className={pane}>Chat with its composer at the foot</section>}
        tabBar={withTabBar ? <nav aria-label="Tabs" className={tabs}>Tab bar</nav> : null}
      />
    </div>
  )
}

const tabletParts = (root: HTMLElement) => {
  const canvas = within(root)
  return { canvas, shell: rect(slot(root, 'root')), detail: rect(canvas.getByRole('main')), content: rect(canvas.getByRole('region', { name: 'Chat' })) }
}

const tabletNoTabBar: StoryObj<typeof meta> = {
  render: () => <TabletChat withTabBar={false} />,
  parameters: { viewport: { options: tabletScreen } },
  play: async ({ canvasElement }) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([744, 1133])
    const { shell, detail, content } = tabletParts(canvasElement)
    await expect(Math.round(shell.height)).toBe(1133)
    // The chat ends 34 (shell.safeAreaBottom) over the screen's end, as on the phone; Figma's 37 (402:5783) is off the token.
    const safeArea = getComputedStyle(document.documentElement).getPropertyValue('--sizes-shell-safe-area-bottom').trim()
    await expect(safeArea).toBe('34px')
    await expect(Math.round(shell.bottom - content.bottom)).toBe(34)
    await expect(Math.round(detail.bottom)).toBe(Math.round(content.bottom))
    const safe = slot(canvasElement, 'safeArea')
    await expect(safe).toHaveAttribute('aria-hidden', 'true')
    await expect(Math.round(rect(safe).top)).toBe(Math.round(detail.bottom))
    await expect(Math.round(rect(safe).bottom)).toBe(Math.round(shell.bottom))
  },
}

/** Tablet with no tab bar, as inside a chat (Workbench T2b): the 34 px home-indicator area stays clear under the chat. */
export const TabletNoTabBarDark: StoryObj<typeof meta> = { ...tabletNoTabBar, globals: { mode: 'dark', viewport: { value: 't02b' } } }
export const TabletNoTabBarLight: StoryObj<typeof meta> = { ...tabletNoTabBar, globals: { mode: 'light', viewport: { value: 't02b' } } }

const tabletTabBar: StoryObj<typeof meta> = {
  render: () => <TabletChat withTabBar />,
  parameters: { viewport: { options: tabletScreen } },
  play: async ({ canvasElement }) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([744, 1133])
    const { canvas, shell, detail, content } = tabletParts(canvasElement)
    const bar = rect(canvas.getByRole('navigation', { name: 'Tabs' }))
    // As before: the 77 px bar ends at the screen's end and the chat ends at its top, with no safe area.
    await expect(Math.round(bar.height)).toBe(77)
    await expect(Math.round(bar.bottom)).toBe(Math.round(shell.bottom))
    await expect(Math.round(detail.bottom)).toBe(Math.round(bar.top))
    await expect(Math.round(content.bottom)).toBe(Math.round(bar.top))
    await expect(canvasElement.querySelector('.app-shell__safeArea')).toBeNull()
  },
}

/** Tablet with a tab bar at 744 x 1133: the chat ends at the bar's top, as it always has. */
export const TabletTabBarDark: StoryObj<typeof meta> = { ...tabletTabBar, globals: { mode: 'dark', viewport: { value: 't02b' } } }
export const TabletTabBarLight: StoryObj<typeof meta> = { ...tabletTabBar, globals: { mode: 'light', viewport: { value: 't02b' } } }

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

function Switching() {
  const [view, setView] = useState<'list' | 'detail'>('list')
  return (
    <div className={narrowFrame}>
      <AppShell
        size="phone"
        view={view}
        list={<input aria-label="Note" />}
        detail={<input aria-label="Note" />}
        tabBar={
          <Button
            onClick={() => {
              setView('detail')
            }}
          >
            Open
          </Button>
        }
      />
    </div>
  )
}

/** Switching from list to detail mounts the detail afresh, so the list's state never shows in it. */
export const SwitchView: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => <Switching />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('textbox', { name: 'Note' }), 'list-only draft')
    await userEvent.click(canvas.getByRole('button', { name: 'Open' }))
    await expect(canvas.getByRole('textbox', { name: 'Note' })).toHaveValue('')
  },
}

/** An empty array or an empty fragment counts as no slot: the phone shows the detail and keeps the safe area. */
export const EmptySlots: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <div className={narrowFrame}>
      <AppShell size="phone" list={[]} detail={<p className={text}>The detail</p>} tabBar={<>{false}</>} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('The detail')).toBeVisible()
    await expect(canvasElement.querySelector('.app-shell__safeArea')).not.toBeNull()
    await expect(canvasElement.querySelector('.app-shell__tabBar')).toBeNull()
  },
}

// A phone screen. No token is 390 x 844, so it takes the narrow width and the 748 detail height.
const phoneFrame = css({ display: 'flex', flexDirection: 'column', h: 'shell.detail', w: 'shell.popoverLg' })
const startBar = css({ px: '16' })
const frameBody = css({ px: '16', gap: '8' })
// A Start button that sticks at the foot of the body, above the tab bar, as the-bridge's DetailFrame draws it.
const stickyStart = css({ position: 'sticky', bottom: 'var(--scroll-frame-inset, 0px)', bg: 'surface.pane' })
const listLines = Array.from({ length: 40 }, (_, i) => `Task ${String(i + 1)}`)
// A bright, opaque block in the page, to scroll under the tab bar: it must not show through the bar.
const brightBlock = css({ h: 'shell.tabBar', bg: 'accent.default', flexShrink: '0' })

function PhoneScreen({ content, tabBarOverlay }: { content: 'list' | 'block' | 'frame' | 'body' | 'sticky'; tabBarOverlay?: boolean }) {
  const detail =
    content === 'block' ? (
      <Container>
        {listLines.slice(0, 36).map((l) => (
          <p key={l} className={text}>
            {l}
          </p>
        ))}
        <div className={brightBlock} data-testid="bright" />
        {listLines.slice(36).map((l) => (
          <p key={l} className={text}>
            {l}
          </p>
        ))}
      </Container>
    ) : content === 'list' ? (
      <Container>
        {listLines.map((l) => (
          <p key={l} className={text}>
            {l}
          </p>
        ))}
        <Button>Open the last task</Button>
      </Container>
    ) : (
      <ScrollFrame
        bodyClassName={frameBody}
        footer={
          content === 'frame' ? (
            <div className={startBar}>
              <Button variant="primary">Start</Button>
            </div>
          ) : undefined
        }
      >
        {lines.map((l) => (
          <p key={l} className={text}>
            {l}
          </p>
        ))}
        {content === 'body' ? <Button>Open the last line</Button> : null}
        {content === 'sticky' ? (
          <div className={stickyStart}>
            <Button variant="primary">Start</Button>
          </div>
        ) : null}
      </ScrollFrame>
    )
  return (
    <div className={phoneFrame} data-testid="phone">
      <AppShell size="phone" view="detail" tabBarOverlay={tabBarOverlay} detail={detail} tabBar={<nav aria-label="Tabs" className={tabs}>Tab bar</nav>} />
    </div>
  )
}

const phoneParts = (root: HTMLElement) => {
  const canvas = within(root)
  return { canvas, phone: rect(canvas.getByTestId('phone')), detail: canvas.getByRole('main'), bar: rect(canvas.getByRole('navigation', { name: 'Tabs' })) }
}

// Focus the page's last control while it sits in the scroller's view but under the bar, as Tab reaches it: the
// browser scrolls only a control that is out of view, so without the scroller's scroll padding it stays hidden.
const focusClearOfBar = async (scroller: HTMLElement, control: HTMLElement, barTop: number) => {
  scroller.scrollTop = 0
  scroller.scrollTop = rect(control).bottom - rect(scroller).bottom + 8
  await expect(rect(control).top).toBeGreaterThanOrEqual(barTop)
  await expect(rect(control).bottom).toBeLessThanOrEqual(rect(scroller).bottom)
  control.focus()
  await expect(control).toHaveFocus()
  await expect(rect(control).bottom).toBeLessThanOrEqual(barTop)
}

const scrollToEnd = (el: HTMLElement) => {
  el.scrollTop = el.scrollHeight
  el.dispatchEvent(new Event('scroll'))
}

const overlayList: StoryObj<typeof meta> = {
  render: () => <PhoneScreen content="list" tabBarOverlay />,
  play: async ({ canvasElement }) => {
    const { canvas, phone, detail, bar } = phoneParts(canvasElement)
    // The 77 px bar lies over the bottom of the detail, which runs to the bottom of the shell.
    await expect(Math.round(bar.height)).toBe(77)
    await expect(Math.round(bar.bottom)).toBe(Math.round(phone.bottom))
    await expect(Math.round(rect(detail).bottom)).toBe(Math.round(phone.bottom))
    await expect(Math.round(rect(detail).top)).toBe(Math.round(phone.top))
    // The detail scrolls; at its end the last task sits above the bar, not under it.
    await expect(detail.scrollHeight).toBeGreaterThan(detail.clientHeight)
    // Focus on the last control, hidden under the bar, brings it into view above the bar.
    await focusClearOfBar(detail, canvas.getByRole('button', { name: 'Open the last task' }), bar.top)
    scrollToEnd(detail)
    await expect(detail.scrollTop).toBeGreaterThan(0)
    await expect(rect(canvas.getByText('Task 40')).bottom).toBeLessThanOrEqual(bar.top)
    // Only the detail's own child gets the inset: a ScrollFrame deeper in the page (here a task line's place) keeps 0.
    await expect(getComputedStyle(canvas.getByText('Task 1')).getPropertyValue('--app-shell-tab-bar-inset')).toBe('0px')
    await expect(getComputedStyle(canvas.getByText('Task 1')).getPropertyValue('--app-shell-tab-bar-spacer')).toBe('none')
  },
}

/** Phone with `tabBarOverlay`: the tab bar lies over the page, and the page's last item scrolls above it (Toolkit M02). */
export const OverlayListDark: StoryObj<typeof meta> = { ...overlayList, globals: { mode: 'dark' } }
export const OverlayListLight: StoryObj<typeof meta> = { ...overlayList, globals: { mode: 'light' } }

const overlayFrame: StoryObj<typeof meta> = {
  render: () => <PhoneScreen content="frame" tabBarOverlay />,
  play: async ({ canvasElement }) => {
    const { canvas, phone, detail, bar } = phoneParts(canvasElement)
    const frame = slotOf(canvasElement, 'scroll-frame__root')
    const body = slotOf(canvasElement, 'scroll-frame__body')
    const start = rect(canvas.getByRole('button', { name: 'Start' }))
    // The frame reaches under the bar to the bottom of the shell; the detail itself does not scroll.
    await expect(Math.round(rect(frame).bottom)).toBe(Math.round(phone.bottom))
    await expect(detail.scrollHeight).toBe(detail.clientHeight)
    // The sticky Start button sits just above the bar.
    await expect(start.bottom).toBeLessThanOrEqual(bar.top)
    await expect(Math.round(start.bottom)).toBe(Math.round(bar.top))
    // At the body's end, its last line is above the Start button.
    await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
    scrollToEnd(body)
    await expect(body.scrollTop).toBeGreaterThan(0)
    const last = rect(canvas.getByText('Line 60 of the task'))
    await expect(last.bottom).toBeLessThanOrEqual(start.top)
    await expect(last.top).toBeGreaterThanOrEqual(rect(body).top)
  },
}

/** Phone with `tabBarOverlay` and a `ScrollFrame` page: its sticky Start button sits just above the tab bar (Toolkit M20, M22). */
export const OverlayFrameDark: StoryObj<typeof meta> = { ...overlayFrame, globals: { mode: 'dark' } }
export const OverlayFrameLight: StoryObj<typeof meta> = { ...overlayFrame, globals: { mode: 'light' } }

const overlayBody: StoryObj<typeof meta> = {
  render: () => <PhoneScreen content="body" tabBarOverlay />,
  play: async ({ canvasElement }) => {
    const { canvas, phone, bar } = phoneParts(canvasElement)
    const body = slotOf(canvasElement, 'scroll-frame__body')
    // With no footer, the body runs under the bar, and its last line scrolls above it.
    await expect(Math.round(rect(body).bottom)).toBe(Math.round(phone.bottom))
    // Focus on the last control, hidden under the bar, brings it into view above the bar.
    await focusClearOfBar(body, canvas.getByRole('button', { name: 'Open the last line' }), bar.top)
    scrollToEnd(body)
    await expect(body.scrollTop).toBeGreaterThan(0)
    await expect(rect(canvas.getByText('Line 60 of the task')).bottom).toBeLessThanOrEqual(bar.top)
  },
}

/** Phone with `tabBarOverlay` and a `ScrollFrame` page with no footer: the body's last line scrolls above the tab bar. */
export const OverlayBodyDark: StoryObj<typeof meta> = { ...overlayBody, globals: { mode: 'dark' } }
export const OverlayBodyLight: StoryObj<typeof meta> = { ...overlayBody, globals: { mode: 'light' } }

const overlayStickyInBody: StoryObj<typeof meta> = {
  render: () => <PhoneScreen content="sticky" tabBarOverlay />,
  play: async ({ canvasElement }) => {
    const { canvas, phone, bar } = phoneParts(canvasElement)
    const body = slotOf(canvasElement, 'scroll-frame__body')
    const start = () => rect(canvas.getByRole('button', { name: 'Start' }))
    // The body runs under the bar; the Start that sticks at --scroll-frame-inset sits at the bar's top, not under it.
    await expect(Math.round(rect(body).bottom)).toBe(Math.round(phone.bottom))
    await expect(getComputedStyle(body).getPropertyValue('--scroll-frame-inset')).toBe('77px')
    await expect(start().bottom).toBeLessThanOrEqual(bar.top)
    await expect(Math.round(start().bottom)).toBe(Math.round(bar.top))
    // At the body's end, its last line is above Start, and Start is still above the bar.
    scrollToEnd(body)
    await expect(body.scrollTop).toBeGreaterThan(0)
    await expect(rect(canvas.getByText('Line 60 of the task')).bottom).toBeLessThanOrEqual(start().top)
    await expect(start().bottom).toBeLessThanOrEqual(bar.top)
  },
}

/** Phone with `tabBarOverlay` and a Start that sticks inside the `ScrollFrame` body at `--scroll-frame-inset`: it stays above the tab bar. */
export const OverlayStickyInBodyDark: StoryObj<typeof meta> = { ...overlayStickyInBody, globals: { mode: 'dark' } }
export const OverlayStickyInBodyLight: StoryObj<typeof meta> = { ...overlayStickyInBody, globals: { mode: 'light' } }

const tabBarBelow: StoryObj<typeof meta> = {
  render: () => <PhoneScreen content="frame" />,
  play: async ({ canvasElement }) => {
    const { canvas, phone, detail, bar } = phoneParts(canvasElement)
    // Not set, the bar sits below the detail, which ends at its top and has no end padding.
    await expect(Math.round(bar.bottom)).toBe(Math.round(phone.bottom))
    await expect(Math.round(rect(detail).bottom)).toBe(Math.round(bar.top))
    await expect(getComputedStyle(detail).paddingBottom).toBe('0px')
    await expect(getComputedStyle(slotOf(canvasElement, 'app-shell__tabBar')).position).toBe('static')
    // The frame fills the detail, with its footer at the detail's bottom, as before.
    const frame = slotOf(canvasElement, 'scroll-frame__root')
    await expect(Math.round(rect(frame).bottom)).toBe(Math.round(rect(detail).bottom))
    await expect(Math.round(rect(canvas.getByRole('button', { name: 'Start' })).bottom)).toBe(Math.round(rect(detail).bottom))
  },
}

/** Phone with no `tabBarOverlay`: the tab bar sits below the page, as it always has. */
export const TabBarBelowDark: StoryObj<typeof meta> = { ...tabBarBelow, globals: { mode: 'dark' } }
export const TabBarBelowLight: StoryObj<typeof meta> = { ...tabBarBelow, globals: { mode: 'light' } }

type Rgba = { r: number; g: number; b: number; a: number }

// A computed background colour as numbers: Chromium writes rgb(), rgba() or, for a token in another space, color(srgb …).
const parseColor = (value: string): Rgba => {
  const nums = (value.match(/-?[\d.]+(e-?\d+)?/g) ?? []).map(Number)
  const [x = 0, y = 0, z = 0, a = 1] = nums
  if (value.startsWith('color(srgb')) return { r: x * 255, g: y * 255, b: z * 255, a }
  if (value.startsWith('rgb')) return { r: x, g: y, b: z, a }
  throw new Error(`unexpected colour ${value}`)
}

// Lay `under` beneath `top` (source-over), as the browser paints a translucent fill over what is behind it.
const over = (top: Rgba, under: Rgba): Rgba => {
  const a = top.a + under.a * (1 - top.a)
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 }
  const mix = (t: number, u: number) => (t * top.a + u * under.a * (1 - top.a)) / a
  return { r: mix(top.r, under.r), g: mix(top.g, under.g), b: mix(top.b, under.b), a }
}

// Paint the background fills at a point from the top down, as far as the first element of `page`, and return the
// colour they make together. Its alpha is 1 when nothing of the page can show through.
const fillAbovePage = (x: number, y: number, page: HTMLElement): Rgba => {
  let paint: Rgba = { r: 0, g: 0, b: 0, a: 0 }
  for (const el of document.elementsFromPoint(x, y)) {
    if (page.contains(el)) break
    const style = getComputedStyle(el)
    // Only a flat fill is counted; a gradient layer would need the pixels.
    if (style.backgroundImage !== 'none') throw new Error(`${el.className} has a background image`)
    paint = over(paint, parseColor(style.backgroundColor))
  }
  return paint
}

const overlayOpaque: StoryObj<typeof meta> = {
  render: () => <PhoneScreen content="block" tabBarOverlay />,
  play: async ({ canvasElement }) => {
    const { canvas, detail, bar } = phoneParts(canvasElement)
    const nav = canvas.getByRole('navigation', { name: 'Tabs' })
    const block = canvas.getByTestId('bright')
    // Scroll the bright block in the page under the bar.
    detail.scrollTop += rect(block).top - bar.top
    await expect(Math.round(rect(block).top)).toBe(Math.round(bar.top))
    const x = bar.left + bar.width / 2
    const y = bar.top + bar.height / 2
    await expect(document.elementsFromPoint(x, y)).toContain(block)
    // The bar itself keeps its translucent surface.chrome fill (0.96).
    const chrome = parseColor(getComputedStyle(nav).backgroundColor)
    await expect(chrome.a).toBeCloseTo(0.96, 2)
    // Over the page, the bar's layers are opaque: the block does not show through.
    const fill = fillAbovePage(x, y, detail)
    await expect(fill.a).toBeCloseTo(1, 3)
    // They make surface.chrome over bg.canvas, the colour Figma shows on its dark backdrop, with no new value.
    const canvasColor = parseColor(getComputedStyle(slotOf(canvasElement, 'backdrop')).backgroundColor)
    const want = over(chrome, canvasColor)
    for (const c of ['r', 'g', 'b'] as const) await expect(Math.abs(fill[c] - want[c])).toBeLessThan(0.5)
    // The page under the bar still scrolls and is still the block.
    await expect(rect(block).bottom).toBeGreaterThan(y)
  },
}

/** Phone with `tabBarOverlay` and a bright block scrolled under the tab bar: the bar is opaque, surface.chrome over bg.canvas, so the page does not show through. */
export const OverlayOpaqueDark: StoryObj<typeof meta> = { ...overlayOpaque, globals: { mode: 'dark' } }
export const OverlayOpaqueLight: StoryObj<typeof meta> = { ...overlayOpaque, globals: { mode: 'light' } }
