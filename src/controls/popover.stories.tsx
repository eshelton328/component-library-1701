import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from './button'
import { Checkbox } from './checkbox'
import { Inline } from './layout'
import { OptionList } from './option-list'
import { Popover, PopoverSection } from './popover'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', minH: 'shell.dialogLg' })

const kinds = ['Approval', 'Question', 'Review', 'Action', 'Next step']
const projects = ['ncc-1701', 'omni', 'component-library-1701']

// The Inbox filter popover (D4): kind and project sections, and a footer with a count and Clear.
function Filters({ open, onClear }: { open?: boolean; onClear?: () => void }) {
  const [picked, setPicked] = useState<readonly string[]>(['Approval', 'Question', 'ncc-1701'])
  const toggle = (v: string, on: boolean) => {
    setPicked((p) => (on ? [...p, v] : p.filter((x) => x !== v)))
  }
  return (
    <Inline justify="end">
      <Popover
        trigger={<Button>Filter</Button>}
        label="Filters"
        {...(open === undefined ? {} : { open })}
        note={`${String(picked.length)} filters on`}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setPicked([])
              onClear?.()
            }}
          >
            Clear
          </Button>
        }
      >
        <PopoverSection label="Kind">
          {kinds.map((k) => (
            <Checkbox key={k} label={k} checked={picked.includes(k)} onCheckedChange={(on) => { toggle(k, on) }} />
          ))}
        </PopoverSection>
        <PopoverSection label="Project">
          {projects.map((k) => (
            <Checkbox key={k} label={k} checked={picked.includes(k)} onCheckedChange={(on) => { toggle(k, on) }} />
          ))}
        </PopoverSection>
      </Popover>
    </Inline>
  )
}

function OpenFilters() {
  return (
    <main className={page}>
      <Filters open />
    </main>
  )
}

const meta = {
  title: 'Overlays/Popover',
  component: OpenFilters,
  play: async () => {
    // The popover renders in a portal, outside the story's canvas.
    const body = within(document.body)
    const box = await body.findByRole('dialog', { name: 'Filters' })
    await expect(box.getBoundingClientRect().width).toBe(320)
    const style = getComputedStyle(box)
    await expect(style.borderTopLeftRadius).toBe('12px')
    await expect(style.paddingTop).toBe('8px')
    await expect(style.boxShadow).not.toBe('none')
    // It opens 6 px under the trigger, aligned at its end.
    const trigger = body.getByRole('button', { name: 'Filter' })
    await waitFor(() => expect(Math.round(box.getBoundingClientRect().top - trigger.getBoundingClientRect().bottom)).toBe(6))
    await expect(Math.round(box.getBoundingClientRect().right)).toBe(Math.round(trigger.getBoundingClientRect().right))
    // Two named sections with capital labels in mono text.
    const kind = within(box).getByRole('group', { name: 'Kind' })
    await expect(within(kind).getAllByRole('checkbox')).toHaveLength(5)
    const label = within(kind).getByText('Kind')
    await expect(getComputedStyle(label).textTransform).toBe('uppercase')
    await expect(getComputedStyle(label).fontSize).toBe('11px')
    // The label row is 26 high, as Figma's (D4 346:1738: 8 + a 14 px line + 4).
    await expect(Math.round(label.getBoundingClientRect().height)).toBe(26)
    await expect(within(box).getByRole('group', { name: 'Project' })).toBeInTheDocument()
    await expect(within(box).getByText('3 filters on')).toBeInTheDocument()
    await expect(within(box).getByRole('button', { name: 'Clear' })).toBeInTheDocument()
  },
} satisfies Meta<typeof OpenFilters>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onClear = fn()

