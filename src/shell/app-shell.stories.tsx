import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { expect, fn, spyOn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { token } from '../../styled-system/tokens'
import { Button } from '../controls/button'
import { Container } from '../controls/layout'
import { expectScrollAreas, expectScrollsByWheelAndKeys } from '../controls/scroll-area.testing'
import { ScrollFrame } from '../controls/scroll-frame'
import { AppShell, type AppShellDiagnostic, type AppShellProps, appShellDockEvent } from './app-shell'
import { cssCubicBezier, cssDuration, cssPx } from './css-values'
import { keyboardMeasures } from './keyboard-measures'

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
    // The detail scrolls with no scroll bar and keeps a scroll at its end from moving the page.
    await expectScrollAreas(canvasElement, 'both', '.app-shell__detail')
  },
} satisfies Meta<typeof Desktop>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

/**
 * With no scroll bar, the detail still scrolls: a mouse wheel moves it. Only the story test runner has the real wheel,
 * so the Storybook UI leaves the story out. The keys are checked on the ScrollFrame body (`expectScrollsByWheelAndKeys`).
 */
const scrolls: StoryObj<typeof meta> = {
  tags: ['!dev'],
  play: async ({ canvasElement }) => {
    await expectScrollAreas(canvasElement, 'both', '.app-shell__detail')
    await expectScrollsByWheelAndKeys(within(canvasElement).getByRole('main'))
  },
}
export const ScrollsDark: StoryObj<typeof meta> = { tags: ['!dev'], ...scrolls, globals: { mode: 'dark' } }
export const ScrollsLight: StoryObj<typeof meta> = { tags: ['!dev'], ...scrolls, globals: { mode: 'light' } }

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

// A phone's safe area as the shell gets it with viewport-fit=cover: a 47 px status bar and a 34 px home indicator
// (iPhone 14). Chromium gives env() 0, so the play function sets the shell's own properties on the frame.
const setInsets = (frame: HTMLElement, insets: { top: number; bottom: number }) => {
  frame.style.setProperty('--app-shell-safe-top', `${String(insets.top)}px`)
  frame.style.setProperty('--app-shell-safe-bottom', `${String(insets.bottom)}px`)
}

const phoneSafeArea: StoryObj<typeof meta> = {
  render: () => <Narrow size="phone" view="detail" withTabBar />,
  play: async ({ canvasElement }) => {
    const frame = box(canvasElement)
    setInsets(frame, { top: 47, bottom: 34 })
    const canvas = within(canvasElement)
    const outer = rect(frame)
    // The pane starts under the status bar; the backdrop fills the 47 above it.
    await expect(Math.round(rect(canvas.getByRole('main')).top - outer.top)).toBe(47)
    await expect(Math.round(rect(canvas.getByRole('main')).width)).toBe(Math.round(outer.width))
    // The tab bar ends at the screen's end; it holds the home indicator's area itself (the TabBar's HomeIndicator
    // story), so the shell adds no safe area under it.
    const bar = rect(canvas.getByRole('navigation', { name: 'Tabs' }))
    await expect(Math.round(bar.bottom)).toBe(Math.round(outer.bottom))
    await expect(canvasElement.querySelector('.app-shell__safeArea')).toBeNull()
  },
}
/** Phone with a 47 px status bar and a 34 px home indicator: the pane starts under the bar, the tab bar at the end. */
export const PhoneSafeAreaDark: StoryObj<typeof meta> = { ...phoneSafeArea, globals: { mode: 'dark' } }
export const PhoneSafeAreaLight: StoryObj<typeof meta> = { ...phoneSafeArea, globals: { mode: 'light' } }

const phoneSafeAreaNoTabBar: StoryObj<typeof meta> = {
  render: () => <Narrow size="phone" view="detail" withTabBar={false} />,
  play: async ({ canvasElement }) => {
    const frame = box(canvasElement)
    setInsets(frame, { top: 47, bottom: 34 })
    const outer = rect(frame)
    const main = rect(within(canvasElement).getByRole('main'))
    const safe = slot(canvasElement, 'safeArea')
    await expect(Math.round(main.top - outer.top)).toBe(47)
    // The home indicator's 34 stays clear under the pane, and a taller inset takes its place.
    await expect(Math.round(rect(safe).height)).toBe(34)
    await expect(Math.round(rect(safe).bottom)).toBe(Math.round(outer.bottom))
    setInsets(frame, { top: 47, bottom: 48 })
    await expect(Math.round(rect(slot(canvasElement, 'safeArea')).height)).toBe(48)
  },
}
/** Phone chat with a 47 px status bar: the pane starts under the bar and the home indicator's area stays clear. */
export const PhoneSafeAreaNoTabBarDark: StoryObj<typeof meta> = { ...phoneSafeAreaNoTabBar, globals: { mode: 'dark' } }
export const PhoneSafeAreaNoTabBarLight: StoryObj<typeof meta> = { ...phoneSafeAreaNoTabBar, globals: { mode: 'light' } }

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
    // --scroll-frame-inset is now the tab bar's calc() (tabBarHeight), so read it resolved, where the Start uses it.
    const sticky = canvas.getByRole('button', { name: 'Start' }).parentElement
    if (!(sticky instanceof HTMLElement)) throw new Error('no sticky Start')
    await expect(getComputedStyle(sticky).bottom).toBe('77px')
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

// A box in the footer as tall as the public --scroll-frame-dock, read as the-bridge's composer reads it, out of the flow
// so it moves nothing.
const dockProbe = css({ position: 'absolute', top: '0', h: 'var(--scroll-frame-dock, 0px)' })
// The keyboard dock with --app-shell-keyboard set by hand, as AppShell sets it while a keyboard covers the detail's
// 300 px foot: the ScrollFrame's footer rises by the part above the space under it (the tab bar's 77 under the
// overlay, 0 below it), its body's view ends at the raised footer, and nothing in the layout moves.
const dockByHand = (overlay: boolean): StoryObj<typeof meta> => ({
  render: () => <PhoneScreen content="frame" tabBarOverlay={overlay} />,
  play: async ({ canvasElement }) => {
    const { canvas, detail } = phoneParts(canvasElement)
    const root = slot(canvasElement, 'root')
    const frame = slotOf(canvasElement, 'scroll-frame__root')
    const body = slotOf(canvasElement, 'scroll-frame__body')
    const footer = slotOf(canvasElement, 'scroll-frame__footer')
    const boxes = () => [frame, body, footer, canvas.getByRole('navigation', { name: 'Tabs' })].map((el) => Math.round(el.offsetTop + el.offsetHeight))
    const before = { boxes: boxes(), start: rect(canvas.getByRole('button', { name: 'Start' })), view: body.clientHeight }
    const rise = overlay ? 300 - 77 : 300
    const probe = document.createElement('div')
    probe.className = dockProbe
    footer.append(probe)
    // Unset, nothing is moved and nothing is reserved.
    await expect(probe.offsetHeight).toBe(0)
    await expect(getComputedStyle(footer).transform).toBe('matrix(1, 0, 0, 1, 0, 0)')
    await expect(getComputedStyle(body).borderBottomWidth).toBe('0px')
    root.style.setProperty('--app-shell-keyboard', '300px')
    // --scroll-frame-dock holds the footer's rise: the keyboard's reach less the space under the footer.
    await expect(probe.offsetHeight).toBe(rise)
    await expect(getComputedStyle(footer).transform).toBe(`matrix(1, 0, 0, 1, 0, ${String(-rise)})`)
    await expect(Math.round(rect(canvas.getByRole('button', { name: 'Start' })).bottom)).toBe(Math.round(before.start.bottom) - rise)
    await expect(getComputedStyle(body).borderBottomWidth).toBe(`${String(rise)}px`)
    await expect(body.clientHeight).toBe(before.view - rise)
    // The detail ends its own scroll at the keyboard's top, and the frame reaches through that padding, so the
    // layout boxes keep their places and the detail does not scroll.
    await expect(getComputedStyle(detail).paddingBottom).toBe('300px')
    await expect(boxes()).toEqual(before.boxes)
    await expect(detail.scrollHeight).toBe(detail.clientHeight)
    // Deeper in the page the value is reset, so a nested frame does not dock.
    await expect(getComputedStyle(canvas.getByText('Line 1 of the task')).getPropertyValue('--app-shell-keyboard')).toBe('0px')
    root.style.removeProperty('--app-shell-keyboard')
    await expect(probe.offsetHeight).toBe(0)
    probe.remove()
    await expect(getComputedStyle(footer).transform).toBe('matrix(1, 0, 0, 1, 0, 0)')
    await expect(boxes()).toEqual(before.boxes)
  },
})

/** The ScrollFrame dock under the overlaid tab bar with `--app-shell-keyboard` set by hand: the footer rises onto the keyboard and the layout does not move. */
export const DockByHandDark: StoryObj<typeof meta> = { ...dockByHand(true), globals: { mode: 'dark' } }
export const DockByHandLight: StoryObj<typeof meta> = { ...dockByHand(true), globals: { mode: 'light' } }
/** The same with the tab bar below the page: the footer rises by the keyboard's whole reach over the detail. */
export const DockByHandBelowDark: StoryObj<typeof meta> = { ...dockByHand(false), globals: { mode: 'dark' } }
export const DockByHandBelowLight: StoryObj<typeof meta> = { ...dockByHand(false), globals: { mode: 'light' } }

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

// A play takes the viewport its story's setup made, as its own `fakeViewport`, and never reads the global again: a
// play that timed out runs on, and with the global it moved the next story's viewport (Keyboard Light failed under
// load with the composer one screen down). Its writes now reach only its own viewport, which no shell reads.
type PlayContext = Parameters<NonNullable<StoryObj<typeof meta>['play']>>[0]
const viewportPlay =
  (play: (context: PlayContext, viewport: FakeViewport) => Promise<void>) =>
  (context: PlayContext): Promise<void> =>
    play(context, fakeViewport)

// The device as the shell reads it through matchMedia: a touch screen (`coarse`) and reduced motion (`reduce`). The
// stories of the dock's rules use a mouse and reduced motion, so each change is there at once; the motion stories
// use a touch screen with motion.
const emulateMedia = ({ coarse, reduce }: { coarse: boolean; reduce: boolean }) => {
  const own = Object.getOwnPropertyDescriptor(window, 'matchMedia')
  const real = window.matchMedia.bind(window)
  const answers: Partial<Record<string, boolean>> = { '(pointer: coarse)': coarse, '(prefers-reduced-motion: reduce)': reduce }
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => {
      const matches = answers[query]
      return matches === undefined ? real(query) : { matches, media: query }
    },
  })
  return () => {
    if (own) Object.defineProperty(window, 'matchMedia', own)
    else Reflect.deleteProperty(window, 'matchMedia')
  }
}
// A fake visual viewport on a device with a mouse and reduced motion, for the stories of the dock's rules.
const fakeDevice = (height?: number) => {
  fakeViewport = new FakeViewport()
  if (height !== undefined) fakeViewport.height = height
  const restoreViewport = replaceVisualViewport(fakeViewport)
  const restoreMedia = emulateMedia({ coarse: false, reduce: true })
  return () => {
    restoreMedia()
    restoreViewport()
  }
}

// Puts `value` in place of window.visualViewport for one story, and puts the browser's own back after it.
const replaceVisualViewport = (value: FakeViewport | undefined) => {
  const own = Object.getOwnPropertyDescriptor(window, 'visualViewport')
  Object.defineProperty(window, 'visualViewport', { configurable: true, value })
  return () => {
    if (own) Object.defineProperty(window, 'visualViewport', own)
    else Reflect.deleteProperty(window, 'visualViewport')
  }
}

// The chat, with the composer as the footer of a ScrollFrame, the dock that rides on the keyboard. `titled` adds a
// second field, a Title above the message, to move the focus between two fields.
function PhoneChat({ titled = false }: { titled?: boolean }) {
  return (
    <div className={screenFrame} data-testid="phone">
      <AppShell
        size="phone"
        view="detail"
        detail={
          <ScrollFrame
            footer={
              <div role="group" aria-label="Composer" className={composerBox}>
                {titled ? <textarea aria-label="Title" rows={1} className={messageField} /> : null}
                <textarea aria-label="Message" rows={1} className={messageField} />
              </div>
            }
          >
            <section aria-label="Chat" className={pane}>
              Chat
            </section>
          </ScrollFrame>
        }
      />
    </div>
  )
}

const shellRoot = (root: HTMLElement) => slot(root, 'root')
// How far the keyboard covers the detail's bottom, as AppShell sets it on its root; '' with no keyboard.
const keyboardInset = (root: HTMLElement) => root.style.getPropertyValue('--app-shell-keyboard')

const keyboard: StoryObj<typeof meta> = {
  render: () => <PhoneChat />,
  parameters: { viewport: { options: phoneScreen } },
  beforeEach: () => fakeDevice(),
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
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
    await expect(keyboardInset(root)).toBe('')
    await expect(Math.round(composer().bottom)).toBe(844 - 34)
    // The keyboard opens for a field: the shell follows the visual viewport only while one has the focus.
    const field = canvas.getByRole('textbox', { name: 'Message' })
    await userEvent.click(field)
    await expect(field).toHaveFocus()
    await expect(keyboardInset(root)).toBe('')
    // The keyboard opens and covers 300 px; the layout keeps its 844, as on iOS Safari. The shell keeps its 844 and
    // the composer rides up onto the keyboard's top at 544, over the safe area, which stays under the keyboard.
    fakeViewport.move({ height: 544 })
    await expect(Math.round(rect(root).top)).toBe(0)
    await expect(Math.round(rect(root).height)).toBe(844)
    await expect(shown(composer())).toEqual({ top: true, bottom: true })
    await expect(Math.round(composer().bottom)).toBe(544)
    // Safari pans the visual viewport 200 down (a scroll event): the shell stays put and the composer stays on the
    // keyboard, in view.
    fakeViewport.move({ offsetTop: 200 }, 'scroll')
    await expect(Math.round(rect(root).top)).toBe(0)
    await expect(Math.round(rect(root).height)).toBe(844)
    await expect(shown(composer())).toEqual({ top: true, bottom: true })
    await expect(Math.round(composer().bottom)).toBe(744)
    // A pinch zoom also shrinks the visual viewport; the page keeps its size.
    fakeViewport.move({ height: 422, offsetTop: 0, scale: 2 })
    await expect(Math.round(rect(root).height)).toBe(844)
    await expect(keyboardInset(root)).toBe('')
    // The keyboard closes: the shell is the full screen, with nothing set, and the composer is back at its place.
    fakeViewport.move({ height: 844, offsetTop: 0, scale: 1 })
    await expect(Math.round(rect(root).top)).toBe(0)
    await expect(Math.round(rect(root).height)).toBe(844)
    await expect(keyboardInset(root)).toBe('')
    await expect(Math.round(composer().bottom)).toBe(844 - 34)
  }),
}

/** Phone chat on iOS Safari: when the keyboard covers the bottom of the screen, the shell keeps its height and the composer rides on the keyboard's top. */
export const KeyboardDark: StoryObj<typeof meta> = { ...keyboard, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const KeyboardLight: StoryObj<typeof meta> = { ...keyboard, globals: { mode: 'light', viewport: { value: 'm390' } } }

const focusZoom: StoryObj<typeof meta> = {
  render: () => <PhoneChat />,
  parameters: { viewport: { options: phoneScreen } },
  beforeEach: () => fakeDevice(),
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
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
    // keyboard's top is at 544: the shell keeps its 844 and its top, and the composer ends on the keyboard, inside the
    // visible area.
    const scale = 16 / 14
    const height = 544 / scale
    fakeViewport.move({ height, offsetTop: 544 - height, scale })
    await expect(Math.round(rect(root).height)).toBe(844)
    await expect(Math.round(rect(root).top)).toBe(0)
    await expect(Math.abs(composer().bottom - 544)).toBeLessThanOrEqual(1)
    await expect(shown(composer())).toEqual({ top: true, bottom: true })
    await expect(shown(rect(field))).toEqual({ top: true, bottom: true })
    // The zoom pans back up (a scroll event): the zoom moves over the shell and the dock, which stay put.
    fakeViewport.move({ offsetTop: 0 }, 'scroll')
    await expect(Math.round(rect(root).top)).toBe(0)
    await expect(Math.abs(composer().bottom - 544)).toBeLessThanOrEqual(1)
    // The keyboard closes under a pinch zoom (scale 2, 422 CSS px tall): the screen is the layout's 844, nothing is set.
    field.blur()
    fakeViewport.move({ height: 422, offsetTop: 0, scale: 2 })
    await expect(Math.round(rect(root).height)).toBe(844)
    await expect(keyboardInset(root)).toBe('')
  }),
}

/** Phone chat on iOS Safari with the keyboard open and the focus zoom of the 14 px message field: the dock keeps to the keyboard-free height, so the composer stays above the keyboard. */
export const FocusZoomDark: StoryObj<typeof meta> = { ...focusZoom, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const FocusZoomLight: StoryObj<typeof meta> = { ...focusZoom, globals: { mode: 'light', viewport: { value: 'm390' } } }

const withFakeViewport = {
  parameters: { viewport: { options: phoneScreen } },
  beforeEach: () => fakeDevice(),
}

const noFieldFocused: StoryObj<typeof meta> = {
  ...withFakeViewport,
  render: () => <PhoneChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const root = shellRoot(canvasElement)
    const composer = () => rect(within(canvasElement).getByRole('group', { name: 'Composer' }))
    await expect(document.activeElement?.tagName).not.toBe('TEXTAREA')
    // With no field focused, the browser's bottom bar shows on a scroll and shrinks the visual viewport by 80 px:
    // the shell keeps its parent's 844 and sets nothing, so the page does not move under the finger.
    fakeViewport.move({ height: 764 })
    await expect(Math.round(rect(root).height)).toBe(844)
    await expect(Math.round(composer().bottom)).toBe(844 - 34)
    await expect(keyboardInset(root)).toBe('')
    // The top bar hides and the visual viewport pans down (a scroll event): the shell stays at the top.
    fakeViewport.move({ height: 700, offsetTop: 60 }, 'scroll')
    await expect(Math.round(rect(root).top)).toBe(0)
    await expect(Math.round(rect(root).height)).toBe(844)
    await expect(Math.round(composer().bottom)).toBe(844 - 34)
    await expect(keyboardInset(root)).toBe('')
  }),
}

