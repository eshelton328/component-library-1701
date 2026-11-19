import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { FilterChips, type FilterChip } from './filter-chips'
import { expectScrollAreas } from './scroll-area.testing'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', display: 'grid', gap: '24', justifyItems: 'start' })
// A phone-width frame, so the row must scroll.
const narrow = css({ w: 'shell.popoverSm' })

const kinds: readonly FilterChip[] = [
  { value: 'skill', label: 'Skills', count: 12, kind: 'skill' },
  { value: 'agent', label: 'Agents', count: 4, kind: 'agent' },
  { value: 'rule', label: 'Rules', count: 9, kind: 'rule' },
  { value: 'workflow', label: 'Workflows', count: 3, kind: 'workflow' },
  { value: 'hook', label: 'Hooks', count: 0, kind: 'hook', disabled: true },
]
const states: readonly FilterChip[] = [
  { value: 'all', label: 'All', count: 31 },
  { value: 'needs', label: 'Needs you', count: 2 },
  { value: 'done', label: 'Done' },
]

function Chips() {
  return (
    <main className={page}>
      <FilterChips label="Filter by kind" items={kinds} defaultValue={['skill', 'rule']} />
      <FilterChips label="Filter by state" items={states} defaultValue={['all']} multiple={false} />
      <div className={narrow}>
        <FilterChips label="Kinds on a phone" items={kinds} />
      </div>
    </main>
  )
}

const meta = {
  title: 'Forms/Filter chips',
  component: Chips,
  play: async ({ canvasElement }) => {
    // The chip row scrolls with no scroll bar and keeps a swipe at its end from moving the page.
    await expectScrollAreas(canvasElement, 'x', '.filter-chips__root')
    const canvas = within(canvasElement)
    const row = within(canvas.getByRole('group', { name: 'Filter by kind' }))
    const skills = row.getByRole('button', { name: /Skills/ })
    await expect(skills).toHaveAttribute('aria-pressed', 'true')
    await expect(row.getByRole('button', { name: /Agents/ })).toHaveAttribute('aria-pressed', 'false')
    await expect(skills.getBoundingClientRect().height).toBe(32)
    await expect(getComputedStyle(skills).borderColor).not.toBe(getComputedStyle(row.getByRole('button', { name: /Agents/ })).borderColor)
    // Each kind dot is 8 px and has its own colour, from staticCss.
    const dots = [...canvas.getByRole('group', { name: 'Filter by kind' }).querySelectorAll('.filter-chips__dot')]
    await expect(dots.map((d) => d.getBoundingClientRect().width)).toEqual([8, 8, 8, 8, 8])
    await expect(new Set(dots.map((d) => getComputedStyle(d).backgroundColor)).size).toBe(5)
    await expect(row.getByRole('button', { name: /Skills/ })).toHaveTextContent('Skills12')
    const hooks = row.getByRole('button', { name: /Hooks/ })
    await expect(hooks).toBeDisabled()
    await expect(getComputedStyle(hooks).opacity).toBe('0.45')
    const phone = canvas.getByRole('group', { name: 'Kinds on a phone' })
    await expect(phone.scrollWidth).toBeGreaterThan(phone.clientWidth)
    // A row that scrolls fades out at each edge with more chips past it; a row that fits has no fade.
    const wide = canvas.getByRole('group', { name: 'Filter by kind' })
    await expect(wide).not.toHaveAttribute('data-overflow-start')
    await expect(wide).not.toHaveAttribute('data-overflow-end')
    await expect(getComputedStyle(wide).maskImage).toBe('none')
    await waitFor(() => expect(phone).toHaveAttribute('data-overflow-end'))
    await expect(phone).not.toHaveAttribute('data-overflow-start')
    await expect(getComputedStyle(phone).maskImage).toContain('linear-gradient')
    phone.scrollLeft = phone.scrollWidth
    await waitFor(() => expect(phone).toHaveAttribute('data-overflow-start'))
    await waitFor(() => expect(phone).not.toHaveAttribute('data-overflow-end'))
    phone.scrollLeft = 0
    await waitFor(() => expect(phone).not.toHaveAttribute('data-overflow-start'))
    await expect(phone).toHaveAttribute('data-overflow-end')
  },
} satisfies Meta<typeof Chips>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onKinds = fn<(value: string[]) => void>()
const onState = fn<(value: string[]) => void>()

