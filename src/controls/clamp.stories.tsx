import { StrictMode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, waitFor } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Clamp } from './clamp'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', display: 'grid', gap: '24', justifyItems: 'start' })
// The prompt box of an Inbox task (D1 346:370): a raised inset with body text.
const box = css({ w: 'shell.popover', py: '12', px: '16', bg: 'surface.inset', borderRadius: 'lg', textStyle: 'body' })

const prompt =
  'Rebuild the Inbox desktop frames from the component library. Read each frame in Figma first, list what the library cannot draw, and send those gaps to the library in one batched pull request. Until it ships, use the nearest part and note the difference in deviations.md. Keep every value on the 4 px grid, and check both modes before you ask for review.'

const onCut = fn<(cut: boolean) => void>()
const onFits = fn<(cut: boolean) => void>()

function Clamps() {
  return (
    <StrictMode>
    <main className={page}>
      <div className={box} data-testid="faded">
        <Clamp lines={4} fade onCutChange={onCut}>
          {prompt}
        </Clamp>
      </div>
      <div className={box} data-testid="ellipsis">
        <Clamp lines={2}>{prompt}</Clamp>
      </div>
      <div className={box} data-testid="short">
        <Clamp lines={4} fade onCutChange={onFits}>
          Fix the typo in the README.
        </Clamp>
      </div>
    </main>
    </StrictMode>
  )
}

const clampOf = (root: HTMLElement, id: string) => {
  const el = root.querySelector(`[data-testid="${id}"] > .clamp`)
  if (!(el instanceof HTMLElement)) throw new Error(`no clamp in ${id}`)
  return el
}

const meta = {
  title: 'Data display/Clamp',
  component: Clamps,
  beforeEach: () => {
    onCut.mockClear()
    onFits.mockClear()
  },
  play: async ({ canvasElement }) => {
    const faded = clampOf(canvasElement, 'faded')
    const line = parseFloat(getComputedStyle(faded).lineHeight)
    // Four lines show; the rest of the text is still in the page for copy and assistive technology.
    await expect(Math.round(faded.getBoundingClientRect().height)).toBe(Math.round(4 * line))
    await expect(faded.scrollHeight).toBeGreaterThan(faded.clientHeight)
    await expect(faded).toHaveTextContent(prompt)
    // A cut text with fade ends in a 40 px mask (Inbox D1 346:372), and the caller hears it is cut.
    await waitFor(() => expect(faded).toHaveAttribute('data-cut'))
    await expect(getComputedStyle(faded).maskImage).toContain('linear-gradient')
    await expect(getComputedStyle(faded).maskImage).toContain('40px')
    await waitFor(() => expect(onCut).toHaveBeenLastCalledWith(true))
    // Once per change, also under Strict Mode, which runs state updaters twice.
    await expect(onCut).toHaveBeenCalledTimes(1)
    // Without fade it is cut to its lines with no mask.
    const ellipsis = clampOf(canvasElement, 'ellipsis')
    await expect(Math.round(ellipsis.getBoundingClientRect().height)).toBe(Math.round(2 * line))
    await expect(getComputedStyle(ellipsis).maskImage).toBe('none')
    // A text that fits is not cut and does not fade.
    const short = clampOf(canvasElement, 'short')
    await expect(short).not.toHaveAttribute('data-cut')
    await expect(getComputedStyle(short).maskImage).toBe('none')
    await expect(onFits).not.toHaveBeenCalledWith(true)
  },
} satisfies Meta<typeof Clamps>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
