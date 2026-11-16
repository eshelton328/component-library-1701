import type { ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { pageHeader, type PageHeaderVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'

const { withProvider, withContext } = createSlotRecipeContext(pageHeader)
const Root = withProvider('div', 'root')
const Title1 = withContext('h1', 'title')
const Title2 = withContext('h2', 'title')
const Title3 = withContext('h3', 'title')
const Count = withContext('span', 'count')
const CountLabel = withContext('span', 'countLabel')
const Actions = withContext('div', 'actions')

export type PageHeaderProps = Scalar<PageHeaderVariantProps> & {
  /** The page or pane title, such as "Inbox". */
  title: string
  /** The number shown after the title, such as the number of tasks. */
  count?: number | string | undefined
  /** What a screen reader reads for the count, such as "7 tasks". The count alone is read when not set. */
  countLabel?: string | undefined
  /** The heading level of the title; 1 when not set. A list pane inside a page uses 2. */
  level?: 1 | 2 | 3 | undefined
  /** The actions at the end of the row: buttons, a `ViewSwitch`, a `StatusPill` or a found status. */
  children?: ReactNode
}

/**
 * The header of a page or a list pane: the title, an optional count and the
 * page's actions at the end of the row. `size` picks the title style:
 * `pane` (15), `page` (20, the default) or `phone` (28).
 */
export function PageHeader({ title, count, countLabel, level = 1, size, children }: PageHeaderProps) {
  const Title = level === 1 ? Title1 : level === 2 ? Title2 : Title3
  const hasCount = count !== undefined && count !== ''
  return (
    <Root size={size}>
      <Title>{title}</Title>
      {hasCount ? <Count aria-hidden={countLabel === undefined ? undefined : true}>{count}</Count> : null}
      {hasCount && countLabel !== undefined ? <CountLabel>{countLabel}</CountLabel> : null}
      {children === undefined || children === null ? null : <Actions>{children}</Actions>}
    </Root>
  )
}
