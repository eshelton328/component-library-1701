import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { HomeIcon, InboxIcon, MoreIcon, ProjectsIcon, WorkspacesIcon } from '../foundations/icons'
import { Logo } from './logo'
import type { NavItem } from './nav-item'
import { NavRail } from './nav-rail'
import { expectScrollAreas } from '../controls/scroll-area.testing'

const page = css({ display: 'flex', overflow: 'hidden', bg: 'bg.canvas', color: 'fg.default', w: 'shell.dialogLg', h: 'shell.dialogLg' })
// Content as wide as the page, so the rail must keep its own width.
const wide = css({ flex: '1', minW: 'shell.dialogLg' })
// Swatches of the expected tokens, so the play functions compare resolved colours.
const swatches = {
  chrome: css({ bg: 'surface.chrome' }),
  border: css({ bg: 'border.default' }),
  selected: css({ bg: 'surface.selected' }),
  accent: css({ bg: 'fg.accent' }),
  muted: css({ bg: 'fg.muted' }),
  needsYou: css({ bg: 'status.needsYou.fg' }),
  ring: css({ bg: 'surface.overlay' }),
  onAccent: css({ bg: 'fg.onAccent' }),
}

// The rail of Inbox desktop (346:105) with Home added (d-047): Inbox selected, with 3 that need Erik.
const items: readonly NavItem[] = [
  { value: 'home', label: 'Home', icon: <HomeIcon /> },
  { value: 'inbox', label: 'Inbox', icon: <InboxIcon />, badge: 3 },
  { value: 'workspaces', label: 'Workspaces', icon: <WorkspacesIcon />, badge: 0.5 },
  { value: 'projects', label: 'Projects', icon: <ProjectsIcon />, badge: 120 },
  { value: 'more', label: 'More', icon: <MoreIcon /> },
]

function Swatches() {
  return (
    <div hidden>
      {Object.entries(swatches).map(([name, className]) => (
        <span key={name} data-swatch={name} className={className} />
      ))}
    </div>
  )
}

function Rail() {
  return (
    <main className={page}>
      <NavRail items={items} selected="inbox" logo={<Logo title="Span" />} />
      <div className={wide} />
      <Swatches />
    </main>
  )
}

function swatch(name: string) {
  const el = document.querySelector(`[data-swatch="${name}"]`)
  if (el === null) throw new Error(`no ${name} swatch`)
  return getComputedStyle(el).backgroundColor
}

function slot(root: Element, name: string) {
  const el = root.querySelector(`.nav-rail__${name}`)
  if (!(el instanceof HTMLElement)) throw new Error(`no ${name}`)
  return el
}

