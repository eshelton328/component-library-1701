import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Grid, Inline } from '../controls/layout'
import { Card } from './card'
import { StatusPill } from './status-pill'

const page = css({ bg: 'bg.canvas', p: '24' })
const column = css({ w: 'shell.sidebar' })
// Stand-ins for the thumbnail and the kind tile, which are parts of their own.
const thumbnail = css({ h: 'shell.tabBar', bg: 'surface.raised' })
const tile = css({ w: 'kindTile.sm', h: 'kindTile.sm', borderRadius: 'md', bg: 'accent.subtle' })
const strong = css({ color: 'fg.default' })
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
    // A long title stays on one line and ends with an ellipsis.
    const long = find(canvasElement, '[data-testid="long"] .card__title')
    await expect(getComputedStyle(long).textOverflow).toBe('ellipsis')
    await expect(long.scrollWidth).toBeGreaterThan(long.clientWidth)
    await expect(Math.round(long.getBoundingClientRect().height)).toBe(20)
  },
} satisfies Meta<typeof Cards>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onOpenArtifact = fn()
const onOpenToolkit = fn()

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
      </Inline>
      <div hidden>
        <span data-swatch="focus" className={swatches.focus} />
      </div>
    </main>
  ),
  play: async ({ canvasElement }) => {
    onOpenArtifact.mockClear()
    onOpenToolkit.mockClear()
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
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'agents-md' })).toHaveFocus()
    await expect(getComputedStyle(find(canvasElement, '[data-testid="artifact"] article')).outlineStyle).toBe('none')
  },
}
