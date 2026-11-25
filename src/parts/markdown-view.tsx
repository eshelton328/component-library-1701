import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { styled } from '../../styled-system/jsx'
import { markdownView, type MarkdownViewVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'
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
   * `li`, `strong`, `code`, `pre` and `a`, and from GFM `del` and task list
   * items (`li.task-list-item` with a disabled checkbox `input`). The view
   * styles these elements; it parses no Markdown itself. Render a GFM table
   * with the Table part (`Table`, `TableHead`, `TableBody`, `TableRow`,
   * `TableHeaderCell`, `TableCell`).
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
  /** The text size: `md` (the default) for `body` and `label`, `sm` for `bodySm` and `labelSm`, as the Inbox detail draws them. */
  size?: Scalar<MarkdownViewVariantProps>['size']
  /** `default` pads the text 20 by 24, as the Toolkit file preview does; `none` draws it flush, for a box that sets its own padding, such as an Inbox detail section. */
  padding?: Scalar<MarkdownViewVariantProps>['padding']
  /**
   * `plain` (the default) draws inline code in the `code` style with no fill, as the Toolkit file preview does;
   * `badge` draws it as a mono badge on a tint, as a chat's text does. Code in a block never takes the badge.
   */
  inlineCode?: Scalar<MarkdownViewVariantProps>['inlineCode']
}

/**
 * Rendered Markdown, such as a skill's SKILL.md in the Toolkit file
 * preview. The blocks are 10 apart: a title for `h1`, a label for the
 * other headings, muted body text, lists with their markers inside the
 * text column, and code in the `code` style. Pass `highlight` to colour
 * the code in fenced blocks. `size="sm"` draws the body text in `bodySm`
 * and the subheadings in `labelSm`, as the Inbox detail does; the default
 * (`md`) keeps `body` and `label`. `padding="none"` drops the view's own
 * padding, so the text lines up with the box around it.
 */
export function MarkdownView({ children, highlight, size, padding, inlineCode }: MarkdownViewProps) {
  return <Root size={size} padding={padding} inlineCode={inlineCode}>{highlight === undefined ? children : highlightFences(children, highlight)}</Root>
}

type WithChildren = { children?: ReactNode }

// Walks the element tree and colours each fenced block. It returns the same
// node when nothing in it changed, and clones an element only to give it new
// children of the same shape: a single child stays single, so a component
// that calls `Children.only` still works.
function highlightFences(node: ReactNode, highlight: MarkdownHighlight): ReactNode {
  if (Array.isArray(node)) {
    const items: readonly ReactNode[] = node
    const next = items.map((item) => highlightFences(item, highlight))
    return next.some((item, i) => item !== items[i]) ? next : items
  }
  if (!isValidElement<WithChildren>(node)) return node
  if (node.type === 'pre') {
    const fenced = highlightFence(node, highlight)
    if (fenced !== undefined) return fenced
  }
  const children = node.props.children
  if (children === undefined) return node
  const next = highlightFences(children, highlight)
  return next === children ? node : cloneElement(node, undefined, next)
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
  // Keys carry the line number, so pieces of different lines never share one.
  const pieces = lines.flatMap((line, i) => [...codePieces(line, segments[i], `${String(i)}:`), i < lines.length - 1 ? '\n' : ''])
  if (body !== text) pieces.push('\n')
  return cloneElement(pre, undefined, cloneElement(code, undefined, pieces))
}
