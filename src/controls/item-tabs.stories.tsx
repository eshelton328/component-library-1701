import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { ItemTabs } from './item-tabs'
import { expectScrollAreas } from './scroll-area.testing'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', display: 'grid', gap: '24', justifyItems: 'start' })
const pane = css({ bg: 'surface.pane', p: '16', borderRadius: 'xl' })
// A phone-width frame, so the list must scroll.
const narrow = css({ bg: 'surface.pane', p: '12', borderRadius: 'xl', w: 'shell.sidebar' })

const sections = [
  { value: 'overview', label: 'Overview', content: <p>A skill that syncs tokens to Figma.</p> },
  { value: 'files', label: 'Files', content: <p>SKILL.md, scripts/check-run</p> },
  { value: 'runs', label: 'Runs', content: <p>Three runs this week.</p> },
  { value: 'evals', label: 'Evals', content: <p>Two cases.</p> },
] as const
const withDisabled = [...sections.slice(0, 2), { value: 'history', label: 'History', content: <p>None.</p>, disabled: true }]
const many = ['Overview', 'Files', 'Runs', 'Evals', 'History', 'Settings', 'Permissions'].map((l) => ({ value: l.toLowerCase(), label: l, content: <p>{l}</p> }))
const sizes = ['sm', 'md', 'lg'] as const

function Tabs() {
  return (
    <main className={page}>
      <ItemTabs label="Skill sections" items={sections} />
      <div className={pane}>
        <ItemTabs label="Sections on a pane" items={withDisabled} defaultValue="files" />
      </div>
      <div className={narrow} data-testid="narrow">
        <ItemTabs label="Sections on a phone" items={many} />
      </div>
      {sizes.map((s) => (
        <ItemTabs key={s} size={s} label={`Sections, ${s}`} items={sections} />
      ))}
    </main>
  )
}

