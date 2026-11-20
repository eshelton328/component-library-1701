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
import { expectScrollAreas } from '../controls/scroll-area.testing'

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
  active: css({ bg: 'border.active' }),
  dangerBorder: css({ bg: 'status.danger.border' }),
  dangerFg: css({ bg: 'status.danger.fg' }),
  link: css({ bg: 'fg.accent' }),
  focus: css({ bg: 'border.focus' }),
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
    await userEvent.click(area)
    await waitFor(() => expect(getComputedStyle(box).borderTopColor).toBe(swatch(canvasElement, 'selected')))
    // Enter on empty text or spaces submits nothing, in a composer with no files (with ready files it sends the
    // files alone: FilesOnly).
    const bare = canvas.getByRole('textbox', { name: 'Controlled' })
    await userEvent.click(bare)
    await userEvent.keyboard('{Enter}')
    await userEvent.type(bare, '   {Enter}')
    await expect(onSubmit).not.toHaveBeenCalled()
    await userEvent.clear(bare)
    await userEvent.click(area)
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

// Attachment states for the-bridge W1b (uploads of any file, up to 1 GB): an upload at 30 %, a ready file and a
// failed one, beside a composer with no onRetryAttachment, whose failed chip has no Retry.
const onRetry = fn<(id: string) => void>()
const onStateRemove = fn<(id: string) => void>()
const upload: readonly ComposerAttachment[] = [
  { id: 'up', name: 'design-review.mov', status: 'uploading', progress: 0.3 },
  { id: 'ok', name: 'notes.md', status: 'ready' },
  { id: 'bad', name: 'build.log', status: 'failed' },
]

function AttachmentStates() {
  return (
    <main className={page}>
      <Stack gap="16">
        <Composer label="Uploads" attachments={upload} onRemoveAttachment={onStateRemove} onRetryAttachment={onRetry} onAttach={() => undefined} />
        <Composer label="No retry" attachments={[{ id: 'bad', name: 'trace.zip', status: 'failed' }]} onRemoveAttachment={() => undefined} />
        <Composer label="Unsized" attachments={[{ id: 'big', name: 'disk.img', status: 'uploading' }]} />
      </Stack>
      {swatchRow}
    </main>
  )
}

const chipOf = (box: HTMLElement, name: string) => {
  const chip = within(box).getByText(name).closest<HTMLElement>('.composer__attachment')
  if (chip === null) throw new Error(`no chip ${name}`)
  return chip
}
const composerOf = (canvasElement: HTMLElement, label: string) => {
  const box = within(canvasElement).getByRole('textbox', { name: label }).closest<HTMLElement>('.composer__root')
  if (box === null) throw new Error(`no composer ${label}`)
  return box
}

const attachmentStatesPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  onRetry.mockClear()
  onStateRemove.mockClear()
  const box = composerOf(canvasElement, 'Uploads')
  // Uploading at 0.3: a progressbar named after the file, valued 30 of 0 to 100, filled 30 % in the accent colour
  // on a border.default track, 2 px high along the chip's foot.
  const bar = within(box).getByRole('progressbar', { name: 'Uploading design-review.mov' })
  await expect([bar.getAttribute('aria-valuemin'), bar.getAttribute('aria-valuemax'), bar.getAttribute('aria-valuenow')]).toEqual(['0', '100', '30'])
  await expect(bar).toHaveAttribute('aria-valuetext', '30%')
  const fill = bar.firstElementChild
  if (!(fill instanceof HTMLElement)) throw new Error('no fill')
  await expect(rect(fill).width / rect(bar).width).toBeCloseTo(0.3, 2)
  await expect(rect(bar).height).toBe(2)
  await expect(getComputedStyle(fill).backgroundColor).toBe(swatch(canvasElement, 'accent'))
  await expect(getComputedStyle(bar).backgroundColor).toBe(swatch(canvasElement, 'border'))
  const uploading = chipOf(box, 'design-review.mov')
  await expect(rect(bar).bottom).toBeLessThanOrEqual(rect(uploading).bottom)
  await expect(rect(bar).left).toBeGreaterThan(rect(uploading).left)
  // The ready chip is drawn as before: no bar, a border.default border, an fg.default clip, 26 high.
  const ready = chipOf(box, 'notes.md')
  await expect(within(ready).queryByRole('progressbar')).toBeNull()
  await expect(getComputedStyle(ready).borderTopColor).toBe(swatch(canvasElement, 'border'))
  await expect(rect(ready).height).toBe(26)
  await expect(rect(uploading).height).toBe(26)
  const clip = ready.querySelector('svg')
  if (clip === null) throw new Error('no clip')
  await expect(getComputedStyle(clip).color).toBe(swatch(canvasElement, 'text'))
  // Failed: a status.danger border, a warning sign named "Upload failed", and Retry in fg.accent, which reports
  // the file's id; every chip keeps its remove button.
  const failed = chipOf(box, 'build.log')
  await expect(getComputedStyle(failed).borderTopColor).toBe(swatch(canvasElement, 'dangerBorder'))
  const sign = within(failed).getByRole('img', { name: 'Upload failed' })
  await expect(getComputedStyle(sign).color).toBe(swatch(canvasElement, 'dangerFg'))
  const retry = within(failed).getByRole('button', { name: 'Retry build.log' })
  await expect(retry).toHaveTextContent('Retry')
  await expect(getComputedStyle(retry).color).toBe(swatch(canvasElement, 'link'))
  await userEvent.click(retry)
  await expect(onRetry).toHaveBeenCalledTimes(1)
  await expect(onRetry).toHaveBeenLastCalledWith('bad')
  for (const name of ['design-review.mov', 'notes.md', 'build.log'])
    await expect(within(box).getByRole('button', { name: `Remove ${name}` })).toBeInTheDocument()
  await userEvent.click(within(box).getByRole('button', { name: 'Remove design-review.mov' }))
  await expect(onStateRemove).toHaveBeenLastCalledWith('up')
  // The keyboard: Shift+Tab from the text reaches each new button, which draws the focus ring; Enter retries.
  within(box).getByRole('textbox', { name: 'Uploads' }).focus()
  const stops = ['Remove build.log', 'Retry build.log', 'Remove notes.md', 'Remove design-review.mov']
  for (const name of stops) {
    const button = within(box).getByRole('button', { name })
    while (document.activeElement !== button) {
      await userEvent.tab({ shift: true })
      if (!box.contains(document.activeElement)) throw new Error(`Tab did not reach ${name}`)
    }
    await expect(getComputedStyle(button).outlineStyle).toBe('solid')
    await expect(getComputedStyle(button).outlineColor).toBe(swatch(canvasElement, 'focus'))
  }
  within(box).getByRole('button', { name: 'Retry build.log' }).focus()
  await userEvent.keyboard('{Enter}')
  await expect(onRetry).toHaveBeenCalledTimes(2)
  // A list of one row does not scroll and is no tab stop.
  await expect(box.querySelector('.composer__attachments')).not.toHaveAttribute('tabindex')
  // Without onRetryAttachment a failed chip has no Retry, and keeps remove.
  const plain = composerOf(canvasElement, 'No retry')
  await expect(within(plain).queryByRole('button', { name: /^Retry/ })).toBeNull()
  await expect(within(plain).getByRole('button', { name: 'Remove trace.zip' })).toBeInTheDocument()
  // An upload with no progress has a bar with no value, and an empty fill.
  const unsized = within(composerOf(canvasElement, 'Unsized')).getByRole('progressbar', { name: 'Uploading disk.img' })
  await expect(unsized).not.toHaveAttribute('aria-valuenow')
  await expect(unsized.firstElementChild?.getBoundingClientRect().width).toBe(0)
}

/** Attachment states: uploading at 0.3 with its progress bar, ready, and failed with Retry (`onRetryAttachment`). */
export const AttachmentStatesDark: StoryObj<typeof meta> = { render: () => <AttachmentStates />, globals: { mode: 'dark' }, play: attachmentStatesPlay }
export const AttachmentStatesLight: StoryObj<typeof meta> = { render: () => <AttachmentStates />, globals: { mode: 'light' }, play: attachmentStatesPlay }

// sendDisabled, as while an attachment uploads, beside a composer without it.
const onHeldSubmit = fn<(text: string) => void>()

function SendStates() {
  return (
    <main className={page}>
      <Stack gap="16">
        <Composer
          label="Held"
          sendDisabled
          defaultValue="Ready once the upload ends"
          onSubmit={onHeldSubmit}
          attachments={[{ id: 'up', name: 'design-review.mov', status: 'uploading', progress: 0.3 }]}
        />
        <Composer label="Open" defaultValue="Sent now" onSubmit={onHeldSubmit} />
      </Stack>
    </main>
  )
}

const sendStatesPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  onHeldSubmit.mockClear()
  // sendDisabled: Send is disabled and Enter sends nothing; the text stays editable.
  const held = composerOf(canvasElement, 'Held')
  const field = within(held).getByRole('textbox', { name: 'Held' })
  await expect(within(held).getByRole('button', { name: 'Send' })).toBeDisabled()
  await userEvent.click(field)
  await userEvent.keyboard('{Enter}')
  await expect(onHeldSubmit).not.toHaveBeenCalled()
  await userEvent.type(field, '!')
  await expect(field).toHaveValue('Ready once the upload ends!')
  // The default leaves Send on.
  const open = composerOf(canvasElement, 'Open')
  const send = within(open).getByRole('button', { name: 'Send' })
  await expect(send).toBeEnabled()
  await userEvent.click(send)
  await expect(onHeldSubmit).toHaveBeenCalledTimes(1)
  await expect(onHeldSubmit).toHaveBeenLastCalledWith('Sent now')
}

/** `sendDisabled`: Send is off while an upload is pending; the default leaves it on. */
export const SendDisabledDark: StoryObj<typeof meta> = { render: () => <SendStates />, globals: { mode: 'dark' }, play: sendStatesPlay }
export const SendDisabledLight: StoryObj<typeof meta> = { render: () => <SendStates />, globals: { mode: 'light' }, play: sendStatesPlay }

// A message of files alone (the-bridge W1b): with every file ready, Send and Enter submit '' with no text; an upload
// that runs or failed holds it, and a composer with no files still submits nothing.
const onFilesSubmit = fn<(text: string) => void>()
const onFilesSend = fn<(text: string) => boolean>(() => true)
const readyFiles: readonly ComposerAttachment[] = [
  { id: 'notes', name: 'notes.md', status: 'ready' },
  { id: 'shot', name: 'screenshot.png' },
]

function FilesOnly() {
  return (
    <main className={page}>
      <Stack gap="16">
        <Composer label="Files" attachments={readyFiles} onSubmit={onFilesSubmit} />
        <Composer label="Files by onSend" attachments={readyFiles} onSend={onFilesSend} />
        <Composer label="Uploading" attachments={[...readyFiles, { id: 'up', name: 'design-review.mov', status: 'uploading', progress: 0.3 }]} onSubmit={onFilesSubmit} />
        <Composer label="Failed" attachments={[...readyFiles, { id: 'bad', name: 'build.log', status: 'failed' }]} onSubmit={onFilesSubmit} />
        <Composer label="No files" onSubmit={onFilesSubmit} />
      </Stack>
    </main>
  )
}

const filesOnlyPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  onFilesSubmit.mockClear()
  onFilesSend.mockClear()
  // Every file ready and no text: Send submits '', and so does Enter.
  const files = composerOf(canvasElement, 'Files')
  const field = within(files).getByRole('textbox', { name: 'Files' })
  const send = within(files).getByRole('button', { name: 'Send' })
  await expect(send).toBeEnabled()
  await userEvent.click(send)
  await expect(onFilesSubmit).toHaveBeenCalledTimes(1)
  await expect(onFilesSubmit).toHaveBeenLastCalledWith('')
  await userEvent.click(field)
  await userEvent.keyboard('{Enter}')
  await expect(onFilesSubmit).toHaveBeenCalledTimes(2)
  await expect(onFilesSubmit).toHaveBeenLastCalledWith('')
  // Text of only spaces is no text: it submits '' and the box clears.
  await userEvent.type(field, '   {Enter}')
  await expect(onFilesSubmit).toHaveBeenCalledTimes(3)
  await expect(onFilesSubmit).toHaveBeenLastCalledWith('')
  await expect(field).toHaveValue('')
  // A text with the files is submitted as typed, as before.
  await userEvent.type(field, 'See the notes{Enter}')
  await expect(onFilesSubmit).toHaveBeenLastCalledWith('See the notes')
  // onSend gets '' the same way, by Send and by Enter.
  const bySend = composerOf(canvasElement, 'Files by onSend')
  await userEvent.click(within(bySend).getByRole('button', { name: 'Send' }))
  await expect(onFilesSend).toHaveBeenCalledTimes(1)
  await expect(onFilesSend).toHaveBeenLastCalledWith('')
  await userEvent.click(within(bySend).getByRole('textbox', { name: 'Files by onSend' }))
  await userEvent.keyboard('{Enter}')
  await expect(onFilesSend).toHaveBeenCalledTimes(2)
  await expect(onFilesSend).toHaveBeenLastCalledWith('')
  onFilesSubmit.mockClear()
  // A file that uploads or failed holds a message of files alone; so does a composer with no files.
  for (const label of ['Uploading', 'Failed', 'No files']) {
    const box = composerOf(canvasElement, label)
    await userEvent.click(within(box).getByRole('button', { name: 'Send' }))
    await userEvent.click(within(box).getByRole('textbox', { name: label }))
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard('   {Enter}')
  }
  await expect(onFilesSubmit).not.toHaveBeenCalled()
}