/** Phone chat with no field focused: the browser's bars that show and hide on a scroll shrink the visual viewport, and the shell keeps its height. */
export const NoFieldFocusedDark: StoryObj<typeof meta> = { ...noFieldFocused, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const NoFieldFocusedLight: StoryObj<typeof meta> = { ...noFieldFocused, globals: { mode: 'light', viewport: { value: 'm390' } } }

// The shell in a parent taller than the screen (1000 in an 844 layout), with no field focused: the detail's foot lies
// below the layout's, but no keyboard covers it, so nothing docks (Codex review of #184).
const tallParent: StoryObj<typeof meta> = {
  ...withFakeViewport,
  render: () => <PhoneChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const root = shellRoot(canvasElement)
    const phone = within(canvasElement).getByTestId('phone')
    const composer = () => rect(within(canvasElement).getByRole('group', { name: 'Composer' }))
    phone.style.height = '1000px'
    // A window resize makes the shell measure again, with the visual viewport still the layout's 844.
    window.dispatchEvent(new Event('resize'))
    await expect(Math.round(rect(root).height)).toBe(1000)
    await expect(keyboardInset(root)).toBe('')
    await expect(Math.round(composer().bottom)).toBe(1000 - 34)
    // The browser's bottom bar shrinks the visual viewport: still no field, still nothing docks.
    fakeViewport.move({ height: 764 })
    await expect(keyboardInset(root)).toBe('')
    await expect(Math.round(composer().bottom)).toBe(1000 - 34)
    phone.style.removeProperty('height')
  }),
}

/** Phone chat in a parent taller than the screen, with no field focused: the composer stays at the shell's foot and nothing docks. */
export const TallParentDark: StoryObj<typeof meta> = { ...tallParent, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const TallParentLight: StoryObj<typeof meta> = { ...tallParent, globals: { mode: 'light', viewport: { value: 'm390' } } }

const fieldBlurred: StoryObj<typeof meta> = {
  ...withFakeViewport,
  render: () => <PhoneChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const canvas = within(canvasElement)
    const root = shellRoot(canvasElement)
    const field = canvas.getByRole('textbox', { name: 'Message' })
    const composer = () => Math.round(rect(canvas.getByRole('group', { name: 'Composer' })).bottom)
    // The field takes the focus and the keyboard opens: the composer docks on the keyboard at 544, and the shell
    // keeps its 844 throughout.
    await userEvent.click(field)
    fakeViewport.move({ height: 544 })
    await expect(composer()).toBe(544)
    await expect(keyboardInset(root)).toBe('266px')
    // The focus leaves the field (a blur, to no element): the fit stays while the viewport is still short, so the
    // page does not move before the keyboard has gone.
    field.blur()
    await expect(field).not.toHaveFocus()
    await expect(keyboardInset(root)).toBe('266px')
    await expect(composer()).toBe(544)
    // The keyboard closes (a resize to 844): the property goes and the composer is back at its place.
    fakeViewport.move({ height: 844 })
    await expect(keyboardInset(root)).toBe('')
    await expect(composer()).toBe(844 - 34)
    await expect(Math.round(rect(root).height)).toBe(844)
    // Later the browser's bottom bar shrinks the visual viewport, with no field focused: nothing is set.
    fakeViewport.move({ height: 764 })
    await expect(keyboardInset(root)).toBe('')
    await expect(composer()).toBe(844 - 34)
    // The focus comes back to the field while the viewport is short: the fit starts at once, with no viewport event.
    fakeViewport.move({ height: 844 })
    await userEvent.click(field)
    fakeViewport.move({ height: 544 })
    await expect(composer()).toBe(544)
    // The focus moves to an element that opens no keyboard (the detail pane) with a press: the fit stays through
    // the press, so its click lands where it started, and ends one frame after the release, with no viewport event
    // (iOS standalone may report the keyboard's close late or never).
    const atClick: string[] = []
    canvas.getByRole('main').addEventListener('click', () => atClick.push(keyboardInset(root)), { once: true })
    await userEvent.click(canvas.getByRole('main'))
    await expect(canvas.getByRole('main')).toHaveFocus()
    await expect(atClick).toEqual(['266px'])
    await waitFor(() => expect(keyboardInset(root)).toBe(''))
    await expect(composer()).toBe(844 - 34)
    fakeViewport.move({ height: 844 })
    await expect(keyboardInset(root)).toBe('')
    await expect(Math.round(rect(root).height)).toBe(844)
  }),
}

/** Phone chat: when the focus leaves the message field, the composer stays docked until the keyboard closes, or until a press that took the focus ends, then returns to its place. */
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
          <ScrollFrame
            footer={
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
            }
          >
            <section aria-label="Chat" className={pane}>
              Sent {sent}
            </section>
          </ScrollFrame>
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
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const canvas = within(canvasElement)
    const root = shellRoot(canvasElement)
    const field = canvas.getByRole('textbox', { name: 'Message' })
    const send = canvas.getByRole('button', { name: 'Send' })
    // Send's top at each click on it.
    const atClick: number[] = []
    send.addEventListener('click', () => atClick.push(Math.round(rect(send).top)))
    // The keyboard is open for the message: the composer is docked on it and Send sits above the keyboard.
    await userEvent.click(field)
    fakeViewport.move({ height: 544 })
    const docked = Math.round(rect(send).top)
    await expect(rect(send).bottom).toBeLessThanOrEqual(544)
    // A tap on Send that focuses it (Chromium): the dock stays from the press to the click, so the click lands on
    // Send and sends once.
    tap(send, 'button')
    await expect(send).toHaveFocus()
    await expect(atClick).toEqual([docked])
    await expect(canvas.getByText('Sent 1')).toBeVisible()
    // A tap that blurs the field to no element (Safari) lands the same way.
    await userEvent.click(field)
    tap(send, 'none')
    await expect(atClick).toEqual([docked, docked])
    await expect(canvas.getByText('Sent 2')).toBeVisible()
    // The keyboard closes: the dock ends and the shell is its parent's 844, as it was all along.
    fakeViewport.move({ height: 844 })
    await expect(Math.round(rect(root).height)).toBe(844)
    await expect(keyboardInset(root)).toBe('')
  }),
}

/** Phone chat with the keyboard open: a tap on Send takes the focus from the field, and the composer stays docked until the keyboard closes, so the tap lands on Send. */
export const SendTapDark: StoryObj<typeof meta> = { ...sendTap, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const SendTapLight: StoryObj<typeof meta> = { ...sendTap, globals: { mode: 'light', viewport: { value: 'm390' } } }

const fieldToField: StoryObj<typeof meta> = {
  ...withFakeViewport,
  render: () => <PhoneChat titled />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const canvas = within(canvasElement)
    const root = shellRoot(canvasElement)
    const title = canvas.getByRole('textbox', { name: 'Title' })
    const message = canvas.getByRole('textbox', { name: 'Message' })
    const composer = () => Math.round(rect(canvas.getByRole('group', { name: 'Composer' })).bottom)
    await userEvent.click(title)
    fakeViewport.move({ height: 544 })
    await expect(composer()).toBe(544)
    // The focus moves from the title to the message while the keyboard stays open: the dock is never removed in
    // between, so the composer does not jump down and up.
    const remove = spyOn(root.style, 'removeProperty')
    await userEvent.click(message)
    await expect(message).toHaveFocus()
    await expect(remove).not.toHaveBeenCalled()
    await expect(keyboardInset(root)).toBe('266px')
    await expect(composer()).toBe(544)
    // And back with Shift+Tab, the keyboard's own way between fields.
    await userEvent.tab({ shift: true })
    await expect(title).toHaveFocus()
    await expect(remove).not.toHaveBeenCalled()
    await expect(composer()).toBe(544)
    remove.mockRestore()
  }),
}

/** Phone chat with two fields: moving the focus from one to the other while the keyboard is open keeps the dock. */
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

// The chat as a route of a phone app: Escape in the message field goes back to the list, as a route change does, and
// unmounts the field while it has the focus. The shell stays mounted, as the-bridge keeps it across its routes.
function RoutedChat() {
  const [page, setPage] = useState<'list' | 'chat'>('chat')
  return (
    <div className={screenFrame}>
      <AppShell
        size="phone"
        view={page === 'chat' ? 'detail' : 'list'}
        list={
          <section aria-label="Inbox" className={pane}>
            <Button
              onClick={() => {
                setPage('chat')
              }}
            >
              Open the chat
            </Button>
          </section>
        }
        detail={
          <>
            <section aria-label="Chat" className={pane}>
              Chat
            </section>
            <div role="group" aria-label="Composer" className={composerBox}>
              <textarea
                aria-label="Message"
                rows={1}
                className={messageField}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setPage('list')
                }}
              />
            </div>
          </>
        }
      />
    </div>
  )
}

// Unmounts the focused field with Escape and keeps the `focusout` of its removal from the document, as WebKit fires
// none when a focused element leaves the page (Chromium fires one).
const removeFocusedField = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  const field = canvas.getByRole('textbox', { name: 'Message' })
  await expect(field).toHaveFocus()
  const swallow = (event: Event) => {
    event.stopImmediatePropagation()
  }
  window.addEventListener('focusout', swallow, { capture: true })
  await userEvent.keyboard('{Escape}')
  await expect(canvas.queryByRole('textbox', { name: 'Message' })).toBeNull()
  window.removeEventListener('focusout', swallow, { capture: true })
  await expect(document.activeElement).toBe(document.body)
}

const fieldRemoved: StoryObj<typeof meta> = {
  ...withFakeViewport,
  render: () => <RoutedChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const canvas = within(canvasElement)
    const root = shellRoot(canvasElement)
    const unset = async () => {
      await expect(keyboardInset(root)).toBe('')
      await expect(getComputedStyle(canvas.getByRole('main')).paddingBottom).toBe('0px')
      await expect(Math.round(rect(root).height)).toBe(844)
    }
    // The keyboard is open for the message: the detail ends its page 266 up, at the keyboard's top (544).
    await userEvent.click(canvas.getByRole('textbox', { name: 'Message' }))
    fakeViewport.move({ height: 544 })
    await expect(keyboardInset(root)).toBe('266px')
    await expect(getComputedStyle(canvas.getByRole('main')).paddingBottom).toBe('266px')
    // A route change unmounts the field while it has the focus, with no focusout. No viewport event has come yet, so
    // the fit stays, as after any focus that leaves the fields.
    await removeFocusedField(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Open the chat' })).toBeVisible()
    await expect(keyboardInset(root)).toBe('266px')
    // The keyboard closes (a resize to 844): nothing is set, and the shell is its parent's 844 throughout.
    fakeViewport.move({ height: 844 })
    await unset()
    // Later the visual viewport shrinks by 75 with no field focused (a browser bar, or a standalone app's stale
    // viewport after a back navigation): the removed field no longer counts, so nothing docks.
    fakeViewport.move({ height: 769 })
    await unset()
    fakeViewport.move({ height: 700, offsetTop: 60 }, 'scroll')
    await unset()
    fakeViewport.move({ height: 844, offsetTop: 0 })
    // Again, and this time the keyboard closes with no visualViewport event the shell sees: the next window resize
    // drops the fit that no field needs.
    await userEvent.click(canvas.getByRole('button', { name: 'Open the chat' }))
    await userEvent.click(canvas.getByRole('textbox', { name: 'Message' }))
    fakeViewport.move({ height: 544 })
    await expect(keyboardInset(root)).toBe('266px')
    await removeFocusedField(canvasElement)
    fakeViewport.height = 844
    window.dispatchEvent(new Event('resize'))
    await unset()
  }),
}

/** Phone chat as a route: the message field is unmounted while it has the focus (a route change, no focusout), and the dock ends and follows no later viewport change. */
export const FieldRemovedDark: StoryObj<typeof meta> = { ...fieldRemoved, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const FieldRemovedLight: StoryObj<typeof meta> = { ...fieldRemoved, globals: { mode: 'light', viewport: { value: 'm390' } } }

const pageShow: StoryObj<typeof meta> = {
  ...withFakeViewport,
  render: () => <PhoneChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const canvas = within(canvasElement)
    const root = shellRoot(canvasElement)
    const field = canvas.getByRole('textbox', { name: 'Message' })
    const composer = () => Math.round(rect(canvas.getByRole('group', { name: 'Composer' })).bottom)
    await userEvent.click(field)
    fakeViewport.move({ height: 544 })
    await expect(composer()).toBe(544)
    // The focus leaves the field and the page goes into the back-forward cache before a viewport event: the fit is
    // still set when the page comes back.
    field.blur()
    await expect(keyboardInset(root)).toBe('266px')
    // The page is shown again from the cache: the shell measures again, finds no focused field and removes the fit.
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
    await expect(keyboardInset(root)).toBe('')
    await expect(composer()).toBe(844 - 34)
    await expect(Math.round(rect(root).height)).toBe(844)
    // With a field focused and the keyboard open, a pageshow keeps the fit the field needs.
    await userEvent.click(field)
    await expect(composer()).toBe(544)
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
    await expect(keyboardInset(root)).toBe('266px')
    await expect(composer()).toBe(544)
  }),
}

/** Phone chat back from the back-forward cache (`pageshow`): a dock that no focused field needs is removed, and one a focused field needs is kept. */
export const PageShowDark: StoryObj<typeof meta> = { ...pageShow, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const PageShowLight: StoryObj<typeof meta> = { ...pageShow, globals: { mode: 'light', viewport: { value: 'm390' } } }

const staleViewport: StoryObj<typeof meta> = {
  render: () => <PhoneChat />,
  parameters: { viewport: { options: phoneScreen } },
  // The visual viewport is 664 when the shell mounts: a standalone app whose viewport has not settled yet, or one
  // that a closed keyboard left short.
  beforeEach: () => fakeDevice(664),
  play: async ({ canvasElement }) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const canvas = within(canvasElement)
    const root = shellRoot(canvasElement)
    const field = canvas.getByRole('textbox', { name: 'Message' })
    const composer = () => Math.round(rect(canvas.getByRole('group', { name: 'Composer' })).bottom)
    const full = async () => {
      await expect(keyboardInset(root)).toBe('')
      await expect(composer()).toBe(844 - 34)
      await expect(Math.round(rect(root).height)).toBe(844)
    }
    // At mount, with no field focused, the stale 664 is not followed: nothing docks.
    await full()
    // A field fits the 664 at once; after a blur the fit stays (no viewport event), and the phone turns: the
    // orientationchange drops the fit.
    await userEvent.click(field)
    await expect(composer()).toBe(664)
    field.blur()
    await expect(composer()).toBe(664)
    window.dispatchEvent(new Event('orientationchange'))
    await full()
    // The same with a window resize and no visualViewport event.
    await userEvent.click(field)
    await expect(composer()).toBe(664)
    field.blur()
    window.dispatchEvent(new Event('resize'))
    await full()
  },
}

/** Phone chat with a stale, smaller visual viewport and no field focused: nothing docks at mount or after an orientationchange or a window resize. */
export const StaleViewportDark: StoryObj<typeof meta> = { ...staleViewport, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const StaleViewportLight: StoryObj<typeof meta> = { ...staleViewport, globals: { mode: 'light', viewport: { value: 'm390' } } }

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
  beforeEach: () => fakeDevice(),
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const canvas = within(canvasElement)
    await expect([...fakeViewport.listening].sort()).toEqual(['resize', 'scroll'])
    const remove = spyOn(fakeViewport, 'removeEventListener')
    const removeFromDocument = spyOn(document, 'removeEventListener')
    const removeFromWindow = spyOn(window, 'removeEventListener')
    await userEvent.click(canvas.getByRole('button', { name: 'Close the chat' }))
    await expect(canvas.getByText('Closed')).toBeVisible()
    await expect(remove).toHaveBeenCalledWith('resize', expect.any(Function))
    await expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function))
    await expect(removeFromDocument).toHaveBeenCalledWith('focusin', expect.any(Function))
    await expect(removeFromDocument).toHaveBeenCalledWith('focusout', expect.any(Function))
    await expect(removeFromDocument).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    removeFromDocument.mockRestore()
    for (const type of ['resize', 'orientationchange', 'pageshow']) await expect(removeFromWindow).toHaveBeenCalledWith(type, expect.any(Function))
    removeFromWindow.mockRestore()
    await expect(fakeViewport.listening.size).toBe(0)
    // A keyboard after the unmount reaches nothing and throws nothing.
    fakeViewport.move({ height: 544 })
    await expect(canvasElement.querySelector('.app-shell__root')).toBeNull()
  }),
}

// A chat thread long enough to scroll, with the composer docked as the ScrollFrame's footer, as the-bridge's Inbox
// chat on the phone.
const messages = Array.from({ length: 40 }, (_, i) => `Message ${String(i + 1)} of the thread`)
// A line only screen readers read, positioned absolutely as Message's `message__srName` is.
const srOnlyLine = css({ srOnly: true })
function ThreadChat({ srLine = false, foot, send = false }: { srLine?: boolean; foot?: '12' | undefined; send?: boolean }) {
  return (
    <div className={screenFrame}>
      <AppShell
        size="phone"
        view="detail"
        detail={
          <ScrollFrame
            bodyClassName={frameBody}
            foot={foot}
            footer={
              <div role="group" aria-label="Composer" className={composerBox}>
                <textarea aria-label="Message" rows={1} className={messageField} />
                {send ? (
                  <button type="button" data-keyboard-keep="">
                    Send
                  </button>
                ) : null}
              </div>
            }
          >
            {messages.map((m) => (
              <p key={m} className={text}>
                {m}
              </p>
            ))}
            {srLine ? (
              <p className={text}>
                <span className={srOnlyLine}>Claude said:</span>
                The last line of the thread.
              </p>
            ) : null}
          </ScrollFrame>
        }
      />
    </div>
  )
}

