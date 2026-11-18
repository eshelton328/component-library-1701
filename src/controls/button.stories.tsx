import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { useState } from 'react'
import { ChartIcon, CopyIcon, GridIcon, ListIcon, MapIcon, MoveIcon } from '../foundations/icons'
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

// The 12 px labels of the small Inbox buttons (Reset, Edit, Snooze; D16 403:1848, 403:1875), Geist Medium 12, and
// Start and Remove task (403:3928), Geist SemiBold 13.
function CompactLabels() {
  return (
    <main className={page}>
      <div className={pane}>
        <div className={row}>
          <Button size="sm" textSize="xs">
            Edit
          </Button>
          <Button size="sm" textSize="xs" disabled>
            Reset
          </Button>
          <Button textSize="smStrong" variant="primary">
            Start
          </Button>
          <Button textSize="smStrong" variant="danger">
            Remove task
          </Button>
          <Button>Default</Button>
        </div>
      </div>
    </main>
  )
}

// `textSize="xs"` sets labelXs (Medium 12/16) and `smStrong` labelSmStrong (SemiBold 13/16), in the family of the
// default label; both keep the height and padding of `size`, and the default stays label (Medium 14/20).
const compactLabelPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const edit = canvas.getByRole('button', { name: 'Edit' })
  const reset = canvas.getByRole('button', { name: 'Reset' })
  const start = canvas.getByRole('button', { name: 'Start' })
  const remove = canvas.getByRole('button', { name: 'Remove task' })
  const plain = canvas.getByRole('button', { name: 'Default' })
  const d = getComputedStyle(plain)
  const type = (el: HTMLElement) => {
    const s = getComputedStyle(el)
    return [s.fontSize, Math.round(Number.parseFloat(s.lineHeight)), s.fontWeight, s.fontFamily]
  }
  await expect(type(edit)).toEqual(['12px', 16, '500', d.fontFamily])
  await expect(type(reset)).toEqual(['12px', 16, '500', d.fontFamily])
  await expect(type(start)).toEqual(['13px', 16, '600', d.fontFamily])
  await expect(type(remove)).toEqual(['13px', 16, '600', d.fontFamily])
  await expect(type(plain)).toEqual(['14px', 20, '500', d.fontFamily])
  // The heights stay those of size sm (28) and md (32); the padding of an md button is unchanged.
  await expect([edit, start, plain].map((b) => b.getBoundingClientRect().height)).toEqual([28, 32, 32])
  await expect(getComputedStyle(start).paddingLeft).toBe(d.paddingLeft)
}

export const CompactLabelDark: StoryObj<typeof meta> = { render: () => <CompactLabels />, globals: { mode: 'dark' }, play: compactLabelPlay }
export const CompactLabelLight: StoryObj<typeof meta> = { render: () => <CompactLabels />, globals: { mode: 'light' }, play: compactLabelPlay }

// The 24 px button: Copy under a chat reply (Inbox T5 346:6404, 22 high in Figma), with and without a label.
function ExtraSmall() {
  return (
    <main className={page}>
      <div className={pane}>
        <div className={row}>
          <Button size="xs" textSize="xs">
            <CopyIcon size="16" />
            Copy
          </Button>
          <Button size="xs" iconOnly aria-label="Move">
            <MoveIcon size="16" />
          </Button>
          <Button size="sm">Small</Button>
        </div>
      </div>
    </main>
  )
}

// `size="xs"` is 24 px high (control.xs) with 8 px sides; an icon-only one is 24 square; `sm` stays 28.
const extraSmallPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const copy = canvas.getByRole('button', { name: 'Copy' })
  const move = canvas.getByRole('button', { name: 'Move' })
  const small = canvas.getByRole('button', { name: 'Small' })
  await expect(copy.getBoundingClientRect().height).toBe(24)
  await expect(getComputedStyle(copy).paddingLeft).toBe('8px')
  await expect(getComputedStyle(copy).fontSize).toBe('12px')
  const m = move.getBoundingClientRect()
  await expect([m.width, m.height]).toEqual([24, 24])
  await expect(small.getBoundingClientRect().height).toBe(28)
}

