import { useId, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { callout, type CalloutVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'
import { BulbIcon, InfoIcon, ReportIcon, StopSignIcon, WarningIcon } from '../foundations/icons'

const { withProvider, withContext } = createSlotRecipeContext(callout)
const Root = withProvider('div', 'root')
const Header = withContext('div', 'header')
const Title = withContext('p', 'title')
const Body = withContext('div', 'body')

/** The kind of a callout, as GitHub's alert syntax names it: `note`, `tip`, `important`, `warning` or `caution`. */
export type CalloutTone = NonNullable<CalloutProps['tone']>

const defaultTitle = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
} as const satisfies Record<CalloutTone, string>

function ToneIcon({ tone }: { tone: CalloutTone }) {
  switch (tone) {
    case 'note':
      return <InfoIcon size="16" />
    case 'tip':
      return <BulbIcon size="16" />
    case 'important':
      return <ReportIcon size="16" />
    case 'warning':
      return <WarningIcon size="16" />
    case 'caution':
      return <StopSignIcon size="16" />
  }
}

export type CalloutProps = Scalar<CalloutVariantProps> & {
  /** The title after the icon. Defaults to the tone's name: "Note", "Tip", "Important", "Warning" or "Caution". */
  title?: string | undefined
  /** The content, such as the paragraphs of a Markdown alert. */
  children?: ReactNode
}

/**
 * A box that stands out from the text round it, as GitHub draws an alert
 * (`> [!NOTE]`) in Markdown: a 1 px border, an icon and a title in the
 * tone's colour, and the content under them. `tone` is `note` (cyan, the
 * default), `tip` (green), `important` (violet), `warning` (amber) or
 * `caution` (red). The icon is hidden from assistive technology; the box is
 * a note named by its title. `size` matches the MarkdownView it sits in:
 * `md` (the default) or `sm`. The title wraps; it is never cut.
 */
export function Callout({ tone = 'note', size, title, children }: CalloutProps) {
  const titleId = useId()
  return (
    <Root tone={tone} size={size} role="note" aria-labelledby={titleId}>
      <Header>
        <ToneIcon tone={tone} />
        <Title id={titleId}>{title === undefined || title.trim() === '' ? defaultTitle[tone] : title}</Title>
      </Header>
      {children === undefined || children === null ? null : <Body>{children}</Body>}
    </Root>
  )
}
