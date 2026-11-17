import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Inline } from '../controls/layout'
import { CheckIcon, LockIcon, LoopIcon, SparkIcon } from '../foundations/icons'
import { Badge } from './badge'

const page = css({ bg: 'bg.canvas', p: '24', display: 'grid', gap: '16', justifyItems: 'start' })
const pane = css({ bg: 'surface.pane', p: '16', borderRadius: 'xl' })
// Hidden swatches of the tokens the badges should use.
const swatch = {
  overlay: css({ bg: 'surface.overlay' }),
  border: css({ color: 'border.default' }),
  muted: css({ color: 'fg.muted' }),
  working: css({ color: 'status.working.fg', bg: 'status.working.bg' }),
  running: css({ color: 'status.running.fg', bg: 'status.running.bg' }),
  needsYou: css({ color: 'status.needsYou.fg', bg: 'status.needsYou.bg' }),
  idle: css({ color: 'status.idle.fg', bg: 'status.idle.bg' }),
  done: css({ color: 'status.done.fg', bg: 'status.done.bg' }),
  danger: css({ color: 'status.danger.fg', bg: 'status.danger.bg' }),
}

const tones = ['working', 'running', 'needsYou', 'idle', 'done', 'danger'] as const

function Badges() {
  return (
    <main className={page}>
      <Inline wrap gap="8">
        <span data-testid="new">
          <Badge label="New" tone="working" icon={<SparkIcon size="12" />} />
        </span>
        <span data-testid="pass">
          <Badge label="43 of 43 pass" tone="done" icon={<CheckIcon size="12" />} />
        </span>
        <Badge label="3 of 43 fail" tone="danger" />
        <span data-testid="loop">
          <Badge label="loop until it passes" variant="tag" tone="needsYou" icon={<LoopIcon size="12" />} />
        </span>
        <span data-testid="uses">
          <Badge label="link.sh" variant="outline" tone="needsYou" />
        </span>
        <span data-testid="read-only">
          <Badge label="Read-only" variant="quiet" icon={<LockIcon size="12" />} />
        </span>
      </Inline>
      <div className={pane}>
        <Inline wrap gap="8">
          {tones.map((t) => (
            <span key={t} data-testid={`tone-${t}`}>
              <Badge tone={t} label={t} />
            </span>
          ))}
        </Inline>
      </div>
      {Object.entries(swatch).map(([name, className]) => (
        <span key={name} hidden className={className} data-testid={`swatch-${name}`} />
      ))}
      <span hidden data-testid="ref-loop">
        <LoopIcon size="12" />
      </span>
    </main>
  )
}

