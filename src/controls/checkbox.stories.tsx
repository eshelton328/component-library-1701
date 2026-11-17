import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
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
