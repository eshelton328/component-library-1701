import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from './button'
import { ScrollFrame } from './scroll-frame'
import { TextArea } from './text-field'

const page = css({ bg: 'bg.canvas', p: '24' })
// A box with a bounded height, as the AppShell detail gives the frame.
const box = css({ display: 'flex', flexDirection: 'column', h: 'shell.listPane', bg: 'surface.pane', borderRadius: 'xl', p: '16' })
// Each line clips, as a Card does: in a flex column it would shrink to fit instead of making the body scroll.
const line = css({ textStyle: 'body', color: 'fg.default', m: '0', py: '8', overflow: 'hidden' })
const lines = Array.from({ length: 30 }, (_, i) => `Message ${String(i + 1)}`)

function Frame({ gap = '12' }: { gap?: '0' | '12' }) {
  return (
    <main className={page}>
      <div className={box} data-testid="box">
        <ScrollFrame
          gap={gap}
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
    // No line shrinks to fit: each keeps the height of its text.
    for (const el of canvas.getAllByText(/^Message /)) await expect(el.clientHeight).toBe(el.scrollHeight)
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
    // The footer scrolls past its cap, so it clips: it leaves 4 px around the reply button for its focus ring.
    const footerBox = reply.parentElement?.getBoundingClientRect()
    if (footerBox === undefined) throw new Error('no footer')
    const button = reply.getBoundingClientRect()
    await expect(footerBox.top).toBeLessThanOrEqual(button.top - 4)
    await expect(footerBox.left).toBeLessThanOrEqual(button.left - 4)
    await expect(footerBox.bottom).toBeGreaterThanOrEqual(button.bottom + 4)
    // The last line is in view above the reply box, the first has scrolled out.
    const last = canvas.getByText('Message 30').getBoundingClientRect()
    await expect(last.bottom).toBeLessThanOrEqual(reply.getBoundingClientRect().top)
    await expect(canvas.getByText('Message 1').getBoundingClientRect().bottom).toBeLessThanOrEqual(back.getBoundingClientRect().bottom)
  },
} satisfies Meta<typeof Frame>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }

/**
 * With gap 0, as the Workbench chat pane has, the footer starts where the body ends: it does not lie over the
 * body, so the last line of the body is not under the reply box. The footer still keeps 4 px around the reply
 * button for its focus ring.
 */
export const GapZeroDark: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => <Frame gap="0" />,
  play: async (context) => {
    await meta.play(context)
    const canvas = within(context.canvasElement)
    const reply = canvas.getByRole('button', { name: 'Send a reply' })
    const footer = reply.parentElement
    const body = canvas.getByText('Message 1').parentElement
    if (footer === null || body === null) throw new Error('no frame')
    await expect(footer.getBoundingClientRect().top).toBeCloseTo(body.getBoundingClientRect().bottom, 1)
  },
}
export const GapZeroLight: StoryObj<typeof meta> = { ...GapZeroDark, globals: { mode: 'light' } }

// The footer clips, as a Card does: it keeps its height, so nothing in it is cut.
const clip = css({ overflow: 'hidden' })

