import { Fragment, type ReactNode } from 'react'
import { styled } from '../../styled-system/jsx'
import { highlight } from '../../styled-system/recipes'

const Mark = styled('mark', highlight)

export type HighlightProps = {
  /** The whole text, such as a result title. */
  text: string
  /** The search query, or several. Each match of one in `text` is marked. An empty query marks nothing. */
  query: string | readonly string[]
  /** Whether a match ignores case. Defaults to `true`. */
  ignoreCase?: boolean | undefined
  /** `strong` (the default) marks a match in the accent colour, semibold and underlined; `colour` in the accent colour only. */
  variant?: 'strong' | 'colour' | undefined
}

// A regular expression matches the query as plain text, so its special characters are escaped.
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Splits `text` into the pieces that match one of the queries and the pieces between them. */
function highlightParts(text: string, query: string | readonly string[], ignoreCase = true): { text: string; match: boolean }[] {
  const queries = (typeof query === 'string' ? [query] : query).filter((q) => q !== '')
  if (queries.length === 0 || text === '') return text === '' ? [] : [{ text, match: false }]
  // The longest query first, so "eval-round" wins over "eval" where both match.
  const pattern = new RegExp([...queries].sort((a, b) => b.length - a.length).map(escape).join('|'), ignoreCase ? 'gi' : 'g')
  const parts: { text: string; match: boolean }[] = []
  let last = 0
  for (const found of text.matchAll(pattern)) {
    const start = found.index
    if (start > last) parts.push({ text: text.slice(last, start), match: false })
    parts.push({ text: found[0], match: true })
    last = start + found[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), match: false })
  return parts
}

/**
 * A text with each match of a search query marked, as in search results.
 * The marks are `<mark>` elements in the accent colour, semibold and
 * underlined, or in the accent colour only with `variant="colour"`; the rest is plain text that takes its style from where it
 * sits. The text reads the same with or without the marks.
 */
export function Highlight({ text, query, ignoreCase = true, variant }: HighlightProps): ReactNode {
  return highlightParts(text, query, ignoreCase).map((part, index) =>
    part.match ? <Mark key={index} variant={variant}>{part.text}</Mark> : <Fragment key={index}>{part.text}</Fragment>,
  )
}
