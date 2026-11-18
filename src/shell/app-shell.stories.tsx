import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, spyOn, userEvent, within } from 'storybook/test'
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

// The iPhone screen of the phone pages (390 x 844), and a stand-in for window.visualViewport that a play test moves
// as iOS Safari does when its keyboard opens: the layout keeps its height, and only the visual viewport shrinks and
// may pan down.
const phoneScreen = { m390: { name: 'Phone (390 x 844)', styles: { width: '390px', height: '844px' } } }
const composerBox = css({ bg: 'surface.chrome', borderTopWidth: 'default', borderColor: 'border.default', textStyle: 'body', color: 'fg.default', p: '12' })
// The message field, in the Composer's 14 px body text: under 16 px, so iOS Safari zooms in when it takes focus.
const messageField = css({ display: 'block', textStyle: 'body', color: 'fg.default', bg: 'transparent' })

class FakeViewport extends EventTarget {
  height = document.documentElement.clientHeight
  width = document.documentElement.clientWidth
  offsetTop = 0
  offsetLeft = 0
  scale = 1
  readonly listening = new Set<string>()
  override addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean) {
    this.listening.add(type)
    super.addEventListener(type, listener, options)
  }
  override removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean) {
    this.listening.delete(type)
    super.removeEventListener(type, listener, options)
  }
  move(change: { height?: number; offsetTop?: number; scale?: number }, event: 'resize' | 'scroll' = 'resize') {
    this.height = change.height ?? this.height
    this.offsetTop = change.offsetTop ?? this.offsetTop
    this.scale = change.scale ?? this.scale
    this.dispatchEvent(new Event(event))
  }
}

let fakeViewport = new FakeViewport()

// Puts `value` in place of window.visualViewport for one story, and puts the browser's own back after it.
const replaceVisualViewport = (value: FakeViewport | undefined) => {
  const own = Object.getOwnPropertyDescriptor(window, 'visualViewport')
  Object.defineProperty(window, 'visualViewport', { configurable: true, value })
  return () => {
    if (own) Object.defineProperty(window, 'visualViewport', own)
    else Reflect.deleteProperty(window, 'visualViewport')
  }
}

// `titled` adds a second field, a Title above the message, to move the focus between two fields.
function PhoneChat({ titled = false }: { titled?: boolean }) {
  return (
    <div className={screenFrame} data-testid="phone">
      <AppShell
        size="phone"
        view="detail"
        detail={
          <>
            <section aria-label="Chat" className={pane}>
              Chat
            </section>
            <div role="group" aria-label="Composer" className={composerBox}>
              {titled ? <textarea aria-label="Title" rows={1} className={messageField} /> : null}
              <textarea aria-label="Message" rows={1} className={messageField} />
            </div>
          </>
        }
      />
    </div>
  )
}

const shellRoot = (root: HTMLElement) => slot(root, 'root')

const keyboard: StoryObj<typeof meta> = {
  render: () => <PhoneChat />,
  parameters: { viewport: { options: phoneScreen } },
  beforeEach: () => {
    fakeViewport = new FakeViewport()
    return replaceVisualViewport(fakeViewport)
  },
  play: async ({ canvasElement }) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const canvas = within(canvasElement)
    const root = shellRoot(canvasElement)
    const composer = () => rect(canvas.getByRole('group', { name: 'Composer' }))
    const shown = (el: DOMRect) => {
      const top = fakeViewport.offsetTop
      return { top: Math.round(el.top) >= Math.round(top), bottom: Math.round(el.bottom) <= Math.round(top + fakeViewport.height) }
    }
    // No keyboard: the visual viewport is the layout's height, the shell fills the screen and sets nothing.
    await expect(Math.round(rect(root).height)).toBe(844)
    await expect(root.style.getPropertyValue('--app-shell-visible-height')).toBe('')
    await expect(Math.round(composer().bottom)).toBe(844 - 34)
    // The keyboard opens for a field: the shell follows the visual viewport only while one has the focus.
    const field = canvas.getByRole('textbox', { name: 'Message' })
    await userEvent.click(field)
    await expect(field).toHaveFocus()
    await expect(root.style.getPropertyValue('--app-shell-visible-height')).toBe('')
    // The keyboard opens and covers 300 px; the layout keeps its 844, as on iOS Safari. The shell shrinks to the
    // visible 544, so the composer ends 34 (the safe area) over the keyboard's top, not under it.
    fakeViewport.move({ height: 544 })
    await expect(Math.round(rect(root).top)).toBe(0)
    await expect(Math.round(rect(root).bottom)).toBe(544)
    await expect(shown(composer())).toEqual({ top: true, bottom: true })
    await expect(Math.round(composer().bottom)).toBe(544 - 34)
    // Safari pans the visual viewport 200 down (a scroll event): the shell moves with it and stays in view.
    fakeViewport.move({ offsetTop: 200 }, 'scroll')
    await expect(Math.round(rect(root).top)).toBe(200)
    await expect(Math.round(rect(root).bottom)).toBe(744)
    await expect(shown(composer())).toEqual({ top: true, bottom: true })
    // A pinch zoom also shrinks the visual viewport; the page keeps its size.
    fakeViewport.move({ height: 422, offsetTop: 0, scale: 2 })
    await expect(Math.round(rect(root).height)).toBe(844)
    await expect(root.style.getPropertyValue('--app-shell-visible-height')).toBe('')
    // The keyboard closes: the shell is the full screen again, with nothing set.
    fakeViewport.move({ height: 844, offsetTop: 0, scale: 1 })
    await expect(Math.round(rect(root).top)).toBe(0)
    await expect(Math.round(rect(root).height)).toBe(844)
    await expect(root.style.getPropertyValue('--app-shell-visible-height')).toBe('')
    await expect(root.style.getPropertyValue('--app-shell-visible-top')).toBe('')
  },
}