/** A click opens the popover; the controls inside work; Escape and a click outside close it. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <Filters onClear={onClear} />
      <p>Outside the popover</p>
    </main>
  ),
  play: async ({ canvasElement }) => {
    onClear.mockClear()
    const canvas = within(canvasElement)
    const body = within(document.body)
    const trigger = canvas.getByRole('button', { name: 'Filter' })
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(trigger)
    const box = await body.findByRole('dialog', { name: 'Filters' })
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(within(box).getByRole('checkbox', { name: 'Review' }))
    await expect(within(box).getByText('4 filters on')).toBeInTheDocument()
    await userEvent.click(within(box).getByRole('button', { name: 'Clear' }))
    await expect(onClear).toHaveBeenCalledTimes(1)
    await expect(within(box).getByText('0 filters on')).toBeInTheDocument()
    // Escape closes it and returns the focus to the trigger.
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('dialog', { name: 'Filters' })).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
    // A click outside closes it.
    await userEvent.click(trigger)
    await body.findByRole('dialog', { name: 'Filters' })
    await userEvent.click(canvas.getByText('Outside the popover'))
    await waitFor(() => expect(body.queryByRole('dialog', { name: 'Filters' })).toBeNull())
  },
}

const widths = [
  ['xs', 160],
  ['sm', 240],
  ['filter', 300],
  ['md', 320],
  ['lg', 360],
  ['picker', 380],
] as const

// One open popover per width, each under its own button.
function Widths() {
  return (
    <main className={page}>
      <Inline justify="end">
        {widths.map(([w]) => (
          <Popover key={w} trigger={<Button>{w}</Button>} label={`Width ${w}`} width={w} open>
            <Checkbox label={`A ${w} row`} />
          </Popover>
        ))}
      </Inline>
    </main>
  )
}

/** The widths (Inbox D4 346:1737 is 300, D3 346:1234 is 380): each box takes its width token. */
export const Width: StoryObj<typeof meta> = {
  render: () => <Widths />,
  play: async () => {
    const body = within(document.body)
    for (const [w, px] of widths) {
      const box = await body.findByRole('dialog', { name: `Width ${w}` })
      await expect(box.getBoundingClientRect().width).toBe(px)
    }
  },
}

// Two triggers at the foot of the viewport, where there is little room below. The Run in picker (Inbox D3
// 346:1234) opens under its button, so it takes `flip={false}`; the other may flip above.
const foot = css({ position: 'fixed', insetInlineStart: '24', insetInlineEnd: '24', bottom: '24' })
const marked = css({ outlineStyle: 'dashed' })

function Placements() {
  return (
    <main className={page}>
      <div className={foot}>
        <Inline justify="between">
          <Popover trigger={<Button>Flips</Button>} label="Flips" placement="bottom-start" open>
            <Checkbox label="A row" />
          </Popover>
          <Popover
            trigger={<Button>Run in</Button>}
            label="Run in"
            placement="bottom-end"
            flip={false}
            width="picker"
            className={marked}
            data-fidelity="run in picker"
            data-state="ignored"
            open
          >
            <Checkbox label="Another row" />
          </Popover>
        </Inline>
      </div>
    </main>
  )
}

/** `flip={false}` keeps the placement where there is no room; the box takes the caller's class and `data-*` attributes. */
const placementPlay: StoryObj<typeof meta>['play'] = async () => {
  const body = within(document.body)
  const flips = await body.findByRole('dialog', { name: 'Flips' })
  const kept = await body.findByRole('dialog', { name: 'Run in' })
  const above = body.getByRole('button', { name: 'Flips' })
  const below = body.getByRole('button', { name: 'Run in' })
  // With no room below, the default flips above its trigger; flip={false} stays under its trigger.
  await waitFor(() => expect(flips.getBoundingClientRect().bottom).toBeLessThanOrEqual(above.getBoundingClientRect().top))
  await waitFor(() => expect(Math.round(kept.getBoundingClientRect().top - below.getBoundingClientRect().bottom)).toBe(6))
  // The data attribute and the class land on the box, beside the recipe's class; Ark keeps its own data-state.
  await expect(kept).toHaveAttribute('data-fidelity', 'run in picker')
  await expect(kept).toHaveAttribute('data-state', 'open')
  await expect(kept).toHaveClass(marked)
  await expect(kept).toHaveClass('popover__content')
  await expect(getComputedStyle(kept).outlineStyle).toBe('dashed')
  await expect(flips).not.toHaveAttribute('data-fidelity')
}

