import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
import { motionDone } from '../controls/bottom-sheet.testing'
import { restPointerOn } from '../controls/pointer.testing'
import { Switch } from '../controls/switch'
import { MoreDrawer, type MoreDrawerGroup } from './more-drawer'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', minH: 'shell.dialog' })
// Swatches of the expected tokens, so the play functions compare resolved colours.
const swatches = {
  selected: css({ bg: 'surface.selected' }),
  selectedBorder: css({ bg: 'border.selected' }),
  tile: css({ bg: 'accent.subtle' }),
  disabledTile: css({ bg: 'surface.inset' }),
  muted: css({ bg: 'fg.muted' }),
}

function Glyph() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M10 3l7 4-7 4-7-4 7-4zM3 11l7 4 7-4" />
    </svg>
  )
}

// The items of Toolkit M4 (424:6940): Artifacts selected, Toolkit idle, Brain and Workflows later.
const groups: readonly MoreDrawerGroup[] = [
  {
    items: [
      { value: 'artifacts', label: 'Artifacts', description: 'Every Claude artifact and Codex site', icon: <Glyph />, count: 24 },
      { value: 'toolkit', label: 'Toolkit', description: 'Agents, skills, workflows, rules and hooks', icon: <Glyph />, count: 27 },
    ],
  },
  {
    label: 'Later',
    items: [
      { value: 'brain', label: 'Brain', description: 'Changes, the brain map and drift findings', icon: <Glyph />, disabled: true },
      { value: 'workflows', label: 'Workflows', description: 'Runs and their steps', icon: <Glyph />, disabled: true },
    ],
  },
]

function OpenDrawer() {
  return (
    <main className={page}>
      <MoreDrawer groups={groups} selected="artifacts" open />
      {Object.entries(swatches).map(([name, className]) => (
        <span key={name} hidden data-swatch={name} className={className} />
      ))}
    </main>
  )
}

function swatch(name: string) {
  const el = document.querySelector(`[data-swatch="${name}"]`)
  if (el === null) throw new Error(`no ${name} swatch`)
  return getComputedStyle(el).backgroundColor
}

function item(drawer: HTMLElement, name: RegExp) {
  return within(drawer).getByRole('button', { name })
}

