import { useId, useState, type ReactNode, type Ref } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { errorState, type ErrorStateVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'
import { ChevronDownIcon, ChevronRightIcon, CompassIcon, WarningIcon, type IconSize } from '../foundations/icons'

const { withProvider, withContext } = createSlotRecipeContext(errorState)
const Root = withProvider('div', 'root')
const Content = withContext('div', 'content')
const Tile = withContext('span', 'tile')
const Text = withContext('div', 'text')
const Title1 = withContext('h1', 'title')
const Title2 = withContext('h2', 'title')
const Title3 = withContext('h3', 'title')
const Title4 = withContext('h4', 'title')
const TitleText = withContext('p', 'title')
const Description = withContext('div', 'description')
const Actions = withContext('div', 'actions')
const Details = withContext('div', 'details')
const Toggle = withContext('button', 'toggle')
const Trace = withContext('pre', 'stack')

// A slot given as `false`, `null` or an empty string (`canRetry && <Button />`) is left out, as React leaves it out.
const shown = (node: ReactNode) => node !== undefined && node !== null && typeof node !== 'boolean' && node !== ''

type Size = NonNullable<ErrorStateVariantProps['size']>

const iconSizes: Record<Size, IconSize> = { page: '24', pane: '20', inline: '16' }

export type ErrorStateProps = Scalar<ErrorStateVariantProps> & {
  /** What went wrong, such as "Something went wrong" or "Page not found". It wraps; it is never cut. */
  title: string
  /** A line or two under the title: what happened and what the user can do. It wraps. */
  description?: ReactNode
  /** The buttons, such as `<Button variant="primary">Try again</Button>` and "Reload app" or "Go to Inbox". */
  actions?: ReactNode
  /**
   * An icon from the icon set in place of the tone's own: `WarningIcon` for `danger`, `CompassIcon` for `neutral`.
   * The state sizes it.
   */
  icon?: ReactNode
  /**
   * The error message or stack, shown in a mono block behind a toggle that starts closed. Pass it in dev builds
   * only; leave it out for users.
   */
  details?: string | undefined
  /** The label of the details toggle. Defaults to "Error details". */
  detailsLabel?: string | undefined
  /** Whether the details are open, for a controlled state. Pair it with `onDetailsOpenChange`. */
  detailsOpen?: boolean | undefined
  /** Whether the details start open, for an uncontrolled state. Defaults to `false`. */
  defaultDetailsOpen?: boolean | undefined
  /** Called with the new state when the user opens or closes the details. */
  onDetailsOpenChange?: ((open: boolean) => void) | undefined
  /**
   * The heading level of the title in a `page` (1 when not set) or a `pane` (2 when not set). An `inline` state
   * has no heading; its title is text.
   */
  level?: 1 | 2 | 3 | 4 | undefined
  /** A ref to the title heading of a `page` or `pane`, so the app can move focus to it. The heading takes focus from script only. */
  headingRef?: Ref<HTMLHeadingElement> | undefined
}

/**
 * The state shown in place of content that failed or was not found.
 * `size` picks the build: `page` (a crash or not-found screen, centred in
 * the space it gets, the default), `pane` (the same, compact, for a pane)
 * or `inline` (one row for a block that failed). `tone` picks the colour:
 * `danger` (an error, the default) or `neutral` (not found).
 *
 * A `page` renders its title as a heading at `level` and no live region:
 * the app moves focus to the heading (`headingRef`). A `pane` or an
 * `inline` state is an alert (`role="alert"`), so it is read out when it
 * appears. The buttons in `actions` call their own handlers; the state
 * does nothing itself (d-068, d-069).
 */
export function ErrorState({
  size = 'page',
  tone = 'danger',
  title,
  description,
  actions,
  icon,
  details,
  detailsLabel = 'Error details',
  detailsOpen,
  defaultDetailsOpen = false,
  onDetailsOpenChange,
  level,
  headingRef,
}: ErrorStateProps) {
  const stackId = useId()
  const [ownOpen, setOwnOpen] = useState(defaultDetailsOpen)
  const open = detailsOpen ?? ownOpen
  const toggle = () => {
    const next = !open
    if (detailsOpen === undefined) setOwnOpen(next)
    onDetailsOpenChange?.(next)
  }
  const Default = tone === 'neutral' ? CompassIcon : WarningIcon
  const hasDetails = details !== undefined && details !== ''
  return (
    <Root size={size} tone={tone} role={size === 'page' ? undefined : 'alert'} data-size={size} data-tone={tone}>
      <Content>
        <Tile aria-hidden="true">{shown(icon) ? icon : <Default size={iconSizes[size]} />}</Tile>
        <Text>
          <Title size={size} level={level} headingRef={headingRef}>
            {title}
          </Title>
          {shown(description) ? <Description>{description}</Description> : null}
        </Text>
        {shown(actions) ? <Actions>{actions}</Actions> : null}
      </Content>
      {hasDetails ? (
        <Details>
          <Toggle type="button" aria-expanded={open} aria-controls={stackId} onClick={toggle}>
            {open ? <ChevronDownIcon size="12" /> : <ChevronRightIcon size="12" />}
            {detailsLabel}
          </Toggle>
          <Trace id={stackId} hidden={!open}>
            <code>{details}</code>
          </Trace>
        </Details>
      ) : null}
    </Root>
  )
}

type TitleProps = {
  size: Size
  level: 1 | 2 | 3 | 4 | undefined
  headingRef: Ref<HTMLHeadingElement> | undefined
  children: string
}

function Title({ size, level, headingRef, children }: TitleProps) {
  if (size === 'inline') return <TitleText>{children}</TitleText>
  const heading = level ?? (size === 'page' ? 1 : 2)
  const Heading = heading === 1 ? Title1 : heading === 2 ? Title2 : heading === 3 ? Title3 : Title4
  return (
    <Heading ref={headingRef} tabIndex={-1}>
      {children}
    </Heading>
  )
}
