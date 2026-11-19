import type { Meta, StoryObj } from '@storybook/react-vite'
import { StrictMode, useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { BottomSheet, BottomSheetClose } from './bottom-sheet'
import { Button } from './button'
import { Dialog } from './dialog'
import { Menu } from './menu'
import { Popover } from './popover'
import { Stack } from './layout'
import { OptionList } from './option-list'
import { motionDone } from './bottom-sheet.testing'
import { expectScrollAreas } from './scroll-area.testing'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', minH: 'shell.dialog' })
// Swatches of the expected tokens, so the play functions compare resolved colours.
const scrimSwatch = css({ bg: 'overlay.scrim' })
const surfaceSwatch = css({ bg: 'surface.overlay' })
const borderSwatch = css({ bg: 'border.default' })
const focusSwatch = css({ bg: 'border.focus' })

const sorts = [
  { value: 'newest', label: 'Newest first', description: 'Most recently found at the top' },
  { value: 'oldest', label: 'Oldest first', description: 'Earliest found at the top' },
  { value: 'name', label: 'Name', description: 'A to Z' },
]

// The Artifacts M4 sort sheet (407:814): an OptionList whose pick closes the sheet.
function SortSheet({ open, onOpenChange }: { open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [shown, setShown] = useState(false)
  const [sort, setSort] = useState('newest')
  const change = (next: boolean) => {
    setShown(next)
    onOpenChange?.(next)
  }
  return (
    <BottomSheet title="Sort by" trigger={<Button>Sort</Button>} open={open ?? shown} onOpenChange={change}>
      <OptionList
        label="Sort by"
        items={sorts}
        value={sort}
        onValueChange={setSort}
        onItemSelect={() => {
          change(false)
        }}
      />
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
    await motionDone(sheet)
    // The sheet scrolls with no scroll bar and keeps a scroll at its end from moving the page.
    await expectScrollAreas(document.body, 'both', '.bottom-sheet__content')
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

/** The Workbench M9 chat actions sheet (146:273): `size="sm"` gives it a 15 px SemiBold title. */
export const SmallDark: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <BottomSheet size="sm" title="drift check" open>
        <Stack gap="2">
          <Button size="xl">Rename</Button>
        </Stack>
      </BottomSheet>
    </main>
  ),
  play: async () => {
    const sheet = await within(document.body).findByRole('dialog', { name: 'drift check' })
    const title = getComputedStyle(within(sheet).getByText('drift check'))
    // paneTitle: SemiBold 15/20 (146:276).
    await expect([title.fontSize, title.fontWeight]).toEqual(['15px', '600'])
    await expect(parseFloat(title.lineHeight)).toBeCloseTo(20, 0)
  },
  globals: { mode: 'dark' },
}
export const SmallLight: StoryObj<typeof meta> = { ...SmallDark, globals: { mode: 'light' } }

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

/** A click opens the sheet with the focus inside; Escape, a click on the scrim, a pick in the sort list, a `BottomSheetClose` row and the close button close it. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <Stack gap="12">
        <SortSheet onOpenChange={onOpenChange} />
        <BottomSheet title="Snooze" trigger={<Button>Snooze</Button>}>
          <Stack gap="2">
            <BottomSheetClose>
              <Button size="xl">Tomorrow</Button>
            </BottomSheetClose>
          </Stack>
        </BottomSheet>
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
    // A pick in the sort list closes it, and the focus goes back to the trigger.
    await userEvent.click(trigger)
    const sorted = await body.findByRole('dialog', { name: 'Sort by' })
    await userEvent.click(within(sorted).getByText('Name'))
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await expect(onOpenChange).toHaveBeenLastCalledWith(false)
    await waitFor(() => expect(trigger).toHaveFocus())
    // The pick stays chosen, and an arrow key moves the choice without closing the sheet.
    await userEvent.click(trigger)
    const reopened = await body.findByRole('dialog', { name: 'Sort by' })
    await expect(within(reopened).getByRole('radio', { name: 'Name' })).toBeChecked()
    within(reopened).getByRole('radio', { name: 'Name' }).focus()
    await userEvent.keyboard('{ArrowUp}')
    await expect(within(reopened).getByRole('radio', { name: 'Oldest first' })).toBeChecked()
    await expect(body.getByRole('dialog', { name: 'Sort by' })).toBeInTheDocument()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    // A row wrapped in BottomSheetClose closes its sheet.
    await userEvent.click(canvas.getByRole('button', { name: 'Snooze' }))
    await userEvent.click(within(await body.findByRole('dialog', { name: 'Snooze' })).getByRole('button', { name: 'Tomorrow' }))
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    // The close button closes the side chat.
    await userEvent.click(canvas.getByRole('button', { name: 'Side chat' }))
    const chat = await body.findByRole('dialog', { name: 'Side chat' })
    // The sheet opens with the focus on its first element, the close button.
    await waitFor(() => expect(within(chat).getByRole('button', { name: 'Close' })).toHaveFocus())
    // The close icon is the icon set's CloseIcon (24 grid) at 18 px, in the button's colour.
    const closeButton = within(chat).getByRole('button', { name: 'Close' })
    const x = closeButton.querySelector('svg')
    if (x === null) throw new Error('no close icon')
    await expect(x.getAttribute('viewBox')).toBe('0 0 24 24')
    await expect([x.getBoundingClientRect().width, x.getBoundingClientRect().height]).toEqual([16, 16])
    await expect(getComputedStyle(x).stroke).toBe(getComputedStyle(closeButton).color)
    await userEvent.click(within(chat).getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Side chat' })).toHaveFocus())
    await expect(body.queryByRole('dialog', { name: 'Controlled' })).toBeNull()
  },
}

const onDone = fn<(open: boolean) => void>()

// Inbox T8 (346:7175): Done at the end of the title row. Artifacts M7 (408:706): Cancel at the start, Add at the end.
function ActionSheets({ which }: { which: 'done' | 'add' }) {
  const [open, setOpen] = useState(true)
  const change = (next: boolean) => {
    setOpen(next)
    onDone(next)
  }
  return (
    <main className={page}>
      <Button onClick={() => { change(true) }}>Open</Button>
      {which === 'done' ? (
        <BottomSheet
          title="Suggested prompt"
          open={open}
          onOpenChange={change}
          actions={
            <BottomSheetClose>
              <Button size="sm">Done</Button>
            </BottomSheetClose>
          }
        >
          <p>Read f-005-the-bridge/increment-1.md and write one Linear ticket per screen.</p>
        </BottomSheet>
      ) : (
        <BottomSheet
          title="Add a link"
          open={open}
          onOpenChange={change}
          leading={
            <BottomSheetClose>
              <Button size="sm">Cancel</Button>
            </BottomSheetClose>
          }
          actions={<Button size="sm" variant="primary">Add</Button>}
        >
          <p>For an artifact the library did not find</p>
        </BottomSheet>
      )}
    </main>
  )
}

function centreY(el: Element) {
  const box = el.getBoundingClientRect()
  return box.top + box.height / 2
}

const donePlay: StoryObj<typeof meta>['play'] = async () => {
  const body = within(document.body)
  const sheet = await body.findByRole('dialog', { name: 'Suggested prompt' })
  const title = within(sheet).getByRole('heading', { name: 'Suggested prompt' })
  const done = within(sheet).getByRole('button', { name: 'Done' })
  const header = title.parentElement
  if (header === null) throw new Error('no header')
  // Done ends the row, 4 in from the header edge (346:7178 ends at 710 of 710 inside px 4), centred on the title.
  await expect(Math.round(header.getBoundingClientRect().right - done.getBoundingClientRect().right)).toBe(4)
  await expect(Math.abs(centreY(done) - centreY(title))).toBeLessThan(1)
  // The title takes the rest of the row, 8 before the actions, and stays at the start.
  await expect(Math.round(done.getBoundingClientRect().left - title.getBoundingClientRect().right)).toBe(8)
  await expect(getComputedStyle(title).textAlign).toBe('start')
}

/** A sheet with Done at the end of its title row (Inbox T8, M7; Artifacts M6). */
export const HeaderActionsDark: StoryObj<typeof meta> = { render: () => <ActionSheets which="done" />, play: donePlay, globals: { mode: 'dark' } }
export const HeaderActionsLight: StoryObj<typeof meta> = { render: () => <ActionSheets which="done" />, play: donePlay, globals: { mode: 'light' } }

const addPlay: StoryObj<typeof meta>['play'] = async () => {
  const body = within(document.body)
  const sheet = await body.findByRole('dialog', { name: 'Add a link' })
  const title = within(sheet).getByRole('heading', { name: 'Add a link' })
  const cancel = within(sheet).getByRole('button', { name: 'Cancel' })
  const add = within(sheet).getByRole('button', { name: 'Add' })
  // Cancel starts the row, Add ends it, and the title is centred between them (408:706).
  await expect(cancel.getBoundingClientRect().right).toBeLessThan(title.getBoundingClientRect().left)
  await expect(add.getBoundingClientRect().left).toBeGreaterThan(title.getBoundingClientRect().right)
  await expect(getComputedStyle(title).textAlign).toBe('center')
  await expect(Math.abs(centreY(cancel) - centreY(title))).toBeLessThan(1)
  await expect(Math.abs(centreY(add) - centreY(title))).toBeLessThan(1)
}

/** A sheet with Cancel at the start and Add at the end of its title row (Artifacts M7). */
export const HeaderLeadingDark: StoryObj<typeof meta> = { render: () => <ActionSheets which="add" />, play: addPlay, globals: { mode: 'dark' } }
export const HeaderLeadingLight: StoryObj<typeof meta> = { render: () => <ActionSheets which="add" />, play: addPlay, globals: { mode: 'light' } }

/** Tab reaches the header buttons in order; Done and Cancel close the sheet; the focus stays inside it. */
export const HeaderActionsBehaviour: StoryObj<typeof meta> = {
  render: () => <ActionSheets which="add" />,
  play: async ({ canvasElement }) => {
    onDone.mockClear()
    const body = within(document.body)
    const sheet = await body.findByRole('dialog', { name: 'Add a link' })
    const cancel = within(sheet).getByRole('button', { name: 'Cancel' })
    const add = within(sheet).getByRole('button', { name: 'Add' })
    await waitFor(() => expect(cancel).toHaveFocus())
    await userEvent.tab()
    await expect(add).toHaveFocus()
    // The focus wraps inside the sheet.
    await userEvent.tab()
    await expect(cancel).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(onDone).toHaveBeenLastCalledWith(false)
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open' }))
    await body.findByRole('dialog', { name: 'Add a link' })
  },
}

// Swipe to close (screen review R13): a sheet with more rows than the window holds, so its content scrolls.
const snoozeRows = Array.from({ length: 30 }, (_, i) => `In ${String(i + 1)} hours`)
const onSwipe = fn<(open: boolean) => void>()

function SwipeSheet() {
  const [open, setOpen] = useState(false)
  const change = (next: boolean) => {
    setOpen(next)
    onSwipe(next)
  }
  return (
    <main className={page}>
      <BottomSheet title="Snooze" trigger={<Button>Snooze</Button>} open={open} onOpenChange={change}>
        <Stack gap="2">
          {snoozeRows.map((row) => (
            <BottomSheetClose key={row}>
              <Button size="xl">{row}</Button>
            </BottomSheetClose>
          ))}
        </Stack>
      </BottomSheet>
      <span hidden data-swatch="focus" className={focusSwatch} />
    </main>
  )
}

// A sheet whose owner opens it again 150 ms after a swipe closes it, while the close motion still runs.
function ReopenSheet() {
  const [open, setOpen] = useState(false)
  const [bounced, setBounced] = useState(false)
  const change = (next: boolean) => {
    setOpen(next)
    if (!next && !bounced) {
      setBounced(true)
      setTimeout(() => {
        setOpen(true)
      }, 150)
    }
  }
  return (
    <main className={page}>
      <BottomSheet title="Snooze" trigger={<Button>Snooze</Button>} open={open} onOpenChange={change}>
        <Stack gap="2">
          {snoozeRows.map((row) => (
            <Button key={row} size="xl">{row}</Button>
          ))}
        </Stack>
      </BottomSheet>
    </main>
  )
}

// A synthetic touch pointer, as a finger on a phone sends it. Returns false when a handler prevented its default.
function touch(type: 'pointerdown' | 'pointermove' | 'pointerup', target: Element, y: number) {
  const box = target.getBoundingClientRect()
  return target.dispatchEvent(
    new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: 7, pointerType: 'touch', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: box.left + box.width / 2, clientY: y }),
  )
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// A slow drag: steps of 20 px, 40 ms apart, then a rest, so the release is not a flick.
async function slowDrag(target: Element, from: number, by: number, sheet: HTMLElement, top: number) {
  touch('pointerdown', target, from)
  for (let dy = 20; dy <= by; dy += 20) {
    touch('pointermove', target, from + dy)
    await pause(40)
  }
  touch('pointermove', target, from + by)
  // The sheet follows the finger.
  await expect(Math.round(sheet.getBoundingClientRect().top - top)).toBe(by)
  await pause(flickRest)
  touch('pointerup', target, from + by)
}
// Longer than the window that sets the release speed (100 ms).
const flickRest = 160

function middleY(el: Element) {
  const box = el.getBoundingClientRect()
  return box.top + box.height / 2
}

const swipePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  onSwipe.mockClear()
  const body = within(document.body)
  const trigger = within(canvasElement).getByRole('button', { name: 'Snooze' })
  const open = async () => {
    await userEvent.click(trigger)
    const sheet = await body.findByRole('dialog', { name: 'Snooze' })
    await motionDone(sheet)
    return { sheet, top: sheet.getBoundingClientRect().top }
  }
  const closed = () => waitFor(() => expect(body.queryByRole('dialog')).toBeNull())

  let { sheet, top } = await open()
  const grabber = grabberOf(sheet)
  const header = sheet.querySelector('.bottom-sheet__header')
  if (header === null) throw new Error('no title row')
  // The grabber and the title row take the touch drag; the content keeps its scroll to itself.
  await expect(getComputedStyle(grabber).touchAction).toBe('none')
  await expect(getComputedStyle(header).touchAction).toBe('none')
  await expect(getComputedStyle(sheet).overscrollBehaviorY).toBe('contain')
  // At rest the sheet has no translate.
  await expect(getComputedStyle(sheet).translate).toBe('none')

  // A short slow drag of the grabber springs back: 60 px is less than 30% of the sheet.
  await expect(60).toBeLessThan(sheet.getBoundingClientRect().height * 0.3)
  await slowDrag(grabber, middleY(grabber), 60, sheet, top)
  await expect(body.getByRole('dialog', { name: 'Snooze' })).toBe(sheet)
  await expect(sheet.getBoundingClientRect().top).toBe(top)
  await expect(sheet).not.toHaveAttribute('data-dragging')
  await expect(onSwipe).not.toHaveBeenCalledWith(false)

  // A long slow drag of the title row, past 30% of the sheet, closes it through onOpenChange.
  const far = Math.ceil(sheet.getBoundingClientRect().height * 0.3 / 20) * 20 + 20
  await slowDrag(header, middleY(header), far, sheet, top)
  await closed()
  await expect(onSwipe).toHaveBeenLastCalledWith(false)

  // A fast flick of 60 px closes it too.
  sheet = (await open()).sheet
  const flickFrom = middleY(grabberOf(sheet))
  touch('pointerdown', grabberOf(sheet), flickFrom)
  touch('pointermove', grabberOf(sheet), flickFrom + 20)
  touch('pointermove', grabberOf(sheet), flickFrom + 60)
  touch('pointerup', grabberOf(sheet), flickFrom + 60)
  await closed()
  await expect(onSwipe).toHaveBeenLastCalledWith(false)

  // In content that is scrolled down, a drag scrolls the content: the sheet stays and the moves keep their default.
  ;({ sheet, top } = await open())
  await expect(sheet.scrollHeight).toBeGreaterThan(sheet.clientHeight)
  sheet.scrollTop = 120
  await waitFor(() => expect(sheet.scrollTop).toBe(120))
  const row = within(sheet).getByRole('button', { name: 'In 8 hours' })
  const rowY = middleY(row)
  touch('pointerdown', row, rowY)
  for (let dy = 20; dy <= 100; dy += 20) {
    await expect(touch('pointermove', row, rowY + dy)).toBe(true)
  }
  await expect(sheet.getBoundingClientRect().top).toBe(top)
  await expect(sheet).not.toHaveAttribute('data-dragging')
  touch('pointerup', row, rowY + 100)
  await expect(body.getByRole('dialog', { name: 'Snooze' })).toBe(sheet)

  // Scrolled back to the top, the same drag on a row moves the sheet, and the release does not pick the row.
  sheet.scrollTop = 0
  await waitFor(() => expect(sheet.scrollTop).toBe(0))
  const first = within(sheet).getByRole('button', { name: 'In 1 hours' })
  await slowDrag(first, middleY(first), 60, sheet, top)
  await expect(body.getByRole('dialog', { name: 'Snooze' })).toBe(sheet)
  await expect(sheet.getBoundingClientRect().top).toBe(top)
  await userEvent.keyboard('{Escape}')
  await closed()
}

