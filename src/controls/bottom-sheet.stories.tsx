import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { BottomSheet, BottomSheetClose } from './bottom-sheet'
import { Button } from './button'
import { Stack } from './layout'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', minH: 'shell.dialog' })
// Swatches of the expected tokens, so the play functions compare resolved colours.
const scrimSwatch = css({ bg: 'overlay.scrim' })
const surfaceSwatch = css({ bg: 'surface.overlay' })
const borderSwatch = css({ bg: 'border.default' })

const sorts = ['Newest first', 'Oldest first', 'Name']

function SortSheet({ open, onOpenChange }: { open?: boolean; onOpenChange?: (open: boolean) => void }) {
  return (
    <BottomSheet
      title="Sort by"
      trigger={<Button>Sort</Button>}
      {...(open === undefined ? {} : { open })}
      {...(onOpenChange === undefined ? {} : { onOpenChange })}
    >
      <Stack gap="2">
        {sorts.map((label) => (
          <BottomSheetClose key={label}>
            <Button size="xl">{label}</Button>
          </BottomSheetClose>
        ))}
      </Stack>
    </BottomSheet>
  )
}

function OpenSheet() {
  return (
    <main className={page}>
      <SortSheet open />
      <span hidden data-swatch="scrim" className={scrimSwatch} />
      <span hidden data-swatch="surface" className={surfaceSwatch} />
      <span hidden data-swatch="border" className={borderSwatch} />
    </main>
  )
}

function swatch(name: string) {
  const el = document.querySelector(`[data-swatch="${name}"]`)
  if (el === null) throw new Error(`no ${name} swatch`)
  return getComputedStyle(el).backgroundColor
}

function grabberOf(sheet: HTMLElement) {
  const grabber = sheet.querySelector('.bottom-sheet__grabber')
  if (!(grabber instanceof HTMLElement)) throw new Error('no grabber')
  return grabber
}

const meta = {
  title: 'Overlays/Bottom sheet',
  component: OpenSheet,
  play: async () => {
    // The sheet renders in a portal, outside the story's canvas.
    const body = within(document.body)
    const sheet = await body.findByRole('dialog', { name: 'Sort by' })
    const box = sheet.getBoundingClientRect()
    // Full width, flush with the bottom of the window.
    await expect(box.width).toBe(window.innerWidth)
    await expect(Math.round(box.bottom)).toBe(window.innerHeight)
    const style = getComputedStyle(sheet)
    await expect(style.borderTopLeftRadius).toBe('16px')
    await expect(style.borderTopRightRadius).toBe('16px')
    await expect(style.borderBottomLeftRadius).toBe('0px')
    await expect(style.paddingTop).toBe('8px')
    await expect(style.paddingLeft).toBe('12px')
    await expect(style.paddingRight).toBe('12px')
    // The home-indicator area of the phone.
    await expect(style.paddingBottom).toBe('34px')
    await expect(style.boxShadow).not.toBe('none')
    await expect(style.backgroundColor).toBe(swatch('surface'))
    const title = within(sheet).getByText('Sort by')
    await expect(getComputedStyle(title).fontSize).toBe('17px')
    await expect(within(sheet).queryByRole('button', { name: 'Close' })).toBeNull()
    // The grabber (Inbox M6 346:10209): 36x5, a pill in border.default, centred 8 below the top
    // edge (inside the 1 px border), hidden from assistive technology. The title row starts 2 below it.
    const grabber = grabberOf(sheet)
    const g = grabber.getBoundingClientRect()
    await expect([g.width, g.height]).toEqual([36, 5])
    await expect(g.top - box.top).toBe(9)
    await expect(g.left + g.width / 2).toBe(box.left + box.width / 2)
    await expect(getComputedStyle(grabber).borderTopLeftRadius).toBe('999px')
    await expect(getComputedStyle(grabber).backgroundColor).toBe(swatch('border'))
    await expect(grabber).toHaveAttribute('aria-hidden', 'true')
    const header = sheet.querySelector('.bottom-sheet__header')
    if (header === null) throw new Error('no title row')
    await expect(header.getBoundingClientRect().top - g.bottom).toBe(2)
    // A scrim covers the page behind the sheet.
    const scrim = document.querySelector('.bottom-sheet__backdrop')
    if (!(scrim instanceof HTMLElement)) throw new Error('no scrim')
    await expect(scrim.getBoundingClientRect().width).toBe(window.innerWidth)
    await expect(getComputedStyle(scrim).backgroundColor).toBe(swatch('scrim'))
  },
} satisfies Meta<typeof OpenSheet>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const untitledPlay = async () => {
  const body = within(document.body)
  const sheet = await body.findByRole('dialog', { name: 'Chat actions' })
  // No title row.
  await expect(sheet.querySelector('.bottom-sheet__header')).toBeNull()
  // The grabber shows on a sheet with no title too.
  await expect(grabberOf(sheet).getBoundingClientRect().width).toBe(36)
  await expect(within(sheet).getByRole('button', { name: 'Rename' })).toBeInTheDocument()
}

