import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
import { Container, Inline, Stack } from '../controls/layout'
import { ScrollFrame } from '../controls/scroll-frame'
import { ArtifactsIcon, HomeIcon, InboxIcon, MoreIcon, WorkspacesIcon } from '../foundations/icons'
import { Composer } from '../parts/composer'
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

// A play takes the viewport its story's setup made, as its own `fakeViewport`, and never reads the global again: a
// play that timed out runs on, and with the global it moved the next story's viewport (Keyboard Light failed under
// load with the composer one screen down). Its writes now reach only its own viewport, which no shell reads.
type PlayContext = Parameters<NonNullable<StoryObj<typeof meta>['play']>>[0]
const viewportPlay =
  (play: (context: PlayContext, viewport: FakeViewport) => Promise<void>) =>
  (context: PlayContext): Promise<void> =>
    play(context, fakeViewport)
// Puts the fake in place of window.visualViewport for one story, on a device with a mouse and reduced motion, so each
// change of the dock is there at once (as in the AppShell stories of the dock's rules).
const replaceVisualViewport = (value: FakeViewport) => {
  const own = Object.getOwnPropertyDescriptor(window, 'visualViewport')
  const ownMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia')
  const real = window.matchMedia.bind(window)
  Object.defineProperty(window, 'visualViewport', { configurable: true, value })
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => (query === '(prefers-reduced-motion: reduce)' ? { matches: true, media: query } : real(query)),
  })
  return () => {
    if (own) Object.defineProperty(window, 'visualViewport', own)
    else Reflect.deleteProperty(window, 'visualViewport')
    if (ownMedia) Object.defineProperty(window, 'matchMedia', ownMedia)
    else Reflect.deleteProperty(window, 'matchMedia')
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
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
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
  }),
}

/** A tab press while the Inbox chat's keyboard is open swaps the page and unmounts the focused field (no focusout): the dock ends, the tab bar stays at the shell's foot, and no later shrink of the browser's bars docks anything. */
export const TabRouteChangeDark: StoryObj<typeof meta> = { ...tabRouteChange, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const TabRouteChangeLight: StoryObj<typeof meta> = { ...tabRouteChange, globals: { mode: 'light', viewport: { value: 'm390' } } }

// The shell after a blur with no viewport event: the field loses the focus with no pointer down (the keyboard's Done,
// the iOS form bar's check, or a blur from code), and the visual viewport stays at the keyboard's 544.
const blurParts = async (viewport: FakeViewport, canvasElement: HTMLElement) => {
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
  viewport.move(544)
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
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    await blurParts(fakeViewport, canvasElement)
    // The visual viewport never grows back (iOS standalone): nothing docks, and the bar stays at the shell's foot.
    await expect(fakeViewport.height).toBe(544)
  }),
}

/** A blur with no pointer and no viewport resize after it: the dock ends after 300 ms, with the tab bar at the shell's foot. */
export const BlurNoResizeDark: StoryObj<typeof meta> = { ...blurNoResize, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const BlurNoResizeLight: StoryObj<typeof meta> = { ...blurNoResize, globals: { mode: 'light', viewport: { value: 'm390' } } }

const blurLateResize: StoryObj<typeof meta> = {
  ...blurNoResize,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { full } = await blurParts(fakeViewport, canvasElement)
    // The visual viewport grows back late and in steps, after the dock has ended: nothing docks through them.
    fakeViewport.move(700)
    await full()
    fakeViewport.move(844)
    await full()
  }),
}

/** A blur whose viewport resize comes late and in steps (544, 700, 844): nothing docks at any step. */
export const BlurLateResizeDark: StoryObj<typeof meta> = { ...blurLateResize, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const BlurLateResizeLight: StoryObj<typeof meta> = { ...blurLateResize, globals: { mode: 'light', viewport: { value: 'm390' } } }

const blurThenPress: StoryObj<typeof meta> = {
  ...blurNoResize,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
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
  }),
}

