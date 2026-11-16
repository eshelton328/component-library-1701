import type { MouseEvent, ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { card } from '../../styled-system/recipes'
import { TruncatedText } from '../controls/tooltip'

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

// A slot given as `false`, `null` or an empty string (`hasThumbnail && <img />`) is left out, as React leaves it out.
const shown = (node: ReactNode) => node !== undefined && node !== null && typeof node !== 'boolean' && node !== ''

// The controls that keep their own click inside a card, such as a link in the meta row.
const INTERACTIVE = 'a[href], button, input, select, textarea, summary, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])'

export type CardProps = {
  /** The title, on one line; a long title ends with an ellipsis and shows in full in a tooltip. */
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
  /**
   * Called when the card is clicked, or its title button is pressed. A click on a control inside the card, such as a
   * link in `meta`, is left to that control. Without `onSelect` the card is not interactive.
   */
  onSelect?: (() => void) | undefined
}

/**
 * A card for one item in a grid: an artifact with its thumbnail
 * (`media`), or a toolkit item with its kind tile (`leading`). With
 * `onSelect`, the title is a button and a click anywhere on the card
 * presses it.
 */
export function Card({ title, media, leading, badge, subtitle, description, meta, onSelect }: CardProps) {
  const hasMedia = shown(media)
  // The card handles the click, so a click on any part of it selects it, even on a positioned child that paints
  // over the title button's hit area. Enter or Space on the title button fires a click that bubbles here too. A
  // click on another control inside the card is left to that control.
  const select = (event: MouseEvent<HTMLElement>) => {
    if (onSelect === undefined || !(event.target instanceof Element)) return
    const control = event.target.closest(INTERACTIVE)
    if (control !== null && control !== event.currentTarget && !control.classList.contains('card__action')) return
    onSelect()
  }
  return (
    <Root media={hasMedia} onClick={onSelect === undefined ? undefined : select}>
      {hasMedia ? <Media>{media}</Media> : null}
      <Body>
        <Header>
          {shown(leading) ? <Leading>{leading}</Leading> : null}
          <Heading>
            <TitleRow>
              <Title>
                {onSelect === undefined ? (
                  <TruncatedText>{title}</TruncatedText>
                ) : (
                  <Action type="button">
                    <TruncatedText>{title}</TruncatedText>
                  </Action>
                )}
              </Title>
              {shown(badge) ? <Badge>{badge}</Badge> : null}
            </TitleRow>
            {subtitle === undefined || subtitle === '' ? null : <Subtitle>{subtitle}</Subtitle>}
          </Heading>
        </Header>
        {description === undefined || description === '' ? null : <Description>{description}</Description>}
        {shown(meta) ? <Meta>{meta}</Meta> : null}
      </Body>
    </Root>
  )
}