const meta = {
  title: 'Status/Badge',
  component: Badges,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const badgeIn = (id: string) => {
      const el = canvas.getByTestId(id).firstElementChild
      if (!(el instanceof HTMLElement)) throw new Error(`no badge in ${id}`)
      return el
    }
    const style = (id: string) => getComputedStyle(badgeIn(id))
    const sw = (name: string) => getComputedStyle(canvas.getByTestId(`swatch-${name}`))
    const box = (id: string) => badgeIn(id).getBoundingClientRect()

    // Each tone takes its own status colour and tint.
    for (const t of tones) {
      await expect(style(`tone-${t}`).color).toBe(sw(t).color)
      await expect(style(`tone-${t}`).backgroundColor).toBe(sw(t).backgroundColor)
    }
    await expect(new Set(tones.map((t) => style(`tone-${t}`).backgroundColor)).size).toBe(6)

    // Pill: the working tint and colour, no border, pill text, 8 / 4 padding, gap 6.
    const pill = style('new')
    await expect(pill.color).toBe(sw('working').color)
    await expect(pill.backgroundColor).toBe(sw('working').backgroundColor)
    await expect(pill.borderTopWidth).toBe('0px')
    await expect([pill.fontSize, pill.fontWeight]).toEqual(['11px', '500'])
    await expect([pill.paddingLeft, pill.paddingTop, pill.columnGap]).toEqual(['8px', '4px', '6px'])
    await expect(parseFloat(pill.borderTopLeftRadius)).toBeGreaterThanOrEqual(box('new').height / 2)
    await expect(box('new').height).toBeCloseTo(24, 0)
    const icon = badgeIn('new').querySelector('svg')
    if (!(icon instanceof SVGSVGElement)) throw new Error('no icon')
    await expect(icon.getBoundingClientRect().width).toBe(12)
    await expect(getComputedStyle(icon).stroke).toBe(pill.color)
    // The label names the badge; the icon is hidden.
    await expect(badgeIn('new').textContent).toBe('New')
    await expect(badgeIn('new').querySelector('.badge__icon')?.getAttribute('aria-hidden')).toBe('true')
    // A badge with no icon draws no icon slot.
    await expect(badgeIn('tone-idle').querySelector('.badge__icon')).toBeNull()

    // Tag: the needs-you tint, mono 12/16, radius 6, 6 / 2 padding, gap 4, 20 high.
    const tag = style('loop')
    await expect(tag.backgroundColor).toBe(sw('needsYou').backgroundColor)
    await expect(tag.color).toBe(sw('needsYou').color)
    await expect([tag.fontSize, tag.borderTopLeftRadius, tag.borderTopWidth]).toEqual(['12px', '6px', '0px'])
    await expect(tag.fontFamily).toMatch(/mono/i)
    await expect([tag.paddingLeft, tag.paddingTop, tag.columnGap]).toEqual(['6px', '2px', '4px'])
    await expect(box('loop').height).toBeCloseTo(20, 0)
    // The loop tag draws the set's LoopIcon (459:617) at 12 px in the tag's colour.
    const loopIcon = badgeIn('loop').querySelector('svg')
    const loopRef = canvas.getByTestId('ref-loop').querySelector('svg')
    if (!(loopIcon instanceof SVGSVGElement) || !(loopRef instanceof SVGSVGElement)) throw new Error('no loop icon')
    await expect(loopIcon.innerHTML).toBe(loopRef.innerHTML)
    await expect([loopIcon.getBoundingClientRect().width, loopIcon.getBoundingClientRect().height]).toEqual([12, 12])
    await expect(getComputedStyle(loopIcon).stroke).toBe(sw('needsYou').color)

    // Outline: surface.overlay, a 1 px border.default border, the tone's text, 22 high.
    const outline = style('uses')
    await expect(outline.backgroundColor).toBe(sw('overlay').backgroundColor)
    await expect(outline.borderTopColor).toBe(sw('border').color)
    await expect(outline.borderTopWidth).toBe('1px')
    await expect(outline.color).toBe(sw('needsYou').color)
    await expect(outline.borderTopLeftRadius).toBe('6px')
    await expect([outline.fontSize, outline.paddingLeft, outline.paddingTop, outline.columnGap]).toEqual(['12px', '6px', '2px', '6px'])
    await expect(outline.fontFamily).toMatch(/mono/i)
    await expect(box('uses').height).toBeCloseTo(22, 0)

    // Quiet: a bordered surface.overlay pill, fg.muted small text, 12 px icon.
    const quiet = style('read-only')
    await expect(quiet.backgroundColor).toBe(sw('overlay').backgroundColor)
    await expect(quiet.borderTopColor).toBe(sw('border').color)
    await expect(quiet.color).toBe(sw('muted').color)
    await expect([quiet.fontSize, quiet.fontWeight]).toEqual(['12px', '400'])
    await expect([quiet.paddingLeft, quiet.paddingTop, quiet.columnGap]).toEqual(['10px', '6px', '6px'])
    await expect(quiet.borderTopWidth).toBe('1px')
    await expect(parseFloat(quiet.borderTopLeftRadius)).toBeGreaterThanOrEqual(box('read-only').height / 2)
    await expect(box('read-only').height).toBeCloseTo(30, 0)
    const lock = badgeIn('read-only').querySelector('svg')
    if (!(lock instanceof SVGSVGElement)) throw new Error('no lock')
    await expect(lock.getBoundingClientRect().width).toBe(12)
  },
} satisfies Meta<typeof Badges>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
