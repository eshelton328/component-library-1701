import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Stack } from '../controls/layout'
import { Composer, type ComposerAttachment } from './composer'
import { ModelChip } from './model-chip'
import { expectCutText } from '../controls/tooltip.testing'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', w: 'shell.dialogLg' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  raised: css({ bg: 'surface.raised' }),
  overlay: css({ bg: 'surface.overlay' }),
  border: css({ bg: 'border.default' }),
  selected: css({ bg: 'border.selected' }),
  accent: css({ bg: 'accent.default' }),
  muted: css({ bg: 'fg.muted' }),
  text: css({ bg: 'fg.default' }),
}
const swatchRow = (
  <div hidden>
    {Object.entries(swatches).map(([name, className]) => (
      <span key={name} data-swatch={name} className={className} />
    ))}
  </div>
)
const swatch = (root: HTMLElement, name: string) => {
  const el = root.querySelector(`[data-swatch="${name}"]`)
  return el === null ? '' : getComputedStyle(el).backgroundColor
}

const files: readonly ComposerAttachment[] = [{ id: 'f1', name: 'theme-ideas.md' }]

// The three composer states of Workbench (402:8809): working with Stop, idle, and needs you.
function States() {
  return (
    <main className={page}>
      <Stack gap="16">
        <Composer label="Working" running attachments={files} onRemoveAttachment={() => undefined} onAttach={() => undefined} model={<ModelChip model="Opus 5.5" options={[]} />} />
        <Composer label="Idle" attachments={files} onRemoveAttachment={() => undefined} onAttach={() => undefined} model={<ModelChip model="Opus 5.5" options={[]} />} />
        <Composer label="Needs you" placeholder="Reply, or answer the request above" onAttach={() => undefined} defaultValue={'Deny it.\nUse the old path.'} />
        <Composer label="Disabled" disabled running />
      </Stack>
      {swatchRow}
    </main>
  )
}

const meta = {
  title: 'Conversation/Composer',
  component: States,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const working = canvas.getByRole('textbox', { name: 'Working' })
    const box = working.closest<HTMLElement>('[data-slot="root"].composer__root')
    if (box === null) throw new Error('no composer box')
    const style = getComputedStyle(box)
    // 10 px padding, an 8 px gap, radius.xl, surface.raised with a border.default border.
    await expect([style.paddingTop, style.paddingLeft]).toEqual(['10px', '10px'])
    await expect(style.rowGap).toBe('8px')
    await expect(style.borderRadius).toBe('12px')
    await expect(style.backgroundColor).toBe(swatch(canvasElement, 'raised'))
    await expect(style.borderTopColor).toBe(swatch(canvasElement, 'border'))
    // The text area draws no box of its own; the placeholder is fg.muted and the caret the accent.
    const area = getComputedStyle(working)
    await expect(area.borderTopWidth).toBe('0px')
    await expect(area.paddingTop).toBe('0px')
    await expect(area.backgroundColor).toBe('rgba(0, 0, 0, 0)')
    await expect(area.caretColor).toBe(swatch(canvasElement, 'accent'))
    await expect(getComputedStyle(working, '::placeholder').color).toBe(swatch(canvasElement, 'muted'))
    await expect(working).toHaveAttribute('placeholder', 'Message, or / for a skill')
    // The label is hidden from view and still names the text area.
    const label = canvas.getByText('Working')
    await expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1)
    // Stop shows only while the chat works: the working and the disabled composer.
    const stops = canvas.getAllByRole('button', { name: 'Stop' })
    await expect(stops).toHaveLength(2)
    const stop = stops[0]
    if (stop === undefined) throw new Error('no stop')
    await expect(box.contains(stop)).toBe(true)
    await expect(stop.getBoundingClientRect().height).toBe(28)
    const send = within(box).getByRole('button', { name: 'Send' })
    await expect([send.getBoundingClientRect().width, send.getBoundingClientRect().height]).toEqual([28, 28])
    await expect(getComputedStyle(send).backgroundColor).toBe(swatch(canvasElement, 'accent'))
    await expect(within(box).getByRole('button', { name: 'Attach a file' }).getBoundingClientRect().height).toBe(28)
    await expect(within(box).getByRole('button', { name: 'Model: Opus 5.5' })).toBeInTheDocument()
    // The attachment chip: surface.overlay, a border.default border, radius.sm and 4 × 8 padding.
    const name = within(box).getByText('theme-ideas.md')
    // The TruncatedText inside the name holds the text.
    const chip = name.closest('.composer__attachment')
    if (chip === null) throw new Error('no attachment')
    const chipStyle = getComputedStyle(chip)
    await expect(chipStyle.backgroundColor).toBe(swatch(canvasElement, 'overlay'))
    await expect(chipStyle.borderTopColor).toBe(swatch(canvasElement, 'border'))
    await expect(chipStyle.borderRadius).toBe('6px')
    await expect([chipStyle.paddingTop, chipStyle.paddingLeft]).toEqual(['4px', '8px'])
    await expect(chipStyle.fontSize).toBe('11px')
    const remove = within(box).getByRole('button', { name: 'Remove theme-ideas.md' })
    // The clip is fg.default and the remove icon fg.muted, both 12 px.
    const [clip, cross] = Array.from(chip.querySelectorAll('svg'))
    if (clip === undefined || cross === undefined) throw new Error('no attachment icons')
    await expect(getComputedStyle(clip).color).toBe(swatch(canvasElement, 'text'))
    await expect(getComputedStyle(cross).color).toBe(swatch(canvasElement, 'muted'))
    await expect([clip.getBoundingClientRect().width, cross.getBoundingClientRect().width]).toEqual([12, 12])
    await expect(remove.contains(cross)).toBe(true)
    // The needs-you composer has no Stop and no model, and its text has two lines.
    const needs = canvas.getByRole('textbox', { name: 'Needs you' })
    await expect(needs).toHaveValue('Deny it.\nUse the old path.')
    await waitFor(() => expect(needs.getBoundingClientRect().height).toBeGreaterThan(30))
    const disabled = canvas.getByRole('textbox', { name: 'Disabled' })
    await expect(disabled).toBeDisabled()
    const disabledBox = disabled.closest<HTMLElement>('.composer__root')
    if (disabledBox === null) throw new Error('no disabled composer')
    await expect(within(disabledBox).getByRole('button', { name: 'Send' })).toBeDisabled()
    await expect(within(disabledBox).getByRole('button', { name: 'Stop' })).toBeDisabled()
  },
} satisfies Meta<typeof States>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onSubmit = fn<(text: string) => void>()
const onStop = fn<() => void>()
const onRemove = fn<(id: string) => void>()
const onDraft = fn<(value: string) => void>()

