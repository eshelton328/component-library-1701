import { createSlotRecipeContext } from '../../styled-system/jsx'
import { terminalLines } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(terminalLines)
const Root = withProvider('div', 'root')
const Line = withContext('span', 'line')
const Prompt = withContext('span', 'prompt')
const Cursor = withContext('span', 'cursor')

/** One line of a terminal. */
export type TerminalLine = {
  text: string
  /**
   * The colour git gives the line: `modified` amber, `deleted` red, `untracked` green; `plain` (the default) is the
   * terminal's text colour.
   */
  tone?: 'plain' | 'modified' | 'deleted' | 'untracked' | undefined
}

export type TerminalLinesProps = {
  /** Names the terminal for assistive technology, such as the pane's title. */
  label: string
  lines: readonly TerminalLine[]
  /** The prompt after the last line, such as "$", followed by a block cursor. With no prompt there is no cursor. */
  prompt?: string | undefined
}

/**
 * The output of a terminal in mono, one line each, coloured as git colours
 * its status, and the prompt with a block cursor, as a Workbench shell pane
 * shows them (D1 105:337). It does not scroll: put it in a `ScrollFrame`
 * body or a pane body, which scrolls it and takes the keyboard focus.
 */
export function TerminalLines({ label, lines, prompt }: TerminalLinesProps) {
  return (
    <Root role="log" aria-label={label}>
      {lines.map((line, index) => (
        // Terminal lines repeat, and they never move, so the position is the key.
        <Line key={index} data-tone={line.tone ?? 'plain'}>
          {line.text}
        </Line>
      ))}
      {prompt === undefined ? null : (
        <Prompt>
          {prompt}
          <Cursor aria-hidden="true" />
        </Prompt>
      )}
    </Root>
  )
}
