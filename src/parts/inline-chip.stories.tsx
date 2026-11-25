import type { Meta, StoryObj } from '@storybook/react-vite'
import type { MouseEvent } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { atTextSize, textSizes, textSpills } from '../controls/text-size.testing'
import { expectCutText } from '../controls/tooltip.testing'
import { FileChip, MentionChip } from './inline-chip'
import { MarkdownView } from './markdown-view'

const page = css({ bg: 'bg.canvas', p: '24' })
const column = css({ w: 'shell.listPane', bg: 'surface.pane' })
const accent = css({ bg: 'fg.accent' })
const textColour = css({ bg: 'fg.default' })

// The chips' press handler; each play clears it first.
const onOpen = fn()

const longPath = 'engine/projects/ncc-1701/handoffs/the-bridge-artifacts-loop-with-a-long-name.md'

// A chat message as the app draws it: the chips sit in the paragraphs of a MarkdownView, at its two sizes.
function Chips() {
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    onOpen()
  }
  return (
    <main className={page}>
      <div className={column} data-testid="column">
        {(['md', 'sm'] as const).map((size) => (
          <MarkdownView key={size} size={size}>
            <p>
              The renderer is <FileChip path="web/src/blocks/MarkdownText.tsx" line={42} href="#file" onClick={open} />;
              ask <MentionChip name="bridge-coord" href="#chat" onClick={open} /> before you change it.
            </p>
            <p>
              The loop notes are in <FileChip path={longPath} href="#long" onClick={open} />.
            </p>
          </MarkdownView>
        ))}
      </div>
      <div className={accent} data-testid="accent" />
      <div className={textColour} data-testid="text" />
    </main>
  )
}

const meta = {
  title: 'Data display/Inline chip',
  component: FileChip,
  args: { path: 'web/src/blocks/MarkdownText.tsx' },
} satisfies Meta<typeof FileChip>

export default meta

const chipsPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  onOpen.mockClear()
  // Each chip is a link named by its text; the file's line follows its path.
  const files = canvas.getAllByRole('link', { name: 'web/src/blocks/MarkdownText.tsx:42' })
  await expect(files).toHaveLength(2)
  const mentions = canvas.getAllByRole('link', { name: 'bridge-coord' })
  await expect(mentions).toHaveLength(2)
  const file = files[0]
  const mention = mentions[0]
  if (file === undefined || mention === undefined) throw new Error('no chips')
  // A file's text is the accent of a Markdown link; a chat's name is the text colour (R75). The path is mono, the
  // name is not.
  const accentColour = getComputedStyle(canvas.getByTestId('accent')).backgroundColor
  await expect(getComputedStyle(file).color).toBe(accentColour)
  await expect(getComputedStyle(mention).color).toBe(getComputedStyle(canvas.getByTestId('text')).backgroundColor)
  // The name keeps the text contrast of fg.default on the chip's fill, laid over the pane.
  const fill = painted(mention)
  await expect(fill[3]).toBe(1)
  await expect(contrast(rgb(getComputedStyle(mention).color), fill)).toBeGreaterThanOrEqual(4.5)
  const fileLabel = file.querySelector('.inline-chip__label')
  const mentionLabel = mention.querySelector('.inline-chip__label')
  if (fileLabel === null || mentionLabel === null) throw new Error('no labels')
  await expect(getComputedStyle(fileLabel).fontFamily).toContain('Mono')
  await expect(getComputedStyle(mentionLabel).fontFamily).not.toContain('Mono')
  // A press reaches the caller's handler.
  await userEvent.click(file)
  await userEvent.click(mention)
  await expect(onOpen).toHaveBeenCalledTimes(2)
  // Tab reaches the chip and draws the focus ring.
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  await userEvent.tab()
  await expect(file).toHaveFocus()
  await expect(getComputedStyle(file).outlineStyle).toBe('solid')
  // The long path wraps in the column: no text runs past it.
  await expect(textSpills(canvas.getByTestId('column'))).toEqual([])
  const longs = canvas.getAllByRole('link', { name: longPath })
  await expect(longs).toHaveLength(2)
  for (const long of longs) await expect(long.getClientRects().length).toBeGreaterThan(1)
}

const render: StoryObj<typeof meta>['render'] = () => <Chips />

/** A file chip and a mention chip in a message's text, at the two MarkdownView sizes. */
export const ChipsDark: StoryObj<typeof meta> = { render, play: chipsPlay, globals: { mode: 'dark' } }
export const ChipsLight: StoryObj<typeof meta> = { render, play: chipsPlay, globals: { mode: 'light' } }

// At Small, Default and Large (d-122, d-131) the chip's text takes the size of the text round it, the icon is 12 at
// Small and 16 at the larger sizes, and nothing runs past the column.
const textSizesPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const column = canvas.getByTestId('column')
  for (const size of textSizes) {
    await atTextSize(size, async () => {
      // Six chips: three in each of the two MarkdownViews.
      const chips = column.querySelectorAll('.inline-chip__root')
      await expect(chips).toHaveLength(6)
      for (const chip of chips) {
        const paragraph = chip.closest('p')
        const label = chip.querySelector('.inline-chip__label')
        const icon = chip.querySelector('.inline-chip__icon svg')
        if (paragraph === null || label === null || icon === null) throw new Error('no chip parts')
        await expect(getComputedStyle(label).fontSize).toBe(getComputedStyle(paragraph).fontSize)
        const box = icon.getBoundingClientRect()
        await expect([box.width, box.height]).toEqual(size === 'small' ? [12, 12] : [16, 16])
      }
      await expect(textSpills(column)).toEqual([])
    })
  }
}

