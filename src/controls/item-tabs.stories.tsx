import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { ItemTabs } from './item-tabs'

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