/** Phone chat on iOS Safari: when the keyboard covers the bottom of the screen, the shell shrinks to the visible area, so the composer stays above the keyboard. */
export const KeyboardDark: StoryObj<typeof meta> = { ...keyboard, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const KeyboardLight: StoryObj<typeof meta> = { ...keyboard, globals: { mode: 'light', viewport: { value: 'm390' } } }

const focusZoom: StoryObj<typeof meta> = {
  render: () => <PhoneChat />,
  parameters: { viewport: { options: phoneScreen } },
  beforeEach: () => {
    fakeViewport = new FakeViewport()
    return replaceVisualViewport(fakeViewport)
  },
  play: async ({ canvasElement }) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const canvas = within(canvasElement)
    const root = shellRoot(canvasElement)
    const composer = () => rect(canvas.getByRole('group', { name: 'Composer' }))
    const field = canvas.getByRole('textbox', { name: 'Message' })
    const shown = (el: DOMRect) => {
      const top = fakeViewport.offsetTop
      return { top: Math.round(el.top) >= Math.round(top), bottom: Math.round(el.bottom) <= Math.round(top + fakeViewport.height) }
    }
    // The field's text is 14 px, under Safari's 16, so focusing it zooms the page in by 16 / 14.
    await userEvent.click(field)
    await expect(field).toHaveFocus()
    await expect(getComputedStyle(field).fontSize).toBe('14px')
    // The keyboard opens over 300 px and Safari zooms in at once: the visual viewport is 544 / 1.14 CSS px tall and
    // panned down to the field at the screen's foot. The keyboard-free screen is still 544 CSS px at scale 1, so the
    // shell is 544 tall, keeps its top at the screen's, and the composer ends inside the visible area.
    const scale = 16 / 14
    const height = 544 / scale
    fakeViewport.move({ height, offsetTop: 544 - height, scale })
    await expect(Math.abs(rect(root).height - 544)).toBeLessThanOrEqual(1)
    await expect(Math.round(rect(root).top)).toBe(0)
    await expect(shown(composer())).toEqual({ top: true, bottom: true })
    await expect(shown(rect(field))).toEqual({ top: true, bottom: true })
    // The zoom pans back up (a scroll event): the zoom moves over the shell, which stays put.
    fakeViewport.move({ offsetTop: 0 }, 'scroll')
    await expect(Math.round(rect(root).top)).toBe(0)
    await expect(Math.abs(rect(root).height - 544)).toBeLessThanOrEqual(1)
    // The keyboard closes under a pinch zoom (scale 2, 422 CSS px tall): the screen is the layout's 844, nothing is set.
    field.blur()
    fakeViewport.move({ height: 422, offsetTop: 0, scale: 2 })
    await expect(Math.round(rect(root).height)).toBe(844)
    await expect(root.style.getPropertyValue('--app-shell-visible-height')).toBe('')
    await expect(root.style.getPropertyValue('--app-shell-visible-top')).toBe('')
  },
}

