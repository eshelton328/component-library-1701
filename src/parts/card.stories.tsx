import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Grid, Inline, Stack } from '../controls/layout'
import { SparkIcon } from '../foundations/icons'
import { Badge } from './badge'
import { Card } from './card'
import { KindMark } from './kind-mark'
import { KindTile } from './kind-tile'
import { MetaLine } from './meta-line'
import { StatusPill } from './status-pill'
import { expectCutText } from '../controls/tooltip.testing'
import { atTextSize, expectGrown, textSizes, textSpills } from '../controls/text-size.testing'

const page = css({ bg: 'bg.canvas', p: '24' })
const column = css({ w: 'shell.sidebar' })
// Stand-ins for the thumbnail and the kind tile, which are parts of their own.
const thumbnail = css({ h: 'shell.tabBar', bg: 'surface.raised' })
const tile = css({ w: 'kindTile.sm', h: 'kindTile.sm', borderRadius: 'md', bg: 'accent.subtle' })
const strong = css({ color: 'fg.default' })
const positioned = css({ position: 'relative' })
const link = css({ position: 'relative', color: 'fg.accent' })
const metaWide = css({ flex: '1', overflow: 'hidden' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  pane: css({ bg: 'surface.pane' }),
  border: css({ bg: 'border.default' }),
  text: css({ bg: 'fg.default' }),
  muted: css({ bg: 'fg.muted' }),
  focus: css({ bg: 'border.focus' }),
}

const artifact = (onSelect?: () => void) => (
  <Card
    title="Hono server spike"
    media={<div className={thumbnail} />}
    badge={<StatusPill label="New" tone="working" />}
    description="A small Hono server that serves the bridge API to the prototype"
    meta={
      <>
        <span>ui</span>
        <span>40m</span>
      </>
    }
    onSelect={onSelect}
  />
)

const toolkit = (onSelect?: () => void) => (
  <Card
    title="agents-md"
    leading={<span className={tile} />}
    subtitle="toolkit/skills/agents-md"
    description="Writes and audits the AGENTS.md context files of a repo"
    meta={
      <>
        <span className={strong}>3 links in</span>
        <span>5 files</span>
      </>
    }
    onSelect={onSelect}
  />
)

function Cards() {
  return (
    <main className={page}>
      <Grid columns="2" gap="24">
        <div className={column} data-testid="artifact">
          {artifact()}
        </div>
        <div className={column} data-testid="toolkit">
          {toolkit()}
        </div>
        <div className={column} data-testid="empty-slots">
          <Card title="Empty slots" media={false} leading={null} badge="" description="Slots set to nothing" meta={null} />
        </div>
        <div className={column} data-testid="long">
          <Card title="A very long artifact title that does not fit on one line of the card" description="Short" />
        </div>
      </Grid>
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const find = (root: Element, selector: string) => {
  const el = root.querySelector(selector)
  if (!(el instanceof HTMLElement)) throw new Error(`no ${selector}`)
  return el
}

// The element a pointer at the centre of `el` would hit, so a click goes where a real one would.
const hit = (el: HTMLElement) => {
  const r = el.getBoundingClientRect()
  const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
  if (!(top instanceof HTMLElement)) throw new Error('nothing at the point')
  return top
}

const meta = {
  title: 'Data display/Card',
  component: Cards,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const swatch = (name: string) => getComputedStyle(find(canvasElement, `[data-swatch="${name}"]`)).backgroundColor
    const artifactCard = find(canvasElement, '[data-testid="artifact"] article')
    const toolkitCard = find(canvasElement, '[data-testid="toolkit"] article')
    for (const c of [artifactCard, toolkitCard]) {
      const s = getComputedStyle(c)
      // surface.pane, a 1 px border.default border, a 10 px radius.
      await expect(s.backgroundColor).toBe(swatch('pane'))
      await expect([s.borderTopWidth, s.borderTopColor]).toEqual(['1px', swatch('border')])
      await expect(s.borderTopLeftRadius).toBe('10px')
      // The title is a level 3 heading in the label style.
      const title = getComputedStyle(find(c, '.card__title'))
      await expect([title.fontSize, Math.round(Number.parseFloat(title.lineHeight)), title.fontWeight, title.color]).toEqual(['14px', 20, '500', swatch('text')])
      const description = getComputedStyle(find(c, '.card__description'))
      await expect([description.fontSize, description.color, description.marginTop]).toEqual(['12px', swatch('muted'), '0px'])
      const metaRow = getComputedStyle(find(c, '.card__meta'))
      await expect([metaRow.fontSize, metaRow.color]).toEqual(['12px', swatch('muted')])
      await expect(metaRow.fontFamily).toContain('Mono')
    }
    await expect(canvas.getByRole('heading', { level: 3, name: 'Hono server spike' })).toBeVisible()
    // The artifact card: the thumbnail fills the top edge to edge; the body is 12 × 16 × 16 with a 4 px gap.
    const media = find(artifactCard, '.card__media')
    await expect(media.getBoundingClientRect().width).toBe(artifactCard.clientWidth)
    await expect(media.getBoundingClientRect().top - artifactCard.getBoundingClientRect().top).toBe(1)
    const body = getComputedStyle(find(artifactCard, '.card__body'))
    await expect([body.paddingTop, body.paddingRight, body.paddingBottom, body.paddingLeft, body.rowGap]).toEqual(['12px', '16px', '16px', '16px', '4px'])
    await expect(getComputedStyle(find(artifactCard, '.card__meta')).columnGap).toBe('6px')
    await expect(within(artifactCard).getByText('New')).toBeVisible()
    // The toolkit card: 16 px padding, a 10 px gap, the tile 10 px before the name, the path under it in mono.
    const toolkitBody = getComputedStyle(find(toolkitCard, '.card__body'))
    await expect([toolkitBody.paddingTop, toolkitBody.paddingLeft, toolkitBody.rowGap]).toEqual(['16px', '16px', '10px'])
    await expect(getComputedStyle(find(toolkitCard, '.card__header')).columnGap).toBe('10px')
    const subtitle = getComputedStyle(find(toolkitCard, '.card__subtitle'))
    await expect([subtitle.fontSize, subtitle.color]).toEqual(['12px', swatch('muted')])
    await expect(subtitle.fontFamily).toContain('Mono')
    await expect(getComputedStyle(find(toolkitCard, '.card__meta')).columnGap).toBe('12px')
    // A card with no onSelect has no button.
    await expect(within(toolkitCard).queryByRole('button')).toBeNull()
    // Slots set to false, null or '' render nothing, and the card takes the build without media.
    const empty = find(canvasElement, '[data-testid="empty-slots"] article')
    for (const slot of ['media', 'leading', 'badge', 'meta']) await expect(empty.querySelector(`.card__${slot}`)).toBeNull()
    await expect(getComputedStyle(find(empty, '.card__body')).paddingTop).toBe('16px')
    // A long title stays on one line and ends with an ellipsis; the TruncatedText in the title cuts it.
    const long = find(canvasElement, '[data-testid="long"] .card__title')
    const longText = find(long, '.truncated-text')
    await expect(getComputedStyle(longText).textOverflow).toBe('ellipsis')
    await expect(longText.scrollWidth).toBeGreaterThan(longText.clientWidth)
    await expect(Math.round(long.getBoundingClientRect().height)).toBe(20)
  },
} satisfies Meta<typeof Cards>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onOpenArtifact = fn()
const onOpenToolkit = fn()
const onOpenLinked = fn()
const onLink = fn()

/** With onSelect, a click anywhere on the card or Enter on its title opens it, and the focus ring circles the card. */
export const Behaviour: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <Inline gap="24" align="start">
        <div className={column} data-testid="artifact">
          {artifact(onOpenArtifact)}
        </div>
        <div className={column} data-testid="toolkit">
          {toolkit(onOpenToolkit)}
        </div>
        <div className={column} data-testid="linked">
          <Card
            title="writer"
            description="A positioned meta item and a link"
            meta={
              <>
                <span className={positioned}>positioned</span>
                <a
                  className={link}
                  href="#writer"
                  onClick={(e) => {
                    e.preventDefault()
                    onLink()
                  }}
                >
                  open the source
                </a>
              </>
            }
            onSelect={onOpenLinked}
          />
        </div>
      </Inline>
      <div hidden>
        <span data-swatch="focus" className={swatches.focus} />
      </div>
    </main>
  ),
  play: async ({ canvasElement }) => {
    onOpenArtifact.mockClear()
    onOpenToolkit.mockClear()
    onOpenLinked.mockClear()
    onLink.mockClear()
    const canvas = within(canvasElement)
    const open = canvas.getByRole('button', { name: 'Hono server spike' })
    await expect(open.closest('h3')).not.toBeNull()
    // A click on the description or the thumbnail lands on the title button, which covers the card.
    await userEvent.click(hit(canvas.getByText('A small Hono server that serves the bridge API to the prototype')))
    await expect(onOpenArtifact).toHaveBeenCalledTimes(1)
    await userEvent.click(hit(find(canvasElement, '[data-testid="artifact"] .card__media')))
    await expect(onOpenArtifact).toHaveBeenCalledTimes(2)
    await userEvent.click(hit(canvas.getByText('5 files')))
    await expect(onOpenToolkit).toHaveBeenCalledTimes(1)
    // A positioned child paints over the title button's hit area; a click on it still selects the card once.
    await userEvent.click(hit(canvas.getByText('positioned')))
    await expect(onOpenLinked).toHaveBeenCalledTimes(1)
    // A click on the title button selects it once, not once for the button and once for the card.
    await userEvent.click(canvas.getByRole('button', { name: 'writer' }))
    await expect(onOpenLinked).toHaveBeenCalledTimes(2)
    // A link inside the card keeps its own click.
    await userEvent.click(hit(canvas.getByRole('link', { name: 'open the source' })))
    await expect(onLink).toHaveBeenCalledTimes(1)
    await expect(onOpenLinked).toHaveBeenCalledTimes(2)
    // The keyboard: Tab to the first card's title, Enter opens it, and the card shows the focus ring.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    await userEvent.tab()
    await expect(open).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(onOpenArtifact).toHaveBeenCalledTimes(3)
    const ring = getComputedStyle(find(canvasElement, '[data-testid="artifact"] article'))
    const focus = getComputedStyle(find(canvasElement, '[data-swatch="focus"]')).backgroundColor
    // Chromium draws the 1.5 px borderWidths.strong outline at a whole pixel.
    await expect([ring.outlineStyle, ring.outlineColor]).toEqual(['solid', focus])
    await expect(Number.parseFloat(ring.outlineWidth)).toBeGreaterThan(0)
    // The first card's description is cut, but the card owns it (its title's focus shows the tip), so it is no tab
    // stop of its own: Tab goes on to the next card's title.
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'agents-md' })).toHaveFocus()
    await expect(getComputedStyle(find(canvasElement, '[data-testid="artifact"] article')).outlineStyle).toBe('none')
  },
}

