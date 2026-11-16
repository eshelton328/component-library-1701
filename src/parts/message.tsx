import { Children, Fragment, isValidElement, useId, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { message, type MessageVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'
import { KindMark, type KindMarkKind } from './kind-mark'

const { withProvider, withContext } = createSlotRecipeContext(message)
const Root = withProvider('article', 'root')
const Author = withContext('div', 'author')
const Name = withContext('span', 'name')
const Time = withContext('time', 'time')
const Body = withContext('div', 'body')
const Actions = withContext('div', 'actions')
const SrName = withContext('span', 'srName')

// Whether a node renders anything. React renders nothing for null,
// undefined, booleans and the empty string, nor for an array or a fragment
// that holds only those.
function present(node: ReactNode): boolean {
  return Children.toArray(node).some((child) => {
    if (typeof child === 'string') return child !== ''
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) return present(child.props.children)
    return true
  })
}

/** Who wrote a message: `user` or `assistant`. */
export type MessageFrom = NonNullable<MessageProps['from']>

export type MessageProps = Scalar<MessageVariantProps> & {
  /** The author's name: "Claude" or "Codex" on an assistant message; "You" when not set on a user message. */
  name?: string | undefined
  /** The kind mark before an assistant's name: `claude`, `codex` or `shell`. A user message has no mark. */
  kind?: KindMarkKind | undefined
  /** The time as shown, such as "09:41" or "2 min ago". */
  time?: string | undefined
  /** The time for machines, an ISO date such as "2026-11-15T09:41"; set it with `time`. */
  dateTime?: string | undefined
  /** The message content. Markdown is rendered by the caller. */
  children: ReactNode
  /** Actions under an assistant's message, such as a Copy button. */
  actions?: ReactNode
}

/**
 * A message in a chat. `from="user"` is the user's message, a bubble the
 * width of the transcript. `from="assistant"` (the default) is an agent's
 * message: an author row with its kind mark, name and time, the content,
 * and its actions. The content comes as children; the message renders no
 * Markdown itself.
 */
export function Message({ from = 'assistant', name, kind = 'claude', time, dateTime, children, actions }: MessageProps) {
  const nameId = useId()
  const hasTime = time !== undefined && time !== ''
  const timeNode = hasTime ? <Time dateTime={dateTime}>{time}</Time> : null
  if (from === 'user') {
    return (
      <Root from="user" aria-labelledby={nameId}>
        <SrName id={nameId}>{name ?? 'You'}</SrName>
        <Body>{children}</Body>
        {timeNode}
      </Root>
    )
  }
  const shown = name ?? ''
  return (
    <Root from="assistant" aria-labelledby={shown === '' ? undefined : nameId}>
      {shown === '' && !hasTime ? null : (
        <Author>
          <KindMark kind={kind} size="14" />
          {shown === '' ? null : <Name id={nameId}>{shown}</Name>}
          {timeNode}
        </Author>
      )}
      <Body>{children}</Body>
      {present(actions) ? <Actions>{actions}</Actions> : null}
    </Root>
  )
}
