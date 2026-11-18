import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from './button'
import { useState } from 'react'
import { BranchIcon, BubbleIcon, CalendarIcon, CheckIcon, CloseIcon, EditIcon, GridIcon, MoveIcon, PlusIcon, ProjectsIcon, SnoozeIcon, SparkleIcon, WorkspacesIcon } from '../foundations/icons'
import { Inline } from './layout'
import { Menu, RadioMenu, type MenuEntry, type MenuSubmenu, type RadioMenuOption } from './menu'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', minH: 'shell.dialog' })

function Pencil() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10.5 2.5l3 3L6 13H3v-3l7.5-7.5z" />
    </svg>
  )
}
function Trash() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.7 8.5h5.6l.7-8.5" />
    </svg>
  )
}
function More() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <circle cx="3.5" cy="8" r="1.25" />
      <circle cx="8" cy="8" r="1.25" />
      <circle cx="12.5" cy="8" r="1.25" />
    </svg>
  )
}

// The Workbench chat actions (D2b): rename, pin, an unavailable action, and delete.
const chatActions: readonly MenuEntry[] = [
  { value: 'rename', label: 'Rename', icon: <Pencil /> },
  { value: 'pin', label: 'Pin to sidebar' },
  { value: 'export', label: 'Export transcript', disabled: true },
  { type: 'separator' },
  { value: 'delete', label: 'Delete chat', icon: <Trash />, tone: 'danger' },
]

function OpenMenu() {
  return (
    <main className={page}>
      <Menu open trigger={<Button>Chat actions</Button>} items={chatActions} />
    </main>
  )
}

const meta = {
  title: 'Overlays/Menu',
  component: OpenMenu,
  play: async () => {
    // The menu renders in a portal, outside the story's canvas.
    const body = within(document.body)
    const menu = await body.findByRole('menu')
    const rename = within(menu).getByRole('menuitem', { name: 'Rename' })
    await expect(rename.getBoundingClientRect().height).toBe(32)
    const remove = within(menu).getByRole('menuitem', { name: 'Delete chat' })
    await expect(getComputedStyle(remove).color).not.toBe(getComputedStyle(rename).color)
    const exportItem = within(menu).getByRole('menuitem', { name: 'Export transcript' })
    await expect(exportItem).toHaveAttribute('aria-disabled', 'true')
    await expect(getComputedStyle(exportItem).opacity).toBe('0.45')
    await expect(within(menu).getByRole('separator')).toBeInTheDocument()
    await expect(getComputedStyle(menu).boxShadow).not.toBe('none')
    await expect(body.getByRole('button', { name: 'Chat actions' })).toHaveAttribute('aria-expanded', 'true')
  },
} satisfies Meta<typeof OpenMenu>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onSelect = fn<(value: string) => void>()

/** A click opens the menu; the arrow keys skip a disabled action; Enter picks; Escape closes. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <Menu trigger={<Button iconOnly aria-label="Row actions"><More /></Button>} items={chatActions} onSelect={onSelect} placement="bottom-end" />
    </main>
  ),
  play: async ({ canvasElement }) => {
    onSelect.mockClear()
    const canvas = within(canvasElement)
    const body = within(document.body)
    const trigger = canvas.getByRole('button', { name: 'Row actions' })
    await userEvent.click(trigger)
    const menu = await body.findByRole('menu')
    await waitFor(() => expect(menu).toHaveFocus())
    // Rename, Pin, then Delete: Export is disabled, so the arrow skips it.
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Delete chat' })).toHaveAttribute('data-highlighted'))
    await userEvent.keyboard('{Enter}')
    await expect(onSelect).toHaveBeenLastCalledWith('delete')
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
    // Escape closes without a pick.
    await userEvent.click(trigger)
    await body.findByRole('menu')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull())
    await expect(onSelect).toHaveBeenCalledTimes(1)
    // A click picks an action.
    await userEvent.click(trigger)
    await userEvent.click(within(await body.findByRole('menu')).getByRole('menuitem', { name: 'Rename' }))
    await expect(onSelect).toHaveBeenLastCalledWith('rename')
  },
}

const many: readonly MenuEntry[] = Array.from({ length: 80 }, (_, i) => ({ value: `action-${String(i)}`, label: `Action ${String(i + 1)}` }))

/** A menu longer than the window scrolls and stays inside the window. */
export const LongMenu: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <Menu open trigger={<Button>Many actions</Button>} items={many} />
    </main>
  ),
  play: async () => {
    const menu = await within(document.body).findByRole('menu')
    await waitFor(() => expect(menu.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight))
    await expect(menu.scrollHeight).toBeGreaterThan(menu.clientHeight)
    await expect(within(menu).getByRole('menuitem', { name: 'Action 1' }).getBoundingClientRect().height).toBe(32)
  },
}

function TitledPencil() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <title>Pencil</title>
      <path d="M10.5 2.5l3 3L6 13H3v-3l7.5-7.5z" />
    </svg>
  )
}

/** Typeahead matches the label, not the text inside an icon. */
export const Typeahead: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <Menu
        trigger={<Button>Chat actions</Button>}
        items={[
          { value: 'rename', label: 'Rename', icon: <TitledPencil /> },
          { value: 'pin', label: 'Pin to sidebar' },
        ]}
      />
    </main>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Chat actions' }))
    const menu = await within(document.body).findByRole('menu')
    await waitFor(() => expect(menu).toHaveFocus())
    await userEvent.keyboard('p')
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Pin to sidebar' })).toHaveAttribute('data-highlighted'))
    // Ark joins keys pressed within a short time into one search, so wait before the next key.
    await new Promise((resolve) => setTimeout(resolve, 600))
    await userEvent.keyboard('r')
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: /Rename/ })).toHaveAttribute('data-highlighted'))
  },
}

// The sort menu of Inbox and Artifacts: the picked order has a check.
const sorts: readonly RadioMenuOption[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name' },
  { value: 'size', label: 'Size', disabled: true },
]
const onSort = fn<(value: string) => void>()

function SortMenu() {
  const [sort, setSort] = useState('newest')
  const label = sorts.find((o) => o.value === sort)?.label ?? ''
  return (
    <main className={page}>
      <RadioMenu
        trigger={<Button>Sort: {label}</Button>}
        label="Sort by"
        options={sorts}
        value={sort}
        onValueChange={(v) => {
          onSort(v)
          setSort(v)
        }}
      />
    </main>
  )
}

