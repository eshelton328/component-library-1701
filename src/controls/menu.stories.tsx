import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from './button'
import { useState } from 'react'
import { CheckIcon, CloseIcon, SnoozeIcon } from '../foundations/icons'
import { Menu, RadioMenu, type MenuEntry, type RadioMenuOption } from './menu'

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
  // Row: padding 8/12, radius 8; label Medium 14 over a 12 px description in fg.muted, 2 apart (346:4003).
  const row = getComputedStyle(newest)
  await expect([row.paddingTop, row.paddingRight, row.paddingBottom, row.paddingLeft]).toEqual(['8px', '12px', '8px', '12px'])
  await expect(row.borderTopLeftRadius).toBe('8px')
  const label = within(newest).getByText('Newest first')
  const description = within(newest).getByText('Most recent activity at the top')
  await expect([getComputedStyle(label).fontSize, getComputedStyle(label).fontWeight]).toEqual(['14px', '500'])
  await expect([getComputedStyle(description).fontSize, getComputedStyle(description).fontWeight]).toEqual(['12px', '400'])
  await expect(getComputedStyle(description).color).toBe(swatch())
  await expect(Math.round(description.getBoundingClientRect().top - label.getBoundingClientRect().bottom)).toBe(2)
  // 8 + 20 + 2 + 16 + 8 with the text style line heights.
  await expect(Math.round(newest.getBoundingClientRect().height)).toBe(54)
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