/** Phone chat on iOS Safari with the keyboard open and the focus zoom of the 14 px message field: the shell keeps the keyboard-free height, so the composer stays above the keyboard. */
export const FocusZoomDark: StoryObj<typeof meta> = { ...focusZoom, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const FocusZoomLight: StoryObj<typeof meta> = { ...focusZoom, globals: { mode: 'light', viewport: { value: 'm390' } } }

const withFakeViewport = {
  parameters: { viewport: { options: phoneScreen } },
  beforeEach: () => {
    fakeViewport = new FakeViewport()
    return replaceVisualViewport(fakeViewport)
  },
}

const noFieldFocused: StoryObj<typeof meta> = {
  ...withFakeViewport,
  render: () => <PhoneChat />,
  play: async ({ canvasElement }) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const root = shellRoot(canvasElement)
    const composer = () => rect(within(canvasElement).getByRole('group', { name: 'Composer' }))
    await expect(document.activeElement?.tagName).not.toBe('TEXTAREA')
    // With no field focused, the browser's bottom bar shows on a scroll and shrinks the visual viewport by 80 px:
    // the shell keeps its parent's 844 and sets nothing, so the page does not move under the finger.
    fakeViewport.move({ height: 764 })
    await expect(Math.round(rect(root).height)).toBe(844)
    await expect(Math.round(composer().bottom)).toBe(844 - 34)
    await expect(root.style.getPropertyValue('--app-shell-visible-height')).toBe('')
    await expect(root.style.getPropertyValue('--app-shell-visible-top')).toBe('')
    // The top bar hides and the visual viewport pans down (a scroll event): the shell stays at the top.
    fakeViewport.move({ height: 700, offsetTop: 60 }, 'scroll')
    await expect(Math.round(rect(root).top)).toBe(0)
    await expect(Math.round(rect(root).height)).toBe(844)
    await expect(root.style.getPropertyValue('--app-shell-visible-height')).toBe('')
    await expect(root.style.getPropertyValue('--app-shell-visible-top')).toBe('')
  },
}

/** Phone chat with no field focused: the browser's bars that show and hide on a scroll shrink the visual viewport, and the shell keeps its height. */
export const NoFieldFocusedDark: StoryObj<typeof meta> = { ...noFieldFocused, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const NoFieldFocusedLight: StoryObj<typeof meta> = { ...noFieldFocused, globals: { mode: 'light', viewport: { value: 'm390' } } }

const fieldBlurred: StoryObj<typeof meta> = {
  ...withFakeViewport,
  render: () => <PhoneChat />,
  play: async ({ canvasElement }) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const canvas = within(canvasElement)
    const root = shellRoot(canvasElement)
    const field = canvas.getByRole('textbox', { name: 'Message' })
    // The field takes the focus and the keyboard opens: the shell fits the visible 544.
    await userEvent.click(field)
    fakeViewport.move({ height: 544 })
    await expect(Math.round(rect(root).height)).toBe(544)
    await expect(root.style.getPropertyValue('--app-shell-visible-height')).toBe('544px')
    // The focus leaves the field (a blur, to no element): the fit stays while the viewport is still short, so the
    // page does not move before the keyboard has gone.
    field.blur()
    await expect(field).not.toHaveFocus()
    await expect(root.style.getPropertyValue('--app-shell-visible-height')).toBe('544px')
    await expect(Math.round(rect(root).height)).toBe(544)
    // The keyboard closes (a resize to 844): both properties go and the shell is its parent's 844 again.
    fakeViewport.move({ height: 844 })
    await expect(root.style.getPropertyValue('--app-shell-visible-height')).toBe('')
    await expect(root.style.getPropertyValue('--app-shell-visible-top')).toBe('')
    await expect(Math.round(rect(root).height)).toBe(844)
    // Later the browser's bottom bar shrinks the visual viewport, with no field focused: nothing is set.
    fakeViewport.move({ height: 764 })
    await expect(root.style.getPropertyValue('--app-shell-visible-height')).toBe('')
    await expect(Math.round(rect(root).height)).toBe(844)
    // The focus comes back to the field while the viewport is short: the fit starts at once, with no viewport event.
    fakeViewport.move({ height: 844 })
    await userEvent.click(field)
    fakeViewport.move({ height: 544 })
    await expect(Math.round(rect(root).height)).toBe(544)
    // The focus moves to an element that opens no keyboard (the detail pane): the same rule, the fit stays until
    // the keyboard closes.
    await userEvent.click(canvas.getByRole('main'))
    await expect(canvas.getByRole('main')).toHaveFocus()
    await expect(root.style.getPropertyValue('--app-shell-visible-height')).toBe('544px')
    fakeViewport.move({ height: 844 })
    await expect(root.style.getPropertyValue('--app-shell-visible-height')).toBe('')
    await expect(Math.round(rect(root).height)).toBe(844)
  },
}