/** The sort menu: one choice has a check, and a pick closes the menu and reports the value. */
export const Sort: StoryObj<typeof meta> = {
  render: () => <SortMenu />,
  play: async ({ canvasElement }) => {
    onSort.mockClear()
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Sort: Newest first' }))
    const menu = await body.findByRole('menu')
    await expect(within(menu).getByRole('group', { name: 'Sort by' })).toBeInTheDocument()
    const newest = within(menu).getByRole('menuitemradio', { name: 'Newest first' })
    const oldest = within(menu).getByRole('menuitemradio', { name: 'Oldest first' })
    await expect(newest).toHaveAttribute('aria-checked', 'true')
    await expect(oldest).toHaveAttribute('aria-checked', 'false')
    await expect(newest.getBoundingClientRect().height).toBe(32)
    // Only the picked choice shows its check, in the accent colour.
    const checkOf = (item: HTMLElement) => item.querySelector('[data-part="item-indicator"]')
    const check = checkOf(newest)
    if (!(check instanceof HTMLElement)) throw new Error('no check')
    await expect(check).toBeVisible()
    await expect(checkOf(oldest)).not.toBeVisible()
    const svg = check.querySelector('svg')
    if (svg === null) throw new Error('no check icon')
    // The indicator is accent.default, and the check icon must keep that colour, not the muted icon colour.
    await expect(getComputedStyle(svg).color).toBe(getComputedStyle(check).color)
    await expect(getComputedStyle(svg).color).not.toBe(getComputedStyle(newest).color)
    await expect(within(menu).getByRole('menuitemradio', { name: 'Size' })).toHaveAttribute('aria-disabled', 'true')
    // A click picks Oldest first and closes the menu.
    await userEvent.click(oldest)
    await expect(onSort).toHaveBeenLastCalledWith('oldest')
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull())
    // The keyboard picks Name; a pick of the checked choice reports nothing.
    await userEvent.click(canvas.getByRole('button', { name: 'Sort: Oldest first' }))
    const again = await body.findByRole('menu')
    await waitFor(() => expect(again).toHaveFocus())
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    await waitFor(() => expect(within(again).getByRole('menuitemradio', { name: 'Name' })).toHaveAttribute('data-highlighted'))
    await userEvent.keyboard('{Enter}')
    await expect(onSort).toHaveBeenLastCalledWith('name')
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Sort: Name' })).toHaveFocus())
    await userEvent.click(canvas.getByRole('button', { name: 'Sort: Name' }))
    await userEvent.click(within(await body.findByRole('menu')).getByRole('menuitemradio', { name: 'Name' }))
    await expect(onSort).toHaveBeenCalledTimes(2)
  },
}

function OpenSort() {
  return (
    <main className={page}>
      <RadioMenu open trigger={<Button>Sort</Button>} label="Sort by" options={sorts} defaultValue="oldest" />
    </main>
  )
}

/** The open sort menu in each mode, so axe checks the check and the disabled choice. */
export const SortDark: StoryObj<typeof meta> = { render: () => <OpenSort />, play: async () => { await within(document.body).findByRole('menu') }, globals: { mode: 'dark' } }
export const SortLight: StoryObj<typeof meta> = { render: () => <OpenSort />, play: async () => { await within(document.body).findByRole('menu') }, globals: { mode: 'light' } }

// Swatches of the expected tokens, so the play functions compare resolved colours.
const mutedSwatch = css({ color: 'fg.muted' })

function swatch() {
  const el = document.querySelector('[data-swatch="muted"]')
  if (el === null) throw new Error('no muted swatch')
  return getComputedStyle(el).color
}

// The Inbox snooze menu (D12 346:5300): a Snooze heading over four times, then two actions.
const snooze: readonly MenuEntry[] = [
  { value: 'hour', label: 'In 1 hour', icon: <SnoozeIcon />, trailing: '11:40' },
  { value: 'evening', label: 'This evening', icon: <SnoozeIcon />, trailing: '20:00' },
  { value: 'morning', label: 'Tomorrow morning', icon: <SnoozeIcon />, trailing: '9:00' },
  { value: 'pick', label: 'Pick a date and time…', icon: <SnoozeIcon /> },
  { type: 'separator' },
  { value: 'done', label: 'Mark done', icon: <CheckIcon /> },
  { value: 'dismiss', label: 'Dismiss with a reason…', icon: <CloseIcon />, tone: 'danger' },
]
const onSnooze = fn<(value: string) => void>()

function SnoozeMenu({ open }: { open?: boolean }) {
  return (
    <main className={page}>
      <Menu {...(open === true ? { open } : {})} trigger={<Button>Snooze</Button>} heading="Snooze" items={snooze} onSelect={onSnooze} />
      <span hidden data-swatch="muted" className={mutedSwatch} />
    </main>
  )
}

const snoozePlay: StoryObj<typeof meta>['play'] = async () => {
  const menu = await within(document.body).findByRole('menu')
  // The heading names the actions before the separator; the others are outside the group.
  const group = within(menu).getByRole('group', { name: 'Snooze' })
  await expect(within(group).getAllByRole('menuitem')).toHaveLength(4)
  await expect(within(group).queryByRole('menuitem', { name: 'Mark done' })).toBeNull()
  // Heading: eyebrow (Mono 11, capitals, 0.44 tracking) in fg.muted, padding 10/4/4/4 (346:5301).
  const heading = within(group).getByText('Snooze')
  const h = getComputedStyle(heading)
  await expect([h.fontSize, h.textTransform, h.letterSpacing]).toEqual(['11px', 'uppercase', '0.44px'])
  await expect(h.fontFamily).toMatch(/Mono/)
  await expect([h.paddingTop, h.paddingRight, h.paddingBottom, h.paddingLeft]).toEqual(['10px', '4px', '4px', '4px'])
  await expect(h.color).toBe(swatch())
  // The time sits at the end of the row in mono, fg.muted, and is part of the action's name (346:5310).
  const hour = within(menu).getByRole('menuitem', { name: 'In 1 hour 11:40' })
  const time = within(hour).getByText('11:40')
  const t = getComputedStyle(time)
  await expect(t.fontFamily).toMatch(/Mono/)
  await expect(t.fontSize).toBe('12px')
  await expect(t.color).toBe(swatch())
  await expect(Math.round(hour.getBoundingClientRect().right - time.getBoundingClientRect().right)).toBe(10)
  // A row without a time keeps its height.
  await expect(within(menu).getByRole('menuitem', { name: 'Pick a date and time…' }).getBoundingClientRect().height).toBe(32)
  await expect(hour.getBoundingClientRect().height).toBe(32)
  // The default size keeps its label in `label` (Medium 14/20).
  const label = getComputedStyle(within(hour).getByText('In 1 hour'))
  await expect([label.fontSize, Math.round(Number.parseFloat(label.lineHeight)), label.fontWeight]).toEqual(['14px', 20, '500'])
}

/** The snooze menu: a group heading and a time at the end of a row (Inbox D12, T13, M6). */
export const SnoozeDark: StoryObj<typeof meta> = { render: () => <SnoozeMenu open />, play: snoozePlay, globals: { mode: 'dark' } }
export const SnoozeLight: StoryObj<typeof meta> = { render: () => <SnoozeMenu open />, play: snoozePlay, globals: { mode: 'light' } }

/** The arrow keys move through the headed group and past the separator; Enter picks a time. */
export const SnoozeBehaviour: StoryObj<typeof meta> = {
  render: () => <SnoozeMenu />,
  play: async ({ canvasElement }) => {
    onSnooze.mockClear()
    const body = within(document.body)
    const trigger = within(canvasElement).getByRole('button', { name: 'Snooze' })
    await userEvent.click(trigger)
    const menu = await body.findByRole('menu')
    await waitFor(() => expect(menu).toHaveFocus())
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'This evening 20:00' })).toHaveAttribute('data-highlighted'))
    await userEvent.keyboard('{Enter}')
    await expect(onSnooze).toHaveBeenLastCalledWith('evening')
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull())
    await userEvent.click(trigger)
    const again = await body.findByRole('menu')
    await waitFor(() => expect(again).toHaveFocus())
    await userEvent.keyboard('{ArrowUp}')
    await waitFor(() => expect(within(again).getByRole('menuitem', { name: 'Dismiss with a reason…' })).toHaveAttribute('data-highlighted'))
    await userEvent.keyboard('{ArrowUp}{Enter}')
    await expect(onSnooze).toHaveBeenLastCalledWith('done')
  },
}