const longSubtitle = 'toolkit/skills/skill-eval-round/references/held-out-cases'
const longDescription = 'Runs one eval round with held-out cases, a trigger set and planted defects that check the graders'

/**
 * A long subtitle and description are each cut to one line and show in full
 * in a tooltip, also in a card whose title button covers it: the subtitle on
 * hover and as its own tab stop, the description on a hover on the card or
 * the focus on its title button. A click on the cut text still selects the
 * card.
 */
const onSelectLong = fn()
export const LongText: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <div className={column}>
        <Card title="skill-eval-round" subtitle={longSubtitle} description={longDescription} onSelect={onSelectLong} />
      </div>
    </main>
  ),
  play: async ({ canvasElement }) => {
    onSelectLong.mockClear()
    await expectCutText(find(canvasElement, '.card__subtitle'), longSubtitle)
    // The clickable card owns its description: a hover on the card or the focus on its title button opens the tip.
    await expectCutText(find(canvasElement, '.card__description'), longDescription, find(canvasElement, 'article'), find(canvasElement, '.card__action'))
    await userEvent.click(hit(find(canvasElement, '.card__description .truncated-text')))
    await expect(onSelectLong).toHaveBeenCalledTimes(1)
  },
}

// A card pinned to the window's foot, so its cut description has no room for a tooltip below it.
const foot = css({ position: 'fixed', bottom: '0', left: '0', w: 'shell.sidebar', p: '24', bg: 'bg.canvas' })
const footDescription = 'Routes, the RPC client and the owner check over the bridge API, with the held-out cases'
const onSelectFoot = fn()