/** A message of files alone: Send and Enter submit `''` once every file is ready. */
export const FilesOnlyDark: StoryObj<typeof meta> = { render: () => <FilesOnly />, globals: { mode: 'dark' }, play: filesOnlyPlay }
export const FilesOnlyLight: StoryObj<typeof meta> = { render: () => <FilesOnly />, globals: { mode: 'light' }, play: filesOnlyPlay }

// Retry per file (the-bridge W1b): a file the server never takes (too large, empty, a type it cannot read) fails
// with `retry: false` and shows no Retry; a failed file with no `retry`, or `retry: true`, shows it.
const onFileRetry = fn<(id: string) => void>()

function RetryPerFile() {
  return (
    <main className={page}>
      <Composer
        label="Retry per file"
        onRetryAttachment={onFileRetry}
        onRemoveAttachment={() => undefined}
        attachments={[
          { id: 'huge', name: 'disk.iso', status: 'failed', retry: false },
          { id: 'log', name: 'build.log', status: 'failed' },
          { id: 'zip', name: 'trace.zip', status: 'failed', retry: true },
        ]}
      />
      {swatchRow}
    </main>
  )
}

const retryPerFilePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  onFileRetry.mockClear()
  const box = composerOf(canvasElement, 'Retry per file')
  // retry: false: no Retry, and the chip keeps the failed look (warning sign, danger border) and its remove button.
  const never = chipOf(box, 'disk.iso')
  await expect(within(never).queryByRole('button', { name: /^Retry/ })).toBeNull()
  await expect(within(never).getByRole('img', { name: 'Upload failed' })).toBeInTheDocument()
  await expect(getComputedStyle(never).borderTopColor).toBe(swatch(canvasElement, 'dangerBorder'))
  await expect(within(never).getByRole('button', { name: 'Remove disk.iso' })).toBeInTheDocument()
  // The default and retry: true show Retry in fg.accent, which reports the file's id.
  const retry = within(chipOf(box, 'build.log')).getByRole('button', { name: 'Retry build.log' })
  await expect(getComputedStyle(retry).color).toBe(swatch(canvasElement, 'link'))
  await expect(within(chipOf(box, 'trace.zip')).getByRole('button', { name: 'Retry trace.zip' })).toBeInTheDocument()
  await userEvent.click(retry)
  await expect(onFileRetry).toHaveBeenLastCalledWith('log')
  await expect(within(box).getAllByRole('button', { name: /^Retry/ })).toHaveLength(2)
}

/** `retry: false` on a failed attachment hides its Retry; the default shows it. */
export const RetryPerFileDark: StoryObj<typeof meta> = { render: () => <RetryPerFile />, globals: { mode: 'dark' }, play: retryPerFilePlay }
export const RetryPerFileLight: StoryObj<typeof meta> = { render: () => <RetryPerFile />, globals: { mode: 'light' }, play: retryPerFilePlay }

// Files from outside the attach button: a drop on the composer and a paste into it (onAddFiles), beside a
// composer without onAddFiles.
const onAddFiles = fn<(files: File[]) => void>()
const fileList = (...names: readonly string[]) => {
  const data = new DataTransfer()
  for (const name of names) data.items.add(new File(['x'], name, { type: name.endsWith('.png') ? 'image/png' : 'text/plain' }))
  return data
}
const textOnly = () => {
  const data = new DataTransfer()
  data.setData('text/plain', 'a dragged line')
  return data
}
/** Sends a drag event of `type` with `data` to `target`; true when no handler prevented its default. */
const drag = (target: Element, type: 'dragenter' | 'dragover' | 'dragleave' | 'drop', data: DataTransfer) =>
  target.dispatchEvent(new DragEvent(type, { dataTransfer: data, bubbles: true, cancelable: true }))
