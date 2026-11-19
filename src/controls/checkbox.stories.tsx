import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { BrainIcon, TerminalIcon } from '../foundations/icons'
import { Checkbox, CheckboxGroup } from './checkbox'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', display: 'grid', gap: '24', justifyItems: 'start' })
const popover = css({ bg: 'surface.overlay', p: '16', borderRadius: 'xl', w: 'shell.popoverLg' })

const kinds = [
  { value: 'task', label: 'Tasks' },
  { value: 'artifact', label: 'Artifacts' },
  { value: 'skill', label: 'Skills' },
  { value: 'agent', label: 'Agents', disabled: true },
] as const

function Checks() {
  return (
    <main className={page}>
      <Checkbox label="Unchecked" />
      <Checkbox label="Checked" defaultChecked />
      <Checkbox label="Partly checked" checked="indeterminate" />
      <Checkbox label="Disabled" disabled />
      <div className={popover}>
        <CheckboxGroup label="Kind" items={kinds} defaultValue={['task', 'skill']} />
      </div>
      <CheckboxGroup label="Disabled kind" items={[{ value: 'task', label: 'Open tasks', disabled: false }]} disabled />
    </main>
  )
}

const meta = {
  title: 'Forms/Checkbox',
  component: Checks,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('checkbox', { name: 'Unchecked' })).not.toBeChecked()
    await expect(canvas.getByRole('checkbox', { name: 'Checked' })).toBeChecked()
    await expect(canvas.getByRole('checkbox', { name: 'Partly checked' })).toBePartiallyChecked()
    const disabled = canvas.getByRole('checkbox', { name: 'Disabled' })
    await expect(disabled).toBeDisabled()
    await expect(getComputedStyle(disabled.closest('label') ?? disabled).opacity).toBe('0.45')
    // The box is 16 px, and the checked box has another fill than the unchecked one.
    const box = (name: string) => {
      const root = canvas.getByRole('checkbox', { name }).closest('label')
      const control = root?.querySelector('[data-part="control"]')
      if (!(control instanceof HTMLElement)) throw new Error(`no control for ${name}`)
      return control
    }
    await expect(box('Checked').getBoundingClientRect().width).toBe(16)
    // An unchecked box border is the muted text colour of the group label at 0.7 (border.control).
    const muted = getComputedStyle(canvas.getByText('Kind')).color
    await expect(muted).toMatch(/^rgb\(/)
    await expect(getComputedStyle(box('Unchecked')).borderTopColor).toBe(muted.replace('rgb(', 'rgba(').replace(')', ', 0.7)'))
    await expect(getComputedStyle(box('Checked')).backgroundColor).not.toBe(getComputedStyle(box('Unchecked')).backgroundColor)
    const group = canvas.getByRole('group', { name: 'Kind' })
    await expect(within(group).getByRole('checkbox', { name: 'Tasks' })).toBeChecked()
    await expect(within(group).getByRole('checkbox', { name: 'Artifacts' })).not.toBeChecked()
    await expect(within(group).getByRole('checkbox', { name: 'Agents' })).toBeDisabled()
    // An item's `disabled: false` does not clear a disabled group.
    await expect(canvas.getByRole('checkbox', { name: 'Open tasks' })).toBeDisabled()
  },
} satisfies Meta<typeof Checks>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onValueChange = fn<(value: string[]) => void>()
const onCheckedChange = fn<(checked: boolean) => void>()

function Controlled() {
  const [value, setValue] = useState<string[]>(['task'])
  return (
    <main className={page}>
      <Checkbox label="Only unread" onCheckedChange={onCheckedChange} />
      <CheckboxGroup
        label="Kind"
        items={kinds}
        value={value}
        onValueChange={(v) => {
          setValue(v)
          onValueChange(v)
        }}
      />
      <p>Show {value.length}</p>
    </main>
  )
}

