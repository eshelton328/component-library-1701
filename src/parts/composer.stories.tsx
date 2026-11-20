import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
import { Inline, Stack } from '../controls/layout'
import { OptionList } from '../controls/option-list'
import { Popover, PopoverSection } from '../controls/popover'
import { ScrollFrame } from '../controls/scroll-frame'
import { PlusIcon } from '../foundations/icons'
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
// A send that can fail (the audit's L-3): the caller's onSend answers later. Each call takes the next answer.
type Answer = { resolve: (ok: boolean) => void; reject: (error: Error) => void }
const answers: Answer[] = []
const onSend = fn<(text: string) => Promise<boolean>>(
  () =>
    new Promise<boolean>((resolve, reject) => {
      answers.push({ resolve, reject })
    }),
)
const nextAnswer = () => {
  const answer = answers.shift()
  if (answer === undefined) throw new Error('onSend was not called')
  return answer
}
const sendResult: StoryObj<typeof meta> = {
  render: () => <Composer label="Message" onSend={onSend} />,
  play: async ({ canvasElement }) => {
    onSend.mockClear()
    answers.length = 0
    const canvas = within(canvasElement)
    const field = canvas.getByRole('textbox', { name: 'Message' })
    const send = canvas.getByRole('button', { name: 'Send' })
    // A failed send keeps the long prompt, and Send is disabled only while the send is pending.
    await userEvent.type(field, 'A long prompt typed on the phone')
    await userEvent.click(send)
    await expect(onSend).toHaveBeenLastCalledWith('A long prompt typed on the phone')
    await expect(send).toBeDisabled()
    nextAnswer().reject(new Error('herdr is down'))
    await waitFor(() => expect(send).toBeEnabled())
    await expect(field).toHaveValue('A long prompt typed on the phone')
    // An answer of false keeps it too.
    await userEvent.click(field)
    await userEvent.keyboard('{Enter}')
    nextAnswer().resolve(false)
    await waitFor(() => expect(send).toBeEnabled())
    await expect(field).toHaveValue('A long prompt typed on the phone')
    // A sent message clears the text, unless the user typed on while it was pending.
    await userEvent.click(field)
    await userEvent.keyboard('{Enter}')
    await userEvent.type(field, ' and more')
    nextAnswer().resolve(true)
    await waitFor(() => expect(send).toBeEnabled())
    await expect(field).toHaveValue('A long prompt typed on the phone and more')
    await userEvent.keyboard('{Enter}')
    nextAnswer().resolve(true)
    await waitFor(() => expect(field).toHaveValue(''))
    await expect(onSend).toHaveBeenCalledTimes(4)
  },
}
/** A send that can fail: the composer keeps the draft until `onSend` answers true. */
export const SendResultDark: StoryObj<typeof meta> = { ...sendResult, globals: { mode: 'dark' } }
export const SendResultLight: StoryObj<typeof meta> = { ...sendResult, globals: { mode: 'light' } }

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

function SmallStop() {
  return (
    <main className={page}>
      <Stack gap="16">
        <Composer label="Reply" running stopTextSize="xs" stopIconSize="12" onAttach={() => undefined} />
        <Composer label="Default Stop" running />
      </Stack>
    </main>
  )
}

/** `stopTextSize="xs"` (Inbox T05 346:6428): Stop's label is 12 px, as in Figma; the default stays 14. Both are 28 high. */
const smallStopPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const stopIn = (label: string) => {
    const box = canvas.getByRole('textbox', { name: label }).closest<HTMLElement>('.composer__root')
    if (box === null) throw new Error(`no composer ${label}`)
    return within(box).getByRole('button', { name: 'Stop' })
  }
  const small = stopIn('Reply')
  const normal = stopIn('Default Stop')
  await expect([getComputedStyle(small).fontSize, getComputedStyle(normal).fontSize]).toEqual(['12px', '14px'])
  await expect([small.getBoundingClientRect().height, normal.getBoundingClientRect().height]).toEqual([28, 28])
  await expect(small.getBoundingClientRect().width).toBeLessThan(normal.getBoundingClientRect().width)
}

export const SmallStopDark: StoryObj<typeof meta> = { render: () => <SmallStop />, globals: { mode: 'dark' }, play: smallStopPlay }
export const SmallStopLight: StoryObj<typeof meta> = { render: () => <SmallStop />, globals: { mode: 'light' }, play: smallStopPlay }

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

