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
    // A focused invalid field draws the focus border, as a valid field does.
    const chat = canvas.getByRole('textbox', { name: 'Chat name' })
    chat.focus()
    const focused = getComputedStyle(chat).borderColor
    url.focus()
    await expect(getComputedStyle(url).borderColor).toBe(focused)
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

const prompt =
  'Read f-005-the-bridge/increment-1.md and write one Linear ticket per screen in the NCC project, following toolkit/rules/linear.md.'

/** `textSize="sm"`: the text in bodySm, as the Inbox D3 prompt editor draws it (346:1189, Geist 13). */
function SmallText() {
  return (
    <main className={page}>
      <TextArea label="Suggested prompt" labelHidden textSize="sm" defaultValue={prompt} rows={1} />
      <TextField label="Name, small text" textSize="sm" defaultValue="Token sync" />
      <TextArea label="Prompt, default" labelHidden defaultValue={prompt} rows={1} />
    </main>
  )
}

const smallTextPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const font = (name: string) => {
    const s = getComputedStyle(canvas.getByRole('textbox', { name }))
    return [s.fontSize, Math.round(Number.parseFloat(s.lineHeight)), s.fontWeight]
  }
  // bodySm is 13/20 on the 4 px grid; the box keeps its padding and the field its height.
  await expect(font('Suggested prompt')).toEqual(['13px', 20, '400'])
  await expect(font('Name, small text')).toEqual(['13px', 20, '400'])
  await expect(canvas.getByRole('textbox', { name: 'Name, small text' }).getBoundingClientRect().height).toBe(32)
  const s = getComputedStyle(canvas.getByRole('textbox', { name: 'Suggested prompt' }))
  await expect([s.paddingTop, s.paddingLeft]).toEqual(['8px', '10px'])
  // The default stays in body.
  await expect(font('Prompt, default')).toEqual(['14px', 20, '400'])
}

export const SmallTextDark: StoryObj<typeof meta> = { render: () => <SmallText />, play: smallTextPlay, globals: { mode: 'dark' } }
export const SmallTextLight: StoryObj<typeof meta> = { render: () => <SmallText />, play: smallTextPlay, globals: { mode: 'light' } }
