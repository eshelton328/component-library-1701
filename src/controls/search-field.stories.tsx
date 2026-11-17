import { Fieldset } from '@ark-ui/react/fieldset'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { CloseCircleIcon, SearchIcon } from '../foundations/icons'
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
    // The input fills the field's height, so the whole box takes a click.
    for (const s of sizes) {
      const input = within(canvasElement).getByRole('searchbox', { name: `Search, ${s}` })
      await expect(input.getBoundingClientRect().height).toBe(input.parentElement?.clientHeight)
    }
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

// The Inbox D10 search field (346:4193): a 15 px magnifier and a 15 px x in a circle to clear (346:4201), which take
// 16 on the icon scale.
function CircleClear() {
  return (
    <main className={page}>
      <div className={pane}>
        <SearchField label="Search the inbox" defaultValue="f-005" icon={<SearchIcon />} clearIcon={<CloseCircleIcon />} clearSize="16" />
      </div>
    </main>
  )
}

const circleClearPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const clear = within(canvasElement).getByRole('button', { name: 'Clear search' })
  const icon = clear.querySelector('svg')
  if (icon === null) throw new Error('no clear icon')
  await expect([icon.getBoundingClientRect().width, icon.getBoundingClientRect().height]).toEqual([16, 16])
  // The button keeps its 20 px box.
  await expect([clear.getBoundingClientRect().width, clear.getBoundingClientRect().height]).toEqual([20, 20])
  await expect(icon.querySelectorAll('path')).toHaveLength(2)
}

/** The clear button with `CloseCircleIcon` at `clearSize="16"` (Inbox D10). */
export const CircleClearDark: StoryObj<typeof meta> = { render: () => <CircleClear />, play: circleClearPlay, globals: { mode: 'dark' } }
export const CircleClearLight: StoryObj<typeof meta> = { render: () => <CircleClear />, play: circleClearPlay, globals: { mode: 'light' } }

// The Inbox search fields (T7 346:6800, and the T12 Run in picker) set the placeholder in Geist Regular 13; the
// default field beside it keeps `body`.
function SmallText() {
  return (
    <main className={page}>
      <div className={column}>
        <SearchField label="Search the inbox" placeholder="Search tasks" icon={<SearchIcon />} textSize="sm" />
        <SearchField label="Search, small text" defaultValue="f-005" icon={<SearchIcon />} textSize="sm" size="sm" />
        <SearchField label="Search, default text" placeholder="Search tasks" icon={<SearchIcon />} />
      </div>
    </main>
  )
}

const smallTextPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const text = (name: string) => {
    const s = getComputedStyle(canvas.getByRole('searchbox', { name }))
    // Line heights are ratios, so Chromium computes 20.0005px; round them.
    return [s.fontSize, Math.round(parseFloat(s.lineHeight)), s.fontWeight]
  }
  // Chromium gives no line height in px for the placeholder, so it checks size and weight.
  const placeholder = (name: string) => {
    const s = getComputedStyle(canvas.getByRole('searchbox', { name }), '::placeholder')
    return [s.fontSize, s.fontWeight]
  }
  // textSize="sm" draws the text and the placeholder in bodySm: Regular 13/20, sans.
  await expect(text('Search the inbox')).toEqual(['13px', 20, '400'])
  await expect(placeholder('Search the inbox')).toEqual(['13px', '400'])
  await expect(text('Search, small text')).toEqual(['13px', 20, '400'])
  await expect(getComputedStyle(canvas.getByRole('searchbox', { name: 'Search the inbox' })).fontFamily).not.toMatch(/mono/i)
  // The height stays the size's: md 32, sm 28.
  const height = (name: string) => canvas.getByRole('searchbox', { name }).parentElement?.getBoundingClientRect().height
  await expect([height('Search the inbox'), height('Search, small text')]).toEqual([32, 28])
  // The default stays body (14/20).
  await expect(text('Search, default text')).toEqual(['14px', 20, '400'])
  await expect(placeholder('Search, default text')).toEqual(['14px', '400'])
}

/** `textSize="sm"`: the text and placeholder in `bodySm` (13/20), as the Inbox search fields draw them. */
export const SmallTextDark: StoryObj<typeof meta> = { render: () => <SmallText />, play: smallTextPlay, globals: { mode: 'dark' } }
export const SmallTextLight: StoryObj<typeof meta> = { render: () => <SmallText />, play: smallTextPlay, globals: { mode: 'light' } }
