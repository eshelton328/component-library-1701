import { useLayoutEffect, useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { composer } from '../../styled-system/recipes'
import { ArrowUpIcon, ClipIcon, CloseIcon, StopIcon, WarningIcon } from '../foundations/icons'
import { Button } from '../controls/button'
import { Inline } from '../controls/layout'
import { TextArea } from '../controls/text-field'
import { TruncatedText } from '../controls/tooltip'

const { withProvider, withContext } = createSlotRecipeContext(composer)
const Root = withProvider('div', 'root')
const Row = withContext('div', 'row')
const Text = withContext('div', 'text')
const Model = withContext('div', 'model')
const Attachments = withContext('div', 'attachments')
const Attachment = withContext('span', 'attachment')
const AttachmentIcon = withContext('span', 'attachmentIcon')
const AttachmentName = withContext('span', 'attachmentName')
const AttachmentRemove = withContext('button', 'attachmentRemove')
const AttachmentRetry = withContext('button', 'attachmentRetry')
const AttachmentProgress = withContext('span', 'attachmentProgress')
const AttachmentProgressFill = withContext('span', 'attachmentProgressFill')

/** Where an attached file is: on its way up, ready to send, or failed. */
export type ComposerAttachmentStatus = 'uploading' | 'ready' | 'failed'

/** The share of an upload done, 0 to 1, as a whole per cent from 0 to 100. */
function percentOf(progress: number | undefined): number | undefined {
  if (progress === undefined || !Number.isFinite(progress)) return undefined
  return Math.round(Math.min(1, Math.max(0, progress)) * 100)
}

/**
 * Whether the chip list scrolls: its chips are taller than the box. It
 * updates when the box or a chip changes size, and when the number of chips
 * changes. One pixel of slack, for a zoomed page.
 */
function useScrollsY<T extends HTMLElement>(count: number) {
  const ref = useRef<T>(null)
  const [scrolls, setScrolls] = useState(false)
  useLayoutEffect(() => {
    const box = ref.current
    if (box === null) return
    const update = () => {
      setScrolls(box.scrollHeight - box.clientHeight > 1)
    }
    update()
    const sizes = new ResizeObserver(update)
    sizes.observe(box)
    for (const chip of Array.from(box.children)) sizes.observe(chip)
    return () => {
      sizes.disconnect()
    }
  }, [count])
  return [ref, scrolls] as const
}

/** Whether a drag carries files from outside the page, such as from Finder or the Files app. */
function carriesFiles(event: DragEvent<HTMLElement>): boolean {
  return Array.from(event.dataTransfer.types).includes('Files')
}

/** A file attached to the message. */
export type ComposerAttachment = {
  /** A key the composer passes back to `onRemoveAttachment`. */
  id: string
  /** The file name the chip shows, such as "requirements.md". A long name is cut with an ellipsis and shown whole in a tooltip. */
  name: string
  /**
   * `ready` (the default) draws the chip as it was: a paperclip, the name
   * and the remove button. `uploading` adds a thin progress bar along the
   * chip's foot (`role="progressbar"`, named "Uploading <name>"), filled to
   * `progress`. `failed` draws a warning sign and a `status.danger` border,
   * and a Retry button when the composer has `onRetryAttachment`. Every
   * state keeps the remove button.
   */
  status?: ComposerAttachmentStatus | undefined
  /**
   * How much of an `uploading` file is sent, from 0 to 1, such as 0.3. The
   * bar's `aria-valuenow` is the whole per cent (30). Without it the bar is
   * empty and has no value, for an upload whose size is not known yet.
   * Other states ignore it.
   */
  progress?: number | undefined
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
  /**
   * Called with the text when the user presses Enter or the send button,
   * in place of `onSubmit`, for a send that can fail. Return `true` when
   * the message was sent, or a promise of it. Without `value`, the
   * composer clears its text only on `true`, and only when the text has
   * not changed meanwhile; `false` or a rejected promise keeps the draft,
   * so a failed send never loses it. Send is disabled while the promise
   * is pending. The composer does not report a rejection: catch and
   * report it in `onSend`.
   */
  onSend?: ((text: string) => boolean | Promise<boolean>) | undefined
  /** The chat is working: the composer shows Stop. Sending while it works queues the message. */
  running?: boolean | undefined
  /** Called when the user presses Stop. */
  onStop?: (() => void) | undefined
  /**
   * Turns Send off while true, as `aria-disabled` is not enough for a
   * keyboard user: the send button is disabled and Enter sends nothing. The
   * text stays editable. Use it for a text the page will not send, such as
   * one over the server's limit, or while an attachment uploads. The
   * default, false, leaves Send as it was.
   */
  sendDisabled?: boolean | undefined
  /** The files attached to the message, shown above the text. */
  attachments?: readonly ComposerAttachment[] | undefined
  /** Called with the `id` of the attachment whose remove button the user presses. Without it, attachments have no remove button. */
  onRemoveAttachment?: ((id: string) => void) | undefined
  /** Called with the `id` of a `failed` attachment whose Retry button the user presses. Without it, a failed chip has no Retry button. */
  onRetryAttachment?: ((id: string) => void) | undefined
  /** Called when the user presses the attach button. Without it, there is no attach button. */
  onAttach?: (() => void) | undefined
  /**
   * Called with the files the user drops on the composer or pastes into it,
   * such as a screenshot. With it, the whole composer is a drop target for
   * files (not for dragged text or links): while a file is over it, its
   * border is dashed in `border.active`. A paste that carries files calls it
   * in place of pasting; a paste of only text pastes the text. The composer
   * uploads nothing: add the files to `attachments`. Set `onAttach` too, so
   * a keyboard or screen reader user can add a file without a drag. Without
   * it, a drop or a paste works as before; `disabled` turns it off.
   */
  onAddFiles?: ((files: File[]) => void) | undefined
  /**
   * The glyph of the attach button. Without it, the button draws a 16 px
   * paperclip (`<ClipIcon size="16" />`). The button keeps the `size` the
   * icon is given, so `<PlusIcon size="12" />` draws the 12 px plus of
   * Workspaces' add button (D04 137:6, 13 in Figma, d-100); an icon
   * without a `size` draws at 16.
   */
  attachIcon?: ReactNode
  /** The accessible name of the attach button; "Attach a file" when not set. Name it after what it does, such as "Add" for a plus. */
  attachLabel?: string | undefined
  /**
   * The size of the arrow on Send, in px. `16` (the default) draws it at
   * 16 in both layouts. `12` draws the side chat's 12 px arrow (Workspaces
   * D05 158:549) on the 24 px button of `layout="inline"`.
   */
  sendIconSize?: '12' | '16' | undefined
  /**
   * The size of the icon on Stop, in px, while `running`. `16` (the
   * default) draws it at 16. `12` draws the Inbox reply box's 12 px square
   * (Inbox D05 346:2285).
   */
  stopIconSize?: '12' | '16' | undefined
  /**
   * The label size of Stop, while `running`. `md` (the default) draws the
   * `label` style (14) in the stacked layout and `labelXs` (12) inline.
   * `xs` draws `labelXs` in both layouts, as the reply boxes of Inbox and
   * Workspaces draw Stop (Inbox T05 346:6428, Workspaces D01 105:255: 12 px
   * Medium, 25 × 14).
   */
  stopTextSize?: 'md' | 'xs' | undefined
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
 *
 * An attachment shows where its upload is (`status`, `progress`), and a
 * failed one a Retry button (`onRetryAttachment`). Many chips wrap and
 * scroll inside the composer past two and a half rows, so Send stays in
 * view on a phone. `sendDisabled` turns Send off, such as while a file
 * uploads, and `onAddFiles` takes files dropped on the composer or pasted
 * into it.
 */
export function Composer({
  label = 'Message',
  placeholder = 'Message, or / for a skill',
  value,
  defaultValue,
  onValueChange,
  onSubmit,
  onSend,
  running = false,
  onStop,
  sendDisabled = false,
  attachments = [],
  onRemoveAttachment,
  onRetryAttachment,
  onAttach,
  onAddFiles,
  attachIcon,
  attachLabel = 'Attach a file',
  sendIconSize = '16',
  stopIconSize = '16',
  stopTextSize = 'md',
  model,
  disabled = false,
  layout = 'stacked',
}: ComposerProps) {
  const [draft, setDraft] = useState(defaultValue ?? '')
  const [sending, setSending] = useState(false)
  // A file dragged over the composer, and how many of its elements the drag has entered, so a move from one
  // child to the next does not end the drop state.
  const [fileOver, setFileOver] = useState(false)
  const dragDepth = useRef(0)
  const [listRef, listScrolls] = useScrollsY<HTMLDivElement>(attachments.length)
  const text = value ?? draft
  // The draft as typed now, for a send that ends after the user typed on.
  const latest = useRef(defaultValue ?? '')
  const change = (next: string) => {
    latest.current = next
    if (value === undefined) setDraft(next)
    onValueChange?.(next)
  }
  const sent = (submitted: string) => {
    if (value === undefined && latest.current === submitted) change('')
  }
  const submit = () => {
    if (disabled || sending || sendDisabled || text.trim() === '') return
    if (onSend === undefined) {
      onSubmit?.(text)
      if (value === undefined) change('')
      return
    }
    const submitted = text
    const result = onSend(submitted)
    if (typeof result === 'boolean') {
      if (result) sent(submitted)
      return
    }
    setSending(true)
    result.then(
      (ok) => {
        setSending(false)
        if (ok) sent(submitted)
      },
      () => {
        setSending(false)
      },
    )
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
  const takesFiles = onAddFiles !== undefined && !disabled
  const fileDrop = takesFiles
    ? {
        onDragEnter: (event: DragEvent<HTMLDivElement>) => {
          if (!carriesFiles(event)) return
          event.preventDefault()
          dragDepth.current += 1
          setFileOver(true)
        },
        onDragOver: (event: DragEvent<HTMLDivElement>) => {
          if (!carriesFiles(event)) return
          event.preventDefault()
          event.dataTransfer.dropEffect = 'copy'
        },
        onDragLeave: (event: DragEvent<HTMLDivElement>) => {
          if (!carriesFiles(event)) return
          dragDepth.current = Math.max(0, dragDepth.current - 1)
          if (dragDepth.current === 0) setFileOver(false)
        },
        onDrop: (event: DragEvent<HTMLDivElement>) => {
          if (!carriesFiles(event)) return
          event.preventDefault()
          dragDepth.current = 0
          setFileOver(false)
          const files = Array.from(event.dataTransfer.files)
          if (files.length > 0) onAddFiles(files)
        },
        onPaste: (event: ClipboardEvent<HTMLDivElement>) => {
          const files = Array.from(event.clipboardData.files)
          if (files.length === 0) return
          event.preventDefault()
          onAddFiles(files)
        },
        'data-drop-target': fileOver ? '' : undefined,
      }
    : {}
  const inline = layout === 'inline'
  const buttonSize = inline ? 'xs' : 'sm'
  const chips =
    attachments.length === 0 ? null : (
      // A list that scrolls takes the focus, so the keyboard can scroll it (axe scrollable-region-focusable).
      <Attachments ref={listRef} role="group" aria-label="Attached files" tabIndex={listScrolls ? 0 : undefined}>
        {attachments.map((file) => {
          const status = file.status ?? 'ready'
          const percent = percentOf(file.progress)
          return (
            <Attachment key={file.id} data-status={status}>
              {status === 'failed' ? (
                <AttachmentIcon role="img" aria-label="Upload failed">
                  <WarningIcon size="12" />
                </AttachmentIcon>
              ) : (
                <AttachmentIcon aria-hidden="true">
                  <ClipIcon size="12" />
                </AttachmentIcon>
              )}
              <AttachmentName>
                <TruncatedText>{file.name}</TruncatedText>
              </AttachmentName>
              {status === 'failed' && onRetryAttachment !== undefined ? (
                <AttachmentRetry
                  type="button"
                  aria-label={`Retry ${file.name}`}
                  disabled={disabled ? true : undefined}
                  onClick={() => {
                    onRetryAttachment(file.id)
                  }}
                >
                  Retry
                </AttachmentRetry>
              ) : null}
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
              {status === 'uploading' ? (
                <AttachmentProgress
                  role="progressbar"
                  aria-label={`Uploading ${file.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                  aria-valuetext={percent === undefined ? undefined : `${String(percent)}%`}
                  ref={(bar: HTMLSpanElement | null) => {
                    // The fill's width; a recipe cannot know a value that changes as the file uploads.
                    bar?.style.setProperty('--composer-progress', String((percent ?? 0) / 100))
                  }}
                >
                  <AttachmentProgressFill />
                </AttachmentProgress>
              ) : null}
            </Attachment>
          )
        })}
      </Attachments>
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
      <Button data-keyboard-keep="" size={buttonSize} iconOnly keepIconSize aria-label={attachLabel} disabled={disabled} onClick={onAttach}>
        {attachIcon ?? <ClipIcon size="16" />}
      </Button>
    )
  const stop = running ? (
    <Button data-keyboard-keep="" size={buttonSize} textSize={inline || stopTextSize === 'xs' ? 'xs' : 'md'} keepIconSize disabled={disabled} onClick={onStop}>
      <StopIcon size={stopIconSize} />
      Stop
    </Button>
  ) : null
  const send = (
    <Button data-keyboard-keep="" variant="primary" size={buttonSize} iconOnly aria-label="Send" keepIconSize disabled={disabled || sending || sendDisabled} onClick={submit}>
      <ArrowUpIcon size={sendIconSize} />
    </Button>
  )
  if (inline) {
    return (
      <Root layout="inline" {...fileDrop}>
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
    <Root {...fileDrop}>
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