const meta = {
  title: 'Navigation/Item tabs',
  component: Tabs,
  play: async ({ canvasElement }) => {
    // The tab list scrolls with no scroll bar and keeps a swipe at its end from moving the page.
    await expectScrollAreas(canvasElement, '.item-tabs__list')
    const canvas = within(canvasElement)
    // The sizes come from a list, so their CSS comes only from staticCss.
    const heights = sizes.map((s) => within(canvas.getByRole('tablist', { name: `Sections, ${s}` })).getByRole('tab', { name: 'Overview' }).getBoundingClientRect().height)
    await expect(heights).toEqual([28, 32, 36])
    const first = within(canvas.getByRole('tablist', { name: 'Skill sections' }))
    await expect(first.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    const history = within(canvas.getByRole('tablist', { name: 'Sections on a pane' })).getByRole('tab', { name: 'History' })
    await expect(history).toBeDisabled()
    await expect(getComputedStyle(history).opacity).toBe('0.45')
    const list = canvas.getByRole('tablist', { name: 'Sections on a phone' })
    await expect(list.scrollWidth).toBeGreaterThan(list.clientWidth)
    await expect(getComputedStyle(list).overflowX).toBe('auto')
  },
} satisfies Meta<typeof Tabs>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onValueChange = fn<(value: string) => void>()

function Controlled() {
  const [value, setValue] = useState('overview')
  return (
    <main className={page}>
      <ItemTabs
        label="Skill sections"
        items={withDisabled}
        value={value}
        onValueChange={(v) => {
          setValue(v)
          onValueChange(v)
        }}
      />
    </main>
  )
}

/** A click and the arrow keys pick a tab, skip a disabled one, and show its panel. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    onValueChange.mockClear()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('A skill that syncs tokens to Figma.')
    await userEvent.click(canvas.getByRole('tab', { name: 'Files' }))
    await expect(onValueChange).toHaveBeenLastCalledWith('files')
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('SKILL.md')
    await expect(canvas.queryByText('A skill that syncs tokens to Figma.')).not.toBeVisible()
    // History is disabled, so the right arrow wraps to Overview. Ark moves
    // the focus in the next animation frame.
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith('overview'))
    await expect(canvas.getByRole('tab', { name: 'Overview' })).toHaveFocus()
    await expect(canvas.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
  },
}

const onLateChange = fn<(value: string) => void>()

function LateItems() {
  const [items, setItems] = useState<readonly { value: string; label: string; content: string; disabled?: boolean }[]>([])
  return (
    <main className={page}>
      <button type="button" onClick={() => { setItems([{ value: '', label: 'Home', content: 'Home panel' }, { value: 'files', label: 'Files', content: 'Files panel' }]) }}>
        Load
      </button>
      <button type="button" onClick={() => { setItems([{ value: '', label: 'Home', content: 'Home panel', disabled: true }, { value: 'files', label: 'Files', content: 'Files panel' }]) }}>
        Disable Home
      </button>
      <ItemTabs label="Late sections" items={items} onValueChange={onLateChange} />
    </main>
  )
}

/** Items that arrive after the first render, an empty value, and a selected tab that becomes disabled. */
export const ChangingItems: StoryObj<typeof meta> = {
  render: () => <LateItems />,
  play: async ({ canvasElement }) => {
    onLateChange.mockClear()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Load' }))
    // The first tab, whose value is '', is selected and in the tab order.
    await expect(canvas.getByRole('tab', { name: 'Home' })).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByRole('tab', { name: 'Home' })).toHaveAttribute('tabindex', '0')
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Home panel')
    canvas.getByRole('tab', { name: 'Home' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(onLateChange).toHaveBeenLastCalledWith('files'))
    await userEvent.keyboard('{ArrowLeft}')
    await waitFor(() => expect(onLateChange).toHaveBeenLastCalledWith(''))
    await expect(canvas.getByRole('tab', { name: 'Home' })).toHaveAttribute('aria-selected', 'true')
    // When the selected tab is disabled, Files is selected and in the tab order.
    await userEvent.click(canvas.getByRole('button', { name: 'Disable Home' }))
    await expect(canvas.getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByRole('tab', { name: 'Files' })).toHaveAttribute('tabindex', '0')
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Files panel')
  },
}

const toolkit = ['Overview', 'How it works', 'Files', 'Links', 'Evals', 'Activity'].map((l) => ({ value: l.toLowerCase(), label: l, content: <p>{l}</p> }))

function Densities() {
  return (
    <main className={page}>
      <ItemTabs label="Default sections" items={toolkit} />
      <ItemTabs density="compact" label="Compact sections" items={toolkit} />
      <div className={narrow}>
        <ItemTabs density="compact" label="Compact sections on a phone" items={toolkit} />
      </div>
    </main>
  )
}

const compact: StoryObj<typeof meta> = {
  render: () => <Densities />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const spacing = (name: string) => {
      const list = canvas.getByRole('tablist', { name })
      const tab = within(list).getByRole('tab', { name: 'Overview' })
      const l = getComputedStyle(list)
      const t = getComputedStyle(tab)
      return { list: [l.paddingTop, l.paddingLeft], gap: l.columnGap, tab: [t.paddingLeft, t.paddingRight, t.borderLeftWidth], height: tab.getBoundingClientRect().height }
    }
    // The default keeps its 2 px list inset and 12 px sides.
    await expect(spacing('Default sections')).toEqual({ list: ['2px', '2px'], gap: '4px', tab: ['12px', '12px', '1px'], height: 32 })
    // Compact starts the tabs at the list's edge, 4 apart, with 10 px sides (M2 464:521, T3 487:365).
    await expect(spacing('Compact sections')).toEqual({ list: ['0px', '0px'], gap: '4px', tab: ['10px', '10px', '1px'], height: 32 })
    const list = canvas.getByRole('tablist', { name: 'Compact sections' })
    const first = within(list).getByRole('tab', { name: 'Overview' })
    await expect(first.getBoundingClientRect().left).toBe(list.getBoundingClientRect().left)
    // The list clips, so the focus ring is drawn inside the tab.
    first.focus()
    await waitFor(() => expect(getComputedStyle(first).outlineStyle).toBe('solid'))
    await expect(getComputedStyle(first).outlineOffset).toBe('-2px')
  },
}

/** `density="compact"`: the Toolkit item's tabs on a phone and a tablet, flush with the list and 10 px at the sides. */
export const CompactDark: StoryObj<typeof meta> = { ...compact, globals: { mode: 'dark' } }
export const CompactLight: StoryObj<typeof meta> = { ...compact, globals: { mode: 'light' } }

// Each swatch has the computed colour of one token, so the play test compares the tabs with the tokens.
const swatches = {
  accent: css({ color: 'fg.accent' }),
  default: css({ color: 'fg.default' }),
  muted: css({ color: 'fg.muted' }),
  selected: css({ color: 'surface.selected' }),
  border: css({ color: 'border.selected' }),
}