// A sheet with a text field: a downward drag in the field selects text and leaves the sheet in place.
function NoteSheet() {
  const [open, setOpen] = useState(false)
  return (
    <main className={page}>
      <BottomSheet title="Note" trigger={<Button>Note</Button>} open={open} onOpenChange={setOpen}>
        <textarea aria-label="Note" rows={4} defaultValue={'One\nTwo\nThree\nFour'} />
      </BottomSheet>
    </main>
  )
}

const noteDragPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const body = within(document.body)
  await userEvent.click(within(canvasElement).getByRole('button', { name: 'Note' }))
  const sheet = await body.findByRole('dialog', { name: 'Note' })
  const top = sheet.getBoundingClientRect().top
  const field = within(sheet).getByRole('textbox', { name: 'Note' })
  const from = field.getBoundingClientRect().top + 4
  touch('pointerdown', field, from)
  for (let dy = 20; dy <= 200; dy += 20) touch('pointermove', field, from + dy)
  await expect(sheet).not.toHaveAttribute('data-dragging')
  await expect(sheet.getBoundingClientRect().top).toBe(top)
  touch('pointerup', field, from + 200)
  await pause(50)
  await expect(body.getByRole('dialog', { name: 'Note' })).toBe(sheet)
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
}

/** A drag in a text field of the sheet selects text; the sheet stays open and in place. */
export const SwipeInTextField: StoryObj<typeof meta> = { render: () => <NoteSheet />, play: noteDragPlay }

