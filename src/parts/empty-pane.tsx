import { useId, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { emptyPane } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(emptyPane)
const Root = withProvider('section', 'root')
const Content = withContext('div', 'content')
const Title = withContext('p', 'title')
const Description = withContext('p', 'description')
const Actions = withContext('div', 'actions')
const List = withContext('div', 'list')
const ListLabel = withContext('span', 'listLabel')

// A slot given as `false`, `null` or an empty string is left out, as React leaves it out.
const shown = (node: ReactNode) => node !== undefined && node !== null && typeof node !== 'boolean' && node !== ''

export type EmptyPaneProps = {
  /** What the pane is, such as "Empty pane". It names the pane for assistive technology. */
  title: string
  /** A line under the title, such as "Start a chat here, or open one from this workspace". */
  description?: ReactNode
  /** The start buttons, such as `<Button size="sm">` with a `KindMark` for Claude Code, Codex and shell. */
  actions?: ReactNode
  /** The label over the list, such as "Open in this pane". It shows in capitals and names the list. */
  listLabel?: string | undefined
  /** The rows of the list, such as a `ListRow` for each chat of the workspace that no pane shows. */
  children?: ReactNode
}

/**
 * A Workbench pane with no chat (D1 105:347): a dashed outline with no
 * header and no fill, and in its middle a title, a line, the start buttons
 * and a labelled list of chats to open in the pane. It fills its parent.
 */
export function EmptyPane({ title, description, actions, listLabel, children }: EmptyPaneProps) {
  const titleId = useId()
  const listId = useId()
  const hasLabel = listLabel !== undefined && listLabel !== ''
  return (
    <Root aria-labelledby={titleId}>
      <Content>
        <Title id={titleId}>{title}</Title>
        {shown(description) ? <Description>{description}</Description> : null}
        {shown(actions) ? <Actions>{actions}</Actions> : null}
        {shown(children) ? (
          <List role="group" {...(hasLabel ? { 'aria-labelledby': listId } : {})}>
            {hasLabel ? <ListLabel id={listId}>{listLabel}</ListLabel> : null}
            {children}
          </List>
        ) : null}
      </Content>
    </Root>
  )
}