/** A click and Space toggle a box; the group reports the checked values; a disabled box ignores clicks. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    onValueChange.mockClear()
    onCheckedChange.mockClear()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText('Only unread'))
    await expect(onCheckedChange).toHaveBeenLastCalledWith(true)
    await userEvent.keyboard(' ')
    await expect(onCheckedChange).toHaveBeenLastCalledWith(false)
    await userEvent.click(canvas.getByText('Skills'))
    await expect(onValueChange).toHaveBeenLastCalledWith(['task', 'skill'])
    await expect(canvas.getByText('Show 2')).toBeInTheDocument()
    await userEvent.click(canvas.getByText('Tasks'))
    await expect(onValueChange).toHaveBeenLastCalledWith(['skill'])
    await userEvent.click(canvas.getByText('Agents'))
    await expect(onValueChange).toHaveBeenCalledTimes(2)
    await expect(canvas.getByRole('checkbox', { name: 'Agents' })).not.toBeChecked()
  },
}

// The Inbox Filter menu (D4 346:1737): each row ends in its count (346:1747).
const filterMenu = css({ bg: 'surface.overlay', p: '8', borderRadius: 'xl', w: 'shell.popoverFilter' })
const counted = [
  { value: 'approval', label: 'Approval', trailing: 3 },
  { value: 'question', label: 'Question', trailing: 0 },
  { value: 'review', label: 'Review', trailing: 12 },
] as const

function Counts() {
  return (
    <main className={page}>
      <div className={filterMenu}>
        <CheckboxGroup label="Kind" items={counted} defaultValue={['approval']} />
      </div>
      <div className={filterMenu}>
        <Checkbox label="Only unread" trailing="7" defaultChecked />
        <Checkbox label="No count" trailing={false} />
      </div>
    </main>
  )
}

/** A trailing count sits at the end of the row, in mono, outside the box's accessible name; `0` shows, `false` does not. */
const countsPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const row = (name: string) => {
    const root = canvas.getByRole('checkbox', { name }).closest('label')
    if (!(root instanceof HTMLElement)) throw new Error(`no row for ${name}`)
    return root
  }
  for (const [name, count] of [['Approval', '3'], ['Question', '0'], ['Review', '12'], ['Only unread', '7']] as const) {
    const end = row(name).querySelector('.checkbox__trailing')
    if (!(end instanceof HTMLElement)) throw new Error(`no count for ${name}`)
    await expect(end).toHaveTextContent(count)
    // Pushed to the end of the row.
    await expect(Math.round(end.getBoundingClientRect().right)).toBe(Math.round(row(name).getBoundingClientRect().right))
    await expect(getComputedStyle(end).fontFamily).toMatch(/Mono/)
  }
  await expect(row('No count').querySelector('.checkbox__trailing')).toBeNull()
  await userEvent.click(canvas.getByText('Question'))
  await expect(canvas.getByRole('checkbox', { name: 'Question' })).toBeChecked()
}

export const TrailingDark: StoryObj<typeof meta> = { render: () => <Counts />, globals: { mode: 'dark' }, play: countsPlay }
export const TrailingLight: StoryObj<typeof meta> = { render: () => <Counts />, globals: { mode: 'light' }, play: countsPlay }

// The Inbox Filter menu sets project and tag names in mono (346:1787,
// 346:1824: Geist Mono 12) and the kinds in sans.
const projects = [
  { value: 'ncc-1701', label: 'ncc-1701', trailing: 5, labelStyle: 'mono' },
  { value: 'the-bridge', label: 'project/ncc-1701/the-bridge', trailing: 2, labelStyle: 'mono' },
  { value: 'approval', label: 'Approval', trailing: 3 },
] as const

const monoSample = css({ textStyle: 'mono' })

function MonoLabels() {
  return (
    <main className={page}>
      <div className={filterMenu}>
        <CheckboxGroup label="Project" items={projects} defaultValue={['ncc-1701']} />
      </div>
      <Checkbox label="global/decision" labelStyle="mono" />
      <span data-testid="mono-sample" className={monoSample} hidden>
        mono
      </span>
    </main>
  )
}

