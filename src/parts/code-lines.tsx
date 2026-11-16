import type { ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { codeLines } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(codeLines)
const Root = withProvider('pre', 'root')
const LineNumber = withContext('span', 'number')
const LineText = withContext('code', 'text')
// A plain class, not a context component, so MarkdownView can colour its code blocks with the same slot.
const segmentClass = codeLines().segment

/** The kind of a piece of code, which picks its syntax colour (`code.<kind>`). */
export type CodeKind = 'keyword' | 'string' | 'comment' | 'number' | 'function'

/** One piece of a line of code. With no `kind` it takes the code's plain colour. */
export type CodeSegment = {
  text: string
  kind?: CodeKind | undefined
}

export type CodeLinesProps = {
  /** The lines of code, without line breaks. */
  lines: readonly string[]
  /**
   * Syntax colours: for each line, its text split into pieces, in order.
   * `segments[i]` colours `lines[i]`. A line with no entry, or whose pieces
   * do not join to exactly its text, is drawn plain. The component does not
   * parse code; the caller's highlighter splits it.
   */
  segments?: readonly (readonly CodeSegment[] | undefined)[] | undefined
  /** The number of the first line. Defaults to 1. */
  start?: number | undefined
}

/**
 * Code with its line numbers, such as a script in the Toolkit file
 * viewer. The numbers are right-aligned in their own column, hidden from
 * assistive technology and not selected with the code. Long lines scroll
 * sideways. Pass `segments` to colour keywords, strings, comments, numbers
 * and function names.
 */
export function CodeLines({ lines, segments, start = 1 }: CodeLinesProps) {
  return (
    <Root>
      {lines.map((line, i) => (
        <LineRow key={String(i)} number={start + i} text={line} parts={segments?.[i]} />
      ))}
    </Root>
  )
}

// The pieces of a line, only when they spell the line exactly, so the copied text never differs from `lines`.
function matching(line: string, parts: readonly CodeSegment[] | undefined): readonly CodeSegment[] | undefined {
  if (parts === undefined) return undefined
  return parts.map((p) => p.text).join('') === line ? parts : undefined
}

/**
 * One line of code in its syntax colours: each piece with a kind in the
 * `segment` slot of the `codeLines` recipe, the rest as plain text. The line
 * is plain when `parts` is missing or does not join to exactly `line`.
 * Shared by CodeLines and MarkdownView; not part of the package's API.
 * `keyPrefix` keeps the keys unique when several lines share one parent.
 */
export function codePieces(line: string, parts: readonly CodeSegment[] | undefined, keyPrefix = ''): ReactNode[] {
  const pieces = matching(line, parts)
  if (pieces === undefined) return [line]
  return pieces.map((part, j) =>
    part.kind === undefined ? (
      part.text
    ) : (
      <span key={`${keyPrefix}${String(j)}`} className={segmentClass} data-kind={part.kind}>
        {part.text}
      </span>
    ),
  )
}

function LineRow({ number, text, parts }: { number: number; text: string; parts: readonly CodeSegment[] | undefined }) {
  return (
    <>
      <LineNumber aria-hidden="true" data-line={number}>
        {number}
      </LineNumber>
      {/* The line break keeps blank lines when the code is copied; at the end of the cell it draws no extra line. */}
      <LineText>{[...codePieces(text, parts), '\n']}</LineText>
    </>
  )
}