const addedNames = () => onAddFiles.mock.lastCall?.[0].map((file) => file.name)

function FileDrop() {
  return (
    <main className={page}>
      <Stack gap="16">
        <Composer label="Drop" onAddFiles={onAddFiles} onAttach={() => undefined} attachments={files} onRemoveAttachment={() => undefined} />
        <Composer label="No drop" onAttach={() => undefined} />
      </Stack>
      {swatchRow}
    </main>
  )
}

const fileDropPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  onAddFiles.mockClear()
  const box = composerOf(canvasElement, 'Drop')
  const field = within(box).getByRole('textbox', { name: 'Drop' })
  // A drop of files calls onAddFiles with them, and takes the browser's default (opening the file) away.
  const two = fileList('trace.zip', 'screen.png')
  drag(box, 'dragenter', two)
  await expect(drag(field, 'dragover', two)).toBe(false)
  await expect(drag(field, 'drop', two)).toBe(false)
  await expect(onAddFiles).toHaveBeenCalledTimes(1)
  await expect(addedNames()).toEqual(['trace.zip', 'screen.png'])
  await expect(box).not.toHaveAttribute('data-drop-target')
  // A drag of text is not a file drop: no drop state, its default kept, and no call.
  await expect(drag(box, 'dragenter', textOnly())).toBe(true)
  await expect(box).not.toHaveAttribute('data-drop-target')
  await expect(drag(box, 'drop', textOnly())).toBe(true)
  await expect(onAddFiles).toHaveBeenCalledTimes(1)
  // A paste of files (a screenshot) calls onAddFiles and pastes no text.
  await userEvent.click(field)
  await userEvent.paste(fileList('Screenshot 2026-11-20.png'))
  await expect(onAddFiles).toHaveBeenCalledTimes(2)
  await expect(addedNames()).toEqual(['Screenshot 2026-11-20.png'])
  await expect(field).toHaveValue('')
  // A paste of text pastes the text and calls nothing.
  await userEvent.paste('Pasted words')
  await expect(field).toHaveValue('Pasted words')
  await expect(onAddFiles).toHaveBeenCalledTimes(2)
  // Without onAddFiles nothing changes: a file over it draws no drop state, and a drop or a paste keeps its default.
  const plain = composerOf(canvasElement, 'No drop')
  const plainField = within(plain).getByRole('textbox', { name: 'No drop' })
  const one = fileList('trace.zip')
  drag(plain, 'dragenter', one)
  await expect(plain).not.toHaveAttribute('data-drop-target')
  await expect(drag(plainField, 'dragover', one)).toBe(true)
  await expect(drag(plainField, 'drop', one)).toBe(true)
  await expect(plainField.dispatchEvent(new ClipboardEvent('paste', { clipboardData: fileList('a.png'), bubbles: true, cancelable: true }))).toBe(true)
  await expect(onAddFiles).toHaveBeenCalledTimes(2)
}

/** `onAddFiles`: a drop of files and a paste of files call it; dragged text and pasted text work as before. */
export const AddFilesDark: StoryObj<typeof meta> = { render: () => <FileDrop />, globals: { mode: 'dark' }, play: fileDropPlay }
export const AddFilesLight: StoryObj<typeof meta> = { render: () => <FileDrop />, globals: { mode: 'light' }, play: fileDropPlay }

const dropStatePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const box = composerOf(canvasElement, 'Drop')
  const field = within(box).getByRole('textbox', { name: 'Drop' })
  const one = fileList('trace.zip')
  await expect(getComputedStyle(box).borderTopStyle).toBe('solid')
  // A file over the composer dashes its border in border.active, also while the text has the focus; moving from
  // the box onto the text inside keeps it, and leaving the box ends it.
  field.focus()
  drag(box, 'dragenter', one)
  drag(field, 'dragenter', one)
  drag(box, 'dragleave', one)
  await waitFor(() => expect(box).toHaveAttribute('data-drop-target'))
  await expect(getComputedStyle(box).borderTopStyle).toBe('dashed')
  await expect(getComputedStyle(box).borderTopColor).toBe(swatch(canvasElement, 'active'))
  drag(field, 'dragleave', one)
  await waitFor(() => expect(box).not.toHaveAttribute('data-drop-target'))
  await expect(getComputedStyle(box).borderTopStyle).toBe('solid')
  field.blur()
  // Leave a file over it, so the story shows the drop state.
  drag(box, 'dragenter', one)
  await waitFor(() => expect(getComputedStyle(box).borderTopStyle).toBe('dashed'))
}