/** `labelStyle="mono"` draws the label in the mono style; a row without it keeps the body style. */
const monoPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const labelOf = (name: string) => {
    const label = canvas.getByRole('checkbox', { name }).closest('label')?.querySelector('.checkbox__label')
    if (!(label instanceof HTMLElement)) throw new Error(`no label for ${name}`)
    return getComputedStyle(label)
  }
  const sample = canvas.getByTestId('mono-sample')
  const mono = getComputedStyle(sample)
  for (const name of ['ncc-1701', 'project/ncc-1701/the-bridge', 'global/decision']) {
    await expect(labelOf(name).fontFamily).toBe(mono.fontFamily)
    await expect(labelOf(name).fontSize).toBe(mono.fontSize)
  }
  await expect(labelOf('Approval').fontFamily).not.toBe(mono.fontFamily)
  // The mono label is still the accessible name, and the row still toggles.
  await userEvent.click(canvas.getByText('global/decision'))
  await expect(canvas.getByRole('checkbox', { name: 'global/decision' })).toBeChecked()
}

export const MonoLabelDark: StoryObj<typeof meta> = { render: () => <MonoLabels />, globals: { mode: 'dark' }, play: monoPlay }
export const MonoLabelLight: StoryObj<typeof meta> = { render: () => <MonoLabels />, globals: { mode: 'light' }, play: monoPlay }

// `size="sm"`: the type of the Inbox Filter menu (D4 346:1737). The kind
// labels are Geist Regular 12 (346:1745), the project labels Geist Mono 12
// (346:1787) and the counts Geist Mono 11 (346:1747).
const smallKinds = [
  { value: 'approval', label: 'Approval', trailing: 1 },
  { value: 'question', label: 'Question', trailing: 1 },
  { value: 'ncc-1701', label: 'ncc-1701', trailing: 5, labelStyle: 'mono' },
] as const

function Small() {
  return (
    <main className={page}>
      <div className={filterMenu}>
        <CheckboxGroup label="Kind" items={smallKinds} defaultValue={['approval']} size="sm" />
      </div>
      <div className={filterMenu}>
        <Checkbox label="Next step" trailing="3" size="sm" defaultChecked />
        <Checkbox label="Only unread" trailing="7" />
      </div>
    </main>
  )
}

/** `size="sm"` sets a text label in `small` (12/16) and the count in `monoSm` (11/16); a mono label and the box keep their size. */
const smallPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const part = (name: string, slot: 'label' | 'trailing' | 'control') => {
    const el = canvas.getByRole('checkbox', { name }).closest('label')?.querySelector(`.checkbox__${slot}`)
    if (!(el instanceof HTMLElement)) throw new Error(`no ${slot} for ${name}`)
    return el
  }
  const font = (el: HTMLElement) => {
    const s = getComputedStyle(el)
    return [s.fontSize, Math.round(Number.parseFloat(s.lineHeight)), s.fontWeight]
  }
  const mono = /Mono/
  for (const name of ['Approval', 'Question', 'Next step']) {
    await expect(font(part(name, 'label'))).toEqual(['12px', 16, '400'])
    await expect(getComputedStyle(part(name, 'label')).fontFamily).not.toMatch(mono)
  }
  for (const name of ['Approval', 'ncc-1701', 'Next step']) {
    await expect(font(part(name, 'trailing'))).toEqual(['11px', 16, '400'])
    await expect(getComputedStyle(part(name, 'trailing')).fontFamily).toMatch(mono)
  }
  // A mono label stays in mono (12/16).
  await expect(font(part('ncc-1701', 'label'))).toEqual(['12px', 16, '400'])
  await expect(getComputedStyle(part('ncc-1701', 'label')).fontFamily).toMatch(mono)
  // The box stays 16; the default size keeps body (14/20) and mono (12) for the count.
  await expect(part('Next step', 'control').getBoundingClientRect().width).toBe(16)
  // A small row is 28 high, as Figma's Filter menu rows (D4 346:1740); the default row keeps control.md (32).
  const rowOf = (name: string) => canvas.getByRole('checkbox', { name }).closest('label')?.getBoundingClientRect().height
  for (const name of ['Approval', 'Question', 'ncc-1701', 'Next step']) await expect(rowOf(name)).toBe(28)
  await expect(rowOf('Only unread')).toBe(32)
  await expect(font(part('Only unread', 'label'))).toEqual(['14px', 20, '400'])
  await expect(getComputedStyle(part('Only unread', 'trailing')).fontSize).toBe('12px')
  await userEvent.click(canvas.getByText('Question'))
  await expect(canvas.getByRole('checkbox', { name: 'Question' })).toBeChecked()
}

