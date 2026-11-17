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

const variants = ['primary', 'secondary', 'secondaryDanger', 'danger', 'dangerSoft', 'dangerText', 'text'] as const
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

const onDone = fn()

// Sheet header actions (Inbox T8 346:7175, M7 346:10487; Artifacts M7 408:706):
// fg.accent text in labelLg, no fill, no border, the size's full height.
function SheetHeader() {
  return (
    <main className={page}>
      <div className={pane}>
        <div className={row}>
          <Button variant="text">Cancel</Button>
          <Button variant="text" size="lg" onClick={() => { onDone() }}>
            Done
          </Button>
          <Button variant="text" disabled>
            Add
          </Button>
        </div>
      </div>
      <span hidden data-swatch="accent" className={css({ color: 'fg.accent' })} />
      <span hidden data-swatch="faint" className={css({ color: 'accent.faint' })} />
    </main>
  )
}

const textPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  onDone.mockClear()
  const canvas = within(canvasElement)
  const accent = getComputedStyle(canvasElement.querySelector('[data-swatch="accent"]') ?? canvasElement).color
  const cancel = canvas.getByRole('button', { name: 'Cancel' })
  const done = canvas.getByRole('button', { name: 'Done' })
  const style = getComputedStyle(cancel)
  await expect([style.color, style.fontSize, style.fontWeight]).toEqual([accent, '16px', '500'])
  await expect([style.backgroundColor, style.borderTopColor]).toEqual(['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)'])
  // The size variants keep their heights: md 32 (control.md), lg 36 (control.lg).
  await expect([cancel.getBoundingClientRect().height, done.getBoundingClientRect().height]).toEqual([32, 36])
  // Hover tints the box in accent.faint. Simulated pointer events set no :hover; Panda's
  // hover condition also matches [data-hover], so the test sets that.
  const faint = getComputedStyle(canvasElement.querySelector('[data-swatch="faint"]') ?? canvasElement).color
  cancel.setAttribute('data-hover', '')
  await expect(getComputedStyle(cancel).backgroundColor).toBe(faint)
  cancel.removeAttribute('data-hover')
  // A disabled one does nothing.
  const add = canvas.getByRole('button', { name: 'Add' })
  await expect(add).toBeDisabled()
  // Keyboard focus draws the focus ring, and Enter presses it.
  cancel.focus()
  await userEvent.tab()
  await expect(done).toHaveFocus()
  await expect(getComputedStyle(done).outlineStyle).toBe('solid')
  await userEvent.keyboard('{Enter}')
  await expect(onDone).toHaveBeenCalledTimes(1)
}

export const TextDark: StoryObj<typeof meta> = { render: () => <SheetHeader />, globals: { mode: 'dark' }, play: textPlay }
export const TextLight: StoryObj<typeof meta> = { render: () => <SheetHeader />, globals: { mode: 'light' }, play: textPlay }

// Approve and Deny in an approval row (Inbox D1 346:213): Deny is the secondary box with a danger label.
function Approval() {
  return (
    <main className={page}>
      <div className={pane}>
        <div className={row}>
          <Button variant="primary" size="sm">Approve</Button>
          <Button variant="secondaryDanger" size="sm">Deny</Button>
          <Button size="sm">Later</Button>
        </div>
      </div>
      <span hidden data-swatch="danger" className={css({ color: 'status.danger.fg' })} />
    </main>
  )
}

const secondaryDangerPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const danger = getComputedStyle(canvasElement.querySelector('[data-swatch="danger"]') ?? canvasElement).color
  const deny = getComputedStyle(canvas.getByRole('button', { name: 'Deny' }))
  const later = getComputedStyle(canvas.getByRole('button', { name: 'Later' }))
  // The secondary box: the same fill and border as secondary.
  await expect([deny.backgroundColor, deny.borderTopColor, deny.borderTopWidth]).toEqual([later.backgroundColor, later.borderTopColor, '1px'])
  // The danger label.
  await expect(deny.color).toBe(danger)
  await expect(deny.color).not.toBe(later.color)
}

