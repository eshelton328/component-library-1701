import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Highlight } from './highlight'
import { Stack } from './layout'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24' })
const pane = css({ bg: 'surface.pane', p: '12', borderRadius: 'xl', w: 'shell.listPane' })
const title = css({ textStyle: 'label', color: 'fg.default' })
const description = css({ textStyle: 'small', color: 'fg.muted' })
const accent = css({ color: 'fg.accent' })

function Results() {
  return (
    <main className={page}>
      <div className={pane}>
        <Stack gap="8">
          <span className={title} data-testid="title">
            <Highlight text="Skill eval pass rates" query="eval" />
          </span>
          <span className={description} data-testid="description">
            <Highlight text="The cold-reader Eval of the readme skill, and its EVAL cases" query="eval" />
          </span>
          <span className={description} data-testid="case">
            <Highlight text="The cold-reader Eval of the readme skill" query="eval" ignoreCase={false} />
          </span>
          <span className={description} data-testid="many">
            <Highlight text="ncc-1701 · f-005 · NCC-31" query={['f-005', 'NCC-31']} />
          </span>
          <span className={description} data-testid="special">
            <Highlight text="Costs (a+b)? in $ for 1.5x" query="(a+b)?" />
          </span>
          <span className={description} data-testid="none">
            <Highlight text="Pick the header logo" query="" />
          </span>
        </Stack>
      </div>
      <span hidden data-swatch="accent" className={accent} />
    </main>
  )
}

const marks = (el: HTMLElement) => Array.from(el.querySelectorAll('mark'), (mark) => mark.textContent)

const meta = {
  title: 'Data display/Highlight',
  component: Results,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const accentColour = getComputedStyle(canvasElement.querySelector('[data-swatch="accent"]') ?? canvasElement).color
    // Figma Artifacts D4 403:8232: the match is fg.accent, semibold and underlined, with no fill.
    const titleText = canvas.getByTestId('title')
    await expect(titleText).toHaveTextContent('Skill eval pass rates')
    await expect(marks(titleText)).toEqual(['eval'])
    const mark = titleText.querySelector('mark')
    if (mark === null) throw new Error('no mark')
    const s = getComputedStyle(mark)
    await expect([s.color, s.fontWeight, s.textDecorationLine, s.backgroundColor]).toEqual([accentColour, '600', 'underline', 'rgba(0, 0, 0, 0)'])
    // The mark keeps the size of the text around it.
    await expect(s.fontSize).toBe(getComputedStyle(titleText).fontSize)
    // Case is ignored by default, and each match is marked as written.
    await expect(marks(canvas.getByTestId('description'))).toEqual(['Eval', 'EVAL'])
    await expect(marks(canvas.getByTestId('case'))).toEqual([])
    // Several queries, and characters that mean something in a regular expression, match as plain text.
    await expect(marks(canvas.getByTestId('many'))).toEqual(['f-005', 'NCC-31'])
    await expect(marks(canvas.getByTestId('special'))).toEqual(['(a+b)?'])
    // An empty query marks nothing; the text stays whole.
    await expect(marks(canvas.getByTestId('none'))).toEqual([])
    await expect(canvas.getByTestId('none')).toHaveTextContent('Pick the header logo')
  },
} satisfies Meta<typeof Results>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const metaLine = css({ textStyle: 'monoSm', color: 'fg.muted' })

// The Inbox D10 search results (346:4236): the query in a meta line is #5ee1ff only, with the weight and line of the
// text around it.
function ColourResults() {
  return (
    <main className={page}>
      <div className={pane}>
        <span className={metaLine} data-testid="meta">
          <Highlight text="ncc-1701 · f-005 · NCC-31" query="f-005" variant="colour" />
        </span>
      </div>
      <span hidden data-swatch="accent" className={accent} />
    </main>
  )
}

const colourPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const line = within(canvasElement).getByTestId('meta')
  await expect(line).toHaveTextContent('ncc-1701 · f-005 · NCC-31')
  await expect(marks(line)).toEqual(['f-005'])
  const mark = line.querySelector('mark')
  if (mark === null) throw new Error('no mark')
  const m = getComputedStyle(mark)
  const around = getComputedStyle(line)
  await expect(m.color).toBe(getComputedStyle(canvasElement.querySelector('[data-swatch="accent"]') ?? canvasElement).color)
  await expect([m.fontWeight, m.textDecorationLine, m.backgroundColor]).toEqual([around.fontWeight, 'none', 'rgba(0, 0, 0, 0)'])
}

/** `variant="colour"`: the match in the accent colour only, as Inbox D10 marks the query in meta lines. */
export const ColourDark: StoryObj<typeof meta> = { render: () => <ColourResults />, play: colourPlay, globals: { mode: 'dark' } }
export const ColourLight: StoryObj<typeof meta> = { render: () => <ColourResults />, play: colourPlay, globals: { mode: 'light' } }