function CardAtFoot() {
  return (
    <main className={foot}>
      <Card title="hono-server" description={footDescription} onSelect={onSelectFoot} />
    </main>
  )
}

// The intersection of two boxes, empty when they do not overlap.
const overlap = (a: DOMRect, b: DOMRect) => ({
  left: Math.max(a.left, b.left),
  right: Math.min(a.right, b.right),
  top: Math.max(a.top, b.top),
  bottom: Math.min(a.bottom, b.bottom),
})

/**
 * A clickable card at the window's foot. Its cut description opens the
 * tooltip on hover and on focus, and Escape closes it. The tooltip has no
 * room below the description, so it opens above it, over the title button.
 * It takes no pointer events, so a click at a point it covers on the title
 * button still selects the card.
 */
const cutTextClickPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  onSelectFoot.mockClear()
  const description = find(canvasElement, '.card__description')
  await expectCutText(description, footDescription, find(canvasElement, 'article'), find(canvasElement, '.card__action'))
  const text = find(description, '.truncated-text')
  await userEvent.hover(text)
  // Wait for Ark to place the open tooltip in the window: it has no room below the text, so it flips above it.
  await waitFor(async () => {
    const open = within(document.body).getByRole('tooltip')
    await expect(open).toHaveTextContent(footDescription)
    await expect(open.getAttribute('data-placement')).toBe('top')
    await expect(open.getBoundingClientRect().top).toBeGreaterThanOrEqual(0)
    await expect(open.getBoundingClientRect().bottom).toBeLessThanOrEqual(description.getBoundingClientRect().top)
  })
  const tip = within(document.body).getByRole('tooltip')
  await expect(tip).toBeVisible()
  // A point that lies on both the tooltip and the title button.
  const action = find(canvasElement, '.card__action')
  const both = overlap(tip.getBoundingClientRect(), action.getBoundingClientRect())
  await expect(both.right).toBeGreaterThan(both.left)
  await expect(both.bottom).toBeGreaterThan(both.top)
  const target = document.elementFromPoint((both.left + both.right) / 2, (both.top + both.bottom) / 2)
  if (!(target instanceof HTMLElement)) throw new Error('nothing at the point')
  // A pointer there hits the card, not the tooltip, which takes no pointer events. (React passes a click on the
  // tooltip up to the card through the portal, so only this hit test shows what a real pointer, or Playwright,
  // would press.)
  await expect(tip.contains(target)).toBe(false)
  await expect(find(canvasElement, 'article').contains(target)).toBe(true)
  await expect(getComputedStyle(tip).pointerEvents).toBe('none')
  await userEvent.click(target)
  await expect(onSelectFoot).toHaveBeenCalledTimes(1)
  await userEvent.keyboard('{Escape}')
}
export const CutTextClickDark: StoryObj<typeof meta> = { render: () => <CardAtFoot />, globals: { mode: 'dark' }, play: cutTextClickPlay }
export const CutTextClickLight: StoryObj<typeof meta> = { render: () => <CardAtFoot />, globals: { mode: 'light' }, play: cutTextClickPlay }