/**
 * A phone page (390 px wide) with a gap of 0, as the Workbench phone chat has: the footer is inside the frame on
 * every side, and Send, which the keyboard focuses, keeps its whole focus ring inside the footer, because the
 * composer's own padding holds it.
 */
export const InFramePhoneDark: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <div className={pane} data-testid="pane-phone">
        <ScrollFrame header={<Button size="sm">Back</Button>} footer={<Composer label="Reply" model={<ModelChip model="Opus 5.5" options={[]} />} />}>
          {messages.map((text) => (
            <p key={text} className={message}>
              {text}
            </p>
          ))}
        </ScrollFrame>
      </div>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const paneEl = canvasElement.querySelector('[data-testid="pane-phone"]')
    if (!(paneEl instanceof HTMLElement)) throw new Error('no pane')
    paneEl.style.width = '390px'
    paneEl.style.height = '700px'
    await settle()
    const footer = paneEl.querySelector('.scroll-frame__footer')
    const frame = footer?.parentElement
    const body = frame?.querySelector('.scroll-frame__body')
    if (!(footer instanceof HTMLElement) || !(frame instanceof HTMLElement) || !(body instanceof HTMLElement))
      throw new Error('no frame')
    const f = footer.getBoundingClientRect()
    const r = frame.getBoundingClientRect()
    await expect(f.left).toBeGreaterThanOrEqual(r.left)
    await expect(f.right).toBeLessThanOrEqual(r.right)
    await expect(f.bottom).toBeLessThanOrEqual(r.bottom)
    await expect(f.top).toBeCloseTo(body.getBoundingClientRect().bottom, 1)
    // Focus Send with the keyboard and check its ring (2 px wide, 2 px out) is inside the footer's box.
    const send = within(footer).getByRole('button', { name: 'Send' })
    within(footer).getByRole('textbox', { name: 'Reply' }).focus()
    while (document.activeElement !== send) await userEvent.tab()
    const style = getComputedStyle(send)
    await expect(style.outlineStyle).toBe('solid')
    const ring = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset)
    const s = send.getBoundingClientRect()
    await expect(s.top - ring).toBeGreaterThanOrEqual(f.top)
    await expect(s.right + ring).toBeLessThanOrEqual(f.right)
    await expect(s.bottom + ring).toBeLessThanOrEqual(f.bottom)
  },
}
export const InFramePhoneLight: StoryObj<typeof meta> = { ...InFramePhoneDark, globals: { mode: 'light' } }

