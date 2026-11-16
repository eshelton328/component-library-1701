import { useId, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { panel, type PanelVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'

const { withProvider, withContext } = createSlotRecipeContext(panel)
const Root = withProvider('section', 'root')
const Header = withContext('div', 'header')
const Title = withContext('h2', 'title')
const Meta = withContext('span', 'meta')
const Actions = withContext('div', 'actions')
const Body = withContext('div', 'body')

export type PanelProps = Scalar<PanelVariantProps> & {
  /** The title in the header. It names the panel for assistive technology. Leave it out for a panel with no header. */
  title?: string | undefined
  /** Text after the title, such as a count ("7") or a note. */
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
 * as its content.
 */
export function Panel({ title, meta, actions, children, variant }: PanelProps) {
  const titleId = useId()
  const hasHeader = title !== undefined || meta !== undefined || actions !== undefined
  return (
    <Root variant={variant} {...(title === undefined ? {} : { 'aria-labelledby': titleId })}>
      {hasHeader ? (
        <Header>
          {title === undefined ? null : <Title id={titleId}>{title}</Title>}
          {meta === undefined ? null : <Meta>{meta}</Meta>}
          {actions === undefined ? null : <Actions>{actions}</Actions>}
        </Header>
      ) : null}
      <Body>{children}</Body>
    </Root>
  )
}