export const SmallDark: StoryObj<typeof meta> = { render: () => <Small />, globals: { mode: 'dark' }, play: smallPlay }
export const SmallLight: StoryObj<typeof meta> = { render: () => <Small />, globals: { mode: 'light' }, play: smallPlay }

// `tone="discuss"`: the new tasks a discussion proposes (Inbox M21 402:7278) have violet checked boxes, #9e8fff
// (accent.discuss); the default box stays cyan.
function Discuss() {
  return (
    <main className={page}>
      <div className={popover}>
        <Checkbox label="Write the tickets" tone="discuss" defaultChecked />
        <Checkbox label="Also remove this task" tone="discuss" />
        <Checkbox label="Only unread" defaultChecked />
      </div>
      <div hidden>
        <span data-swatch="discuss" className={css({ bg: 'accent.discuss' })} />
        <span data-swatch="accent" className={css({ bg: 'accent.default' })} />
        <span data-swatch="control" className={css({ bg: 'border.control' })} />
        <span data-swatch="onAccent" className={css({ bg: 'fg.onAccent' })} />
      </div>
    </main>
  )
}

const discussPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const swatch = (name: string) => getComputedStyle(canvasElement.querySelector(`[data-swatch="${name}"]`) ?? canvasElement).backgroundColor
  const box = (name: string) => {
    const el = canvas.getByRole('checkbox', { name }).closest('label')?.querySelector('.checkbox__control')
    if (!(el instanceof HTMLElement)) throw new Error(`no box for ${name}`)
    return getComputedStyle(el)
  }
  // A checked discuss box is violet, fill and border, with the check in fg.onAccent.
  const picked = box('Write the tickets')
  await expect([picked.backgroundColor, picked.borderTopColor, picked.color]).toEqual([swatch('discuss'), swatch('discuss'), swatch('onAccent')])
  // An unchecked one keeps the control border, and the default tone stays cyan.
  await expect(box('Also remove this task').borderTopColor).toBe(swatch('control'))
  await expect(box('Only unread').backgroundColor).toBe(swatch('accent'))
  await userEvent.click(canvas.getByText('Also remove this task'))
  await expect(box('Also remove this task').backgroundColor).toBe(swatch('discuss'))
}

export const DiscussDark: StoryObj<typeof meta> = { render: () => <Discuss />, globals: { mode: 'dark' }, play: discussPlay }
export const DiscussLight: StoryObj<typeof meta> = { render: () => <Discuss />, globals: { mode: 'light' }, play: discussPlay }

// `description` and `size="compact"`: a new task in a discussion proposal (D17 403:2435, T20 402:11865, M21 402:7278).
// Figma's box is 52 high: 9 padding inside a 1 px border, the title 13 px on a 17 px line (403:2440) and the meta
// line Geist Mono 11 on 14 (403:2441), past the 16 px box and its 10 px gap. The box here pads 6 inside its border.
const taskBox = css({
  py: '6',
  px: '10',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'lg',
  w: 'shell.popoverLg',
})

function Tasks() {
  return (
    <main className={page}>
      <div className={taskBox} data-testid="task">
        <Checkbox label="Write the Workbench tickets" description="ncc-1701 · f-005 · from NCC-28" tone="discuss" size="compact" defaultChecked />
      </div>
      <Checkbox label="With a description" description="the-bridge · from NCC-31" />
      <Checkbox label="Small with a description" description="omni-brain" size="sm" />
      <Checkbox label="Only unread" />
      <span data-swatch="muted" className={css({ color: 'fg.muted' })} hidden />
    </main>
  )
}

