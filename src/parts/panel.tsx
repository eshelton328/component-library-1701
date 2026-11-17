import { useId, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { panel, type PanelVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'
import { TruncatedText } from '../controls/tooltip'

const { withProvider, withContext } = createSlotRecipeContext(panel)
const Root = withProvider('section', 'root')
const Header = withContext('div', 'header')
const Title = withContext('h2', 'title')
const Meta = withContext('span', 'meta')
const Actions = withContext('div', 'actions')
const Body = withContext('div', 'body')

// A slot given as `false`, `null` or an empty string (`canEdit && <Button />`) is left out, as React leaves it out.
const shown = (node: ReactNode) => node !== undefined && node !== null && typeof node !== 'boolean' && node !== ''

export type PanelProps = Scalar<PanelVariantProps> & {
  /**
   * The title in the header, on one line; a long title ends with an ellipsis and shows in full in a tooltip. It names
   * the panel for assistive technology. Leave it out for a panel with no header.
   */
  title?: string | undefined
  /** Text after the title, such as a count ("7") or a note. `0` shows; `false`, `null` and `''` leave it out. */
  meta?: ReactNode
  /** Controls at the end of the header, such as an icon button or a link. */
  actions?: ReactNode
  /** The content, such as list rows. It scrolls when the panel is shorter than it. */
  children?: ReactNode
}

/**
 * The bordered glass box that holds a list or side content, with an
 * optional header. `variant` picks the build: `list` (the Inbox list pane),
 * `sidebar` (the Workbench sidebar) or `section` (a Toolkit panel with an
 * eyebrow title, the default). A `list` or `sidebar` panel fills the
 * height of its parent and its body scrolls; a `section` panel is as tall
 * as its content. `tone="needsYou"` gives it the needs-you border and
 * tint, for a box that waits for the user; `tone="accent"` the cyan border
 * and selected fill of a running item, such as the Inbox run card.
 */
export function Panel({ title, meta, actions, children, variant, tone }: PanelProps) {
  const titleId = useId()
  const hasTitle = title !== undefined && title !== ''
  const hasMeta = shown(meta)
  const hasActions = shown(actions)
  return (
    <Root variant={variant} tone={tone} {...(hasTitle ? { 'aria-labelledby': titleId } : {})}>
      {hasTitle || hasMeta || hasActions ? (
        <Header>
          {hasTitle ? <Title id={titleId}>
              <TruncatedText>{title}</TruncatedText>
            </Title> : null}
          {hasMeta ? <Meta>{meta}</Meta> : null}
          {hasActions ? <Actions>{actions}</Actions> : null}
        </Header>
      ) : null}
      <Body>{children}</Body>
    </Root>
  )
}