// The Inbox sort menu (D9 346:4000): a SORT BY heading and a description under each choice.
const describedSorts: readonly RadioMenuOption[] = [
  { value: 'newest', label: 'Newest first', description: 'Most recent activity at the top' },
  { value: 'oldest', label: 'Oldest first', description: 'Waiting longest at the top' },
  { value: 'project', label: 'Project', description: 'Grouped by project, then newest' },
  { value: 'kind', label: 'Kind', description: 'Approvals first, next steps last' },
]
const onDescribedSort = fn<(value: string) => void>()

function DescribedSort({ open }: { open?: boolean }) {
  return (
    <main className={page}>
      <RadioMenu
        {...(open === true ? { open } : {})}
        trigger={<Button>Sort</Button>}
        label="Sort tasks"
        heading="Sort by"
        options={describedSorts}
        defaultValue="newest"
        onValueChange={onDescribedSort}
      />
      <span hidden data-swatch="muted" className={mutedSwatch} />
    </main>
  )
}

const describedPlay: StoryObj<typeof meta>['play'] = async () => {
  const menu = await within(document.body).findByRole('menu')
  // The heading names the list of choices.
  const group = within(menu).getByRole('group', { name: 'Sort by' })
  const heading = within(group).getByText('Sort by')
  await expect(getComputedStyle(heading).textTransform).toBe('uppercase')
  await expect(getComputedStyle(heading).color).toBe(swatch())
  // Each choice is named by its label and described by its second line.
  const newest = within(group).getByRole('menuitemradio', { name: 'Newest first' })
  await expect(newest).toHaveAccessibleDescription('Most recent activity at the top')
  await expect(newest).toHaveAttribute('aria-checked', 'true')
  // Row: padding 6/12, radius 8; label Medium 14 over a 12 px description in fg.muted, 2 apart (346:4003). Figma pads
  // 8 around 18 and 14 px lines; our lines are 20 and 16, so the row pads 6 and keeps Figma's 50.
  const row = getComputedStyle(newest)
  await expect([row.paddingTop, row.paddingRight, row.paddingBottom, row.paddingLeft]).toEqual(['6px', '12px', '6px', '12px'])
  await expect(row.borderTopLeftRadius).toBe('8px')
  const label = within(newest).getByText('Newest first')
  const description = within(newest).getByText('Most recent activity at the top')
  await expect([getComputedStyle(label).fontSize, getComputedStyle(label).fontWeight]).toEqual(['14px', '500'])
  await expect([getComputedStyle(description).fontSize, getComputedStyle(description).fontWeight]).toEqual(['12px', '400'])
  await expect(getComputedStyle(description).color).toBe(swatch())
  await expect(Math.round(description.getBoundingClientRect().top - label.getBoundingClientRect().bottom)).toBe(2)
  // 6 + 20 + 2 + 16 + 6 with the text style line heights: Figma's 50 (D9 346:4003).
  await expect(Math.round(newest.getBoundingClientRect().height)).toBe(50)
  // The heading pads 2 above and 4 below its 16 px line, so the first choice starts 24 under the box's padding, as in
  // Figma (D9 346:4001 to 346:4003).
  await expect(Math.round(heading.getBoundingClientRect().height)).toBe(22)
  const menuBox = newest.closest('[role="menu"]')
  if (!(menuBox instanceof HTMLElement)) throw new Error('no menu box')
  const contentTop = menuBox.getBoundingClientRect().top + Number.parseFloat(getComputedStyle(menuBox).borderTopWidth) + Number.parseFloat(getComputedStyle(menuBox).paddingTop)
  await expect(Math.round(newest.getBoundingClientRect().top - contentTop)).toBe(24)
}

/** The sort menu with a heading and a description under each choice (Inbox D9, T9). */
export const DescribedSortDark: StoryObj<typeof meta> = { render: () => <DescribedSort open />, play: describedPlay, globals: { mode: 'dark' } }
export const DescribedSortLight: StoryObj<typeof meta> = { render: () => <DescribedSort open />, play: describedPlay, globals: { mode: 'light' } }

/** The arrow keys move between described choices and Enter picks one. */
export const DescribedSortBehaviour: StoryObj<typeof meta> = {
  render: () => <DescribedSort />,
  play: async ({ canvasElement }) => {
    onDescribedSort.mockClear()
    const body = within(document.body)
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Sort' }))
    const menu = await body.findByRole('menu')
    await waitFor(() => expect(menu).toHaveFocus())
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    await waitFor(() => expect(within(menu).getByRole('menuitemradio', { name: 'Project' })).toHaveAttribute('data-highlighted'))
    await userEvent.keyboard('{Enter}')
    await expect(onDescribedSort).toHaveBeenLastCalledWith('project')
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull())
  },
}

// The note, the width and the key of the Inbox sort menu (D9 346:4000): 280 wide, with "Sorting applies inside each
// group." under a line at the end (346:4025).
const borderSwatch = css({ borderTopWidth: 'default', borderTopStyle: 'solid', borderColor: 'border.default' })

function NotedSort() {
  return (
    <main className={page}>
      <RadioMenu
        open
        trigger={<Button>Sort</Button>}
        label="Sort tasks"
        heading="Sort by"
        options={describedSorts}
        defaultValue="newest"
        width="sort"
        note="Sorting applies inside each group."
        data-figma="menu · Sort"
        className="app-sort-menu"
      />
      <span hidden data-swatch="muted" className={mutedSwatch} />
      <span hidden data-swatch="border" className={borderSwatch} />
    </main>
  )
}

const notedSortPlay: StoryObj<typeof meta>['play'] = async () => {
  const menu = await within(document.body).findByRole('menu')
  // The box takes the app's key and class, and keeps Ark's own data attributes.
  await expect(menu).toHaveAttribute('data-figma', 'menu · Sort')
  await expect(menu).toHaveClass('app-sort-menu')
  await expect(menu).toHaveAttribute('data-scope', 'menu')
  await expect(menu).toHaveAttribute('data-part', 'content')
  // shell.popoverSort: 280 wide.
  await expect(menu.getBoundingClientRect().width).toBe(280)
  // The note sits after the last choice, under a line, in small fg.muted; it describes the menu.
  const note = within(menu).getByText('Sorting applies inside each group.')
  await expect(menu).toHaveAccessibleDescription('Sorting applies inside each group.')
  const kind = within(menu).getByRole('menuitemradio', { name: 'Kind' })
  await expect(note.getBoundingClientRect().top).toBeGreaterThan(kind.getBoundingClientRect().bottom)
  // The note is the footer's only text, so the element found is the footer itself.
  const f = getComputedStyle(note)
  const borderEl = document.querySelector('[data-swatch="border"]')
  if (borderEl === null) throw new Error('no border swatch')
  await expect([f.borderTopWidth, f.borderTopStyle, f.borderTopColor]).toEqual(['1px', 'solid', getComputedStyle(borderEl).borderTopColor])
  // Padding 14/12/4 in Figma; 14 takes 16 (d-072).
  await expect([f.paddingTop, f.paddingRight, f.paddingBottom, f.paddingLeft]).toEqual(['16px', '12px', '4px', '12px'])
  const n = getComputedStyle(note)
  await expect([n.fontSize, n.fontWeight]).toEqual(['12px', '400'])
  await expect(n.color).toBe(swatch())
}

