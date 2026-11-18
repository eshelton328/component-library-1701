import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
import { Inline, Stack } from '../controls/layout'
import { ScrollFrame } from '../controls/scroll-frame'
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

// The side chat's composer is 300 wide in Figma (D5 158:545): shell.popoverFilter.
const sideChat = css({ w: 'shell.popoverFilter' })
const onSideSubmit = fn<(text: string) => void>()

// The side chat in a pane (Workspaces D5 158:545): one row, with a stacked composer under it to show the default is unchanged.
function InlineComposers() {
  return (
    <main className={page}>
      <Stack gap="16">
        <div className={sideChat}>
          <Composer layout="inline" label="Side question" placeholder="Ask a side question" onSubmit={onSideSubmit} />
        </div>
        <div className={sideChat}>
          <Composer layout="inline" label="Side running" placeholder="Ask a side question" running defaultValue={'A question long enough to wrap onto a second line of the side chat'} />
        </div>
        <div className={sideChat}>
          <Composer label="Stacked" placeholder="Ask a side question" />
        </div>
        <div className={sideChat}>
          <Composer
            layout="inline"
            label="Side crowded"
            placeholder="Ask a side question"
            running
            onAttach={() => undefined}
            model={<ModelChip model="Sonnet 5.5" effort="high effort" options={[]} />}
          />
        </div>
      </Stack>
      {swatchRow}
    </main>
  )
}

const rect = (el: Element) => el.getBoundingClientRect()

const inlinePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  onSideSubmit.mockClear()
  await document.fonts.ready
  const canvas = within(canvasElement)
  const area = canvas.getByRole('textbox', { name: 'Side question' })
  const box = area.closest<HTMLElement>('.composer__root')
  if (box === null) throw new Error('no inline composer')
  const style = getComputedStyle(box)
  // One row, 42 high with one line (Figma 40 with a 22 px button; ours is control.xs, 24).
  await expect(rect(box).height).toBe(42)
  await expect([style.paddingTop, style.paddingBottom, style.paddingLeft, style.paddingRight]).toEqual(['8px', '8px', '10px', '8px'])
  await expect(style.backgroundColor).toBe(swatch(canvasElement, 'raised'))
  await expect(style.borderTopColor).toBe(swatch(canvasElement, 'border'))
  // A 24 px accent send button at the row's end, on the same row as the text, and no attach button.
  const send = within(box).getByRole('button', { name: 'Send' })
  await expect([rect(send).width, rect(send).height]).toEqual([24, 24])
  await expect(getComputedStyle(send).backgroundColor).toBe(swatch(canvasElement, 'accent'))
  await expect(rect(box).right - rect(send).right).toBe(9)
  await expect(rect(area).top).toBe(rect(send).top)
  await expect(rect(area).height).toBe(24)
  await expect(rect(area).right).toBeLessThanOrEqual(rect(send).left - 8)
  await expect(within(box).queryByRole('button', { name: 'Attach a file' })).toBeNull()
  // The text keeps the composer's body style, its placeholder fg.muted.
  const text = getComputedStyle(area)
  await expect([text.fontSize, Math.round(parseFloat(text.lineHeight))]).toEqual(['14px', 20])
  await expect(getComputedStyle(area, '::placeholder').color).toBe(swatch(canvasElement, 'muted'))
  // Enter and the send button submit.
  await userEvent.type(area, 'Why this path?{Enter}')
  await expect(onSideSubmit).toHaveBeenLastCalledWith('Why this path?')
  // Wrapped text grows the box; Stop and send stay 24 high at its bottom.
  const running = canvas.getByRole('textbox', { name: 'Side running' })
  const runningBox = running.closest<HTMLElement>('.composer__root')
  if (runningBox === null) throw new Error('no running composer')
  await waitFor(() => expect(rect(running).height).toBeGreaterThan(40))
  await expect(rect(runningBox).height).toBeGreaterThan(42)
  const stop = within(runningBox).getByRole('button', { name: 'Stop' })
  const runningSend = within(runningBox).getByRole('button', { name: 'Send' })
  await expect([rect(stop).height, rect(runningSend).height]).toEqual([24, 24])
  await expect(rect(stop).bottom).toBe(rect(running).bottom)
  await expect(rect(runningSend).bottom).toBe(rect(running).bottom)
  // The default layout is unchanged: the text over the button row, 78 high, 28 px send.
  const stacked = canvas.getByRole('textbox', { name: 'Stacked' })
  const stackedBox = stacked.closest<HTMLElement>('.composer__root')
  if (stackedBox === null) throw new Error('no stacked composer')
  await expect(rect(stackedBox).height).toBe(78)
  await expect(getComputedStyle(stackedBox).paddingTop).toBe('10px')
  const stackedSend = within(stackedBox).getByRole('button', { name: 'Send' })
  await expect(rect(stackedSend).height).toBe(28)
  await expect(rect(stackedSend).top).toBeGreaterThan(rect(stacked).bottom)
  // With attach, Stop and a long model chip at 300 px, the controls stay on one row: the text keeps
  // 40 % of the row, the model chip is cut (its tooltip shows it whole) and Send stays inside.
  const crowded = canvas.getByRole('textbox', { name: 'Side crowded' })
  const crowdedBox = crowded.closest<HTMLElement>('.composer__root')
  if (crowdedBox === null) throw new Error('no crowded composer')
  await expect(rect(crowded).width).toBeGreaterThanOrEqual(80)
  const crowdedSend = within(crowdedBox).getByRole('button', { name: 'Send' })
  await expect(rect(crowdedSend).right).toBeLessThanOrEqual(rect(crowdedBox).right - 9)
  await expect(rect(crowdedSend).left).toBeGreaterThanOrEqual(rect(crowdedBox).left)
  // The controls stay on the text's row (bottom-aligned); the 112 px text wraps its placeholder.
  const chip = within(crowdedBox).getByRole('button', { name: 'Model: Sonnet 5.5 · high effort' })
  await expect(rect(chip).right).toBeLessThanOrEqual(rect(crowdedSend).left)
  await expect(rect(chip).left).toBeGreaterThanOrEqual(rect(crowded).right)
  await expect(rect(crowdedSend).bottom).toBe(rect(crowded).bottom)
  const chipText = chip.querySelector('.truncated-text')
  if (chipText === null) throw new Error('no chip text')
  await expect(chipText.scrollWidth).toBeGreaterThan(chipText.clientWidth)
}