// A sheet of prompt text, as the-bridge shows a prompt on a tablet or a phone (the-bridge #126 review).
const promptLines = ['Summarise the open pull requests of the library.', 'Then list each failing check with a link to its run.']
const onPrompt = fn<(open: boolean) => void>()

function PromptSheet() {
  const [open, setOpen] = useState(false)
  const change = (next: boolean) => {
    setOpen(next)
    onPrompt(next)
  }
  return (
    <main className={page}>
      <BottomSheet title="Prompt" trigger={<Button>Prompt</Button>} open={open} onOpenChange={change}>
        {promptLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </BottomSheet>
    </main>
  )
}

const promptDragPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  onPrompt.mockClear()
  // A real mouse, through the test runner's Playwright session: only a real press and move select text.
  const { userEvent: mouse } = await import('vitest/browser')
  const body = within(document.body)
  const trigger = within(canvasElement).getByRole('button', { name: 'Prompt' })
  const open = async () => {
    await userEvent.click(trigger)
    const sheet = await body.findByRole('dialog', { name: 'Prompt' })
    await motionDone(sheet)
    return { sheet, top: sheet.getBoundingClientRect().top }
  }
  // From a point in `from` to the foot of the sheet: further down than 30% of the sheet's height.
  const dragDown = async (from: Element, sheet: HTMLElement, at: { x: number; y: number }) => {
    const box = sheet.getBoundingClientRect()
    await expect(box.bottom - 4 - (from.getBoundingClientRect().top + at.y)).toBeGreaterThan(box.height * 0.3)
    await mouse.dragAndDrop(from, sheet, { sourcePosition: at, targetPosition: { x: box.width / 2, y: box.height - 4 }, steps: 10 })
  }

  let { sheet, top } = await open()
  const text = within(sheet).getByText(promptLines[0] ?? '')
  document.getSelection()?.removeAllRanges()
  // A mouse drag down from the prompt text selects the text; the sheet stays open and in place.
  await dragDown(text, sheet, { x: 2, y: 4 })
  await expect(document.getSelection()?.toString() ?? '').toContain('Summarise the open pull requests')
  await expect(body.queryByRole('dialog', { name: 'Prompt' })).toBe(sheet)
  await expect(sheet.getBoundingClientRect().top).toBe(top)
  await expect(sheet).not.toHaveAttribute('data-dragging')
  await expect(onPrompt).not.toHaveBeenCalledWith(false)

  // A mouse drag of the title row selects too: with a mouse, only the grabber moves the sheet.
  const header = sheet.querySelector('.bottom-sheet__header')
  if (header === null) throw new Error('no title row')
  document.getSelection()?.removeAllRanges()
  await dragDown(header, sheet, { x: 8, y: header.getBoundingClientRect().height / 2 })
  await expect(body.queryByRole('dialog', { name: 'Prompt' })).toBe(sheet)
  await expect(sheet.getBoundingClientRect().top).toBe(top)
  await expect(onPrompt).not.toHaveBeenCalledWith(false)

  // A mouse drag down from the grabber closes the sheet.
  const grabber = grabberOf(sheet)
  await dragDown(grabber, sheet, { x: grabber.getBoundingClientRect().width / 2, y: 2 })
  await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
  await expect(onPrompt).toHaveBeenLastCalledWith(false)

  // A touch drag from the title row still closes it, as a finger on a phone does.
  ;({ sheet, top } = await open())
  const row = sheet.querySelector('.bottom-sheet__header')
  if (row === null) throw new Error('no title row')
  const far = Math.ceil((sheet.getBoundingClientRect().height * 0.3) / 20) * 20 + 20
  await slowDrag(row, middleY(row), far, sheet, top)
  await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
  await expect(onPrompt).toHaveBeenLastCalledWith(false)
}

