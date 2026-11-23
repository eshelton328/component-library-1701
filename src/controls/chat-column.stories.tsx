import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { css } from '../../styled-system/css'
import { ChatColumn, Stack } from './layout'

const page = css({ bg: 'bg.canvas' })
const narrow = css({ w: 'shell.listPane' })
// The Wide chat width of the-bridge's Settings: one column for a transcript and its reply box, in the middle.
const wideColumn = css({ maxW: 'shell.threadWide', mx: 'auto' })
const text = css({ textStyle: 'body', color: 'fg.default', m: '0' })

// The viewports of the stories: the 1440 px of the review frames and the owner's 3540 px screen.
const vp1440 = { w1440: { name: 'Desktop (1440)', styles: { width: '1440px', height: '900px' } } }
const vp3540 = { w3540: { name: 'Ultra-wide (3540)', styles: { width: '3540px', height: '1440px' } } }

function Columns() {
  return (
    <main className={page}>
      <Stack gap="24">
        <div data-testid="wide">
          <ChatColumn gap="12" data-testid="column">
            <p className={text}>A message in a chat column. On a wide screen the column stops at 768 px, in the middle.</p>
            <p className={text}>The reply box in its own column lines up with this message.</p>
          </ChatColumn>
        </div>
        <div data-testid="wide-setting">
          <div className={wideColumn} data-testid="column-wide">
            <p className={text}>With Chat width set to Wide the transcript and the reply box stop at 1040 px, in the middle.</p>
          </div>
        </div>
        <div className={narrow} data-testid="narrow">
          <ChatColumn data-testid="column-narrow">
            <p className={text}>In a narrower pane the column fills the pane.</p>
          </ChatColumn>
        </div>
      </Stack>
    </main>
  )
}

const box = (root: HTMLElement, id: string) => {
  const el = root.querySelector<HTMLElement>(`[data-testid="${id}"]`)
  if (el === null) throw new Error(`no ${id}`)
  return el.getBoundingClientRect()
}

// The column stops at shell.thread (768) in the middle of a wider parent, fills a narrower one, and its children stack 12 apart.
// The Wide setting's column stops at shell.threadWide (1040) in the middle the same way.
const play: Story['play'] = async ({ canvasElement }) => {
  const parent = box(canvasElement, 'wide')
  const column = box(canvasElement, 'column')
  await expect(column.width).toBe(Math.min(parent.width, 768))
  await expect(column.left - parent.left).toBe(parent.right - column.right)
  const wideParent = box(canvasElement, 'wide-setting')
  const wide = box(canvasElement, 'column-wide')
  await expect(wide.width).toBe(Math.min(wideParent.width, 1040))
  await expect(wide.left - wideParent.left).toBe(wideParent.right - wide.right)
  await expect(box(canvasElement, 'column-narrow').width).toBe(box(canvasElement, 'narrow').width)
  const el = canvasElement.querySelector<HTMLElement>('[data-testid="column"]')
  await expect(el === null ? '' : getComputedStyle(el).rowGap).toBe('12px')
}

const meta = {
  title: 'Layout/Chat column',
  component: Columns,
} satisfies Meta<typeof Columns>
export default meta
type Story = StoryObj<typeof meta>

/** At 1440 px the column is 768 wide, in the middle; the 420 px pane's column fills it. */
export const At1440Dark: Story = { parameters: { viewport: { options: vp1440 } }, globals: { mode: 'dark', viewport: { value: 'w1440' } }, play }
export const At1440Light: Story = { ...At1440Dark, globals: { mode: 'light', viewport: { value: 'w1440' } } }
/** At 3540 px the column still stops at 768, in the middle. */
export const At3540Dark: Story = { parameters: { viewport: { options: vp3540 } }, globals: { mode: 'dark', viewport: { value: 'w3540' } }, play }
export const At3540Light: Story = { ...At3540Dark, globals: { mode: 'light', viewport: { value: 'w3540' } } }