function Controlled() {
  const [value, setValue] = useState<string[]>(['skill'])
  return (
    <main className={page}>
      <FilterChips
        label="Filter by kind"
        items={kinds}
        value={value}
        onValueChange={(v) => {
          setValue(v)
          onKinds(v)
        }}
      />
      <FilterChips label="Filter by state" items={states} defaultValue={['all']} multiple={false} onValueChange={onState} />
      <div className={narrow}>
        <FilterChips label="Kinds on a phone" items={kinds} />
      </div>
    </main>
  )
}

/** A click and Enter toggle chips; one-choice chips replace the choice; a disabled chip ignores clicks. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    onKinds.mockClear()
    onState.mockClear()
    const canvas = within(canvasElement)
    const kindRow = within(canvas.getByRole('group', { name: 'Filter by kind' }))
    await userEvent.click(kindRow.getByRole('button', { name: /Agents/ }))
    await expect(onKinds).toHaveBeenLastCalledWith(['skill', 'agent'])
    await userEvent.click(kindRow.getByRole('button', { name: /Skills/ }))
    await expect(onKinds).toHaveBeenLastCalledWith(['agent'])
    await userEvent.keyboard('{Enter}')
    await expect(onKinds).toHaveBeenLastCalledWith(['agent', 'skill'])
    await userEvent.click(kindRow.getByRole('button', { name: /Hooks/ }))
    await expect(onKinds).toHaveBeenCalledTimes(3)
    // One-choice chips are a radio group.
    await userEvent.click(canvas.getByRole('radio', { name: /Needs you/ }))
    await expect(onState).toHaveBeenLastCalledWith(['needs'])
    await expect(canvas.getByRole('radio', { name: /^All/ })).not.toBeChecked()
    // The chosen chip cannot be turned off, and the arrow keys move the choice.
    await userEvent.click(canvas.getByRole('radio', { name: /Needs you/ }))
    await expect(canvas.getByRole('radio', { name: /Needs you/ })).toBeChecked()
    await expect(onState).toHaveBeenCalledTimes(1)
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(onState).toHaveBeenLastCalledWith(['done']))
    await expect(canvas.getByRole('radio', { name: /Done/ })).toBeChecked()
    // In a narrow row, End moves the focus to the last enabled chip and scrolls it into view.
    const phone = canvas.getByRole('group', { name: 'Kinds on a phone' })
    within(phone).getByRole('button', { name: /Skills/ }).focus()
    await userEvent.keyboard('{End}')
    const last = within(phone).getByRole('button', { name: /Workflows/ })
    await waitFor(() => expect(last).toHaveFocus())
    await waitFor(() => expect(last.getBoundingClientRect().right).toBeLessThanOrEqual(phone.getBoundingClientRect().right + 1))
  },
}

// The Inbox D1 chip row (346:151): five chips in a 395 px list pane.
const inbox: readonly FilterChip[] = [
  { value: 'all', label: 'All', count: 31 },
  { value: 'needs', label: 'Needs you', count: 4 },
  { value: 'working', label: 'Working', count: 6 },
  { value: 'review', label: 'Review', count: 2 },
  { value: 'done', label: 'Done' },
]
// The list pane's width less its 12 px sides is 396; the nearest width token under it is shell.popoverPicker (380).
const pane = css({ w: 'shell.popoverPicker' })

function Compact() {
  return (
    <main className={page}>
      <div className={pane}>
        <FilterChips label="Inbox filter" items={inbox} defaultValue={['all']} multiple={false} size="compact" />
      </div>
      <FilterChips label="Default size" items={inbox} defaultValue={['all']} multiple={false} />
    </main>
  )
}

/** The compact size (Inbox D1 346:152): 30 high, 8 px sides, a 12 px label, 6 apart; the five Inbox chips fit the pane. */
const compactPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const row = canvas.getByLabelText('Inbox filter')
  const all = within(row).getByRole('radio', { name: /^All/ })
  const style = getComputedStyle(all)
  await expect(all.getBoundingClientRect().height).toBe(30)
  await expect([style.paddingLeft, style.paddingRight, style.fontSize]).toEqual(['8px', '8px', '12px'])
  await expect(getComputedStyle(row).columnGap).toBe('6px')
  await expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth)
  await expect(row).not.toHaveAttribute('data-overflow-end')
  // The default size stays 32 high with the 14 px label.
  const other = within(canvas.getByLabelText('Default size')).getByRole('radio', { name: /^All/ })
  await expect([other.getBoundingClientRect().height, getComputedStyle(other).fontSize]).toEqual([32, '14px'])
}

