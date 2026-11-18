import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Container } from '../controls/layout'
import { AppShell } from './app-shell'
import { DetailSplit } from './detail-split'

const text = css({ textStyle: 'body', color: 'fg.default', m: '0' })
const side = css({ display: 'flex', flexDirection: 'column', flex: '1', bg: 'surface.pane', p: '16' })

// The viewports of the stories: the 1440 px of the review frames, a 1920 px screen and Erik's 3540 px screen.
const vp1440 = { w1440: { name: 'Desktop (1440)', styles: { width: '1440px', height: '900px' } } }
const vp1920 = { w1920: { name: 'Wide (1920)', styles: { width: '1920px', height: '1080px' } } }
const vp3540 = { w3540: { name: 'Ultra-wide (3540)', styles: { width: '3540px', height: '1440px' } } }

const vp768 = { w768: { name: 'Narrow pane (768)', styles: { width: '768px', height: '900px' } } }

function Split({ open = true }: { open?: boolean }) {
  return (
    <AppShell
      detail={
        <DetailSplit
          side={
            open && (
              <section className={side} data-testid="side" aria-label="Discussion">
                <p className={text}>The side pane, such as the task's discussion.</p>
              </section>
            )
          }
        >
          <Container size="detail" data-testid="item">
            <p className={text}>
              The open item, in its detail column. The item keeps the width of its content, as a task with a long
              prompt does, so this paragraph is long enough to fill the column at every width: below a 1600 px space
              the column is 748 px wide and from it 1024 px, and its lines break inside it.
            </p>
          </Container>
        </DetailSplit>
      }
    />
  )
}

const box = (root: HTMLElement, id: string) => {
  const el = root.querySelector<HTMLElement>(`[data-testid="${id}"]`)
  if (el === null) throw new Error(`no ${id}`)
  return el
}

// The item column and the side pane, in px: the item's Container, the item slot and the side pane.
const splitAt =
  (expected: { column: number; item: number; side: number }): NonNullable<Story['play']> =>
  async ({ canvasElement }) => {
    const column = box(canvasElement, 'item').getBoundingClientRect()
    const item = box(canvasElement, 'item').parentElement?.getBoundingClientRect()
    const pane = box(canvasElement, 'side').getBoundingClientRect()
    if (item === undefined) throw new Error('no item slot')
    await expect(column.width).toBe(expected.column)
    await expect(item.width).toBe(expected.item)
    await expect(pane.width).toBe(expected.side)
    // The side starts where the item ends, and the column sits in the middle of the item when it is wider.
    await expect(pane.left).toBe(item.right)
    await expect(column.left - item.left).toBe(item.right - column.right)
  }

const meta = {
  title: 'Layout/Detail split',
  component: Split,
} satisfies Meta<typeof Split>
export default meta
type Story = StoryObj<typeof meta>

/** At 1440 px the item keeps its 828 px column and the side takes the other 612, as in Inbox D14. */
export const At1440Dark: Story = {
  parameters: { viewport: { options: vp1440 } },
  globals: { mode: 'dark', viewport: { value: 'w1440' } },
  play: splitAt({ column: 828, item: 828, side: 612 }),
}
export const At1440Light: Story = { ...At1440Dark, globals: { mode: 'light', viewport: { value: 'w1440' } } }
/** At 1920 px the column is 1104 wide and the side takes the other 816, under its 1108 cap. */
export const At1920Dark: Story = {
  parameters: { viewport: { options: vp1920 } },
  globals: { mode: 'dark', viewport: { value: 'w1920' } },
  play: splitAt({ column: 1104, item: 1104, side: 816 }),
}
export const At1920Light: Story = { ...At1920Dark, globals: { mode: 'light', viewport: { value: 'w1920' } } }
/** At 3540 px the side stops at 1108 (shell.discussionPane) and the item takes the rest, its column in the middle. */
export const At3540Dark: Story = {
  parameters: { viewport: { options: vp3540 } },
  globals: { mode: 'dark', viewport: { value: 'w3540' } },
  play: splitAt({ column: 1104, item: 2432, side: 1108 }),
}
export const At3540Light: Story = { ...At3540Dark, globals: { mode: 'light', viewport: { value: 'w3540' } } }

// With the side closed (`side={false}`) there is no side element, and the item fills a narrow pane without a sideways scroll.
const closedAt768: NonNullable<Story['play']> = async ({ canvasElement }) => {
  const column = box(canvasElement, 'item')
  const item = column.parentElement
  if (item === null) throw new Error('no item slot')
  await expect(item.parentElement?.children.length).toBe(1)
  await expect(item.getBoundingClientRect().width).toBe(768)
  await expect(column.getBoundingClientRect().width).toBe(768)
  const detail = item.parentElement?.parentElement
  await expect(detail === null || detail === undefined ? -1 : detail.scrollWidth - detail.clientWidth).toBe(0)
}

/** A closed side in a 768 px window: the item and its column are 768 wide, and nothing scrolls sideways. */
export const ClosedAt768Dark: Story = {
  render: () => <Split open={false} />,
  parameters: { viewport: { options: vp768 } },
  globals: { mode: 'dark', viewport: { value: 'w768' } },
  play: closedAt768,
}
export const ClosedAt768Light: Story = { ...ClosedAt768Dark, globals: { mode: 'light', viewport: { value: 'w768' } } }