/** The compact title is bodySm (13/20), the description monoSm (11/16) in fg.muted under it; the default row is unchanged. */
const taskPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const part = (name: string, slot: 'root' | 'label' | 'description' | 'control') => {
    const root = canvas.getByRole('checkbox', { name }).closest('label')
    const el = slot === 'root' ? root : root?.querySelector(`.checkbox__${slot}`)
    if (!(el instanceof HTMLElement)) throw new Error(`no ${slot} for ${name}`)
    return el
  }
  const font = (el: HTMLElement) => {
    const s = getComputedStyle(el)
    return [s.fontSize, Math.round(Number.parseFloat(s.lineHeight)), s.fontWeight]
  }
  const box = (el: HTMLElement) => el.getBoundingClientRect()
  const muted = getComputedStyle(canvasElement.querySelector('[data-swatch="muted"]') ?? canvasElement).color
  const task = 'Write the Workbench tickets'

  // The description is not part of the name; it is the box's description.
  const input = canvas.getByRole('checkbox', { name: task })
  await expect(input).toHaveAccessibleDescription('ncc-1701 · f-005 · from NCC-28')
  // The title is Regular 13/20 in sans, the description Geist Mono 11/16 in fg.muted.
  await expect(font(part(task, 'label'))).toEqual(['13px', 20, '400'])
  await expect(getComputedStyle(part(task, 'label')).fontFamily).not.toMatch(/Mono/)
  const desc = part(task, 'description')
  await expect(font(desc)).toEqual(['11px', 16, '400'])
  await expect(getComputedStyle(desc).fontFamily).toMatch(/Mono/)
  await expect(getComputedStyle(desc).color).toBe(muted)
  // The description starts under the title, 2 below it, past the 16 px box and the 10 px gap.
  const label = box(part(task, 'label'))
  await expect(box(desc).left).toBe(label.left)
  await expect(box(desc).top - label.bottom).toBe(2)
  await expect(label.left - box(part(task, 'control')).left).toBe(26)
  // The row is 38 high, over the 32 px touch minimum, so the box is Figma's 52 and the 16 px box is centred, 18 down.
  await expect(box(part(task, 'root')).height).toBe(38)
  const frame = box(canvas.getByTestId('task'))
  await expect(frame.height).toBe(52)
  await expect(box(part(task, 'control')).top - frame.top).toBe(18)

  // At the default size the description is mono (12/16); at sm monoSm (11/16).
  await expect(font(part('With a description', 'description'))).toEqual(['12px', 16, '400'])
  await expect(font(part('Small with a description', 'description'))).toEqual(['11px', 16, '400'])
  // A row without a description keeps body (14/20), the 32 px row and no description.
  await expect(font(part('Only unread', 'label'))).toEqual(['14px', 20, '400'])
  await expect(box(part('Only unread', 'root')).height).toBe(32)
  await expect(part('Only unread', 'root').querySelector('.checkbox__description')).toBeNull()
  await expect(canvas.getByRole('checkbox', { name: 'Only unread' })).not.toHaveAttribute('aria-describedby')

  // A press on the description toggles the box, as one on the label does.
  await userEvent.click(desc)
  await expect(input).not.toBeChecked()
}

export const TaskDark: StoryObj<typeof meta> = { render: () => <Tasks />, globals: { mode: 'dark' }, play: taskPlay }
export const TaskLight: StoryObj<typeof meta> = { render: () => <Tasks />, globals: { mode: 'light' }, play: taskPlay }

// `inline` and `labelTone="muted"`: "Also remove this task" under the new tasks of a discussion proposal (T20
// 402:11886): a 16 px row, the label in Geist 12/16 #8a97b8 (`small` at `size="sm"`, fg.muted), 8 after the box.
const proposal = css({ bg: 'surface.inset', p: '12', borderRadius: 'xl', w: 'shell.popoverLg', display: 'grid', gap: '12', justifyItems: 'start' })

function InlineRows() {
  return (
    <main className={page}>
      <div className={proposal}>
        <Checkbox label="Write the tickets" size="compact" tone="discuss" defaultChecked />
        <Checkbox label="Also remove this task" size="sm" tone="discuss" labelTone="muted" inline />
      </div>
      <Checkbox label="Only unread" size="sm" />
      <div hidden>
        <span data-swatch="muted" className={css({ color: 'fg.muted' })} />
        <span data-swatch="default" className={css({ color: 'fg.default' })} />
      </div>
    </main>
  )
}

