import { useId, useState, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { diagramFrame } from '../../styled-system/recipes'
import { Button } from '../controls/button'
import { CodeIcon } from '../foundations/icons'
import { Skeleton, SkeletonGroup } from './skeleton'

const { withProvider, withContext } = createSlotRecipeContext(diagramFrame)
const Root = withProvider('figure', 'root')
const Header = withContext('div', 'header')
const Label = withContext('figcaption', 'label')
const Actions = withContext('div', 'actions')
const Body = withContext('div', 'body')
const Placeholder = withContext('div', 'placeholder')
const Source = withContext('pre', 'source')
const Message = withContext('p', 'message')

/** Where a diagram is: `loading` while its engine loads and draws, `ready` when drawn, `error` when its source does not parse. */
export type DiagramState = 'loading' | 'ready' | 'error'

export type DiagramFrameProps = {
  /** The label in the header, such as "Mermaid". It shows in capitals and names the figure. */
  label: string
  /** The text the diagram is drawn from. It shows with "Show source", and always in the `error` state. */
  source: string
  /** `loading`, `ready` (the default) or `error`. */
  state?: DiagramState | undefined
  /** Why the diagram did not draw, shown above the source in the `error` state, such as the parser's message. */
  error?: string | undefined
  /** The drawn diagram, such as an `img` with a text alternative. Shown in the `ready` state. */
  children?: ReactNode
  /** Shows the source in place of the diagram, for a caller that keeps the toggle's state. */
  showSource?: boolean | undefined
  /** Called with the new value when "Show source" is pressed. */
  onShowSourceChange?: ((showSource: boolean) => void) | undefined
}

/**
 * A diagram drawn from text, such as a Mermaid block in a Markdown message:
 * a recessed figure with a label and a "Show source" toggle in its header.
 * `loading` shows a skeleton the size of a wide thumbnail; `ready` shows
 * the children, centred, and scrolls sideways when they are wider than the
 * column; `error` shows the reason and the source, with no toggle. The
 * frame draws nothing itself and runs no diagram engine (d-068).
 */
export function DiagramFrame({ label, source, state = 'ready', error, children, showSource, onShowSourceChange }: DiagramFrameProps) {
  const labelId = useId()
  const [ownShowSource, setOwnShowSource] = useState(false)
  const shown = showSource ?? ownShowSource
  const toggle = () => {
    setOwnShowSource(!shown)
    onShowSourceChange?.(!shown)
  }
  const sourceBlock = (
    <Source>
      <code>{source}</code>
    </Source>
  )
  return (
    <Root aria-labelledby={labelId}>
      <Header>
        <Label id={labelId}>{label}</Label>
        {state === 'ready' ? (
          <Actions>
            <Button size="xs" textSize="xs" variant="secondary" touch pressed={shown} onClick={toggle}>
              <CodeIcon size="12" />
              Show source
            </Button>
          </Actions>
        ) : null}
      </Header>
      {state === 'loading' ? (
        <Body>
          <Placeholder>
            <SkeletonGroup label={`Loading the ${label} diagram`}>
              <Skeleton shape="block" ratio="wide" />
            </SkeletonGroup>
          </Placeholder>
        </Body>
      ) : null}
      {state === 'error' ? (
        <>
          <Message role="status">{error === undefined || error.trim() === '' ? 'This diagram did not draw.' : `This diagram did not draw: ${error}`}</Message>
          {sourceBlock}
        </>
      ) : null}
      {/* The body takes the focus, so the arrow keys scroll a wide diagram. */}
      {state === 'ready' ? shown ? sourceBlock : <Body tabIndex={0}>{children}</Body> : null}
    </Root>
  )
}