type Frame = { shell: number; rise: number }
// How far the dock (the ScrollFrame footer) is moved up from its place, read from its transform as the browser paints
// it, so a transition shows each step.
const riseOf = (footer: HTMLElement) => 0 - new DOMMatrixReadOnly(getComputedStyle(footer).transform).m42
// Records the shell's height and the dock's rise at every frame until `stop`.
const recordFrames = (root: HTMLElement, footer: HTMLElement) => {
  const frames: Frame[] = []
  let id = 0
  const tick = () => {
    frames.push({ shell: Math.round(rect(root).height), rise: riseOf(footer) })
    id = requestAnimationFrame(tick)
  }
  tick()
  return {
    frames,
    stop: () => {
      cancelAnimationFrame(id)
      tick()
      cancelAnimationFrame(id)
    },
  }
}
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))
// Moves the visual viewport's height through `heights`, one resize a frame, as iOS reports a keyboard in steps.
const stepViewport = async (viewport: FakeViewport, heights: number[]) => {
  for (const height of heights) {
    viewport.move({ height })
    await nextFrame()
  }
}
const rising = [794, 744, 694, 644, 594, 544]
const falling = [594, 644, 694, 744, 794, 844]
// Each frame's rise against the one before: 1 up, -1 down, 0 still.
const directions = (frames: Frame[]) => frames.slice(1).map((f, i) => Math.sign(f.rise - (frames[i]?.rise ?? f.rise)))
const threadParts = (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  return {
    canvas,
    root: shellRoot(canvasElement),
    footer: slotOf(canvasElement, 'scroll-frame__footer'),
    field: canvas.getByRole('textbox', { name: 'Message' }),
    composer: () => rect(canvas.getByRole('group', { name: 'Composer' })),
  }
}

// Whether the page has had a user's press, as `navigator.userActivation` tells it: a story fixes it, as the story test
// runner's own clicks in earlier stories leave the document active.
const fakeActivation = (active: boolean) => {
  Object.defineProperty(navigator, 'userActivation', { configurable: true, value: { hasBeenActive: active, isActive: active } })
}

// A touch screen with motion and no VirtualKeyboard API, as iOS Safari: a field's focus starts the dock at once, to
// the expected keyboard, and each move runs on the keyboard's curve.
const withMotion = {
  ...withFakeViewport,
  beforeEach: () => {
    // Each story starts with no keyboard measured, as a fresh page does.
    keyboardMeasures.clear()
    fakeViewport = new FakeViewport()
    const restoreViewport = replaceVisualViewport(fakeViewport)
    const restoreMedia = emulateMedia({ coarse: true, reduce: false })
    Object.defineProperty(navigator, 'virtualKeyboard', { configurable: true, value: undefined })
    // The user has pressed on the page before, so a focus may open the keyboard; `LoadFocus` takes this back.
    fakeActivation(true)
    return () => {
      Reflect.deleteProperty(navigator, 'userActivation')
      Reflect.deleteProperty(navigator, 'virtualKeyboard')
      restoreMedia()
      restoreViewport()
    }
  },
}
const settled = (footer: HTMLElement, rise: number) => waitFor(() => expect(riseOf(footer)).toBe(rise), { timeout: 2000 })

// The time a frame draws: the document timeline's, at which the browser samples the dock's animations. A busy main
// thread starts a frame late, and its timeline time is then earlier than `performance.now()` in it (97 ms after a
// 100 ms hold in Chromium); the compositor draws the animations on its own clock (screen review R39).
const drawnTime = () => {
  const time = document.timeline.currentTime
  return typeof time === 'number' ? time : performance.now()
}
// The dock's rise at every frame, with the time of the frame and the time it draws, until `stop`.
const recordRise = (footer: HTMLElement, root?: HTMLElement) => {
  const frames: { at: number; drawn: number; rise: number; inset: string }[] = []
  let id = 0
  const tick = () => {
    frames.push({ at: performance.now(), drawn: drawnTime(), rise: riseOf(footer), inset: root?.style.getPropertyValue('--app-shell-keyboard') ?? '' })
    id = requestAnimationFrame(tick)
  }
  tick()
  return {
    frames,
    stop: () => {
      cancelAnimationFrame(id)
      tick()
      cancelAnimationFrame(id)
    },
  }
}
// The time, in ms from a move's start, at which the keyboard curve reaches `progress` (0 to 1), from the tokens.
const curveTime = (progress: number) => {
  const [x1 = 0, y1 = 0, x2 = 1, y2 = 1] = (token('easings.keyboard').match(/-?\d*\.?\d+/g) ?? []).map(Number)
  const bezier = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3
  let low = 0
  let high = 1
  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2
    if (bezier(y1, y2, mid) < progress) low = mid
    else high = mid
  }
  return bezier(x1, x2, high) * Number.parseFloat(token('durations.keyboard'))
}
// The rise one frame after the first frame drawn at `at` or later: the recorder can run before the hook in a frame,
// and then reads the frame before.
const riseAfter = (frames: { at: number; rise: number }[], at: number) => {
  const index = frames.findIndex((f) => f.at >= at)
  return Math.round(frames[index + 1]?.rise ?? frames[index]?.rise ?? 0)
}
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
// The dock's move, from the tokens, and how far back a move that starts at a keyboard's report starts its clock: iOS
// reports an opening keyboard that has moved for about 50 ms (AppShell's `keyboardReportLag`, screen review R37).
const motionMs = cssDuration(token('durations.keyboard'))
// The time after the keyboard's last report at which its measure settles (`blurEndDelay` in app-shell.tsx).
const settleMs = 300
const reportLag = 50
// A first open where the real keyboard is 50 px off the 380 guess, reported `delay` ms after the focus. Before the
// report the composer stays down: iOS starts its keyboard 60 to 120 ms after the focus, and a dock that rose at the
// focus was up before the keyboard showed (screen review R37). From the report it makes one move that ends on the real
// keyboard, on the keyboard's clock (the report less the lag, never before the focus), as the Claude iOS app's does
// (screen review R22, rec3), with no hold and no second move.
const guessOff = (real: number, delay: number, frames = 0): StoryObj<typeof meta> => ({
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { root, footer, field } = threadParts(canvasElement)
    const rise = real - 34
    const record = recordRise(footer)
    const focused = performance.now()
    await userEvent.click(field)
    const focusDone = performance.now()
    await expect(root.dataset.keyboardEnd).toBeUndefined()
    if (delay > 0) await wait(delay)
    for (let i = 0; i < frames; i++) await nextFrame()
    const reported = performance.now()
    fakeViewport.move({ height: 844 - real })
    const reportDone = performance.now()
    const endAfterReport = Number(root.dataset.keyboardEnd)
    await settled(footer, rise)
    await nextFrame()
    record.stop()
    const moved = record.frames.filter((f) => f.at >= focused)
    // Nothing moves before the report, and from it each frame moves toward the real keyboard, never away.
    await expect(moved.filter((f) => f.at < reported && f.rise !== 0)).toEqual([])
    const after = moved.filter((f) => f.at >= reported)
    await expect(after.slice(1).filter((f, i) => Math.abs(rise - f.rise) > Math.abs(rise - (after[i]?.rise ?? f.rise)))).toEqual([])
    // One move of the keyboard's time, on the keyboard's clock.
    await expect(endAfterReport).toBeGreaterThanOrEqual(Math.max(focused, reported - reportLag) + motionMs)
    await expect(endAfterReport).toBeLessThanOrEqual(Math.max(focusDone, reportDone - reportLag) + motionMs)
    // The drawn dock is on the keyboard by that end, with one frame of slack (Codex review of #242).
    await expect(riseAfter(moved, endAfterReport)).toBe(rise)
    await expect(moved.filter((f) => f.rise > rise + 1)).toEqual([])
  }),
})
const phone = { viewport: { value: 'm390' } }
/** First open, the real keyboard 50 px lower than the guess, reported a frame after the focus: one rise from the report, on time. */
export const GuessHighDuringDark = { ...guessOff(330, 0, 1), globals: { mode: 'dark', ...phone } }
export const GuessHighDuringLight = { ...guessOff(330, 0, 1), globals: { mode: 'light', ...phone } }
/** First open, the real keyboard 50 px higher than the guess, reported a frame after the focus: one rise from the report, on time. */
export const GuessLowDuringDark = { ...guessOff(430, 0, 1), globals: { mode: 'dark', ...phone } }
export const GuessLowDuringLight = { ...guessOff(430, 0, 1), globals: { mode: 'light', ...phone } }
/** First open in the Home Screen app (the Workbench trace of screen review R25): the 403 px keyboard reported 150 ms after the focus, against Figma's 380: one rise from the report, on time. */
export const GuessTraceDark = { ...guessOff(403, 150), globals: { mode: 'dark', ...phone } }
export const GuessTraceLight = { ...guessOff(403, 150), globals: { mode: 'light', ...phone } }
/** First open, the real keyboard 50 px lower than the guess, reported 400 ms after the focus: one rise from the report. */
export const GuessHighAfterDark = { ...guessOff(330, 400), globals: { mode: 'dark', ...phone } }
export const GuessHighAfterLight = { ...guessOff(330, 400), globals: { mode: 'light', ...phone } }

