import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { useState } from 'react'
import { GridIcon, MoveIcon } from '../foundations/icons'
import { Button } from './button'

const page = css({ bg: 'bg.canvas', p: '24', display: 'grid', gap: '24' })
const row = css({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12' })
const label = css({ textStyle: 'eyebrow', color: 'fg.muted' })
const pane = css({ bg: 'surface.pane', p: '16', borderRadius: 'xl', display: 'grid', gap: '12' })

const variants = ['primary', 'secondary', 'danger', 'dangerSoft', 'dangerText'] as const
const sizes = ['sm', 'md', 'lg', 'xl'] as const

function Plus() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M8 3v10M3 8h10" />
    </svg>
  )
}

// Every variant, size and state, on the canvas and on a pane. The story
// test runs axe on both modes, so a label colour that fails contrast on
// its fill fails the test.
function AllButtons() {
  return (
    <main className={page}>
      {[{ name: 'on bg.canvas', className: '' }, { name: 'on surface.pane', className: pane }].map((frame) => (
        <section key={frame.name} className={frame.className || css({ display: 'grid', gap: '12' })}>
          <span className={label}>{frame.name}</span>
          <div className={row}>
            {variants.map((v) => (
              <Button key={v} variant={v}>
                {v}
              </Button>
            ))}
          </div>
          <div className={row}>
            {variants.map((v) => (
              <Button key={v} variant={v} disabled>
                {v}
              </Button>
            ))}
          </div>
        </section>
      ))}
      <section className={css({ display: 'grid', gap: '12' })}>
        <span className={label}>sizes</span>
        <div className={row}>
          {sizes.map((s) => (
            <Button key={s} size={s} variant="primary">
              <Plus />
              {`New chat ${s}`}
            </Button>
          ))}
        </div>
        <div className={row}>
          {sizes.map((s) => (
            <Button key={s} size={s} iconOnly aria-label={`Add, ${s}`}>
              <Plus />
            </Button>
          ))}
          <Button aria-expanded="true" aria-haspopup="menu">
            Sort
          </Button>
        </div>
      </section>
    </main>
  )
}

const meta = { title: 'Actions/Button', component: AllButtons } satisfies Meta<typeof AllButtons>
export default meta

// The button of an open menu has the active border, not its variant's.
const openMenuBorder: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const border = (name: string) => getComputedStyle(canvas.getAllByRole('button', { name })[0] ?? canvasElement).borderColor
  await expect(border('Sort')).not.toBe(border('secondary'))
}

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' }, play: openMenuBorder }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' }, play: openMenuBorder }

const onClick = fn<(name: string) => void>()

/** A click calls `onClick`; a disabled button and a plain button never submit a form. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <form onSubmit={(e) => { e.preventDefault(); onClick('submit') }}>
        <div className={row}>
          <Button variant="primary" onClick={() => { onClick('save') }}>Save</Button>
          <Button disabled onClick={() => { onClick('disabled') }}>Disabled</Button>
        </div>
      </form>
    </main>
  ),
  play: async ({ canvasElement }) => {
    onClick.mockClear()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(onClick).toHaveBeenCalledWith('save')
    await expect(onClick).not.toHaveBeenCalledWith('submit')
    await userEvent.click(canvas.getByRole('button', { name: 'Disabled' }))
    await expect(onClick).toHaveBeenCalledTimes(1)
    await expect(canvas.getByRole('button', { name: 'Disabled' })).toHaveAttribute('type', 'button')
    // Keyboard focus draws the focus ring.
    const save = canvas.getByRole('button', { name: 'Save' })
    save.blur()
    await userEvent.tab()
    await expect(save).toHaveFocus()
    await expect(getComputedStyle(save).outlineStyle).toBe('solid')
  },
}

// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  selected: css({ color: 'surface.selected' }),
  active: css({ color: 'border.active' }),
  default: css({ color: 'fg.default' }),
  accent: css({ color: 'accent.default' }),
}

function Toggles() {
  const [sorted, setSorted] = useState(true)
  return (
    <main className={page}>
      <div className={row}>
        <Button>
          <GridIcon size="16" />
          Filter
        </Button>
        <Button pressed indicator>
          <GridIcon size="16" />
          Filter · 1
        </Button>
        <Button iconOnly aria-label="Sort by project" pressed={sorted} indicator={sorted} onClick={() => { setSorted(!sorted) }}>
          <MoveIcon size="16" />
        </Button>
        <Button variant="primary">Show 6</Button>
      </div>
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

// A pressed toggle (Inbox D13 359:735, M15 346:12154, Artifacts 403:6453): surface.selected, a
// border.active border and fg.default, never the primary fill; the dot is 6 px of accent.default.
const pressedPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const swatch = (name: string) => {
    const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
    if (el === null) throw new Error(`no swatch ${name}`)
    return getComputedStyle(el).color
  }
  const off = canvas.getByRole('button', { name: 'Filter' })
  const on = canvas.getByRole('button', { name: 'Filter · 1' })
  await expect(off).not.toHaveAttribute('aria-pressed')
  await expect(on).toHaveAttribute('aria-pressed', 'true')
  const style = getComputedStyle(on)
  await expect([style.backgroundColor, style.borderTopColor, style.color]).toEqual([swatch('selected'), swatch('active'), swatch('default')])
  await expect(style.backgroundColor).not.toBe(getComputedStyle(canvas.getByRole('button', { name: 'Show 6' })).backgroundColor)
  await expect(style.backgroundColor).not.toBe(getComputedStyle(off).backgroundColor)
  // The dot after the label: 6 px, round, accent.default, 6 after the label, hidden from screen readers.
  const dot = on.querySelector('.button__indicator')
  if (!(dot instanceof HTMLElement)) throw new Error('no dot')
  await expect(dot).toHaveAttribute('aria-hidden', 'true')
  const d = getComputedStyle(dot)
  await expect([d.width, d.height, d.backgroundColor, d.position]).toEqual(['6px', '6px', swatch('accent'), 'static'])
  await expect(off.querySelector('.button__indicator')).toBeNull()
  // On an icon-only button the dot sits in the top end corner: 2 from the top, 4 from the end, inside the border.
  const sort = canvas.getByRole('button', { name: 'Sort by project' })
  const corner = sort.querySelector('.button__indicator')
  if (!(corner instanceof HTMLElement)) throw new Error('no corner dot')
  await expect([corner.offsetTop, sort.clientWidth - corner.offsetLeft - corner.offsetWidth]).toEqual([2, 4])
  // Click and keyboard toggle it; aria-pressed follows.
  await userEvent.click(sort)
  await expect(sort).toHaveAttribute('aria-pressed', 'false')
  await expect(sort.querySelector('.button__indicator')).toBeNull()
  await expect(getComputedStyle(sort).backgroundColor).toBe(getComputedStyle(off).backgroundColor)
  await userEvent.keyboard(' ')
  await expect(sort).toHaveAttribute('aria-pressed', 'true')
}

export const PressedDark: StoryObj<typeof meta> = { render: () => <Toggles />, globals: { mode: 'dark' }, play: pressedPlay }
export const PressedLight: StoryObj<typeof meta> = { render: () => <Toggles />, globals: { mode: 'light' }, play: pressedPlay }