/** Phone chat: when the focus leaves the message field, the shell keeps the fit until the keyboard closes, then returns to its parent's height. */
export const FieldBlurredDark: StoryObj<typeof meta> = { ...fieldBlurred, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const FieldBlurredLight: StoryObj<typeof meta> = { ...fieldBlurred, globals: { mode: 'light', viewport: { value: 'm390' } } }

function SendChat() {
  const [sent, setSent] = useState(0)
  return (
    <div className={screenFrame}>
      <AppShell
        size="phone"
        view="detail"
        detail={
          <>
            <section aria-label="Chat" className={pane}>
              Sent {sent}
            </section>
            <div role="group" aria-label="Composer" className={composerBox}>
              <textarea aria-label="Message" rows={1} className={messageField} />
              <Button
                onClick={() => {
                  setSent((n) => n + 1)
                }}
              >
                Send
              </Button>
            </div>
          </>
        }
      />
    </div>
  )
}

// A finger's tap as the browser hit-tests it, which `userEvent.click` does not: the press goes to the element under
// the point, and the click to the element under the point at the release, or to the nearest one that holds both.
// `focus` is what the press does to the focus: `button` focuses the pressed button, as Chromium does; `none` blurs
// the field to no element, as Safari, which does not focus a button on a press, does.
const tap = (el: Element, focus: 'button' | 'none') => {
  const box = rect(el)
  const at = { bubbles: true, cancelable: true, clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 }
  const down = document.elementFromPoint(at.clientX, at.clientY) ?? document.body
  down.dispatchEvent(new PointerEvent('pointerdown', at))
  down.dispatchEvent(new MouseEvent('mousedown', at))
  const button = down.closest('button')
  if (focus === 'button' && button) button.focus()
  else if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  const up = document.elementFromPoint(at.clientX, at.clientY) ?? document.body
  up.dispatchEvent(new PointerEvent('pointerup', at))
  up.dispatchEvent(new MouseEvent('mouseup', at))
  let shared: Element | null = up
  while (shared && !shared.contains(down)) shared = shared.parentElement
  ;(shared ?? document.body).dispatchEvent(new MouseEvent('click', at))
}

const sendTap: StoryObj<typeof meta> = {
  ...withFakeViewport,
  render: () => <SendChat />,
  play: async ({ canvasElement }) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const canvas = within(canvasElement)
    const root = shellRoot(canvasElement)
    const field = canvas.getByRole('textbox', { name: 'Message' })
    const send = canvas.getByRole('button', { name: 'Send' })
    // The shell's height at each click on Send.
    const atClick: number[] = []
    send.addEventListener('click', () => atClick.push(Math.round(rect(root).height)))
    // The keyboard is open for the message: the shell is 544 and Send sits above the keyboard.
    await userEvent.click(field)
    fakeViewport.move({ height: 544 })
    await expect(Math.round(rect(root).height)).toBe(544)
    // A tap on Send that focuses it (Chromium): the shell stays 544 from the press to the click, so the click lands
    // on Send and sends once.
    tap(send, 'button')
    await expect(send).toHaveFocus()
    await expect(atClick).toEqual([544])
    await expect(canvas.getByText('Sent 1')).toBeVisible()
    // A tap that blurs the field to no element (Safari) lands the same way.
    await userEvent.click(field)
    tap(send, 'none')
    await expect(atClick).toEqual([544, 544])
    await expect(canvas.getByText('Sent 2')).toBeVisible()
    // The keyboard closes: the fit ends and the shell is its parent's 844.
    fakeViewport.move({ height: 844 })
    await expect(Math.round(rect(root).height)).toBe(844)
    await expect(root.style.getPropertyValue('--app-shell-visible-height')).toBe('')
  },
}