/** A blur with no pointer, then a press on Send within the 300 ms that stays down past them: the composer stays docked until the release, the click lands on Send, and one frame later the dock ends. */
export const BlurThenPressDark: StoryObj<typeof meta> = { ...blurThenPress, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const BlurThenPressLight: StoryObj<typeof meta> = { ...blurThenPress, globals: { mode: 'light', viewport: { value: 'm390' } } }

// The Inbox list with a search field at its top, under the overlaid tab bar: a page with no dock.
const searchField = css({ textStyle: 'body', color: 'fg.default', bg: 'transparent', py: '12' })
function PhoneInboxSearch() {
  return (
    <div className={screenFrame}>
      <AppShell
        size="phone"
        tabBarOverlay
        list={
          <Container>
            <Stack>
              <input type="search" aria-label="Search tasks" className={searchField} />
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

const searchKeyboard: StoryObj<typeof meta> = {
  render: () => <PhoneInboxSearch />,
  beforeEach: () => {
    fakeViewport = new FakeViewport()
    return replaceVisualViewport(fakeViewport)
  },
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    await expect([window.innerWidth, window.innerHeight]).toEqual([390, 844])
    const canvas = within(canvasElement)
    const root = canvasElement.querySelector('.app-shell__root')
    if (!(root instanceof HTMLElement)) throw new Error('no shell')
    const field = canvas.getByRole('searchbox', { name: 'Search tasks' })
    const places = () =>
      [root, canvas.getByRole('navigation', { name: 'Main' }), field, canvas.getByText('Task 1 needs a review'), canvas.getByText('Task 8 needs a review')].map((el) => {
        const box = el.getBoundingClientRect()
        return [Math.round(box.top), Math.round(box.bottom)]
      })
    const before = places()
    // The tab bar sits at the shell's foot, at the screen's 844.
    await expect(before[1]?.[1]).toBe(844)
    // The search field takes the focus and the keyboard covers the screen's 300 px foot: the keyboard lies over the
    // tab bar, which stays fixed at the shell's foot, and nothing on the page moves.
    await userEvent.click(field)
    await expect(field).toHaveFocus()
    fakeViewport.move(544)
    await expect(places()).toEqual(before)
    await expect(Math.round(root.getBoundingClientRect().height)).toBe(844)
    // The keyboard closes: still nothing has moved.
    field.blur()
    fakeViewport.move(844)
    await expect(places()).toEqual(before)
  }),
}

/** The phone Inbox list with its search field focused and the keyboard open: there is no dock, so the keyboard covers the tab bar, which stays at the shell's foot, and nothing moves. */
export const SearchKeyboardDark: StoryObj<typeof meta> = { ...searchKeyboard, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const SearchKeyboardLight: StoryObj<typeof meta> = { ...searchKeyboard, globals: { mode: 'light', viewport: { value: 'm390' } } }

// The Inbox list with a search field and rows that open a task, and a chat with the Composer, for the tap outside
// a field (R19). `opened` counts the rows' clicks and `sent` the Composer's sends.
function TapInbox() {
  const [opened, setOpened] = useState<string[]>([])
  const [page, setPage] = useState<'list' | 'chat'>('list')
  const [sent, setSent] = useState(0)
  return (
    <div className={screenFrame}>
      <AppShell
        size="phone"
        view={page === 'chat' ? 'detail' : 'list'}
        tabBarOverlay
        list={
          <Container>
            <Stack>
              <input type="search" aria-label="Search tasks" className={searchField} />
              <label className={row}>
                Owner
                <input type="text" aria-label="Filter by owner" className={searchField} />
              </label>
              <p className={row}>Opened {opened.length}</p>
              {tasks.map((t) => (
                <Button
                  key={t}
                  onClick={() => {
                    setOpened((o) => [...o, t])
                  }}
                >
                  {t}
                </Button>
              ))}
              <Button
                onClick={() => {
                  setPage('chat')
                }}
              >
                Open the chat
              </Button>
            </Stack>
          </Container>
        }
        detail={
          <ScrollFrame footer={<Composer label="Message" onSubmit={() => {
            setSent((n) => n + 1)
          }} />}>
            <p className={row}>Sent {sent}</p>
          </ScrollFrame>
        }
        tabBar={<TabBar items={items} selected="inbox" />}
      />
    </div>
  )
}

// A finger's tap as Safari delivers it: a touch press and release on the element, then a click. A press on a field
// focuses it, as the browser does at the tap; Safari focuses no button on a tap.
const touchTap = async (el: HTMLElement) => {
  const box = el.getBoundingClientRect()
  const at = { bubbles: true, cancelable: true, composed: true, pointerType: 'touch', pointerId: 7, isPrimary: true, clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 }
  el.dispatchEvent(new PointerEvent('pointerdown', at))
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.focus()
  el.dispatchEvent(new PointerEvent('pointerup', at))
  el.dispatchEvent(new MouseEvent('click', at))
  // React renders what the click changed in a later task; read the page after it.
  return new Promise((resolve) => setTimeout(resolve, 50))
}

const tapParts = (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  return {
    canvas,
    search: canvas.getByRole('searchbox', { name: 'Search tasks' }),
    row: (n: number) => canvas.getByRole('button', { name: `Task ${String(n)} needs a review` }),
    opened: () => canvas.getByText(/^Opened \d+$/).textContent,
  }
}
const withTapDevice = {
  render: () => <TapInbox />,
  beforeEach: () => {
    fakeViewport = new FakeViewport()
    return replaceVisualViewport(fakeViewport)
  },
}

const tapOutsideField: StoryObj<typeof meta> = {
  ...withTapDevice,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { search, row, opened } = tapParts(canvasElement)
    await touchTap(search)
    await expect(search).toHaveFocus()
    fakeViewport.move(544)
    // With the keyboard open, a tap on a row closes the keyboard and opens nothing.
    await touchTap(row(2))
    await expect(search).not.toHaveFocus()
    await expect(opened()).toBe('Opened 0')
    // The next tap, with no field focused, opens the row.
    fakeViewport.move(844)
    await touchTap(row(2))
    await expect(opened()).toBe('Opened 1')
  }),
}

/** The phone Inbox list with its search field focused: a tap on a row closes the keyboard and opens nothing; the next tap opens the row. */
export const TapOutsideFieldDark: StoryObj<typeof meta> = { ...tapOutsideField, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const TapOutsideFieldLight: StoryObj<typeof meta> = { ...tapOutsideField, globals: { mode: 'light', viewport: { value: 'm390' } } }

const tapSend: StoryObj<typeof meta> = {
  ...withTapDevice,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { canvas } = tapParts(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Open the chat' }))
    const message = canvas.getByRole('textbox', { name: 'Message' })
    await touchTap(message)
    await userEvent.keyboard('Ready to ship')
    fakeViewport.move(544)
    const root = canvasElement.querySelector('.app-shell__root')
    if (!(root instanceof HTMLElement)) throw new Error('no shell')
    // Send is a keep element: a tap on it sends, and the field keeps the focus and the dock its place.
    const send = canvas.getByRole('button', { name: 'Send' })
    const top = send.getBoundingClientRect().top
    await touchTap(send)
    await expect(canvas.getByText('Sent 1')).toBeVisible()
    await expect(message).toHaveFocus()
    await expect(send.getBoundingClientRect().top).toBe(top)
    await expect(root.style.getPropertyValue('--app-shell-keyboard')).toBe('300px')
  }),
}

/** The phone chat with the keyboard open: a tap on the Composer's Send sends, and the keyboard stays open. */
export const TapSendDark: StoryObj<typeof meta> = { ...tapSend, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const TapSendLight: StoryObj<typeof meta> = { ...tapSend, globals: { mode: 'light', viewport: { value: 'm390' } } }

const tapFieldToField: StoryObj<typeof meta> = {
  ...withTapDevice,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { canvas, search, opened } = tapParts(canvasElement)
    const owner = canvas.getByRole('textbox', { name: 'Filter by owner' })
    await touchTap(search)
    fakeViewport.move(544)
    // A tap on another field moves the focus to it, and its click is not swallowed.
    let clicks = 0
    owner.addEventListener('click', () => (clicks += 1))
    await touchTap(owner)
    await expect(owner).toHaveFocus()
    await expect(clicks).toBe(1)
    await expect(opened()).toBe('Opened 0')
  }),
}