function swatch(name: keyof typeof swatches) {
  const el = document.querySelector(`[data-swatch="${name}"]`)
  if (el === null) throw new Error(`no ${name} swatch`)
  return getComputedStyle(el).color
}

function Tones() {
  return (
    <main className={page}>
      <ItemTabs tone="accent" label="Accent sections" items={toolkit} />
      <ItemTabs tone="accent" density="compact" label="Accent compact sections" items={toolkit} />
      <ItemTabs label="Default tone sections" items={toolkit} />
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const accent: StoryObj<typeof meta> = {
  render: () => <Tones />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const tab = (list: string, name: string) => getComputedStyle(within(canvas.getByRole('tablist', { name: list })).getByRole('tab', { name }))
    // The selected accent tab (D3 480:6, T17 487:366): the selected fill, a 1 px border.selected border and the label in fg.accent.
    for (const list of ['Accent sections', 'Accent compact sections']) {
      const selected = tab(list, 'Overview')
      await expect(selected.backgroundColor).toBe(swatch('selected'))
      await expect([selected.borderTopWidth, selected.borderTopStyle]).toEqual(['1px', 'solid'])
      await expect(selected.borderTopColor).toBe(swatch('border'))
      await expect(selected.color).toBe(swatch('accent'))
      // An idle tab has no visible border and stays fg.muted (480:8).
      const idle = tab(list, 'Files')
      await expect(idle.color).toBe(swatch('muted'))
      await expect(idle.borderTopColor).toBe('rgba(0, 0, 0, 0)')
    }
    // The default tone keeps the fg.default label on the same border.
    const plain = tab('Default tone sections', 'Overview')
    await expect(plain.color).toBe(swatch('default'))
    await expect(plain.borderTopColor).toBe(swatch('border'))
  },
}

/** `tone="accent"`: the Toolkit item's selected tab, its label cyan on the selected fill and border. */
export const AccentDark: StoryObj<typeof meta> = { ...accent, globals: { mode: 'dark' } }
export const AccentLight: StoryObj<typeof meta> = { ...accent, globals: { mode: 'light' } }

// The phone's Toolkit item tabs (M27 `item tabs` 492:3974): 12 px in from each side of the 390 px screen, with
// Evals selected. Figma draws a border only on the selected tab: an unselected tab is its label plus 10 at each
// side (`tab · Overview` 492:3975, 82 × 30; How it works 105, Files 51, Links 55, Activity 71), and the selected
// tab adds its 1 px border outside that padding (`tab · Evals` 492:3983, 57 × 32, its label 11 in), so Evals ends
// at 378, the list's edge.
const m27 = { m27: { name: 'Phone (M27)', styles: { width: '390px', height: '844px' } } }
const phoneItem = css({ bg: 'bg.canvas', color: 'fg.default', px: '12', py: '12' })
// Figma's label widths up to the selected tab (492:3976, 492:3978, 492:3980, 492:3982, 492:3984).
const m27Labels = { Overview: 62, 'How it works': 85, Files: 31, Links: 35, Evals: 35 }
// The width of a tab's label text, from the page.
const labelWidth = (tab: HTMLElement) => {
  const range = document.createRange()
  range.selectNodeContents(tab)
  return range.getBoundingClientRect().width
}

function Phone() {
  return (
    <main className={phoneItem}>
      <ItemTabs density="compact" tone="accent" label="Rule sections" items={toolkit} defaultValue="evals" />
    </main>
  )
}

const phonePlay: NonNullable<StoryObj<typeof meta>['play']> = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  await expect(window.innerWidth).toBe(390)
  const list = canvas.getByRole('tablist', { name: 'Rule sections' })
  const box = list.getBoundingClientRect()
  await expect([box.left, box.right]).toEqual([12, 378])
  const tab = (name: string) => within(list).getByRole('tab', { name })
  const evals = tab('Evals')
  // Measure in Geist: load the tabs' own face first. The label widths still differ between machines (CI's Linux
  // Chromium draws each label about 2 px wider than macOS), so every check below is stated from the rendered
  // label widths, not from Figma's absolute widths.
  const font = getComputedStyle(evals)
  const face = `${font.fontWeight} ${font.fontSize} "Geist Variable"`
  const loaded = await document.fonts.load(face, 'Overview How it works Files Links Evals Activity')
  await document.fonts.ready
  await expect(loaded.length).toBeGreaterThan(0)
  await expect(document.fonts.check(face)).toBe(true)
  await expect(evals).toHaveAttribute('aria-selected', 'true')
  const tabs = within(list).getAllByRole('tab')
  await expect(tabs.map((t) => t.textContent)).toEqual(['Overview', 'How it works', 'Files', 'Links', 'Evals', 'Activity'])
  // The selected tab is its label and 10 at each side inside a 1 px border (Figma 492:3983: 22 around the label).
  const r = evals.getBoundingClientRect()
  await expect(r.height).toBe(32)
  const s = getComputedStyle(evals)
  await expect([s.borderLeftWidth, s.paddingLeft]).toEqual(['1px', '10px'])
  await expect(Math.abs(r.width - labelWidth(evals) - 22)).toBeLessThan(0.5)
  // Each unselected tab has no border and is its label and 10 at each side (Figma 492:3975 and its siblings: 20
  // around the label).
  for (const t of tabs.filter((x) => x !== evals)) {
    const w = t.getBoundingClientRect().width
    const name = t.textContent
    await expect(getComputedStyle(t).borderLeftWidth).toBe('0px')
    await expect({ name, chrome: Math.abs(w - labelWidth(t) - 20) < 0.5 }).toEqual({ name, chrome: true })
    await expect(t.getBoundingClientRect().height).toBe(32)
  }
  // The tabs are 4 apart and the first starts at the list's edge (492:3974).
  await expect(tabs[0]?.getBoundingClientRect().left).toBe(box.left)
  for (let i = 1; i < tabs.length; i += 1) {
    const gap = (tabs[i]?.getBoundingClientRect().left ?? 0) - (tabs[i - 1]?.getBoundingClientRect().right ?? 0)
    await expect({ i, gap: Math.abs(gap - 4) < 0.5 }).toEqual({ i, gap: true })
  }
  // Evals's right edge is the list's left plus each tab's label and padding, the selected border and the gaps.
  // With a border on every tab (main's recipe) it would be 2 px further right for each idle tab before it.
  const upToEvals = tabs.slice(0, tabs.indexOf(evals) + 1)
  const labels = upToEvals.reduce((sum, t) => sum + labelWidth(t), 0)
  const gaps = 4 * (upToEvals.length - 1)
  const model = box.left + labels + 20 * upToEvals.length + 2 + gaps
  const everyBorder = box.left + labels + 22 * upToEvals.length + gaps
  await expect(Math.abs(r.right - model)).toBeLessThan(0.5)
  await expect(everyBorder - model).toBe(2 * (upToEvals.length - 1))
  // The list's edge is checked only when the labels are no wider than Figma's (248 in all), as they draw on
  // macOS; then Evals ends inside the list's 378, as in M27. Wider labels (CI's Linux Chromium) move every tab
  // right whatever the border, so the edge proves nothing there.
  // So CI may never run this edge check. The real proof on every machine is the checks above: each idle
  // tab is its label plus 20 with no border, the selected tab its label plus 22 with a 1 px border, and
  // Evals ends where that model puts it, 2 px less for each idle tab than a border on every tab gives.
  const figmaLabels = Object.values(m27Labels).reduce((sum, w) => sum + w, 0)
  if (labels <= figmaLabels) await expect(r.right).toBeLessThanOrEqual(box.right)
  // A newly selected tab takes the same border and padding; the one it leaves drops its border.
  const overview = tab('Overview')
  await userEvent.click(overview)
  await expect(overview).toHaveAttribute('aria-selected', 'true')
  await expect(getComputedStyle(overview).borderLeftWidth).toBe('1px')
  await expect(Math.abs(overview.getBoundingClientRect().width - labelWidth(overview) - 22)).toBeLessThan(0.5)
  await expect(getComputedStyle(evals).borderLeftWidth).toBe('0px')
  await expect(Math.abs(evals.getBoundingClientRect().width - labelWidth(evals) - 20)).toBeLessThan(0.5)
  await expect([overview.getBoundingClientRect().height, evals.getBoundingClientRect().height]).toEqual([32, 32])
}

/** The phone's item tabs (Toolkit M27) on a 390 px screen: a border only on the selected tab, so Evals ends inside the list. */
export const PhoneDark: StoryObj<typeof meta> = {
  render: () => <Phone />,
  play: phonePlay,
  parameters: { viewport: { options: m27 } },
  globals: { mode: 'dark', viewport: { value: 'm27' } },
}
export const PhoneLight: StoryObj<typeof meta> = {
  render: () => <Phone />,
  play: phonePlay,
  parameters: { viewport: { options: m27 } },
  globals: { mode: 'light', viewport: { value: 'm27' } },
}