/**
 * With a mouse, a drag down from the sheet's text selects the text and leaves the sheet in place; only a drag of the
 * grabber moves it. A touch drag from the title row still closes it.
 */
export const MouseDragDark: StoryObj<typeof meta> = {
  // Only the story test runner has the Playwright session that moves a real mouse, so the Storybook UI leaves this
  // story out; the test runner still runs it.
  tags: ['!dev'],
  render: () => <PromptSheet />,
  play: promptDragPlay,
  globals: { mode: 'dark' },
}
export const MouseDragLight: StoryObj<typeof meta> = { ...MouseDragDark, globals: { mode: 'light' } }

/** Swipe down to close: a short drag springs back, a long drag or a flick closes, a drag in scrolled content scrolls it. */
export const SwipeDark: StoryObj<typeof meta> = { render: () => <SwipeSheet />, play: swipePlay, globals: { mode: 'dark' } }
export const SwipeLight: StoryObj<typeof meta> = { render: () => <SwipeSheet />, play: swipePlay, globals: { mode: 'light' } }

// The trigger's focus ring: none after a pointer, the library's ring (border.focus, strong) after the keyboard.
async function expectRing(trigger: HTMLElement, shown: boolean) {
  await waitFor(() => expect(trigger).toHaveFocus())
  const style = getComputedStyle(trigger)
  if (shown) {
    await expect(trigger).not.toHaveAttribute('data-focus-quiet')
    await expect(style.outlineStyle).toBe('solid')
    await expect(style.outlineWidth).not.toBe('0px')
    await expect(style.outlineColor).toBe(swatch('focus'))
  } else {
    await expect(trigger).toHaveAttribute('data-focus-quiet')
    // Panda writes `outline: 'none'` as a transparent outline, so forced colours still show one.
    await expect(style.outlineColor).toBe('rgba(0, 0, 0, 0)')
  }
}

const focusReturnPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const body = within(document.body)
  const trigger = within(canvasElement).getByRole('button', { name: 'Snooze' })
  const closed = () => waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
  // Ark listens for a click outside and Escape only once the focus is inside the sheet.
  const opened = async () => {
    const sheet = await body.findByRole('dialog', { name: 'Snooze' })
    await waitFor(() => expect(sheet.contains(document.activeElement)).toBe(true))
    return sheet
  }

  // Opened by a click and closed by a click on the scrim: the trigger has the focus and no ring.
  await userEvent.click(trigger)
  await opened()
  const above = document.elementFromPoint(20, 10)
  if (!(above instanceof HTMLElement)) throw new Error('nothing above the sheet')
  await userEvent.click(above)
  await closed()
  await expectRing(trigger, false)

  // Closed by a row (BottomSheetClose) under a tap: no ring.
  await userEvent.click(trigger)
  await userEvent.click(within(await opened()).getByRole('button', { name: 'In 1 hours' }))
  await closed()
  await expectRing(trigger, false)

  // Closed by a swipe: no ring.
  await userEvent.click(trigger)
  const sheet = await opened()
  const grabber = grabberOf(sheet)
  const from = middleY(grabber)
  touch('pointerdown', grabber, from)
  touch('pointermove', grabber, from + 20)
  touch('pointermove', grabber, from + 80)
  touch('pointerup', grabber, from + 80)
  await closed()
  await expectRing(trigger, false)

  // By the keyboard: Tab away and back, Enter opens, Escape closes, and the trigger shows the ring.
  await userEvent.tab()
  await userEvent.tab({ shift: true })
  await expectRing(trigger, true)
  await userEvent.keyboard('{Enter}')
  await opened()
  await userEvent.keyboard('{Escape}')
  await closed()
  await expectRing(trigger, true)

  // Opened by the keyboard and closed by a tap on a row: the tap wins, no ring.
  await userEvent.keyboard('{Enter}')
  await userEvent.click(within(await opened()).getByRole('button', { name: 'In 2 hours' }))
  await closed()
  await expectRing(trigger, false)

  // A key on the trigger that keeps the focus there shows the ring again.
  await userEvent.keyboard('{ArrowDown}')
  await expectRing(trigger, true)
}