// `surface="raised"`: the opaque fill Figma gives the Inbox popovers (D4 346:1737, #17213a: surface.raised); the default
// keeps surface.overlay.
const surfaces = {
  raised: css({ color: 'surface.raised' }),
  overlay: css({ color: 'surface.overlay' }),
}

function Surfaces() {
  return (
    <main className={page}>
      <Inline justify="between">
        <Popover trigger={<Button>Opaque</Button>} label="Opaque" placement="bottom-start" surface="raised" open>
          <PopoverSection label="Kind">
            <Checkbox label="Approval" size="sm" defaultChecked />
          </PopoverSection>
        </Popover>
        <Popover trigger={<Button>Default</Button>} label="Default" open>
          <Checkbox label="A row" />
        </Popover>
      </Inline>
      <div hidden>
        <span data-swatch="raised" className={surfaces.raised} />
        <span data-swatch="overlay" className={surfaces.overlay} />
      </div>
    </main>
  )
}

/** `surface="raised"` fills the box with the opaque surface.raised; a popover without it keeps surface.overlay. */
const surfacePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const body = within(document.body)
  const swatch = (name: string) => {
    const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
    if (el === null) throw new Error(`no swatch ${name}`)
    return getComputedStyle(el).color
  }
  const opaque = await body.findByRole('dialog', { name: 'Opaque' })
  const fallback = await body.findByRole('dialog', { name: 'Default' })
  await expect(getComputedStyle(opaque).backgroundColor).toBe(swatch('raised'))
  // Opaque: no alpha in the computed colour.
  await expect(getComputedStyle(opaque).backgroundColor).toMatch(/^rgb\(/)
  await expect(getComputedStyle(fallback).backgroundColor).toBe(swatch('overlay'))
  await expect(getComputedStyle(fallback).backgroundColor).not.toBe(getComputedStyle(opaque).backgroundColor)
  // The rest of the box stays as it was: radius 12, padding 8, the border and the shadow.
  for (const box of [opaque, fallback]) {
    const style = getComputedStyle(box)
    await expect([style.borderTopLeftRadius, style.paddingTop, style.borderTopWidth]).toEqual(['12px', '8px', '1px'])
    await expect(style.boxShadow).not.toBe('none')
  }
}

export const SurfaceDark: StoryObj<typeof meta> = { render: () => <Surfaces />, globals: { mode: 'dark' }, play: surfacePlay }
export const SurfaceLight: StoryObj<typeof meta> = { render: () => <Surfaces />, globals: { mode: 'light' }, play: surfacePlay }

export const PlacementDark: StoryObj<typeof meta> = { render: () => <Placements />, globals: { mode: 'dark' }, play: placementPlay }
export const PlacementLight: StoryObj<typeof meta> = { render: () => <Placements />, globals: { mode: 'light' }, play: placementPlay }

// The Workbench skill picker (D1 105:406): 160 wide, a SKILLS label, then each skill's mono /name over its
// description, the highlighted row filled and no check.
const skills = [
  { value: 'writer', label: '/writer', description: 'Draft a doc from sources' },
  { value: 'readme', label: '/readme', description: 'Write or check a README' },
  { value: 'pr', label: '/pr-description', description: 'Write a PR description' },
]

function Skills() {
  return (
    <main className={page}>
      <Popover trigger={<Button>/</Button>} label="Skills" placement="bottom-start" width="xs" open>
        <PopoverSection label="Skills">
          <OptionList label="Skills" items={skills} value="writer" labelStyle="mono" check={false} selectedFill />
        </PopoverSection>
      </Popover>
      <OptionList label="Sort by" items={[{ value: 'newest', label: 'Newest first' }]} value="newest" />
      <div hidden>
        <span data-swatch="default" className={css({ color: 'fg.default' })} />
        <span data-swatch="selected" className={css({ color: 'surface.selected' })} />
      </div>
    </main>
  )
}