export const CompactDark: StoryObj<typeof meta> = { render: () => <Compact />, globals: { mode: 'dark' }, play: compactPlay }
export const CompactLight: StoryObj<typeof meta> = { render: () => <Compact />, globals: { mode: 'light' }, play: compactPlay }

function Phone() {
  return (
    <main className={page}>
      <FilterChips label="Inbox phone filter" items={inbox} defaultValue={['all']} multiple={false} size="phone" />
      <FilterChips label="Compact" items={inbox} defaultValue={['all']} multiple={false} size="compact" />
    </main>
  )
}

/** The phone size (Inbox M1 346:9014): compact's 30 px height and 12 px label, with 12 px sides. */
const phonePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const chip = (label: string) => within(canvas.getByLabelText(label)).getByRole('radio', { name: /^All/ })
  const phone = chip('Inbox phone filter')
  const compact = chip('Compact')
  const style = getComputedStyle(phone)
  await expect(phone.getBoundingClientRect().height).toBe(30)
  await expect([style.paddingLeft, style.paddingRight, style.fontSize]).toEqual(['12px', '12px', '12px'])
  // 4 px wider at each side than the compact chip, the only difference.
  await expect(phone.getBoundingClientRect().width - compact.getBoundingClientRect().width).toBe(8)
}

export const PhoneDark: StoryObj<typeof meta> = { render: () => <Phone />, globals: { mode: 'dark' }, play: phonePlay }
export const PhoneLight: StoryObj<typeof meta> = { render: () => <Phone />, globals: { mode: 'light' }, play: phonePlay }

// Hidden swatches of the count colours.
const subtle = css({ color: 'fg.subtle' })
const muted = css({ color: 'fg.muted' })

function Counts() {
  return (
    <main className={page}>
      <div className={pane}>
        <FilterChips label="Inbox filter" items={inbox} defaultValue={['all']} multiple={false} size="compact" />
      </div>
      <FilterChips label="Default size" items={inbox} defaultValue={['all']} multiple={false} />
      <span hidden className={subtle} data-testid="swatch-subtle" />
      <span hidden className={muted} data-testid="swatch-muted" />
    </main>
  )
}

/** The counts (Inbox D1 346:152): fg.subtle on an idle chip, dimmer than its fg.muted label; fg.muted on the selected chip. */
const countsPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const sw = (name: string) => getComputedStyle(canvas.getByTestId(`swatch-${name}`)).color
  await expect(sw('subtle')).not.toBe(sw('muted'))
  for (const label of ['Inbox filter', 'Default size']) {
    const row = within(canvas.getByLabelText(label))
    const count = (name: RegExp) => {
      const el = row.getByRole('radio', { name }).querySelector('.filter-chips__count')
      if (el === null) throw new Error(`no count in ${label}`)
      return getComputedStyle(el)
    }
    const idle = row.getByRole('radio', { name: /Needs you/ })
    await expect(count(/Needs you/).color).toBe(sw('subtle'))
    await expect(getComputedStyle(idle).color).toBe(sw('muted'))
    await expect(count(/^All/).color).toBe(sw('muted'))
    await expect(count(/Needs you/).fontFamily).toMatch(/mono/i)
  }
}

export const CountsDark: StoryObj<typeof meta> = { render: () => <Counts />, globals: { mode: 'dark' }, play: countsPlay }
export const CountsLight: StoryObj<typeof meta> = { render: () => <Counts />, globals: { mode: 'light' }, play: countsPlay }

// The Toolkit kind chips (D1 425:32, M1 429:61): `padding="none"` puts them flush with the row, 6 apart; each chip
// is 32 high with the label 11 px from its edge (the 1 px border and 10 px sides, M1 429:63). On the phone the row
// is 366 wide (360 here, shell.popoverLg) and the fifth chip, Workflows, starts inside it, so the row reads as one
// that scrolls (M1 429:77 starts at 352).
const toolkitKinds: readonly FilterChip[] = [
  { value: 'all', label: 'All', count: 27 },
  { value: 'skill', label: 'Skills', count: 9, kind: 'skill' },
  { value: 'agent', label: 'Agents', count: 7, kind: 'agent' },
  { value: 'rule', label: 'Rules', count: 8, kind: 'rule' },
  { value: 'workflow', label: 'Workflows', count: 2, kind: 'workflow' },
  { value: 'hook', label: 'Hooks', count: 1, kind: 'hook' },
]
const phoneRow = css({ w: 'shell.popoverLg' })

