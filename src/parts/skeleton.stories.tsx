import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { expect, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Card } from './card'
import { GroupHeader } from './group-header'
import { KindMark } from './kind-mark'
import { KindTile } from './kind-tile'
import { ListRow } from './list-row'
import { Message } from './message'
import { Skeleton, SkeletonGroup } from './skeleton'
import {
  ArtifactCardSkeleton,
  ArtifactRowSkeleton,
  ChatRowSkeleton,
  DetailBodySkeleton,
  GroupHeaderSkeleton,
  InboxRowSkeleton,
  TranscriptEntrySkeleton,
} from './skeleton-rows'
import { StatusPill } from './status-pill'
import { Thumbnail } from './thumbnail'

// The Skeleton part and the loading presets (the loading standard, 2026-11-23). Each preset stands beside the
// part that replaces it, and the plays check that both have the same height, so nothing moves when content comes.
const page = css({ bg: 'bg.canvas', p: '24', display: 'grid', gap: '16', justifyItems: 'start' })
const pane = css({ bg: 'surface.pane', p: '16', borderRadius: 'xl', display: 'grid', gap: '12', w: 'shell.detail' })
const heading = css({ textStyle: 'eyebrow', color: 'fg.muted' })
const pair = css({ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16', alignItems: 'start' })
const styles = {
  body: css({ textStyle: 'body' }),
  label: css({ textStyle: 'label' }),
  mono: css({ textStyle: 'mono' }),
  paneTitle: css({ textStyle: 'paneTitle' }),
}
const swatches = { base: css({ bg: 'skeleton.base' }) }

function Shapes() {
  return (
    <main className={page}>
      <div className={pane}>
        <span className={heading}>Lines in each text style</span>
        {Object.entries(styles).map(([name, className]) => (
          <div key={name} className={pair} data-pair={`line-${name}`}>
            <span className={className} data-side="real">
              Sample {name} text
            </span>
            <span className={className} data-side="skeleton">
              <Skeleton width="long" />
            </span>
          </div>
        ))}
        <span className={heading}>Widths</span>
        <SkeletonGroup label="Loading the sample lines">
          <Skeleton width="full" />
          <Skeleton width="long" />
          <Skeleton width="half" />
          <Skeleton width="short" />
        </SkeletonGroup>
        <span className={heading}>Blocks and circles</span>
        <div className={css({ display: 'flex', gap: '12', alignItems: 'center' })}>
          <span data-testid="tile">
            <Skeleton shape="block" size="kindTileSm" />
          </span>
          <Skeleton shape="block" size="kindTileLg" />
          <Skeleton shape="block" size="thumbnailSm" />
          <Skeleton shape="block" size="thumbnailMd" />
          <Skeleton shape="block" size="thumbnailLg" />
          <span data-testid="circle">
            <Skeleton shape="circle" size="icon16" />
          </span>
          <Skeleton shape="circle" size="icon24" />
        </div>
      </div>
      <div hidden>
        <span data-swatch="base" className={swatches.base} />
      </div>
    </main>
  )
}

const height = (el: Element) => Math.round(el.getBoundingClientRect().height * 100) / 100
const sides = (root: HTMLElement, name: string) => {
  const real = root.querySelector(`[data-pair="${name}"] [data-side="real"]`)
  const skeleton = root.querySelector(`[data-pair="${name}"] [data-side="skeleton"]`)
  if (real === null || skeleton === null) throw new Error(`no pair ${name}`)
  return { real, skeleton }
}
const swatch = (root: HTMLElement) => {
  const el = root.querySelector('[data-swatch="base"]')
  if (el === null) throw new Error('no swatch')
  return getComputedStyle(el).backgroundColor
}
const reduceMotion = async (on: boolean) => {
  const { cdp } = await import('vitest/browser')
  await cdp().send('Emulation.setEmulatedMedia', { media: '', features: on ? [{ name: 'prefers-reduced-motion', value: 'reduce' }] : [] })
}

const meta = {
  title: 'Status/Skeleton',
  component: Shapes,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // A line is one line of the text style it sits in: the same height as the text, so nothing moves.
    for (const name of Object.keys(styles)) {
      const { real, skeleton } = sides(canvasElement, `line-${name}`)
      await expect(height(skeleton)).toBe(height(real))
    }
    // The bar of a line, a block and a circle take skeleton.base and shimmer with duration.shimmer, on and on.
    const line = canvasElement.querySelector('[data-pair="line-body"] [data-skeleton="line"]')
    const tile = canvasElement.querySelector('[data-testid="tile"] [data-skeleton="block"]')
    const circle = canvasElement.querySelector('[data-testid="circle"] [data-skeleton="circle"]')
    if (line === null || tile === null || circle === null) throw new Error('no shapes')
    const bar = getComputedStyle(line, '::before')
    await expect([bar.backgroundColor, bar.animationName, bar.animationDuration, bar.animationIterationCount]).toEqual([swatch(canvasElement), 'shimmer', '1.6s', 'infinite'])
    // The bar is the line less 4 above and below.
    await expect(parseFloat(bar.height)).toBe(height(line) - 8)
    for (const el of [tile, circle]) {
      const s = getComputedStyle(el)
      await expect([s.backgroundColor, s.animationName]).toEqual([swatch(canvasElement), 'shimmer'])
    }
    await expect([height(tile), Math.round(tile.getBoundingClientRect().width)]).toEqual([28, 28])
    await expect(getComputedStyle(circle).borderRadius).not.toBe('0px')
    // The skeletons are hidden from assistive technology. Their group is a status named by its label that is
    // never busy (aria-busy stops the announcement) and says the label as text once it is in place.
    await expect(line.getAttribute('aria-hidden')).toBe('true')
    const group = canvas.getByRole('status', { name: 'Loading the sample lines' })
    await expect(group.getAttribute('aria-busy')).toBeNull()
    await waitFor(() => expect(group).toHaveTextContent('Loading the sample lines'))
  },
} satisfies Meta<typeof Shapes>

export default meta
type Story = StoryObj<typeof meta>

export const Dark: Story = { globals: { mode: 'dark' } }
export const Light: Story = { globals: { mode: 'light' } }

// With prefers-reduced-motion, every shape is a still block of skeleton.base: no shimmer, no band. Its
// emulation needs the test runner's DevTools session (vitest/browser), so '!dev' keeps the story out of the
// Storybook UI; the test runner still runs it. Storybook reads the tags without running this file, so they are literal.
export const ReduceMotion: Story = {
  tags: ['!dev'],
  globals: { mode: 'dark' },
  beforeEach: async () => {
    await reduceMotion(true)
    return async () => {
      await reduceMotion(false)
    }
  },
  play: async ({ canvasElement }) => {
    const line = canvasElement.querySelector('[data-pair="line-body"] [data-skeleton="line"]')
    const tile = canvasElement.querySelector('[data-testid="tile"] [data-skeleton="block"]')
    if (line === null || tile === null) throw new Error('no shapes')
    const bar = getComputedStyle(line, '::before')
    await expect([bar.animationName, bar.backgroundImage, bar.backgroundColor]).toEqual(['none', 'none', swatch(canvasElement)])
    const block = getComputedStyle(tile)
    await expect([block.animationName, block.backgroundImage, block.backgroundColor]).toEqual(['none', 'none', swatch(canvasElement)])
  },
}

function Pair({ name, real, skeleton }: { name: string; real: ReactNode; skeleton: ReactNode }) {
  return (
    <div className={pair} data-pair={name}>
      <div data-side="real">
        {real}
      </div>
      <div data-side="skeleton">
        {skeleton}
      </div>
    </div>
  )
}

// Each preset beside the part it stands for, with sample content made up for the story.
function Presets() {
  return (
    <main className={page}>
      <SkeletonGroup label="Loading the sample presets">
        <div className={pane}>
          <span className={heading}>Inbox</span>
          <Pair name="group" real={<GroupHeader label="Needs you" count={2} />} skeleton={<GroupHeaderSkeleton />} />
          <Pair
            name="inbox-row"
            real={<ListRow density="compact" title="Sample question" meta="chat" leading={<KindTile kind="question" />} trailing="5m" />}
            skeleton={<InboxRowSkeleton />}
          />
          <Pair
            name="inbox-row-phone"
            real={<ListRow density="compact" padding="phoneSides" title="Sample question" meta="chat" leading={<KindTile kind="question" />} trailing="5m" />}
            skeleton={<InboxRowSkeleton phone />}
          />
          <span className={heading}>Workspaces</span>
          <Pair name="sidebar-group" real={<GroupHeader variant="sidebar" label="live work" count={3} />} skeleton={<GroupHeaderSkeleton variant="sidebar" />} />
          <Pair
            name="chat-row"
            real={<ListRow variant="sidebar" density="compact" title="plan the slice" meta="Opus 5.5" leading={<KindMark kind="claude" size="16" />} trailing={<StatusPill label="Idle" tone="idle" dot />} />}
            skeleton={<ChatRowSkeleton />}
          />
          <Pair name="prompt" real={<Message from="user">Fix the build</Message>} skeleton={<TranscriptEntrySkeleton from="user" />} />
          <span className={heading}>Artifacts</span>
          <Pair name="artifact-row" real={<ListRow title="Sample plan" meta="Claude · 30m" leading={<Thumbnail kind="doc" size="sm" />} />} skeleton={<ArtifactRowSkeleton />} />
          <Pair name="artifact-row-phone" real={<ListRow title="Sample plan" meta="Claude · 30m" leading={<Thumbnail kind="doc" size="md" />} />} skeleton={<ArtifactRowSkeleton size="md" />} />
          <Pair
            name="artifact-card"
            real={<Card title="Sample plan" description="A plan, made up for the story" media={<Thumbnail kind="doc" />} meta="Claude · 30m" />}
            skeleton={<ArtifactCardSkeleton />}
          />
          <span className={heading}>Replies and detail bodies (no twin: their height follows the text)</span>
          <TranscriptEntrySkeleton />
          <TranscriptEntrySkeleton kind="codex" />
          <div className={styles.body}>
            <DetailBodySkeleton />
          </div>
        </div>
      </SkeletonGroup>
    </main>
  )
}

const pairs = ['group', 'inbox-row', 'inbox-row-phone', 'sidebar-group', 'chat-row', 'prompt', 'artifact-row', 'artifact-row-phone', 'artifact-card']

const presetPlay: Story['play'] = async ({ canvasElement }) => {
  // Each preset has the height of the part that replaces it.
  for (const name of pairs) {
    const { real, skeleton } = sides(canvasElement, name)
    await expect({ name, height: height(skeleton) }).toEqual({ name, height: height(real) })
  }
  // A loading row is not a button and draws no title text.
  const row = canvasElement.querySelector('[data-pair="inbox-row"] [data-side="skeleton"] .list-row__root')
  if (row === null) throw new Error('no loading row')
  await expect(row.hasAttribute('data-loading')).toBe(true)
  await expect(row.querySelector('button')).toBeNull()
  // A loading card's title line takes 3/4 of the free width of its title row, not the width of no text.
  const title = canvasElement.querySelector('[data-pair="artifact-card"] [data-side="skeleton"] .card__titleRow')
  const bar = title?.querySelector('[data-skeleton="line"]')
  if (title === null || bar === null || bar === undefined) throw new Error('no loading card title')
  await expect(Math.round(bar.getBoundingClientRect().width)).toBe(Math.round(title.getBoundingClientRect().width * 0.75))
}

export const PresetsDark: Story = { render: () => <Presets />, globals: { mode: 'dark' }, play: presetPlay }
export const PresetsLight: Story = { render: () => <Presets />, globals: { mode: 'light' }, play: presetPlay }