/** `width="xs"` with an OptionList whose `labelStyle="mono"` and `check={false}`; a default list keeps its check. */
const skillsPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const body = within(document.body)
  const swatch = (name: string) => {
    const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
    if (el === null) throw new Error(`no swatch ${name}`)
    return getComputedStyle(el).color
  }
  const box = await body.findByRole('dialog', { name: 'Skills' })
  await expect(box.getBoundingClientRect().width).toBe(160)
  const name = getComputedStyle(within(box).getByText('/pr-description'))
  await expect([name.fontSize, Math.round(parseFloat(name.lineHeight)), name.fontWeight, name.color]).toEqual(['12px', 16, '400', swatch('default')])
  await expect(name.fontFamily).toMatch(/Mono/)
  const row = within(box).getByRole('radio', { name: '/writer' }).closest('label')
  if (!(row instanceof HTMLElement)) throw new Error('no row')
  await expect(getComputedStyle(row).backgroundColor).toBe(swatch('selected'))
  // No row draws a check or keeps its space, the chosen one included.
  for (const check of box.querySelectorAll('.option-list__itemControl')) await expect(getComputedStyle(check).display).toBe('none')
  // A list without the props keeps its sans label and the check on the chosen row.
  const plain = within(canvasElement).getByText('Newest first')
  await expect(getComputedStyle(plain).fontFamily).not.toMatch(/Mono/)
  const check = plain.closest('label')?.querySelector('.option-list__itemControl')
  if (!(check instanceof HTMLElement)) throw new Error('no check')
  await expect(getComputedStyle(check).display).not.toBe('none')
  await expect(getComputedStyle(check).visibility).toBe('visible')
}

export const SkillsDark: StoryObj<typeof meta> = { render: () => <Skills />, globals: { mode: 'dark' }, play: skillsPlay }
export const SkillsLight: StoryObj<typeof meta> = { render: () => <Skills />, globals: { mode: 'light' }, play: skillsPlay }

// The Workbench skill picker as Figma draws it (D1 105:406): a compact 160 px box, the SKILLS label with a rule,
// and compact rows of a mono /name over a one-line description. "/" in the message box opens it, so the focus stays
// in the trigger. A default popover beside it takes the focus and keeps its spacing.
const narrow = css({ w: 'shell.popoverXs' })

function CompactSkills() {
  return (
    <main className={page}>
      <Inline gap="24">
        <Popover trigger={<Button>/</Button>} label="Compact skills" placement="bottom-start" width="xs" density="compact" autoFocus={false}>
          <PopoverSection label="Skills" rule>
            <OptionList label="Skills" items={skills} value="writer" labelStyle="mono" check={false} selectedFill density="compact" />
          </PopoverSection>
        </Popover>
        <div className={narrow}>
          <OptionList label="Long skill" items={[{ value: 'long', label: '/long', description: 'A description much longer than its one line' }]} labelStyle="mono" check={false} density="compact" />
        </div>
        <Popover trigger={<Button>Sort</Button>} label="Default skills" placement="bottom-start" width="xs">
          <PopoverSection label="Skills">
            <OptionList label="Default list" items={skills} value="writer" labelStyle="mono" check={false} selectedFill />
          </PopoverSection>
        </Popover>
      </Inline>
    </main>
  )
}

const compactSkillsPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const body = within(document.body)
  // Measure in Geist, not in a fallback font.
  await document.fonts.ready
  // A compact description too long for its line stays on one 16 px line and ends with an ellipsis.
  const long = canvas.getByText('A description much longer than its one line')
  await expect(long).toHaveClass('truncated-text')
  await expect(long.scrollWidth).toBeGreaterThan(long.clientWidth)
  await expect(long.getBoundingClientRect().height).toBe(16)
  // A default popover moves the focus into its box, pads 8 and keeps its rows' spacing and `small` descriptions.
  await userEvent.click(canvas.getByRole('button', { name: 'Sort' }))
  const plain = await body.findByRole('dialog', { name: 'Default skills' })
  await waitFor(() => expect(plain.contains(document.activeElement)).toBe(true))
  await expect(getComputedStyle(plain).paddingTop).toBe('8px')
  const plainRow = within(plain).getByRole('radio', { name: '/writer' }).closest('label')
  if (!(plainRow instanceof HTMLElement)) throw new Error('no default row')
  await expect([getComputedStyle(plainRow).paddingTop, getComputedStyle(plainRow).paddingLeft]).toEqual(['8px', '12px'])
  await expect(getComputedStyle(within(plain).getByText('Draft a doc from sources')).fontSize).toBe('12px')
  const plainLabel = plain.querySelector('.popover__sectionLabel')
  if (plainLabel === null) throw new Error('no default label')
  await expect(getComputedStyle(plainLabel, '::after').content).toBe('none')
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(body.queryByRole('dialog', { name: 'Default skills' })).toBeNull())
  await waitFor(() => expect(canvas.getByRole('button', { name: 'Sort' })).toHaveFocus())
  // `autoFocus={false}`: the compact popover opens and the focus stays in its trigger.
  const trigger = canvas.getByRole('button', { name: '/' })
  await userEvent.click(trigger)
  const box = await body.findByRole('dialog', { name: 'Compact skills' })
  // Ark moves the focus a frame after it opens; wait past that frame.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  await expect(trigger).toHaveFocus()
  // 1 + 6 + a 20 px label row + 2 + three 44 px rows 2 apart + 6 + 1: 172, Figma's 160 × 173 on the 4 px grid.
  await expect([box.getBoundingClientRect().width, box.getBoundingClientRect().height]).toEqual([160, 172])
  await expect(getComputedStyle(box).paddingTop).toBe('6px')
  const label = box.querySelector('.popover__sectionLabel')
  if (!(label instanceof HTMLElement)) throw new Error('no label')
  await expect(label.getBoundingClientRect().height).toBe(20)
  // The rule after SKILLS (105:409): 1 px, to the label's end padding.
  const rule = getComputedStyle(label, '::after')
  await expect([rule.borderTopWidth, rule.borderTopStyle]).toEqual(['1px', 'solid'])
  for (const name of ['/writer', '/readme', '/pr-description']) {
    const row = within(box).getByRole('radio', { name }).closest('label')
    if (!(row instanceof HTMLElement)) throw new Error(`no row ${name}`)
    // Figma's rows (105:412): 146 × 44, padded 6 by 8, so the text column is 130.
    await expect([row.getBoundingClientRect().width, row.getBoundingClientRect().height]).toEqual([146, 44])
    await expect([getComputedStyle(row).paddingTop, getComputedStyle(row).paddingLeft]).toEqual(['6px', '8px'])
    const text = row.querySelector('.option-list__itemBody')
    if (!(text instanceof HTMLElement)) throw new Error('no text')
    await expect(text.getBoundingClientRect().width).toBe(130)
    // The description is smallXs, Regular 11/16, on one line.
    const description = row.querySelector('.option-list__itemDescription')
    if (!(description instanceof HTMLElement)) throw new Error('no description')
    const style = getComputedStyle(description)
    await expect([style.fontSize, style.fontWeight, description.getBoundingClientRect().height]).toEqual(['11px', '400', 16])
    await expect(style.fontFamily).not.toMatch(/Mono/)
  }
}

/** `density="compact"`, `autoFocus={false}` and a section `rule`, with a compact OptionList: the Workbench skill picker. */
export const CompactSkillsDark: StoryObj<typeof meta> = { render: () => <CompactSkills />, globals: { mode: 'dark' }, play: compactSkillsPlay }
export const CompactSkillsLight: StoryObj<typeof meta> = { render: () => <CompactSkills />, globals: { mode: 'light' }, play: compactSkillsPlay }