/** The phone Inbox list with the keyboard open: a tap on another field moves the focus to it, as before. */
export const TapFieldToFieldDark: StoryObj<typeof meta> = { ...tapFieldToField, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const TapFieldToFieldLight: StoryObj<typeof meta> = { ...tapFieldToField, globals: { mode: 'light', viewport: { value: 'm390' } } }

const tapScrollDrag: StoryObj<typeof meta> = {
  ...withTapDevice,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { canvas, search, row, opened } = tapParts(canvasElement)
    const list = canvas.getByRole('main')
    await touchTap(search)
    fakeViewport.move(544)
    // A real touch drag up over the rows, through the test runner's DevTools session: the list scrolls and the
    // keyboard closes, and no click opens a row.
    const box = row(4).getBoundingClientRect()
    const { cdp } = await import('vitest/browser')
    // Touch emulation makes Chromium scroll for the touch events on every platform (headless Linux in CI as well).
    await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 })
    try {
      const x = Math.round(box.left + 20)
      const y = Math.round(box.top)
      await cdp().send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
      for (let step = 1; step <= 10; step++) {
        await cdp().send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - step * 20 }] })
      }
      await cdp().send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    } finally {
      await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: false })
    }
    await waitFor(() => expect(list.scrollTop).toBeGreaterThan(100))
    await expect(search).not.toHaveFocus()
    await expect(opened()).toBe('Opened 0')
    // The next tap is not eaten: it opens its row.
    await touchTap(row(10))
    await expect(opened()).toBe('Opened 1')
  }),
}