const meta = {
  title: 'Navigation/Nav rail',
  component: Rail,
  play: async ({ canvasElement }) => {
    // The rail scrolls with no scroll bar and keeps a scroll at its end from moving the page.
    await expectScrollAreas(canvasElement, 'both', '.nav-rail__root')
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', { name: 'Main' })
    // The rail: 64 wide, surface.chrome, a 1 px border.default on the right, padding 16 / 6, gap 6.
    const rail = getComputedStyle(nav)
    await expect(nav.getBoundingClientRect().width).toBe(64)
    await expect(rail.backgroundColor).toBe(swatch('chrome'))
    await expect([rail.borderRightWidth, rail.borderRightColor]).toEqual(['1px', swatch('border')])
    await expect(rail.borderLeftWidth).toBe('0px')
    await expect([rail.paddingTop, rail.paddingBottom, rail.paddingLeft, rail.paddingRight]).toEqual(['16px', '16px', '6px', '6px'])
    await expect(rail.rowGap).toBe('6px')
    // The logo, then a line (Figma 28 px; 27 here, as the 1 px border narrows the column) in border.default, 4 px above the items.
    const logo = canvas.getByRole('img', { name: 'Span' })
    await expect(logo).toBeInTheDocument()
    // The Span logo (402:15331): 28 px, centred in the rail, the bridge in fg.accent.
    await expect([logo.getBoundingClientRect().width, logo.getBoundingClientRect().height]).toEqual([28, 28])
    const logoBox = logo.getBoundingClientRect()
    const logoSlot = slot(nav, 'logo').getBoundingClientRect()
    await expect(logoBox.left - logoSlot.left).toBeCloseTo(logoSlot.right - logoBox.right, 1)
    await expect(getComputedStyle(logo).stroke).toBe(swatch('accent'))
    const divider = slot(nav, 'divider')
    await expect(divider.getBoundingClientRect().width).toBe(27)
    await expect(getComputedStyle(divider).borderTopColor).toBe(swatch('border'))
    await expect(getComputedStyle(divider).marginBottom).toBe('4px')
    // Each item is a button in a list, in order.
    const buttons = within(nav).getAllByRole('button')
    await expect(buttons.map((b) => b.textContent)).toEqual(['Home', '3Inbox, 3 need you', 'Workspaces', '9+Projects, 120 need you', 'More'])
    // The selected item: 51 wide, 50 high (Figma 424:115), radius 10, padding 6 / 6 with 2 between the icon and
    // the label, surface.selected, label in fg.accent. The items are 56 apart, as Figma's (424:115 to 424:144).
    const inbox = canvas.getByRole('button', { name: /^Inbox ?, 3 need you$/ })
    await expect(inbox).toHaveAttribute('aria-current', 'page')
    await expect(inbox).toHaveAttribute('type', 'button')
    const box = inbox.getBoundingClientRect()
    await expect(box.width).toBe(51)
    await expect(box.height).toBe(50)
    const tops = buttons.map((b) => b.getBoundingClientRect().top)
    await expect(tops.slice(1).map((t, i) => t - (tops[i] ?? 0))).toEqual([56, 56, 56, 56])
    const s = getComputedStyle(inbox)
    await expect(s.borderTopLeftRadius).toBe('10px')
    await expect([s.paddingTop, s.paddingBottom]).toEqual(['6px', '6px'])
    await expect(s.rowGap).toBe('2px')
    await expect(s.backgroundColor).toBe(swatch('selected'))
    const label = slot(inbox, 'label')
    const l = getComputedStyle(label)
    await expect(l.color).toBe(swatch('accent'))
    await expect([l.fontSize, l.fontWeight]).toEqual(['9px', '500'])
    // railLabel stores its 12 px line as the ratio 1.3334 for the Figma export.
    await expect(Number.parseFloat(l.lineHeight)).toBeCloseTo(12, 2)
    // The icon is 24 px and takes the item's colour.
    const svg = inbox.querySelector('svg')
    if (svg === null) throw new Error('no icon')
    await expect([svg.getBoundingClientRect().width, svg.getBoundingClientRect().height]).toEqual([24, 24])
    await expect(getComputedStyle(svg).stroke).toBe(swatch('accent'))
    // The badge: status.needsYou.fg with a 2 px surface.overlay ring and the digit in fg.onAccent, Semibold 10,
    // 16 px from the icon's left edge and 4 px above it.
    const badge = within(inbox).getByText('3')
    const b = getComputedStyle(badge)
    await expect(badge).toHaveAttribute('aria-hidden', 'true')
    await expect(b.backgroundColor).toBe(swatch('needsYou'))
    await expect([b.borderTopWidth, b.borderTopColor]).toEqual(['2px', swatch('ring')])
    await expect(b.color).toBe(swatch('onAccent'))
    await expect([b.fontSize, b.fontWeight]).toEqual(['10px', '600'])
    await expect([b.paddingLeft, b.paddingTop]).toEqual(['2px', '0px'])
    const icon = slot(inbox, 'icon').getBoundingClientRect()
    const badgeBox = badge.getBoundingClientRect()
    await expect(badgeBox.left - icon.left).toBe(16)
    await expect(badgeBox.top - icon.top).toBe(-4)
    await expect(badgeBox.height).toBe(16)
    // One digit makes a circle, not an oval.
    await expect(badgeBox.width).toBe(16)
    // An idle item: no fill, label and icon in fg.muted, no aria-current.
    const home = canvas.getByRole('button', { name: 'Home' })
    await expect(home).not.toHaveAttribute('aria-current')
    await expect(getComputedStyle(home).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    await expect(getComputedStyle(slot(home, 'label')).color).toBe(swatch('muted'))
    // A count below 1 shows no badge and keeps the plain name.
    const workspaces = canvas.getByRole('button', { name: 'Workspaces' })
    await expect(workspaces.querySelector('.nav-badge')).toBeNull()
    // The longest label shows in full (no ellipsis) and stays inside the rail, as in Figma.
    const wsLabel = slot(workspaces, 'label')
    await expect(wsLabel.scrollWidth).toBeLessThanOrEqual(wsLabel.getBoundingClientRect().width + 0.5)
    await expect(wsLabel.getBoundingClientRect().left).toBeGreaterThanOrEqual(nav.getBoundingClientRect().left)
    await expect(wsLabel.getBoundingClientRect().right).toBeLessThanOrEqual(nav.getBoundingClientRect().right)
    // A count above 9 shows 9+, and the badge stays inside the rail, which does not scroll sideways.
    const projects = canvas.getByRole('button', { name: /^Projects ?, 120 need you$/ })
    const capped = within(projects).getByText('9+').getBoundingClientRect()
    await expect(capped.right).toBeLessThanOrEqual(nav.getBoundingClientRect().right - 1)
    await expect(nav.scrollWidth).toBe(nav.clientWidth)
  },
} satisfies Meta<typeof Rail>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onSelect = fn()

function Selectable() {
  const [selected, setSelected] = useState('home')
  return (
    <main className={page}>
      <NavRail
        items={[
          { value: 'home', label: 'Home', icon: <HomeIcon /> },
          { value: 'inbox', label: 'Inbox', icon: <InboxIcon />, badge: 1 },
          { value: 'more', label: 'More', icon: <MoreIcon /> },
          { value: 'settings', label: 'Workspace settings', icon: <WorkspacesIcon /> },
          { value: 'long', label: 'Superlongsinglewordlabel', icon: <ProjectsIcon /> },
        ]}
        selected={selected}
        onSelect={(value) => {
          onSelect(value)
          setSelected(value)
        }}
        label="Pages"
      />
    </main>
  )
}

/** Picking an item calls `onSelect` with its value; the caller moves the selection. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => <Selectable />,
  play: async ({ canvasElement }) => {
    onSelect.mockClear()
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', { name: 'Pages' })
    // No logo, no line.
    await expect(nav.querySelector('.nav-rail__divider')).toBeNull()
    await expect(nav.querySelector('.nav-rail__logo')).toBeNull()
    const inbox = canvas.getByRole('button', { name: /^Inbox ?, 1 needs you$/ })
    await userEvent.click(inbox)
    await expect(onSelect).toHaveBeenCalledWith('inbox')
    await expect(inbox).toHaveAttribute('aria-current', 'page')
    await expect(canvas.getByRole('button', { name: 'Home' })).not.toHaveAttribute('aria-current')
    // The keyboard reaches each item and Enter picks it.
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'More' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(onSelect).toHaveBeenLastCalledWith('more')
    await expect(onSelect).toHaveBeenCalledTimes(2)
    // Long labels stay inside the rail: two words wrap to two lines, and a word wider than the rail breaks.
    const box = nav.getBoundingClientRect()
    for (const name of ['Workspace settings', 'Superlongsinglewordlabel']) {
      const label = slot(canvas.getByRole('button', { name }), 'label').getBoundingClientRect()
      await expect(label.left).toBeGreaterThanOrEqual(box.left)
      await expect(label.right).toBeLessThanOrEqual(box.right)
    }
    const twoWords = slot(canvas.getByRole('button', { name: 'Workspace settings' }), 'label')
    await expect(twoWords.getBoundingClientRect().height).toBeGreaterThan(Number.parseFloat(getComputedStyle(twoWords).lineHeight) * 1.5)
    await expect(nav.scrollWidth).toBe(nav.clientWidth)
  },
}
