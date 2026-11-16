import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { KindTile, type KindTileKind } from './kind-tile'

const page = css({ bg: 'bg.canvas', p: '24', display: 'grid', gap: '16', justifyItems: 'start' })
const pane = css({ bg: 'surface.pane', p: '16', borderRadius: 'xl', display: 'grid', gap: '12' })
const row = css({ display: 'flex', alignItems: 'center', gap: '12', flexWrap: 'wrap' })
const heading = css({ textStyle: 'eyebrow', color: 'fg.muted' })

const inbox = ['approval', 'question', 'review', 'action', 'next'] as const satisfies readonly KindTileKind[]
const toolkit = ['skill', 'agent', 'rule', 'workflow', 'hook'] as const satisfies readonly KindTileKind[]
const kinds = [...inbox, ...toolkit]

// The token each kind's tint and icon should use.
const expected: Record<KindTileKind, { bg: string; fg: string }> = {
  approval: { bg: css({ bg: 'status.needsYou.bg' }), fg: css({ color: 'status.needsYou.fg' }) },
  question: { bg: css({ bg: 'status.needsYou.bg' }), fg: css({ color: 'status.needsYou.fg' }) },
  review: { bg: css({ bg: 'status.needsYou.bg' }), fg: css({ color: 'status.needsYou.fg' }) },
  action: { bg: css({ bg: 'status.needsYou.bg' }), fg: css({ color: 'status.needsYou.fg' }) },
  next: { bg: css({ bg: 'status.working.bg' }), fg: css({ color: 'status.working.fg' }) },
  // The toolkit kinds sit on their own kindTint (d-074).
  skill: { bg: css({ bg: 'kindTint.skill' }), fg: css({ color: 'kind.skill' }) },
  agent: { bg: css({ bg: 'kindTint.agent' }), fg: css({ color: 'kind.agent' }) },
  rule: { bg: css({ bg: 'kindTint.rule' }), fg: css({ color: 'kind.rule' }) },
  workflow: { bg: css({ bg: 'kindTint.workflow' }), fg: css({ color: 'kind.workflow' }) },
  hook: { bg: css({ bg: 'kindTint.hook' }), fg: css({ color: 'kind.hook' }) },
}

function Tiles() {
  return (
    <main className={page}>
      <div className={pane}>
        <span className={heading}>Inbox kinds</span>
        <div className={row}>
          {inbox.map((k) => (
            <span key={k} data-testid={`tile-${k}`}>
              <KindTile kind={k} />
            </span>
          ))}
        </div>
        <span className={heading}>Toolkit kinds</span>
        <div className={row}>
          {toolkit.map((k) => (
            <span key={k} data-testid={`tile-${k}`}>
              <KindTile kind={k} />
            </span>
          ))}
        </div>
        <span className={heading}>Large</span>
        <div className={row}>
          {toolkit.map((k) => (
            <span key={k} data-testid={`tile-lg-${k}`}>
              <KindTile kind={k} size="lg" />
            </span>
          ))}
          <KindTile kind="approval" size="lg" title="Approval" />
        </div>
      </div>
      <div hidden>
        {kinds.map((k) => (
          <span key={k}>
            <span data-testid={`fg-${k}`} className={expected[k].fg} />
            <span data-testid={`bg-${k}`} className={expected[k].bg} />
          </span>
        ))}
      </div>
    </main>
  )
}

const tileIn = (el: HTMLElement) => {
  const tile = el.firstElementChild
  const svg = tile?.querySelector('svg')
  if (!(tile instanceof HTMLElement) || !(svg instanceof SVGSVGElement)) throw new Error('no tile')
  return { tile, svg }
}

const meta = {
  title: 'Data display/Kind tile',
  component: Tiles,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const k of kinds) {
      const { tile, svg } = tileIn(canvas.getByTestId(`tile-${k}`))
      const style = getComputedStyle(tile)
      const box = tile.getBoundingClientRect()
      const icon = svg.getBoundingClientRect()
      // 28 px tile, radius 8, 16 px icon at 6, 6 (Figma 346:196).
      await expect([box.width, box.height]).toEqual([28, 28])
      await expect(style.borderTopLeftRadius).toBe('8px')
      await expect([icon.width, icon.height]).toEqual([16, 16])
      await expect([icon.left - box.left, icon.top - box.top]).toEqual([6, 6])
      // The tint and the icon colour come from the kind's tokens.
      await expect(style.color).toBe(getComputedStyle(canvas.getByTestId(`fg-${k}`)).color)
      await expect(getComputedStyle(svg).stroke).toBe(style.color)
      await expect(style.backgroundColor).toBe(getComputedStyle(canvas.getByTestId(`bg-${k}`)).backgroundColor)
      await expect(svg.getAttribute('aria-hidden')).toBe('true')
    }
    for (const k of toolkit) {
      const { tile, svg } = tileIn(canvas.getByTestId(`tile-lg-${k}`))
      const box = tile.getBoundingClientRect()
      const icon = svg.getBoundingClientRect()
      // 36 px tile with an 18 px icon at 9, 9 (Figma 429:97).
      await expect([box.width, box.height]).toEqual([36, 36])
      await expect([icon.width, icon.height]).toEqual([18, 18])
      await expect([icon.left - box.left, icon.top - box.top]).toEqual([9, 9])
    }
    // A title names a tile that stands alone.
    await expect(canvas.getByRole('img', { name: 'Approval' }).getBoundingClientRect().width).toBe(18)
  },
} satisfies Meta<typeof Tiles>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
