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
    await expect(getComputedStyle(box('Checked')).backgroundColor).not.toBe(getComputedStyle(box('Unchecked')).backgroundColor)
    const group = canvas.getByRole('group', { name: 'Kind' })
    await expect(within(group).getByRole('checkbox', { name: 'Tasks' })).toBeChecked()
    await expect(within(group).getByRole('checkbox', { name: 'Artifacts' })).not.toBeChecked()
    await expect(within(group).getByRole('checkbox', { name: 'Agents' })).toBeDisabled()
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
