import { Children, Fragment, isValidElement, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { toolLine, type ToolLineVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'
import { TruncatedText } from '../controls/tooltip'
import { ChevronDownIcon, ChevronRightIcon } from '../foundations/icons'

const { withProvider, withContext } = createSlotRecipeContext(toolLine)
const Root = withProvider('div', 'root')
const Header = withContext('div', 'header')
const Dot = withContext('span', 'dot')
const Text = withContext('span', 'text')
const Chevron = withContext('span', 'chevron')
const Output = withContext('div', 'output')

/** The state of a tool call: `running`, `done` or `failed`. */
export type ToolLineState = NonNullable<ToolLineProps['state']>

const stateNames = { running: 'Running', done: 'Done', failed: 'Failed' } as const

export type ToolLineProps = Scalar<ToolLineVariantProps> & {
  /** The tool, such as "Read" or "Bash". */
  name: string
  /** What the tool acted on, such as a file path or a command. */
  target?: string | undefined
  /** The name of the state for assistive technology; "Running", "Done" or "Failed" when not set. */
  stateLabel?: string | undefined
  /** Whether the output shows. With `onOpenChange` and output, the line is a button that shows and hides it. */
  open?: boolean | undefined
  /** Called with the new state when the line is pressed. Without it the line does not expand. */
  onOpenChange?: ((open: boolean) => void) | undefined
  /** The tool's output, shown under the line while `open` is true. */
  children?: ReactNode
}

// Whether the output renders anything. React renders nothing for null,
// undefined, booleans and the empty string, nor for an array or a fragment
// that holds only those, such as `lines.map(...)` over no lines.
function present(node: ReactNode): boolean {
  return Children.toArray(node).some((child) => {
    if (typeof child === 'string') return child !== ''
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) return present(child.props.children)
    return true
  })
}

/**
 * The one-line record of a tool call in a chat: a dot in the colour of its
 * `state` (`running`, `done` or `failed`), the tool name and its target.
 * With output in `children` and `onOpenChange`, the line is a button with
 * `aria-expanded` that shows and hides the output; the caller holds `open`
 * (d-069).
 */
export function ToolLine({ name, target, state = 'done', stateLabel, open = false, onOpenChange, children }: ToolLineProps) {
  const outputId = useId()
  const hasOutput = present(children)
  const expandable = hasOutput && onOpenChange !== undefined
  const text = target === undefined || target === '' ? name : `${name} ${target}`
  // One header element whether or not the line expands, so a line that becomes expandable after its first render
  // (the-bridge's cut lines, NCC-151) keeps its TruncatedText and tooltip: a div that takes the role, focus and keys
  // of a button only while it expands. The owner ref changes with it, so the text finds its owner again.
  const header = useRef<HTMLDivElement>(null)
  const toggle = () => {
    onOpenChange?.(!open)
  }
  // A button acts on Enter as the key goes down and on Space as it comes up.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      toggle()
    } else if (event.key === ' ') event.preventDefault()
  }
  const onKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === ' ') toggle()
  }
  const button = expandable
    ? { role: 'button', tabIndex: 0, 'aria-expanded': open, 'aria-controls': outputId, onClick: toggle, onKeyDown, onKeyUp }
    : {}
  return (
    <Root state={state} data-state={expandable ? (open ? 'open' : 'closed') : undefined}>
      <Header ref={header} {...button}>
        <Dot role="img" aria-label={stateLabel ?? stateNames[state]} />
        <Text>
          <TruncatedText owner={expandable ? header : undefined}>{text}</TruncatedText>
        </Text>
        {expandable ? <Chevron>{open ? <ChevronDownIcon size="12" /> : <ChevronRightIcon size="12" />}</Chevron> : null}
      </Header>
      {hasOutput ? (
        <Output id={outputId} hidden={!open}>
          {children}
        </Output>
      ) : null}
    </Root>
  )
}