function Flush() {
  return (
    <main className={page}>
      <FilterChips label="Toolkit kinds" items={toolkitKinds} defaultValue={['all']} multiple={false} padding="none" />
      <div className={phoneRow}>
        <FilterChips label="Toolkit kinds on a phone" items={toolkitKinds} defaultValue={['all']} multiple={false} padding="none" />
      </div>
      <FilterChips label="Padded" items={toolkitKinds} defaultValue={['all']} multiple={false} />
    </main>
  )
}

const flushPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const row = canvas.getByLabelText('Toolkit kinds')
  const box = row.getBoundingClientRect()
  const chips = within(row).getAllByRole('radio')
  const first = chips[0]
  if (first === undefined) throw new Error('no chip')
  // No inset: the row is as high as its chips, and the first chip starts at its edge.
  await expect(getComputedStyle(row).paddingLeft).toBe('0px')
  await expect(first.getBoundingClientRect().left).toBe(box.left)
  await expect(first.getBoundingClientRect().height).toBe(32)
  await expect(box.height).toBe(32)
  await expect(getComputedStyle(row).columnGap).toBe('6px')
  const style = getComputedStyle(first)
  await expect([style.paddingLeft, style.paddingRight, style.borderLeftWidth]).toEqual(['10px', '10px', '1px'])
  // The focus ring sits inside the chip, so the row's clip leaves it whole.
  first.focus()
  await waitFor(() => expect(getComputedStyle(first).outlineStyle).toBe('solid'))
  await expect(getComputedStyle(first).outlineOffset).toBe('-2px')
  // On the phone row the fifth chip starts inside the row, and the row scrolls.
  const phone = canvas.getByLabelText('Toolkit kinds on a phone')
  const workflows = within(phone).getByRole('radio', { name: /Workflows/ })
  await expect(workflows.getBoundingClientRect().left).toBeLessThan(phone.getBoundingClientRect().right)
  await expect(phone.scrollWidth).toBeGreaterThan(phone.clientWidth)
  // The default padding stays 2 px around the chips.
  const padded = canvas.getByLabelText('Padded')
  await expect(getComputedStyle(padded).paddingLeft).toBe('2px')
  await expect(padded.getBoundingClientRect().height).toBe(36)
}

/** `padding="none"`: the Toolkit chip row, flush with no inset; the default row keeps its 2 px. */
export const FlushDark: StoryObj<typeof meta> = { render: () => <Flush />, globals: { mode: 'dark' }, play: flushPlay }
export const FlushLight: StoryObj<typeof meta> = { render: () => <Flush />, globals: { mode: 'light' }, play: flushPlay }

// The Toolkit Activity kind chips (D21 491:4396): the row is narrower than its chips and Figma draws the cut
// Workflows chip (491:4412) at full strength up to the edge. `fade="none"` draws no mask; the default fades.
function NoFade() {
  return (
    <main className={page}>
      <div className={narrow}>
        <FilterChips label="Kinds with no fade" items={toolkitKinds} defaultValue={['all']} multiple={false} padding="none" fade="none" />
      </div>
      <div className={narrow}>
        <FilterChips label="Kinds with the fade" items={toolkitKinds} defaultValue={['all']} multiple={false} padding="none" />
      </div>
    </main>
  )
}

const noFadePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const plain = canvas.getByLabelText('Kinds with no fade')
  const faded = canvas.getByLabelText('Kinds with the fade')
  // Both rows overflow at the end and mark it.
  await waitFor(() => expect(plain).toHaveAttribute('data-overflow-end'))
  await waitFor(() => expect(faded).toHaveAttribute('data-overflow-end'))
  await expect(plain.scrollWidth).toBeGreaterThan(plain.clientWidth)
  // No mask with `fade="none"`; the default keeps its gradient.
  await expect(getComputedStyle(plain).maskImage).toBe('none')
  await expect(getComputedStyle(faded).maskImage).toContain('linear-gradient')
  // Scrolled to the end, the start overflows, and still no mask.
  plain.scrollLeft = plain.scrollWidth
  await waitFor(() => expect(plain).toHaveAttribute('data-overflow-start'))
  await expect(getComputedStyle(plain).maskImage).toBe('none')
}

/** `fade="none"`: a row that scrolls with no fade at its edges (Toolkit Activity, D21). */
export const NoFadeDark: StoryObj<typeof meta> = { render: () => <NoFade />, globals: { mode: 'dark' }, play: noFadePlay }
export const NoFadeLight: StoryObj<typeof meta> = { render: () => <NoFade />, globals: { mode: 'light' }, play: noFadePlay }