// A composer that takes the focus as it mounts, before AppShell's effect runs, as the-bridge's chat does when the Inbox
// opens it (screen review R23).
function MountFocusField() {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    ref.current?.focus()
  }, [])
  return <textarea ref={ref} aria-label="Message" rows={1} className={messageField} />
}
function MountFocusChat() {
  return (
    <div className={screenFrame}>
      <AppShell
        size="phone"
        view="detail"
        detail={
          <ScrollFrame
            bodyClassName={frameBody}
            footer={
              <div role="group" aria-label="Composer" className={composerBox}>
                <MountFocusField />
              </div>
            }
          >
            {messages.map((m) => (
              <p key={m} className={text}>
                {m}
              </p>
            ))}
          </ScrollFrame>
        }
      />
    </div>
  )
}
const mountFocus: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <MountFocusChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { root, footer, field } = threadParts(canvasElement)
    await expect(field).toHaveFocus()
    // The focus that comes with the mount opens the keyboard as a tap's does: the dock waits for the keyboard's report,
    // which iOS sends as it first draws the keyboard (screen review R37), and rises with it in one move on the
    // keyboard's clock, as on any later open (screen review R23). Before it nothing moves.
    const record = recordRise(footer, root)
    await nextFrame()
    await nextFrame()
    await expect(root.dataset.keyboardEnd).toBeUndefined()
    const reported = performance.now()
    fakeViewport.move({ height: 544 })
    await expect(Number(root.dataset.keyboardEnd)).toBeGreaterThanOrEqual(reported - reportLag + motionMs)
    await expect(Number(root.dataset.keyboardEnd)).toBeLessThanOrEqual(performance.now() + motionMs)
    await settled(footer, 266)
    record.stop()
    await expect(record.frames.filter((f) => f.at < reported && f.rise !== 0)).toEqual([])
    await expect(record.frames.slice(1).filter((f, i) => f.rise < (record.frames[i]?.rise ?? f.rise))).toEqual([])
  }),
}
/** Phone chat whose composer takes the focus as it mounts: the dock rises with the keyboard's report, in one move. */
export const MountFocusDark: StoryObj<typeof meta> = { ...mountFocus, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const MountFocusLight: StoryObj<typeof meta> = { ...mountFocus, globals: { mode: 'light', viewport: { value: 'm390' } } }

// A page that loads with its composer focused (the-bridge's Workspaces chat, autofocused): iOS opens no keyboard for a
// focus that no user's press started, and the page has had none. The dock must stay down until a keyboard is reported,
// not rise to Figma's guess for the settle's second (the iPad mini in the iOS 26.5 Simulator, beta.98: 346 px for
// about 1 s at load). A real keyboard then docks as before.
const loadFocus: StoryObj<typeof meta> = {
  ...withMotion,
  beforeEach: () => {
    const restore = withMotion.beforeEach()
    fakeActivation(false)
    return restore
  },
  render: () => <MountFocusChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { root, footer, field } = threadParts(canvasElement)
    await expect(field).toHaveFocus()
    const record = recordRise(footer, root)
    // Past the settle's wait (1000 ms after the focus) with no report: nothing moves and nothing is set.
    await wait(1200)
    record.stop()
    await expect(record.frames.filter((f) => f.rise !== 0 || f.inset !== '')).toEqual([])
    await expect(root.dataset.keyboardEnd).toBeUndefined()
    // A keyboard that does show (a later press on the field) is reported and docked as before.
    fakeViewport.move({ height: 544 })
    await settled(footer, 266)
    await waitFor(() => expect(keyboardInset(root)).toBe('266px'))
  }),
}
/** Phone chat that loads with its composer focused and no press on the page yet: no keyboard, so the dock stays down until one is reported. */
export const LoadFocusDark: StoryObj<typeof meta> = { ...loadFocus, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const LoadFocusLight: StoryObj<typeof meta> = { ...loadFocus, globals: { mode: 'light', viewport: { value: 'm390' } } }

// The Inbox opens a chat: a new AppShell mounts after the keyboard was measured in another one. The play function
// turns the page with `pages.next`; a button would sit above the shell and move it down the screen.
const pages = { next: (): void => undefined }
function RemountChat() {
  const [page, setPage] = useState(0)
  useEffect(() => {
    pages.next = () => {
      setPage((p) => p + 1)
    }
  }, [])
  return <ThreadChat key={page} />
}
const remountMeasure: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <RemountChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const first = threadParts(canvasElement)
    await userEvent.click(first.field)
    fakeViewport.move({ height: 544 })
    await settled(first.footer, 266)
    first.field.blur()
    fakeViewport.move({ height: 844 })
    await settled(first.footer, 0)
    const old = first.field
    pages.next()
    await waitFor(() => expect(threadParts(canvasElement).field).not.toBe(old))
    // The new page's shell expects the 300 keyboard measured on the last page: a keyboard that reports an early step
    // of its rise and then the rest takes the dock to 266, and never past it (not toward Figma's 380).
    const next = threadParts(canvasElement)
    const record = recordRise(next.footer)
    await userEvent.click(next.field)
    fakeViewport.move({ height: 744 })
    await nextFrame()
    await nextFrame()
    fakeViewport.move({ height: 544 })
    await waitFor(() => expect(riseOf(next.footer)).toBe(266))
    record.stop()
    await expect(Math.max(...record.frames.map((f) => f.rise))).toBe(266)
  }),
}
/** Phone chat on a new page: the shell that mounts there expects the keyboard measured on the last page. */
export const RemountMeasureDark: StoryObj<typeof meta> = { ...remountMeasure, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const RemountMeasureLight: StoryObj<typeof meta> = { ...remountMeasure, globals: { mode: 'light', viewport: { value: 'm390' } } }

const reopenFalling: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { root, footer, field } = threadParts(canvasElement)
    await userEvent.click(field)
    fakeViewport.move({ height: 544 })
    await settled(footer, 266)
    field.blur()
    fakeViewport.move({ height: 844 })
    // The field takes the focus again while the dock comes down: the rise is a new move on the keyboard's curve, not
    // the rest of the fall's, so it takes the keyboard's full time and does not jump. Wait for the dock to be halfway down, whatever the runner's frame rate.
    await waitFor(() => expect(riseOf(footer)).toBeLessThan(133), { timeout: 2000 })
    const timed = recordRise(footer, root)
    const start = performance.now()
    await userEvent.click(field)
    fakeViewport.move({ height: 544 })
    const reported = performance.now()
    // The dock's own end for the rise: a new move of the keyboard's time from the focus, not the end the fall had.
    const riseEnd = Number(root.dataset.keyboardEnd)
    await expect(riseEnd).toBeGreaterThanOrEqual(start + motionMs)
    await expect(riseEnd).toBeLessThanOrEqual(reported + motionMs)
    await settled(footer, 266)
    timed.stop()
    // The first frame at the end: the dock's own inset, which has full precision, not the computed transform, which
    // has six digits and reads 266 a fraction of a millisecond before the end.
    const last = root.style.getPropertyValue('--app-shell-keyboard')
    const up = timed.frames.find((f) => f.at >= start && f.inset === last)?.at ?? 0
    // The layout rounds the inset to 1/64 px, so the drawn inset is the last one once the curve is within 1/64 px of
    // its end: no frame shows it before then.
    const distance = 266 - (timed.frames[0]?.rise ?? 0)
    await expect(up - start).toBeGreaterThanOrEqual(curveTime(1 - 1 / 64 / distance))
    // The layout takes the inset at the move's end (screen review R39), so the drawn rise tells the curve too: no frame
    // draws the dock within half a px of its end before the curve gets there.
    const shownUp = timed.frames.find((f) => f.at >= start && f.rise >= 266 - 0.5)?.at ?? 0
    await expect(shownUp - start).toBeGreaterThanOrEqual(curveTime(1 - 0.5 / distance))
    // Every frame drawn in the rise, before its end, shows the dock on the way; a loaded runner may draw none.
    const during = timed.frames.filter((f) => f.at > start && f.at < riseEnd - 17)
    await expect(during.filter((f) => !(f.rise > 0 && f.rise < 266))).toEqual([])
  }),
}
/** Phone chat: the field takes the focus again while the composer comes down; it rises on a full keyboard move. */
export const ReopenFallingDark: StoryObj<typeof meta> = { ...reopenFalling, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const ReopenFallingLight: StoryObj<typeof meta> = { ...reopenFalling, globals: { mode: 'light', viewport: { value: 'm390' } } }

// The keyboard of the-bridge's keyboard:served check: it reports its height in every frame, on the keyboard's own
// curve, from a few frames after the focus. Once it is all the way open, the composer must sit on its top in every
// frame.
const curveAt = (ms: number) => {
  const [x1 = 0, y1 = 0, x2 = 1, y2 = 1] = (token('easings.keyboard').match(/-?\d*\.?\d+/g) ?? []).map(Number)
  const bezier = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3
  const x = Math.min(1, Math.max(0, ms / Number.parseFloat(token('durations.keyboard'))))
  let low = 0
  let high = 1
  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2
    if (bezier(x1, x2, mid) < x) low = mid
    else high = mid
  }
  return bezier(y1, y2, high)
}
const frameKeyboard = async (viewport: FakeViewport, keyboard: number, direction: 'open' | 'close') => {
  const from = performance.now()
  const duration = Number.parseFloat(token('durations.keyboard'))
  for (;;) {
    const ms = performance.now() - from
    const p = curveAt(ms)
    viewport.move({ height: 844 - Math.round(keyboard * (direction === 'open' ? p : 1 - p)) })
    if (ms >= duration) return
    await nextFrame()
  }
}
const frameSteps = (delay: number): StoryObj<typeof meta> => ({
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { field, composer } = threadParts(canvasElement)
    for (let open = 0; open < 2; open++) {
      await userEvent.click(field)
      for (let i = 0; i < delay; i++) await nextFrame()
      await frameKeyboard(fakeViewport, 336, 'open')
      // Each frame that draws a time after the keyboard stopped (`drawnTime`: a slow frame draws a time before it starts).
      const stopped = performance.now()
      const off: number[] = []
      const until = performance.now() + 400
      while (performance.now() < until) {
        if (drawnTime() >= stopped) off.push(Math.round((composer().bottom - (844 - 336)) * 10) / 10)
        await nextFrame()
      }
      await expect(off.length).toBeGreaterThan(0)
      await expect(off.filter((v) => v > 0.5)).toEqual([])
      field.blur()
      await frameKeyboard(fakeViewport, 336, 'close')
      await wait(400)
    }
  }),
})
// iOS draws no frame of the page for about 100 ms after the focus (the iPhone traces of screen review R26), at 60 or
// 30 fps. The story holds the main thread for 100 ms after the focus, and with `frameMs` 33 holds each frame to 33 ms.
const busy = (ms: number) => {
  const until = performance.now() + ms
  let spins = 0
  while (performance.now() < until) spins++
  return spins
}
// A loaded CI runner draws each frame in about 50 ms, so a keyboard that reports in each frame reports 50 ms or more
// apart. The dock still follows it as frame by frame, as the limit grows with the frames it measured, and is on the
// keyboard from its last report (`Frame Steps Later` failed on CI with the composer 2.4 px under it).
const frameStepsSlow: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { field, composer } = threadParts(canvasElement)
    let slow = true
    const hold = () => {
      if (!slow) return
      busy(50)
      requestAnimationFrame(hold)
    }
    requestAnimationFrame(hold)
    try {
      for (let open = 0; open < 2; open++) {
        await userEvent.click(field)
        await nextFrame()
        await frameKeyboard(fakeViewport, 336, 'open')
        // Each frame that draws a time after the keyboard stopped, as in Frame Steps.
        const stopped = performance.now()
        const off: number[] = []
        const until = performance.now() + 400
        while (performance.now() < until) {
          if (drawnTime() >= stopped) off.push(Math.round((composer().bottom - (844 - 336)) * 10) / 10)
          await nextFrame()
        }
        await expect(off.length).toBeGreaterThan(0)
        await expect(off.filter((v) => v > 0.5)).toEqual([])
        field.blur()
        await frameKeyboard(fakeViewport, 336, 'close')
        await wait(400)
      }
    } finally {
      slow = false
    }
  }),
}
// A runner slow at random times: three frames in ten are held from 30 to 120 ms, from a fixed seed, so each run holds
// the same frames. The focus waits 8 frames, as `Frame Steps Later` does, which failed on CI with the composer 9 px
// under the keyboard after it stopped.
const frameStepsJank: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { field, composer } = threadParts(canvasElement)
    let seed = 23
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }
    let slow = true
    const hold = () => {
      if (!slow) return
      if (random() < 0.3) busy(30 + random() * 90)
      requestAnimationFrame(hold)
    }
    requestAnimationFrame(hold)
    try {
      for (let open = 0; open < 2; open++) {
        await userEvent.click(field)
        for (let i = 0; i < 8; i++) await nextFrame()
        await frameKeyboard(fakeViewport, 336, 'open')
        // Each frame that draws a time after the keyboard stopped, as in Frame Steps.
        const stopped = performance.now()
        const off: number[] = []
        const until = performance.now() + 400
        while (performance.now() < until) {
          if (drawnTime() >= stopped) off.push(Math.round((composer().bottom - (844 - 336)) * 10) / 10)
          await nextFrame()
        }
        await expect(off.length).toBeGreaterThan(0)
        await expect(off.filter((v) => v > 0.5)).toEqual([])
        field.blur()
        await frameKeyboard(fakeViewport, 336, 'close')
        await wait(400)
      }
    } finally {
      slow = false
    }
  }),
}
/** A keyboard that reports in each frame, on a runner with random slow frames: the composer stays on the keyboard. */
export const FrameStepsJankDark: StoryObj<typeof meta> = { ...frameStepsJank, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const FrameStepsJankLight: StoryObj<typeof meta> = { ...frameStepsJank, globals: { mode: 'light', viewport: { value: 'm390' } } }
/** A keyboard that reports in each frame, on a device whose frames take 50 ms: the composer stays on the keyboard. */
export const FrameStepsSlowDark: StoryObj<typeof meta> = { ...frameStepsSlow, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const FrameStepsSlowLight: StoryObj<typeof meta> = { ...frameStepsSlow, globals: { mode: 'light', viewport: { value: 'm390' } } }
const lateFirstFrame = (frameMs: number): StoryObj<typeof meta> => ({
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { root, footer, field } = threadParts(canvasElement)
    let throttling = frameMs > 17
    const throttle = () => {
      if (!throttling) return
      busy(frameMs - 4)
      requestAnimationFrame(throttle)
    }
    requestAnimationFrame(throttle)
    const timed = recordRise(footer, root)
    await userEvent.click(field)
    // iOS reports the keyboard 60 to 120 ms after the focus, and the page then draws no frame for 100 ms. The hold
    // starts in the report, after the shell's handler, so no frame comes between the move's start and it.
    await wait(120)
    let heldUntil = 0
    fakeViewport.addEventListener(
      'resize',
      () => {
        busy(100)
        heldUntil = performance.now()
      },
      { once: true },
    )
    const reported = performance.now()
    fakeViewport.move({ height: 844 - 380 })
    await settled(footer, 346)
    throttling = false
    timed.stop()
    // The move runs on the keyboard's clock, from the report less the lag, not from its first drawn frame: the
    // keyboard does not wait for the page's frames.
    const moveStart = Number(root.dataset.keyboardEnd) - motionMs
    await expect(moveStart).toBeGreaterThanOrEqual(reported - reportLag)
    await expect(moveStart).toBeLessThanOrEqual(heldUntil - 100 - reportLag)
    // So the first frame with the dock up shows it where the keyboard is at the time it draws, at least the curve at
    // that time (the 380 keyboard less the 34 safe area under it). The frame after the hold draws a time from before
    // its end (`drawnTime`), so that time is the one to check, not the hold's end.
    const first = timed.frames.find((f) => f.rise > 0)
    if (first === undefined) throw new Error('no frame with the dock up')
    await expect(first.rise).toBeGreaterThanOrEqual(Math.floor(curveAt(first.drawn - moveStart) * 380 - 34))
  }),
})
/**
 * Phone chat at 30 fps (an iPhone in Low Power Mode, the case of screen review R26) where the page draws no frame for
 * 100 ms after the keyboard's report: the dock's first frame shows it where the keyboard is by then.
 */