export const SecondaryDangerDark: StoryObj<typeof meta> = { render: () => <Approval />, globals: { mode: 'dark' }, play: secondaryDangerPlay }
export const SecondaryDangerLight: StoryObj<typeof meta> = { render: () => <Approval />, globals: { mode: 'light' }, play: secondaryDangerPlay }

// The 13 px labels of Inbox: Newest and Filter (403:1663, 403:1671) and Keep it (403:1884), Geist Medium 13.
function SmallLabels() {
  return (
    <main className={page}>
      <div className={pane}>
        <div className={row}>
          <Button textSize="sm">
            <GridIcon size="16" />
            Filter
          </Button>
          <Button textSize="sm" variant="primary">
            Keep it
          </Button>
          <Button>Default</Button>
        </div>
      </div>
    </main>
  )
}

// `textSize="sm"` sets labelSm (Medium 13/16) and keeps the height of `size`; the default stays label (Medium 14/20).
const smallLabelPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const filter = canvas.getByRole('button', { name: 'Filter' })
  const keep = canvas.getByRole('button', { name: 'Keep it' })
  const plain = canvas.getByRole('button', { name: 'Default' })
  const f = getComputedStyle(filter)
  const d = getComputedStyle(plain)
  const type = (s: CSSStyleDeclaration) => [s.fontSize, Math.round(Number.parseFloat(s.lineHeight)), s.fontWeight]
  await expect(type(f)).toEqual(['13px', 16, '500'])
  await expect(f.fontFamily).toBe(d.fontFamily)
  await expect(getComputedStyle(keep).fontSize).toBe('13px')
  await expect(type(d)).toEqual(['14px', 20, '500'])
  // The height and padding stay those of size md: 32 px (control.md), 12 px each side.
  await expect([filter.getBoundingClientRect().height, plain.getBoundingClientRect().height]).toEqual([32, 32])
  await expect(f.paddingLeft).toBe(d.paddingLeft)
}

export const SmallLabelDark: StoryObj<typeof meta> = { render: () => <SmallLabels />, globals: { mode: 'dark' }, play: smallLabelPlay }
export const SmallLabelLight: StoryObj<typeof meta> = { render: () => <SmallLabels />, globals: { mode: 'light' }, play: smallLabelPlay }

// A disabled Reset (Inbox M2 346:9287, T19 402:11597, D16): the secondary box and border, the label and icon in fg.muted.
function DisabledButtons() {
  return (
    <main className={page}>
      <div className={pane}>
        <div className={row}>
          <Button size="sm" disabled>
            <GridIcon size="16" />
            Reset
          </Button>
          <Button size="sm">Edit</Button>
          <Button size="sm" variant="primary" disabled>
            Start
          </Button>
        </div>
      </div>
      <span hidden data-swatch="muted" className={css({ color: 'fg.muted' })} />
    </main>
  )
}

const disabledPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const muted = getComputedStyle(canvasElement.querySelector('[data-swatch="muted"]') ?? canvasElement).color
  const reset = canvas.getByRole('button', { name: 'Reset' })
  const r = getComputedStyle(reset)
  const edit = getComputedStyle(canvas.getByRole('button', { name: 'Edit' }))
  await expect(reset).toBeDisabled()
  // No fade: the fill and the border.default border stay as an enabled secondary button draws them.
  await expect(r.opacity).toBe('1')
  await expect([r.backgroundColor, r.borderTopColor, r.borderTopWidth]).toEqual([edit.backgroundColor, edit.borderTopColor, '1px'])
  // The label and the icon are fg.muted; an enabled one keeps fg.default.
  await expect(r.color).toBe(muted)
  await expect(edit.color).not.toBe(muted)
  const icon = reset.querySelector('svg')
  if (icon === null) throw new Error('no icon')
  await expect(getComputedStyle(icon).color).toBe(muted)
  // The other variants still fade the whole button (opacity.disabled).
  await expect(getComputedStyle(canvas.getByRole('button', { name: 'Start' })).opacity).toBe('0.45')
}

export const DisabledDark: StoryObj<typeof meta> = { render: () => <DisabledButtons />, globals: { mode: 'dark' }, play: disabledPlay }
export const DisabledLight: StoryObj<typeof meta> = { render: () => <DisabledButtons />, globals: { mode: 'light' }, play: disabledPlay }