/** An inline row is as high as its 12/16 label, 8 after the box, muted; its press area reaches 4 above and below. */
const inlinePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const swatch = (name: string) => {
    const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
    if (el === null) throw new Error(`no swatch ${name}`)
    return getComputedStyle(el).color
  }
  const part = (name: string, slot: 'root' | 'label' | 'control') => {
    const root = canvas.getByRole('checkbox', { name }).closest('label')
    if (!(root instanceof HTMLElement)) throw new Error(`no row for ${name}`)
    if (slot === 'root') return root
    const el = root.querySelector(`.checkbox__${slot}`)
    if (!(el instanceof HTMLElement)) throw new Error(`no ${slot} for ${name}`)
    return el
  }
  const font = (el: HTMLElement) => {
    const s = getComputedStyle(el)
    return [s.fontSize, Math.round(Number.parseFloat(s.lineHeight)), s.fontWeight]
  }
  const row = part('Also remove this task', 'root')
  const label = part('Also remove this task', 'label')
  const control = part('Also remove this task', 'control')
  await expect(row.getBoundingClientRect().height).toBe(16)
  await expect(control.getBoundingClientRect().width).toBe(16)
  await expect(font(label)).toEqual(['12px', 16, '400'])
  await expect(getComputedStyle(label).fontFamily).not.toMatch(/Mono/)
  await expect(getComputedStyle(label).color).toBe(swatch('muted'))
  await expect(Math.round(label.getBoundingClientRect().left - control.getBoundingClientRect().right)).toBe(8)
  // The press area: a point 3 px above and below the row is still the row, and a press there toggles the box.
  const r = row.getBoundingClientRect()
  const x = Math.round(r.left + r.width / 2)
  await expect(document.elementFromPoint(x, r.top - 3)).toBe(row)
  await expect(document.elementFromPoint(x, r.bottom + 3)).toBe(row)
  const box = canvas.getByRole('checkbox', { name: 'Also remove this task' })
  await userEvent.click(row)
  await expect(box).toBeChecked()

  // A small row without them keeps the small row's 28 px (control.sm, D4 346:1740), fg.default and the 10 px gap.
  const plain = part('Only unread', 'root')
  await expect(plain.getBoundingClientRect().height).toBe(28)
  await expect(getComputedStyle(part('Only unread', 'label')).color).toBe(swatch('default'))
  await expect(Math.round(part('Only unread', 'label').getBoundingClientRect().left - part('Only unread', 'control').getBoundingClientRect().right)).toBe(10)
  await expect(getComputedStyle(part('Write the tickets', 'label')).color).toBe(swatch('default'))
}

export const InlineDark: StoryObj<typeof meta> = { render: () => <InlineRows />, globals: { mode: 'dark' }, play: inlinePlay }
export const InlineLight: StoryObj<typeof meta> = { render: () => <InlineRows />, globals: { mode: 'light' }, play: inlinePlay }

// `density="compact"`: the rows of the Artifacts Filter menu (D3 403:6857 to 403:6955, T3 407:1506): 28 high
// (`control.sm`) at the `compact` text size and in mono, 30 apart in a group (2 px gap).
const artifactMenu = css({ bg: 'surface.overlay', p: '12', borderRadius: 'xl', w: 'shell.popover' })
const artifactProjects = [
  { value: 'ncc-1701', label: 'ncc-1701', labelStyle: 'mono' },
  { value: 'pinpoint', label: 'pinpoint', labelStyle: 'mono' },
] as const

function DenseRows() {
  return (
    <main className={page}>
      <div className={artifactMenu}>
        <CheckboxGroup label="Project" items={artifactProjects} defaultValue={['ncc-1701']} size="compact" density="compact" />
      </div>
      <div className={artifactMenu}>
        <Checkbox label="Starred" size="compact" density="compact" defaultChecked />
        <Checkbox label="Also remove this task" size="sm" density="compact" inline />
        <Checkbox label="Only unread" size="compact" />
      </div>
    </main>
  )
}

const rowOf = (canvasElement: HTMLElement, name: string) => {
  const root = within(canvasElement).getByRole('checkbox', { name }).closest('label')
  if (!(root instanceof HTMLElement)) throw new Error(`no row for ${name}`)
  return root
}

