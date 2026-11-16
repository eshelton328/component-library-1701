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
    const code = within(canvasElement).getByRole('radio', { name: 'Code' })
    await expect(code).toBeDisabled()
    await expect(getComputedStyle(code.closest('label') ?? code).opacity).toBe('0.45')
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