/** The phone Inbox list with the keyboard open: a touch drag over the rows still scrolls the list and closes the keyboard, and the next tap opens a row. */
export const TapScrollDragDark: StoryObj<typeof meta> = { ...tapScrollDrag, tags: ['!dev'], globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const TapScrollDragLight: StoryObj<typeof meta> = { ...tapScrollDrag, tags: ['!dev'], globals: { mode: 'light', viewport: { value: 'm390' } } }

const tapLabel: StoryObj<typeof meta> = {
  ...withTapDevice,
  play: viewportPlay(async ({ canvasElement }, fakeViewport) => {
    const { canvas, search, opened } = tapParts(canvasElement)
    const owner = canvas.getByRole('textbox', { name: 'Filter by owner' })
    const label = owner.closest('label')
    if (label === null) throw new Error('no label')
    await touchTap(search)
    fakeViewport.move(544)
    // A tap on another field's label moves the focus to that field, as a tap on the field does (Codex review of #213).
    await touchTap(label)
    await expect(owner).toHaveFocus()
    await expect(opened()).toBe('Opened 0')
  }),
}

/** The phone Inbox list with the keyboard open: a tap on another field's label moves the focus to that field. */
export const TapLabelDark: StoryObj<typeof meta> = { ...tapLabel, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const TapLabelLight: StoryObj<typeof meta> = { ...tapLabel, globals: { mode: 'light', viewport: { value: 'm390' } } }

const tapNoKeyboard: StoryObj<typeof meta> = {
  ...withTapDevice,
  play: async ({ canvasElement }) => {
    const { search, row, opened } = tapParts(canvasElement)
    // A field focused with a hardware keyboard: no on-screen keyboard covers the screen, so the shell docks nothing.
    await touchTap(search)
    await expect(search).toHaveFocus()
    // A tap on a row opens the row at once, as with no field focused (Codex review of #213).
    await touchTap(row(5))
    await expect(opened()).toBe('Opened 1')
  },
}

/** The phone Inbox list with a field focused and no on-screen keyboard (a hardware keyboard): a tap on a row opens it. */
export const TapNoKeyboardDark: StoryObj<typeof meta> = { ...tapNoKeyboard, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const TapNoKeyboardLight: StoryObj<typeof meta> = { ...tapNoKeyboard, globals: { mode: 'light', viewport: { value: 'm390' } } }

const mouseClickRow: StoryObj<typeof meta> = {
  ...withTapDevice,
  play: async ({ canvasElement }) => {
    const { search, row, opened } = tapParts(canvasElement)
    await userEvent.click(search)
    await expect(search).toHaveFocus()
    // A mouse click on a row with the field focused opens the row at once, as before.
    await userEvent.click(row(3))
    await expect(opened()).toBe('Opened 1')
  },
}

/** The Inbox list with a mouse: a click on a row while the search field has the focus opens the row, as before. */
export const MouseClickRowDark: StoryObj<typeof meta> = { ...mouseClickRow, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const MouseClickRowLight: StoryObj<typeof meta> = { ...mouseClickRow, globals: { mode: 'light', viewport: { value: 'm390' } } }
