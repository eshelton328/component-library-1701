import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { composer } from '../../styled-system/recipes'
import { ArrowUpIcon, ClipIcon, CloseIcon, StopIcon } from '../foundations/icons'
import { Button } from '../controls/button'
import { Inline } from '../controls/layout'
import { TextArea } from '../controls/text-field'
import { TruncatedText } from '../controls/tooltip'

const { withProvider, withContext } = createSlotRecipeContext(composer)
const Root = withProvider('div', 'root')
const Row = withContext('div', 'row')
const Text = withContext('div', 'text')
const Model = withContext('div', 'model')
const Attachment = withContext('span', 'attachment')
const AttachmentIcon = withContext('span', 'attachmentIcon')
const AttachmentName = withContext('span', 'attachmentName')
const AttachmentRemove = withContext('button', 'attachmentRemove')

/** A file attached to the message. */
export type ComposerAttachment = {
  /** A key the composer passes back to `onRemoveAttachment`. */
  id: string
  /** The file name the chip shows, such as "requirements.md". */
  name: string
}

export type ComposerProps = {
  /** The accessible name of the text area; "Message" when not set. It is not shown. */
  label?: string | undefined
  /** "Message, or / for a skill" when not set. */
  placeholder?: string | undefined
  /** The text. Set it with `onValueChange` to control the composer, and clear it after `onSubmit`. */
  value?: string | undefined
  defaultValue?: string | undefined
  /** Called with the text after each change. */
  onValueChange?: ((value: string) => void) | undefined
  /**
   * Called with the text when the user presses Enter or the send button.
   * The composer sends nothing itself. Shift+Enter adds a line. Text of
   * only spaces is not submitted. Without `value`, the composer clears
   * its text after the call.
   */
  onSubmit?: ((text: string) => void) | undefined
  /** The chat is working: the composer shows Stop. Sending while it works queues the message. */
  running?: boolean | undefined
  /** Called when the user presses Stop. */
  onStop?: (() => void) | undefined
  /** The files attached to the message, shown above the text. */
  attachments?: readonly ComposerAttachment[] | undefined
  /** Called with the `id` of the attachment whose remove button the user presses. Without it, attachments have no remove button. */
  onRemoveAttachment?: ((id: string) => void) | undefined
  /** Called when the user presses the attach button. Without it, there is no attach button. */
  onAttach?: (() => void) | undefined
  /** The model control after the attach button, such as a `ModelChip`. */
  model?: ReactNode
  disabled?: boolean | undefined
  /**
   * `stacked` (the default) draws the text over a row of buttons: the
   * attach button and the model at the start, Stop and send at the end
   * (78 px with one line of text).
   * `inline` draws one row, as the side chat in a pane does (Workspaces D5
   * 158:545): the text, then the model, Stop and send as 24 px buttons
   * (the attach button, when set, comes first), 42 px high with one line
   * of text. The text grows as it wraps, and the buttons stay at the
   * bottom. In a narrow row the text keeps 40 % of the width and the
   * model shrinks (a `ModelChip` cuts its text), so Send stays inside.
   * Attachments show above the row in both layouts.
   */
  layout?: 'stacked' | 'inline' | undefined
}

/**
 * The message box at the bottom of a chat: the attached files, the text,
 * an attach button, the model, and Stop and send buttons, in two rows or,
 * with `layout="inline"`, in one. It shows the data it gets and reports
 * through callbacks; it calls `onSubmit` and does not send a message
 * (d-068, d-069). A long draft grows the composer to at most 30% of the
 * nearest size container (or of the window), and the text scrolls inside
 * past that; at rest it keeps its full height in any frame.
 */
export function Composer({
  label = 'Message',
  placeholder = 'Message, or / for a skill',
  value,
  defaultValue,
  onValueChange,
  onSubmit,
  running = false,
  onStop,
  attachments = [],
  onRemoveAttachment,
  onAttach,
  model,
  disabled = false,
  layout = 'stacked',
}: ComposerProps) {
  const [draft, setDraft] = useState(defaultValue ?? '')
  const text = value ?? draft
  const change = (next: string) => {
    if (value === undefined) setDraft(next)
    onValueChange?.(next)
  }
  const submit = () => {
    if (disabled || text.trim() === '') return
    onSubmit?.(text)
    if (value === undefined) change('')
  }
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter while an input method composes a character confirms the character.
    // Safari can send that Enter with isComposing false and the legacy keyCode
    // 229, which the DOM types mark deprecated, so it is read as unknown.
    const keyCode: unknown = Reflect.get(event.nativeEvent, 'keyCode')
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing || keyCode === 229) return
    event.preventDefault()
    submit()
  }
  const inline = layout === 'inline'
  const buttonSize = inline ? 'xs' : 'sm'
  const chips =
    attachments.length === 0 ? null : (
      <Inline gap="6" wrap>
        {attachments.map((file) => (
          <Attachment key={file.id}>
            <AttachmentIcon aria-hidden="true">
              <ClipIcon size="12" />
            </AttachmentIcon>
            <AttachmentName>
              <TruncatedText>{file.name}</TruncatedText>
            </AttachmentName>
            {onRemoveAttachment === undefined ? null : (
              <AttachmentRemove
                type="button"
                aria-label={`Remove ${file.name}`}
                disabled={disabled ? true : undefined}
                onClick={() => {
                  onRemoveAttachment(file.id)
                }}
              >
                <CloseIcon size="12" />
              </AttachmentRemove>
            )}
          </Attachment>
        ))}
      </Inline>
    )
  const textArea = (
    <TextArea
      variant="bare"
      labelHidden
      label={label}
      placeholder={placeholder}
      value={text}
      onValueChange={change}
      onKeyDown={onKeyDown}
      autoresize
      rows={1}
      disabled={disabled}
    />
  )
  const attach =
    onAttach === undefined ? null : (
      <Button data-keyboard-keep="" size={buttonSize} iconOnly aria-label="Attach a file" disabled={disabled} onClick={onAttach}>
        <ClipIcon size="16" />
      </Button>
    )
  const stop = running ? (
    <Button data-keyboard-keep="" size={buttonSize} textSize={inline ? 'xs' : 'md'} disabled={disabled} onClick={onStop}>
      <StopIcon size="16" />
      Stop
    </Button>
  ) : null
  const send = (
    <Button data-keyboard-keep="" variant="primary" size={buttonSize} iconOnly aria-label="Send" disabled={disabled} onClick={submit}>
      <ArrowUpIcon size="16" />
    </Button>
  )
  if (inline) {
    return (
      <Root layout="inline">
        {chips}
        <Row>
          {attach}
          <Text>{textArea}</Text>
          {model === undefined || model === null ? null : <Model>{model}</Model>}
          {stop}
          {send}
        </Row>
      </Root>
    )
  }
  return (
    <Root>
      {chips}
      {textArea}
      <Inline justify="between" gap="6">
        <Inline gap="6">
          {attach}
          {model}
        </Inline>
        <Inline gap="6">
          {stop}
          {send}
        </Inline>
      </Inline>
    </Root>
  )
}