/** The sort menu with a note at the end, the sort width and an app's key (Inbox D9). */
export const NotedSortDark: StoryObj<typeof meta> = { render: () => <NotedSort />, play: notedSortPlay, globals: { mode: 'dark' } }
export const NotedSortLight: StoryObj<typeof meta> = { render: () => <NotedSort />, play: notedSortPlay, globals: { mode: 'light' } }

// The Inbox snooze menu at its Figma size (D12 346:5300): 320 wide, with 44 px rows (346:5303) and 18 px icons, which
// take 20 on the icon scale.
const largeSnooze: readonly MenuEntry[] = [
  { value: 'hour', label: 'In 1 hour', icon: <SnoozeIcon />, trailing: '11:40' },
  { value: 'evening', label: 'This evening', icon: <SnoozeIcon />, trailing: '20:00' },
  { value: 'morning', label: 'Tomorrow morning', icon: <SnoozeIcon />, trailing: '9:00' },
  { value: 'pick', label: 'Pick a date and time…', icon: <CalendarIcon /> },
  { type: 'separator' },
  { value: 'done', label: 'Mark done', icon: <CheckIcon /> },
  { value: 'dismiss', label: 'Dismiss with a reason…', icon: <CloseIcon />, tone: 'danger' },
]

function LargeSnooze() {
  return (
    <main className={page}>
      <Menu open trigger={<Button>Snooze</Button>} heading="Snooze" items={largeSnooze} width="md" size="lg" data-figma="menu · Snooze or dismiss" className="app-snooze-menu" />
    </main>
  )
}

const largeSnoozePlay: StoryObj<typeof meta>['play'] = async () => {
  const menu = await within(document.body).findByRole('menu')
  await expect(menu).toHaveAttribute('data-figma', 'menu · Snooze or dismiss')
  await expect(menu).toHaveClass('app-snooze-menu')
  // shell.popover: 320 wide; padding 6/12/8 (346:5300).
  await expect(menu.getBoundingClientRect().width).toBe(320)
  const m = getComputedStyle(menu)
  await expect([m.paddingTop, m.paddingRight, m.paddingBottom, m.paddingLeft]).toEqual(['6px', '12px', '8px', '12px'])
  // Rows: control.xl (44), padding 8, gap 12, icons 20, radius 10 (346:5303).
  for (const name of ['In 1 hour 11:40', 'Pick a date and time…', 'Dismiss with a reason…']) {
    const item = within(menu).getByRole('menuitem', { name })
    await expect(item.getBoundingClientRect().height).toBe(44)
    const r = getComputedStyle(item)
    await expect([r.paddingLeft, r.paddingRight, r.columnGap, r.borderTopLeftRadius]).toEqual(['8px', '8px', '12px', '10px'])
    const icon = item.querySelector('svg')
    if (icon === null) throw new Error(`no icon in ${name}`)
    await expect([icon.getBoundingClientRect().width, icon.getBoundingClientRect().height]).toEqual([20, 20])
  }
  // The time stays at the end of the row.
  const hour = within(menu).getByRole('menuitem', { name: 'In 1 hour 11:40' })
  await expect(Math.round(hour.getBoundingClientRect().right - within(hour).getByText('11:40').getBoundingClientRect().right)).toBe(8)
  // Labels are Regular 15/24 (bodyLg, 346:5303), in the sans family; the time stays mono 12.
  const label = getComputedStyle(within(hour).getByText('In 1 hour'))
  await expect([label.fontSize, Math.round(Number.parseFloat(label.lineHeight)), label.fontWeight]).toEqual(['15px', 24, '400'])
  await expect(label.fontFamily).not.toMatch(/Mono/)
  await expect(getComputedStyle(within(hour).getByText('11:40')).fontSize).toBe('12px')
  // The line sits 2 under Pick a date and 2 over Mark done (346:5334), the box's gap.
  const line = within(menu).getByRole('separator')
  const pick = within(menu).getByRole('menuitem', { name: 'Pick a date and time…' }).getBoundingClientRect()
  const done = within(menu).getByRole('menuitem', { name: 'Mark done' }).getBoundingClientRect()
  await expect(Math.round(line.getBoundingClientRect().top - pick.bottom)).toBe(2)
  await expect(Math.round(done.top - line.getBoundingClientRect().bottom)).toBe(2)
}

/** The snooze menu at the Inbox D12 size: `width="md"` and `size="lg"`, with a calendar on "Pick a date and time…". */
export const LargeSnoozeDark: StoryObj<typeof meta> = { render: () => <LargeSnooze />, play: largeSnoozePlay, globals: { mode: 'dark' } }
export const LargeSnoozeLight: StoryObj<typeof meta> = { render: () => <LargeSnooze />, play: largeSnoozePlay, globals: { mode: 'light' } }

// The Workbench menus (D1 105:421 with its Move to workspace list 105:473, D2b 402:5486): compact rows, a submenu and
// highlighted rows.
const swatchColour = (name: string, property: 'color' | 'backgroundColor') => {
  const el = document.querySelector(`[data-swatch="${name}"]`)
  if (el === null) throw new Error(`no ${name} swatch`)
  return getComputedStyle(el)[property]
}
const accentSwatch = css({ color: 'fg.accent' })
const selectedSwatch = css({ bg: 'surface.selected' })

const iconOf = (row: HTMLElement) => {
  const icon = row.querySelector('[data-part="item-icon"] svg')
  if (!(icon instanceof SVGElement)) throw new Error('no icon')
  return icon
}

// D2b's chat actions: eight rows and a separator, the pointer on Move to workspace.
const workbenchActions: readonly MenuEntry[] = [
  { value: 'newChat', label: 'New chat', icon: <PlusIcon /> },
  { value: 'fork', label: 'Fork', icon: <BranchIcon /> },
  { value: 'sideChat', label: 'Side chat (/btw)', icon: <BubbleIcon /> },
  { value: 'subtask', label: 'Subtask', icon: <SparkleIcon /> },
  { type: 'separator' },
  { value: 'subagents', label: 'Subagents · 2', icon: <WorkspacesIcon /> },
  { value: 'folders', label: 'Folders…', icon: <ProjectsIcon /> },
  { value: 'move', label: 'Move to workspace', icon: <MoveIcon /> },
  { value: 'rename', label: 'Rename chat', icon: <EditIcon /> },
]

function CompactMenus() {
  return (
    <main className={page}>
      <Inline gap="24">
        <Menu open trigger={<Button>Chat actions</Button>} items={workbenchActions} width="sm" density="compact" highlightedValue="move" data-figma="compact" />
        <Menu open trigger={<Button>Default actions</Button>} items={workbenchActions} width="sm" data-figma="default" />
      </Inline>
      <span hidden data-swatch="muted" className={mutedSwatch} />
      <span hidden data-swatch="accent" className={accentSwatch} />
      <span hidden data-swatch="selected" className={selectedSwatch} />
    </main>
  )
}

