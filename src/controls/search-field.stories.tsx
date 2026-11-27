import { Fieldset } from '@ark-ui/react/fieldset'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { CloseCircleIcon, CloseIcon, SearchIcon } from '../foundations/icons'
import { SearchField } from './search-field'
import { atTextSize, shortFields, textSizes } from './text-size.testing'

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
      <div hidden>
        <span data-swatch="subtle" className={css({ color: 'fg.subtle' })} />
        <span data-swatch="muted" className={css({ color: 'fg.muted' })} />
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
  // The clear icon is fg.subtle (d-099), dimmer than the magnifier, which stays fg.muted.
  const colour = (name: string) => getComputedStyle(canvasElement.querySelector(`[data-swatch="${name}"]`) ?? canvasElement).color
  await expect(getComputedStyle(clear).color).toBe(colour('subtle'))
  const magnifier = canvasElement.querySelector('.search-field__icon')
  if (!(magnifier instanceof HTMLElement)) throw new Error('no magnifier')
  await expect(getComputedStyle(magnifier).color).toBe(colour('muted'))
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

// `surface="raised"`: on surface.raised (a raised Popover, such as the Run in picker, D3 346:1235) the placeholder and
// the clear icon are fg.muted, because fg.subtle is 4.39:1 there; the default keeps fg.subtle.
const raisedBox = css({ bg: 'surface.raised', p: '16', borderRadius: 'xl', display: 'grid', gap: '16', mb: '16' })
const swatches = { muted: css({ color: 'fg.muted' }), subtle: css({ color: 'fg.subtle' }), raised: css({ color: 'surface.raised' }) }

