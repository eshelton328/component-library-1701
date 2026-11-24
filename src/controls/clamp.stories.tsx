import { StrictMode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, waitFor } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Clamp } from './clamp'
import { atTextSize, textSizes, textSpills } from './text-size.testing'

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

// The Inbox prompt (M10 `fade` 346:11014, M2 346:9300): five lines, cut by height, with no ellipsis under the fade.
function Fades() {
  return (
    <main className={page}>
      <div className={box} data-testid="faded">
        <Clamp lines={5} fade>
          {prompt}
        </Clamp>
      </div>
      <div className={box} data-testid="ellipsis">
        <Clamp lines={2}>{prompt}</Clamp>
      </div>
    </main>
  )
}

const fadePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const faded = clampOf(canvasElement, 'faded')
  const style = getComputedStyle(faded)
  const line = parseFloat(style.lineHeight)
  // A fade cuts at the height of its five lines, not with line-clamp, so Chrome draws no "…" at the end.
  await expect(style.webkitLineClamp).toBe('none')
  await expect(style.display).toBe('block')
  await expect(style.overflow).toBe('hidden')
  await expect(Math.round(parseFloat(style.maxHeight))).toBe(Math.round(5 * line))
  await expect(Math.round(faded.getBoundingClientRect().height)).toBe(Math.round(5 * line))
  await expect(faded.scrollHeight).toBeGreaterThan(faded.clientHeight)
  await waitFor(() => expect(faded).toHaveAttribute('data-cut'))
  await expect(getComputedStyle(faded).maskImage).toContain('40px')
  // Without fade the text still ends in an ellipsis on its last line.
  const ellipsis = getComputedStyle(clampOf(canvasElement, 'ellipsis'))
  await expect(ellipsis.webkitLineClamp).toBe('2')
  await expect(ellipsis.maxHeight).toBe('none')
}

// Figma keeps the Inbox prompt box at five lines' height for a prompt of three (D16 403:1854). With `reserve` a short
// text keeps the height of its lines; without it the block hugs the text.
function Reserves() {
  return (
    <main className={page}>
      <div className={box} data-testid="reserved">
        <Clamp lines={5} fade reserve>
          Fix the typo in the README.
        </Clamp>
      </div>
      <div className={box} data-testid="hugged">
        <Clamp lines={5} fade>
          Fix the typo in the README.
        </Clamp>
      </div>
      <div className={box} data-testid="long">
        <Clamp lines={5} fade reserve>
          {prompt}
        </Clamp>
      </div>
    </main>
  )
}

const reservePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const reserved = clampOf(canvasElement, 'reserved')
  const line = parseFloat(getComputedStyle(reserved).lineHeight)
  await expect(Math.round(reserved.getBoundingClientRect().height)).toBe(Math.round(5 * line))
  await expect(reserved).not.toHaveAttribute('data-cut')
  const hugged = clampOf(canvasElement, 'hugged')
  await expect(Math.round(hugged.getBoundingClientRect().height)).toBe(Math.round(line))
  // A long text is still cut at five lines and fades.
  const long = clampOf(canvasElement, 'long')
  await expect(Math.round(long.getBoundingClientRect().height)).toBe(Math.round(5 * line))
  await waitFor(() => expect(long).toHaveAttribute('data-cut'))
}

export const ReserveDark: StoryObj<typeof meta> = { globals: { mode: 'dark' }, render: () => <Reserves />, play: reservePlay }
export const ReserveLight: StoryObj<typeof meta> = { globals: { mode: 'light' }, render: () => <Reserves />, play: reservePlay }

export const FadeDark: StoryObj<typeof meta> = { globals: { mode: 'dark' }, render: () => <Fades />, play: fadePlay }
export const FadeLight: StoryObj<typeof meta> = { globals: { mode: 'light' }, render: () => <Fades />, play: fadePlay }

// The Inbox prompt (PromptSection: `lines={wide ? 8 : 5} fade reserve`). Each box holds the prompt cut after more
// words; the play takes the ones that fit their lines at Small and checks that none of them is cut at Default or Large.
const longPrompt = `${prompt} ${prompt}`
const words = longPrompt.split(' ')
const prefixes = words.map((_, i) => words.slice(0, i + 1).join(' ')).filter((_, i) => i % 2 === 1)

function PromptAtSizes({ lines }: { lines: 5 | 8 }) {
  return (
    <main className={page}>
      {prefixes.map((text) => (
        <div key={text} className={box} data-testid="prefix">
          <Clamp lines={lines} fade reserve>
            {text}
          </Clamp>
        </div>
      ))}
      {([1, 2, 3, 4, 5, 6, 8] as const).map((n) => (
        <div key={n} className={box} data-testid={`lines-${String(n)}`}>
          <Clamp lines={n} fade reserve>
            {longPrompt}
          </Clamp>
        </div>
      ))}
    </main>
  )
}

// The lines at each size: N at Small, ceil(N × 8/7) at Default and ceil(N × 64/49) at Large (d-122).
const scaledLines = { small: (n: number) => n, default: (n: number) => Math.ceil((n * 8) / 7), large: (n: number) => Math.ceil((n * 64) / 49) }

const promptAtSizesPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const clamps = Array.from(canvasElement.querySelectorAll('[data-testid="prefix"] > .clamp')).filter((el) => el instanceof HTMLElement)
  const cut = (el: HTMLElement) => el.scrollHeight - el.clientHeight > 1
  let fits: HTMLElement[] = []
  for (const size of textSizes) {
    await atTextSize(size, async () => {
      for (const n of [1, 2, 3, 4, 5, 6, 8]) {
        const el = clampOf(canvasElement, `lines-${String(n)}`)
        const line = parseFloat(getComputedStyle(el).lineHeight)
        await expect({ n, size, lines: Math.round(el.getBoundingClientRect().height / line) }).toEqual({ n, size, lines: scaledLines[size](n) })
      }
      if (size === 'small') {
        fits = clamps.filter((el) => !cut(el))
        // Some prompts fit and the longest do not, so the check below has texts that just fit.
        await expect(fits.length).toBeGreaterThan(0)
        await expect(fits.length).toBeLessThan(clamps.length)
        return
      }
      // A prompt that fits at Small is never cut at Default or Large.
      for (const el of fits) {
        await expect({ size, text: el.textContent, cut: cut(el) }).toEqual({ size, text: el.textContent, cut: false })
        await expect(textSpills(el)).toEqual([])
      }
    })
  }
}

/** A five-line prompt at Small, Default and Large: its lines grow with the text, so a prompt that fits stays whole. */
export const PromptTextSizesDark: StoryObj<typeof meta> = { render: () => <PromptAtSizes lines={5} />, play: promptAtSizesPlay, globals: { mode: 'dark', textSize: 'small' } }
export const PromptTextSizesLight: StoryObj<typeof meta> = { render: () => <PromptAtSizes lines={5} />, play: promptAtSizesPlay, globals: { mode: 'light', textSize: 'small' } }
/** The wide eight-line prompt at Small, Default and Large. */
export const WidePromptTextSizesDark: StoryObj<typeof meta> = { render: () => <PromptAtSizes lines={8} />, play: promptAtSizesPlay, globals: { mode: 'dark', textSize: 'small' } }
export const WidePromptTextSizesLight: StoryObj<typeof meta> = { render: () => <PromptAtSizes lines={8} />, play: promptAtSizesPlay, globals: { mode: 'light', textSize: 'small' } }
