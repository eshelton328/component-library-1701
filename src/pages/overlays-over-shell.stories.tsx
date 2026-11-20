import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { expect, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { BottomSheet } from '../controls/bottom-sheet'
import { Button } from '../controls/button'
import { Dialog } from '../controls/dialog'
import { Stack } from '../controls/layout'
import { ScrollFrame } from '../controls/scroll-frame'
import { motionDone } from '../controls/bottom-sheet.testing'
import { ArtifactsIcon, HomeIcon, InboxIcon, MoreIcon, WorkspacesIcon } from '../foundations/icons'
import { Composer } from '../parts/composer'
import type { NavItem } from '../parts/nav-item'
import { TabBar } from '../parts/tab-bar'
import { AppShell } from '../shell/app-shell'

// A Dialog and a BottomSheet over the phone shell, where the page lifts its own parts with z-index 1, as the-bridge
// does (Workspaces MoveButton, SidebarGroup, PaneDropZone, EmptyPane and others). The overlays' layers come after
// the shell in <body> and set no z-index, so they are over the page only while the page's z-indexes stay inside
// the shell: the Backdrop root isolates them.
const phoneScreen = { m390: { name: 'Phone (390 x 844)', styles: { width: '390px', height: '844px' } } }
const screenFrame = css({ display: 'flex', flexDirection: 'column', h: 'dvh' })
const row = css({ textStyle: 'body', color: 'fg.default', py: '12' })
// A part of the page that the play function lifts with z-index 1 (the library has no z-index token, and a story
// may set no raw value, so the play function sets it as the-bridge's own CSS does).
const pagePart = css({ position: 'relative', bg: 'bg.canvas' })
// A drop zone over the whole pane, as the-bridge's PaneDropZone draws one, with no fill and no pointer events. The composer's footer moves
// with a transform, which makes it a stacking context of its own, so only a part outside it can paint over it.
const dropZone = css({ position: 'absolute', inset: '0', pointerEvents: 'none' })

const items: readonly NavItem[] = [
  { value: 'home', label: 'Home', icon: <HomeIcon /> },
  { value: 'inbox', label: 'Inbox', icon: <InboxIcon /> },
  { value: 'workspaces', label: 'Workspaces', icon: <WorkspacesIcon /> },
  { value: 'artifacts', label: 'Artifacts', icon: <ArtifactsIcon /> },
  { value: 'more', label: 'More', icon: <MoreIcon /> },
]
const tasks = Array.from({ length: 30 }, (_, i) => `Task ${String(i + 1)} needs a review`)
const choices = Array.from({ length: 24 }, (_, i) => `Choice ${String(i + 1)}`)

type Kind = 'dialog' | 'sheet'

// The overlay with a column of choices, so one of them lies over the tab bar or the docked composer.
function Overlay({ kind, open, onOpenChange, onPick }: { kind: Kind; open: boolean; onOpenChange: (open: boolean) => void; onPick: (choice: string) => void }) {
  const list = (
    <Stack gap="8">
      {choices.map((c) => (
        <Button key={c} onClick={() => { onPick(c) }}>{c}</Button>
      ))}
    </Stack>
  )
  return kind === 'dialog' ? (
    <Dialog title="Actions" open={open} onOpenChange={onOpenChange}>
      {list}
    </Dialog>
  ) : (
    <BottomSheet title="Actions" open={open} onOpenChange={onOpenChange}>
      {list}
    </BottomSheet>
  )
}

function Page({ kind, composer }: { kind: Kind; composer: boolean }) {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState('none')
  const body: ReactNode = (
    <div className={pagePart} data-page-part="">
      <p className={row}>{`Picked: ${picked}`}</p>
      {composer ? null : <Button onClick={() => { setOpen(true) }}>Open actions</Button>}
      {tasks.map((t) => <p key={t} className={row}>{t}</p>)}
    </div>
  )
  return (
    <div className={screenFrame}>
      <AppShell
        size="phone"
        view="detail"
        tabBarOverlay
        detail={
          composer ? (
            <>
            <ScrollFrame
              footer={
                <div className={pagePart} data-page-part="" data-composer="">
                  <Composer label="Message" onAttach={() => { setOpen(true) }} />
                </div>
              }
            >
              {body}
            </ScrollFrame>
            <div className={dropZone} data-page-part="" />
            </>
          ) : (
            <ScrollFrame>{body}</ScrollFrame>
          )
        }
        tabBar={
          // The page's own wrapper round the bar, which the play function lifts with z-index 1.
          <div className={pagePart} data-page-part="">
            <TabBar items={items} selected="inbox" />
          </div>
        }
      />
      <Overlay kind={kind} open={open} onOpenChange={setOpen} onPick={setPicked} />
    </div>
  )
}

// A stand-in for window.visualViewport that the play test moves as iOS Safari does, as the phone tab bar stories
// do: the layout keeps its 844 and only the visual viewport shrinks for the keyboard. `.storybook/story-reset.ts`
// puts the browser's own back before each story test.
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
const withFakeViewport = () => {
  fakeViewport = new FakeViewport()
  const own = Object.getOwnPropertyDescriptor(window, 'visualViewport')
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: fakeViewport })
  return () => {
    if (own) Object.defineProperty(window, 'visualViewport', own)
    else Reflect.deleteProperty(window, 'visualViewport')
  }
}

// A real pointer click by the test runner's browser at the centre of `el`, in viewport coordinates: it lands on
// whatever is drawn at that point.
async function press(el: Element) {
  const { userEvent } = await import('vitest/browser')
  const r = el.getBoundingClientRect()
  // Move to the point, then press and release the left button there.
  await userEvent.pointer([{ coords: { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } }, '[MouseLeft]'])
}

