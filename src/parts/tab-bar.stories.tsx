import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { ArtifactsIcon, HomeIcon, InboxIcon, MoreIcon, ProjectsIcon, WorkspacesIcon } from '../foundations/icons'
import type { NavItem } from './nav-item'
import { NavRail } from './nav-rail'
import { TabBar } from './tab-bar'
import { expectCutText } from '../controls/tooltip.testing'

// A 360 px phone screen (Figma draws 390) with the bar at the bottom, as the caller places it.
const page = css({ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', bg: 'bg.canvas', color: 'fg.default', w: 'shell.popoverLg', h: 'shell.popoverLg' })
// A scrolling page taller than the screen, above the bar.
const pane = css({ flexGrow: '1', flexShrink: '1', flexBasis: 'auto', overflowY: 'auto' })
const content = css({ h: 'shell.dialogLg' })
// Swatches of the expected tokens, so the play functions compare resolved colours.
const swatches = {
  chrome: css({ bg: 'surface.chrome' }),
  border: css({ bg: 'border.default' }),
  accent: css({ bg: 'fg.accent' }),
  muted: css({ bg: 'fg.muted' }),
  needsYou: css({ bg: 'status.needsYou.fg' }),
  ring: css({ bg: 'surface.overlay' }),
}

// The phone tab bar of Workbench (252:2): Workspaces selected, 3 on Inbox that need Erik.
const items: readonly NavItem[] = [
  { value: 'home', label: 'Home', icon: <HomeIcon /> },
  { value: 'inbox', label: 'Inbox', icon: <InboxIcon />, badge: 3 },
  { value: 'workspaces', label: 'Workspaces', icon: <WorkspacesIcon />, badge: 0 },
  { value: 'projects', label: 'Projects', icon: <ProjectsIcon /> },
  { value: 'more', label: 'More', icon: <MoreIcon /> },
]

function Phone() {
  return (
    <main className={page}>
      <div className={pane}>
        <div className={content} />
      </div>
      <TabBar items={items} selected="workspaces" />
      <Swatches />
    </main>
  )
}

function Swatches() {
  return (
    <div hidden>
      {Object.entries(swatches).map(([name, className]) => (
        <span key={name} data-swatch={name} className={className} />
      ))}
    </div>
  )
}

function swatch(name: string) {
  const el = document.querySelector(`[data-swatch="${name}"]`)
  if (el === null) throw new Error(`no ${name} swatch`)
  return getComputedStyle(el).backgroundColor
}

function slot(root: Element, name: string) {
  const el = root.querySelector(`.tab-bar__${name}`)
  if (!(el instanceof HTMLElement)) throw new Error(`no ${name}`)
  return el
}

const meta = {
  title: 'Navigation/Tab bar',
  component: Phone,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', { name: 'Main' })
    // The bar: 360 x 77 with the home-indicator area, also under a page that scrolls, surface.chrome, a 1 px border.default on top, padding 8 / 8.
    const box = nav.getBoundingClientRect()
    await expect([box.width, box.height]).toEqual([360, 77])
    const bar = getComputedStyle(nav)
    await expect(bar.backgroundColor).toBe(swatch('chrome'))
    await expect([bar.borderTopWidth, bar.borderTopColor]).toEqual(['1px', swatch('border')])
    await expect(bar.borderBottomWidth).toBe('0px')
    await expect([bar.paddingTop, bar.paddingLeft, bar.paddingRight, bar.paddingBottom]).toEqual(['8px', '8px', '8px', '0px'])
    // Five equal tabs sharing the width inside the padding (Figma 252:3: 74.8 of 390), 42 high, in order.
    const tabs = within(nav).getAllByRole('button')
    await expect(tabs.map((t) => t.textContent)).toEqual(['Home', '3Inbox, 3 need you', 'Workspaces', 'Projects', 'More'])
    for (const tab of tabs) {
      const r = tab.getBoundingClientRect()
      await expect(r.width).toBeCloseTo((360 - 16) / 5, 1)
      await expect(r.height).toBe(42)
    }
    // The selected tab: no fill, label and icon in fg.accent, aria-current.
    const workspaces = canvas.getByRole('button', { name: 'Workspaces' })
    await expect(workspaces).toHaveAttribute('aria-current', 'page')
    await expect(workspaces).toHaveAttribute('type', 'button')
    const w = getComputedStyle(workspaces)
    await expect(w.backgroundColor).toBe('rgba(0, 0, 0, 0)')
    await expect([w.paddingTop, w.rowGap]).toEqual(['2px', '4px'])
    const label = getComputedStyle(slot(workspaces, 'label'))
    await expect(label.color).toBe(swatch('accent'))
    await expect([label.fontSize, label.fontWeight, label.lineHeight]).toEqual(['10px', '500', '12px'])
    const svg = workspaces.querySelector('svg')
    if (svg === null) throw new Error('no icon')
    await expect([svg.getBoundingClientRect().width, svg.getBoundingClientRect().height]).toEqual([24, 24])
    await expect(getComputedStyle(svg).stroke).toBe(swatch('accent'))
    // A count of 0 shows no badge.
    await expect(workspaces.querySelector('.nav-badge')).toBeNull()
    // An idle tab: fg.muted, no aria-current.
    const home = canvas.getByRole('button', { name: 'Home' })
    await expect(home).not.toHaveAttribute('aria-current')
    await expect(getComputedStyle(slot(home, 'label')).color).toBe(swatch('muted'))
    // The Inbox badge: status.needsYou.fg with a 2 px surface.overlay ring, 16 px from the icon's left and 4 px above it.
    const inbox = canvas.getByRole('button', { name: /^Inbox ?, 3 need you$/ })
    const badge = within(inbox).getByText('3')
    await expect(badge).toHaveAttribute('aria-hidden', 'true')
    const b = getComputedStyle(badge)
    await expect(b.backgroundColor).toBe(swatch('needsYou'))
    await expect([b.borderTopWidth, b.borderTopColor]).toEqual(['2px', swatch('ring')])
    const icon = slot(inbox, 'icon').getBoundingClientRect()
    const badgeBox = badge.getBoundingClientRect()
    await expect(badgeBox.left - icon.left).toBe(16)
    await expect(badgeBox.top - icon.top).toBe(-4)
    // One digit makes a 16 px circle, not an oval.
    await expect([badgeBox.width, badgeBox.height]).toEqual([16, 16])
  },
} satisfies Meta<typeof Phone>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onSelect = fn()

function Selectable() {
  const [selected, setSelected] = useState('home')
  return (
    <main className={page}>
      <TabBar
        items={items}
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

/** Picking a tab calls `onSelect` with its value; the caller moves the selection. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => <Selectable />,
  play: async ({ canvasElement }) => {
    onSelect.mockClear()
    const canvas = within(canvasElement)
    canvas.getByRole('navigation', { name: 'Pages' })
    const projects = canvas.getByRole('button', { name: 'Projects' })
    await userEvent.click(projects)
    await expect(onSelect).toHaveBeenCalledWith('projects')
    await expect(projects).toHaveAttribute('aria-current', 'page')
    await expect(canvas.getByRole('button', { name: 'Home' })).not.toHaveAttribute('aria-current')
    // The keyboard reaches the next tab and Enter picks it.
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'More' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(onSelect).toHaveBeenLastCalledWith('more')
    await expect(onSelect).toHaveBeenCalledTimes(2)
  },
}

/** A long tab label is cut to one line and shows in full in a tooltip, on hover and on keyboard focus of the tab. */
export const LongLabel: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <TabBar items={[...items.slice(0, 4), { value: 'long', label: 'skill-eval-round-with-held-out-cases-and-a-trigger-set', icon: <MoreIcon /> }]} selected="home" />
    </main>
  ),
  play: async ({ canvasElement }) => {
    const tab = within(canvasElement).getByRole('button', { name: 'skill-eval-round-with-held-out-cases-and-a-trigger-set' })
    const label = tab.querySelector('.tab-bar__label')
    if (label === null) throw new Error('no label')
    await expectCutText(label, 'skill-eval-round-with-held-out-cases-and-a-trigger-set', tab)
  },
}

// A 756 px tablet frame (Figma T01 424:3863 and T1 346:5574): shell.detail (748) and an 8 px end padding. Each bar is
// placed against the padding box, so it spans all 756, as the caller places it at the bottom of the screen.
const tablet = css({ position: 'relative', boxSizing: 'content-box', w: 'shell.detail', pe: '8', h: 'shell.tabBar', bg: 'bg.canvas', color: 'fg.default' })
const tabletBar = css({ position: 'absolute', left: '0', right: '0', top: '0' })
const tablets = css({ display: 'flex', flexDirection: 'column', gap: '16' })

// Toolkit T01's six tabs (424:3864 to 424:3899), Toolkit selected under More.
const sixTabs: readonly NavItem[] = [
  { value: 'home', label: 'Home', icon: <HomeIcon /> },
  { value: 'inbox', label: 'Inbox', icon: <InboxIcon />, badge: 3 },
  { value: 'workspaces', label: 'Workspaces', icon: <WorkspacesIcon /> },
  { value: 'projects', label: 'Projects', icon: <ProjectsIcon /> },
  { value: 'artifacts', label: 'Artifacts', icon: <ArtifactsIcon /> },
  { value: 'more', label: 'More', icon: <MoreIcon /> },
]

function Tablets() {
  return (
    <div className={tablets}>
      <div className={tablet} data-frame="six">
        <div className={tabletBar}>
          <TabBar size="tablet" items={sixTabs} selected="more" label="Six tabs" />
        </div>
      </div>
      <div className={tablet} data-frame="five">
        <div className={tabletBar}>
          <TabBar size="tablet" items={items} selected="inbox" label="Five tabs" />
        </div>
      </div>
      <div className={tablet} data-frame="phone">
        <div className={tabletBar}>
          <TabBar items={items} selected="inbox" label="Phone tabs" />
        </div>
      </div>
    </div>
  )
}

function frame(root: HTMLElement, name: string) {
  const el = root.querySelector(`[data-frame="${name}"]`)
  if (!(el instanceof HTMLElement)) throw new Error(`no ${name} frame`)
  return el.getBoundingClientRect()
}

/**
 * `size="tablet"` on the 756 px frame: the bar spans the frame, and the tabs are one centred group 456 wide from
 * x 150 to 606, six of 76 (Toolkit T01) or five of 91.2 (Inbox T1). Without `size` the tabs still share the
 * whole width, as on the phone.
 */
const tabletPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const cases = [
    { name: 'six', nav: 'Six tabs', count: 6, width: 76 },
    { name: 'five', nav: 'Five tabs', count: 5, width: 91.2 },
  ]
  for (const c of cases) {
    const box = frame(canvasElement, c.name)
    await expect(box.width).toBe(756)
    const nav = canvas.getByRole('navigation', { name: c.nav })
    const bar = nav.getBoundingClientRect()
    await expect([bar.left - box.left, bar.width, bar.height]).toEqual([0, 756, 77])
    const n = getComputedStyle(nav)
    await expect([n.paddingTop, n.paddingLeft, n.paddingRight]).toEqual(['8px', '8px', '8px'])
    await expect(n.backgroundColor).toBe(swatch('chrome'))
    const list = slot(nav, 'list').getBoundingClientRect()
    await expect([list.left - box.left, list.width]).toEqual([150, 456])
    const tabs = within(nav).getAllByRole('button')
    await expect(tabs).toHaveLength(c.count)
    for (const [i, tab] of tabs.entries()) {
      const r = tab.getBoundingClientRect()
      await expect(r.left - box.left).toBeCloseTo(150 + i * c.width, 1)
      await expect(r.width).toBeCloseTo(c.width, 1)
      await expect(r.height).toBe(42)
    }
    const last = tabs.at(-1)?.getBoundingClientRect()
    await expect(last === undefined ? undefined : last.right - box.left).toBeCloseTo(606, 1)
  }
  // The phone default is unchanged: five tabs share the 740 inside the padding, Home at x 8.
  const phoneBox = frame(canvasElement, 'phone')
  const phone = within(canvas.getByRole('navigation', { name: 'Phone tabs' })).getAllByRole('button')
  const first = phone[0]?.getBoundingClientRect()
  await expect(first === undefined ? undefined : [first.left - phoneBox.left, first.width]).toEqual([8, 148])
}