const meta = {
  title: 'Overlays/More drawer',
  component: OpenDrawer,
  play: async () => {
    // The drawer renders in a portal, outside the story's canvas.
    const body = within(document.body)
    const drawer = await body.findByRole('dialog', { name: 'More' })
    await motionDone(drawer)
    // Put the runner's pointer on the title row, which has no hover style, before the items' idle fills are read.
    // Dark and Light also run in the Storybook UI, where restPointerOn does nothing.
    const titleRow = drawer.querySelector('.bottom-sheet__header')
    if (titleRow === null) throw new Error('no title row')
    await restPointerOn(titleRow)
    const box = drawer.getBoundingClientRect()
    await expect(box.width).toBe(window.innerWidth)
    await expect(Math.round(box.bottom)).toBe(window.innerHeight)
    const style = getComputedStyle(drawer)
    await expect(style.borderTopLeftRadius).toBe('16px')
    await expect(style.paddingTop).toBe('10px')
    await expect(style.paddingLeft).toBe('12px')
    await expect(style.paddingBottom).toBe('34px')
    await expect(style.rowGap).toBe('4px')
    await expect(getComputedStyle(within(drawer).getByText('More')).fontSize).toBe('20px')
    // The grabber (415:317): 36x5, centred 10 below the top edge (Figma 9, inside the 1 px
    // border), with 6 below it (415:316) and the 4 px gap before the title row.
    const grabber = drawer.querySelector('.bottom-sheet__grabber')
    const header = drawer.querySelector('.bottom-sheet__header')
    if (grabber === null || header === null) throw new Error('no grabber or title row')
    const g = grabber.getBoundingClientRect()
    await expect([g.width, g.height]).toEqual([36, 5])
    await expect(g.top - box.top).toBe(11)
    await expect(g.left + g.width / 2).toBe(box.left + box.width / 2)
    await expect(grabber).toHaveAttribute('aria-hidden', 'true')
    await expect(header.getBoundingClientRect().top - g.bottom).toBe(10)
    // The selected item: the current page.
    const artifacts = item(drawer, /^Artifacts/)
    await expect(artifacts).toHaveAttribute('aria-current', 'page')
    const a = getComputedStyle(artifacts)
    await expect(a.paddingTop).toBe('12px')
    await expect(a.paddingLeft).toBe('12px')
    await expect(a.borderTopLeftRadius).toBe('10px')
    await expect(a.columnGap).toBe('12px')
    await expect(a.backgroundColor).toBe(swatch('selected'))
    await expect(a.borderTopColor).toBe(swatch('selectedBorder'))
    await expect(within(artifacts).getByText('24')).toBeInTheDocument()
    const tile = artifacts.querySelector('.more-drawer__tile')
    if (!(tile instanceof HTMLElement)) throw new Error('no tile')
    await expect(tile.getBoundingClientRect().width).toBe(36)
    await expect(tile.getBoundingClientRect().height).toBe(36)
    await expect(getComputedStyle(tile).borderTopLeftRadius).toBe('8px')
    await expect(getComputedStyle(tile).backgroundColor).toBe(swatch('tile'))
    // The item label is label, Medium 14/20: Figma's Medium 15/20 (424:6950) keeps its 20 px line.
    const itemLabel = getComputedStyle(within(artifacts).getByText('Artifacts'))
    await expect([itemLabel.fontSize, itemLabel.fontWeight]).toEqual(['14px', '500'])
    await expect(parseFloat(itemLabel.lineHeight)).toBeCloseTo(20, 0)
    const description = within(artifacts).getByText('Every Claude artifact and Codex site')
    await expect(getComputedStyle(description).fontSize).toBe('12px')
    await expect(getComputedStyle(description).color).toBe(swatch('muted'))
    // An idle item: no fill, no border, no aria-current.
    const toolkit = item(drawer, /^Toolkit/)
    await expect(toolkit).not.toHaveAttribute('aria-current')
    await expect(getComputedStyle(toolkit).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    await expect(getComputedStyle(toolkit).borderTopWidth).toBe('0px')
    // Every element in the drawer has its own id.
    const ids = Array.from(drawer.querySelectorAll('[id]'), (el) => el.id)
    await expect(new Set(ids).size).toBe(ids.length)
    // A later item: disabled, dimmed, with the inset tile and no count or chevron.
    const brain = item(drawer, /^Brain/)
    await expect(brain).toBeDisabled()
    await expect(getComputedStyle(brain).opacity).toBe('0.45')
    const brainTile = brain.querySelector('.more-drawer__tile')
    if (!(brainTile instanceof HTMLElement)) throw new Error('no tile')
    await expect(getComputedStyle(brainTile).backgroundColor).toBe(swatch('disabledTile'))
    await expect(brain.querySelector('.more-drawer__chevron')).toBeNull()
    await expect(artifacts.querySelector('.more-drawer__chevron')).not.toBeNull()
    // The "Later" label names its list and shows in capitals.
    const later = within(drawer).getByRole('list', { name: 'Later' })
    await expect(within(later).getAllByRole('button')).toHaveLength(2)
    const label = within(drawer).getByText('Later')
    await expect(getComputedStyle(label).textTransform).toBe('uppercase')
    await expect(getComputedStyle(label).fontSize).toBe('11px')
    await expect(getComputedStyle(label).paddingTop).toBe('16px')
    // No footer when none is given.
    await expect(drawer.querySelector('.more-drawer__footer')).toBeNull()
  },
} satisfies Meta<typeof OpenDrawer>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

// Two groups with the same label; the first is removed, as when a page ships.
function Regroup() {
  const [first, setFirst] = useState(true)
  const later = (value: string, label: string): MoreDrawerGroup => ({ label: 'Later', items: [{ value, label, icon: <Glyph />, disabled: true }] })
  const current: MoreDrawerGroup = { items: [{ value: 'artifacts', label: 'Artifacts', icon: <Glyph /> }] }
  return (
    <main className={page}>
      <Button
        onClick={() => {
          setFirst(false)
        }}
      >
        Ship Brain
      </Button>
      <MoreDrawer groups={first ? [later('brain', 'Brain'), later('workflows', 'Workflows'), current] : [current, later('workflows', 'Workflows')]} open />
    </main>
  )
}

/** A removed group goes away even when another group has the same label. */
export const Regrouped: StoryObj<typeof meta> = {
  render: () => <Regroup />,
  play: async ({ canvasElement }) => {
    const body = within(document.body)
    const drawer = await body.findByRole('dialog', { name: 'More' })
    await expect(within(drawer).getAllByRole('button').map((b) => b.textContent)).toEqual(['Brain', 'Workflows', 'Artifacts'])
    // The drawer is modal, so the button behind it takes a click only through the DOM.
    within(canvasElement).getByRole('button', { name: 'Ship Brain', hidden: true }).click()
    await waitFor(() => expect(within(drawer).getAllByRole('button').map((b) => b.textContent)).toEqual(['Artifacts', 'Workflows']))
  },
  globals: { mode: 'dark' },
}

const onSelect = fn<(value: string) => void>()
const onOpenChange = fn<(open: boolean) => void>()

/** The More tab opens the drawer; picking a page calls onSelect and closes it; a later page cannot be picked. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <MoreDrawer groups={groups} selected="artifacts" onSelect={onSelect} onOpenChange={onOpenChange} trigger={<Button>More</Button>} />
    </main>
  ),
  play: async ({ canvasElement }) => {
    onSelect.mockClear()
    onOpenChange.mockClear()
    const canvas = within(canvasElement)
    const body = within(document.body)
    const trigger = canvas.getByRole('button', { name: 'More' })
    await userEvent.click(trigger)
    let drawer = await body.findByRole('dialog', { name: 'More' })
    await expect(onOpenChange).toHaveBeenLastCalledWith(true)
    // A later page does nothing and the drawer stays open.
    await userEvent.click(item(drawer, /^Brain/), { pointerEventsCheck: 0 })
    await expect(onSelect).not.toHaveBeenCalled()
    await expect(body.getByRole('dialog', { name: 'More' })).toBeInTheDocument()
    // A click on a page reports it and closes the drawer.
    await userEvent.click(item(drawer, /^Toolkit/))
    await expect(onSelect).toHaveBeenLastCalledWith('toolkit')
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await expect(onOpenChange).toHaveBeenLastCalledWith(false)
    await waitFor(() => expect(trigger).toHaveFocus())
    // Enter on the focused page picks it too.
    await userEvent.click(trigger)
    drawer = await body.findByRole('dialog', { name: 'More' })
    const artifacts = item(drawer, /^Artifacts/)
    await waitFor(() => expect(drawer.contains(document.activeElement)).toBe(true))
    artifacts.focus()
    await userEvent.keyboard('{Enter}')
    await expect(onSelect).toHaveBeenLastCalledWith('artifacts')
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
  },
}

// Toolkit M4 (424:6940): idle items 62 high (429:512), the selected one 64 (424:6945) with its 1 px border, 4
// apart; the 36 px tile 12 in on an idle item, 13 on the selected one; the title (20) over the description (16),
// 22 apart. Figma draws no focus ring when the drawer opens: the drawer itself has the focus, and Tab moves to the
// first item.
const spacingPlay: StoryObj<typeof meta>['play'] = async () => {
  const body = within(document.body)
  const drawer = await body.findByRole('dialog', { name: 'More' })
  // Measure where the sheet rests, not a frame of its slide.
  await motionDone(drawer)
  await waitFor(() => expect(document.activeElement).toBe(drawer))
  await expect(drawer.querySelector(':focus-visible')).toBeNull()
  const artifacts = item(drawer, /^Artifacts/)
  const toolkit = item(drawer, /^Toolkit/)
  const brain = item(drawer, /^Brain/)
  const workflows = item(drawer, /^Workflows/)
  const a = artifacts.getBoundingClientRect()
  const t = toolkit.getBoundingClientRect()
  await expect([a.height, t.height, brain.getBoundingClientRect().height, workflows.getBoundingClientRect().height]).toEqual([64, 62, 62, 62])
  await expect(t.top - a.bottom).toBe(4)
  await expect(workflows.getBoundingClientRect().top - brain.getBoundingClientRect().bottom).toBe(4)
  const tileIn = (el: HTMLElement) => {
    const tile = el.querySelector('.more-drawer__tile')
    if (tile === null) throw new Error('no tile')
    return tile.getBoundingClientRect().left - el.getBoundingClientRect().left
  }
  await expect([tileIn(artifacts), tileIn(toolkit)]).toEqual([13, 12])
  const title = within(toolkit).getByText('Toolkit').getBoundingClientRect()
  const description = within(toolkit).getByText('Agents, skills, workflows, rules and hooks').getBoundingClientRect()
  await expect([title.height, description.height, description.top - title.top]).toEqual([20, 16, 22])
  // Tab moves to the first item, which then draws its ring.
  await userEvent.tab()
  await expect(artifacts).toHaveFocus()
  await expect(getComputedStyle(artifacts).outlineStyle).toBe('solid')
}

/** The drawer's spacing (Toolkit M4) and its first focus: the drawer itself, with no focus ring on an item. */
export const SpacingDark: StoryObj<typeof meta> = { play: spacingPlay, globals: { mode: 'dark' } }
export const SpacingLight: StoryObj<typeof meta> = { play: spacingPlay, globals: { mode: 'light' } }

const onNotifications = fn<(checked: boolean) => void>()

function NotificationsDrawer() {
  const [on, setOn] = useState(false)
  return (
    <main className={page}>
      <MoreDrawer
        groups={groups}
        selected="artifacts"
        onSelect={onSelect}
        onOpenChange={onOpenChange}
        open
        footer={
          <Switch
            label="Notifications"
            hint="Push alerts on this device"
            checked={on}
            onCheckedChange={(next) => {
              setOn(next)
              onNotifications(next)
            }}
          />
        }
      />
    </main>
  )
}

// The Notifications setting of d-118 in the drawer's footer: 16 below the last group, padded 12 at the sides as
// the items are, so the label lines up with their tiles. Toggling it reports the state and leaves the drawer open,
// and picks no page.
const footerPlay: StoryObj<typeof meta>['play'] = async () => {
  onSelect.mockClear()
  onOpenChange.mockClear()
  onNotifications.mockClear()
  const body = within(document.body)
  const drawer = await body.findByRole('dialog', { name: 'More' })
  await motionDone(drawer)
  const toggle = within(drawer).getByRole('switch', { name: 'Notifications' })
  await expect(toggle).toHaveAccessibleDescription('Push alerts on this device')
  const footer = drawer.querySelector('.more-drawer__footer')
  if (!(footer instanceof HTMLElement)) throw new Error('no footer')
  const last = item(drawer, /^Workflows/).getBoundingClientRect()
  const row = toggle.closest('label')
  if (row === null) throw new Error('no switch row')
  const r = row.getBoundingClientRect()
  // The sheet's 4 px gap and the footer's 16.
  await expect(r.top - last.bottom).toBe(20)
  const tile = item(drawer, /^Toolkit/).querySelector('.more-drawer__tile')
  if (tile === null) throw new Error('no tile')
  await expect(r.left).toBe(tile.getBoundingClientRect().left)
  await expect(Math.round(r.right)).toBe(Math.round(last.right - 12))
  await userEvent.click(within(row).getByText('Notifications'))
  await expect(onNotifications).toHaveBeenLastCalledWith(true)
  await expect(toggle).toBeChecked()
  toggle.focus()
  await userEvent.keyboard(' ')
  await expect(onNotifications).toHaveBeenLastCalledWith(false)
  await expect(body.getByRole('dialog', { name: 'More' })).toBeInTheDocument()
  await expect(onOpenChange).not.toHaveBeenCalled()
  await expect(onSelect).not.toHaveBeenCalled()
}

/** A footer below the groups, such as the Notifications switch (d-118); a control in it does not close the drawer. */
export const FooterDark: StoryObj<typeof meta> = { render: () => <NotificationsDrawer />, play: footerPlay, globals: { mode: 'dark' } }
export const FooterLight: StoryObj<typeof meta> = { render: () => <NotificationsDrawer />, play: footerPlay, globals: { mode: 'light' } }
