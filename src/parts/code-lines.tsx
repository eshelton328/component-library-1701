import { createSlotRecipeContext } from '../../styled-system/jsx'
import { codeLines } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(codeLines)
const Root = withProvider('pre', 'root')
const LineNumber = withContext('span', 'number')
const LineText = withContext('code', 'text')

export type CodeLinesProps = {
  /** The lines of code, without line breaks. */
  lines: readonly string[]
  /** The number of the first line. Defaults to 1. */
  start?: number | undefined
}

/**
 * Code with its line numbers, such as a script in the Toolkit file
 * viewer. The numbers are right-aligned in their own column, hidden from
 * assistive technology and not selected with the code. Long lines scroll
 * sideways.
 */
export function CodeLines({ lines, start = 1 }: CodeLinesProps) {
  return (
    <Root>
      {lines.map((line, i) => (
        <LineRow key={String(i)} number={start + i} text={line} />
      ))}
    </Root>
  )
}

function LineRow({ number, text }: { number: number; text: string }) {
  return (
    <>
      <LineNumber aria-hidden="true" data-line={number}>
        {number}
      </LineNumber>
      <LineText>{text}</LineText>
    </>
  )
}