export const LateFirstFrame30Dark: StoryObj<typeof meta> = { ...lateFirstFrame(33), globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const LateFirstFrame30Light: StoryObj<typeof meta> = { ...lateFirstFrame(33), globals: { mode: 'light', viewport: { value: 'm390' } } }
// The keyboard's report comes before the move's late first frame, and a second report (a correction) before it too:
// the move still starts where the dock is, and every frame rises toward the keyboard, never below the start (Codex
// review of #280).
const lateFirstFrameCorrection: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { root, footer, field } = threadParts(canvasElement)
    const timed = recordRise(footer, root)
    await userEvent.click(field)
    await wait(120)
    // The page draws nothing for 100 ms after the first report, and a corrected report comes at the end of that time,
    // before the first frame. The hold starts in the report, after the shell's handler.
    let reported = 0
    fakeViewport.addEventListener(
      'resize',
      () => {
        busy(100)
        reported = performance.now()
        fakeViewport.move({ height: 844 - 330 })
      },
      { once: true },
    )
    fakeViewport.move({ height: 844 - 380 })
    await settled(footer, 296)
    await nextFrame()
    timed.stop()
    const moved = timed.frames
    await expect(moved.filter((f) => f.rise < 0)).toEqual([])
    await expect(moved.slice(1).filter((f, i) => f.rise < (moved[i]?.rise ?? f.rise))).toEqual([])
    // The dock is up from the second frame after the reports (the recorder can read a frame before the shell paints
    // it), not held at the bottom.
    const afterReport = moved.filter((f) => f.at > reported)
    await expect(afterReport[1]?.rise ?? 0).toBeGreaterThan(0)
    await expect(moved.filter((f) => f.rise > 346 + 1)).toEqual([])
  }),
}
/** Phone chat: the keyboard reports twice before the dock's late first frame; the composer only rises. */
export const LateFirstFrameCorrectionDark: StoryObj<typeof meta> = { ...lateFirstFrameCorrection, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const LateFirstFrameCorrectionLight: StoryObj<typeof meta> = { ...lateFirstFrameCorrection, globals: { mode: 'light', viewport: { value: 'm390' } } }
/** The same at 60 fps. */
export const LateFirstFrameDark: StoryObj<typeof meta> = { ...lateFirstFrame(17), globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const LateFirstFrameLight: StoryObj<typeof meta> = { ...lateFirstFrame(17), globals: { mode: 'light', viewport: { value: 'm390' } } }

/** Phone chat with a keyboard that reports its height in every frame, a frame after the focus. */
export const FrameStepsSoonDark: StoryObj<typeof meta> = { ...frameSteps(1), globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const FrameStepsSoonLight: StoryObj<typeof meta> = { ...frameSteps(1), globals: { mode: 'light', viewport: { value: 'm390' } } }
/** Phone chat with a keyboard that reports its height in every frame, from four frames after the focus. */
export const FrameStepsLateDark: StoryObj<typeof meta> = { ...frameSteps(4), globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const FrameStepsLateLight: StoryObj<typeof meta> = { ...frameSteps(4), globals: { mode: 'light', viewport: { value: 'm390' } } }
/** Phone chat with a keyboard that reports its height in every frame, from eight frames after the focus. */
export const FrameStepsLaterDark: StoryObj<typeof meta> = { ...frameSteps(8), globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const FrameStepsLaterLight: StoryObj<typeof meta> = { ...frameSteps(8), globals: { mode: 'light', viewport: { value: 'm390' } } }

const reopenAboveOrigin: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { root, footer, field } = threadParts(canvasElement)
    // The keyboard settles at 300, and then grows by 1 px: the fall starts 1 px above the 300 the next open expects.
    await userEvent.click(field)
    fakeViewport.move({ height: 544 })
    await settled(footer, 266)
    await wait(400)
    fakeViewport.move({ height: 543 })
    await settled(footer, 267)
    field.blur()
    fakeViewport.move({ height: 844 })
    await waitFor(() => expect(riseOf(footer)).toBeLessThan(133), { timeout: 2000 })
    // The reopen goes back to where the fall began, within the keyboard's small step: it is a new move of the
    // keyboard's time, not a correction that keeps the fall's end (a float error of 0.0004 px in that place made a
    // 138 ms rise).
    const start = performance.now()
    await userEvent.click(field)
    fakeViewport.move({ height: 544 })
    await expect(Number(root.dataset.keyboardEnd)).toBeGreaterThanOrEqual(start + motionMs)
    await settled(footer, 266)
  }),
}
/** Phone chat: the field takes the focus again while the composer comes down from 1 px above the measured keyboard. */
export const ReopenAboveOriginDark: StoryObj<typeof meta> = { ...reopenAboveOrigin, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const ReopenAboveOriginLight: StoryObj<typeof meta> = { ...reopenAboveOrigin, globals: { mode: 'light', viewport: { value: 'm390' } } }

const quickClose: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { root, footer, field } = threadParts(canvasElement)
    // The keyboard reports 330 a frame after the focus, and the field loses the focus as the keyboard closes a frame
    // after that: targets less than 50 ms apart. The close is a new move from the focusout, not a frame step of the
    // keyboard, so the composer comes down on the curve (Codex review of #274).
    await userEvent.click(field)
    await nextFrame()
    fakeViewport.move({ height: 844 - 330 })
    await nextFrame()
    const closed = performance.now()
    field.blur()
    fakeViewport.move({ height: 844 })
    await expect(Number(root.dataset.keyboardEnd)).toBeGreaterThanOrEqual(closed + motionMs)
    await settled(footer, 0)
  }),
}
/** Phone chat whose keyboard closes a frame after its report: the composer comes down on the curve. */
export const QuickCloseDark: StoryObj<typeof meta> = { ...quickClose, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const QuickCloseLight: StoryObj<typeof meta> = { ...quickClose, globals: { mode: 'light', viewport: { value: 'm390' } } }

const closeAfterCorrection: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { root, footer, field } = threadParts(canvasElement)
    // The real keyboard is 50 px over the guess; the keyboard closes before the rise ends. The fall is a new move on
    // the curve from where the dock is, not the rest of the rise's (Codex review of #236).
    await userEvent.click(field)
    fakeViewport.move({ height: 844 - 430 })
    await wait(60)
    // And the rise is under way: a loaded runner can draw no frame in those 60 ms, and a fall from no rise has no
    // curve to check (Close After Correction Light measured 0 for 2.7 ms in a 2-CPU Linux run).
    await waitFor(() => expect(riseOf(footer)).toBeGreaterThan(0), { timeout: 2000 })
    const timed = recordRise(footer, root)
    const start = performance.now()
    const from = riseOf(footer) + 34
    field.blur()
    const closed = performance.now()
    fakeViewport.move({ height: 844 })
    // The dock's own end for the fall: a new move of the keyboard's time from the close, not the end the rise had.
    const fallEnd = Number(root.dataset.keyboardEnd)
    await expect(fallEnd).toBeGreaterThanOrEqual(start + motionMs)
    await expect(fallEnd).toBeLessThanOrEqual(closed + motionMs)
    // A wait, not a check: a loaded runner can draw no frame for seconds.
    await waitFor(() => expect(root.style.getPropertyValue('--app-shell-keyboard')).toBe(''), { timeout: 10000 })
    // The layout drops the inset at the fall's start (screen review R39), so the wait is also for the drawn dock.
    await waitFor(() => expect(riseOf(footer)).toBe(0), { timeout: 10000 })
    await nextFrame()
    timed.stop()
    // The first frame that draws the dock down (the layout drops the inset at the fall's start, screen review R39).
    const down = timed.frames.find((f) => f.at >= start && f.rise <= 0)?.at ?? 0
    await expect(down - start).toBeGreaterThanOrEqual(curveTime(1 - 34 / from))
  }),
}
/** Phone chat: the keyboard closes during a corrected rise; the composer comes down on a full keyboard move. */
export const CloseAfterCorrectionDark: StoryObj<typeof meta> = { ...closeAfterCorrection, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const CloseAfterCorrectionLight: StoryObj<typeof meta> = { ...closeAfterCorrection, globals: { mode: 'light', viewport: { value: 'm390' } } }

const lateStep: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { root, footer, field } = threadParts(canvasElement)
    // The keyboard reports its last small steps late in the dock's move and after it, as a keyboard that rises frame
    // by frame does (the-bridge keyboard:served on Workspaces, beta.80). A step late in the move keeps the move's end,
    // and the dock is on the keyboard at that end; a step after the move is followed at the next frame. Neither starts
    // a new move of the keyboard's time that leaves the dock a pixel off the keyboard.
    const record = recordRise(footer, root)
    await userEvent.click(field)
    fakeViewport.move({ height: 544 })
    await nextFrame()
    const end = Number(root.dataset.keyboardEnd)
    await waitFor(() => expect(performance.now()).toBeGreaterThan(end - 20), { timeout: 2000, interval: 5 })
    const late = performance.now()
    fakeViewport.move({ height: 543 })
    if (late < end) await expect(Number(root.dataset.keyboardEnd)).toBe(end)
    await settled(footer, 267)
    const atEnd = Number(root.dataset.keyboardEnd)
    fakeViewport.move({ height: 542 })
    await nextFrame()
    await expect(riseOf(footer)).toBe(268)
    record.stop()
    // From one frame after the move's end (the recorder can run before the hook in a frame), every frame shows the
    // dock on the keyboard.
    const after = record.frames.filter((f) => f.at >= atEnd).slice(1)
    await expect(after.length).toBeGreaterThan(0)
    await expect(after.filter((f) => f.inset !== '267px' && f.inset !== '268px')).toEqual([])
  }),
}
/** Phone chat: the keyboard's last 1 px steps come late in the rise and after it; the composer stays on the keyboard. */
export const LateStepDark: StoryObj<typeof meta> = { ...lateStep, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const LateStepLight: StoryObj<typeof meta> = { ...lateStep, globals: { mode: 'light', viewport: { value: 'm390' } } }
// A block under the screen lets the document scroll, as iOS scrolls it for a focused field.
const belowScreen = css({ h: 'shell.tabBar' })

// Gives the document a layout `height` px tall, as iOS 18 does for about one frame when it reports the keyboard;
// the returned function gives the real height back, with no event, as iOS does.
const shortenLayout = (height: number) => {
  Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, get: () => height })
  return () => {
    Reflect.deleteProperty(document.documentElement, 'clientHeight')
  }
}
// iOS reports the keyboard with the layout short for one frame.
const shortReport = async (viewport: FakeViewport) => {
  const restore = shortenLayout(544)
  try {
    viewport.move({ height: 544 })
    await nextFrame()
  } finally {
    restore()
  }
}
const shortLayoutFrame: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { footer, field } = threadParts(canvasElement)
    // iOS 18 shortens the layout viewport to the visible area for about one frame as it reports the keyboard, and
    // restores it with no event (the iPhone trace of screen review R25). The dock ends on the keyboard, and the measure is kept.
    await userEvent.click(field)
    await shortReport(fakeViewport)
    await settled(footer, 266)
    field.blur()
    fakeViewport.move({ height: 844 })
    await settled(footer, 0)
    // The focus goes to the thread's body, then back to the field, as in the trace: the dock waits for iOS's report
    // (screen review R37) and ends on the keyboard after a short report again.
    slotOf(canvasElement, 'scroll-frame__body').focus()
    await userEvent.click(field)
    await nextFrame()
    await nextFrame()
    await expect(riseOf(footer)).toBe(0)
    await shortReport(fakeViewport)
    await settled(footer, 266)
  }),
}
/** Phone chat on iOS 18: the layout is short for one frame as the keyboard opens; the composer docks and docks again on the next open. */
export const ShortLayoutFrameDark: StoryObj<typeof meta> = { ...shortLayoutFrame, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const ShortLayoutFrameLight: StoryObj<typeof meta> = { ...shortLayoutFrame, globals: { mode: 'light', viewport: { value: 'm390' } } }

const shortLayoutStays: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { root, footer, field } = threadParts(canvasElement)
    // A browser that resizes the layout for the keyboard with no VirtualKeyboard API (Firefox on Android): the layout
    // stays short, so after its frames of grace the shell docks nothing, and the next focus expects no keyboard.
    await userEvent.click(field)
    const restore = shortenLayout(544)
    try {
      fakeViewport.move({ height: 544 })
      // The layout is still short after its frames of grace: the dock comes down and the property goes.
      for (let i = 0; i < 3; i++) await nextFrame()
      await settled(footer, 0)
      await expect(keyboardInset(root)).toBe('')
      field.blur()
    } finally {
      restore()
    }
    fakeViewport.move({ height: 844 })
    await settled(footer, 0)
    await userEvent.click(field)
    for (let i = 0; i < 3; i++) await nextFrame()
    await expect(riseOf(footer)).toBe(0)
  }),
}
/** Phone chat where the layout stays short for the keyboard: nothing docks, and the next open expects nothing. */
export const ShortLayoutStaysDark: StoryObj<typeof meta> = { ...shortLayoutStays, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const ShortLayoutStaysLight: StoryObj<typeof meta> = { ...shortLayoutStays, globals: { mode: 'light', viewport: { value: 'm390' } } }

const scrolledReport: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => (
    <>
      <ThreadChat />
      <div className={belowScreen} />
    </>
  ),
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { footer, field } = threadParts(canvasElement)
    await userEvent.click(field)
    // iOS scrolls the document as it reports the keyboard and counts that scroll in the visual viewport's offsetTop
    // until the scroll is taken back (the iPhone trace of screen review R25). The report that comes while the keyboard
    // opens is read with the document at its top, so the dock rises onto the keyboard and never comes back down.
    const record = recordRise(footer)
    fakeViewport.move({ height: 544 })
    Object.defineProperty(fakeViewport, 'offsetTop', { configurable: true, get: () => window.scrollY })
    try {
      window.scrollTo(0, 77)
      await expect(window.scrollY).toBe(77)
      fakeViewport.dispatchEvent(new Event('resize'))
      await waitFor(() => expect(window.scrollY).toBe(0))
      await settled(footer, 266)
      for (let i = 0; i < 3; i++) await nextFrame()
    } finally {
      Object.defineProperty(fakeViewport, 'offsetTop', { configurable: true, writable: true, value: 0 })
    }
    record.stop()
    await expect(record.frames.slice(1).filter((f, i) => f.rise < (record.frames[i]?.rise ?? f.rise))).toEqual([])
    await expect(record.frames.filter((f) => f.rise > 266)).toEqual([])
    await expect(record.frames.at(-1)?.rise).toBe(266)
  }),
}
/** Phone chat on iOS: the keyboard is reported while iOS has scrolled the document; the composer stays on the keyboard. */
export const ScrolledReportDark: StoryObj<typeof meta> = { ...scrolledReport, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const ScrolledReportLight: StoryObj<typeof meta> = { ...scrolledReport, globals: { mode: 'light', viewport: { value: 'm390' } } }

const zoomScroll: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => (
    <>
      <ThreadChat />
      <div className={belowScreen} />
    </>
  ),
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { footer, field, composer } = threadParts(canvasElement)
    // Under a zoom the user scrolls the document with the keyboard open, and the shell leaves that scroll alone: the
    // composer stays on the keyboard's top at 544 and does not rise by the scroll (Codex review of #263).
    await userEvent.click(field)
    fakeViewport.move({ height: 544 })
    await settled(footer, 266)
    const scale = 2
    fakeViewport.move({ height: 544 / scale, offsetTop: 544 - 544 / scale, scale }, 'scroll')
    await nextFrame()
    await expect(Math.abs(composer().bottom - 544)).toBeLessThanOrEqual(1)
    window.scrollTo(0, 40)
    await expect(window.scrollY).toBe(40)
    fakeViewport.dispatchEvent(new Event('scroll'))
    await nextFrame()
    await expect(window.scrollY).toBe(40)
    await expect(Math.abs(composer().bottom - 544)).toBeLessThanOrEqual(1)
    window.scrollTo(0, 0)
  }),
}
/** Phone chat under a zoom with the keyboard open: a document scroll leaves the dock where it is. */
export const ZoomScrollDark: StoryObj<typeof meta> = { ...zoomScroll, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const ZoomScrollLight: StoryObj<typeof meta> = { ...zoomScroll, globals: { mode: 'light', viewport: { value: 'm390' } } }

const restReopen: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { root, footer, field } = threadParts(canvasElement)
    // The Workbench trace of screen review R25 (the Home Screen app): the keyboard is 403 px, and after each close the
    // visual viewport rests 68 px short. On the reopen the dock does not take the 68 px rest for an open keyboard: it
    // stays down until iOS reports the keyboard, then rises to the 403 in one move.
    await userEvent.click(field)
    fakeViewport.move({ height: 844 - 403 })
    await settled(footer, 403 - 34)
    field.blur()
    fakeViewport.move({ height: 844 - 68 })
    await settled(footer, 0)
    const record = recordRise(footer, root)
    await userEvent.click(field)
    for (let i = 0; i < 6; i++) await nextFrame()
    await expect(riseOf(footer)).toBe(0)
    fakeViewport.move({ height: 844 - 403 })
    await settled(footer, 403 - 34)
    record.stop()
    await expect(directions(record.frames.map((f) => ({ shell: 844, rise: f.rise })))).not.toContain(-1)
  }),
}
/** Phone chat in the Home Screen app: the visual viewport rests 68 px short after a close; the reopen docks in one move. */
export const RestReopenDark: StoryObj<typeof meta> = { ...restReopen, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const RestReopenLight: StoryObj<typeof meta> = { ...restReopen, globals: { mode: 'light', viewport: { value: 'm390' } } }

// At every frame: how far the thread is from its end, its scroll position, and the room between the latest message's
// bottom and the composer's top.
const recordThread = (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  const body = slotOf(canvasElement, 'scroll-frame__body')
  const latest = canvas.getByText('Message 40 of the thread')
  const composer = canvas.getByRole('group', { name: 'Composer' })
  const frames: { fromEnd: number; scrollTop: number; room: number }[] = []
  let id = 0
  const tick = () => {
    frames.push({
      fromEnd: Math.round(body.scrollHeight - body.scrollTop - body.clientHeight),
      scrollTop: Math.round(body.scrollTop),
      room: Math.round(rect(composer).top - rect(latest).bottom),
    })
    id = requestAnimationFrame(tick)
  }
  tick()
  return {
    body,
    frames,
    stop: () => {
      cancelAnimationFrame(id)
      tick()
      cancelAnimationFrame(id)
    },
  }
}
const threadEnd: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { footer, field } = threadParts(canvasElement)
    // At its end, the thread stays at its end at every frame of the rise and the fall, so its latest message stays
    // above the composer (screen review R22: the Claude iOS app).
    scrollToEnd(slotOf(canvasElement, 'scroll-frame__body'))
    const end = recordThread(canvasElement)
    await userEvent.click(field)
    await stepViewport(fakeViewport, rising)
    await settled(footer, 266)
    field.blur()
    await stepViewport(fakeViewport, falling)
    await settled(footer, 0)
    end.stop()
    await expect(end.frames.filter((f) => f.fromEnd > 1)).toEqual([])
    await expect(end.frames.filter((f) => f.room < -1)).toEqual([])
    // Scrolled up, away from its end, the line just above the composer stays just above it at every frame of the rise
    // and the fall: the body scrolls by as much as its view shrinks or grows, so its distance from the end stays the
    // same (bridge-workbench's R22 frames).
    const up = recordThread(canvasElement)
    up.body.scrollTop = 200
    await nextFrame()
    const fromEnd = Math.round(up.body.scrollHeight - 200 - up.body.clientHeight)
    await userEvent.click(field)
    await stepViewport(fakeViewport, rising)
    await settled(footer, 266)
    field.blur()
    await stepViewport(fakeViewport, falling)
    await settled(footer, 0)
    up.stop()
    // The first frame comes before the scroll to 200.
    await expect(up.frames.slice(1).filter((f) => Math.abs(f.fromEnd - fromEnd) > 1)).toEqual([])
    await expect(Math.round(up.body.scrollTop)).toBe(200)
  }),
}
const backdropOf = (canvasElement: HTMLElement) => {
  const backdrop = canvasElement.querySelector('.app-shell__root')?.parentElement
  if (!(backdrop instanceof HTMLElement)) throw new Error('no backdrop')
  return backdrop
}
const srLineStory: StoryObj<typeof meta> = {
  render: () => <ThreadChat srLine />,
  play: async ({ canvasElement }) => {
    // An absolutely positioned line at the end of a long thread is placed in the ScrollFrame body, so it does not make
    // the Backdrop scroll, which iOS would scroll at a field's focus (bridge-workbench's R22 probe: 1117 against 844).
    const backdrop = backdropOf(canvasElement)
    await expect(backdrop.scrollHeight - backdrop.clientHeight).toBeLessThanOrEqual(0)
  },
}
/** Phone chat: a screen-reader-only line at the thread's end stays inside the ScrollFrame body; the Backdrop does not scroll. */
export const SrLineInBodyDark: StoryObj<typeof meta> = { ...srLineStory, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const SrLineInBodyLight: StoryObj<typeof meta> = { ...srLineStory, globals: { mode: 'light', viewport: { value: 'm390' } } }

const threadNearEnd: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { footer, field } = threadParts(canvasElement)
    const body = slotOf(canvasElement, 'scroll-frame__body')
    await userEvent.click(field)
    await stepViewport(fakeViewport, rising)
    await settled(footer, 266)
    // Docked, 10 px from the end: as the keyboard closes, the view grows and the thread stays 10 px from its end at
    // every frame, with no jump (Codex review of #216).
    body.scrollTop = body.scrollHeight - body.clientHeight - 10
    await nextFrame()
    const near = recordThread(canvasElement)
    field.blur()
    await stepViewport(fakeViewport, falling)
    await settled(footer, 0)
    near.stop()
    await expect(near.frames.filter((f) => Math.abs(f.fromEnd - 10) > 1)).toEqual([])
  }),
}
/** Phone chat docked 10 px from its end: the thread keeps that distance through the keyboard's fall. */
export const ThreadNearEndDark: StoryObj<typeof meta> = { ...threadNearEnd, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const ThreadNearEndLight: StoryObj<typeof meta> = { ...threadNearEnd, globals: { mode: 'light', viewport: { value: 'm390' } } }

// A form in the ScrollFrame body that fits the screen: its first field takes the focus, and the keyboard makes the body
// scroll. The focused field stays in view; the body is not pinned to its end (Codex review of #210).
function BodyForm() {
  return (
    <div className={screenFrame}>
      <AppShell
        size="phone"
        view="detail"
        detail={
          <ScrollFrame
            bodyClassName={frameBody}
            footer={
              <div role="group" aria-label="Composer" className={composerBox}>
                <textarea aria-label="Message" rows={1} className={messageField} />
              </div>
            }
          >
            <input aria-label="Title" />
            {messages.slice(0, 24).map((m) => (
              <p key={m} className={text}>
                {m}
              </p>
            ))}
          </ScrollFrame>
        }
      />
    </div>
  )
}
const bodyField: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <BodyForm />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { footer } = threadParts(canvasElement)
    const body = slotOf(canvasElement, 'scroll-frame__body')
    const title = within(canvasElement).getByRole('textbox', { name: 'Title' })
    await expect(body.scrollHeight - body.clientHeight).toBeLessThanOrEqual(1)
    await userEvent.click(title)
    fakeViewport.move({ height: 544 })
    await settled(footer, 266)
    // The keyboard made the body scroll, and the field at its top is still in view.
    await expect(body.scrollHeight - body.clientHeight).toBeGreaterThan(1)
    await expect(Math.round(rect(title).top)).toBeGreaterThanOrEqual(Math.round(rect(body).top))
  }),
}
/** Phone: a field at the top of a ScrollFrame body keeps its place when the keyboard opens; the body is not pinned. */
export const BodyFieldDark: StoryObj<typeof meta> = { ...bodyField, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const BodyFieldLight: StoryObj<typeof meta> = { ...bodyField, globals: { mode: 'light', viewport: { value: 'm390' } } }

/** Phone chat: a thread at its end stays at its end as the composer rides the keyboard; one scrolled up keeps its place. */
export const ThreadEndDark: StoryObj<typeof meta> = { ...threadEnd, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const ThreadEndLight: StoryObj<typeof meta> = { ...threadEnd, globals: { mode: 'light', viewport: { value: 'm390' } } }

// The reader closes the keyboard with a tap on the thread: the tap gives the focus to the ScrollFrame body (its
// `tabIndex` 0), not to a field. The body is not left to the browser then, so the thread scrolls back by as much as its
// view grows and the reader's line stays where it was (the-bridge's iPhone probe: a net 211 px, about 10 lines, lost
// on each open and close while scrolled up).
const tapClosesKeyboard: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { footer, field } = threadParts(canvasElement)
    const up = recordThread(canvasElement)
    up.body.scrollTop = 200
    await nextFrame()
    const fromEnd = Math.round(up.body.scrollHeight - 200 - up.body.clientHeight)
    await userEvent.click(field)
    await stepViewport(fakeViewport, rising)
    await settled(footer, 266)
    up.body.focus()
    await expect(document.activeElement).toBe(up.body)
    await stepViewport(fakeViewport, falling)
    await settled(footer, 0)
    up.stop()
    // The first frame comes before the scroll to 200.
    await expect(up.frames.slice(1).filter((f) => Math.abs(f.fromEnd - fromEnd) > 1)).toEqual([])
    await expect(Math.round(up.body.scrollTop)).toBe(200)
  }),
}
/** Phone chat scrolled up: a tap on the thread that closes the keyboard (and focuses the body) keeps the reader's place. */
export const TapClosesKeyboardDark: StoryObj<typeof meta> = { ...tapClosesKeyboard, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const TapClosesKeyboardLight: StoryObj<typeof meta> = { ...tapClosesKeyboard, globals: { mode: 'light', viewport: { value: 'm390' } } }

const keyboardRise: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const { root, footer, field, composer } = threadParts(canvasElement)
    // The first open: the dock stays down until the browser reports the keyboard, and then starts toward Figma's 380
    // keyboard (346 over the 34 safe area) at the first small step, and holds there through the keyboard's smaller
    // steps. Their measure settles at the real 300 keyboard, and the dock takes it: 266, on the keyboard's top.
    const first = recordFrames(root, footer)
    await userEvent.click(field)
    await nextFrame()
    await nextFrame()
    await expect(riseOf(footer)).toBe(0)
    await stepViewport(fakeViewport, rising)
    await settled(footer, 266)
    first.stop()
    await expect(first.frames.every((f) => f.shell === 844)).toBe(true)
    await expect(Math.max(...first.frames.map((f) => f.rise))).toBeLessThanOrEqual(346)
    // The keyboard closes, and opens again: the dock rises with the first report to the 300 keyboard measured last,
    // and only up, with each frame on the curve between, never past the keyboard's top.
    field.blur()
    fakeViewport.move({ height: 844 })
    await settled(footer, 0)
    const record = recordFrames(root, footer)
    const timed = recordRise(footer, root)
    const start = performance.now()
    await userEvent.click(field)
    await stepViewport(fakeViewport, rising)
    await settled(footer, 266)
    record.stop()
    timed.stop()
    await expect(record.frames.every((f) => f.shell === 844)).toBe(true)
    await expect(directions(record.frames)).not.toContain(-1)
    await expect(Math.max(...record.frames.map((f) => f.rise))).toBe(266)
    // The dock rises on the curve for the keyboard's time, not at once, whatever the runner's frame rate.
    // The first frame at the end, from the dock's own inset (full precision), as in Reopen Falling.
    const last = root.style.getPropertyValue('--app-shell-keyboard')
    const up = timed.frames.find((f) => f.at >= start && f.inset === last)?.at ?? 0
    // The layout rounds the inset to 1/64 px, as in Reopen Falling: no frame shows the last one before the curve is
    // within 1/64 px of the end of its 266 px.
    await expect(up - start).toBeGreaterThanOrEqual(curveTime(1 - 1 / 64 / 266))
    // And the drawn rise, as in Reopen Falling.
    const shownUp = timed.frames.find((f) => f.at >= start && f.rise >= 266 - 0.5)?.at ?? 0
    await expect(shownUp - start).toBeGreaterThanOrEqual(curveTime(1 - 0.5 / 266))
    await expect(Math.round(composer().bottom)).toBe(544)
  }),
}

