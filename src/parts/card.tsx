import type { ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { card } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(card)
const Root = withProvider('article', 'root')
const Media = withContext('div', 'media')
const Body = withContext('div', 'body')
const Header = withContext('div', 'header')
const Leading = withContext('div', 'leading')
const Heading = withContext('div', 'heading')
const TitleRow = withContext('div', 'titleRow')
const Title = withContext('h3', 'title')
const Action = withContext('button', 'action')
const Badge = withContext('div', 'badge')
const Subtitle = withContext('p', 'subtitle')
const Description = withContext('p', 'description')
const Meta = withContext('div', 'meta')

export type CardProps = {
  /** The title, on one line; a long title ends with an ellipsis. */
  title: string
  /** A picture on top of the card, such as an artifact thumbnail. It takes the card's width. */
  media?: ReactNode
  /** An element before the title, such as a kind tile. */
  leading?: ReactNode
  /** An element after the title, such as a `StatusPill` that says New. */
  badge?: ReactNode
  /** A line under the title, such as a path. */
  subtitle?: string | undefined
  /** One line of description; a long one ends with an ellipsis. */
  description?: string | undefined
  /** The meta row at the end, such as a kind, an age or counts. */
  meta?: ReactNode
  /** Called when the card is clicked, or its title button is pressed. Without it the card is not interactive. */
  onSelect?: (() => void) | undefined
}

/**
 * A card for one item in a grid: an artifact with its thumbnail
 * (`media`), or a toolkit item with its kind tile (`leading`). With
 * `onSelect`, the title is a button and a click anywhere on the card
 * presses it.
 */
export function Card({ title, media, leading, badge, subtitle, description, meta, onSelect }: CardProps) {
  const hasMedia = media !== undefined && media !== null
  return (
    <Root media={hasMedia}>
      {hasMedia ? <Media>{media}</Media> : null}
      <Body>
        <Header>
          {leading === undefined ? null : <Leading>{leading}</Leading>}
          <Heading>
            <TitleRow>
              <Title>
                {onSelect === undefined ? (
                  title
                ) : (
                  <Action type="button" onClick={onSelect}>
                    {title}
                  </Action>
                )}
              </Title>
              {badge === undefined ? null : <Badge>{badge}</Badge>}
            </TitleRow>
            {subtitle === undefined ? null : <Subtitle>{subtitle}</Subtitle>}
          </Heading>
        </Header>
        {description === undefined ? null : <Description>{description}</Description>}
        {meta === undefined ? null : <Meta>{meta}</Meta>}
      </Body>
    </Root>
  )
}
