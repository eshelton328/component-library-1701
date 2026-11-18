import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
import { Container, Inline, Stack } from '../controls/layout'
import { ScrollFrame } from '../controls/scroll-frame'
import { ArtifactsIcon, HomeIcon, InboxIcon, MoreIcon, WorkspacesIcon } from '../foundations/icons'
import type { NavItem } from '../parts/nav-item'
import { TabBar } from '../parts/tab-bar'
import { AppShell } from '../shell/app-shell'

// The Inbox list on the iPhone screen (390 x 844, Inbox M1 346:8982), with the phone tab bar as the-bridge places
// it: in the AppShell tab bar slot, below the list or over its foot (`tabBarOverlay`).
const phoneScreen = { m390: { name: 'Phone (390 x 844)', styles: { width: '390px', height: '844px' } } }
const screenFrame = css({ display: 'flex', flexDirection: 'column', h: 'dvh' })
const row = css({ textStyle: 'body', color: 'fg.default', py: '12' })

const items: readonly NavItem[] = [
  { value: 'home', label: 'Home', icon: <HomeIcon /> },
  { value: 'inbox', label: 'Inbox', icon: <InboxIcon />, badge: 3 },
  { value: 'workspaces', label: 'Workspaces', icon: <WorkspacesIcon /> },
  { value: 'artifacts', label: 'Artifacts', icon: <ArtifactsIcon /> },
  { value: 'more', label: 'More', icon: <MoreIcon /> },
]
const tasks = Array.from({ length: 30 }, (_, i) => `Task ${String(i + 1)} needs a review`)

function PhoneInbox({ tabBarOverlay }: { tabBarOverlay: boolean }) {
  return (
    <div className={screenFrame}>
      <AppShell
        size="phone"
        tabBarOverlay={tabBarOverlay}
        list={
          <Container>
            <Stack>
              {tasks.map((t) => (
                <p key={t} className={row}>
                  {t}
                </p>
              ))}
            </Stack>
          </Container>
        }
        tabBar={<TabBar items={items} selected="inbox" />}
      />
    </div>
  )
}

const meta = {
  title: 'Examples/Phone tab bar',
  component: PhoneInbox,
  args: { tabBarOverlay: false },
  parameters: { viewport: { options: phoneScreen } },
  play: async ({ canvasElement }) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const root = canvasElement.querySelector('.app-shell__root')
    if (!(root instanceof HTMLElement)) throw new Error('no shell')
    const bar = within(canvasElement).getByRole('navigation', { name: 'Main' })
    const tabs = bar.querySelector('.tab-bar__list')
    if (!(tabs instanceof HTMLElement)) throw new Error('no tabs')
    const shell = root.getBoundingClientRect()
    const box = bar.getBoundingClientRect()
    // The shell fills the screen, and the bar sits at its foot: its bottom is the shell's and the screen's, with no
    // gap under it, whether the bar is below the list or over it.
    await expect(Math.round(shell.height)).toBe(844)
    await expect(Math.round(box.bottom)).toBe(Math.round(shell.bottom))
    await expect(Math.round(box.bottom)).toBe(844)
    // Where the device gives no home-indicator inset (env() is 0 in Chromium), the bar is the token's height, 77
    // (sizes.shell.tabBar), with no padding of its own under the tabs: the 26 px under the 42 px tabs is the
    // home-indicator area Figma draws.
    const token = getComputedStyle(document.documentElement).getPropertyValue('--sizes-shell-tab-bar').trim()
    await expect(token).toBe('77px')
    await expect(`${String(Math.round(box.height))}px`).toBe(token)
    await expect(getComputedStyle(bar).paddingBottom).toBe('0px')
    await expect(Math.round(box.bottom - tabs.getBoundingClientRect().bottom)).toBe(26)
  },
} satisfies Meta<typeof PhoneInbox>
export default meta