const keyboardInsetOf = (root: HTMLElement) => root.style.getPropertyValue('--app-shell-keyboard')

// The chat ScrollFrame two levels below the detail, as the-bridge's Workspaces PhoneChat had it: its footer does not
// dock, and AppShell names the frame once in the console.
function NestedThreadChat({ onDiagnostic }: { onDiagnostic?: AppShellProps['onDiagnostic'] }) {
  return (
    <div className={screenFrame}>
      <AppShell
        size="phone"
        view="detail"
        onDiagnostic={onDiagnostic}
        detail={
          <section className={nestedColumn}>
            <div className={nestedColumn}>
              <ScrollFrame
                bodyClassName={frameBody}
                footer={
                  <div role="group" aria-label="Composer" className={composerBox}>
                    <textarea aria-label="Message" rows={1} className={messageField} />
                  </div>
                }
              >
                {messages.map((m) => (
                  <p key={m} className={text}>
                    {m}
                  </p>
                ))}
              </ScrollFrame>
            </div>
          </section>
        }
      />
    </div>
  )
}
// A flex column that may shrink below its content: with overflow hidden its automatic minimum height is 0.
const nestedColumn = css({ display: 'flex', flexDirection: 'column', flex: '1', overflow: 'hidden' })
const undockedWarning = (warn: { mock: { calls: unknown[][] } }) =>
  warn.mock.calls.filter((call) => typeof call[0] === 'string' && call[0].startsWith('AppShell: the focused field')).length
const nestedFooter: StoryObj<typeof meta> = {
  ...withFakeViewport,
  render: () => <NestedThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const warn = spyOn(console, 'warn').mockImplementation(() => undefined)
    try {
      const nested = within(canvasElement).getByRole('textbox', { name: 'Message' })
      // The nested chat's field takes the focus and the keyboard covers it: one warning, however often it fits.
      await userEvent.click(nested)
      fakeViewport.move({ height: 544 })
      await waitFor(() => expect(undockedWarning(warn)).toBe(1))
      fakeViewport.move({ height: 545 })
      fakeViewport.move({ height: 544 })
      await expect(undockedWarning(warn)).toBe(1)
    } finally {
      warn.mockRestore()
    }
  }),
}
/** A chat ScrollFrame nested below the detail does not dock; AppShell warns once in the console. */
export const NestedFooterDark: StoryObj<typeof meta> = { ...nestedFooter, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const NestedFooterLight: StoryObj<typeof meta> = { ...nestedFooter, globals: { mode: 'light', viewport: { value: 'm390' } } }
// With `onDiagnostic` the app reports the undocked field itself (audit L-8): the shell calls it once, with a code and a
// message and no element, and writes nothing to the console.
const onDiagnostic = fn<(diagnostic: AppShellDiagnostic) => void>()
const nestedFooterReported: StoryObj<typeof meta> = {
  ...withFakeViewport,
  render: () => <NestedThreadChat onDiagnostic={onDiagnostic} />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    onDiagnostic.mockClear()
    const warn = spyOn(console, 'warn').mockImplementation(() => undefined)
    try {
      await userEvent.click(within(canvasElement).getByRole('textbox', { name: 'Message' }))
      fakeViewport.move({ height: 544 })
      await waitFor(() => expect(onDiagnostic).toHaveBeenCalledTimes(1))
      fakeViewport.move({ height: 545 })
      fakeViewport.move({ height: 544 })
      await expect(onDiagnostic).toHaveBeenCalledTimes(1)
      const diagnostic = onDiagnostic.mock.calls[0]?.[0]
      await expect(diagnostic?.code).toBe('undocked-field')
      await expect(diagnostic?.message.startsWith('AppShell: the focused field')).toBe(true)
      await expect(Object.keys(diagnostic ?? {}).sort()).toEqual(['code', 'message'])
      await expect(undockedWarning(warn)).toBe(0)
    } finally {
      warn.mockRestore()
    }
  }),
}
// The page changes while the keyboard is open: in one commit the app passes a new `onDiagnostic` and draws a nested
// chat whose field takes the focus as it mounts. The shell reports the undocked field to the new callback, not to the
// one it replaced (Codex review of #284).
let swapChat: (() => void) | undefined
// A reply field that takes the focus as it mounts, in its own layout effect, as a page that opens a reply does.
function FocusedReply() {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    ref.current?.focus()
  }, [])
  return <textarea ref={ref} aria-label="Reply" rows={1} className={messageField} />
}
const firstDiagnostic = fn<(diagnostic: AppShellDiagnostic) => void>()
const nextDiagnostic = fn<(diagnostic: AppShellDiagnostic) => void>()
function SwapChat() {
  const [swapped, setSwapped] = useState(false)
  useEffect(() => {
    swapChat = () => {
      setSwapped(true)
    }
  })
  const docked = (
    <ScrollFrame
      bodyClassName={frameBody}
      footer={
        <div role="group" aria-label="Composer" className={composerBox}>
          <textarea aria-label="Message" rows={1} className={messageField} />
        </div>
      }
    >
      <p className={text}>{messages[0]}</p>
    </ScrollFrame>
  )
  const nested = (
    <section className={nestedColumn}>
      <div className={nestedColumn}>
        <ScrollFrame
          bodyClassName={frameBody}
          footer={
            <div role="group" aria-label="Composer" className={composerBox}>
              <FocusedReply />
            </div>
          }
        >
          <p className={text}>{messages[0]}</p>
        </ScrollFrame>
      </div>
    </section>
  )
  return (
    <div className={screenFrame}>
      <AppShell size="phone" view="detail" onDiagnostic={swapped ? nextDiagnostic : firstDiagnostic} detail={swapped ? nested : docked} />
    </div>
  )
}
const swappedDiagnostic: StoryObj<typeof meta> = {
  ...withFakeViewport,
  render: () => <SwapChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    firstDiagnostic.mockClear()
    nextDiagnostic.mockClear()
    await userEvent.click(within(canvasElement).getByRole('textbox', { name: 'Message' }))
    fakeViewport.move({ height: 544 })
    swapChat?.()
    const reply = await within(canvasElement).findByRole('textbox', { name: 'Reply' })
    await waitFor(() => expect(document.activeElement).toBe(reply))
    fakeViewport.move({ height: 545 })
    fakeViewport.move({ height: 544 })
    await waitFor(() => expect(nextDiagnostic).toHaveBeenCalledTimes(1))
    await expect(firstDiagnostic).not.toHaveBeenCalled()
  }),
}
/** The callback changes in the commit that mounts an autofocus field in a nested chat: the new callback is called. */
export const SwappedDiagnosticDark: StoryObj<typeof meta> = { ...swappedDiagnostic, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const SwappedDiagnosticLight: StoryObj<typeof meta> = { ...swappedDiagnostic, globals: { mode: 'light', viewport: { value: 'm390' } } }
// A reply box that Figma draws 12 above the screen's foot (the-bridge Inbox M8): ScrollFrame `foot="12"` keeps that
// space off the keyboard, and on the keyboard the box sits on its top, as a footer with no foot does (screen review
// R21; the Inbox reply box ended 12 above the keyboard with a bottom padding on the frame).
const footerFoot: StoryObj<typeof meta> = {
  ...withFakeViewport,
  render: () => <ThreadChat foot="12" />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { root, field, composer } = threadParts(canvasElement)
    const frameBottom = () => rect(slotOf(canvasElement, 'scroll-frame__root')).bottom
    await expect(frameBottom() - composer().bottom).toBe(12)
    await userEvent.click(field)
    fakeViewport.move({ height: 544 })
    await waitFor(() => expect(composer().bottom).toBe(544))
    await expect(root.style.getPropertyValue('--app-shell-keyboard')).not.toBe('')
    field.blur()
    fakeViewport.move({ height: 844 })
    await waitFor(() => expect(frameBottom() - composer().bottom).toBe(12))
  }),
}
/** Phone chat whose reply box has a 12 px foot: 12 above the screen's foot, and on the keyboard's top when it opens. */
export const FooterFootDark: StoryObj<typeof meta> = { ...footerFoot, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const FooterFootLight: StoryObj<typeof meta> = { ...footerFoot, globals: { mode: 'light', viewport: { value: 'm390' } } }
/** The nested chat with `onDiagnostic`: the app gets the diagnostic, and the console stays quiet. */
export const NestedFooterReportedDark: StoryObj<typeof meta> = { ...nestedFooterReported, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const NestedFooterReportedLight: StoryObj<typeof meta> = { ...nestedFooterReported, globals: { mode: 'light', viewport: { value: 'm390' } } }


// An iPad at 1232 px with a search field and a long result list in the list pane, beside the detail.
const wideTabletScreen = { t1232: { name: 'Tablet (1232 x 900)', styles: { width: '1232px', height: '900px' } } }
const results = Array.from({ length: 40 }, (_, i) => `Result ${String(i + 1)}`)
const listColumn = css({ display: 'flex', flexDirection: 'column', flex: '1', overflow: 'hidden' })
const resultList = css({ flex: '1', overflowY: 'auto' })
function TabletSearch() {
  return (
    <div className={screenFrame}>
      <AppShell
        size="desktop"
        list={
          <section aria-label="Inbox" className={listColumn}>
            <input aria-label="Search" />
            <div role="list" aria-label="Results" tabIndex={0} className={resultList}>
              {results.map((r) => (
                <p role="listitem" key={r} className={text}>
                  {r}
                </p>
              ))}
            </div>
          </section>
        }
        detail={<p className={text}>The detail</p>}
      />
    </div>
  )
}
const listKeyboard: StoryObj<typeof meta> = {
  ...withFakeViewport,
  parameters: { viewport: { options: wideTabletScreen } },
  render: () => <TabletSearch />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([1232, 900])
    const canvas = within(canvasElement)
    const list = canvas.getByRole('list', { name: 'Results' })
    await expect(Math.round(rect(list).bottom)).toBe(900)
    // The search field takes the focus and a 400 px keyboard covers the screen's foot: the results end above it, so
    // the last ones can scroll into view.
    await userEvent.click(canvas.getByRole('textbox', { name: 'Search' }))
    fakeViewport.move({ height: 500 })
    await waitFor(() => expect(Math.round(rect(list).bottom)).toBe(500))
    // The keyboard closes: the results reach the foot again.
    canvas.getByRole('textbox', { name: 'Search' }).blur()
    fakeViewport.move({ height: 900 })
    await waitFor(() => expect(Math.round(rect(list).bottom)).toBe(900))
  }),
}
/** Tablet: a search field in the list pane opens the keyboard, and the results end above it (the-bridge #151 review). */
export const ListKeyboardDark: StoryObj<typeof meta> = { ...listKeyboard, globals: { mode: 'dark', viewport: { value: 't1232' } } }
export const ListKeyboardLight: StoryObj<typeof meta> = { ...listKeyboard, globals: { mode: 'light', viewport: { value: 't1232' } } }

const focusScroll: StoryObj<typeof meta> = {
  ...withFakeViewport,
  render: () => (
    <>
      <ThreadChat />
      <div className={belowScreen} />
    </>
  ),
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { root, field } = threadParts(canvasElement)
    const warn = spyOn(console, 'warn').mockImplementation(() => undefined)
    try {
      // With no field focused, a document scroll is the page's own, and it stays.
      window.scrollTo(0, 25)
      await nextFrame()
      await nextFrame()
      await expect(window.scrollY).toBe(25)
      window.scrollTo(0, 0)
      // A field takes the focus, and iOS scrolls the document for it (the window's scroll event): the document goes
      // back to its top at once, so the shell and its top bar do not move.
      await userEvent.click(field)
      window.scrollTo(0, 25)
      await waitFor(() => expect(window.scrollY).toBe(0))
      // With the keyboard open, iOS scrolls the document and reports a visualViewport scroll: reset in that event.
      fakeViewport.move({ height: 544 })
      await waitFor(() => expect(keyboardInsetOf(root)).not.toBe(''))
      window.scrollTo(0, 25)
      fakeViewport.dispatchEvent(new Event('scroll'))
      await expect(window.scrollY).toBe(0)
      // The field loses the focus and the dock is still set while the keyboard closes: a document scroll then is
      // reset too, so the page does not jump on the close.
      field.blur()
      window.scrollTo(0, 25)
      await waitFor(() => expect(window.scrollY).toBe(0))
      // The keyboard is closed and the dock is gone: a document scroll is the page's own again.
      fakeViewport.move({ height: 844 })
      await waitFor(() => expect(keyboardInsetOf(root)).toBe(''))
      window.scrollTo(0, 25)
      await nextFrame()
      await nextFrame()
      await expect(window.scrollY).toBe(25)
      window.scrollTo(0, 0)
      // WebKit fires no focusout when it removes a focused field (a route change): the focus is then on the body, and
      // a document scroll is the page's own again. Chromium fires one, so the story stops it before AppShell sees it.
      await userEvent.click(field)
      const stop = (event: Event) => {
        event.stopImmediatePropagation()
      }
      document.addEventListener('focusout', stop, { capture: true })
      try {
        field.blur()
      } finally {
        document.removeEventListener('focusout', stop, { capture: true })
      }
      window.scrollTo(0, 25)
      await nextFrame()
      await nextFrame()
      await expect(window.scrollY).toBe(25)
      // This chat's ScrollFrame is the detail's child: it docked, and AppShell warned nothing.
      await expect(undockedWarning(warn)).toBe(0)
    } finally {
      warn.mockRestore()
      window.scrollTo(0, 0)
    }
  }),
}
/**
 * Phone chat: iOS scrolls the document for a focused field. While a field has the focus or the dock is set, the
 * document goes back to its top at once, so the shell's top bar never moves (screen reviews R20, R21).
 */
export const FocusScrollDark: StoryObj<typeof meta> = { ...focusScroll, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const FocusScrollLight: StoryObj<typeof meta> = { ...focusScroll, globals: { mode: 'light', viewport: { value: 'm390' } } }

/** Phone chat: the keyboard rises in steps; the shell keeps its height and the composer starts with the first step and rides up on the keyboard's curve, never back down. */
export const KeyboardRiseDark: StoryObj<typeof meta> = { ...keyboardRise, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const KeyboardRiseLight: StoryObj<typeof meta> = { ...keyboardRise, globals: { mode: 'light', viewport: { value: 'm390' } } }

const pressAcrossSettle: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <ThreadChat send />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { canvas, footer, field } = threadParts(canvasElement)
    // The first open: the keyboard reports 380, the dock rises to 346, and the measure settles 300 ms after the report.
    await userEvent.click(field)
    const reported = performance.now()
    fakeViewport.move({ height: 844 - 380 })
    await nextFrame()
    await nextFrame()
    // A press on Send blurs the field while that settle is still to come, and is held across it: the dock goes on to
    // where the keyboard is and stays there under the finger, as Send acts on its click (Codex review of #312: a press
    // after the settle would not test it).
    canvas.getByRole('button', { name: 'Send' }).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    field.blur()
    await expect(performance.now() - reported).toBeLessThan(settleMs)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    await expect(riseOf(footer)).toBe(346)
    // The press's release: the dock comes down after it.
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    await settled(footer, 0)
  }),
}
/** Phone chat: a press on Send held across the keyboard's settle keeps the composer under the finger until its release. */
export const PressAcrossSettleDark: StoryObj<typeof meta> = { ...pressAcrossSettle, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const PressAcrossSettleLight: StoryObj<typeof meta> = { ...pressAcrossSettle, globals: { mode: 'light', viewport: { value: 'm390' } } }
const refocusAfterFall: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { footer, field } = threadParts(canvasElement)
    await userEvent.click(field)
    fakeViewport.move({ height: 544 })
    await settled(footer, 266)
    // The field loses the focus, and the dock starts down with the keyboard before iOS reports the close.
    field.blur()
    for (let i = 0; i < 3; i++) await nextFrame()
    await expect(riseOf(footer)).toBeLessThan(266)
    // The field takes the focus again before any report, and the keyboard stays: the dock goes back up to it at once,
    // well before the opening's 1 s settle (Codex review of #312).
    field.focus()
    await wait(motionMs + 100)
    await expect(riseOf(footer)).toBe(266)
  }),
}
/** Phone chat: the field takes the focus again as the composer starts down; the composer goes back up to the keyboard. */
export const RefocusAfterFallDark: StoryObj<typeof meta> = { ...refocusAfterFall, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const RefocusAfterFallLight: StoryObj<typeof meta> = { ...refocusAfterFall, globals: { mode: 'light', viewport: { value: 'm390' } } }

const keyboardFall: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const { root, footer, field, composer } = threadParts(canvasElement)
    await userEvent.click(field)
    fakeViewport.move({ height: 544 })
    await settled(footer, 266)
    // The keyboard's Done blurs the field, and the keyboard falls in steps: the dock comes down with it on the
    // curve and never back up, and the shell keeps its height.
    const record = recordFrames(root, footer)
    const timed = recordRise(footer, root)
    const start = performance.now()
    field.blur()
    await stepViewport(fakeViewport, falling)
    await settled(footer, 0)
    record.stop()
    timed.stop()
    await expect(record.frames.every((f) => f.shell === 844)).toBe(true)
    await expect(directions(record.frames)).not.toContain(1)
    // The dock moves on the keyboard's curve, not at once: the keyboard leaves the detail when the 300 keyboard is down
    // to the 34 safe area, and no frame shows the dock down before the curve gets there. The time comes from the
    // frames, so a slow runner that draws fewer frames still passes. The layout drops the inset at the fall's start
    // (screen review R39: a move is the compositor's), so the drawn rise tells it.
    const down = timed.frames.find((f) => f.at >= start && f.rise <= 0)?.at ?? 0
    await expect(down - start).toBeGreaterThanOrEqual(curveTime(1 - 34 / 300))
    // And it moves on the way (Codex review of #236): the fall is a move of the keyboard's time by the dock's own end,
    // from the blur, and every frame drawn before that end shows the dock between the keyboard's top and the bottom. A
    // loaded runner may draw none.
    const fallEnd = Number(root.dataset.keyboardEnd)
    await expect(fallEnd).toBeGreaterThanOrEqual(start + motionMs)
    // The rise is 0 once the keyboard is under the 34 safe area, before the move ends, so only frames before that
    // point of the curve count; the first frame after the blur can still show the frame before it.
    const moveStart = fallEnd - motionMs
    const during = timed.frames.filter((f) => f.at > start).slice(1).filter((f) => f.at < moveStart + curveTime(1 - 34 / 300))
    await expect(during.filter((f) => !(f.rise > 0 && f.rise < 266))).toEqual([])
    await expect(Math.round(composer().bottom)).toBe(844 - 34)
    await expect(keyboardInset(root)).toBe('')
  }),
}