// Lets the tooltips' open delay (400 ms) pass.
const pause = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

// Two clickable cards side by side, each with a description too long for its line.
const pairRow = css({ display: 'flex', gap: '16' })
const honoDescription = 'Routes, the RPC client and the owner check over the bridge API, with the held-out cases'
const tailDescription = 'Which devices reach the-bridge, and the owner check on writes from each of them'

function CardPair() {
  return (
    <main className={page}>
      <div className={pairRow}>
        <div className={column} data-testid="hono">
          <Card title="Hono server spike" description={honoDescription} onSelect={() => undefined} />
        </div>
        <div className={column} data-testid="tailscale">
          <Card title="Tailscale access check" description={tailDescription} onSelect={() => undefined} />
        </div>
      </div>
      <p>Outside the cards</p>
    </main>
  )
}

/**
 * A clickable card owns its cut description: a hover on the card, or the
 * keyboard focus on its title button, opens that card's tip and no other,
 * and the description is no tab stop of its own. A pointer outside the
 * cards opens none.
 */
const cardOwnerPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const hono = canvas.getByTestId('hono')
  const tail = canvas.getByTestId('tailscale')
  for (const box of [hono, tail]) await expect(find(box, '.card__description .truncated-text')).not.toHaveAttribute('tabindex')
  await userEvent.hover(canvas.getByText('Outside the cards'))
  await pause(600)
  await expect(within(document.body).queryByRole('tooltip')).toBeNull()
  // A hover on the Hono card's title button, which covers the card, opens only its description's tip.
  await userEvent.hover(find(hono, '.card__action'))
  await waitFor(() => expect(tooltipOf()).toHaveTextContent(honoDescription))
  await expect(within(document.body).getAllByRole('tooltip')).toHaveLength(1)
  await userEvent.unhover(find(hono, '.card__action'))
  await waitFor(() => expect(tooltipOf()).toBeNull())
  // The keyboard: the focus on the other card's title button opens its tip.
  await userEvent.keyboard('{Escape}')
  find(tail, '.card__action').focus()
  await waitFor(() => expect(tooltipOf()).toHaveTextContent(tailDescription))
  await expect(within(document.body).getAllByRole('tooltip')).toHaveLength(1)
  find(tail, '.card__action').blur()
  await waitFor(() => expect(tooltipOf()).toBeNull())
}
export const CardOwnsDescriptionDark: StoryObj<typeof meta> = { render: () => <CardPair />, globals: { mode: 'dark' }, play: cardOwnerPlay }
export const CardOwnsDescriptionLight: StoryObj<typeof meta> = { render: () => <CardPair />, globals: { mode: 'light' }, play: cardOwnerPlay }

const cutTitle = 'Skill eval pass rates for every round, with and without each skill'
// A preview above the title, as an artifact card has, so the title's tip has room above the title.
const preview = css({ h: 'shell.tabBar', bg: 'surface.raised' })

function CardAllCut() {
  return (
    <main className={page}>
      <div className={column}>
        <Card media={<div className={preview} />} title={cutTitle} subtitle={longSubtitle} description={honoDescription} onSelect={() => undefined} />
      </div>
    </main>
  )
}

/**
 * A clickable card whose title, subtitle and description are all cut. A
 * hover on the title button opens the title's tip above the title and the
 * description's tip below the description, so neither covers the other. A
 * hover on the subtitle, which keeps its own tab stop, opens only its tip.
 */
const allCutPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const tips = () => within(document.body).queryAllByRole('tooltip')
  const tipWith = (text: string) => tips().find((tip) => tip.textContent.includes(text)) ?? null
  const action = find(canvasElement, '.card__action')
  await userEvent.hover(action)
  await waitFor(async () => {
    const title = tipWith(cutTitle)
    const description = tipWith(honoDescription)
    await expect(title).not.toBeNull()
    await expect(description).not.toBeNull()
    if (title === null || description === null) return
    await expect(title.getAttribute('data-placement')).toBe('top')
    await expect(title.getBoundingClientRect().bottom).toBeLessThanOrEqual(description.getBoundingClientRect().top)
  })
  await userEvent.unhover(action)
  await waitFor(() => expect(tips()).toHaveLength(0))
  const subtitle = find(canvasElement, '.card__subtitle .truncated-text')
  await expect(subtitle).toHaveAttribute('tabindex', '0')
  await userEvent.hover(subtitle)
  await waitFor(() => expect(tipWith(longSubtitle)).not.toBeNull())
  await pause(600)
  await expect(tips()).toHaveLength(1)
  await expect(tipWith(longSubtitle)).not.toBeNull()
  await userEvent.unhover(subtitle)
  await waitFor(() => expect(tips()).toHaveLength(0))
}
export const AllTextCutDark: StoryObj<typeof meta> = { render: () => <CardAllCut />, globals: { mode: 'dark' }, play: allCutPlay }
export const AllTextCutLight: StoryObj<typeof meta> = { render: () => <CardAllCut />, globals: { mode: 'light' }, play: allCutPlay }

