import { type MouseEvent, type ReactNode, useRef } from 'react'
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
const Trailing = withContext('div', 'trailing')

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
  /** An element after the title, such as a `StatusPill` that says New. `badgePosition` sets where it sits. */
  badge?: ReactNode
  /**
   * Where `badge` sits in the title row. `title`, the default, puts it 8
   * after the title. `end` puts it at the right end of the title row, as
   * the Artifacts card's New (D1 402:15454): the title takes the free
   * width, and a long one is cut with its tooltip, 8 before the badge.
   */
  badgePosition?: 'title' | 'end' | undefined
  /** A line under the title, such as a path; a long one ends with an ellipsis and shows in full in a tooltip. */
  subtitle?: string | undefined
  /** One line of description; a long one ends with an ellipsis and shows in full in a tooltip. */
  description?: string | undefined
  /** The meta row at the end, such as a kind, an age or counts. */
  meta?: ReactNode
  /**
   * A part at the end of the header row, centred down it, such as the
   * counts `→0 ←1` of a Toolkit tablet row (T1 428:67). The title and
   * subtitle take the free width, so the part ends the row; it draws in
   * `mono` and `fg.muted`, as the meta row. Without it the header ends
   * with the title.
   */
  trailing?: ReactNode
  /**
   * The inset of a card without media. `default` pads 16 inside the
   * border. `compact` pads 10 above and below and 12 at the sides, so a
   * card with a kind tile, a title and a subtitle is a 60 px row with the
   * tile 13 in, as the Toolkit tablet row (T1 428:59). A card with
   * `media` keeps its own body.
   */
  padding?: 'default' | 'compact' | undefined
  /**
   * Puts 24 more above the meta row, so it sits 34 under the description,
   * as the Toolkit card's spacer does (D1 425:86): with a kind tile, a
   * title, a subtitle, a description and the meta the card is 148 high.
   * Off by default, which keeps the meta 10 under the description.
   */
  metaSpacer?: boolean | undefined
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
export function Card({ title, media, leading, badge, badgePosition = 'title', subtitle, description, meta, trailing, padding = 'default', metaSpacer = false, onSelect }: CardProps) {
  const hasMedia = shown(media)
  // A card with onSelect owns its cut description: a hover on the card, or the keyboard focus on its title button,
  // opens its tooltip, and it takes no tab stop of its own. The subtitle keeps its own, so one hover opens one tip.
  const rootRef = useRef<HTMLElement>(null)
  const owner = onSelect === undefined ? undefined : rootRef
  // The card handles the click, so a click on any part of it selects it, even on a positioned child that paints
  // over the title button's hit area. Enter or Space on the title button fires a click that bubbles here too. A
  // click on another control inside the card is left to that control.
  const select = (event: MouseEvent<HTMLElement>) => {
    if (onSelect === undefined || !(event.target instanceof Element)) return
    const control = event.target.closest(INTERACTIVE)
    // Cut text with its own tab stop (a TruncatedText) is no control: a click on it selects the card.
    const ownControl = control !== null && control !== event.currentTarget && !control.classList.contains('card__action') && !control.classList.contains('truncated-text')
    if (ownControl) return
    onSelect()
  }
  return (
    <Root ref={rootRef} media={hasMedia} padding={padding} metaSpacer={metaSpacer} badgePosition={badgePosition} onClick={onSelect === undefined ? undefined : select}>
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
                    {/* Above the title, so its tip never covers the description's tip below the description. */}
                    <TruncatedText placement={description === undefined || description === '' ? 'bottom' : 'top'}>{title}</TruncatedText>
                  </Action>
                )}
              </Title>
              {shown(badge) ? <Badge>{badge}</Badge> : null}
            </TitleRow>
            {subtitle === undefined || subtitle === '' ? null : (
              <Subtitle>
                <TruncatedText>{subtitle}</TruncatedText>
              </Subtitle>
            )}
          </Heading>
          {shown(trailing) ? <Trailing>{trailing}</Trailing> : null}
        </Header>
        {description === undefined || description === '' ? null : (
          <Description>
            <TruncatedText owner={owner}>{description}</TruncatedText>
          </Description>
        )}
        {shown(meta) ? <Meta>{meta}</Meta> : null}
      </Body>
    </Root>
  )
}
