import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Inline } from '../controls/layout'
import { StatusPill } from './status-pill'

const page = css({ bg: 'bg.canvas', p: '24', display: 'grid', gap: '16', justifyItems: 'start' })
const pane = css({ bg: 'surface.pane', p: '16', borderRadius: 'xl' })

const tones = ['working', 'running', 'needsYou', 'idle', 'done', 'danger'] as const
// The labels the pages drew, each with the tone it takes.
const pills = [
  { label: 'Working', tone: 'working', dot: true },
  { label: 'Running', tone: 'running', dot: true },
  { label: 'Needs you', tone: 'needsYou', dot: true },
  { label: 'Idle', tone: 'idle' },
  { label: 'Done', tone: 'done' },
  { label: 'Next step', tone: 'working' },
  { label: 'Recommended', tone: 'done' },
  { label: 'Edited', tone: 'needsYou' },
  { label: 'New', tone: 'running' },
  { label: 'Failed', tone: 'danger' },
] as const

function Pills() {
  return (
    <main className={page}>
      <Inline wrap gap="8">
        {pills.map((p) => (
          <StatusPill key={p.label} {...p} />
        ))}
      </Inline>
      <div className={pane}>
        <Inline wrap gap="8">
          {tones.map((t) => (
            <span key={t} data-testid={`tone-${t}`}>
              <StatusPill tone={t} label={t} />
            </span>
          ))}
        </Inline>
      </div>
    </main>
  )
}

const meta = {
  title: 'Status/Status pill',
  component: Pills,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // The tones come from a list, so their CSS comes only from staticCss; each has its own colours.
    const pillOf = (t: string) => {
      const el = canvas.getByTestId(`tone-${t}`).firstElementChild
      if (!(el instanceof HTMLElement)) throw new Error(`no pill for ${t}`)
      return getComputedStyle(el)
    }
    await expect(new Set(tones.map((t) => pillOf(t).color)).size).toBe(6)
    await expect(new Set(tones.map((t) => pillOf(t).backgroundColor)).size).toBe(6)
    await expect(new Set(tones.map((t) => pillOf(t).borderTopColor)).size).toBe(6)
    const dot = canvas.getByText('Running').querySelector('[data-dot]')
    if (!(dot instanceof HTMLElement)) throw new Error('no dot')
    await expect(dot.getBoundingClientRect().width).toBe(6)
    await expect(getComputedStyle(dot).backgroundColor).toBe(getComputedStyle(canvas.getByText('Running')).color)
    await expect(canvas.getByText('Idle').querySelector('[data-dot]')).toBeNull()
    // The pill text style: Medium 11/16.
    const idle = getComputedStyle(canvas.getByText('Idle'))
    await expect([idle.fontSize, idle.fontWeight]).toEqual(['11px', '500'])
    await expect(parseFloat(idle.lineHeight)).toBeCloseTo(16, 1)
  },
} satisfies Meta<typeof Pills>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