/** The phone Inbox list with the tab bar below it: the bar is 77 high and ends at the screen's foot. */
export const BelowDark: StoryObj<typeof meta> = { globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const BelowLight: StoryObj<typeof meta> = { globals: { mode: 'light', viewport: { value: 'm390' } } }

/** The phone Inbox list with the tab bar over its foot (`tabBarOverlay`): the same bar at the same place. */
export const OverlayDark: StoryObj<typeof meta> = { args: { tabBarOverlay: true }, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const OverlayLight: StoryObj<typeof meta> = { args: { tabBarOverlay: true }, globals: { mode: 'light', viewport: { value: 'm390' } } }

// A detail page in a ScrollFrame with a sticky Start in its footer, under the overlaid tab bar, as the Toolkit pages.
const startBar = css({ px: '16' })
function PhoneTask() {
  return (
    <div className={screenFrame}>
      <AppShell
        size="phone"
        view="detail"
        tabBarOverlay
        detail={
          <ScrollFrame
            footer={
              <div className={startBar}>
                <Button variant="primary">Start</Button>
              </div>
            }
          >
            {tasks.map((t) => (
              <p key={t} className={row}>
                {t}
              </p>
            ))}
          </ScrollFrame>
        }
        tabBar={<TabBar items={items} selected="inbox" />}
      />
    </div>
  )
}

// A device home-indicator inset for the story test. Chromium's env(safe-area-inset-bottom) is 0, and CSS cannot set
// it, so the test runner's DevTools session overrides the safe-area insets, as a phone with a 48 px inset reports
// them; headless Chromium applies it with no viewport-fit=cover.
const emulateInset = async (bottom: number | undefined) => {
  const { cdp } = await import('vitest/browser')
  await cdp().send('Emulation.setSafeAreaInsetsOverride', { insets: bottom === undefined ? {} : { bottom } })
}

const insetPlay = (inset: number) => async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
  const bar = within(canvasElement).getByRole('navigation', { name: 'Main' })
  const detail = within(canvasElement).getByRole('main')
  const start = within(canvasElement).getByRole('button', { name: 'Start' })
  const footer = canvasElement.querySelector('.scroll-frame__footer')
  if (!(footer instanceof HTMLElement)) throw new Error('no footer')
  // The bar is 77 (sizes.shell.tabBar) and grows by the inset over 34 (sizes.shell.safeAreaBottom): 91 with 48.
  const height = 77 + Math.max(0, inset - 34)
  const box = bar.getBoundingClientRect()
  await expect(Math.round(box.height)).toBe(height)
  await expect(Math.round(box.bottom)).toBe(844)
  // The shell reserves the same height: the detail's end padding and scroll padding, and the ScrollFrame's footer,
  // with the Start button, ends at or above the bar's top.
  const style = getComputedStyle(detail)
  await expect([style.paddingBottom, style.scrollPaddingBottom]).toEqual([`${String(height)}px`, `${String(height)}px`])
  await expect(Math.round(footer.getBoundingClientRect().bottom)).toBeLessThanOrEqual(Math.round(box.top))
  await expect(Math.round(start.getBoundingClientRect().bottom)).toBeLessThanOrEqual(Math.round(box.top))
}

/** A phone task under the overlaid tab bar with no home-indicator inset (env() 0): the bar and the space the shell keeps for it are 77. */
export const InsetNoneDark: StoryObj<typeof meta> = {
  render: () => <PhoneTask />,
  globals: { mode: 'dark', viewport: { value: 'm390' } },
  play: insetPlay(0),
}
export const InsetNoneLight: StoryObj<typeof meta> = { ...InsetNoneDark, globals: { mode: 'light', viewport: { value: 'm390' } } }

/**
 * A phone task under the overlaid tab bar on a device with a 48 px home-indicator inset: the bar grows to 91, and the
 * shell keeps 91 for it, so the ScrollFrame's footer ends above the bar.
 */
export const InsetDark: StoryObj<typeof meta> = {
  // Only the story test runner has the DevTools session that sets the inset, so the Storybook UI leaves this story
  // out; the test runner still runs it.
  tags: ['!dev'],
  render: () => <PhoneTask />,
  globals: { mode: 'dark', viewport: { value: 'm390' } },
  beforeEach: async () => {
    await emulateInset(48)
    return async () => {
      await emulateInset(undefined)
    }
  },
  play: insetPlay(48),
}
export const InsetLight: StoryObj<typeof meta> = { ...InsetDark, globals: { mode: 'light', viewport: { value: 'm390' } } }

// A stand-in for window.visualViewport that the play test moves as iOS Safari does: the layout keeps its 844 and only
// the visual viewport shrinks, for the keyboard or for the browser's bars (as in the AppShell stories).
class FakeViewport extends EventTarget {
  height = document.documentElement.clientHeight
  width = document.documentElement.clientWidth
  offsetTop = 0
  offsetLeft = 0
  scale = 1
  move(height: number) {
    this.height = height
    this.dispatchEvent(new Event('resize'))
  }
}
let fakeViewport = new FakeViewport()
const replaceVisualViewport = (value: FakeViewport) => {
  const own = Object.getOwnPropertyDescriptor(window, 'visualViewport')
  Object.defineProperty(window, 'visualViewport', { configurable: true, value })
  return () => {
    if (own) Object.defineProperty(window, 'visualViewport', own)
    else Reflect.deleteProperty(window, 'visualViewport')
  }
}

const messageField = css({ display: 'block', flex: '1', textStyle: 'body', color: 'fg.default', bg: 'transparent' })

// Two tab pages in one AppShell, as the-bridge keeps the shell across its routes: Inbox, a chat with a message field
// and Send, and Workspaces, with no field. A tab press swaps the detail.
function TabRoutes() {
  const [page, setPage] = useState('inbox')
  return (
    <div className={screenFrame}>
      <AppShell
        size="phone"
        view="detail"
        tabBarOverlay
        detail={
          page === 'inbox' ? (
            <ScrollFrame
              footer={
                <Inline className={startBar}>
                  <textarea aria-label="Message" rows={1} className={messageField} />
                  <Button>Send</Button>
                </Inline>
              }
            >
              {tasks.map((t) => (
                <p key={t} className={row}>
                  {t}
                </p>
              ))}
            </ScrollFrame>
          ) : (
            <Container>
              <p className={row}>Workspaces page</p>
            </Container>
          )
        }
        tabBar={<TabBar items={items} selected={page} onSelect={setPage} />}
      />
    </div>
  )
}

// A tap on a tab while the message field has the focus. Safari focuses no button on a tap, so the field keeps the
// focus until the new page unmounts it, and WebKit fires no focusout then; the capture listener keeps Chromium's
// focusout of the removal from the document. `click()` presses the tab without moving the focus.
const tapTabRemovingField = async (canvasElement: HTMLElement, tab: string) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('textbox', { name: 'Message' })).toHaveFocus()
  const swallow = (event: Event) => {
    event.stopImmediatePropagation()
  }
  window.addEventListener('focusout', swallow, { capture: true })
  canvas.getByRole('button', { name: tab }).click()
  await expect(await canvas.findByText('Workspaces page')).toBeVisible()
  window.removeEventListener('focusout', swallow, { capture: true })
  await expect(canvas.queryByRole('textbox', { name: 'Message' })).toBeNull()
  await expect(document.activeElement).toBe(document.body)
}