/** Phone chat: the keyboard falls in steps after a blur; the shell keeps its height and the composer comes down on the keyboard's curve, never back up. */
export const KeyboardFallDark: StoryObj<typeof meta> = { ...keyboardFall, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const KeyboardFallLight: StoryObj<typeof meta> = { ...keyboardFall, globals: { mode: 'light', viewport: { value: 'm390' } } }

const keyboardReducedMotion: StoryObj<typeof meta> = {
  ...withMotion,
  beforeEach: () => {
    const restore = withMotion.beforeEach()
    const restoreMedia = emulateMedia({ coarse: false, reduce: true })
    return () => {
      restoreMedia()
      restore()
    }
  },
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const { root, footer, field } = threadParts(canvasElement)
    // With reduced motion and no keyboard that slides (a mouse: a browser whose visual viewport shrinks for some other
    // reason), the dock has no transition: each change is there in the same task, and no frame shows a step between.
    // Where iOS slides its keyboard, the dock follows it with reduced motion too (`KeyboardFollowReduced`).
    const record = recordFrames(root, footer)
    field.focus()
    await nextFrame()
    await nextFrame()
    await expect(riseOf(footer)).toBe(0)
    fakeViewport.move({ height: 544 })
    await expect(riseOf(footer)).toBe(266)
    await nextFrame()
    field.blur()
    fakeViewport.move({ height: 844 })
    await expect(riseOf(footer)).toBe(0)
    await nextFrame()
    field.focus()
    await nextFrame()
    await expect(riseOf(footer)).toBe(0)
    fakeViewport.move({ height: 544 })
    await expect(riseOf(footer)).toBe(266)
    await nextFrame()
    field.blur()
    fakeViewport.move({ height: 844 })
    await nextFrame()
    record.stop()
    await expect([...new Set(record.frames.map((f) => f.rise))].sort((x, y) => x - y)).toEqual([0, 266])
    await expect(record.frames.every((f) => f.shell === 844)).toBe(true)
  }),
}

/** Phone chat with reduced motion and a mouse: the composer docks and undocks at once, with no transition. */
export const KeyboardReducedMotionDark: StoryObj<typeof meta> = { ...keyboardReducedMotion, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const KeyboardReducedMotionLight: StoryObj<typeof meta> = { ...keyboardReducedMotion, globals: { mode: 'light', viewport: { value: 'm390' } } }

// The iOS 26 keyboard as screen review R37 measured it (a 60 fps recording of the iPad mini, five opens and closes):
// it moves as a critically damped spring, 1 - (1 + wt) e^(-wt) with w about 23.5/s, up and down, also with Reduce
// Motion on. Safari reports it once, with its whole height: an opening in the frame that first draws it, which already
// shows it about 56 ms into its motion; a close 25 to 80 ms after the focusout that starts it.
const iosKeyboard = (ms: number) => {
  const x = (23.5 * Math.max(0, ms)) / 1000
  return 1 - (1 + x) * Math.exp(-x)
}
const iosOpenShown = 56
const iosCloseReport = 40
// One frame at 60 Hz, and the most the drawn composer may be off the keyboard over that frame: the dock's curve
// (`easings.keyboard` over `durations.keyboard`) is a cubic-bezier fit of the spring, within 1.1 % of it, 3.7 px of a
// 336 px keyboard.
const frameMs = 1000 / 60
const fitPx = 4
// The composer's bottom and the thread's last line in each drawn frame, read after the frame's own callbacks (the
// shell's among them) and before the next, with the time of the frame.
const recordFollow = (composer: () => DOMRect, line: () => DOMRect) => {
  const frames: { at: number; bottom: number; gap: number }[] = []
  let id = 0
  let on = true
  const tick = () => {
    const at = performance.now()
    setTimeout(() => {
      if (!on) return
      frames.push({ at, bottom: composer().bottom, gap: composer().top - line().bottom })
    }, 0)
    id = requestAnimationFrame(tick)
  }
  id = requestAnimationFrame(tick)
  return {
    frames,
    stop: () => {
      on = false
      cancelAnimationFrame(id)
    },
  }
}
// iOS's keyboard, 336 px on the 844 px phone, opened and closed twice: the first open against Figma's guess, the
// second against the measured keyboard; the first close by a tap on the thread, the second by the keyboard's Done (a
// blur). In every frame the composer sits on the keyboard's top as the keyboard is within one frame of that time, and
// the thread's last line keeps its place over the composer. Before the keyboard shows, nothing moves.
const keyboardFollow = (reduce: boolean): StoryObj<typeof meta> => ({
  ...withMotion,
  beforeEach: () => {
    const restore = withMotion.beforeEach()
    const restoreMedia = emulateMedia({ coarse: true, reduce })
    return () => {
      restoreMedia()
      restore()
    }
  },
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const { canvas, field, composer } = threadParts(canvasElement)
    const body = slotOf(canvasElement, 'scroll-frame__body')
    const last = canvas.getByText(messages.at(-1) ?? '')
    const line = () => rect(last)
    body.scrollTop = body.scrollHeight
    await nextFrame()
    const rest = composer().bottom
    const gap = composer().top - line().bottom
    const keyboard = 336
    // Where the composer's bottom belongs when the keyboard is `progress` of the way up: on its top, and never under
    // its own place at rest (the safe area under it stays under the keyboard).
    const place = (progress: number) => Math.min(rest, 844 - keyboard * progress)
    const off: string[] = []
    const check = (frames: { at: number; bottom: number; gap: number }[], progressAt: (ms: number) => number, name: string) => {
      for (const f of frames) {
        const a = place(progressAt(f.at - frameMs))
        const b = place(progressAt(f.at + frameMs))
        const low = Math.min(a, b) - fitPx
        const high = Math.max(a, b) + fitPx
        if (f.bottom < low || f.bottom > high)
          off.push(`${name} +${String(Math.round(f.at))}: composer ${f.bottom.toFixed(1)}, keyboard ${low.toFixed(1)} to ${high.toFixed(1)}`)
        if (Math.abs(f.gap - gap) > 1) off.push(`${name} +${String(Math.round(f.at))}: the last line ${(f.gap - gap).toFixed(1)} px off its place`)
      }
    }
    for (let round = 0; round < 2; round++) {
      // The focus: iOS starts the keyboard 60 to 120 ms later and draws it first when it reports it.
      await userEvent.click(field)
      const still = recordFollow(composer, line)
      await wait(110)
      still.stop()
      const reported = performance.now()
      fakeViewport.move({ height: 844 - keyboard })
      const opening = recordFollow(composer, line)
      await wait(600)
      opening.stop()
      for (const f of still.frames) if (f.bottom !== rest) off.push(`open ${String(round)}: the composer moved to ${f.bottom.toFixed(1)} before the keyboard showed`)
      const shownAt = reported - iosOpenShown
      check(opening.frames, (ms) => iosKeyboard(ms - shownAt), `open ${String(round)}`)
      // The close: a tap on the thread (a touch press, which the shell turns into a blur), or the keyboard's Done.
      const closed = performance.now()
      if (round === 0) body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }))
      else field.blur()
      await expect(field).not.toHaveFocus()
      await wait(0)
      const closing = recordFollow(composer, line)
      await wait(iosCloseReport - (performance.now() - closed))
      fakeViewport.move({ height: 844 })
      if (round === 0) body.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch' }))
      await wait(600)
      closing.stop()
      check(closing.frames, (ms) => 1 - iosKeyboard(ms - closed), `close ${String(round)}`)
      await expect(opening.frames.length).toBeGreaterThan(10)
      await expect(closing.frames.length).toBeGreaterThan(10)
    }
    await expect(off).toEqual([])
    await expect(composer().bottom).toBe(rest)
  }),
})
/** Phone chat on iOS: the composer and the thread rise and fall with the keyboard, frame by frame, in its own motion. */
export const KeyboardFollowDark: StoryObj<typeof meta> = { ...keyboardFollow(false), globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const KeyboardFollowLight: StoryObj<typeof meta> = { ...keyboardFollow(false), globals: { mode: 'light', viewport: { value: 'm390' } } }
/** The same with Reduce Motion on: iOS still slides its keyboard, and the composer and the thread follow it. */
export const KeyboardFollowReducedDark: StoryObj<typeof meta> = { ...keyboardFollow(true), globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const KeyboardFollowReducedLight: StoryObj<typeof meta> = { ...keyboardFollow(true), globals: { mode: 'light', viewport: { value: 'm390' } } }

const keyboardAndroid: StoryObj<typeof meta> = {
  ...withFakeViewport,
  render: () => <ThreadChat />,
  // A touch screen with motion and Chromium's VirtualKeyboard API, as Chrome on Android.
  beforeEach: () => {
    fakeViewport = new FakeViewport()
    const restoreViewport = replaceVisualViewport(fakeViewport)
    const restoreMedia = emulateMedia({ coarse: true, reduce: false })
    Object.defineProperty(navigator, 'virtualKeyboard', { configurable: true, value: { overlaysContent: false } })
    return async () => {
      // The real visual viewport and media come back first, so a failed resize cannot leave the fakes in place.
      restoreViewport()
      Reflect.deleteProperty(navigator, 'virtualKeyboard')
      restoreMedia()
      const { page } = await import('vitest/browser')
      await page.viewport(390, 844)
    }
  },
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const { root, footer, field, composer } = threadParts(canvasElement)
    const record = recordFrames(root, footer)
    await userEvent.click(field)
    // Chrome on Android with interactive-widget=resizes-content: the keyboard shrinks the layout viewport itself, and
    // the visual viewport with it, to 544. The shell follows its parent to 544 and nothing docks in any frame.
    const { page } = await import('vitest/browser')
    await page.viewport(390, 544)
    await waitFor(() => expect(document.documentElement.clientHeight).toBe(544))
    fakeViewport.move({ height: 544 })
    await new Promise((resolve) => setTimeout(resolve, 400))
    record.stop()
    await expect(Math.round(rect(root).height)).toBe(544)
    await expect(keyboardInset(root)).toBe('')
    await expect(record.frames.every((f) => f.rise === 0)).toBe(true)
    await expect(Math.round(composer().bottom)).toBe(544 - 34)
  }),
}

/** Phone chat where the browser resizes the layout for the keyboard (Chrome on Android): the shell shrinks with its parent and the dock stays at 0. */
// Only the story test runner can resize the page (vitest/browser), so the Storybook UI leaves these out; the test
// runner still runs them (Codex review of #199). Storybook reads the tags from each export itself, not from a spread.
export const KeyboardAndroidDark: StoryObj<typeof meta> = {
  ...keyboardAndroid,
  tags: ['!dev'],
  globals: { mode: 'dark', viewport: { value: 'm390' } },
}
export const KeyboardAndroidLight: StoryObj<typeof meta> = {
  ...keyboardAndroid,
  tags: ['!dev'],
  globals: { mode: 'light', viewport: { value: 'm390' } },
}

// The dock reads its motion and the Figma keyboard from tokens as numbers, through strict readers (audit L-2). The
// tokens give the literals the dock is built for, and a value in another form throws at load, where `parseFloat` read
// `0.25s` as 0.25 ms and a regex read `ease` as a straight line.
export const MotionTokens: StoryObj<typeof meta> = {
  render: () => <Desktop />,
  play: async () => {
    await expect(cssDuration(token('durations.keyboard'))).toBe(300)
    await expect(cssCubicBezier(token('easings.keyboard'))).toEqual([0.22, 0.17, 0.15, 1])
    await expect(cssPx(token('sizes.shell.keyboard'))).toBe(380)
    await expect(cssDuration('0.25s')).toBe(250)
    await expect(cssDuration('250ms')).toBe(250)
    await expect(cssPx(' 380px ')).toBe(380)
    await expect(cssCubicBezier('cubic-bezier(.4, -0.5, 0.2, 1.5)')).toEqual([0.4, -0.5, 0.2, 1.5])
    for (const bad of ['0.25 s', '250', '', 'calc(250ms)', '-ms']) await expect(() => cssDuration(bad)).toThrow(`"${bad}"`)
    for (const bad of ['380', '380rem', '380 px']) await expect(() => cssPx(bad)).toThrow(`"${bad}"`)
    for (const bad of ['ease', 'linear(0, 1)', 'steps(4)', 'cubic-bezier(0.38, 0.7, 0.125)', 'cubic-bezier(1.2, 0, 0, 1)', 'cubic-bezier(0, 0, -0.1, 1)'])
      await expect(() => cssCubicBezier(bad)).toThrow(`"${bad}"`)
  },
}

