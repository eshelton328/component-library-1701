import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { styled } from '../../styled-system/jsx'
import { markdownView } from '../../styled-system/recipes'
import { codePieces, type CodeSegment } from './code-lines'

const Root = styled('div', markdownView)

/**
 * Splits a fenced code block into syntax-coloured pieces. It gets the
 * block's code and the fence's language label (`ts` for a fence opened with three backticks and `ts`),
 * and returns, for each line of the code, its text split into pieces, in
 * order. Return `undefined` to draw the block plain.
 */
export type MarkdownHighlight = (code: string, lang: string | undefined) => readonly (readonly CodeSegment[] | undefined)[] | undefined

export type MarkdownViewProps = {
  /**
   * The rendered Markdown as React elements: `h1` to `h6`, `p`, `ul`, `ol`,
   * `li`, `strong`, `code`, `pre` and `a`. The view styles these elements;
   * it parses no Markdown itself.
   */
  children: ReactNode
  /**
   * Syntax colours for fenced code blocks. A fenced block is a `pre` element
   * whose only child is a `code` element holding text, the shape Markdown
   * renderers such as react-markdown write; its language label comes from
   * the `language-<lang>` class on `code`. The view calls `highlight` with
   * the block's code (one final line break left out) and that label, and
   * colours each line with the same `code.*` colours as CodeLines. A line
   * with no entry, or whose pieces do not join to exactly its text, is drawn
   * plain, so the copied text is always the original code. The view does
   * not parse code; the caller's highlighter splits it.
   */
  highlight?: MarkdownHighlight | undefined
}

/**
 * Rendered Markdown, such as a skill's SKILL.md in the Toolkit file
 * preview. The blocks are 10 apart: a title for `h1`, a label for the
 * other headings, muted body text, lists with their markers inside the
 * text column, and code in the `code` style. Pass `highlight` to colour
 * the code in fenced blocks.
 */
export function MarkdownView({ children, highlight }: MarkdownViewProps) {
  return <Root>{highlight === undefined ? children : highlightFences(children, highlight)}</Root>
}

type WithChildren = { children?: ReactNode }

// Walks the element tree and colours each fenced block. Other elements keep their props.
function highlightFences(node: ReactNode, highlight: MarkdownHighlight): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement<WithChildren>(child)) return child
    if (child.type === 'pre') {
      const fenced = highlightFence(child, highlight)
      if (fenced !== undefined) return fenced
    }
    if (child.props.children === undefined) return child
    return cloneElement(child, undefined, highlightFences(child.props.children, highlight))
  })
}

function highlightFence(pre: ReactElement<WithChildren>, highlight: MarkdownHighlight): ReactNode {
  const inner = Children.toArray(pre.props.children)
  const [code] = inner
  if (inner.length !== 1 || !isValidElement<WithChildren & { className?: unknown }>(code) || code.type !== 'code') return undefined
  const texts = Children.toArray(code.props.children)
  if (!texts.every((t) => typeof t === 'string')) return undefined
  const text = texts.join('')
  const className = code.props.className
  const lang = typeof className === 'string' ? /(?:^|\s)language-(\S+)/.exec(className)?.[1] : undefined
  const body = text.endsWith('\n') ? text.slice(0, -1) : text
  const segments = highlight(body, lang)
  if (segments === undefined) return undefined
  const lines = body.split('\n')
  const pieces = lines.flatMap((line, i) => [...codePieces(line, segments[i]), i < lines.length - 1 ? '\n' : ''])
  if (body !== text) pieces.push('\n')
  return cloneElement(pre, undefined, cloneElement(code, undefined, ...pieces))
}