/** A compact-density row is 28 high at any text size, its group rows 30 apart; the default row keeps 32. */
const densePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  for (const name of ['ncc-1701', 'pinpoint', 'Starred']) await expect(rowOf(canvasElement, name).getBoundingClientRect().height).toBe(28)
  await expect(Math.round(rowOf(canvasElement, 'pinpoint').getBoundingClientRect().top - rowOf(canvasElement, 'ncc-1701').getBoundingClientRect().top)).toBe(30)
  // The text keeps its size: `compact` is bodySm (13/20), a mono label mono (12).
  const label = (name: string) => {
    const el = rowOf(canvasElement, name).querySelector('.checkbox__label')
    if (!(el instanceof HTMLElement)) throw new Error(`no label for ${name}`)
    return getComputedStyle(el)
  }
  await expect([label('Starred').fontSize, Math.round(Number.parseFloat(label('Starred').lineHeight))]).toEqual(['13px', 20])
  await expect(label('ncc-1701').fontFamily).toMatch(/Mono/)
  // An inline row keeps no minimum; the default density keeps control.md (32).
  await expect(rowOf(canvasElement, 'Also remove this task').getBoundingClientRect().height).toBe(16)
  await expect(rowOf(canvasElement, 'Only unread').getBoundingClientRect().height).toBe(32)
  await userEvent.click(canvas.getByText('pinpoint'))
  await expect(canvas.getByRole('checkbox', { name: 'pinpoint' })).toBeChecked()
}

export const DenseDark: StoryObj<typeof meta> = { render: () => <DenseRows />, globals: { mode: 'dark' }, play: densePlay }
export const DenseLight: StoryObj<typeof meta> = { render: () => <DenseRows />, globals: { mode: 'light' }, play: densePlay }

// `leading`: the Claude and Codex marks of the Artifacts Filter menu's Source rows (D3 403:6855, 403:6865), which the
// caller passes as `KindMark size="12"`. A story in this tier cannot import parts, so 12 px icons stand in for them.
const sources = [
  { value: 'claude', label: 'Claude', leading: <BrainIcon size="12" /> },
  { value: 'codex', label: 'Codex', leading: <TerminalIcon size="12" /> },
] as const

function LeadingMarks() {
  return (
    <main className={page}>
      <div className={artifactMenu}>
        <CheckboxGroup label="Source" items={sources} defaultValue={['claude']} size="compact" density="compact" />
      </div>
      <div className={artifactMenu}>
        <Checkbox label="Only mine" size="compact" density="compact" />
      </div>
    </main>
  )
}

/** A leading mark sits 6 after the box, the label 6 after the mark (24 after the box); a row with no mark keeps 10. */
const leadingPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const slot = (name: string, part: 'control' | 'leading' | 'label') => {
    const el = rowOf(canvasElement, name).querySelector(`.checkbox__${part}`)
    if (!(el instanceof HTMLElement)) throw new Error(`no ${part} for ${name}`)
    return el.getBoundingClientRect()
  }
  for (const name of ['Claude', 'Codex']) {
    const box = slot(name, 'control')
    const mark = slot(name, 'leading')
    const label = slot(name, 'label')
    await expect([mark.width, mark.height]).toEqual([12, 12])
    await expect(Math.round(mark.left - box.right)).toBe(6)
    await expect(Math.round(label.left - mark.right)).toBe(6)
    await expect(Math.round(label.left - box.right)).toBe(24)
    // Centred on the row with the box.
    await expect(Math.round(mark.top + mark.height / 2)).toBe(Math.round(box.top + box.height / 2))
    // The mark is decoration: the box's name is the label alone.
    await expect(canvas.getByRole('checkbox', { name })).toBeInTheDocument()
  }
  await expect(rowOf(canvasElement, 'Only mine').querySelector('.checkbox__leading')).toBeNull()
  await expect(Math.round(slot('Only mine', 'label').left - slot('Only mine', 'control').right)).toBe(10)
  await userEvent.click(canvas.getByText('Codex'))
  await expect(canvas.getByRole('checkbox', { name: 'Codex' })).toBeChecked()
}

export const LeadingDark: StoryObj<typeof meta> = { render: () => <LeadingMarks />, globals: { mode: 'dark' }, play: leadingPlay }
export const LeadingLight: StoryObj<typeof meta> = { render: () => <LeadingMarks />, globals: { mode: 'light' }, play: leadingPlay }
