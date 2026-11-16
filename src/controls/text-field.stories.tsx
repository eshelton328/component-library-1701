import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { TextArea, TextField } from './text-field'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', display: 'grid', gap: '20', w: 'shell.dialog' })
const sizes = ['sm', 'md', 'lg', 'xl'] as const

function Fields() {
  return (
    <main className={page}>
      <TextField label="Chat name" defaultValue="Token sync" />
      <TextField label="Project" placeholder="Pick a short name" helperText="Letters, numbers and dashes." required />
      <TextField label="Repository URL" type="url" defaultValue="not a url" error="Enter a URL that starts with https://." />
      <TextField label="Owner" defaultValue="Erik" readOnly />
      <TextField label="Branch" defaultValue="main" disabled />
      <TextArea label="Notes" placeholder="Add a note for the next run" rows={3} />
      {sizes.map((s) => (
        <TextField key={s} size={s} label={`Name, ${s}`} />
      ))}
    </main>
  )
}

const meta = {
  title: 'Forms/Text field',
  component: Fields,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // The sizes come from a list, so their CSS comes only from staticCss.
    const heights = sizes.map((s) => canvas.getByRole('textbox', { name: `Name, ${s}` }).getBoundingClientRect().height)
    await expect(heights).toEqual([28, 32, 36, 44])
    await expect(canvas.getByRole('textbox', { name: /Project/ })).toBeRequired()
    // An empty required field is not drawn as an error before the user types.
    await expect(getComputedStyle(canvas.getByRole('textbox', { name: /Project/ })).borderColor).toBe(getComputedStyle(canvas.getByRole('textbox', { name: 'Chat name' })).borderColor)
    await expect(canvas.getByRole('textbox', { name: /Project/ })).toHaveAccessibleDescription('Letters, numbers and dashes.')
    const url = canvas.getByRole('textbox', { name: 'Repository URL' })
    await expect(url).toBeInvalid()
    await expect(url).toHaveAccessibleDescription('Enter a URL that starts with https://.')
    await expect(getComputedStyle(url).borderColor).not.toBe(getComputedStyle(canvas.getByRole('textbox', { name: 'Chat name' })).borderColor)
    await expect(canvas.getByRole('textbox', { name: 'Owner' })).toHaveAttribute('readonly')
    const branch = canvas.getByRole('textbox', { name: 'Branch' })
    await expect(branch).toBeDisabled()
    await expect(getComputedStyle(branch.parentElement ?? branch).opacity).toBe('0.45')
    await expect(canvas.getByRole('textbox', { name: 'Notes' }).tagName).toBe('TEXTAREA')
  },
} satisfies Meta<typeof Fields>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onName = fn<(value: string) => void>()

function Controlled() {
  const [name, setName] = useState('')
  return (
    <main className={page}>
      <TextField
        label="Chat name"
        value={name}
        onValueChange={(v) => {
          setName(v)
          onName(v)
        }}
        error={name.length > 12 ? 'Use 12 letters or fewer.' : undefined}
      />
      <TextArea label="Prompt" autoresize defaultValue="One line" />
    </main>
  )
}

/** Typing reports the text, an error shows and goes, and an autoresize area grows with its text. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    onName.mockClear()
    const canvas = within(canvasElement)
    const name = canvas.getByRole('textbox', { name: 'Chat name' })
    await userEvent.type(name, 'Sync')
    await expect(onName).toHaveBeenLastCalledWith('Sync')
    await expect(name).toBeValid()
    await userEvent.type(name, ' the tokens')
    await expect(name).toBeInvalid()
    await expect(canvas.getByText('Use 12 letters or fewer.')).toBeInTheDocument()
    await userEvent.clear(name)
    await expect(name).toBeValid()
    const prompt = canvas.getByRole('textbox', { name: 'Prompt' })
    const before = prompt.getBoundingClientRect().height
    await userEvent.type(prompt, '{Enter}two{Enter}three{Enter}four{Enter}five')
    await expect(prompt.getBoundingClientRect().height).toBeGreaterThan(before)
  },
}