/** The drop state: a file dragged over a composer with `onAddFiles`. */
export const DropStateDark: StoryObj<typeof meta> = { render: () => <FileDrop />, globals: { mode: 'dark' }, play: dropStatePlay }
export const DropStateLight: StoryObj<typeof meta> = { render: () => <FileDrop />, globals: { mode: 'light' }, play: dropStatePlay }

// Many chips on a phone (390 wide, the chat padded 16): a long name is cut, the chips stop at two and a half
// rows and scroll inside, and Send stays in view.
const manyUploads: readonly ComposerAttachment[] = [
  { id: 'long', name: longFile, status: 'uploading', progress: 0.3 },
  ...Array.from({ length: 13 }, (_, i): ComposerAttachment => ({ id: `f${String(i)}`, name: `photo-${String(i + 1)}.heic`, status: i === 2 ? 'failed' : 'ready' })),
]

const manyChipsPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  await expect(window.innerWidth).toBe(390)
  await document.fonts.ready
  const box = composerOf(canvasElement, 'Chat')
  const list = box.querySelector('.composer__attachments')
  if (!(list instanceof HTMLElement)) throw new Error('no chip list')
  // The chips scroll inside a box of two and a half rows (70), with no scroll bar, in the page's flow.
  await expectScrollAreas(box, 'none', '.composer__attachments')
  await expect(rect(list).height).toBe(70)
  await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight)
  // A list that scrolls is a named tab stop, so the keyboard can scroll it; a short one is not.
  await waitFor(() => expect(list).toHaveAttribute('tabindex', '0'))
  await expect(list).toHaveAccessibleName('Attached files')
  // Send and the composer stay inside the 390 px window.
  const send = within(box).getByRole('button', { name: 'Send' })
  await expect(rect(box).right).toBeLessThanOrEqual(390)
  await expect(rect(send).right).toBeLessThanOrEqual(rect(box).right)
  await expect(rect(send).bottom).toBeLessThanOrEqual(window.innerHeight)
  // The long name is cut with an ellipsis and its chip stays inside the composer.
  const long = chipOf(box, longFile)
  await expect(rect(long).right).toBeLessThanOrEqual(rect(list).right)
  const name = long.querySelector('.composer__attachmentName')
  if (name === null) throw new Error('no long name')
  await expectCutText(name, longFile)
  // Tab reaches the last chip's remove button, and the list scrolls it into view.
  const last = within(box).getByRole('button', { name: 'Remove photo-13.heic' })
  within(box).getByRole('button', { name: `Remove ${longFile}` }).focus()
  while (document.activeElement !== last) {
    await userEvent.tab()
    if (!list.contains(document.activeElement)) throw new Error('Tab left the chips')
  }
  await waitFor(() => expect(list.scrollTop).toBeGreaterThan(0))
  await expect(rect(last).bottom).toBeLessThanOrEqual(rect(list).bottom + 1)
}

const manyChipsStory = (mode: 'dark' | 'light'): StoryObj<typeof meta> => ({
  render: () => (
    <div className={skillScreen}>
      <main className={skillChatPhone}>
        <Composer
          label="Chat"
          running
          attachments={manyUploads}
          onRemoveAttachment={() => undefined}
          onRetryAttachment={() => undefined}
          onAttach={() => undefined}
          onAddFiles={() => undefined}
          model={<ModelChip model="Opus 5.5" options={[]} />}
        />
      </main>
    </div>
  ),
  parameters: { viewport: { options: skillScreens } },
  globals: { mode, viewport: { value: 'phone' } },
  play: manyChipsPlay,
})

/** Fourteen chips at 390 px: a long name is cut, the chips scroll inside the composer, and Send stays in view. */
export const ManyAttachmentsPhoneDark = manyChipsStory('dark')
export const ManyAttachmentsPhoneLight = manyChipsStory('light')