function Chat() {
  const [attachments, setAttachments] = useState<readonly ComposerAttachment[]>([
    { id: 'a', name: 'requirements.md' },
    { id: 'b', name: 'theme-ideas.md' },
  ])
  const [controlled, setControlled] = useState('')
  return (
    <main className={page}>
      <Stack gap="16">
        <Composer
          label="Message"
          running
          onSubmit={onSubmit}
          onValueChange={onDraft}
          onStop={onStop}
          attachments={attachments}
          onRemoveAttachment={(id) => {
            onRemove(id)
            setAttachments((list) => list.filter((f) => f.id !== id))
          }}
        />
        <Composer
          label="Controlled"
          value={controlled}
          onValueChange={setControlled}
          onSubmit={(text) => {
            onSubmit(text)
          }}
        />
      </Stack>
      {swatchRow}
    </main>
  )
}

/** Enter submits and clears; Shift+Enter adds a line; empty text does not submit; Stop and remove report; focus marks the box. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => <Chat />,
  play: async ({ canvasElement }) => {
    onSubmit.mockClear()
    onStop.mockClear()
    onRemove.mockClear()
    onDraft.mockClear()
    const canvas = within(canvasElement)
    const area = canvas.getByRole('textbox', { name: 'Message' })
    const box = area.closest<HTMLElement>('.composer__root')
    if (box === null) throw new Error('no composer box')
    // Enter on empty text or spaces submits nothing.
    await userEvent.click(area)
    await waitFor(() => expect(getComputedStyle(box).borderTopColor).toBe(swatch(canvasElement, 'selected')))
    await userEvent.keyboard('{Enter}')
    await userEvent.type(area, '   {Enter}')
    await expect(onSubmit).not.toHaveBeenCalled()
    await userEvent.clear(area)
    // Shift+Enter adds a line; Enter submits the text and clears the uncontrolled composer.
    await userEvent.type(area, 'Fix the build{Shift>}{Enter}{/Shift}then rerun')
    await expect(area).toHaveValue('Fix the build\nthen rerun')
    await userEvent.keyboard('{Enter}')
    await expect(onSubmit).toHaveBeenLastCalledWith('Fix the build\nthen rerun')
    await expect(area).toHaveValue('')
    // The clear is reported too, so a caller that keeps the draft does not keep sent text.
    await expect(onDraft).toHaveBeenLastCalledWith('')
    // Enter that confirms an input method character submits nothing, in both shapes browsers send.
    await userEvent.type(area, 'nihon')
    area.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true }))
    area.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 229, bubbles: true, cancelable: true }))
    await expect(onSubmit).toHaveBeenCalledTimes(1)
    await expect(area).toHaveValue('nihon')
    await userEvent.clear(area)
    // The send button submits too.
    await userEvent.type(area, 'Queue this')
    await userEvent.click(within(box).getByRole('button', { name: 'Send' }))
    await expect(onSubmit).toHaveBeenLastCalledWith('Queue this')
    await expect(onSubmit).toHaveBeenCalledTimes(2)
    // Stop and remove report through their callbacks.
    await userEvent.click(within(box).getByRole('button', { name: 'Stop' }))
    await expect(onStop).toHaveBeenCalledTimes(1)
    await userEvent.click(within(box).getByRole('button', { name: 'Remove requirements.md' }))
    await expect(onRemove).toHaveBeenLastCalledWith('a')
    await expect(within(box).queryByText('requirements.md')).toBeNull()
    // A controlled composer keeps its text until the caller clears it.
    const controlled = canvas.getByRole('textbox', { name: 'Controlled' })
    await userEvent.type(controlled, 'Kept{Enter}')
    await expect(onSubmit).toHaveBeenLastCalledWith('Kept')
    await expect(controlled).toHaveValue('Kept')
  },
}

const narrowBox = css({ w: 'shell.popoverSm' })

const longFile = 'skill-eval-round-with-held-out-cases-and-a-trigger-set-notes-from-the-review.md'

/** A long attachment name is cut to one line and shows in full in a tooltip, on hover and on keyboard focus. */
export const LongAttachment: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <div className={narrowBox}>
        <Composer label="Message" attachments={[{ id: 'a', name: longFile }]} onRemoveAttachment={() => undefined} onSubmit={() => undefined} />
      </div>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const name = canvasElement.querySelector('.composer__attachmentName')
    if (name === null) throw new Error('no attachment name')
    await expectCutText(name, longFile)
  },
}
