import type { ReactNode } from 'react'
import { styled } from '../../styled-system/jsx'
import { markdownView } from '../../styled-system/recipes'

const Root = styled('div', markdownView)

export type MarkdownViewProps = {
  /**
   * The rendered Markdown as React elements: `h1` to `h6`, `p`, `ul`, `ol`,
   * `li`, `strong`, `code`, `pre` and `a`. The view styles these elements;
   * it parses no Markdown itself.
   */
  children: ReactNode
}

/**
 * Rendered Markdown, such as a skill's SKILL.md in the Toolkit file
 * preview. The blocks are 10 apart: a title for `h1`, a label for the
 * other headings, muted body text, lists with their markers inside the
 * text column, and code in the `code` style.
 */
export function MarkdownView({ children }: MarkdownViewProps) {
  return <Root>{children}</Root>
}
