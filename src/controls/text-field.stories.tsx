import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { LinkIcon } from '../foundations/icons'
import { TextArea, TextField } from './text-field'
import { expectScrollAreas } from './scroll-area.testing'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', display: 'grid', gap: '20', w: 'shell.dialog' })
const sizes = ['sm', 'md', 'lg', 'xl'] as const

function Fields() {
  return (
    <main className={page}>
      <TextField label="Chat name" defaultValue="Token sync" />
      <TextField label="Project" placeholder="Pick a short name" helperText="Letters, numbers and dashes." required />
      <TextField label="Repository URL" type="url" defaultValue="not a url" error="Enter a URL that starts with https://." />
      <TextField label="Owner" defaultValue="Ada" readOnly />
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
    // A text area scrolls its text with no scroll bar and keeps a scroll at its end from moving the page.
    await expectScrollAreas(canvasElement, 'none', '.text-field__textarea')
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

/**
 * The Artifacts Add a link form (D5 403:7551 to 403:7581, M6 408:713 to 408:745): `labelStyle="label"`, the 40 px
 * `size="form"`, the 12 px `padding="form"` sides, a leading link icon and a `mono` value.
 */
function AddLinkFields() {
  return (
    <main className={page}>
      <TextField label="Link" labelStyle="label" size="form" padding="form" valueStyle="mono" icon={<LinkIcon />} defaultValue="https://github.com/eshelton328/the-bridge" />
      <TextField label="Title" labelStyle="label" size="form" padding="form" defaultValue="The bridge" />
      <TextField label="Project" labelStyle="label" size="xl" padding="form" valueStyle="mono" defaultValue="ncc-1701" />
      <TextArea label="Note" labelStyle="label" icon={<LinkIcon />} rows={2} />
      <TextField label="Name, default" defaultValue="Token sync" />
    </main>
  )
}

const addLinkPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const field = (name: string) => canvas.getByRole('textbox', { name })
  const labelOf = (name: string) => {
    const label = canvasElement.querySelector(`label[for="${field(name).id}"]`)
    if (!(label instanceof HTMLElement)) throw new Error(`no label for ${name}`)
    return label
  }
  const font = (el: HTMLElement) => {
    const s = getComputedStyle(el)
    return [s.fontSize, Math.round(Number.parseFloat(s.lineHeight)), s.fontWeight]
  }
  // labelStyle="label": Medium 14/20 in fg.default (the input's own colour), 6 above the control.
  for (const name of ['Link', 'Title', 'Project', 'Note']) {
    const label = labelOf(name)
    await expect(font(label)).toEqual(['14px', 20, '500'])
    await expect(getComputedStyle(label).color).toBe(getComputedStyle(field(name)).color)
    await expect(Math.round(field(name).getBoundingClientRect().top - label.getBoundingClientRect().bottom)).toBe(6)
  }
  // size="form" is 40 high; xl stays 44.
  await expect(field('Link').getBoundingClientRect().height).toBe(40)
  await expect(field('Title').getBoundingClientRect().height).toBe(40)
  await expect(field('Project').getBoundingClientRect().height).toBe(44)
  // padding="form": 12 at the sides (Figma 13, d-072).
  const title = getComputedStyle(field('Title'))
  await expect([title.paddingLeft, title.paddingRight]).toEqual(['12px', '12px'])
  // The link icon: 16 px in fg.muted, 13 from the box's edge (border and padding), centred, the text 6 after it.
  const link = field('Link')
  const icon = link.parentElement?.querySelector('.text-field__icon svg')
  if (!(icon instanceof SVGElement)) throw new Error('no icon')
  const i = icon.getBoundingClientRect()
  const box = link.getBoundingClientRect()
  await expect([i.width, i.height]).toEqual([16, 16])
  await expect(Math.round(i.left - box.left)).toBe(13)
  await expect(Math.abs(i.top + i.height / 2 - (box.top + box.height / 2))).toBeLessThanOrEqual(0.5)
  await expect(getComputedStyle(link).paddingLeft).toBe('34px')
  await expect(icon.closest('[aria-hidden="true"]')).not.toBeNull()
  // In a text area the icon sits on the first line, 11 from the top and the start (border, 10, and 2 to centre it on
  // the 20 px line), with the text 6 after it.
  const note = field('Note')
  const noteIcon = note.parentElement?.querySelector('.text-field__icon svg')
  if (!(noteIcon instanceof SVGElement)) throw new Error('no note icon')
  const n = noteIcon.getBoundingClientRect()
  await expect([Math.round(n.left - note.getBoundingClientRect().left), Math.round(n.top - note.getBoundingClientRect().top), n.height]).toEqual([11, 11, 16])
  await expect(getComputedStyle(note).paddingLeft).toBe('32px')
  await expect(getComputedStyle(icon).color).toBe(getComputedStyle(labelOf('Name, default')).color)
  // valueStyle="mono": the link and the project in mono 12/16.
  for (const name of ['Link', 'Project']) {
    await expect(font(field(name))).toEqual(['12px', 16, '400'])
    await expect(getComputedStyle(field(name)).fontFamily).toMatch(/Mono/)
  }
  await expect(getComputedStyle(field('Title')).fontFamily).not.toMatch(/Mono/)
  // The default stays: small (12/16) in fg.muted, 32 high, 10 at the sides, body (14/20).
  const name = field('Name, default')
  await expect(font(labelOf('Name, default'))).toEqual(['12px', 16, '400'])
  await expect(getComputedStyle(labelOf('Name, default')).color).not.toBe(getComputedStyle(name).color)
  await expect(name.getBoundingClientRect().height).toBe(32)
  await expect(getComputedStyle(name).paddingLeft).toBe('10px')
  await expect(font(name)).toEqual(['14px', 20, '400'])
  await expect(name.parentElement?.classList.contains('text-field__control')).toBe(false)
}

export const AddLinkDark: StoryObj<typeof meta> = { render: () => <AddLinkFields />, play: addLinkPlay, globals: { mode: 'dark' } }
export const AddLinkLight: StoryObj<typeof meta> = { render: () => <AddLinkFields />, play: addLinkPlay, globals: { mode: 'light' } }