/** The focus goes back to the trigger with no ring after a click, a tap or a swipe closes the sheet, and with the ring after the keyboard does. */
export const FocusReturnDark: StoryObj<typeof meta> = { render: () => <SwipeSheet />, play: focusReturnPlay, globals: { mode: 'dark' } }
export const FocusReturnLight: StoryObj<typeof meta> = { render: () => <SwipeSheet />, play: focusReturnPlay, globals: { mode: 'light' } }

// The focus return of the other overlays: the same tracker marks the trigger quiet after a pointer close.
function Overlays() {
  return (
    <main className={page}>
      <Stack gap="12">
        <Dialog title="Rename chat" trigger={<Button>Rename</Button>}>
          <p>drift check</p>
        </Dialog>
        <Menu trigger={<Button>Chat actions</Button>} items={[{ value: 'pin', label: 'Pin to sidebar' }]} />
        <Popover trigger={<Button>Filters</Button>} label="Filters">
          <p>No filters</p>
        </Popover>
      </Stack>
      <span hidden data-swatch="focus" className={focusSwatch} />
    </main>
  )
}

const overlayFocusPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const body = within(document.body)
  const inside = async (role: 'dialog' | 'menu', name: string) => {
    const box = await body.findByRole(role, { name })
    await waitFor(() => expect(box.contains(document.activeElement)).toBe(true))
    return box
  }
  const gone = (role: 'dialog' | 'menu', name: string) => waitFor(() => expect(body.queryByRole(role, { name })).toBeNull())

  // Dialog: a click on the scrim, then Escape after the keyboard opened it.
  const rename = canvas.getByRole('button', { name: 'Rename' })
  await userEvent.click(rename)
  await inside('dialog', 'Rename chat')
  const corner = document.elementFromPoint(2, 2)
  if (!(corner instanceof HTMLElement)) throw new Error('no scrim')
  await userEvent.click(corner)
  await gone('dialog', 'Rename chat')
  await expectRing(rename, false)
  await userEvent.keyboard('{Enter}')
  await inside('dialog', 'Rename chat')
  await userEvent.keyboard('{Escape}')
  await gone('dialog', 'Rename chat')
  await expectRing(rename, true)

  // Menu: a click on an action, then Escape after the keyboard opened it.
  const actions = canvas.getByRole('button', { name: 'Chat actions' })
  await userEvent.click(actions)
  const menu = await inside('menu', 'Chat actions')
  await userEvent.click(within(menu).getByRole('menuitem', { name: 'Pin to sidebar' }))
  await gone('menu', 'Chat actions')
  await expectRing(actions, false)
  await userEvent.keyboard('{Enter}')
  await inside('menu', 'Chat actions')
  await userEvent.keyboard('{Escape}')
  await gone('menu', 'Chat actions')
  await expectRing(actions, true)

  // Popover: a click on its trigger closes it, then Escape after the keyboard opened it.
  const filters = canvas.getByRole('button', { name: 'Filters' })
  await userEvent.click(filters)
  await inside('dialog', 'Filters')
  await userEvent.click(filters)
  await gone('dialog', 'Filters')
  await expectRing(filters, false)
  await userEvent.keyboard('{Enter}')
  await inside('dialog', 'Filters')
  await userEvent.keyboard('{Escape}')
  await gone('dialog', 'Filters')
  await expectRing(filters, true)
}

/** A dialog, a menu and a popover give the focus back to their trigger with no ring after a pointer, and with the ring after the keyboard. */
export const OverlayFocusReturnDark: StoryObj<typeof meta> = { render: () => <Overlays />, play: overlayFocusPlay, globals: { mode: 'dark' } }
export const OverlayFocusReturnLight: StoryObj<typeof meta> = { render: () => <Overlays />, play: overlayFocusPlay, globals: { mode: 'light' } }

// The open and close motion (screen review R13): the sheet slides up as its scrim fades in, and the close
// reverses both, with the motion tokens. Chromium's media emulation, through the test runner's DevTools session,
// makes the CSS `(prefers-reduced-motion: reduce)` true for the reduced-motion story.
const emulateReducedMotion = async (reduce: boolean) => {
  const { cdp } = await import('vitest/browser')
  await cdp().send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : '' }] })
}
const sheetCurve = 'cubic-bezier(0.38, 0.7, 0.125, 1)'

function scrimOf() {
  const scrim = document.querySelector('.bottom-sheet__backdrop')
  if (!(scrim instanceof HTMLElement)) throw new Error('no scrim')
  return scrim
}

// The animation each part runs, as the computed style gives it.
function motionOf(el: HTMLElement) {
  const s = getComputedStyle(el)
  return { name: s.animationName, duration: s.animationDuration, curve: s.animationTimingFunction }
}