/** Phone chat with the keyboard open: a tap on Send takes the focus from the field, and the shell keeps its fit until the keyboard closes, so the tap lands on Send. */
export const SendTapDark: StoryObj<typeof meta> = { ...sendTap, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const SendTapLight: StoryObj<typeof meta> = { ...sendTap, globals: { mode: 'light', viewport: { value: 'm390' } } }

const fieldToField: StoryObj<typeof meta> = {
  ...withFakeViewport,
  render: () => <PhoneChat titled />,
  play: async ({ canvasElement }) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const canvas = within(canvasElement)
    const root = shellRoot(canvasElement)
    const title = canvas.getByRole('textbox', { name: 'Title' })
    const message = canvas.getByRole('textbox', { name: 'Message' })
    await userEvent.click(title)
    fakeViewport.move({ height: 544 })
    await expect(Math.round(rect(root).height)).toBe(544)
    // The focus moves from the title to the message while the keyboard stays open: the fit is never removed in
    // between, so the page does not jump down and up.
    const remove = spyOn(root.style, 'removeProperty')
    await userEvent.click(message)
    await expect(message).toHaveFocus()
    await expect(remove).not.toHaveBeenCalled()
    await expect(root.style.getPropertyValue('--app-shell-visible-height')).toBe('544px')
    await expect(Math.round(rect(root).height)).toBe(544)
    // And back with Shift+Tab, the keyboard's own way between fields.
    await userEvent.tab({ shift: true })
    await expect(title).toHaveFocus()
    await expect(remove).not.toHaveBeenCalled()
    await expect(Math.round(rect(root).height)).toBe(544)
    remove.mockRestore()
  },
}

/** Phone chat with two fields: moving the focus from one to the other while the keyboard is open keeps the fit. */
export const FieldToFieldDark: StoryObj<typeof meta> = { ...fieldToField, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const FieldToFieldLight: StoryObj<typeof meta> = { ...fieldToField, globals: { mode: 'light', viewport: { value: 'm390' } } }

const noVisualViewport: StoryObj<typeof meta> = {
  render: () => <PhoneChat />,
  parameters: { viewport: { options: phoneScreen } },
  beforeEach: () => replaceVisualViewport(undefined),
  play: async ({ canvasElement }) => {
    await expect(window.visualViewport).toBeUndefined()
    const root = shellRoot(canvasElement)
    // With no visualViewport the shell renders as always: the full screen, and no inline style at all.
    await expect(Math.round(rect(root).height)).toBe(844)
    await expect(root).not.toHaveAttribute('style')
    await expect(Math.round(rect(within(canvasElement).getByRole('group', { name: 'Composer' })).bottom)).toBe(844 - 34)
  },
}

/** A browser with no `window.visualViewport`: the shell keeps its normal height. */
export const NoVisualViewportDark: StoryObj<typeof meta> = { ...noVisualViewport, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const NoVisualViewportLight: StoryObj<typeof meta> = { ...noVisualViewport, globals: { mode: 'light', viewport: { value: 'm390' } } }

function ClosingChat() {
  const [open, setOpen] = useState(true)
  return open ? (
    <div className={screenFrame}>
      <AppShell
        size="phone"
        view="detail"
        detail={
          <Button
            onClick={() => {
              setOpen(false)
            }}
          >
            Close the chat
          </Button>
        }
      />
    </div>
  ) : (
    <p className={text}>Closed</p>
  )
}

/** The shell stops listening to the visual viewport when it unmounts. */
export const VisualViewportUnmount: StoryObj<typeof meta> = {
  globals: { mode: 'dark', viewport: { value: 'm390' } },
  render: () => <ClosingChat />,
  parameters: { viewport: { options: phoneScreen } },
  beforeEach: () => {
    fakeViewport = new FakeViewport()
    return replaceVisualViewport(fakeViewport)
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect([...fakeViewport.listening].sort()).toEqual(['resize', 'scroll'])
    const remove = spyOn(fakeViewport, 'removeEventListener')
    const removeFromDocument = spyOn(document, 'removeEventListener')
    await userEvent.click(canvas.getByRole('button', { name: 'Close the chat' }))
    await expect(canvas.getByText('Closed')).toBeVisible()
    await expect(remove).toHaveBeenCalledWith('resize', expect.any(Function))
    await expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function))
    await expect(removeFromDocument).toHaveBeenCalledWith('focusin', expect.any(Function))
    await expect(removeFromDocument).toHaveBeenCalledWith('focusout', expect.any(Function))
    removeFromDocument.mockRestore()
    await expect(fakeViewport.listening.size).toBe(0)
    // A keyboard after the unmount reaches nothing and throws nothing.
    fakeViewport.move({ height: 544 })
    await expect(canvasElement.querySelector('.app-shell__root')).toBeNull()
  },
}