const menuByKey = async (key: string) => {
  const found = await waitFor(() => {
    const el = document.querySelector(`[role="menu"][data-figma="${key}"]`)
    if (!(el instanceof HTMLElement)) throw new Error(`no ${key} menu`)
    return el
  })
  return found
}

const compactPlay: StoryObj<typeof meta>['play'] = async () => {
  const menu = await menuByKey('compact')
  const rows = within(menu).getAllByRole('menuitem')
  await expect(rows).toHaveLength(8)
  // 32 px rows (Figma 31, d-100), edge to edge: one 32 px pitch as Figma's 31 + 1 (402:5530 to 402:5518).
  for (const row of rows) await expect(row.getBoundingClientRect().height).toBe(32)
  const [first, second] = rows
  if (first === undefined || second === undefined) throw new Error('no rows')
  await expect(second.getBoundingClientRect().top - first.getBoundingClientRect().bottom).toBe(0)
  // Eight rows and a separator in a box padded 6: Figma's 279 (402:5486).
  await expect(menu.getBoundingClientRect().height).toBe(279)
  // Padding 8 and an 8 px gap between the 16 px icon and the label (105:423, 105:429).
  const fork = within(menu).getByRole('menuitem', { name: 'Fork' })
  const f = getComputedStyle(fork)
  await expect([f.paddingLeft, f.paddingRight, f.columnGap]).toEqual(['8px', '8px', '8px'])
  const forkIcon = iconOf(fork)
  await expect([forkIcon.getBoundingClientRect().width, forkIcon.getBoundingClientRect().height]).toEqual([16, 16])
  // The label stays `label` (Medium 14/20, sans).
  const label = getComputedStyle(within(fork).getByText('Fork'))
  await expect([label.fontSize, Math.round(Number.parseFloat(label.lineHeight)), label.fontWeight]).toEqual(['14px', 20, '500'])
  await expect(label.fontFamily).not.toMatch(/Mono/)
  // The highlighted row is filled and its icon is fg.accent; the others keep fg.muted icons and no fill.
  const move = within(menu).getByRole('menuitem', { name: 'Move to workspace' })
  await expect(move).toHaveAttribute('data-highlighted')
  await expect(getComputedStyle(move).backgroundColor).toBe(swatchColour('selected', 'backgroundColor'))
  await expect(getComputedStyle(iconOf(move)).color).toBe(swatchColour('accent', 'color'))
  await expect(fork).not.toHaveAttribute('data-highlighted')
  await expect(getComputedStyle(iconOf(fork)).color).toBe(swatchColour('muted', 'color'))
  await expect(getComputedStyle(fork).backgroundColor).not.toBe(swatchColour('selected', 'backgroundColor'))
  // The default menu keeps its look: 32 px rows 2 apart, padding and gap 10, 295 high, no accent icon.
  const plain = await menuByKey('default')
  const plainRows = within(plain).getAllByRole('menuitem')
  const [p1, p2] = plainRows
  if (p1 === undefined || p2 === undefined) throw new Error('no default rows')
  await expect(p1.getBoundingClientRect().height).toBe(32)
  await expect(p2.getBoundingClientRect().top - p1.getBoundingClientRect().bottom).toBe(2)
  await expect(plain.getBoundingClientRect().height).toBe(295)
  const p = getComputedStyle(p1)
  await expect([p.paddingLeft, p.columnGap]).toEqual(['10px', '10px'])
  await expect(getComputedStyle(iconOf(p1)).color).toBe(swatchColour('muted', 'color'))
}

/** The Workbench chat actions menu (D2b): `density="compact"` and `highlightedValue="move"`, beside a default menu. */
export const CompactDark: StoryObj<typeof meta> = { render: () => <CompactMenus />, play: compactPlay, globals: { mode: 'dark' } }
export const CompactLight: StoryObj<typeof meta> = { render: () => <CompactMenus />, play: compactPlay, globals: { mode: 'light' } }

// The phone's New menu (Workspaces M15 208:515): 220 wide, so it leaves the end of the row title under it clear, with
// the D12 rows: Figma's 42 px rows and 18 px icons (208:516, 208:521, 208:529) take 44 and 20 on the grid (d-100).
const newActions: readonly MenuEntry[] = [
  { value: 'newChat', label: 'New chat', icon: <PlusIcon /> },
  { value: 'newWorkspace', label: 'New workspace', icon: <GridIcon /> },
]

function PhoneNewMenu() {
  return (
    <main className={page}>
      <Inline gap="24">
        <Menu open trigger={<Button>New</Button>} items={newActions} width="phone" size="lg" placement="bottom-end" data-figma="phone" />
        <Menu open trigger={<Button>Large</Button>} items={newActions} size="lg" data-figma="large" />
      </Inline>
    </main>
  )
}

const phoneNewMenuPlay: StoryObj<typeof meta>['play'] = async () => {
  const menu = await menuByKey('phone')
  // shell.popoverPhone: 220 wide (208:515), under the 240 floor of a menu with no width.
  await expect(menu.getBoundingClientRect().width).toBe(220)
  await expect(within(menu).getAllByRole('menuitem')).toHaveLength(2)
  for (const name of ['New chat', 'New workspace']) {
    const row = within(menu).getByRole('menuitem', { name })
    // size lg: control.xl (44) rows with 20 px icons and bodyLg labels (Regular 15/24).
    await expect(row.getBoundingClientRect().height).toBe(44)
    const icon = iconOf(row)
    await expect([icon.getBoundingClientRect().width, icon.getBoundingClientRect().height]).toEqual([20, 20])
    const label = getComputedStyle(within(row).getByText(name))
    await expect([label.fontSize, Math.round(Number.parseFloat(label.lineHeight)), label.fontWeight]).toEqual(['15px', 24, '400'])
  }
  // The New workspace label stays on one line inside the box.
  const workspace = within(menu).getByText('New workspace')
  await expect(workspace.getBoundingClientRect().right).toBeLessThanOrEqual(menu.getBoundingClientRect().right)
  await expect(Math.round(workspace.getBoundingClientRect().height)).toBe(24)
  // A large menu with no width keeps its content's width with the 240 floor.
  const large = await menuByKey('large')
  await expect(large.getBoundingClientRect().width).toBe(240)
}

/** The phone's New menu (Workspaces M15): `width="phone"` (220) and `size="lg"`, beside a large menu with no width. */
export const PhoneNewMenuDark: StoryObj<typeof meta> = { render: () => <PhoneNewMenu />, play: phoneNewMenuPlay, globals: { mode: 'dark' } }
export const PhoneNewMenuLight: StoryObj<typeof meta> = { render: () => <PhoneNewMenu />, play: phoneNewMenuPlay, globals: { mode: 'light' } }

// The New menu's icons in their labels' colour (M15 208:521 plus, 208:529 grid: stroke #e6ecff, as the labels 208:519
// and 208:527), beside the same menu with the default `fg.muted` icons. A danger row keeps its own colour.
const defaultSwatch = css({ color: 'fg.default' })
const dangerSwatch = css({ color: 'status.danger.fg' })
const toneActions: readonly MenuEntry[] = [...newActions, { value: 'delete', label: 'Delete', icon: <CloseIcon />, tone: 'danger' }]

