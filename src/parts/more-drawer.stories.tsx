import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
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
    await expect(getComputedStyle(within(artifacts).getByText('Artifacts')).fontSize).toBe('14px')
    const description = within(artifacts).getByText('Every Claude artifact and Codex site')
    await expect(getComputedStyle(description).fontSize).toBe('12px')
    await expect(getComputedStyle(description).color).toBe(swatch('muted'))
    // An idle item: no fill, a transparent border, no aria-current.
    const toolkit = item(drawer, /^Toolkit/)
    await expect(toolkit).not.toHaveAttribute('aria-current')
    await expect(getComputedStyle(toolkit).backgroundColor).toBe('rgba(0, 0, 0, 0)')
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
