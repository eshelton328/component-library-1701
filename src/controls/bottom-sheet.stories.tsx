import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { BottomSheet, BottomSheetClose } from './bottom-sheet'
import { Button } from './button'
import { Stack } from './layout'
import { OptionList } from './option-list'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', minH: 'shell.dialog' })
// Swatches of the expected tokens, so the play functions compare resolved colours.
const scrimSwatch = css({ bg: 'overlay.scrim' })
const surfaceSwatch = css({ bg: 'surface.overlay' })
const borderSwatch = css({ bg: 'border.default' })

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

/** Swipe down to close: a short drag springs back, a long drag or a flick closes, a drag in scrolled content scrolls it. */
export const SwipeDark: StoryObj<typeof meta> = { render: () => <SwipeSheet />, play: swipePlay, globals: { mode: 'dark' } }
export const SwipeLight: StoryObj<typeof meta> = { render: () => <SwipeSheet />, play: swipePlay, globals: { mode: 'light' } }