function IconTone() {
  return (
    <main className={page}>
      <Inline gap="24">
        <Menu open trigger={<Button>New</Button>} items={toneActions} width="phone" size="lg" iconTone="default" data-figma="label" />
        <Menu open trigger={<Button>Muted</Button>} items={toneActions} width="phone" size="lg" data-figma="muted" />
        <Menu open trigger={<Button>Small</Button>} items={toneActions} iconTone="default" data-figma="small" />
      </Inline>
      <span hidden data-swatch="muted" className={mutedSwatch} />
      <span hidden data-swatch="default" className={defaultSwatch} />
      <span hidden data-swatch="danger" className={dangerSwatch} />
    </main>
  )
}

const iconTonePlay: StoryObj<typeof meta>['play'] = async () => {
  const fgDefault = swatchColour('default', 'color')
  const fgMuted = swatchColour('muted', 'color')
  const danger = swatchColour('danger', 'color')
  await expect(fgDefault).not.toBe(fgMuted)
  for (const key of ['label', 'small']) {
    const menu = await menuByKey(key)
    for (const name of ['New chat', 'New workspace']) {
      const row = within(menu).getByRole('menuitem', { name })
      const label = getComputedStyle(within(row).getByText(name)).color
      // iconTone="default": the icon is the label's colour, fg.default.
      await expect(label).toBe(fgDefault)
      await expect(getComputedStyle(iconOf(row)).color).toBe(label)
    }
    await expect(getComputedStyle(iconOf(within(menu).getByRole('menuitem', { name: 'Delete' }))).color).toBe(danger)
  }
  // With no iconTone the icons stay fg.muted.
  const muted = await menuByKey('muted')
  for (const name of ['New chat', 'New workspace']) {
    await expect(getComputedStyle(iconOf(within(muted).getByRole('menuitem', { name }))).color).toBe(fgMuted)
  }
  await expect(getComputedStyle(iconOf(within(muted).getByRole('menuitem', { name: 'Delete' }))).color).toBe(danger)
}

/** `iconTone="default"`: the icons in their labels' colour, as the phone's New menu (M15), beside the default `muted`. */
export const IconToneDark: StoryObj<typeof meta> = { render: () => <IconTone />, play: iconTonePlay, globals: { mode: 'dark' } }
export const IconToneLight: StoryObj<typeof meta> = { render: () => <IconTone />, play: iconTonePlay, globals: { mode: 'light' } }

const workspaces: readonly MenuEntry[] = [
  { value: 'the-bridge', label: 'the-bridge', icon: <GridIcon /> },
  { value: 'omni', label: 'omni', icon: <GridIcon /> },
  { value: 'skill-evals', label: 'skill-evals', icon: <GridIcon /> },
  { type: 'separator' },
  { value: 'new', label: 'New workspace…', icon: <PlusIcon /> },
]

// D1's pane menu, with Move to workspace's list beside it.
const paneActions = (submenu: MenuSubmenu): readonly MenuEntry[] => [
  { value: 'fork', label: 'Fork', icon: <BranchIcon /> },
  { value: 'sideChat', label: 'Side chat (/btw)', icon: <BubbleIcon /> },
  { value: 'subtask', label: 'Subtask', icon: <SparkleIcon /> },
  { type: 'separator' },
  { value: 'move', label: 'Move to workspace', icon: <MoveIcon />, submenu },
  { value: 'rename', label: 'Rename chat', icon: <EditIcon /> },
  { value: 'close', label: 'Close pane', icon: <CloseIcon /> },
]

function OpenSubmenu() {
  return (
    <main className={page}>
      <Menu
        open
        trigger={<Button>Pane actions</Button>}
        items={paneActions({ items: workspaces, open: true, highlightedValue: 'the-bridge' })}
        width="sm"
        density="compact"
        highlightedValue="move"
        data-figma="pane"
      />
      <span hidden data-swatch="muted" className={mutedSwatch} />
      <span hidden data-swatch="accent" className={accentSwatch} />
      <span hidden data-swatch="selected" className={selectedSwatch} />
    </main>
  )
}

const submenuPlay: StoryObj<typeof meta>['play'] = async () => {
  const pane = await menuByKey('pane')
  const move = within(pane).getByRole('menuitem', { name: 'Move to workspace' })
  // The row opens a menu, and its list is open.
  await expect(move).toHaveAttribute('aria-haspopup', 'menu')
  await expect(move).toHaveAttribute('aria-expanded', 'true')
  const listId = move.getAttribute('aria-controls')
  if (listId === null) throw new Error('the row controls no list')
  const list = document.getElementById(listId)
  if (list === null) throw new Error('no list')
  await expect(list).toHaveAttribute('role', 'menu')
  await expect(within(list).getAllByRole('menuitem')).toHaveLength(4)
  // Figma's boxes (105:421, 105:473): the pane menu 240 × 215 and the list 200 × 151, 4 past the menu and 7 below
  // the row's top.
  await waitFor(() => expect(list.getBoundingClientRect().left - pane.getBoundingClientRect().right).toBe(4))
  await expect(list.getBoundingClientRect().top - move.getBoundingClientRect().top).toBe(7)
  await expect([pane.getBoundingClientRect().width, pane.getBoundingClientRect().height]).toEqual([240, 215])
  await expect([list.getBoundingClientRect().width, list.getBoundingClientRect().height]).toEqual([200, 151])
  // The list takes the compact rows.
  const bridge = within(list).getByRole('menuitem', { name: 'the-bridge' })
  await expect(bridge.getBoundingClientRect().height).toBe(32)
  await expect(getComputedStyle(bridge).paddingLeft).toBe('8px')
  // The chevron is 12 px at the row's end, 8 from its edge, in the icon colour (105:459).
  const chevron = move.querySelector('[data-part="item-chevron"] svg')
  if (!(chevron instanceof SVGElement)) throw new Error('no chevron')
  await expect([chevron.getBoundingClientRect().width, chevron.getBoundingClientRect().height]).toEqual([12, 12])
  await expect(move.getBoundingClientRect().right - chevron.getBoundingClientRect().right).toBe(8)
  await expect(getComputedStyle(chevron).color).toBe(swatchColour('muted', 'color'))
  // Move to workspace and the-bridge are filled, with fg.accent icons (105:449, 105:474); omni is not.
  for (const row of [move, bridge]) {
    await expect(getComputedStyle(row).backgroundColor).toBe(swatchColour('selected', 'backgroundColor'))
    await expect(getComputedStyle(iconOf(row)).color).toBe(swatchColour('accent', 'color'))
  }
  const omni = within(list).getByRole('menuitem', { name: 'omni' })
  await expect(getComputedStyle(iconOf(omni)).color).toBe(swatchColour('muted', 'color'))
  await expect(getComputedStyle(omni).backgroundColor).not.toBe(swatchColour('selected', 'backgroundColor'))
}

/** D1's pane menu with Move to workspace's list open beside it, both with a highlighted row. */
export const SubmenuDark: StoryObj<typeof meta> = { render: () => <OpenSubmenu />, play: submenuPlay, globals: { mode: 'dark' } }
export const SubmenuLight: StoryObj<typeof meta> = { render: () => <OpenSubmenu />, play: submenuPlay, globals: { mode: 'light' } }

