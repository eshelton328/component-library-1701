import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { ViewSwitch } from './view-switch'

const page = css({ bg: 'bg.canvas', p: '24', display: 'grid', gap: '16', justifyItems: 'start' })
const pane = css({ bg: 'surface.pane', p: '16', borderRadius: 'xl' })

function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1" />
      <rect x="9" y="2.5" width="4.5" height="4.5" rx="1" />
      <rect x="2.5" y="9" width="4.5" height="4.5" rx="1" />
      <rect x="9" y="9" width="4.5" height="4.5" rx="1" />
    </svg>
  )
}
function ListIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 4h10M3 8h10M3 12h10" />
    </svg>
  )
}

const gridList = [
  { value: 'grid', label: 'Grid', icon: <GridIcon /> },
  { value: 'list', label: 'List', icon: <ListIcon /> },
] as const
const views = [
  { value: 'list', label: 'List' },
  { value: 'map', label: 'Map' },
  { value: 'activity', label: 'Activity' },
] as const
const sizes = ['sm', 'md', 'lg'] as const

function Switches() {
  return (
    <main className={page}>
      <ViewSwitch label="Artifact view" items={gridList} defaultValue="grid" />
      <div className={pane}>
        <ViewSwitch label="Toolkit view" items={views} defaultValue="map" />
      </div>
      <ViewSwitch label="Explain or code" items={[{ value: 'explain', label: 'Explain' }, { value: 'code', label: 'Code', disabled: true }]} defaultValue="explain" />
      <ViewSwitch label="Disabled view" items={views} defaultValue="list" disabled />
      {sizes.map((s) => (
        <ViewSwitch key={s} size={s} label={`View, ${s}`} items={views} defaultValue="list" />
      ))}
    </main>
  )
}

const meta = {
  title: 'Forms/View switch',
  component: Switches,
  play: async ({ canvasElement }) => {
    // The sizes come from a list, so their CSS comes only from staticCss.
    const heights = sizes.map((s) => within(canvasElement).getByRole('radiogroup', { name: `View, ${s}` }).getBoundingClientRect().height)
    await expect(heights).toEqual([28, 32, 36])
    // Each item fills the group's height inside its 2 px padding.
    for (const s of sizes) {
      const group = within(canvasElement).getByRole('radiogroup', { name: `View, ${s}` })
      const label = within(group).getAllByRole('radio')[0]?.closest('label')
      if (!(label instanceof HTMLElement)) throw new Error('no item')
      await expect(label.getBoundingClientRect().height).toBe(group.clientHeight - 4)
    }
    const code = within(canvasElement).getByRole('radio', { name: 'Code' })
    await expect(code).toBeDisabled()
    await expect(getComputedStyle(code.closest('label') ?? code).opacity).toBe('0.45')
    // A disabled group dims each item once, not the group and its items.
    const group = within(canvasElement).getByRole('radiogroup', { name: 'Disabled view' })
    const item = within(group).getByRole('radio', { name: 'Map' })
    await expect(getComputedStyle(group).opacity).toBe('1')
    await expect(getComputedStyle(item.closest('label') ?? item).opacity).toBe('0.45')
  },
} satisfies Meta<typeof Switches>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onValueChange = fn<(value: string) => void>()

function Controlled() {
  const [value, setValue] = useState('list')
  return (
    <main className={page}>
      <ViewSwitch
        label="Toolkit view"
        items={views}
        value={value}
        onValueChange={(v) => {
          setValue(v)
          onValueChange(v)
        }}
      />
    </main>
  )
}

/** A click and the arrow keys pick a view; the switch reports the value. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    onValueChange.mockClear()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('radio', { name: 'List' })).toBeChecked()
    await userEvent.click(canvas.getByText('Map'))
    await expect(onValueChange).toHaveBeenLastCalledWith('map')
    await expect(canvas.getByRole('radio', { name: 'Map' })).toBeChecked()
    await userEvent.keyboard('{ArrowRight}')
    await expect(onValueChange).toHaveBeenLastCalledWith('activity')
    await expect(canvas.getByRole('radio', { name: 'Activity' })).toBeChecked()
  },
}

const onFormChange = fn<(value: string) => void>()

/** A form reset with no default reports nothing, because no view is picked. */
export const FormReset: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <form>
        <ViewSwitch label="Artifact view" items={gridList} onValueChange={onFormChange} />
        <button type="reset">Reset</button>
      </form>
    </main>
  ),
  play: async ({ canvasElement }) => {
    onFormChange.mockClear()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText('Grid'))
    await expect(onFormChange).toHaveBeenLastCalledWith('grid')
    await userEvent.click(canvas.getByRole('button', { name: 'Reset' }))
    await expect(onFormChange).toHaveBeenCalledTimes(1)
  },
}

