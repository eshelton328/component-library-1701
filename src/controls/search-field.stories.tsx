import { Fieldset } from '@ark-ui/react/fieldset'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { SearchField } from './search-field'

const page = css({ bg: 'bg.canvas', p: '24' })
const column = css({ display: 'grid', gap: '16' })
const pane = css({ bg: 'surface.pane', p: '16', borderRadius: 'xl' })

function Magnifier() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5 14 14" />
    </svg>
  )
}

const sizes = ['sm', 'md', 'lg'] as const

function Fields() {
  return (
    <main className={page}>
      <div className={column}>
        <SearchField label="Search the inbox" placeholder="Search" icon={<Magnifier />} />
        <SearchField label="Search artifacts" defaultValue="token sync" icon={<Magnifier />} />
        <SearchField label="Disabled search" placeholder="Search" icon={<Magnifier />} disabled />
        <div className={pane}>
          <SearchField label="Search the toolkit" placeholder="Search the toolkit" icon={<Magnifier />} />
        </div>
        {sizes.map((s) => (
          <SearchField key={s} size={s} label={`Search, ${s}`} placeholder={`Size ${s}`} />
        ))}
      </div>
    </main>
  )
}

const meta = {
  title: 'Forms/Search field',
  component: Fields,
  play: async ({ canvasElement }) => {
    // Every size is in the package CSS: the sizes come from a list.
    const heights = sizes.map((s) => within(canvasElement).getByRole('searchbox', { name: `Search, ${s}` }).parentElement?.getBoundingClientRect().height)
    await expect(heights).toEqual([28, 32, 36])
    const disabled = within(canvasElement).getByRole('searchbox', { name: 'Disabled search' })
    await expect(disabled).toBeDisabled()
    await expect(getComputedStyle(disabled.parentElement ?? disabled).opacity).toBe('0.45')
  },
} satisfies Meta<typeof Fields>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onValueChange = fn<(value: string) => void>()

function Controlled() {
  const [value, setValue] = useState('')
  return (
    <main className={page}>
      <SearchField
        label="Search the inbox"
        icon={<Magnifier />}
        value={value}
        onValueChange={(v) => {
          setValue(v)
          onValueChange(v)
        }}
      />
    </main>
  )
}

/** Typing reports each change; the clear button and Escape empty the field and keep the focus. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    onValueChange.mockClear()
    const canvas = within(canvasElement)
    const input = canvas.getByRole('searchbox', { name: 'Search the inbox' })
    await expect(canvas.queryByRole('button', { name: 'Clear search' })).toBeNull()
    await userEvent.type(input, 'sync')
    await expect(onValueChange).toHaveBeenLastCalledWith('sync')
    await expect(input).toHaveValue('sync')
    await userEvent.click(canvas.getByRole('button', { name: 'Clear search' }))
    await expect(input).toHaveValue('')
    await expect(input).toHaveFocus()
    await expect(onValueChange).toHaveBeenLastCalledWith('')
    // Escape during IME composition keeps the text.
    await userEvent.type(input, '東京')
    await fireEvent.keyDown(input, { key: 'Escape', isComposing: true })
    await expect(input).toHaveValue('東京')
    await userEvent.type(input, '{Escape}')
    await expect(input).toHaveValue('')
    await userEvent.type(input, 'abc{Escape}')
    await expect(input).toHaveValue('')
    await expect(canvas.queryByRole('button', { name: 'Clear search' })).toBeNull()
  },
}

/** A disabled Fieldset disables the field and hides its clear button. */
export const InDisabledFieldset: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <Fieldset.Root disabled>
        <SearchField label="Search the inbox" defaultValue="sync" icon={<Magnifier />} />
      </Fieldset.Root>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('searchbox', { name: 'Search the inbox' })).toBeDisabled()
    await expect(canvas.queryByRole('button', { name: 'Clear search' })).toBeNull()
  },
}