const onPaneSelect = fn<(value: string) => void>()
const onPaneHighlight = fn<(value: string | null) => void>()
const onMoveOpen = fn<(open: boolean) => void>()

/** The keyboard follows Ark UI's nested menu: Right Arrow opens the list, Left Arrow closes it, Enter picks. */
export const SubmenuBehaviour: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <Menu
        trigger={<Button>Pane actions</Button>}
        items={paneActions({ items: workspaces, onOpenChange: onMoveOpen })}
        width="sm"
        density="compact"
        onSelect={onPaneSelect}
        onHighlightChange={onPaneHighlight}
      />
    </main>
  ),
  play: async ({ canvasElement }) => {
    onPaneSelect.mockClear()
    onPaneHighlight.mockClear()
    onMoveOpen.mockClear()
    const body = within(document.body)
    const trigger = within(canvasElement).getByRole('button', { name: 'Pane actions' })
    await userEvent.click(trigger)
    const menu = await body.findByRole('menu')
    await waitFor(() => expect(menu).toHaveFocus())
    // Fork, Side chat, Subtask, then Move to workspace past the separator; the callback gets the row's value.
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}')
    const move = within(menu).getByRole('menuitem', { name: 'Move to workspace' })
    await waitFor(() => expect(move).toHaveAttribute('data-highlighted'))
    await expect(onPaneHighlight).toHaveBeenLastCalledWith('move')
    // Right Arrow opens the list and highlights its first workspace.
    await userEvent.keyboard('{ArrowRight}')
    await expect(onMoveOpen).toHaveBeenLastCalledWith(true)
    await waitFor(() => expect(move).toHaveAttribute('aria-expanded', 'true'))
    const listId = move.getAttribute('aria-controls')
    if (listId === null) throw new Error('the row controls no list')
    const list = await waitFor(() => {
      const el = document.getElementById(listId)
      if (el === null) throw new Error('no list')
      return el
    })
    await waitFor(() => expect(list).toHaveFocus())
    await waitFor(() => expect(within(list).getByRole('menuitem', { name: 'the-bridge' })).toHaveAttribute('data-highlighted'))
    // Left Arrow closes the list and returns to the row.
    await userEvent.keyboard('{ArrowLeft}')
    await waitFor(() => expect(move).toHaveAttribute('aria-expanded', 'false'))
    await expect(onMoveOpen).toHaveBeenLastCalledWith(false)
    await waitFor(() => expect(menu).toHaveFocus())
    await expect(move).toHaveAttribute('data-highlighted')
    // Enter opens it too; a pick in the list reports the workspace and closes both menus.
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(list).toHaveFocus())
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(within(list).getByRole('menuitem', { name: 'omni' })).toHaveAttribute('data-highlighted'))
    await userEvent.keyboard('{Enter}')
    await expect(onPaneSelect).toHaveBeenLastCalledWith('omni')
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
    await expect(onPaneSelect).toHaveBeenCalledTimes(1)
  },
}

/** A disabled submenu row shows its chevron, is skipped by the arrow keys and opens nothing. */
export const DisabledSubmenu: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <Menu
        trigger={<Button>Pane actions</Button>}
        items={[
          { value: 'fork', label: 'Fork', icon: <BranchIcon /> },
          { value: 'move', label: 'Move to workspace', icon: <MoveIcon />, disabled: true, submenu: { items: workspaces } },
          { value: 'rename', label: 'Rename chat', icon: <EditIcon /> },
        ]}
        density="compact"
      />
    </main>
  ),
  play: async ({ canvasElement }) => {
    const body = within(document.body)
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Pane actions' }))
    const menu = await body.findByRole('menu')
    await waitFor(() => expect(menu).toHaveFocus())
    const move = within(menu).getByRole('menuitem', { name: 'Move to workspace' })
    await expect(move).toHaveAttribute('aria-disabled', 'true')
    await expect(move.querySelector('[data-part="item-chevron"] svg')).not.toBeNull()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Rename chat' })).toHaveAttribute('data-highlighted'))
    await userEvent.click(move)
    await expect(body.getAllByRole('menu')).toHaveLength(1)
  },
}

const onNestedSelect = fn<(value: string) => void>()

/**
 * Two submenus whose values join to the same text (a row `a-b`, and `b` inside `a`) get their own ids, and the
 * keyboard reaches an action two levels deep.
 */
export const NestedSubmenuIds: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <Menu
        trigger={<Button>Nested actions</Button>}
        onSelect={onNestedSelect}
        items={[
          { value: 'a-b', label: 'Row a-b', submenu: { items: [{ value: 'x', label: 'Action x' }] } },
          { value: 'a', label: 'Row a', submenu: { items: [{ value: 'b', label: 'Row b', submenu: { items: [{ value: 'deep', label: 'Action deep' }] } }] } },
        ]}
      />
    </main>
  ),
  play: async ({ canvasElement }) => {
    onNestedSelect.mockClear()
    const body = within(document.body)
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Nested actions' }))
    const menu = await body.findByRole('menu')
    await waitFor(() => expect(menu).toHaveFocus())
    // Every menu box and row in the tree has an id no other element has.
    const ids = [...document.querySelectorAll('[data-scope="menu"][id]')].map((el) => el.id)
    await expect(new Set(ids).size).toBe(ids.length)
    // Row a, then its list; Row b, then its list; Enter picks the action two levels deep.
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    const rowA = within(menu).getByRole('menuitem', { name: 'Row a' })
    await waitFor(() => expect(rowA).toHaveAttribute('data-highlighted'))
    await userEvent.keyboard('{ArrowRight}')
    const listA = await waitFor(() => {
      const el = document.getElementById(rowA.getAttribute('aria-controls') ?? '')
      if (el === null) throw new Error('no list of Row a')
      return el
    })
    await waitFor(() => expect(listA).toHaveFocus())
    const rowB = within(listA).getByRole('menuitem', { name: 'Row b' })
    await waitFor(() => expect(rowB).toHaveAttribute('data-highlighted'))
    await userEvent.keyboard('{ArrowRight}')
    const listB = await waitFor(() => {
      const el = document.getElementById(rowB.getAttribute('aria-controls') ?? '')
      if (el === null) throw new Error('no list of Row b')
      return el
    })
    await waitFor(() => expect(listB).toHaveFocus())
    await expect(within(listB).getByRole('menuitem', { name: 'Action deep' })).toBeInTheDocument()
    await waitFor(() => expect(within(listB).getByRole('menuitem', { name: 'Action deep' })).toHaveAttribute('data-highlighted'))
    await userEvent.keyboard('{Enter}')
    await expect(onNestedSelect).toHaveBeenLastCalledWith('deep')
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull())
  },
}

const onEscapeMoveOpen = fn<(open: boolean) => void>()
const onEscapeMenuOpen = fn<(open: boolean) => void>()