const tabRouteChange: StoryObj<typeof meta> = {
  render: () => <TabRoutes />,
  beforeEach: () => {
    fakeViewport = new FakeViewport()
    return replaceVisualViewport(fakeViewport)
  },
  play: async ({ canvasElement }) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const canvas = within(canvasElement)
    const root = canvasElement.querySelector('.app-shell__root')
    if (!(root instanceof HTMLElement)) throw new Error('no shell')
    const full = async () => {
      await expect(root.style.getPropertyValue('--app-shell-keyboard')).toBe('')
      await expect(Math.round(root.getBoundingClientRect().height)).toBe(844)
      const bar = canvas.getByRole('navigation', { name: 'Main' }).getBoundingClientRect()
      await expect(Math.round(bar.bottom)).toBe(Math.round(root.getBoundingClientRect().bottom))
    }
    // The keyboard covers the 300 px foot of the overlaid detail, the tab bar included: the Send row docks on it.
    const openKeyboard = async () => {
      await userEvent.click(await canvas.findByRole('textbox', { name: 'Message' }))
      fakeViewport.move(544)
      await expect(root.style.getPropertyValue('--app-shell-keyboard')).toBe('300px')
      await expect(Math.round(canvas.getByRole('button', { name: 'Send' }).getBoundingClientRect().bottom)).toBeLessThanOrEqual(544)
    }
    // The keyboard is open for the Inbox chat's message, and a tab press opens Workspaces, which unmounts the field.
    await openKeyboard()
    await tapTabRemovingField(canvasElement, 'Workspaces')
    // The keyboard closes, then the browser's bars shrink the visual viewport by 70 with no field focused: the shell
    // stays the full screen with the bar at its foot.
    fakeViewport.move(844)
    await full()
    fakeViewport.move(774)
    await full()
    fakeViewport.move(844)
    // Back to Inbox, and the other order: the bars' shrink (774) is the first viewport event after the tab press,
    // before the keyboard's own resize. It is a visualViewport resize, so it fits, finds no focused field and drops
    // the fit at once.
    canvas.getByRole('button', { name: /^Inbox/ }).click()
    await openKeyboard()
    await tapTabRemovingField(canvasElement, 'Workspaces')
    fakeViewport.move(774)
    await full()
    fakeViewport.move(844)
    await full()
  },
}

