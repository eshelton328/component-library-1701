import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from './button'
import { ScrollFrame } from './scroll-frame'

const page = css({ bg: 'bg.canvas', p: '24' })
// A box with a bounded height, as the AppShell detail gives the frame.
const box = css({ display: 'flex', flexDirection: 'column', h: 'shell.listPane', bg: 'surface.pane', borderRadius: 'xl', p: '16' })
const line = css({ textStyle: 'body', color: 'fg.default', m: '0', py: '8' })
const lines = Array.from({ length: 30 }, (_, i) => `Message ${String(i + 1)}`)

function Frame() {
  return (
    <main className={page}>
      <div className={box} data-testid="box">
        <ScrollFrame
          gap="12"
          header={<Button size="sm">Back to the inbox</Button>}
          footer={<Button variant="primary">Send a reply</Button>}
        >
          {lines.map((text) => (
            <p key={text} className={line}>
              {text}
            </p>
          ))}
        </ScrollFrame>
      </div>
    </main>
  )
}

const meta = {
  title: 'Layout/Scroll frame',
  component: Frame,
  /** Only the body scrolls: after it scrolls to the end, the header and the footer are still inside the box. */
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const box = canvas.getByTestId('box')
    const back = canvas.getByRole('button', { name: 'Back to the inbox' })
    const reply = canvas.getByRole('button', { name: 'Send a reply' })
    const body = canvas.getByText('Message 1').parentElement
    if (body === null) throw new Error('no body')
    // The box does not grow to its content: the body scrolls inside it.
    await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
    await expect(box.scrollHeight).toBe(box.clientHeight)
    await expect(body).toHaveAttribute('tabindex', '0')
    const inside = (el: Element) => {
      const r = el.getBoundingClientRect()
      const b = box.getBoundingClientRect()
      return r.top >= b.top && r.bottom <= b.bottom
    }
    const top = back.getBoundingClientRect().top
    body.scrollTop = body.scrollHeight
    body.dispatchEvent(new Event('scroll'))
    await expect(body.scrollTop).toBeGreaterThan(0)
    await expect(back.getBoundingClientRect().top).toBe(top)
    await expect(inside(back)).toBe(true)
    await expect(inside(reply)).toBe(true)
    // The last line is in view above the reply box, the first has scrolled out.
    const last = canvas.getByText('Message 30').getBoundingClientRect()
    await expect(last.bottom).toBeLessThanOrEqual(reply.getBoundingClientRect().top)
    await expect(canvas.getByText('Message 1').getBoundingClientRect().bottom).toBeLessThanOrEqual(back.getBoundingClientRect().bottom)
  },
} satisfies Meta<typeof Frame>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