/** Escape in a submenu closes only the submenu and returns the focus to its row; a second Escape closes the menu. */
export const SubmenuEscape: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <Menu
        trigger={<Button>Pane actions</Button>}
        items={paneActions({ items: workspaces, onOpenChange: onEscapeMoveOpen })}
        density="compact"
        onOpenChange={onEscapeMenuOpen}
      />
    </main>
  ),
  play: async ({ canvasElement }) => {
    onEscapeMoveOpen.mockClear()
    onEscapeMenuOpen.mockClear()
    const body = within(document.body)
    const trigger = within(canvasElement).getByRole('button', { name: 'Pane actions' })
    await userEvent.click(trigger)
    const menu = await body.findByRole('menu')
    await waitFor(() => expect(menu).toHaveFocus())
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}')
    const move = within(menu).getByRole('menuitem', { name: 'Move to workspace' })
    await waitFor(() => expect(move).toHaveAttribute('data-highlighted'))
    await userEvent.keyboard('{ArrowRight}')
    const list = await waitFor(() => {
      const el = document.getElementById(move.getAttribute('aria-controls') ?? '')
      if (el === null) throw new Error('no list')
      return el
    })
    await waitFor(() => expect(list).toHaveFocus())
    // Escape closes the list only: the menu stays open, with the focus on it and Move to workspace highlighted.
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(move).toHaveAttribute('aria-expanded', 'false'))
    await expect(onEscapeMoveOpen).toHaveBeenLastCalledWith(false)
    await expect(menu).toBeVisible()
    await waitFor(() => expect(menu).toHaveFocus())
    await expect(move).toHaveAttribute('data-highlighted')
    await expect(onEscapeMenuOpen).not.toHaveBeenCalledWith(false)
    // The next Escape closes the menu and returns the focus to its button.
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull())
    await expect(onEscapeMenuOpen).toHaveBeenLastCalledWith(false)
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}

// The Artifacts Sort menu (D6 403:8881, 280 x 283): `density="compact"`, with four described choices (403:8884 to
// 403:8901) and the note (403:8907), beside the same menu at the default density.
const artifactSorts: readonly RadioMenuOption[] = [
  { value: 'newest', label: 'Newest first', description: 'Most recently updated at the top' },
  { value: 'oldest', label: 'Oldest first', description: 'Least recently updated at the top' },
  { value: 'title', label: 'Title', description: 'A to Z' },
  { value: 'project', label: 'Project', description: 'Grouped by project, then newest' },
]
const artifactNote = 'Found since you last looked stays at the top.'

function CompactSort() {
  return (
    <main className={page}>
      <Inline gap="24" align="start">
        {(['compact', 'default'] as const).map((density) => (
          <RadioMenu
            key={density}
            open
            trigger={<Button data-trigger={density}>Sort, {density}</Button>}
            label="Sort artifacts"
            heading="Sort by"
            options={artifactSorts}
            defaultValue="newest"
            width="sort"
            density={density}
            note={artifactNote}
            data-figma={`sort ${density}`}
          />
        ))}
      </Inline>
      <span hidden data-swatch="muted" className={mutedSwatch} />
    </main>
  )
}

const lineHeightOf = (el: Element) => Math.round(Number.parseFloat(getComputedStyle(el).lineHeight))

const compactSortPlay: StoryObj<typeof meta>['play'] = async () => {
  const menu = await menuByKey('sort compact')
  const trigger = document.querySelector('[data-trigger="compact"]')
  if (trigger === null) throw new Error('no compact trigger')
  // 280 x 283, 8 under the Sort button, as Figma's.
  await waitFor(() => expect(Math.round(menu.getBoundingClientRect().top - trigger.getBoundingClientRect().bottom)).toBe(8))
  await expect(menu.getBoundingClientRect().width).toBe(280)
  await expect(menu.getBoundingClientRect().height).toBe(283)
  // Rows 48 high (Figma 50, d-100), padding 6/12; the label Medium 14/20 right over a Regular 11/16 sans description.
  const rows = within(menu).getAllByRole('menuitemradio')
  await expect(rows).toHaveLength(4)
  for (const row of rows) await expect(row.getBoundingClientRect().height).toBe(48)
  // 52 apart, as Figma's 403:8884 to 403:8901: 48 high, 4 between.
  const [row1, row2] = rows
  if (row1 === undefined || row2 === undefined) throw new Error('no rows')
  await expect(row2.getBoundingClientRect().top - row1.getBoundingClientRect().top).toBe(52)
  const newest = within(menu).getByRole('menuitemradio', { name: 'Newest first' })
  await expect(newest).toHaveAccessibleDescription('Most recently updated at the top')
  const r = getComputedStyle(newest)
  await expect([r.paddingTop, r.paddingRight, r.paddingBottom, r.paddingLeft]).toEqual(['6px', '12px', '6px', '12px'])
  const label = within(newest).getByText('Newest first')
  const description = within(newest).getByText('Most recently updated at the top')
  await expect([getComputedStyle(label).fontSize, getComputedStyle(label).fontWeight, lineHeightOf(label)]).toEqual(['14px', '500', 20])
  const d = getComputedStyle(description)
  await expect([d.fontSize, d.fontWeight, lineHeightOf(description)]).toEqual(['11px', '400', 16])
  await expect(d.fontFamily).not.toMatch(/Mono/)
  await expect(d.color).toBe(swatch())
  await expect(Math.round(description.getBoundingClientRect().top - label.getBoundingClientRect().bottom)).toBe(0)
  // The note: Regular 11/16 on one line, in fg.muted, still the menu's description.
  const note = within(menu).getByText(artifactNote)
  await expect(menu).toHaveAccessibleDescription(artifactNote)
  const n = getComputedStyle(note)
  await expect([n.fontSize, n.fontWeight, lineHeightOf(note)]).toEqual(['11px', '400', 16])
  await expect(n.fontFamily).not.toMatch(/Mono/)
  await expect(n.color).toBe(swatch())
  await expect(note.clientHeight - Number.parseFloat(n.paddingTop) - Number.parseFloat(n.paddingBottom)).toBe(16)
  // The default density keeps #119's look: 50 px rows (Inbox D9 346:4003), a 12 px description 2 under the label,
  // 4 under its trigger.
  const plain = await menuByKey('sort default')
  const plainTrigger = document.querySelector('[data-trigger="default"]')
  if (plainTrigger === null) throw new Error('no default trigger')
  await expect(Math.round(plain.getBoundingClientRect().top - plainTrigger.getBoundingClientRect().bottom)).toBe(4)
  const plainNewest = within(plain).getByRole('menuitemradio', { name: 'Newest first' })
  await expect(Math.round(plainNewest.getBoundingClientRect().height)).toBe(50)
  const plainDescription = within(plainNewest).getByText('Most recently updated at the top')
  await expect(getComputedStyle(plainDescription).fontSize).toBe('12px')
  await expect(Math.round(plainDescription.getBoundingClientRect().top - within(plainNewest).getByText('Newest first').getBoundingClientRect().bottom)).toBe(2)
  await expect(getComputedStyle(within(plain).getByText(artifactNote)).fontSize).toBe('12px')
}

/** The Artifacts Sort menu (D6): `RadioMenu density="compact"`, beside the default density. */
export const CompactSortDark: StoryObj<typeof meta> = { render: () => <CompactSort />, play: compactSortPlay, globals: { mode: 'dark' } }
export const CompactSortLight: StoryObj<typeof meta> = { render: () => <CompactSort />, play: compactSortPlay, globals: { mode: 'light' } }
