import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { CheckIcon } from '../foundations/icons'
import { Button } from './button'
import { Stack } from './layout'
import { createToaster, Toast, Toaster } from './toast'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24' })
// The list pane of Inbox D18, with the toast 12px in from its edges (396 of 420).
const list = css({ w: 'shell.listPane', p: '12', bg: 'surface.pane', borderRadius: 'xl' })
const swatches = {
  raised: css({ bg: 'surface.raised' }),
  text: css({ bg: 'fg.default' }),
  accentText: css({ bg: 'fg.accent' }),
  done: css({ bg: 'status.done.fg' }),
  accentBorder: css({ bg: 'border.accent' }),
  discussBorder: css({ bg: 'border.discuss' }),
}

const onUndo = fn()
const onClose = fn()

function Swatches() {
  return (
    <div hidden>
      {Object.entries(swatches).map(([name, className]) => (
        <span key={name} data-swatch={name} className={className} />
      ))}
    </div>
  )
}

function StaticToasts() {
  return (
    <main className={page}>
      <div className={list}>
        <Stack gap="12">
          <Toast tone="discuss" icon={<CheckIcon size="12" />} action={{ label: 'Undo', onClick: onUndo }}>
            Created 3 tasks from a discussion
          </Toast>
          <Toast action={{ label: 'Undo', onClick: onUndo }} onClose={onClose}>
            Moved bridge themes to the-bridge
          </Toast>
          <Toast>Copied the path</Toast>
        </Stack>
      </div>
      <Swatches />
    </main>
  )
}

const meta = {
  title: 'Status/Toast',
  component: StaticToasts,
  play: async ({ canvasElement }) => {
    onUndo.mockClear()
    onClose.mockClear()
    const canvas = within(canvasElement)
    const swatch = (name: keyof typeof swatches) => {
      const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
      if (el === null) throw new Error(`no swatch ${name}`)
      return getComputedStyle(el).backgroundColor
    }
    // Each static toast is open, with no timer, and is a status live region.
    const toasts = canvas.getAllByRole('status')
    await expect(toasts).toHaveLength(3)
    const [created, moved, plain] = toasts
    if (created === undefined || moved === undefined || plain === undefined) throw new Error('no toasts')
    // Figma D18 403:2943: surface.raised, a 1px border.discuss border, radius 10, padding 10 × 12, gap 8.
    const s = getComputedStyle(created)
    await expect([s.backgroundColor, s.borderTopColor, s.borderTopWidth, s.borderTopLeftRadius]).toEqual([swatch('raised'), swatch('discussBorder'), '1px', '10px'])
    await expect([s.paddingTop, s.paddingLeft, s.columnGap]).toEqual(['10px', '12px', '8px'])
    await expect(s.boxShadow).not.toBe('none')
    // D20 417:2135: the accent tone has the cyan border.
    await expect(getComputedStyle(moved).borderTopColor).toBe(swatch('accentBorder'))
    // The text is small fg.default; Undo is fg.accent at the end; the icon is status.done.fg at 12px.
    const text = within(created).getByText('Created 3 tasks from a discussion')
    await expect([getComputedStyle(text).color, getComputedStyle(text).fontSize]).toEqual([swatch('text'), '12px'])
    const undo = within(created).getByRole('button', { name: 'Undo' })
    await expect([getComputedStyle(undo).color, getComputedStyle(undo).fontSize, getComputedStyle(undo).fontWeight]).toEqual([swatch('accentText'), '12px', '500'])
    await expect(Math.round(created.getBoundingClientRect().right - undo.getBoundingClientRect().right)).toBe(13)
    const icon = created.querySelector('.toast__icon')
    if (icon === null) throw new Error('no icon')
    await expect(getComputedStyle(icon).color).toBe(swatch('done'))
    await expect(icon.querySelector('svg')?.getBoundingClientRect().width).toBe(12)
    // Figma draws it 38px high with 16px text lines, and the small text style's line is 16px.
    await expect(Math.round(created.getBoundingClientRect().height)).toBe(38)
    // A toast with no action and no onClose has no buttons.
    await expect(within(plain).queryAllByRole('button')).toHaveLength(0)
    // The buttons run their callbacks, and take the keyboard focus.
    await userEvent.click(undo)
    await expect(onUndo).toHaveBeenCalledTimes(1)
    const close = within(moved).getByRole('button', { name: 'Dismiss' })
    close.focus()
    await userEvent.keyboard('{Enter}')
    await expect(onClose).toHaveBeenCalledTimes(1)
  },
} satisfies Meta<typeof StaticToasts>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const toaster = createToaster()
const onToasterUndo = fn()

function Live() {
  const [moves, setMoves] = useState(0)
  return (
    <main className={page}>
      <Stack gap="12">
        <Button
          onClick={() => {
            setMoves((n) => n + 1)
            toaster.show({ text: 'Moved bridge themes to the-bridge', action: { label: 'Undo', onClick: onToasterUndo }, closable: true, duration: 60000 })
          }}
        >
          Move
        </Button>
        <Button
          onClick={() => {
            toaster.show({ text: 'Copied the path', duration: 400 })
          }}
        >
          Copy
        </Button>
        <span data-testid="moves">{moves}</span>
      </Stack>
      <Toaster toaster={toaster} />
    </main>
  )
}