function Surfaces() {
  return (
    <main className={page}>
      <div className={raisedBox}>
        <SearchField label="Raised, empty" placeholder="Search workspaces and chats" surface="raised" icon={<Magnifier />} />
        <SearchField label="Raised, with text" defaultValue="sync" surface="raised" icon={<Magnifier />} />
      </div>
      {/* The default is for a field on the page, where fg.subtle passes. */}
      <div className={column}>
        <SearchField label="Default, empty" placeholder="Search" icon={<Magnifier />} />
        <SearchField label="Default, with text" defaultValue="sync" icon={<Magnifier />} />
      </div>
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

/** The WCAG contrast ratio of two `rgb()` colours. */
function contrast(a: string, b: string): number {
  const lum = (c: string) => {
    const [r = 0, g = 0, bl = 0] = (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
    const lin = (v: number) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4)
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl)
  }
  const [hi = 0, lo = 0] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const surfacePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const swatch = (name: string) => {
    const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
    if (el === null) throw new Error(`no swatch ${name}`)
    return getComputedStyle(el).color
  }
  const placeholder = (name: string) => getComputedStyle(canvas.getByRole('searchbox', { name }), '::placeholder').color
  const clear = (name: string) => {
    const button = canvas.getByRole('searchbox', { name }).parentElement?.querySelector('button')
    if (button === null || button === undefined) throw new Error(`no clear button in ${name}`)
    return getComputedStyle(button).color
  }
  await expect(placeholder('Raised, empty')).toBe(swatch('muted'))
  await expect(clear('Raised, with text')).toBe(swatch('muted'))
  await expect(contrast(placeholder('Raised, empty'), swatch('raised'))).toBeGreaterThanOrEqual(4.5)
  await expect(contrast(clear('Raised, with text'), swatch('raised'))).toBeGreaterThanOrEqual(3)
  // The default stays fg.subtle, for surface.inset on the page.
  await expect(placeholder('Default, empty')).toBe(swatch('subtle'))
  await expect(clear('Default, with text')).toBe(swatch('subtle'))
}

export const SurfaceDark: StoryObj<typeof meta> = { render: () => <Surfaces />, globals: { mode: 'dark' }, play: surfacePlay }
export const SurfaceLight: StoryObj<typeof meta> = { render: () => <Surfaces />, globals: { mode: 'light' }, play: surfacePlay }

// The Artifacts search (D4, M5; `icon/x` 403:8202): with `clearFocus="strong"` the clear button is fg.default and
// shows the bold x while the field has the focus. Figma's 14 px takes `clearSize="16"`.
function StrongClear() {
  return (
    <main className={page}>
      <div className={column}>
        <SearchField
          label="Search artifacts"
          defaultValue="sync"
          icon={<SearchIcon />}
          clearIcon={<CloseIcon />}
          clearSize="16"
          clearFocus="strong"
        />
        <SearchField label="Search, default clear" defaultValue="sync" icon={<SearchIcon />} clearIcon={<CloseIcon />} clearSize="16" />
      </div>
      <div hidden>
        {Object.entries({ ...swatches, default: css({ color: 'fg.default' }) }).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const strongClearPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const swatch = (name: string) => getComputedStyle(canvasElement.querySelector(`[data-swatch="${name}"]`) ?? canvasElement).color
  const clearOf = (name: string) => {
    const button = canvas.getByRole('searchbox', { name }).parentElement?.querySelector('button')
    if (!(button instanceof HTMLButtonElement)) throw new Error(`no clear button in ${name}`)
    return button
  }
  // The icons the button shows: their size and their build ('thin' is stroked at 2, 'bold' is filled).
  const shown = (button: HTMLElement) => {
    const svgs = Array.from(button.querySelectorAll('svg')).filter((svg) => svg.getBoundingClientRect().width > 0)
    return svgs.map((svg) => [svg.getBoundingClientRect().width, svg.getAttribute('stroke-width') === '2' ? 'thin' : 'bold'])
  }
  const strong = clearOf('Search artifacts')
  const plain = clearOf('Search, default clear')
  // No focus: both buttons draw the caller's thin x in fg.subtle.
  await expect(shown(strong)).toEqual([[16, 'thin']])
  await expect(getComputedStyle(strong).color).toBe(swatch('subtle'))
  await expect(getComputedStyle(plain).color).toBe(swatch('subtle'))
  // Focus in the strong field: the bold x in fg.default, still 16 in its 20 px box.
  canvas.getByRole('searchbox', { name: 'Search artifacts' }).focus()
  await expect(shown(strong)).toEqual([[16, 'bold']])
  await expect(getComputedStyle(strong).color).toBe(swatch('default'))
  await expect([strong.getBoundingClientRect().width, strong.getBoundingClientRect().height]).toEqual([20, 20])
  // The default field keeps its thin fg.subtle x when it has the focus.
  canvas.getByRole('searchbox', { name: 'Search, default clear' }).focus()
  await expect(shown(plain)).toEqual([[16, 'thin']])
  await expect(getComputedStyle(plain).color).toBe(swatch('subtle'))
  await expect(shown(strong)).toEqual([[16, 'thin']])
  // A click on the strong clear button empties the field and keeps the focus in it.
  canvas.getByRole('searchbox', { name: 'Search artifacts' }).focus()
  await userEvent.click(strong)
  await expect(canvas.getByRole('searchbox', { name: 'Search artifacts' })).toHaveValue('')
  await expect(canvas.getByRole('searchbox', { name: 'Search artifacts' })).toHaveFocus()
}

/** `clearFocus="strong"`: the bold, bright clear button of the focused Artifacts search. */
export const StrongClearDark: StoryObj<typeof meta> = { render: () => <StrongClear />, play: strongClearPlay, globals: { mode: 'dark' } }
export const StrongClearLight: StoryObj<typeof meta> = { render: () => <StrongClear />, play: strongClearPlay, globals: { mode: 'light' } }

const searchTextSizesPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const heights = () => sizes.map((s) => canvas.getByRole('searchbox', { name: `Search, ${s}` }).parentElement?.getBoundingClientRect().height ?? 0)
  // Small is as before: each size keeps its height.
  await expect(heights()).toEqual([28, 32, 36])
  for (const size of textSizes) {
    await atTextSize(size, async () => {
      // Each field is at least as tall as its line of text: no placeholder or value is cut at the top or bottom.
      await expect(shortFields(canvasElement)).toEqual([])
      // The input still fills the field's height, so a click anywhere in the field focuses it.
      for (const s of sizes) {
        const input = canvas.getByRole('searchbox', { name: `Search, ${s}` })
        await expect(input.getBoundingClientRect().height).toBe(input.parentElement?.clientHeight)
      }
      const now = heights()
      for (const [i, h] of [28, 32, 36].entries()) await expect(now[i]).toBeGreaterThanOrEqual(h)
    })
  }
}

/** The search fields at Small, Default and Large (d-122): a field grows with its line of text, never below its size. */
export const SearchTextSizesDark: StoryObj<typeof meta> = { play: searchTextSizesPlay, globals: { mode: 'dark', textSize: 'small' } }
export const SearchTextSizesLight: StoryObj<typeof meta> = { play: searchTextSizesPlay, globals: { mode: 'light', textSize: 'small' } }


// A field in a column that runs out of height, such as the Run in picker's popover (the-bridge Inbox, NCC-141): a long
// list under the field fills the column, and the column scrolls. At Default and Large the field keeps the height of
// its line; it used to shrink to its size's height and cut the line by 2 px.
const tightColumn = css({ display: 'flex', flexDirection: 'column', gap: '8', maxH: 'shell.pickerHeight', overflowY: 'auto', w: 'shell.popoverPicker' })
const rows = Array.from({ length: 30 }, (_, i) => `Chat ${String(i + 1)}`)
function TightColumn() {
  return (
    <div className={tightColumn}>
      {sizes.map((s) => (
        <SearchField key={s} label={`Search, ${s}`} placeholder="Search workspaces and chats" icon={<SearchIcon />} size={s} textSize="sm" surface="raised" />
      ))}
      {rows.map((row) => (
        <p key={row}>{row}</p>
      ))}
    </div>
  )
}

const tightColumnPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  for (const size of textSizes) {
    await atTextSize(size, async () => {
      await expect({ size, short: shortFields(canvasElement) }).toEqual({ size, short: [] })
    })
  }
}

/** Search fields over a long list in a column that scrolls: no field shrinks below its line at any text size. */
export const TightColumnDark: StoryObj<typeof meta> = { render: () => <TightColumn />, play: tightColumnPlay, globals: { mode: 'dark', textSize: 'small' } }
export const TightColumnLight: StoryObj<typeof meta> = { render: () => <TightColumn />, play: tightColumnPlay, globals: { mode: 'light', textSize: 'small' } }
