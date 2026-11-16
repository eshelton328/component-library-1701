import { useId, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { toolLine, type ToolLineVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'
import { ChevronDownIcon, ChevronRightIcon } from '../foundations/icons'

const { withProvider, withContext } = createSlotRecipeContext(toolLine)
const Root = withProvider('div', 'root')
const Toggle = withContext('button', 'header')
const Static = withContext('div', 'header')
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

// React renders nothing for null, undefined, booleans and the empty string.
function present(node: ReactNode): boolean {
  return node !== null && node !== undefined && typeof node !== 'boolean' && node !== ''
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
  const body = (
    <>
      <Dot role="img" aria-label={stateLabel ?? stateNames[state]} />
      <Text title={text}>{text}</Text>
      {expandable ? <Chevron>{open ? <ChevronDownIcon size="12" /> : <ChevronRightIcon size="12" />}</Chevron> : null}
    </>
  )
  return (
    <Root state={state} data-state={expandable ? (open ? 'open' : 'closed') : undefined}>
      {expandable ? (
        <Toggle
          type="button"
          aria-expanded={open}
          aria-controls={outputId}
          onClick={() => {
            onOpenChange(!open)
          }}
        >
          {body}
        </Toggle>
      ) : (
        <Static>{body}</Static>
      )}
      {hasOutput ? (
        <Output id={outputId} hidden={!open}>
          {children}
        </Output>
      ) : null}
    </Root>
  )
}