// The skill list after "/" over a composer, which is the popover's trigger (screen review R8). Each screen is a
// viewport, as the-bridge draws it: a chat whose composer fills its column, padded 16 on the phone and 24 elsewhere,
// and on the 1512 screen a side chat (shell.sidePane, 380) beside it, whose composer is narrow.
const skillScreens = {
  phone: { name: 'Phone (390)', styles: { width: '390px', height: '844px' } },
  tablet: { name: 'Tablet (756)', styles: { width: '756px', height: '1024px' } },
  laptop: { name: 'Laptop (1512)', styles: { width: '1512px', height: '982px' } },
  wide: { name: 'Wide screen (3540)', styles: { width: '3540px', height: '1440px' } },
}
type SkillScreen = keyof typeof skillScreens
const skillScreen = css({ display: 'flex', h: 'dvh', bg: 'bg.canvas', color: 'fg.default' })
const skillChat = css({ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', flex: '1', p: '24' })
const skillChatPhone = css({ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', flex: '1', p: '16' })
const skillSide = css({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  flexShrink: '0',
  w: 'shell.sidePane',
  p: '24',
  borderLeftWidth: 'default',
  borderLeftStyle: 'solid',
  borderColor: 'border.default',
})
const longSkill = '/summarise-the-review-comments-for-the-release-notes'
const longHint = 'Gather every review comment on the open pull requests and write them up as release notes'
const pickerSkills = [
  { value: 'writer', label: '/writer', description: 'Draft a doc from sources' },
  { value: 'readme', label: '/readme', description: 'Write or check a README' },
  { value: 'long', label: longSkill, description: longHint },
]

// One composer with its open skill list. `trigger` is the phone's width; `composer` the others'.
function SkillComposer({ name, width }: { name: string; width: 'composer' | 'trigger' }) {
  return (
    <Popover
      label={`${name} skills`}
      open
      placement="top-start"
      width={width}
      density={width === 'trigger' ? 'compact' : 'default'}
      autoFocus={false}
      flip={false}
      trigger={
        <div role="combobox" aria-label={`${name} skills`}>
          <Composer label={name} model={<ModelChip model="Opus 5.5" options={[]} />} />
        </div>
      }
    >
      <PopoverSection label="Skills">
        <OptionList
          label={`${name} skill list`}
          items={pickerSkills}
          value="writer"
          size="sm"
          labelStyle="mono"
          check={false}
          selectedFill
          density={width === 'trigger' ? 'compact' : 'default'}
        />
      </PopoverSection>
    </Popover>
  )
}

function SkillPickerScreen({ screen }: { screen: SkillScreen }) {
  return (
    <div className={skillScreen}>
      <main className={screen === 'phone' ? skillChatPhone : skillChat}>
        <SkillComposer name="Chat" width={screen === 'phone' ? 'trigger' : 'composer'} />
      </main>
      {screen === 'laptop' ? (
        <aside className={skillSide} aria-label="Side chat">
          <SkillComposer name="Side chat" width="composer" />
        </aside>
      ) : null}
    </div>
  )
}

/** The popover named `name` and the composer box that opens it. */
const pickerParts = async (canvasElement: HTMLElement, name: string) => {
  const box = await within(document.body).findByRole('dialog', { name: `${name} skills` })
  const composerBox = within(canvasElement).getByRole('textbox', { name }).closest('.composer__root')
  if (!(composerBox instanceof HTMLElement)) throw new Error(`no composer ${name}`)
  return { box, composer: composerBox.getBoundingClientRect().width }
}

// The rule of `width="composer"`: 40% of the composer, at least 240 and at most 400.
const clampedWidth = (composer: number) => Math.min(400, Math.max(240, composer * 0.4))

/**
 * The list's width on each screen: on the phone the composer's whole width (`width="trigger"`); elsewhere 40% of
 * the composer, clamped to 240 (`shell.pickerMin`) and 400 (`shell.pickerMax`). A long skill name and its hint stay on
 * one line each and are cut with a tooltip.
 */
const skillPickerPlay =
  (screen: SkillScreen): NonNullable<StoryObj<typeof meta>['play']> =>
  async ({ canvasElement }) => {
    const size = skillScreens[screen].styles
    await expect([`${String(window.innerWidth)}px`, `${String(window.innerHeight)}px`]).toEqual([size.width, size.height])
    await document.fonts.ready
    const chat = await pickerParts(canvasElement, 'Chat')
    await waitFor(() => expect(chat.box.getBoundingClientRect().width).toBeGreaterThan(0))
    const width = () => chat.box.getBoundingClientRect().width
    if (screen === 'phone') {
      // The phone's composer is 358 (390 less 16 each side, M3 105:2805), and the list is as wide as it.
      await expect(chat.composer).toBe(358)
      await waitFor(() => expect(width()).toBe(chat.composer))
    } else {
      await waitFor(() => expect(width()).toBeCloseTo(clampedWidth(chat.composer), 1))
      // The tablet's composer (708) gives 40% (283.2); the laptop's (1084) and the wide screen's (3492) hit 400.
      if (screen === 'tablet') await expect(width()).toBeCloseTo(283.2, 1)
      else await expect(width()).toBe(400)
    }
    if (screen !== 'laptop') return
    // The side chat's composer is 331 (380 less its 1 px border and 24 each side), whose 40% is under the floor:
    // the list is 240.
    const side = await pickerParts(canvasElement, 'Side chat')
    await expect(side.composer).toBe(331)
    await waitFor(() => expect(side.box.getBoundingClientRect().width).toBe(240))
    // At 240 the long mono name and its hint each keep one line, cut with an ellipsis and shown whole in a tooltip.
    const row = within(side.box).getByRole('radio', { name: longSkill }).closest('label')
    if (!(row instanceof HTMLElement)) throw new Error('no long row')
    const nameText = row.querySelector('.option-list__itemText')
    const hint = row.querySelector('.option-list__itemDescription')
    if (!(nameText instanceof HTMLElement) || !(hint instanceof HTMLElement)) throw new Error('no long row text')
    await expect(nameText.getBoundingClientRect().height).toBe(16)
    await expect(Math.round(hint.getBoundingClientRect().height)).toBe(Math.round(parseFloat(getComputedStyle(hint).lineHeight)))
    await expectCutText(nameText, longSkill)
    await expectCutText(hint, longHint)
    // A short name fits and is not cut.
    const short = within(side.box).getByRole('radio', { name: '/writer' }).closest('label')?.querySelector('.truncated-text')
    if (!(short instanceof HTMLElement)) throw new Error('no short name')
    await expect(short.scrollWidth).toBeLessThanOrEqual(short.clientWidth)
  }

const skillPickerStory = (screen: SkillScreen, mode: 'dark' | 'light'): StoryObj<typeof meta> => ({
  render: () => <SkillPickerScreen screen={screen} />,
  parameters: { viewport: { options: skillScreens } },
  globals: { mode, viewport: { value: screen } },
  play: skillPickerPlay(screen),
})

/** The phone (390): the skill list is as wide as the composer (`width="trigger"`). */
export const SkillPickerPhoneDark = skillPickerStory('phone', 'dark')
export const SkillPickerPhoneLight = skillPickerStory('phone', 'light')
/** The tablet (756): 40% of the 708 px composer. */
export const SkillPickerTabletDark = skillPickerStory('tablet', 'dark')
export const SkillPickerTabletLight = skillPickerStory('tablet', 'light')
/** The 1512 laptop: 400 over the chat's composer, 240 over the side chat's, where a long skill name is cut. */
export const SkillPickerLaptopDark = skillPickerStory('laptop', 'dark')
export const SkillPickerLaptopLight = skillPickerStory('laptop', 'light')
/** The 3540 screen of screen review R8: the list stops at 400. */
export const SkillPickerWideDark = skillPickerStory('wide', 'dark')
export const SkillPickerWideLight = skillPickerStory('wide', 'light')

// A touch screen for the story test: Chromium's touch emulation, through the test runner's DevTools session, makes
// the CSS `(pointer: coarse)` true, as a phone's is. A mocked `matchMedia` would not change the CSS.
const emulateTouch = async (enabled: boolean) => {
  const { cdp } = await import('vitest/browser')
  await cdp().send('Emulation.setTouchEmulationEnabled', { enabled, maxTouchPoints: 1 })
}

/** The long skill name in the phone's list: its TruncatedText and its rows' line height. */
const phoneLongName = async (canvasElement: HTMLElement) => {
  const { box } = await pickerParts(canvasElement, 'Chat')
  const row = within(box).getByRole('radio', { name: longSkill }).closest('label')
  const text = row?.querySelector('.option-list__itemText .truncated-text')
  const hint = row?.querySelector('.option-list__itemDescription .truncated-text')
  if (!(text instanceof HTMLElement) || !(hint instanceof HTMLElement)) throw new Error('no long name')
  return { text, hint, line: parseFloat(getComputedStyle(text).lineHeight) }
}

/**
 * A tooltip needs a pointer to rest on the text, so on a touch screen the long skill name and its hint wrap and show
 * whole (PR #171 review); with a fine pointer they are cut again, with the tooltip.
 */
export const SkillPickerTouchDark: StoryObj<typeof meta> = {
  // Only the story test runner has the DevTools session that emulates touch, so the Storybook UI leaves this story
  // out; the test runner still runs it.
  tags: ['!dev'],
  render: () => <SkillPickerScreen screen="phone" />,
  parameters: { viewport: { options: skillScreens } },
  globals: { mode: 'dark', viewport: { value: 'phone' } },
  beforeEach: async () => {
    await emulateTouch(true)
    return async () => {
      await emulateTouch(false)
    }
  },
  play: async ({ canvasElement }) => {
    await expect(window.matchMedia('(pointer: coarse)').matches).toBe(true)
    await document.fonts.ready
    // Wait for Ark to place the box at the composer's width.
    const chat = await pickerParts(canvasElement, 'Chat')
    await waitFor(() => expect(chat.box.getBoundingClientRect().width).toBe(chat.composer))
    const touch = await phoneLongName(canvasElement)
    await waitFor(() => expect(touch.text.scrollWidth).toBeLessThanOrEqual(touch.text.clientWidth))
    await expect(touch.text.getBoundingClientRect().height).toBeGreaterThan(touch.line)
    await expect(touch.hint.scrollWidth).toBeLessThanOrEqual(touch.hint.clientWidth)
    await expect(touch.hint.getBoundingClientRect().height).toBeGreaterThan(parseFloat(getComputedStyle(touch.hint).lineHeight))
    // A fine pointer: the name is on one line again and cut.
    await emulateTouch(false)
    await expect(window.matchMedia('(pointer: coarse)').matches).toBe(false)
    const fine = await phoneLongName(canvasElement)
    await waitFor(() => expect(fine.text.scrollWidth).toBeGreaterThan(fine.text.clientWidth))
    await expect(Math.round(fine.text.getBoundingClientRect().height)).toBe(Math.round(fine.line))
  },
}
export const SkillPickerTouchLight: StoryObj<typeof meta> = { tags: ['!dev'], ...SkillPickerTouchDark, globals: { mode: 'light', viewport: { value: 'phone' } } }

const onIconAttach = fn()

// The attach glyph and Send's arrow: the defaults (16 px paperclip, 16 px arrow), Workspaces D04's add
// button (a 12 px plus for Figma's 13, 137:6) and the side chat's 12 px arrow (D05 158:549).
function IconSizes() {
  return (
    <main className={page}>
      <Stack gap="16">
        <Composer label="Default stacked" onAttach={() => undefined} />
        <Composer label="Add stacked" onAttach={onIconAttach} attachIcon={<PlusIcon size="12" />} attachLabel="Add" />
        <Composer label="Default inline" layout="inline" />
        <Composer label="Small send inline" layout="inline" sendIconSize="12" />
        <Composer label="Default running" running />
        <Composer label="Small stop" running stopIconSize="12" />
      </Stack>
      {swatchRow}
    </main>
  )
}

const iconSizesPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const box = (name: string) => {
    const el = canvas.getByRole('textbox', { name }).closest<HTMLElement>('.composer__root')
    if (el === null) throw new Error(`no composer ${name}`)
    return within(el)
  }
  const svgSize = (button: HTMLElement) => {
    const svg = button.querySelector('svg')
    if (svg === null) throw new Error('no svg')
    const rect = svg.getBoundingClientRect()
    return [rect.width, rect.height]
  }
  // The defaults stay: a 16 px paperclip named "Attach a file" and a 16 px arrow on Send, in both layouts.
  const defaults = box('Default stacked')
  await expect(svgSize(defaults.getByRole('button', { name: 'Attach a file' }))).toEqual([16, 16])
  await expect(svgSize(defaults.getByRole('button', { name: 'Send' }))).toEqual([16, 16])
  await expect(svgSize(box('Default inline').getByRole('button', { name: 'Send' }))).toEqual([16, 16])
  // attachIcon and attachLabel: the add button draws the 12 px plus it is given, named "Add", in the 28 px button.
  const add = box('Add stacked').getByRole('button', { name: 'Add' })
  await expect(svgSize(add)).toEqual([12, 12])
  await expect(add.getBoundingClientRect().height).toBe(28)
  await expect(box('Add stacked').queryByRole('button', { name: 'Attach a file' })).toBeNull()
  onIconAttach.mockClear()
  await userEvent.click(add)
  await expect(onIconAttach).toHaveBeenCalledTimes(1)
  // sendIconSize="12": the inline Send keeps its 24 px button and draws a 12 px arrow.
  const smallSend = box('Small send inline').getByRole('button', { name: 'Send' })
  await expect(svgSize(smallSend)).toEqual([12, 12])
  await expect(smallSend.getBoundingClientRect().height).toBe(24)
  // Stop draws a 16 px square by default; stopIconSize="12" draws Inbox D05's 12 px square in the same button.
  const stop = (name: string) => box(name).getByRole('button', { name: 'Stop' })
  await expect(svgSize(stop('Default running'))).toEqual([16, 16])
  await expect(svgSize(stop('Small stop'))).toEqual([12, 12])
  await expect(stop('Small stop').getBoundingClientRect().height).toBe(stop('Default running').getBoundingClientRect().height)
}

/** `attachIcon`, `attachLabel`, `sendIconSize` and `stopIconSize`: Workspaces D04's 12 px plus, D05's 12 px Send arrow and Inbox D05's 12 px Stop square, beside the defaults. */
export const IconSizesDark: StoryObj<typeof meta> = { render: () => <IconSizes />, globals: { mode: 'dark' }, play: iconSizesPlay }
export const IconSizesLight: StoryObj<typeof meta> = { render: () => <IconSizes />, globals: { mode: 'light' }, play: iconSizesPlay }
