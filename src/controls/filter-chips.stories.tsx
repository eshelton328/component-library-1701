import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { FilterChips, type FilterChip } from './filter-chips'

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
