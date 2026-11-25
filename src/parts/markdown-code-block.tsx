import { useEffect, useRef, useState } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { markdownCodeBlock } from '../../styled-system/recipes'
import { Button } from '../controls/button'
import { CopyIcon } from '../foundations/icons'
import { codePieces, type CodeSegment } from './code-lines'

const { withProvider, withContext } = createSlotRecipeContext(markdownCodeBlock)
const Root = withProvider('div', 'root')
const Head = withContext('div', 'head')
const Label = withContext('span', 'label')
const Status = withContext('span', 'status')
const Body = withContext('pre', 'body')
const Code = withContext('code', 'code')
const Line = withContext('span', 'line')
const Foot = withContext('div', 'foot')

/** How long "Copied" or "Copy failed" shows after a copy, in milliseconds. */
const statusMs = 2000

/** A diff line's change: `added` for a line that starts with "+", `removed` with "-". */
export type DiffChange = 'added' | 'removed'

// The lines a diff starts with before its first change: git's header lines and the file names.
const headerLine = /^(diff |index |--- |\+\+\+ |new file|deleted file|similarity |rename |old mode|new mode)/

/**
 * The change of each line of a diff: `added` for a line that starts with "+", `removed` with "-", undefined for a
 * context line or a header. Headers ("--- a/x", "+++ b/x", "diff --git …") are only the lines before the first hunk
 * ("@@"), or with no hunk the leading run of header lines, so a changed line such as "+++count" or "---x" in a hunk
 * stays a change.
 */
export function diffChanges(lines: readonly string[]): (DiffChange | undefined)[] {
  const hunk = lines.findIndex((l) => l.startsWith('@@'))
  let lead = 0
  while (lead < lines.length && headerLine.test(lines[lead] ?? '')) lead++
  const headers = hunk === -1 ? lead : hunk
  return lines.map((line, i) => {
    if (i < headers && headerLine.test(line)) return undefined
    if (line.startsWith('+')) return 'added'
    if (line.startsWith('-')) return 'removed'
    return undefined
  })
}

export type MarkdownCodeBlockProps = {
  /** The block's code, as the fence holds it, with no final line break. */
  code: string
  /** The fence's language label, such as `ts`; the head shows it. None for a fence with no label. */
  language?: string | undefined
  /**
   * Syntax colours: for each line of `code`, its text split into pieces, in
   * order, as CodeLines takes them. A line with no entry, or whose pieces do
   * not join to exactly its text, is drawn plain. The part parses no code.
   */
  segments?: readonly (readonly CodeSegment[] | undefined)[] | undefined
  /**
   * Draws the code as a diff: a line that starts with "+" takes the added
   * tint and colour, one with "-" the removed ones, its syntax pieces in that colour; context lines keep theirs.
   * Defaults to `true` when `language` is `diff` or `patch`.
   */
  diff?: boolean | undefined
  /**
   * Copies the code, such as to the clipboard, and resolves `true` when it
   * did. The head then shows a copy button, and "Copied" or "Copy failed"
   * for 2 s after a press. No button when not set.
   */
  onCopy?: ((code: string) => Promise<boolean>) | undefined
  /**
   * The lines a long block shows before "Show all": a block with more than
   * this many lines and 5 shows the first ones and a foot button that shows
   * the rest (and "Show less" after). `false` never folds. Defaults to 20.
   */
  fold?: number | false | undefined
}

/**
 * A fenced code block in rendered Markdown, such as a chat reply's code: a
 * box with the fence's language and a copy button in its head, then the code
 * in the `code` style. Each line stays on one line, and a long one scrolls
 * the body sideways; the body is then a tab stop, so the arrow keys scroll
 * it. `segments` colour the code with the `code.*` tokens, as in CodeLines.
 * A diff tints its added and removed lines. A block longer than `fold`
 * lines shows the first ones and a "Show all" button. The part copies
 * nothing itself: `onCopy` gets the whole code, folded or not. Use it as
 * a react-markdown `pre` override inside a MarkdownView.
 */
export function MarkdownCodeBlock({ code, language, segments, diff, onCopy, fold = 20 }: MarkdownCodeBlockProps) {
  const lines = code.split('\n')
  const [open, setOpen] = useState(false)
  const folds = fold !== false && lines.length > fold + 5
  const shown = folds && !open ? lines.slice(0, fold) : lines
  const isDiff = diff ?? (language === 'diff' || language === 'patch')
  const changes = isDiff ? diffChanges(lines) : []
  const head = language !== undefined || onCopy !== undefined
  return (
    <Root data-language={language}>
      {head ? (
        <Head>
          <Label>{language}</Label>
          {onCopy === undefined ? null : <CopyButton code={code} onCopy={onCopy} />}
        </Head>
      ) : null}
      {/* The body is a tab stop, so the keyboard can scroll a long line into view. */}
      <Body tabIndex={0}>
        <Code>
          {shown.map((line, i) => (
            <Line key={String(i)} data-change={changes[i]}>
              {/* The line break keeps the lines apart when the code is selected and copied. */}
              {[...codePieces(line, segments?.[i], `${String(i)}:`), i < shown.length - 1 ? '\n' : '']}
            </Line>
          ))}
        </Code>
      </Body>
      {folds ? (
        <Foot>
          <Button
            variant="text"
            size="xs"
            touch
            aria-expanded={open}
            onClick={() => {
              setOpen(!open)
            }}
          >
            {open ? 'Show less' : `Show all ${String(lines.length)} lines`}
          </Button>
        </Foot>
      ) : null}
    </Root>
  )
}

type CopyState = 'idle' | 'copied' | 'failed'

function CopyButton({ code, onCopy }: { code: string; onCopy: (code: string) => Promise<boolean> }) {
  const [state, setState] = useState<CopyState>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(
    () => () => {
      clearTimeout(timer.current)
    },
    [],
  )
  const show = (next: CopyState) => {
    clearTimeout(timer.current)
    setState(next)
    timer.current = setTimeout(() => {
      setState('idle')
    }, statusMs)
  }
  return (
    <>
      <Status role="status">{state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : ''}</Status>
      <Button
        variant="text"
        size="xs"
        iconOnly
        touch
        aria-label="Copy code"
        onClick={() => {
          onCopy(code).then(
            (ok) => {
              show(ok ? 'copied' : 'failed')
            },
            () => {
              show('failed')
            },
          )
        }}
      >
        <CopyIcon size="16" />
      </Button>
    </>
  )
}