const statusOf = (text: string) => within(document.body).queryByText(text)?.closest('[role="status"]') ?? null

/**
 * The Toaster: a toast shows in a polite live region, its action runs and
 * closes it, the close button and Escape close it, and a toast closes by
 * itself after its duration.
 */
export const Behaviour: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => <Live />,
  play: async ({ canvasElement }) => {
    onToasterUndo.mockClear()
    toaster.dismiss()
    const canvas = within(canvasElement)
    const moved = 'Moved bridge themes to the-bridge'
    // Show one; it sits in the Notifications region, a polite live region.
    await userEvent.click(canvas.getByRole('button', { name: 'Move' }))
    await waitFor(() => expect(statusOf(moved)).not.toBeNull())
    const region = within(document.body).getByRole('region', { name: /Notifications/ })
    await expect(region).toHaveAttribute('aria-live', 'polite')
    const toast = statusOf(moved)
    if (!(toast instanceof HTMLElement)) throw new Error('no toast')
    await expect(region).toContainElement(toast)
    await expect(getComputedStyle(toast).borderTopWidth).toBe('1px')
    // Undo runs its action and closes the toast.
    await userEvent.click(within(toast).getByRole('button', { name: 'Undo' }))
    await expect(onToasterUndo).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(statusOf(moved)).toBeNull())
    // The close button closes it.
    await userEvent.click(canvas.getByRole('button', { name: 'Move' }))
    await waitFor(() => expect(statusOf(moved)).not.toBeNull())
    const again = statusOf(moved)
    if (!(again instanceof HTMLElement)) throw new Error('no toast')
    await userEvent.click(within(again).getByRole('button', { name: 'Dismiss' }))
    await waitFor(() => expect(statusOf(moved)).toBeNull())
    await expect(onToasterUndo).toHaveBeenCalledTimes(1)
    // Escape closes the focused toast.
    await userEvent.click(canvas.getByRole('button', { name: 'Move' }))
    await waitFor(() => expect(statusOf(moved)).not.toBeNull())
    const third = statusOf(moved)
    if (!(third instanceof HTMLElement)) throw new Error('no toast')
    third.focus()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(statusOf(moved)).toBeNull())
    // A toast closes by itself after its duration.
    await userEvent.click(canvas.getByRole('button', { name: 'Copy' }))
    await waitFor(() => expect(statusOf('Copied the path')).not.toBeNull())
    await waitFor(() => expect(statusOf('Copied the path')).toBeNull(), { timeout: 3000 })
  },
}

const replacing = createToaster()
const onFirstUndo = fn()

/**
 * Showing a toast with the id of an open one replaces it whole: an action
 * the new toast does not have is gone, so Undo cannot run the old callback.
 */
export const ReplaceById: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <Toaster toaster={replacing} />
    </main>
  ),
  play: async () => {
    onFirstUndo.mockClear()
    replacing.dismiss()
    replacing.show({ id: 'move', text: 'Moving bridge themes', action: { label: 'Undo', onClick: onFirstUndo }, duration: 60000 })
    await waitFor(() => expect(statusOf('Moving bridge themes')).not.toBeNull())
    replacing.show({ id: 'move', text: 'Moved bridge themes to the-bridge', duration: 60000 })
    await waitFor(() => expect(statusOf('Moved bridge themes to the-bridge')).not.toBeNull())
    const toast = statusOf('Moved bridge themes to the-bridge')
    if (!(toast instanceof HTMLElement)) throw new Error('no toast')
    await expect(within(toast).queryByRole('button', { name: 'Undo' })).toBeNull()
    await expect(onFirstUndo).not.toHaveBeenCalled()
    replacing.dismiss()
  },
}

// Offsets that leave a 300px strip in the middle of any window, as a phone window narrower than the list pane would.
const narrowToaster = createToaster({ placement: 'bottom', offsets: 'calc(50vw - 150px)' })
const longToast = 'Moved bridge themes and its subtask chat to the-bridge workspace, under THE-BRIDGE'

/**
 * In a window narrower than the list pane, the toasts fit between the
 * offsets: a long toast wraps, and its close button stays in the window.
 */
export const NarrowWindow: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <Toaster toaster={narrowToaster} />
    </main>
  ),
  play: async () => {
    narrowToaster.dismiss()
    narrowToaster.show({ text: longToast, action: { label: 'Undo', onClick: () => undefined }, closable: true, duration: 60000 })
    await waitFor(() => expect(statusOf(longToast)).not.toBeNull())
    const toast = statusOf(longToast)
    if (!(toast instanceof HTMLElement)) throw new Error('no toast')
    const strip = { left: window.innerWidth / 2 - 150, right: window.innerWidth / 2 + 150 }
    await waitFor(() => expect(Math.round(toast.getBoundingClientRect().width)).toBeLessThanOrEqual(300))
    const box = toast.getBoundingClientRect()
    await expect(Math.round(box.left)).toBeGreaterThanOrEqual(Math.floor(strip.left))
    await expect(Math.round(box.right)).toBeLessThanOrEqual(Math.ceil(strip.right))
    const close = within(toast).getByRole('button', { name: 'Dismiss' }).getBoundingClientRect()
    await expect(close.right).toBeLessThanOrEqual(box.right)
    await expect(close.width).toBe(16)
    narrowToaster.dismiss()
  },
}