/** `layout="inline"`: the side chat's one-row composer (Workspaces D5 158:545). */
export const InlineDark: StoryObj<typeof meta> = { render: () => <InlineComposers />, globals: { mode: 'dark' }, play: inlinePlay }
export const InlineLight: StoryObj<typeof meta> = { render: () => <InlineComposers />, globals: { mode: 'light' }, play: inlinePlay }

// A pane with a bounded height around a ScrollFrame whose footer is a composer, as a chat pane or the Inbox
// discussion has. The pane is a size container, as a Workspaces pane is, so the composer's cap is 30% of it.
// The play functions set the pane's height to a window's.
const pane = css({ display: 'flex', flexDirection: 'column', w: 'shell.listPane', bg: 'surface.pane', p: '16', containerType: 'size' })
const message = css({ textStyle: 'body', color: 'fg.default', m: '0', py: '8', overflow: 'hidden' })
const messages = Array.from({ length: 20 }, (_, i) => `Message ${String(i + 1)}`)
const manyFiles: readonly ComposerAttachment[] = [
  { id: 'f1', name: 'theme-ideas.md' },
  { id: 'f2', name: 'requirements.md' },
  { id: 'f3', name: 'screen-notes.md' },
]

function InFrame({ layout }: { layout: 'stacked' | 'inline' }) {
  return (
    <div className={pane} data-testid={`pane-${layout}`}>
      <ScrollFrame
        gap="12"
        header={<Button size="sm">Back</Button>}
        footer={
          <Composer
            label={layout === 'stacked' ? 'Reply' : 'Side chat'}
            layout={layout}
            running={layout === 'stacked'}
            attachments={layout === 'stacked' ? manyFiles : []}
            onAttach={layout === 'stacked' ? () => undefined : undefined}
            model={<ModelChip model="Opus 5.5" options={[]} />}
          />
        }
      >
        {messages.map((text) => (
          <p key={text} className={message}>
            {text}
          </p>
        ))}
      </ScrollFrame>
    </div>
  )
}