function TallFooter() {
  return (
    <main className={page}>
      <div className={box} data-testid="box">
        <ScrollFrame
          gap="12"
          header={<Button size="sm">Back to the inbox</Button>}
          footer={
            <div data-testid="draft" className={clip}>
              <TextArea label="Reply" labelHidden rows={6} defaultValue="Draft" />
            </div>
          }
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

/**
 * A footer at rest that is more than 30% of a short frame, such as a Workbench composer (130 px) in a pane:
 * the frame does not cap the footer, so it keeps its height and nothing in it is cut. A Composer caps its own
 * long draft (Conversation/Composer, In a frame). Only a footer taller than the whole frame scrolls.
 */
export const TallFooterDark: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => <TallFooter />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const draft = canvas.getByTestId('draft')
    const footer = draft.parentElement
    const box = canvas.getByTestId('box')
    if (footer === null) throw new Error('no footer')
    // A frame of 280 px, as the Workspaces D5 side chat has: 30% of it is less than the footer.
    box.style.height = '280px'
    await new Promise((resolve) => requestAnimationFrame(resolve))
    const frame = footer.parentElement?.getBoundingClientRect().height ?? 0
    await expect(footer.getBoundingClientRect().height).toBeGreaterThan(frame * 0.3)
    await expect(footer.scrollHeight).toBe(footer.clientHeight)
    await expect(draft.clientHeight).toBe(draft.scrollHeight)
    // A box shorter than the footer (Codex review of #128): the footer stops at the frame and scrolls inside.
    box.style.height = '120px'
    await new Promise((resolve) => requestAnimationFrame(resolve))
    const frameBox = footer.parentElement?.getBoundingClientRect()
    if (frameBox === undefined) throw new Error('no frame')
    // The footer's 4 px ring space reaches 4 px past the frame by design, as it does at rest.
    await expect(footer.getBoundingClientRect().bottom).toBeLessThanOrEqual(frameBox.bottom + 4 + 1)
    await expect(footer.scrollHeight).toBeGreaterThan(footer.clientHeight)
    footer.scrollTop = footer.scrollHeight
    await expect(draft.getBoundingClientRect().bottom).toBeLessThanOrEqual(footer.getBoundingClientRect().bottom + 1)
  },
}
export const TallFooterLight: StoryObj<typeof meta> = { ...TallFooterDark, globals: { mode: 'light' } }
// Two frames side by side, each in a box that the play test makes shorter than its header and footer.
const pair = css({ display: 'flex', gap: '24', alignItems: 'flex-start' })
const half = css({ display: 'flex', flexDirection: 'column', flex: '1', h: 'shell.listPane', bg: 'surface.pane', borderRadius: 'xl', p: '16' })

function ShortFrame({ footerShrink, id }: { footerShrink?: boolean; id: string }) {
  return (
    <div className={half} data-testid={`${id}-box`}>
      <ScrollFrame
        gap="12"
        footerShrink={footerShrink}
        header={<Button size="sm">Back to the inbox</Button>}
        footer={
          <div data-testid={`${id}-draft`} className={clip}>
            <TextArea label="Reply" labelHidden rows={3} defaultValue="Draft" />
          </div>
        }
      >
        {lines.map((text) => (
          <p key={text} className={line}>
            {text}
          </p>
        ))}
      </ScrollFrame>
    </div>
  )
}

/**
 * `footerShrink={false}`, for a footer that caps its own height, such as a `Composer` with `layout="inline"` in
 * the Workbench D5 side chat: in a pane resized shorter than its header and footer, the footer keeps its full
 * height and only the body shrinks. Beside it, a frame with the default footer shrinks it and scrolls inside.
 */
export const FooterKeptDark: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={`${page} ${pair}`}>
      <ShortFrame id="kept" footerShrink={false} />
      <ShortFrame id="shrunk" />
    </main>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const parts = (id: string) => {
      const draft = canvas.getByTestId(`${id}-draft`)
      const footer = draft.parentElement
      const body = footer?.previousElementSibling
      if (footer === null || !(body instanceof HTMLElement)) throw new Error('no frame')
      return { box: canvas.getByTestId(`${id}-box`), draft, footer, body }
    }
    const kept = parts('kept')
    const shrunk = parts('shrunk')
    // At the box's full height both footers have their own height, and the bodies have room.
    const full = kept.footer.getBoundingClientRect().height
    await expect(shrunk.footer.getBoundingClientRect().height).toBeCloseTo(full, 1)
    const bodyBefore = kept.body.getBoundingClientRect().height
    await expect(bodyBefore).toBeGreaterThan(0)
    // A pane resized shorter than its header and footer.
    kept.box.style.height = '120px'
    shrunk.box.style.height = '120px'
    await new Promise((resolve) => requestAnimationFrame(resolve))
    // footerShrink false: the footer keeps its full height and does not scroll; the body took the loss.
    await expect(kept.footer.getBoundingClientRect().height).toBeCloseTo(full, 1)
    await expect(kept.footer.scrollHeight).toBe(kept.footer.clientHeight)
    await expect(kept.draft.clientHeight).toBe(kept.draft.scrollHeight)
    await expect(kept.body.getBoundingClientRect().height).toBeLessThan(bodyBefore)
    // The default: the footer shrinks to the room the header leaves and scrolls inside.
    await expect(shrunk.footer.getBoundingClientRect().height).toBeLessThan(full - 1)
    await expect(shrunk.footer.scrollHeight).toBeGreaterThan(shrunk.footer.clientHeight)
  },
}
export const FooterKeptLight: StoryObj<typeof meta> = { ...FooterKeptDark, globals: { mode: 'light' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