const motionPlay = (reduced: boolean): NonNullable<StoryObj<typeof meta>['play']> => async ({ canvasElement }) => {
  await expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(reduced)
  const body = within(document.body)
  const trigger = within(canvasElement).getByRole('button', { name: 'Snooze' })
  await userEvent.click(trigger)
  const sheet = await body.findByRole('dialog', { name: 'Snooze' })
  // Open: 300 ms on the sheet curve. The sheet slides up, or only fades with reduced motion; the scrim fades in.
  await expect(motionOf(sheet)).toEqual({ name: reduced ? 'fadeIn' : 'sheetIn', duration: '0.3s', curve: sheetCurve })
  await expect(motionOf(scrimOf())).toEqual({ name: 'fadeIn', duration: '0.3s', curve: sheetCurve })
  await motionDone(sheet)
  const rest = sheet.getBoundingClientRect().top
  await expect(Math.round(sheet.getBoundingClientRect().bottom)).toBe(window.innerHeight)

  // Close: the motion reverses in 250 ms, and the sheet unmounts only when it ends.
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(sheet).toHaveAttribute('data-state', 'closed'))
  await expect(sheet.isConnected).toBe(true)
  await expect(motionOf(sheet)).toEqual({ name: reduced ? 'fadeOut' : 'sheetOut', duration: '0.25s', curve: sheetCurve })
  await expect(motionOf(scrimOf())).toEqual({ name: 'fadeOut', duration: '0.25s', curve: sheetCurve })
  // The slide moves the sheet down from where it rests; the fade leaves it in place.
  await waitFor(() => expect(sheet.getAnimations()[0]?.currentTime ?? 0).toBeGreaterThan(50))
  const top = sheet.getBoundingClientRect().top
  if (reduced) await expect(top).toBe(rest)
  else await expect(top).toBeGreaterThan(rest)
  await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
}

/** The sheet slides up as its scrim fades in (durations.sheetOpen), and slides down as the scrim fades out (durations.sheetClose), on easings.sheet. */
export const MotionDark: StoryObj<typeof meta> = { render: () => <SwipeSheet />, play: motionPlay(false), globals: { mode: 'dark' } }
export const MotionLight: StoryObj<typeof meta> = { render: () => <SwipeSheet />, play: motionPlay(false), globals: { mode: 'light' } }

/** With prefers-reduced-motion the sheet only fades in and out, with the same durations; the scrim fades as before. */
export const ReducedMotionDark: StoryObj<typeof meta> = {
  // Only the story test runner has the DevTools session that emulates the media, so the Storybook UI leaves this
  // story out; the test runner still runs it.
  tags: ['!dev'],
  render: () => <SwipeSheet />,
  globals: { mode: 'dark' },
  beforeEach: async () => {
    await emulateReducedMotion(true)
    return async () => {
      await emulateReducedMotion(false)
    }
  },
  play: motionPlay(true),
}

// A swipe that closes the sheet slides it down from where the finger let it go, not from its rest.
const swipeClosePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const body = within(document.body)
  await userEvent.click(within(canvasElement).getByRole('button', { name: 'Snooze' }))
  const sheet = await body.findByRole('dialog', { name: 'Snooze' })
  await motionDone(sheet)
  const rest = sheet.getBoundingClientRect().top
  const grabber = grabberOf(sheet)
  const from = middleY(grabber)
  const far = Math.ceil(sheet.getBoundingClientRect().height * 0.3 / 20) * 20 + 20
  await slowDrag(grabber, from, far, sheet, rest)
  await waitFor(() => expect(sheet).toHaveAttribute('data-state', 'closed'))
  await expect(motionOf(sheet).name).toBe('sheetOut')
  // The first frame of the close is at the drag offset or lower, never back at the rest.
  await expect(sheet.getBoundingClientRect().top - rest).toBeGreaterThanOrEqual(far)
  await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
}

// A sheet that opens again during its swipe close drops the drag offset and rests flush with the bottom (PR #186 review).
const reopenPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const body = within(document.body)
  await userEvent.click(within(canvasElement).getByRole('button', { name: 'Snooze' }))
  const sheet = await body.findByRole('dialog', { name: 'Snooze' })
  await motionDone(sheet)
  const rest = sheet.getBoundingClientRect().top
  const grabber = grabberOf(sheet)
  const far = Math.ceil(sheet.getBoundingClientRect().height * 0.3 / 20) * 20 + 20
  await slowDrag(grabber, middleY(grabber), far, sheet, rest)
  await waitFor(() => expect(sheet).toHaveAttribute('data-state', 'closed'))
  await waitFor(() => expect(sheet).toHaveAttribute('data-state', 'open'))
  // The same element opens again: the close had not ended.
  await expect(body.getByRole('dialog', { name: 'Snooze' })).toBe(sheet)
  await motionDone(sheet)
  await expect(sheet).not.toHaveAttribute('data-dragging')
  await expect(sheet.getBoundingClientRect().top).toBe(rest)
}

/** A sheet opened again during its swipe close opens at its rest, not at the drag offset. */
export const ReopenDuringClose: StoryObj<typeof meta> = { render: () => <ReopenSheet />, play: reopenPlay }

/** A swipe past 30% closes the sheet, and it slides down from the finger. */
export const SwipeCloseMotion: StoryObj<typeof meta> = { render: () => <SwipeSheet />, play: swipeClosePlay }

// A sheet closed in the same task that opens it: the pick lands before Ark moves the focus in and before the open
// motion starts, so the sheet unmounts at once with the focus inside it. The focus still goes back to the trigger.
// A MutationObserver picks Name as soon as the sheet is in the page, before the next frame.
const quickClosePlay: NonNullable<StoryObj<typeof meta>['play']> = async ({ canvasElement }) => {
  const trigger = within(canvasElement).getByRole('button', { name: 'Sort' })
  const body = within(document.body)
  const picked = new Promise<void>((resolve) => {
    const observer = new MutationObserver(() => {
      const sheet = document.querySelector('[role="dialog"]')
      if (!(sheet instanceof HTMLElement)) return
      const name = within(sheet).queryByRole('radio', { name: 'Name' })
      if (name === null) return
      observer.disconnect()
      name.focus()
      name.click()
      resolve()
    })
    observer.observe(document.body, { childList: true, subtree: true })
  })
  await userEvent.click(trigger)
  await picked
  await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
  await waitFor(() => expect(trigger).toHaveFocus())
}