/** A sheet with no visible title, such as the chat actions of Workbench M9, is named by `label`. */
export const UntitledDark: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <BottomSheet label="Chat actions" open>
        <Stack gap="2">
          <Button size="xl">Rename</Button>
          <Button size="xl" variant="dangerText">
            Close chat
          </Button>
        </Stack>
      </BottomSheet>
    </main>
  ),
  play: untitledPlay,
  globals: { mode: 'dark' },
}
export const UntitledLight: StoryObj<typeof meta> = { ...UntitledDark, globals: { mode: 'light' } }

// A sheet that opens with a label and gets its title later, as when its data arrives.
function LateTitle() {
  const [title, setTitle] = useState<string | undefined>(undefined)
  return (
    <BottomSheet {...(title === undefined ? { label: 'Chat actions' } : { title })} open>
      <Button
        onClick={() => {
          setTitle('drift check')
        }}
      >
        Load
      </Button>
    </BottomSheet>
  )
}

/** A sheet keeps an accessible name when a title replaces its label while it is open. */
export const LateTitleDark: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <LateTitle />
    </main>
  ),
  play: async () => {
    const body = within(document.body)
    const sheet = await body.findByRole('dialog', { name: 'Chat actions' })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Load' }))
    await waitFor(() => expect(within(sheet).getByText('drift check')).toBeInTheDocument())
    await expect(sheet).toHaveAccessibleName('drift check')
  },
  globals: { mode: 'dark' },
}

const onOpenChange = fn<(open: boolean) => void>()

/** A click opens the sheet with the focus inside; Escape, a click on the scrim, a row and the close button close it. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <Stack gap="12">
        <SortSheet onOpenChange={onOpenChange} />
        <BottomSheet title="Side chat" closeButton trigger={<Button>Side chat</Button>}>
          <Button>Send</Button>
        </BottomSheet>
        {/* A controlled sheet that is closed stays closed, also with defaultOpen. */}
        <BottomSheet title="Controlled" open={false} defaultOpen />
      </Stack>
    </main>
  ),
  play: async ({ canvasElement }) => {
    onOpenChange.mockClear()
    const canvas = within(canvasElement)
    const body = within(document.body)
    const trigger = canvas.getByRole('button', { name: 'Sort' })
    await expect(body.queryByRole('dialog')).toBeNull()
    // Escape closes the sheet and the focus goes back to the trigger.
    await userEvent.click(trigger)
    const sheet = await body.findByRole('dialog', { name: 'Sort by' })
    await expect(onOpenChange).toHaveBeenLastCalledWith(true)
    await waitFor(() => expect(sheet.contains(document.activeElement)).toBe(true))
    for (let i = 0; i < 4; i += 1) {
      await userEvent.tab()
      await expect(sheet.contains(document.activeElement)).toBe(true)
    }
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await expect(onOpenChange).toHaveBeenLastCalledWith(false)
    await waitFor(() => expect(trigger).toHaveFocus())
    // A click on the scrim above the sheet closes it.
    await userEvent.click(trigger)
    await body.findByRole('dialog', { name: 'Sort by' })
    const above = document.elementFromPoint(20, 10)
    if (!(above instanceof HTMLElement)) throw new Error('nothing above the sheet')
    await userEvent.click(above)
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    // A row wrapped in BottomSheetClose closes it.
    await userEvent.click(trigger)
    await userEvent.click(within(await body.findByRole('dialog', { name: 'Sort by' })).getByRole('button', { name: 'Name' }))
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    // The close button closes the side chat.
    await userEvent.click(canvas.getByRole('button', { name: 'Side chat' }))
    const chat = await body.findByRole('dialog', { name: 'Side chat' })
    // The sheet opens with the focus on its first element, the close button.
    await waitFor(() => expect(within(chat).getByRole('button', { name: 'Close' })).toHaveFocus())
    await userEvent.click(within(chat).getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Side chat' })).toHaveFocus())
    await expect(body.queryByRole('dialog', { name: 'Controlled' })).toBeNull()
  },
}