/** The chips at Small, Default and Large. */
export const ChipsTextSizesDark: StoryObj<typeof meta> = { render, play: textSizesPlay, globals: { mode: 'dark', textSize: 'small' } }
export const ChipsTextSizesLight: StoryObj<typeof meta> = { render, play: textSizesPlay, globals: { mode: 'light', textSize: 'small' } }

/** An `rgb()` or `rgba()` colour as its four parts. */
function rgb(value: string): Rgba {
  const parts = value.match(/[\d.]+/g)?.map(Number)
  if (parts === undefined || parts.length < 3 || parts.some(Number.isNaN)) throw new Error(`not an rgb colour: ${value}`)
  const [r = 0, g = 0, b = 0, a = 1] = parts
  return [r, g, b, a]
}

type Rgba = [number, number, number, number]

/** Lays `top` over `under` (source-over), as the browser paints it. */
function over(top: Rgba, under: Rgba): Rgba {
  const a = top[3] + under[3] * (1 - top[3])
  if (a === 0) return [0, 0, 0, 0]
  const mix = (t: number, u: number) => (t * top[3] + u * under[3] * (1 - top[3])) / a
  return [mix(top[0], under[0]), mix(top[1], under[1]), mix(top[2], under[2]), a]
}

/** The colour behind an element's text: its own fill and its ancestors' fills, laid over each other. */
function painted(el: Element): Rgba {
  let colour: Rgba = [0, 0, 0, 0]
  for (let node: Element | null = el; node !== null && colour[3] < 1; node = node.parentElement) {
    colour = over(colour, rgb(getComputedStyle(node).backgroundColor))
  }
  return colour
}

/** WCAG 2 contrast ratio of two opaque colours. */
function contrast(a: readonly number[], b: readonly number[]) {
  const luminance = (c: readonly number[]) => {
    const [r = 0, g = 0, bl = 0] = c.slice(0, 3).map((v) => {
      const s = v / 255
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [hi = 0, lo = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// The words before the mention: each paragraph has one word more, so some paragraph puts the chip at a line end.
const filler = 'the next step waits for a review from'.split(' ')
const mentionParagraphs = Array.from({ length: 24 }, (_, n) => Array.from({ length: n + 1 }, (_, k) => filler[k % filler.length]).join(' '))

// Mentions at every place on a line in a narrow column (the owner's iPad, R75: "the chat bubble breaks over two
// lines. It should never break").
function MentionLineEnd() {
  return (
    <main className={page}>
      <div className={column} data-testid="column">
        <MarkdownView>
          {mentionParagraphs.map((words) => (
            <p key={words}>
              {words} <MentionChip name="bridge-workbench" href="#chat" /> before the merge.
            </p>
          ))}
        </MarkdownView>
      </div>
    </main>
  )
}

const mentionLineEndPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const column = canvas.getByTestId('column')
  for (const size of textSizes) {
    await atTextSize(size, async () => {
      const chips = canvas.getAllByRole('link', { name: 'bridge-workbench' })
      await expect(chips).toHaveLength(mentionParagraphs.length)
      let wrapped = 0
      for (const chip of chips) {
        const paragraph = chip.closest('p')
        if (paragraph === null) throw new Error('no paragraph')
        const lineHeight = Number.parseFloat(getComputedStyle(paragraph).lineHeight)
        // One box on one line: the chip never splits, and it makes its line no taller than the text's line height.
        await expect(chip.getClientRects()).toHaveLength(1)
        const box = chip.getBoundingClientRect()
        const lines = paragraph.getBoundingClientRect().height / lineHeight
        await expect(Math.abs(lines - Math.round(lines))).toBeLessThan(0.05)
        const top = paragraph.getBoundingClientRect().top
        if (box.left - paragraph.getBoundingClientRect().left < 1 && box.top - top > lineHeight / 2) wrapped += 1
        await expect(box.right).toBeLessThanOrEqual(column.getBoundingClientRect().right)
      }
      // At least one chip came at a line end and moved whole to the start of the next line.
      await expect(wrapped).toBeGreaterThan(0)
      await expect(textSpills(column)).toEqual([])
    })
  }
}

/** A mention at each place on a line: at a line end the chip moves whole to the next line, at each text size. */
export const MentionLineEndDark: StoryObj<typeof meta> = { render: () => <MentionLineEnd />, play: mentionLineEndPlay, globals: { mode: 'dark' } }
export const MentionLineEndLight: StoryObj<typeof meta> = { render: () => <MentionLineEnd />, play: mentionLineEndPlay, globals: { mode: 'light' } }

const longName = 'bridge-richtext-mentions-and-file-chips-in-a-very-long-chat-name-that-fills-the-column'

// A chat name wider than the column.
function MentionLongName() {
  return (
    <main className={page}>
      <div className={column} data-testid="column">
        <MarkdownView>
          <p>
            Ask <MentionChip name={longName} href="#chat" /> first.
          </p>
        </MarkdownView>
      </div>
    </main>
  )
}

const mentionLongNamePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const column = canvas.getByTestId('column')
  const chip = canvas.getByRole('link', { name: longName })
  // The chip stays one box inside the column, and the name ends with an ellipsis and shows whole in the tooltip.
  await expect(chip.getClientRects()).toHaveLength(1)
  await expect(chip.getBoundingClientRect().right).toBeLessThanOrEqual(column.getBoundingClientRect().right)
  await expectCutText(chip, longName, chip)
  await expect(textSpills(column)).toEqual([])
}

/** A chat name wider than the column ends with an ellipsis inside the chip. */
export const MentionLongNameDark: StoryObj<typeof meta> = { render: () => <MentionLongName />, play: mentionLongNamePlay, globals: { mode: 'dark' } }
export const MentionLongNameLight: StoryObj<typeof meta> = { render: () => <MentionLongName />, play: mentionLongNamePlay, globals: { mode: 'light' } }