/** A sheet closed before its open motion starts gives the focus back to its trigger. */
export const QuickCloseDark: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <SortSheet />
    </main>
  ),
  play: quickClosePlay,
  globals: { mode: 'dark' },
}

/** The same with prefers-reduced-motion, where the sheet only fades. */
export const QuickCloseReducedMotionDark: StoryObj<typeof meta> = {
  // Only the story test runner has the DevTools session that emulates the media.
  tags: ['!dev'],
  render: () => (
    <main className={page}>
      <SortSheet />
    </main>
  ),
  globals: { mode: 'dark' },
  beforeEach: async () => {
    await emulateReducedMotion(true)
    return async () => {
      await emulateReducedMotion(false)
    }
  },
  play: quickClosePlay,
}

/** In Strict Mode, where React runs each effect cleanup once more at mount, a quick close still gives the focus back. */
export const QuickCloseStrictDark: StoryObj<typeof meta> = {
  render: () => (
    <StrictMode>
      <main className={page}>
        <SortSheet />
      </main>
    </StrictMode>
  ),
  play: quickClosePlay,
  globals: { mode: 'dark' },
}

// No scrim: the tablet side chat sheet (Workspaces T2 105:1914) leaves the chat above it (105:1810, 105:1894) in
// its full colour. A sheet with the default scrim sits beside it, so the play also checks the scrim still shows.
const onReply = fn()
const chatTop = css({ textStyle: 'paneTitle', color: 'fg.default' })

function SideChatPage() {
  return (
    <main className={page}>
      <Stack gap="12">
        <h2 className={chatTop}>Release the library</h2>
        <Button onClick={onReply}>Reply</Button>
        <BottomSheet scrim={false} title="Side chat" closeButton trigger={<Button>Side chat</Button>}>
          <Button>Send</Button>
        </BottomSheet>
        <SortSheet />
      </Stack>
      <span hidden data-swatch="scrim" className={scrimSwatch} />
    </main>
  )
}

// The elements of the sheet's layer (scrim, positioner, sheet) whose box covers the point.
function layerAt(x: number, y: number) {
  return Array.from(document.querySelectorAll('[data-scope="dialog"]')).filter((el) => {
    const r = el.getBoundingClientRect()
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
  })
}

const noScrimPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  onReply.mockClear()
  const canvas = within(canvasElement)
  const body = within(document.body)
  const trigger = canvas.getByRole('button', { name: 'Side chat' })
  await userEvent.click(trigger)
  const sheet = await body.findByRole('dialog', { name: 'Side chat' })
  await motionDone(sheet)
  // No scrim element is drawn.
  await expect(document.querySelector('.bottom-sheet__backdrop')).toBeNull()
  // The chat above the sheet stays visible: nothing of the sheet's layer that covers it paints a fill or a blur.
  // Ark hides the page from assistive technology while a sheet is open, with a scrim or not, so find it by its text.
  const heading = canvas.getByText('Release the library')
  const h = heading.getBoundingClientRect()
  await expect(h.bottom).toBeLessThan(sheet.getBoundingClientRect().top)
  const x = h.left + 4
  const y = h.top + h.height / 2
  const over = layerAt(x, y)
  await expect(over).not.toContain(sheet)
  for (const el of over) {
    const style = getComputedStyle(el)
    await expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)')
    await expect(style.backdropFilter).toBe('none')
    await expect(style.opacity).toBe('1')
  }
  // The sheet keeps the focus inside, as a sheet on a scrim does.
  await waitFor(() => expect(within(sheet).getByRole('button', { name: 'Close' })).toHaveFocus())
  // A press on the chat above closes the sheet and gives the focus back; it does not reach the page under it.
  const target = document.elementFromPoint(x, y)
  if (!(target instanceof HTMLElement)) throw new Error('nothing above the sheet')
  await expect(sheet.contains(target)).toBe(false)
  await userEvent.click(target)
  await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
  await waitFor(() => expect(trigger).toHaveFocus())
  await expect(onReply).not.toHaveBeenCalled()
  // With the sheet closed, the page above is reachable.
  await userEvent.click(canvas.getByRole('button', { name: 'Reply' }))
  await expect(onReply).toHaveBeenCalledTimes(1)
  // The default sheet still draws its scrim over the whole page, the chat above included.
  await userEvent.click(canvas.getByRole('button', { name: 'Sort' }))
  const sorted = await body.findByRole('dialog', { name: 'Sort by' })
  await motionDone(sorted)
  const scrim = document.querySelector('.bottom-sheet__backdrop')
  if (!(scrim instanceof HTMLElement)) throw new Error('no scrim')
  await expect(getComputedStyle(scrim).backgroundColor).toBe(swatch('scrim'))
  await expect(scrim.getBoundingClientRect().width).toBe(window.innerWidth)
  await expect(layerAt(x, y)).toContain(scrim)
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
}

/** `scrim={false}`: the tablet side chat sheet draws no scrim, so the chat above it stays in its full colour. */
export const NoScrimDark: StoryObj<typeof meta> = { render: () => <SideChatPage />, play: noScrimPlay, globals: { mode: 'dark' } }
export const NoScrimLight: StoryObj<typeof meta> = { render: () => <SideChatPage />, play: noScrimPlay, globals: { mode: 'light' } }