export const TabletDark: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <>
      <Tablets />
      <Swatches />
    </>
  ),
  play: tabletPlay,
}
export const TabletLight: StoryObj<typeof meta> = { ...TabletDark, globals: { mode: 'light' } }

// The names the-bridge's fidelity check measures by, one per Figma tab node; Projects has none.
const named: readonly NavItem[] = [
  { value: 'home', label: 'Home', icon: <HomeIcon />, figma: 'tab · Home' },
  { value: 'inbox', label: 'Inbox', icon: <InboxIcon />, figma: 'tab · Inbox' },
  { value: 'projects', label: 'Projects', icon: <ProjectsIcon /> },
]

/**
 * An item's `figma` is its button's `data-figma`, in the tab bar and the nav rail; an item without one has no
 * `data-figma`, and the name changes nothing on screen.
 */
const figmaPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  for (const name of ['Tabs', 'Rail']) {
    const nav = within(canvas.getByRole('navigation', { name }))
    await expect(nav.getByRole('button', { name: 'Home' })).toHaveAttribute('data-figma', 'tab · Home')
    await expect(nav.getByRole('button', { name: 'Inbox' })).toHaveAttribute('data-figma', 'tab · Inbox')
    await expect(nav.getByRole('button', { name: 'Projects' })).not.toHaveAttribute('data-figma')
  }
  const tabs = within(canvas.getByRole('navigation', { name: 'Tabs' })).getAllByRole('button')
  const [home, , projects] = tabs.map((t) => t.getBoundingClientRect())
  if (home === undefined || projects === undefined) throw new Error('no tabs')
  await expect(home.width).toBeCloseTo(projects.width, 1)
  await expect([home.height, projects.height]).toEqual([42, 42])
  await expect(getComputedStyle(slot(tabs[0] ?? canvasElement, 'label')).color).toBe(swatch('accent'))
}

export const FigmaNameDark: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <NavRail items={named} selected="home" label="Rail" />
      <TabBar items={named} selected="home" label="Tabs" />
      <Swatches />
    </main>
  ),
  play: figmaPlay,
}
export const FigmaNameLight: StoryObj<typeof meta> = { ...FigmaNameDark, globals: { mode: 'light' } }
