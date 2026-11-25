import type { Meta, StoryObj } from '@storybook/react-vite'
import type { MouseEvent } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { atTextSize, textSizes, textSpills } from '../controls/text-size.testing'
import { FileChip, MentionChip } from './inline-chip'
import { MarkdownView } from './markdown-view'

const page = css({ bg: 'bg.canvas', p: '24' })
const column = css({ w: 'shell.listPane', bg: 'surface.pane' })
const accent = css({ bg: 'fg.accent' })

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
  // The text is the accent of a Markdown link; the path is mono, the name is not.
  const accentColour = getComputedStyle(canvas.getByTestId('accent')).backgroundColor
  await expect(getComputedStyle(file).color).toBe(accentColour)
  await expect(getComputedStyle(mention).color).toBe(accentColour)
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