export const ExtraSmallDark: StoryObj<typeof meta> = { render: () => <ExtraSmall />, globals: { mode: 'dark' }, play: extraSmallPlay }
export const ExtraSmallLight: StoryObj<typeof meta> = { render: () => <ExtraSmall />, globals: { mode: 'light' }, play: extraSmallPlay }

// The Toolkit phone's view buttons (M1 466:54, 466:57, 466:63): 36 px icon-only secondary buttons, 8 apart in the
// page header. The current view (List) is pressed with `pressedTone="accent"`: the selected fill, the cyan
// border and a cyan icon (466:55). The others stay fg.default, and a pressed default-tone button keeps fg.default.
const toneSwatches = {
  selected: css({ color: 'surface.selected' }),
  active: css({ color: 'border.active' }),
  default: css({ color: 'fg.default' }),
  fgAccent: css({ color: 'fg.accent' }),
}

function ViewButtons() {
  const [view, setView] = useState('list')
  const views = [
    { value: 'list', label: 'List', icon: <ListIcon /> },
    { value: 'map', label: 'Map', icon: <MapIcon /> },
    { value: 'activity', label: 'Activity', icon: <ChartIcon /> },
  ]
  return (
    <main className={page}>
      <div className={row}>
        {views.map((item) => (
          <Button
            key={item.value}
            size="lg"
            iconOnly
            pressedTone="accent"
            aria-label={item.label}
            pressed={view === item.value}
            onClick={() => {
              setView(item.value)
            }}
          >
            {item.icon}
          </Button>
        ))}
        <Button size="lg" iconOnly pressed aria-label="Pressed, default tone">
          <ListIcon />
        </Button>
        <Button variant="primary" size="lg" iconOnly pressed pressedTone="accent" aria-label="Pressed primary, accent tone">
          <ListIcon />
        </Button>
      </div>
      <div hidden>
        {Object.entries(toneSwatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const pressedTonePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const swatch = (name: string) => {
    const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
    if (el === null) throw new Error(`no swatch ${name}`)
    return getComputedStyle(el).color
  }
  const list = canvas.getByRole('button', { name: 'List' })
  const map = canvas.getByRole('button', { name: 'Map' })
  await expect(list).toHaveAttribute('aria-pressed', 'true')
  const l = getComputedStyle(list)
  await expect([l.backgroundColor, l.borderTopColor, l.color]).toEqual([swatch('selected'), swatch('active'), swatch('fgAccent')])
  const icon = list.querySelector('svg')
  if (icon === null) throw new Error('no icon')
  await expect(getComputedStyle(icon).stroke).toBe(swatch('fgAccent'))
  await expect([list.getBoundingClientRect().width, list.getBoundingClientRect().height]).toEqual([36, 36])
  await expect([icon.getBoundingClientRect().width, icon.getBoundingClientRect().height]).toEqual([16, 16])
  // An idle button of the accent tone keeps fg.default, and so does a pressed button of the default tone.
  await expect(getComputedStyle(map).color).toBe(swatch('default'))
  await expect(getComputedStyle(canvas.getByRole('button', { name: 'Pressed, default tone' })).color).toBe(swatch('default'))
  // A pressed primary keeps fg.onAccent on its accent fill: the accent tone changes only a secondary button.
  const primary = getComputedStyle(canvas.getByRole('button', { name: 'Pressed primary, accent tone' }))
  await expect(primary.color).not.toBe(swatch('fgAccent'))
  await expect(primary.color).not.toBe(primary.backgroundColor)
  // Picking Map moves the cyan to it.
  await userEvent.click(map)
  await expect(getComputedStyle(map).color).toBe(swatch('fgAccent'))
  await expect(getComputedStyle(list).color).toBe(swatch('default'))
}

/** `pressedTone="accent"`: the pressed view button draws its icon in fg.accent, as the Toolkit phone header does. */
export const PressedAccentDark: StoryObj<typeof meta> = { render: () => <ViewButtons />, globals: { mode: 'dark' }, play: pressedTonePlay }
export const PressedAccentLight: StoryObj<typeof meta> = { render: () => <ViewButtons />, globals: { mode: 'light' }, play: pressedTonePlay }

const borderSwatches = {
  active: css({ color: 'border.active' }),
  default: css({ color: 'border.default' }),
  danger: css({ color: 'status.danger.border' }),
}

// A menu trigger and disclosure toggles, all open (aria-expanded).
function ExpandedButtons() {
  return (
    <main className={page}>
      <div className={row}>
        <Button aria-expanded="true" aria-haspopup="menu">
          Sort
        </Button>
        <Button aria-expanded="true" expandedBorder="default">
          Hide transcript
        </Button>
        <Button variant="dangerSoft" aria-expanded="true" expandedBorder="default">
          Hide errors
        </Button>
        <Button variant="primary" aria-expanded="true" expandedBorder="default">
          Hide plan
        </Button>
        <Button aria-expanded="false" expandedBorder="default">
          Show transcript
        </Button>
      </div>
      <div hidden>
        {Object.entries(borderSwatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

// Workbench D3 105:1350, T3 105:2059, M6 105:3215: Hide transcript keeps #24314f (border.default)
// while open; an open menu trigger draws border.active.
const expandedBorderPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const swatch = (name: string) => {
    const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
    if (el === null) throw new Error(`no swatch ${name}`)
    return getComputedStyle(el).color
  }
  const border = (name: string) => getComputedStyle(canvas.getByRole('button', { name })).borderTopColor
  await expect(swatch('active')).not.toBe(swatch('default'))
  await expect(border('Sort')).toBe(swatch('active'))
  await expect(border('Hide transcript')).toBe(swatch('default'))
  await expect(border('Hide transcript')).toBe(border('Show transcript'))
  await expect(border('Hide errors')).toBe(swatch('danger'))
  await expect(border('Hide plan')).toBe('rgba(0, 0, 0, 0)')
}

/** `expandedBorder="default"`: an open disclosure toggle keeps its own border; an open menu trigger draws border.active. */
export const ExpandedBorderDark: StoryObj<typeof meta> = { render: () => <ExpandedButtons />, globals: { mode: 'dark' }, play: expandedBorderPlay }
export const ExpandedBorderLight: StoryObj<typeof meta> = { render: () => <ExpandedButtons />, globals: { mode: 'light' }, play: expandedBorderPlay }

// The Discuss toggle with its discussion open beside Sort with a sort applied, a
// closed Discuss and a pressed primary Discuss, all with textSize sm as the-bridge draws them.
// Below them a pressed Discuss and a pressed Sort on each surface the-bridge draws them on.
const discussSurfaces = {
  'bg.canvas': css({ bg: 'bg.canvas', p: '12' }),
  'surface.pane': css({ bg: 'surface.pane', p: '12' }),
  'surface.raised': css({ bg: 'surface.raised', p: '12' }),
}

function DiscussButtons() {
  return (
    <main className={page}>
      <div className={row}>
        <Button textSize="sm" pressed>
          Sort
        </Button>
        <Button textSize="sm" pressed pressedBorder="discuss">
          Discuss
        </Button>
        <Button textSize="sm" pressed={false} pressedBorder="discuss">
          Discuss closed
        </Button>
        <Button variant="primary" textSize="sm" pressed pressedBorder="discuss">
          Discuss primary
        </Button>
      </div>
      <div className={row}>
        {Object.entries(discussSurfaces).map(([name, className]) => (
          <div key={name} className={className} data-surface={name}>
            <Button textSize="sm" pressed pressedBorder="discuss">
              {`Discuss on ${name}`}
            </Button>
            <Button textSize="sm" pressed>
              {`Sort on ${name}`}
            </Button>
          </div>
        ))}
      </div>
      <div hidden>
        <span data-swatch="active" className={css({ color: 'border.active' })} />
        <span data-swatch="discuss" className={css({ color: 'accent.discuss' })} />
        <span data-swatch="default" className={css({ color: 'border.default' })} />
        <span data-swatch="selected" className={css({ color: 'surface.selected' })} />
      </div>
    </main>
  )
}

type Rgba = readonly [number, number, number, number]

/** Reads a computed `rgb()` or `rgba()` colour. */
function parseRgba(value: string): Rgba {
  const parts = /^rgba?\(([^)]+)\)$/.exec(value)?.[1]?.split(',').map(Number)
  if (parts === undefined || parts.length < 3 || parts.some(Number.isNaN)) throw new Error(`not an rgb colour: ${value}`)
  const [r = 0, g = 0, b = 0, a = 1] = parts
  return [r, g, b, a]
}

/** Lays `top` over `under` (source-over), as the browser paints it. */
function over(top: Rgba, under: Rgba): Rgba {
  const a = top[3] + under[3] * (1 - top[3])
  if (a === 0) return [0, 0, 0, 0]
  const mix = (t: number, u: number) => (t * top[3] + u * under[3] * (1 - top[3])) / a
  return [mix(top[0], under[0]), mix(top[1], under[1]), mix(top[2], under[2]), a]
}

/** The colour an element's background shows: its own and its ancestors' fills, laid over each other. */
function paintedBackground(el: Element | null): Rgba {
  let colour: Rgba = [0, 0, 0, 0]
  for (let node = el; node !== null && colour[3] < 1; node = node.parentElement) {
    colour = over(colour, parseRgba(getComputedStyle(node).backgroundColor))
  }
  return colour
}

/** WCAG 2 contrast ratio of two opaque colours. */
function contrast(a: Rgba, b: Rgba) {
  const luminance = (c: Rgba) => {
    const [r, g, bl] = [c[0], c[1], c[2]].map((v) => {
      const s = v / 255
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (bl ?? 0)
  }
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05)
}

// Inbox Discuss 403:943 and Artifacts Discuss 452:2341: a pressed Discuss draws accent.discuss;
// a pressed button with the default pressedBorder still draws border.active.
const pressedBorderPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const swatch = (name: string) => {
    const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
    if (el === null) throw new Error(`no swatch ${name}`)
    return getComputedStyle(el).color
  }
  const style = (name: string) => getComputedStyle(canvas.getByRole('button', { name }))
  // WCAG 1.4.11: the pressed border, laid over the button's own fill as the browser paints
  // it, reaches 3:1 against each surface around the button.
  // Sort, with the default pressedBorder, draws border.active over surface.selected; in
  // light that needs border.active at 0.75 alpha (0.7 gave 2.94 on bg.canvas).
  for (const name of Object.keys(discussSurfaces)) {
    for (const toggle of ['Discuss', 'Sort']) {
      const button = canvas.getByRole('button', { name: `${toggle} on ${name}` })
      const surface = paintedBackground(button.parentElement)
      const border = over(parseRgba(getComputedStyle(button).borderTopColor), paintedBackground(button))
      await expect(contrast(border, surface), `pressed ${toggle} border on ${name}`).toBeGreaterThanOrEqual(3)
    }
  }
  await expect(swatch('discuss')).not.toBe(swatch('active'))
  await expect(style('Sort').borderTopColor).toBe(swatch('active'))
  await expect(style('Discuss').borderTopColor).toBe(swatch('discuss'))
  await expect(style('Discuss').borderBottomColor).toBe(swatch('discuss'))
  // The pressed fill stays, and a closed Discuss keeps the secondary border.
  await expect(style('Discuss').backgroundColor).toBe(swatch('selected'))
  await expect(style('Discuss closed').borderTopColor).toBe(swatch('default'))
  await expect(style('Discuss primary').borderTopColor).toBe(swatch('discuss'))
}

/** `pressedBorder="discuss"`: a pressed Discuss toggle draws accent.discuss; Sort keeps border.active. Both borders reach 3:1 on each surface. */
export const PressedBorderDark: StoryObj<typeof meta> = { render: () => <DiscussButtons />, globals: { mode: 'dark' }, play: pressedBorderPlay }
export const PressedBorderLight: StoryObj<typeof meta> = { render: () => <DiscussButtons />, globals: { mode: 'light' }, play: pressedBorderPlay }