// A pane that clips what is past the window's foot, as a scrolled pane of the-bridge does, with a card whose cut
// description lies below the foot.
const clipPane = css({ position: 'fixed', top: '0', bottom: '0', right: '0', w: 'shell.sidebar', overflow: 'hidden', display: 'flex', flexDirection: 'column' })
// Fills the pane, so the card after it starts at the window's foot.
const paneFill = css({ h: 'dvh', flexShrink: '0' })

function CardsAtFoot() {
  return (
    <main>
      <div className={foot} data-testid="foot">
        <Card title="hono-server" description={footDescription} onSelect={() => undefined} />
      </div>
      <div className={clipPane}>
        <div className={paneFill} />
        <div data-testid="past-foot">
          <Card title="rpc-client" description={footDescription} onSelect={() => undefined} />
        </div>
      </div>
    </main>
  )
}

const tooltipOf = () => within(document.body).queryByRole('tooltip')

/**
 * A cut description's tooltip at the window's foot stays in the window: it
 * has no room below the text, so it flips above it. The tooltip is fixed to
 * the window, so it never makes the document taller and the page never
 * scrolls, also when its text lies past the foot in a pane that clips it.
 */
const cutTextFootPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const cutIn = (id: string) => find(find(within(canvasElement).getByTestId(id), '.card__description'), '.truncated-text')
  const text = cutIn('foot')
  await userEvent.hover(text)
  // Wait for Ark to place the open tooltip: it has no room below the text, so it flips above it.
  await waitFor(async () => {
    const open = within(document.body).getByRole('tooltip')
    await expect(open).toHaveTextContent(footDescription)
    await expect(open.getAttribute('data-placement')).toBe('top')
    // 6 px above the text.
    await expect(Math.round(text.getBoundingClientRect().top - open.getBoundingClientRect().bottom)).toBe(6)
  })
  const tip = within(document.body).getByRole('tooltip')
  await expect(tip).toBeVisible()
  await expect(document.documentElement.scrollHeight).toBe(window.innerHeight)
  const box = tip.getBoundingClientRect()
  await expect(box.top).toBeGreaterThanOrEqual(0)
  await expect(box.left).toBeGreaterThanOrEqual(0)
  await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight)
  await expect(box.right).toBeLessThanOrEqual(window.innerWidth)
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(tooltipOf()).toBeNull())
  await userEvent.unhover(text)

  // The text past the foot: its tooltip follows it out of the window, and the document keeps the window's height.
  const hidden = cutIn('past-foot')
  await expect(hidden.getBoundingClientRect().top).toBeGreaterThan(window.innerHeight)
  await userEvent.hover(hidden)
  await waitFor(() => expect(tooltipOf()).toHaveTextContent(footDescription))
  await waitFor(() => expect(tooltipOf()?.getBoundingClientRect().bottom).toBeGreaterThan(window.innerHeight))
  await expect(document.documentElement.scrollHeight).toBe(window.innerHeight)
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(tooltipOf()).toBeNull())
}
export const CutTextFootDark: StoryObj<typeof meta> = { render: () => <CardsAtFoot />, globals: { mode: 'dark' }, play: cutTextFootPlay }
export const CutTextFootLight: StoryObj<typeof meta> = { render: () => <CardsAtFoot />, globals: { mode: 'light' }, play: cutTextFootPlay }

/**
 * The Toolkit tablet row (T1 428:59): `padding="compact"` pads 10 above and
 * below and 12 at the sides, so the tile starts 13 in and the row is 60
 * high (Figma 59), and `trailing` ends the header row with the counts
 * (428:67), centred down it. A card without them keeps the 16 inset and no
 * trailing slot.
 */
function TabletRows() {
  return (
    <main className={page}>
      <Stack gap="12">
        <div className={column} data-testid="compact">
          <Card
            title="agents-md"
            leading={<KindTile kind="skill" size="sm" />}
            subtitle="toolkit/skills/agents-md"
            trailing={
              <>
                <span>→0</span>
                <span>←1</span>
              </>
            }
            padding="compact"
            onSelect={() => undefined}
          />
        </div>
        <div className={column} data-testid="plain">
          <Card title="agents-md" leading={<KindTile kind="skill" size="sm" />} subtitle="toolkit/skills/agents-md" />
        </div>
      </Stack>
      <div hidden>
        <span data-swatch="muted" className={swatches.muted} />
      </div>
    </main>
  )
}

const tabletRowsPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const muted = getComputedStyle(find(canvasElement, '[data-swatch="muted"]')).backgroundColor
  const row = find(canvasElement, '[data-testid="compact"] article')
  const box = row.getBoundingClientRect()
  const body = getComputedStyle(find(row, '.card__body'))
  await expect([body.paddingTop, body.paddingRight, body.paddingBottom, body.paddingLeft]).toEqual(['10px', '12px', '10px', '12px'])
  // 1 + 10 + 38 (the 20 px name, 2, the 16 px path) + 10 + 1: Figma's row is 59.
  await expect(box.height).toBe(60)
  // The 28 px tile starts 13 in, as Figma's 30 px tile (428:60), and is centred down the row.
  const tile = find(row, '.card__leading').getBoundingClientRect()
  await expect(tile.left - box.left).toBe(13)
  await expect(tile.top + tile.height / 2).toBe(box.top + box.height / 2)
  // The counts end the row 13 from its right edge, centred down it, in mono fg.muted.
  const trailingEl = find(row, '.card__trailing')
  const trailing = trailingEl.getBoundingClientRect()
  await expect(box.right - trailing.right).toBe(13)
  await expect(trailing.top + trailing.height / 2).toBe(box.top + box.height / 2)
  await expect(trailing.left).toBeGreaterThan(find(row, '.card__subtitle').getBoundingClientRect().right)
  const counts = getComputedStyle(trailingEl)
  await expect([counts.fontSize, counts.color]).toEqual(['12px', muted])
  await expect(counts.fontFamily).toContain('Mono')
  await expect(within(trailingEl).getByText('←1')).toBeVisible()
  // Without them: the 16 inset, a 72 px card, and no trailing slot.
  const plain = find(canvasElement, '[data-testid="plain"] article')
  await expect(getComputedStyle(find(plain, '.card__body')).paddingTop).toBe('16px')
  await expect(plain.getBoundingClientRect().height).toBe(72)
  await expect(plain.querySelector('.card__trailing')).toBeNull()
}

/** `padding="compact"` and `trailing`: the Toolkit tablet row (T1 428:59). */
export const TabletRowDark: StoryObj<typeof meta> = { render: () => <TabletRows />, globals: { mode: 'dark' }, play: tabletRowsPlay }
export const TabletRowLight: StoryObj<typeof meta> = { render: () => <TabletRows />, globals: { mode: 'light' }, play: tabletRowsPlay }

/**
 * The Toolkit card (D1 425:77): `metaSpacer` puts Figma's 14 px spacer
 * (425:86) and the 10 px gap after it above the counts, so they sit 34
 * under the description and the card with the 36 px tile is 148 high
 * (Figma 150, its text lines are 17). A card without it keeps the counts
 * 10 under the description, 124 high.
 */
function SpacedCards() {
  const card = (spaced: boolean) => (
    <Card
      title="agents-md"
      leading={<KindTile kind="skill" size="lg" />}
      subtitle="toolkit/skills/agents-md"
      description="Writes and audits the AGENTS.md context files of a repo"
      meta={
        <>
          <span className={strong}>3 links in</span>
          <span>5 files</span>
        </>
      }
      metaSpacer={spaced}
    />
  )
  return (
    <main className={page}>
      <Inline gap="24" align="start">
        <div className={column} data-testid="spaced">
          {card(true)}
        </div>
        <div className={column} data-testid="plain">
          {card(false)}
        </div>
      </Inline>
    </main>
  )
}

const spacedCardsPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const gap = (testId: string) => {
    const c = find(canvasElement, `[data-testid="${testId}"] article`)
    return { card: c.getBoundingClientRect().height, gap: find(c, '.card__meta > span').getBoundingClientRect().top - find(c, '.card__description').getBoundingClientRect().bottom }
  }
  // 10 + Figma's 14 px spacer + 10: the counts' text sits 34 under the description, and the card is 148 high.
  await expect(gap('spaced')).toEqual({ card: 148, gap: 34 })
  // The default keeps the 10 px gap and the 124 px card.
  await expect(gap('plain')).toEqual({ card: 124, gap: 10 })
  const metaRow = getComputedStyle(find(canvasElement, '[data-testid="spaced"] .card__meta'))
  await expect([metaRow.fontSize, metaRow.columnGap]).toEqual(['12px', '12px'])
}

/** `metaSpacer`: the Toolkit card's spacer above its counts (D1 425:86). */
export const MetaSpacerDark: StoryObj<typeof meta> = { render: () => <SpacedCards />, globals: { mode: 'dark' }, play: spacedCardsPlay }
export const MetaSpacerLight: StoryObj<typeof meta> = { render: () => <SpacedCards />, globals: { mode: 'light' }, play: spacedCardsPlay }

