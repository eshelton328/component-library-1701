import { Children, Fragment, isValidElement, useId, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { message, type MessageVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'
import { TruncatedText } from '../controls/tooltip'
import { ChatIcon } from '../foundations/icons'
import { KindMark, type KindMarkKind, type KindMarkSize } from './kind-mark'

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

// The name an assistant's message shows when it gets none, so the message
// always names its author: the mark itself is hidden from assistive technology.
const kindNames: Record<KindMarkKind, string> = { claude: 'Claude', codex: 'Codex', shell: 'Shell' }

/** Who wrote a message: `user`, `assistant` or `peer` (another chat). */
export type MessageFrom = NonNullable<MessageProps['from']>

export type MessageProps = Scalar<MessageVariantProps> & {
  /**
   * The author's name, such as "Claude" or "writer". When not set (or blank) an assistant message shows the
   * name of its `kind` ("Claude", "Codex" or "Shell"), and a user message is named "You" without showing it.
   * A peer message (another chat's, the-bridge R55) shows "From <name>", and "From another chat" without one.
   */
  name?: string | undefined
  /** The kind mark before an assistant's name: `claude`, `codex` or `shell`. A user or peer message has no mark. */
  kind?: KindMarkKind | undefined
  /** The kind mark's size: `12` (the default, the chat's 13 px mark), `16` or `20`. The Toolkit discussion draws a 15 px mark, so it takes `16`. */
  markSize?: KindMarkSize | undefined
  /** The time as shown, such as "09:41" or "2 min ago". */
  time?: string | undefined
  /** The time for machines, an ISO date such as "2026-11-15T09:41"; set it with `time`. */
  dateTime?: string | undefined
  /** The message content. Markdown is rendered by the caller. A peer message with no content shows its author row only. */
  children: ReactNode
  /** Actions under an assistant's or a peer's message, such as a Copy button. */
  actions?: ReactNode
}

/**
 * A message in a chat. `from="user"` is the user's message, a bubble the
 * width of the transcript. `from="assistant"` (the default) is an agent's
 * message: an author row with its kind mark, name and time, the content,
 * and its actions. The content comes as children; the message renders no
 * Markdown itself. `size="sm"` sets the content in the compact 13 px body (`bodySm`), as the Inbox discussion
 * draws it; `md` (the default) keeps `body`. `from="peer"` is a message that
 * another chat sent (the-bridge R55): no bubble, an amber bar on the start
 * side and an author row of the chat icon and "From <name>" in
 * `status.needsYou.fg`, the one amber the library has for "not from you" and
 * "needs you" (see the recipe), then the content and its actions.
 */
export function Message({
  from = 'assistant',
  size = 'md',
  name,
  kind = 'claude',
  markSize = '12',
  time,
  dateTime,
  children,
  actions,
}: MessageProps) {
  const nameId = useId()
  const hasTime = time !== undefined && time !== ''
  const timeNode = hasTime ? <Time dateTime={dateTime}>{time}</Time> : null
  if (from === 'peer') {
    const sender = name === undefined || name.trim() === '' ? 'another chat' : name.trim()
    return (
      <Root from="peer" size={size} aria-labelledby={nameId}>
        <Author>
          <ChatIcon size="12" />
          <Name id={nameId}>
            <TruncatedText>{`From ${sender}`}</TruncatedText>
          </Name>
          {timeNode}
        </Author>
        {present(children) ? <Body>{children}</Body> : null}
        {present(actions) ? <Actions>{actions}</Actions> : null}
      </Root>
    )
  }
  if (from === 'user') {
    return (
      <Root from="user" size={size} aria-labelledby={nameId}>
        <SrName id={nameId}>{name === undefined || name.trim() === '' ? 'You' : name}</SrName>
        <Body>{children}</Body>
        {timeNode}
      </Root>
    )
  }
  const shown = name === undefined || name.trim() === '' ? kindNames[kind] : name
  return (
    <Root from="assistant" size={size} aria-labelledby={nameId}>
      <Author>
        <KindMark kind={kind} size={markSize} />
        <Name id={nameId}>
          <TruncatedText>{shown}</TruncatedText>
        </Name>
        {timeNode}
      </Author>
      <Body>{children}</Body>
      {present(actions) ? <Actions>{actions}</Actions> : null}
    </Root>
  )
}
