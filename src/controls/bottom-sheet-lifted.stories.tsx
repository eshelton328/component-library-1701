import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { BottomSheet } from './bottom-sheet'
import { Button } from './button'
import { motionDone, unmounted } from './bottom-sheet.testing'

// The Workspaces M9 held row: holding a chat row (here, its Hold button) opens the chat's actions sheet, which lifts
// a copy of the row over its scrim, bright where the rest of the list is dimmed (146:252).
const phoneScreen = { m390: { name: 'Phone (390 x 844)', styles: { width: '390px', height: '844px' } } }
const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '16', minH: 'dvh' })
// The list, which the play function lifts with z-index 1 as the-bridge's list parts are (the library has no
// z-index token, and a story may set no raw value).
const list = css({ position: 'relative', bg: 'bg.canvas' })
const row = css({ textStyle: 'body', color: 'fg.default', py: '12' })
const liftedRow = css({ textStyle: 'body', color: 'fg.default', bg: 'surface.raised', borderWidth: 'default', borderStyle: 'solid', borderColor: 'border.accent', borderRadius: 'lg', px: '12' })

const chats = Array.from({ length: 8 }, (_, i) => `Chat ${String(i + 1)} needs a review`)
const heldChat = 'Chat 4 needs a review'

function HeldRow() {
  const [open, setOpen] = useState(false)
  const held = useRef<HTMLDivElement>(null)
  return (
    <main className={page}>
      <div className={list} data-list="">
        {chats.map((c) => (
          <div key={c} ref={c === heldChat ? held : undefined} className={row} data-row={c}>
            {c}
          </div>
        ))}
        <Button
          onClick={() => {
            setOpen(true)
          }}
        >
          Hold Chat 4
        </Button>
      </div>
      <BottomSheet title="Actions" open={open} onOpenChange={setOpen} lifted={{ content: <div className={liftedRow}>{heldChat}</div>, anchor: held }}>
        <Button>Rename</Button>
      </BottomSheet>
    </main>
  )
}

// A real pointer click by the test runner's browser at the centre of `el`, in viewport coordinates: it lands on
// whatever is drawn at that point.
async function press(el: Element) {
  const { userEvent } = await import('vitest/browser')
  const r = el.getBoundingClientRect()
  // Move to the point, then press and release the left button there.
  await userEvent.pointer([{ coords: { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } }, '[MouseLeft]'])
}

const heldRowPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const listPart = canvasElement.querySelector('[data-list]')
  const anchor = canvasElement.querySelector(`[data-row="${heldChat}"]`)
  if (!(listPart instanceof HTMLElement) || !(anchor instanceof HTMLElement)) throw new Error('no list')
  listPart.style.setProperty('z-index', '1')
  const at = anchor.getBoundingClientRect()
  await press(within(canvasElement).getByRole('button', { name: 'Hold Chat 4' }))
  const sheet = await within(document.body).findByRole('dialog', { name: 'Actions' })
  await motionDone(sheet)
  // The copy lies at the row's place and size, in the sheet's layer after its scrim, so it paints over the scrim
  // (it takes no pointer events, so the hit test cannot show it); the row keeps its place, hidden.
  const lifted = document.querySelector('.bottom-sheet__lifted')
  const scrim = document.querySelector('.bottom-sheet__backdrop')
  if (!(lifted instanceof HTMLElement) || !(scrim instanceof HTMLElement)) throw new Error('no lifted row or scrim')
  const box = lifted.getBoundingClientRect()
  await expect([box.left, box.top, box.width, box.height].map(Math.round)).toEqual([at.left, at.top, at.width, at.height].map(Math.round))
  await expect(scrim.compareDocumentPosition(lifted) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  await expect(scrim.parentElement).toBe(lifted.parentElement)
  await expect(getComputedStyle(lifted).pointerEvents).toBe('none')
  await expect(lifted).toHaveTextContent(heldChat)
  await expect(getComputedStyle(anchor).visibility).toBe('hidden')
  await expect(anchor.getBoundingClientRect().top).toBe(at.top)
  // A tap on the lifted row reaches the scrim and closes the sheet; the row shows again.
  await press(lifted)
  await unmounted(sheet)
  await expect(document.querySelector('.bottom-sheet__lifted')).toBeNull()
  await expect(getComputedStyle(anchor).visibility).toBe('visible')
}

const meta = {
  title: 'Overlays/Bottom sheet lifted row',
  parameters: { viewport: { options: phoneScreen } },
} satisfies Meta

export default meta