/** A tab press while the Inbox chat's keyboard is open swaps the page and unmounts the focused field (no focusout): the dock ends, the tab bar stays at the shell's foot, and no later shrink of the browser's bars docks anything. */
export const TabRouteChangeDark: StoryObj<typeof meta> = { ...tabRouteChange, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const TabRouteChangeLight: StoryObj<typeof meta> = { ...tabRouteChange, globals: { mode: 'light', viewport: { value: 'm390' } } }

// The shell after a blur with no viewport event: the field loses the focus with no pointer down (the keyboard's Done,
// the iOS form bar's check, or a blur from code), and the visual viewport stays at the keyboard's 544.
const blurParts = async (canvasElement: HTMLElement) => {
  await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
  const canvas = within(canvasElement)
  const root = canvasElement.querySelector('.app-shell__root')
  if (!(root instanceof HTMLElement)) throw new Error('no shell')
  const field = canvas.getByRole('textbox', { name: 'Message' })
  const full = async () => {
    await expect(root.style.getPropertyValue('--app-shell-keyboard')).toBe('')
    await expect(Math.round(root.getBoundingClientRect().height)).toBe(844)
    const bar = canvas.getByRole('navigation', { name: 'Main' }).getBoundingClientRect()
    await expect(Math.round(bar.bottom)).toBe(Math.round(root.getBoundingClientRect().bottom))
  }
  await userEvent.click(field)
  fakeViewport.move(544)
  await expect(root.style.getPropertyValue('--app-shell-keyboard')).toBe('300px')
  field.blur()
  await expect(field).not.toHaveFocus()
  // The fit stays for the keyboard's own resize to end it, then ends on its own after about 300 ms.
  await expect(root.style.getPropertyValue('--app-shell-keyboard')).toBe('300px')
  await waitFor(() => expect(root.style.getPropertyValue('--app-shell-keyboard')).toBe(''), { timeout: 2000 })
  await full()
  return { full }
}

const blurNoResize: StoryObj<typeof meta> = {
  render: () => <TabRoutes />,
  beforeEach: () => {
    fakeViewport = new FakeViewport()
    return replaceVisualViewport(fakeViewport)
  },
  play: async ({ canvasElement }) => {
    await blurParts(canvasElement)
    // The visual viewport never grows back (iOS standalone): nothing docks, and the bar stays at the shell's foot.
    await expect(fakeViewport.height).toBe(544)
  },
}

/** A blur with no pointer and no viewport resize after it: the dock ends after 300 ms, with the tab bar at the shell's foot. */
export const BlurNoResizeDark: StoryObj<typeof meta> = { ...blurNoResize, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const BlurNoResizeLight: StoryObj<typeof meta> = { ...blurNoResize, globals: { mode: 'light', viewport: { value: 'm390' } } }

const blurLateResize: StoryObj<typeof meta> = {
  ...blurNoResize,
  play: async ({ canvasElement }) => {
    const { full } = await blurParts(canvasElement)
    // The visual viewport grows back late and in steps, after the dock has ended: nothing docks through them.
    fakeViewport.move(700)
    await full()
    fakeViewport.move(844)
    await full()
  },
}

/** A blur whose viewport resize comes late and in steps (544, 700, 844): nothing docks at any step. */
export const BlurLateResizeDark: StoryObj<typeof meta> = { ...blurLateResize, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const BlurLateResizeLight: StoryObj<typeof meta> = { ...blurLateResize, globals: { mode: 'light', viewport: { value: 'm390' } } }

const blurThenPress: StoryObj<typeof meta> = {
  ...blurNoResize,
  play: async ({ canvasElement }) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const canvas = within(canvasElement)
    const root = canvasElement.querySelector('.app-shell__root')
    if (!(root instanceof HTMLElement)) throw new Error('no shell')
    const field = canvas.getByRole('textbox', { name: 'Message' })
    const send = canvas.getByRole('button', { name: 'Send' })
    const height = () => Math.round(root.getBoundingClientRect().height)
    const dock = () => root.style.getPropertyValue('--app-shell-keyboard')
    // The dock at each click on Send.
    const atClick: string[] = []
    send.addEventListener('click', () => atClick.push(dock()))
    await userEvent.click(field)
    fakeViewport.move(544)
    await expect(dock()).toBe('300px')
    // A blur with no pointer down starts the 300 ms end; within it the finger comes down on Send and stays down.
    field.blur()
    await expect(field).not.toHaveFocus()
    const box = send.getBoundingClientRect()
    const at = { bubbles: true, cancelable: true, clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 }
    send.dispatchEvent(new PointerEvent('pointerdown', at))
    send.dispatchEvent(new MouseEvent('mousedown', at))
    // Past the 300 ms with the pointer down: the dock stays and Send stays under the finger.
    await new Promise((resolve) => setTimeout(resolve, 500))
    await expect(dock()).toBe('300px')
    await expect(send.getBoundingClientRect().top).toBe(box.top)
    await expect(document.elementFromPoint(at.clientX, at.clientY)?.closest('button')).toBe(send)
    // The release: the click lands on Send while it is still docked, and one frame later the dock ends.
    send.dispatchEvent(new PointerEvent('pointerup', at))
    send.dispatchEvent(new MouseEvent('mouseup', at))
    send.dispatchEvent(new MouseEvent('click', at))
    await expect(atClick).toEqual(['300px'])
    await expect(dock()).toBe('300px')
    await new Promise((resolve) => requestAnimationFrame(resolve))
    await expect(dock()).toBe('')
    // The shell keeps its 844 all along.
    await expect(height()).toBe(844)
  },
}

/** A blur with no pointer, then a press on Send within the 300 ms that stays down past them: the composer stays docked until the release, the click lands on Send, and one frame later the dock ends. */
export const BlurThenPressDark: StoryObj<typeof meta> = { ...blurThenPress, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const BlurThenPressLight: StoryObj<typeof meta> = { ...blurThenPress, globals: { mode: 'light', viewport: { value: 'm390' } } }