// The work the dock gives the page in each frame of a keyboard move (screen review R39: on the iPad mini the page drew
// its frames 19 to 60 ms apart while the dock moved, and the screen showed the composer's last steps 33 to 133 ms
// apart). A move is the compositor's: the dock writes no style and no scroll position, and changes no box, between its
// first frame and its last, so an app that works on each resize or scroll of the transcript (the-bridge's pin,
// usePinnedEnd) has nothing to do mid-move. `busyMs` stands in for that app's work on each change.
const busyMs = 20
const recordDockWork = (root: HTMLElement, body: HTMLElement, footer: HTMLElement) => {
  const work: { at: number; what: string }[] = []
  const frames: number[] = []
  const busy = (what: string) => {
    work.push({ at: performance.now(), what })
    const until = performance.now() + busyMs
    while (performance.now() < until) {
      // The app's work on the change.
    }
  }
  const styles = new MutationObserver((records) => {
    for (const r of records) work.push({ at: performance.now(), what: `style of ${r.target instanceof Element ? r.target.className.split(' ')[0] ?? '' : ''}` })
  })
  styles.observe(root, { attributes: true, attributeFilter: ['style'], subtree: true })
  // The first report of each observed box comes at once; only a later one is a change.
  const seen = new Set<Element>()
  const sizes = new ResizeObserver((entries) => {
    const changed = entries.filter((e) => seen.has(e.target))
    for (const e of entries) seen.add(e.target)
    if (changed.length > 0) busy('resize')
  })
  for (const el of [body, footer, ...body.children]) sizes.observe(el)
  const onScroll = () => {
    busy('scroll')
  }
  body.addEventListener('scroll', onScroll)
  // When each move of the dock starts.
  const moves: number[] = []
  const onMove = () => {
    moves.push(performance.now())
  }
  root.addEventListener('app-shell-dock', onMove)
  const own = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop')
  Object.defineProperty(body, 'scrollTop', {
    configurable: true,
    get: (): unknown => own?.get?.call(body),
    set: (value: number) => {
      work.push({ at: performance.now(), what: 'scrollTop write' })
      own?.set?.call(body, value)
    },
  })
  let id = requestAnimationFrame(function tick() {
    frames.push(performance.now())
    id = requestAnimationFrame(tick)
  })
  return {
    frames,
    // The work from the move's first frame to the frame before its last: the move's own frames. The move starts in
    // the task of its `app-shell-dock` event and may change the layout there once (a fall), and the browser reports
    // that change once in a later frame, a resize and a scroll; only a second one is the dock's work mid-move.
    midMove: (from: number, to: number) => {
      const started = moves.filter((at) => at >= from && at < to).at(-1) ?? from
      const first = frames.find((f) => f > started) ?? started
      const during = work.filter((w) => w.at > first && w.at < to - frameMs)
      const once = new Set<string>()
      return during.filter((w) => {
        if ((w.what === 'resize' || w.what === 'scroll') && !once.has(w.what)) {
          once.add(w.what)
          return false
        }
        return true
      })
    },
    stop: () => {
      cancelAnimationFrame(id)
      styles.disconnect()
      sizes.disconnect()
      body.removeEventListener('scroll', onScroll)
      root.removeEventListener('app-shell-dock', onMove)
      Reflect.deleteProperty(body, 'scrollTop')
    },
  }
}
// iOS's keyboard opened and closed over the thread at its end and scrolled up: in no frame between the move's first and
// its last does the dock change a style, a scroll position or a box, so no frame mid-move carries the app's 20 ms, and
// each step of the composer is the compositor's.
const dockFrameWork = (reduce: boolean): StoryObj<typeof meta> => ({
  ...withMotion,
  beforeEach: () => {
    const restore = withMotion.beforeEach()
    const restoreMedia = emulateMedia({ coarse: true, reduce })
    return () => {
      restoreMedia()
      restore()
    }
  },
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { root, footer, field, composer } = threadParts(canvasElement)
    const body = slotOf(canvasElement, 'scroll-frame__body')
    const keyboard = 336
    const found: string[] = []
    for (const scrolled of [false, true]) {
      if (scrolled) body.scrollTop = 200
      else body.scrollTop = body.scrollHeight
      await nextFrame()
      const rest = composer().bottom
      const record = recordDockWork(root, body, footer)
      await userEvent.click(field)
      await wait(110)
      const reported = performance.now()
      fakeViewport.move({ height: 844 - keyboard })
      await wait(motionMs + 150)
      const openEnd = Number(root.dataset.keyboardEnd)
      const closed = performance.now()
      field.blur()
      await wait(iosCloseReport)
      fakeViewport.move({ height: 844 })
      await wait(motionMs + 150)
      const closeEnd = Number(root.dataset.keyboardEnd)
      record.stop()
      for (const w of record.midMove(reported, openEnd)) found.push(`open${scrolled ? ' (scrolled up)' : ''} +${String(Math.round(w.at - reported))}: ${w.what}`)
      for (const w of record.midMove(closed, closeEnd)) found.push(`close${scrolled ? ' (scrolled up)' : ''} +${String(Math.round(w.at - closed))}: ${w.what}`)
      await expect(composer().bottom).toBe(rest)
    }
    await expect(found).toEqual([])
  }),
})
/** Phone chat on iOS: each frame of the keyboard's move is the compositor's; the dock writes no style or scroll mid-move. */
export const DockFrameWorkDark: StoryObj<typeof meta> = { ...dockFrameWork(false), globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const DockFrameWorkLight: StoryObj<typeof meta> = { ...dockFrameWork(false), globals: { mode: 'light', viewport: { value: 'm390' } } }
/** The same with Reduce Motion on, as on the owner's iPad mini (R39). */
export const DockFrameWorkReducedDark: StoryObj<typeof meta> = { ...dockFrameWork(true), globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const DockFrameWorkReducedLight: StoryObj<typeof meta> = { ...dockFrameWork(true), globals: { mode: 'light', viewport: { value: 'm390' } } }

// Each frame's composer and thread lines, read in the frame with the time it draws (`drawnTime`), and when each move of
// the dock started (its `app-shell-dock` event).
const recordBoxes = (root: HTMLElement, composer: () => DOMRect, lines: HTMLElement[]) => {
  const frames: { at: number; drawn: number; composer: DOMRect; lines: (DOMRect | null)[] }[] = []
  const moves: number[] = []
  const onMove = () => {
    moves.push(performance.now())
  }
  root.addEventListener('app-shell-dock', onMove)
  let id = requestAnimationFrame(function tick() {
    frames.push({ at: performance.now(), drawn: drawnTime(), composer: composer(), lines: lines.map((line) => rect(line)) })
    id = requestAnimationFrame(tick)
  })
  return {
    frames,
    moves,
    stop: () => {
      cancelAnimationFrame(id)
      root.removeEventListener('app-shell-dock', onMove)
    },
  }
}
// The edges of a move, where the layout changes (screen review R39): a fall lays the page out for its end at its start,
// with the drawn parts held where they were, and a rise at its end, as its animations end. In the frame of each, no box
// moves on screen by more than 1 px from where the keyboard's curve puts it: the composer is on the curve at the time
// the frame draws, and each thread line moves by as much as the composer, at the thread's end and scrolled up.
const dockEdges: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { root, field, composer } = threadParts(canvasElement)
    const canvas = within(canvasElement)
    const body = slotOf(canvasElement, 'scroll-frame__body')
    const lines = [40, 35, 30, 25, 20].map((n) => canvas.getByText(`Message ${String(n)} of the thread`))
    const keyboard = 336
    const rest = 844 - 34
    // The composer's bottom on the keyboard: the inset `inset(t)` less the safe area, never under its rest.
    const bottomAt = (inset: number) => Math.min(rest, 844 - inset)
    const off: string[] = []
    // The frame before an edge and the edge's frame: the composer within 1 px of the curve in the edge's frame, and each
    // line visible in both moved by the composer's step within 1 px.
    const checkEdge = (name: string, frames: ReturnType<typeof recordBoxes>['frames'], edge: number, expected: (drawn: number) => number) => {
      const at = frames.findIndex((f) => f.drawn >= edge)
      const before = frames[at - 1]
      const after = frames[at]
      if (before === undefined || after === undefined) {
        off.push(`${name}: no frames around the edge`)
        return
      }
      const want = expected(after.drawn)
      if (Math.abs(after.composer.bottom - want) > 1) off.push(`${name}: composer ${after.composer.bottom.toFixed(1)}, curve ${want.toFixed(1)}`)
      const step = after.composer.top - before.composer.top
      after.lines.forEach((line, i) => {
        const was = before.lines[i]
        if (line === null || was === undefined || was === null) return
        const visible = (box: DOMRect) => box.bottom > 0 && box.top < after.composer.top
        if (!visible(line) && !visible(was)) return
        if (Math.abs(line.top - was.top - step) > 1) off.push(`${name}: line ${String(i)} moved ${(line.top - was.top).toFixed(1)}, composer ${step.toFixed(1)}`)
      })
    }
    for (const scrolled of [false, true]) {
      body.scrollTop = scrolled ? 200 : body.scrollHeight
      await nextFrame()
      // The open's end: the layout takes the inset in the frame the animations end.
      const opening = recordBoxes(root, composer, lines)
      await userEvent.click(field)
      await wait(110)
      fakeViewport.move({ height: 844 - keyboard })
      await wait(motionMs + 150)
      opening.stop()
      const openEnd = Number(root.dataset.keyboardEnd)
      checkEdge(`open end${scrolled ? ' (scrolled up)' : ''}`, opening.frames, openEnd, () => bottomAt(keyboard))
      // The close's start: the layout drops the inset in the move's first task, and the composer starts down the curve.
      const closing = recordBoxes(root, composer, lines)
      await nextFrame()
      await nextFrame()
      field.blur()
      await wait(iosCloseReport)
      fakeViewport.move({ height: 844 })
      await wait(motionMs + 150)
      closing.stop()
      const closeStart = Number(root.dataset.keyboardEnd) - motionMs
      const started = closing.moves[0] ?? closeStart
      checkEdge(`close start${scrolled ? ' (scrolled up)' : ''}`, closing.frames, started, (drawn) =>
        bottomAt(keyboard * (1 - curveAt(Math.max(drawn, started) - closeStart))),
      )
      await expect(composer().bottom).toBe(rest)
    }
    await expect(off).toEqual([])
  }),
}
/** Phone chat on iOS: no box jumps in the frame where a fall starts or a rise ends, where the layout changes. */
export const DockEdgesDark: StoryObj<typeof meta> = { ...dockEdges, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const DockEdgesLight: StoryObj<typeof meta> = { ...dockEdges, globals: { mode: 'light', viewport: { value: 'm390' } } }

// A keyboard that turns back during its move: a close during an open, and an open during a close. The dock starts the
// new move from where it is drawn, on the keyboard's clock: every frame shows the composer within 1 px of the first
// move's curve until the turn (a frame drawn at a time before the turn shows the first move), and after it within 1 px
// of the new move's curve from the place the dock was drawn at the turn, which the keyboard started at its own start
// (a report comes after the keyboard started).
const dockTurns: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <ThreadChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { root, footer, field } = threadParts(canvasElement)
    const keyboard = 336
    const safe = 34
    // The rise on a curve in the keyboard's inset, from `from` to `to`, started at `start`, at the time `t`.
    const riseOn = (from: number, to: number, start: number) => (t: number) =>
      Math.max(0, from + (to - from) * curveAt(t - start) - safe)
    const off: string[] = []
    // `least` frames at least, so a check cannot pass on none: 2 for the 70 ms of a close that an open turns back, which
    // a slow runner draws in 3 frames.
    const check = (name: string, frames: { drawn: number; rise: number }[], rise: (t: number) => number, least = 4) => {
      if (frames.length < least) off.push(`${name}: ${String(frames.length)} frames`)
      for (const f of frames) {
        const want = rise(f.drawn)
        if (Math.abs(f.rise - want) > 1) off.push(`${name} @${String(Math.round(f.drawn))}: rise ${f.rise.toFixed(1)}, curve ${want.toFixed(1)}`)
      }
    }
    const moves: number[] = []
    root.addEventListener('app-shell-dock', () => moves.push(performance.now()))
    // The start of the move that the last report or focus change started: its end once it has changed, less its time.
    const newStart = async (was: string | undefined) => {
      await waitFor(() => expect(root.dataset.keyboardEnd).not.toBe(was), { timeout: 2000 })
      return Number(root.dataset.keyboardEnd) - motionMs
    }
    // A close during an open: the keyboard reports, and 90 ms later the field is blurred.
    const first = recordRise(footer, root)
    await userEvent.click(field)
    await wait(110)
    const reported = performance.now()
    let was = root.dataset.keyboardEnd
    fakeViewport.move({ height: 844 - keyboard })
    const openStart = await newStart(was)
    await wait(90)
    was = root.dataset.keyboardEnd
    const blurred = performance.now()
    field.blur()
    await wait(iosCloseReport)
    fakeViewport.move({ height: 844 })
    const closeStart = await newStart(was)
    await settled(footer, 0)
    await wait(motionMs)
    first.stop()
    const turn = moves.find((at) => at >= blurred) ?? closeStart
    const opening = riseOn(0, keyboard, openStart)
    // The inset drawn at the turn, from which the fall starts.
    const turned = Math.max(0, keyboard * curveAt(turn - openStart))
    const closing = riseOn(turned, 0, closeStart)
    // From the report: before it the composer is down, as the keyboard has not shown.
    check('open', first.frames.filter((f) => f.drawn >= reported && f.drawn < closeStart), opening)
    check('close during open', first.frames.filter((f) => f.drawn >= closeStart), (t) => (t < turn ? opening(t) : closing(t)))
    // An open during a close: the keyboard closes, and 70 ms later the field takes the focus and the keyboard reports.
    await userEvent.click(field)
    fakeViewport.move({ height: 844 - keyboard })
    await settled(footer, keyboard - safe)
    await wait(motionMs)
    const second = recordRise(footer, root)
    was = root.dataset.keyboardEnd
    field.blur()
    await wait(iosCloseReport)
    fakeViewport.move({ height: 844 })
    const fallStart = await newStart(was)
    await wait(70 - iosCloseReport)
    const reopened = performance.now()
    await userEvent.click(field)
    was = root.dataset.keyboardEnd
    fakeViewport.move({ height: 844 - keyboard })
    const riseStart = await newStart(was)
    await settled(footer, keyboard - safe)
    await wait(motionMs)
    second.stop()
    // The rise's start (a later event lays the same inset out again).
    const back = moves.find((at) => at >= reopened) ?? riseStart
    const falling = riseOn(keyboard, 0, fallStart)
    const fallen = keyboard * (1 - curveAt(back - fallStart))
    const rising = riseOn(fallen, keyboard, riseStart)
    check('close', second.frames.filter((f) => f.drawn > fallStart && f.drawn < riseStart), falling, 2)
    check('open during close', second.frames.filter((f) => f.drawn >= riseStart), (t) => (t < back ? falling(t) : rising(t)))
    await expect(off).toEqual([])
  }),
}
/** Phone chat on iOS: a close during an open, and an open during a close, each start from where the composer is drawn. */
export const DockTurnsDark: StoryObj<typeof meta> = { ...dockTurns, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const DockTurnsLight: StoryObj<typeof meta> = { ...dockTurns, globals: { mode: 'light', viewport: { value: 'm390' } } }

// A chat whose composer grows by a 28 px row while the keyboard is open, as the-bridge's collapsed composer (R31): it
// listens for `appShellDockEvent` and sets its state there, as React renders it, in a later task.
const growRow = css({ pt: '24', pb: '4' })
function GrowingChat() {
  const [grown, setGrown] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = ref.current?.closest('.app-shell__root')
    if (root === null || root === undefined) return undefined
    const onDock = (event: Event) => {
      if (!(event instanceof CustomEvent)) return
      const detail: unknown = event.detail
      if (typeof detail === 'object' && detail !== null && 'inset' in detail) setGrown(Number(detail.inset) > 0)
    }
    root.addEventListener(appShellDockEvent, onDock)
    return () => {
      root.removeEventListener(appShellDockEvent, onDock)
    }
  }, [])
  return (
    <div className={screenFrame}>
      <AppShell
        size="phone"
        view="detail"
        detail={
          <ScrollFrame
            bodyClassName={frameBody}
            footer={
              <div ref={ref} role="group" aria-label="Composer" className={composerBox}>
                <textarea aria-label="Message" rows={1} className={messageField} />
                {grown ? <div data-testid="grow-row" className={growRow} /> : null}
              </div>
            }
          >
            {messages.map((m) => (
              <p key={m} className={text}>
                {m}
              </p>
            ))}
          </ScrollFrame>
        }
      />
    </div>
  )
}
// A composer that grows as the keyboard opens and shrinks as it closes, from the dock's event (screen review R39: it grew
// at the tap, a 28 px step before the keyboard moved). The growth comes in the move: in every frame the composer's
// bottom is on the keyboard's curve, its height changes once, at or after the move's start, and the thread's last line
// moves with the composer's bottom within 8 px a frame, so neither the composer nor the thread jumps by the row.
const growOnDock: StoryObj<typeof meta> = {
  ...withMotion,
  render: () => <GrowingChat />,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { root, field, composer } = threadParts(canvasElement)
    const body = slotOf(canvasElement, 'scroll-frame__body')
    const last = within(canvasElement).getByText('Message 40 of the thread')
    const keyboard = 336
    const rest = 844 - 34
    const bottomAt = (inset: number) => Math.min(rest, 844 - inset)
    const off: string[] = []
    // The frames from the first that the move draws (one that comes after its first event) on.
    const check = (name: string, record: ReturnType<typeof recordBoxes>, start: number, inset: (t: number) => number) => {
      const { frames } = record
      const moved = record.moves[0] ?? start
      const during = frames.filter((f) => f.at > moved && f.drawn >= start)
      if (during.length < 4) off.push(`${name}: ${String(during.length)} frames`)
      const heights = new Set(frames.map((f) => Math.round(f.composer.height)))
      if (heights.size !== 2) off.push(`${name}: composer heights ${[...heights].join(', ')}`)
      const changed = frames.findIndex((f, i) => i > 0 && Math.abs(f.composer.height - (frames[i - 1]?.composer.height ?? 0)) > 0.5)
      const at = frames[changed]
      if (at !== undefined && at.at < moved) off.push(`${name}: the composer changed at ${at.drawn.toFixed(0)}, before the move at ${start.toFixed(0)}`)
      during.forEach((f, i) => {
        // A move (re)started in a frame holds the place of its start for a frame time before it: a frame whose time came
        // before the growth's restart, drawn after it, shows the composer where the restart found it.
        const restarted = record.moves.filter((m) => m < f.at).at(-1) ?? moved
        const want = bottomAt(inset(Math.max(f.drawn, restarted)))
        if (Math.abs(f.composer.bottom - want) > 1) off.push(`${name} @${f.drawn.toFixed(0)}: composer bottom ${f.composer.bottom.toFixed(1)}, curve ${want.toFixed(1)}`)
        const before = during[i - 1]
        const line = f.lines[0]
        const was = before?.lines[0]
        if (before === undefined || line === null || line === undefined || was === null || was === undefined) return
        const step = line.bottom - was.bottom - (f.composer.bottom - before.composer.bottom)
        if (Math.abs(step) > 8) off.push(`${name} @${f.drawn.toFixed(0)}: the last line moved ${step.toFixed(1)} px off the composer`)
      })
    }
    body.scrollTop = body.scrollHeight
    await nextFrame()
    const opening = recordBoxes(root, composer, [last])
    await nextFrame()
    await userEvent.click(field)
    await wait(110)
    fakeViewport.move({ height: 844 - keyboard })
    await waitFor(() => expect(root.dataset.keyboardEnd).not.toBeUndefined())
    const openStart = Number(root.dataset.keyboardEnd) - motionMs
    await wait(motionMs + 150)
    opening.stop()
    check('open', opening, openStart, (t) => keyboard * curveAt(t - openStart))
    await expect(within(canvasElement).getByTestId('grow-row')).toBeVisible()
    const closing = recordBoxes(root, composer, [last])
    await nextFrame()
    const blurred = performance.now()
    field.blur()
    await wait(iosCloseReport)
    fakeViewport.move({ height: 844 })
    await waitFor(() => expect(Number(root.dataset.keyboardEnd)).toBeGreaterThan(blurred))
    const closeStart = Number(root.dataset.keyboardEnd) - motionMs
    await wait(motionMs + 150)
    closing.stop()
    check('close', closing, closeStart, (t) => keyboard * (1 - curveAt(t - closeStart)))
    await expect(within(canvasElement).queryByTestId('grow-row')).toBeNull()
    await expect(off).toEqual([])
  }),
}
/** Phone chat on iOS: a composer that grows with the dock's event grows on the keyboard's curve, with no jump. */
export const GrowOnDockDark: StoryObj<typeof meta> = { ...growOnDock, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const GrowOnDockLight: StoryObj<typeof meta> = { ...growOnDock, globals: { mode: 'light', viewport: { value: 'm390' } } }