/** The held row of Workspaces M9: the actions sheet lifts a copy of the row over its scrim, at the row's place. */
export const HeldRowDark: StoryObj<typeof meta> = { render: () => <HeldRow />, play: heldRowPlay, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const HeldRowLight: StoryObj<typeof meta> = { render: () => <HeldRow />, play: heldRowPlay, globals: { mode: 'light', viewport: { value: 'm390' } } }

// The sheet opens with the page (defaultOpen) and comes before the held row in the tree, so the row's ref is not
// set yet when the sheet first measures it.
function OpenFirst() {
  const held = useRef<HTMLDivElement>(null)
  return (
    <main className={page}>
      <BottomSheet title="Actions" defaultOpen lifted={{ content: <div className={liftedRow}>{heldChat}</div>, anchor: held }}>
        <Button>Rename</Button>
      </BottomSheet>
      {chats.map((c) => (
        <div key={c} ref={c === heldChat ? held : undefined} className={row} data-row={c}>
          {c}
        </div>
      ))}
    </main>
  )
}

const openFirstPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const anchor = canvasElement.querySelector(`[data-row="${heldChat}"]`)
  const lifted = document.querySelector('.bottom-sheet__lifted')
  if (anchor === null || lifted === null) throw new Error('no row or copy')
  // The copy shows only once it lies at the row's place; the row hides.
  await waitFor(() => expect(getComputedStyle(anchor).visibility).toBe('hidden'))
  const at = anchor.getBoundingClientRect()
  const box = lifted.getBoundingClientRect()
  await expect([box.left, box.top, box.width, box.height].map(Math.round)).toEqual([at.left, at.top, at.width, at.height].map(Math.round))
  await expect(getComputedStyle(lifted).visibility).toBe('visible')
}

/** A sheet open from the start lifts a row that comes after it in the tree. */
export const OpenFirstDark: StoryObj<typeof meta> = { render: () => <OpenFirst />, play: openFirstPlay, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const OpenFirstLight: StoryObj<typeof meta> = { render: () => <OpenFirst />, play: openFirstPlay, globals: { mode: 'light', viewport: { value: 'm390' } } }

// "Open" opens the sheet with no row, so the sheet spends its tries on a ref that is never set; "Open with row"
// opens it again, and the row mounts 50 ms later, within the sheet's tries.
function LateRow() {
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState(false)
  const held = useRef<HTMLDivElement>(null)
  return (
    <main className={page}>
      <Button
        onClick={() => {
          setOpen(true)
        }}
      >
        Open
      </Button>
      <Button
        onClick={() => {
          setOpen(true)
          setTimeout(() => {
            setShown(true)
          }, 50)
        }}
      >
        Open with row
      </Button>
      <BottomSheet title="Actions" open={open} onOpenChange={setOpen} lifted={{ content: <div className={liftedRow}>{heldChat}</div>, anchor: held }}>
        <Button>Rename</Button>
      </BottomSheet>
      {shown ? (
        <div ref={held} className={row} data-row={heldChat}>
          {heldChat}
        </div>
      ) : null}
    </main>
  )
}

const frames = async (n: number) => {
  for (let i = 0; i < n; i++) await new Promise((resolve) => requestAnimationFrame(resolve))
}

const lateRowPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  await press(canvas.getByRole('button', { name: 'Open' }))
  const first = await within(document.body).findByRole('dialog', { name: 'Actions' })
  await frames(20)
  await userEvent.keyboard('{Escape}')
  await unmounted(first)
  // A later open tries again: the copy lies at the row's place, and the row hides.
  await press(canvas.getByRole('button', { name: 'Open with row' }))
  const anchor = await canvas.findByText(heldChat)
  await waitFor(() => expect(getComputedStyle(anchor).visibility).toBe('hidden'))
  const lifted = document.querySelector('.bottom-sheet__lifted')
  if (lifted === null) throw new Error('no copy')
  const at = anchor.getBoundingClientRect()
  const box = lifted.getBoundingClientRect()
  await expect([box.left, box.top, box.width, box.height].map(Math.round)).toEqual([at.left, at.top, at.width, at.height].map(Math.round))
}

/** Each open of the sheet tries again to place the copy, also after an open whose row never came. */
export const LateRowDark: StoryObj<typeof meta> = { render: () => <LateRow />, play: lateRowPlay, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const LateRowLight: StoryObj<typeof meta> = { render: () => <LateRow />, play: lateRowPlay, globals: { mode: 'light', viewport: { value: 'm390' } } }

const closePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const anchor = canvasElement.querySelector(`[data-row="${heldChat}"]`)
  if (anchor === null) throw new Error('no row')
  await press(within(canvasElement).getByRole('button', { name: 'Hold Chat 4' }))
  const sheet = await within(document.body).findByRole('dialog', { name: 'Actions' })
  await motionDone(sheet)
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(sheet).toHaveAttribute('data-state', 'closed'))
  // While the scrim fades out, the copy stays bright over it and the row stays hidden, so the row never shows
  // dimmed under the scrim.
  const scrim = document.querySelector('.bottom-sheet__backdrop')
  const lifted = document.querySelector('.bottom-sheet__lifted')
  await expect(scrim?.getAnimations().some((a) => a.playState === 'running')).toBe(true)
  if (lifted === null) throw new Error('no copy while the scrim fades')
  await expect(getComputedStyle(lifted).visibility).toBe('visible')
  await expect(getComputedStyle(lifted).opacity).toBe('1')
  await expect(getComputedStyle(anchor).visibility).toBe('hidden')
  // When the sheet has gone, so have the copy, and the row shows.
  await unmounted(sheet)
  await expect(document.querySelector('.bottom-sheet__lifted')).toBeNull()
  await expect(getComputedStyle(anchor).visibility).toBe('visible')
}

/** The copy stays over the row while the scrim fades out, and the row shows when the sheet has gone. */
export const CloseDark: StoryObj<typeof meta> = { render: () => <HeldRow />, play: closePlay, globals: { mode: 'dark', viewport: { value: 'm390' } } }
export const CloseLight: StoryObj<typeof meta> = { render: () => <HeldRow />, play: closePlay, globals: { mode: 'light', viewport: { value: 'm390' } } }