function Frames() {
  return (
    <main className={page}>
      <Inline gap="16" align="start">
        <InFrame layout="stacked" />
        <InFrame layout="inline" />
      </Inline>
    </main>
  )
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 100))
/** The pane, its ScrollFrame, the footer, the body and the composer's text area. */
const frameParts = (canvasElement: HTMLElement, layout: 'stacked' | 'inline') => {
  const paneEl = canvasElement.querySelector(`[data-testid="pane-${layout}"]`)
  const field = paneEl?.querySelector('textarea')
  const footer = field?.closest('.scroll-frame__footer')
  const frame = footer?.parentElement
  const body = frame?.querySelector('.scroll-frame__body')
  const composerBox = field?.closest('.composer__root')
  if (
    !(paneEl instanceof HTMLElement) ||
    !(field instanceof HTMLTextAreaElement) ||
    !(footer instanceof HTMLElement) ||
    !(frame instanceof HTMLElement) ||
    !(body instanceof HTMLElement) ||
    !(composerBox instanceof HTMLElement)
  )
    throw new Error('no frame')
  return { pane: paneEl, field, footer, frame, body, composerBox }
}
// Pane heights: the Workbench chat pane at 1512 x 982 and 1512 x 600, the Inbox discussion at 1232 x 400,
// and the Workspaces D5 side chat (280 px, where 30% is 84 px).
const heights = [900, 520, 383, 280] as const

/**
 * A composer at rest keeps its height in any frame: its cap stops only a long draft, so a Workbench composer
 * (attachments, the model and Stop) in a short pane is not cut, nor is the one-row side chat.
 */
export const InFrameRestDark: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => <Frames />,
  play: async ({ canvasElement }) => {
    for (const layout of ['stacked', 'inline'] as const) {
      const parts = frameParts(canvasElement, layout)
      const rest = parts.composerBox.getBoundingClientRect().height
      for (const h of heights) {
        parts.pane.style.height = `${String(h)}px`
        await settle()
        await expect(parts.composerBox.getBoundingClientRect().height).toBe(rest)
        await expect(parts.footer.scrollHeight).toBe(parts.footer.clientHeight)
      }
      // In the side chat's pane, the composer at rest is taller than 30% of the frame, and still whole.
      await expect(rest).toBeGreaterThan(layout === 'stacked' ? parts.frame.getBoundingClientRect().height * 0.3 : 0)
    }
  },
}
export const InFrameRestLight: StoryObj<typeof meta> = { ...InFrameRestDark, globals: { mode: 'light' } }

/**
 * A long draft (40 lines) grows the composer to at most 30% of the frame, then the text scrolls inside: the
 * messages keep the rest, and Send stays in view.
 */
export const InFrameLongDraftDark: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => <Frames />,
  play: async ({ canvasElement }) => {
    const draft = Array.from({ length: 40 }, (_, i) => `Line ${String(i + 1)}`).join('\n')
    for (const layout of ['stacked', 'inline'] as const) {
      const parts = frameParts(canvasElement, layout)
      await userEvent.click(parts.field)
      await userEvent.paste(draft)
      for (const h of heights.slice(0, 3)) {
        parts.pane.style.height = `${String(h)}px`
        await settle()
        const frameH = parts.pane.getBoundingClientRect().height
        // The attachments sit above the text, outside the cap.
        const chips = layout === 'stacked' ? (parts.composerBox.firstElementChild?.getBoundingClientRect().height ?? 0) + 8 : 0
        await expect(parts.composerBox.getBoundingClientRect().height).toBeLessThanOrEqual(frameH * 0.3 + chips + 1)
        await expect(parts.field.scrollHeight).toBeGreaterThan(parts.field.clientHeight)
        await expect(parts.footer.scrollHeight).toBe(parts.footer.clientHeight)
        const send = within(parts.footer).getByRole('button', { name: 'Send' }).getBoundingClientRect()
        await expect(send.bottom).toBeLessThanOrEqual(parts.frame.getBoundingClientRect().bottom)
        await expect(parts.body.getBoundingClientRect().height).toBeGreaterThan(0)
      }
    }
  },
}
export const InFrameLongDraftLight: StoryObj<typeof meta> = { ...InFrameLongDraftDark, globals: { mode: 'light' } }