// The Toolkit switch (D1 425:18, T1 428:12): `size="lg"` with icons and `tone="accent"`. Figma's items are 30
// high with 15 px icons (16 here) and 10 px sides, and the selected List (425:19) has the selected fill with no
// border and a cyan label and icon. The default tone beside it keeps its border and fg.default label.
const toneSwatches = {
  accent: css({ color: 'fg.accent' }),
  default: css({ color: 'fg.default' }),
  selected: css({ color: 'surface.selected' }),
}
const toolkitViews = [
  { value: 'list', label: 'List', icon: <ListIcon /> },
  { value: 'map', label: 'Map', icon: <GridIcon /> },
  { value: 'activity', label: 'Activity', icon: <GridIcon /> },
] as const

function Tones() {
  return (
    <main className={page}>
      <ViewSwitch label="Toolkit view, accent" size="lg" tone="accent" items={toolkitViews} defaultValue="list" />
      <ViewSwitch label="Toolkit view, default" size="lg" items={toolkitViews} defaultValue="list" />
      <ViewSwitch label="Artifact view, md" items={gridList} defaultValue="grid" />
      <div hidden>
        {Object.entries(toneSwatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

function toneSwatch(name: string) {
  const el = document.querySelector(`[data-swatch="${name}"]`)
  if (el === null) throw new Error(`no ${name} swatch`)
  return getComputedStyle(el).color
}

function itemOf(group: HTMLElement, name: string) {
  const label = within(group).getByRole('radio', { name }).closest('label')
  if (!(label instanceof HTMLElement)) throw new Error(`no ${name} item`)
  return label
}

const tonesPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const accent = canvas.getByRole('radiogroup', { name: 'Toolkit view, accent' })
  const plain = canvas.getByRole('radiogroup', { name: 'Toolkit view, default' })
  await expect(accent.getBoundingClientRect().height).toBe(36)
  // The selected accent item: the selected fill, no border, the label and icon in fg.accent.
  const list = itemOf(accent, 'List')
  const l = getComputedStyle(list)
  await expect(l.backgroundColor).toBe(toneSwatch('selected'))
  await expect(l.borderTopWidth).toBe('0px')
  await expect(l.color).toBe(toneSwatch('accent'))
  await expect(getComputedStyle(within(list).getByText('List')).color).toBe(toneSwatch('accent'))
  const icon = list.querySelector('svg')
  if (icon === null) throw new Error('no icon')
  await expect(getComputedStyle(icon).stroke).toBe(toneSwatch('accent'))
  // lg draws 16 px icons; the items are 30 high, with 10 px sides and 6 between the icon and the label.
  await expect([icon.getBoundingClientRect().width, icon.getBoundingClientRect().height]).toEqual([16, 16])
  await expect(list.getBoundingClientRect().height).toBe(30)
  await expect([l.paddingLeft, l.paddingRight, l.columnGap]).toEqual(['10px', '10px', '6px'])
  // An idle accent item has no border and stays fg.muted.
  await expect(getComputedStyle(itemOf(accent, 'Map')).borderTopWidth).toBe('0px')
  // The default tone keeps its 1 px border and the fg.default label.
  const plainList = getComputedStyle(itemOf(plain, 'List'))
  await expect(plainList.borderTopWidth).toBe('1px')
  await expect(plainList.color).toBe(toneSwatch('default'))
  // md keeps its 12 px icons.
  const md = canvas.getByRole('radiogroup', { name: 'Artifact view, md' })
  const mdIcon = itemOf(md, 'Grid').querySelector('svg')
  if (mdIcon === null) throw new Error('no icon')
  await expect(mdIcon.getBoundingClientRect().width).toBe(12)
}

/** `size="lg"` with `tone="accent"`: the Toolkit switch, its selected item cyan with no border. */
export const AccentDark: StoryObj<typeof meta> = { render: () => <Tones />, play: tonesPlay, globals: { mode: 'dark' } }
export const AccentLight: StoryObj<typeof meta> = { render: () => <Tones />, play: tonesPlay, globals: { mode: 'light' } }