// Lifts the page's parts with z-index 1, as the-bridge's CSS does. A modal overlay turns pointer events off on the
// page (Ark sets `pointer-events: none` on <body>), so a pointer would pass through a page part even where it
// paints over the overlay; the parts turn them back on, so the pointer lands on whatever paints on top, and a part
// over the overlay shows as a missed pick.
function liftPageParts(canvasElement: HTMLElement) {
  const parts = canvasElement.querySelectorAll<HTMLElement>('[data-page-part]')
  for (const part of parts) {
    part.style.setProperty('z-index', '1')
    part.style.setProperty('pointer-events', 'auto')
  }
  return parts.length
}

// Picks, with a real pointer click, the overlay's choice whose centre lies over `spot` (the tab bar or the docked
// composer), and expects the page to show the pick.
async function pickOver(canvasElement: HTMLElement, overlay: HTMLElement, spot: DOMRect) {
  // The centre must lie over the spot and inside the overlay's box, which clips its scrolled content.
  const box = overlay.getBoundingClientRect()
  const inSpot = (el: Element) => {
    const r = el.getBoundingClientRect()
    const x = r.x + r.width / 2
    const y = r.y + r.height / 2
    return x > spot.left && x < spot.right && y > Math.max(spot.top, box.top) && y < Math.min(spot.bottom, box.bottom)
  }
  const choice = within(overlay)
    .getAllByRole('button')
    .find((b) => b.textContent.startsWith('Choice') && inSpot(b))
  if (choice === undefined) throw new Error('no choice of the overlay lies over the spot')
  await press(choice)
  await waitFor(() => expect(within(canvasElement).getByText(`Picked: ${choice.textContent}`)).toBeInTheDocument())
}

const overlayOf = async (kind: Kind) => {
  const overlay = await within(document.body).findByRole('dialog', { name: 'Actions' })
  if (kind === 'sheet') await motionDone(overlay)
  return overlay
}

const overTabBar = (kind: Kind): StoryObj<typeof meta> => ({
  render: () => <Page kind={kind} composer={false} />,
  play: async ({ canvasElement }) => {
    await expect(liftPageParts(canvasElement)).toBe(2)
    const bar = within(canvasElement).getByRole('navigation', { name: 'Main' }).getBoundingClientRect()
    await press(within(canvasElement).getByRole('button', { name: 'Open actions' }))
    await pickOver(canvasElement, await overlayOf(kind), bar)
  },
})

const overComposer = (kind: Kind): StoryObj<typeof meta> => ({
  render: () => <Page kind={kind} composer />,
  beforeEach: withFakeViewport,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const root = canvasElement.querySelector('.app-shell__root')
    if (!(root instanceof HTMLElement)) throw new Error('no shell')
    // The keyboard opens for the message and covers the screen's 300 px foot: the composer docks on it.
    await press(canvas.getByRole('textbox', { name: 'Message' }))
    fakeViewport.move(544)
    await waitFor(() => expect(root.style.getPropertyValue('--app-shell-keyboard')).toBe('300px'))
    const composer = canvasElement.querySelector('[data-composer]')
    if (composer === null) throw new Error('no composer')
    await expect(Math.round(composer.getBoundingClientRect().bottom)).toBeLessThanOrEqual(544)
    // Attach opens the overlay, which takes the focus from the message, so the shell may end the dock; one of its
    // choices lies where the lifted composer is then.
    await press(canvas.getByRole('button', { name: 'Attach a file' }))
    const overlay = await overlayOf(kind)
    // The drop zone covers the pane, so its parts are lifted only now, after the presses on the page's own controls.
    await expect(liftPageParts(canvasElement)).toBe(4)
    await pickOver(canvasElement, overlay, composer.getBoundingClientRect())
  },
})

const meta = {
  title: 'Examples/Overlays over the shell',
  parameters: { viewport: { options: phoneScreen } },
} satisfies Meta

export default meta

/** A Dialog over the phone tab bar, on a page with z-index 1 parts: a pointer picks the choice over the bar. */
export const DialogOverTabBarDark: StoryObj<typeof meta> = { ...overTabBar('dialog'), globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const DialogOverTabBarLight: StoryObj<typeof meta> = { ...overTabBar('dialog'), globals: { mode: 'light', viewport: { value: 'm390' } } }

/** A BottomSheet over the phone tab bar, on a page with z-index 1 parts: a pointer picks the choice over the bar. */
export const SheetOverTabBarDark: StoryObj<typeof meta> = { ...overTabBar('sheet'), globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const SheetOverTabBarLight: StoryObj<typeof meta> = { ...overTabBar('sheet'), globals: { mode: 'light', viewport: { value: 'm390' } } }

/** A Dialog over the composer docked on the keyboard, with z-index 1 parts: a pointer picks the choice over it. */
export const DialogOverDockedComposerDark: StoryObj<typeof meta> = { ...overComposer('dialog'), globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const DialogOverDockedComposerLight: StoryObj<typeof meta> = { ...overComposer('dialog'), globals: { mode: 'light', viewport: { value: 'm390' } } }

/** A BottomSheet over the composer docked on the keyboard, with z-index 1 parts: a pointer picks the choice over it. */
export const SheetOverDockedComposerDark: StoryObj<typeof meta> = { ...overComposer('sheet'), globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const SheetOverDockedComposerLight: StoryObj<typeof meta> = { ...overComposer('sheet'), globals: { mode: 'light', viewport: { value: 'm390' } } }
