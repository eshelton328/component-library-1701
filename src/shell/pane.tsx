import { useId, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { pane } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(pane)
const Root = withProvider('section', 'root')
const Header = withContext('div', 'header')
const Leading = withContext('span', 'leading')
const Title = withContext('h2', 'title')
const Meta = withContext('div', 'meta')
const Actions = withContext('div', 'actions')
const Body = withContext('div', 'body')

// A slot given as `false`, `null` or an empty string is left out, as React leaves it out.
const shown = (node: ReactNode) => node !== undefined && node !== null && typeof node !== 'boolean' && node !== ''

export type PaneProps = {
  /** The pane's title, such as the chat name. It names the pane for assistive technology. */
  title: string
  /** Before the title, such as the agent's kind mark. */
  leading?: ReactNode
  /** After the title, such as the model and a status pill. */
  meta?: ReactNode
  /** At the end of the header, such as the maximise and chat actions buttons. */
  actions?: ReactNode
  /** Whether this is the focused pane, the one that keyboard shortcuts act on. It gets the cyan 1.5 px border. */
  focused?: boolean | undefined
  /** Called when the user clicks or tabs into a pane that is not focused, so the app can focus it. */
  onActivate?: (() => void) | undefined
  /** The pane's content, such as the chat. It scrolls under the header. */
  children?: ReactNode
}

/**
 * One pane of the Workbench split: a glass box with a header (leading
 * mark, title, meta and actions) over a scrolling body. The focused pane
 * has a cyan border and `aria-current`. The app decides which pane is
 * focused; the pane only reports a click or focus with `onActivate`.
 */
export function Pane({ title, leading, meta, actions, focused = false, onActivate, children }: PaneProps) {
  const titleId = useId()
  const activate = () => {
    if (!focused) onActivate?.()
  }
  return (
    <Root
      focused={focused}
      aria-labelledby={titleId}
      {...(focused ? { 'aria-current': 'true' as const } : {})}
      onPointerDown={activate}
      onFocus={activate}
    >
      <Header>
        {shown(leading) ? <Leading>{leading}</Leading> : null}
        <Title id={titleId}>{title}</Title>
        {shown(meta) ? <Meta>{meta}</Meta> : null}
        {shown(actions) ? <Actions>{actions}</Actions> : null}
      </Header>
      <Body>{children}</Body>
    </Root>
  )
}