/**
 * The Artifacts card (D1 402:15449): `badgePosition="end"` puts New
 * (402:15454) at the right end of the title row (402:15452), and the title
 * takes the free width; a long title is cut 8 before the badge. The body
 * (402:15451) pads 12 above and 16 at the sides and below (Figma 14, a tie
 * that takes 16), and the meta line's `icon="md"` draws the kind mark
 * (402:15461, Figma 14) at 16. A card without `badgePosition` keeps the
 * badge 8 after the title.
 */
function ArtifactCards() {
  const card = (title: string, end: boolean) => (
    <Card
      title={title}
      media={<div className={thumbnail} />}
      badge={<Badge label="New" icon={<SparkIcon size="12" />} tone="working" size="sm" />}
      badgePosition={end ? 'end' : undefined}
      description="A small Hono server that serves the bridge API to the prototype"
      meta={
        <div className={metaWide}>
          <MetaLine icon="md" leading={<KindMark kind="claude" size="16" />} items={['Claude', 'the-bridge']} trailing="40m" />
        </div>
      }
    />
  )
  return (
    <main className={page}>
      <Inline gap="24" align="start">
        <div className={column} data-testid="end">
          {card('Hono server spike', true)}
        </div>
        <div className={column} data-testid="end-long">
          {card('A very long artifact title that does not fit on one line of the card', true)}
        </div>
        <div className={column} data-testid="title">
          {card('Hono server spike', false)}
        </div>
      </Inline>
    </main>
  )
}

const artifactCardsPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const rect = (testId: string, slot: string) => find(canvasElement, `[data-testid="${testId}"] .card__${slot}`).getBoundingClientRect()
  // With `end`, New ends the title row (402:15454 ends at x 415, the row's end), level with the title.
  const row = rect('end', 'titleRow')
  const badge = rect('end', 'badge')
  await expect(badge.right).toBe(row.right)
  await expect(badge.top + badge.height / 2).toBe(row.top + row.height / 2)
  await expect(rect('end', 'title').right).toBeLessThanOrEqual(badge.left - 8)
  await expect(Math.round(row.height)).toBe(20)
  // A long title takes the free width and is cut 8 before the badge, which still ends the row.
  const longText = find(canvasElement, '[data-testid="end-long"] .card__title .truncated-text')
  await expect(longText.scrollWidth).toBeGreaterThan(longText.clientWidth)
  await expect(rect('end-long', 'badge').right).toBe(rect('end-long', 'titleRow').right)
  await expect(rect('end-long', 'title').right).toBe(rect('end-long', 'badge').left - 8)
  // The default keeps the badge 8 after the title, short of the row's end.
  await expect(rect('title', 'badge').left).toBe(rect('title', 'title').right + 8)
  await expect(rect('title', 'badge').right).toBeLessThan(rect('title', 'titleRow').right)
  // The body pads 12 above (Figma 12) and 16 at the sides and below (Figma 14), and the title row starts 12 under it.
  for (const testId of ['end', 'title']) {
    const body = find(canvasElement, `[data-testid="${testId}"] .card__body`)
    const s = getComputedStyle(body)
    await expect([s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft]).toEqual(['12px', '16px', '16px', '16px'])
    await expect(rect(testId, 'titleRow').top - body.getBoundingClientRect().top).toBe(12)
    // The description and meta lines stay 16 (Figma 17), on the 4 px grid.
    await expect(Math.round(Number.parseFloat(getComputedStyle(find(body, '.card__description')).lineHeight))).toBe(16)
    // `MetaLine icon="md"` draws the kind mark at 16 × 16 (Figma 14, 402:15461).
    const svg = body.querySelector('.meta-line__leading svg')
    if (svg === null) throw new Error('no kind mark')
    const mark = svg.getBoundingClientRect()
    await expect([mark.width, mark.height]).toEqual([16, 16])
  }
}

/** `badgePosition="end"` and the `md` meta mark: the Artifacts card (D1 402:15449). */
export const ArtifactCardDark: StoryObj<typeof meta> = { render: () => <ArtifactCards />, globals: { mode: 'dark' }, play: artifactCardsPlay }
export const ArtifactCardLight: StoryObj<typeof meta> = { render: () => <ArtifactCards />, globals: { mode: 'light' }, play: artifactCardsPlay }


// The subtitle and the description at each text size (d-131): Small cuts each with an ellipsis, as before; at Default
// and Large they wrap and the card grows in height, as an iOS cell does. The title keeps its one line.
function GrowCard() {
  return (
    <main className={page}>
      <div className={column} data-testid="grow-card">
        <Card
          title="pr-description-checker"
          subtitle="agents/pr-description-checker-with-a-long-path.md"
          description="Grades a PR title and description against the final diff and quotes the hunk behind each failure"
        />
      </div>
    </main>
  )
}

const growCardPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const card = within(canvasElement).getByTestId('grow-card')
  for (const size of textSizes) {
    await atTextSize(size, async () => {
      if (size === 'small') {
        for (const slot of ['.card__subtitle', '.card__description']) {
          const t = card.querySelector(`${slot} .truncated-text`)
          if (!(t instanceof HTMLElement)) throw new Error(`no ${slot}`)
          await expect(getComputedStyle(t).textOverflow).toBe('ellipsis')
          await waitFor(() => expect(t.scrollWidth).toBeGreaterThan(t.clientWidth))
        }
        return
      }
      await expectGrown(card, ['.card__subtitle', '.card__description'])
      await expect(textSpills(card)).toEqual([])
    })
  }
}

/** A Toolkit card at Small, Default and Large: the larger sizes wrap its subtitle and description. */
export const GrowTextSizesDark: StoryObj<typeof meta> = { render: () => <GrowCard />, play: growCardPlay, globals: { mode: 'dark', textSize: 'small' } }
export const GrowTextSizesLight: StoryObj<typeof meta> = { render: () => <GrowCard />, play: growCardPlay, globals: { mode: 'light', textSize: 'small' } }

// Artifact cards of one height (the-bridge screen review R77, the owner: "Artifact cards should always be the same
// height"). `descriptionLines={2}` gives the description exactly two lines at each text size: a long one is clamped
// to two lines with an ellipsis, and a card with none, or one that loads, keeps two empty lines. The cards sit in a
// grid inside a box each, as the-bridge's Artifacts grid has them, and the cells do not stretch them: each card
// keeps its own height, so the check sees the card's height and not the row's.
const sameHeightLong =
  'Projects app for the-bridge: the projects overview and a project page, from the component-library-1701 Design System, with the held-out cases and the planted defects that check the graders'
const sameHeightLongTitle = 'component-library-1701 Design System overview with every token, part and page of the-bridge'

function SameHeightCards() {
  const card = (testId: string, extra: { title?: string; description?: string; loading?: boolean; isNew?: boolean }) => (
    <div className={column} data-testid={testId}>
      <Card
        descriptionLines={2}
        title={extra.loading === true ? '' : (extra.title ?? 'NCC-1701 Projects')}
        loading={extra.loading}
        media={<div className={thumbnail} />}
        badge={extra.isNew === true ? <Badge label="New" icon={<SparkIcon size="12" />} tone="working" size="sm" /> : undefined}
        badgePosition="end"
        description={extra.description}
        meta={
          <div className={metaWide}>
            <MetaLine icon="md" leading={<KindMark kind="claude" size="16" />} items={['Claude', 'the-bridge']} trailing="16h" />
          </div>
        }
        onSelect={extra.loading === true ? undefined : () => undefined}
      />
    </div>
  )
  return (
    <main className={page}>
      <Grid columns="2" gap="24">
        {card('none', { isNew: true })}
        {card('long', { description: sameHeightLong })}
        {card('short', { description: 'Short' })}
        {card('loading', { loading: true })}
        {card('longTitle', { title: sameHeightLongTitle, description: 'Short', isNew: true })}
      </Grid>
    </main>
  )
}

const sameHeightPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const ids = ['none', 'long', 'short', 'loading', 'longTitle'] as const
  const article = (id: string) => find(canvasElement, `[data-testid="${id}"] article`)
  for (const size of textSizes) {
    await atTextSize(size, async () => {
      // Every card has the height of the card with no description, in a row and across rows.
      const heights = ids.map((id) => ({ id, size, height: Math.round(article(id).getBoundingClientRect().height) }))
      const first = heights[0]?.height
      await expect(heights).toEqual(ids.map((id) => ({ id, size, height: first })))
      // The description slot is two lines of its own line height, at each text size: with text, without and loading.
      for (const id of ids) {
        const slot = article(id).querySelector('.card__description')
        if (!(slot instanceof HTMLElement)) throw new Error(`no description slot in ${id} at ${size}`)
        const line = Number.parseFloat(getComputedStyle(slot).lineHeight)
        await expect({ id, size, height: Math.round(slot.getBoundingClientRect().height) }).toEqual({ id, size, height: Math.round(2 * line) })
      }
      // The long description is clamped to two lines with an ellipsis, at each size, and nothing spills.
      const longText = find(article('long'), '.card__description .truncated-text')
      await expect(getComputedStyle(longText).webkitLineClamp).toBe('2')
      await waitFor(() => expect(longText.scrollHeight - longText.clientHeight).toBeGreaterThan(1))
      // The long title stays on one line and is cut, so the title row keeps one height too.
      const longTitle = find(article('longTitle'), '.card__title .truncated-text')
      await waitFor(() => expect(longTitle.scrollWidth).toBeGreaterThan(longTitle.clientWidth))
      await expect(textSpills(canvasElement)).toEqual([])
    })
  }
}

/**
 * `descriptionLines={2}`: artifact cards with no, a long, a short and a loading description, and one with a long
 * title, have one height (R77).
 */
export const SameHeightDark: StoryObj<typeof meta> = { render: () => <SameHeightCards />, play: sameHeightPlay, globals: { mode: 'dark', textSize: 'small' } }
export const SameHeightLight: StoryObj<typeof meta> = { render: () => <SameHeightCards />, play: sameHeightPlay, globals: { mode: 'light', textSize: 'small' } }
