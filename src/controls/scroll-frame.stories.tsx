import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
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
    // The footer stays inside the frame: it does not reach past its sides or its bottom.
    const footerBox = reply.parentElement?.getBoundingClientRect()
    const frameBox = reply.parentElement?.parentElement?.getBoundingClientRect()
    if (footerBox === undefined || frameBox === undefined) throw new Error('no footer')
    await expect(footerBox.left).toBeGreaterThanOrEqual(frameBox.left)
    await expect(footerBox.right).toBeLessThanOrEqual(frameBox.right)
    await expect(footerBox.bottom).toBeLessThanOrEqual(frameBox.bottom)
    // The reply button sits at the footer's edge. Focused by the keyboard, it draws its ring inside its own box,
    // so the footer does not cut it (Codex review of #134), with a bg.canvas line inside the ring.
    await userEvent.tab({ shift: true })
    while (document.activeElement !== reply) await userEvent.tab()
    const ringStyle = getComputedStyle(reply)
    await expect(ringStyle.outlineStyle).toBe('solid')
    await expect(parseFloat(ringStyle.outlineWidth) + parseFloat(ringStyle.outlineOffset)).toBeLessThanOrEqual(0)
    await expect(ringStyle.boxShadow).toContain('inset')
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
 * body, so the last line of the body is not under the reply box, and it stays inside the frame.
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

// A phone chat: the transcript scrolls in the body, the reply box sits in the footer. A play test stands in for the
// touch screen: it answers `(pointer: coarse)` as `pointer` says, and sends touch events as a finger would.
let pointer: 'coarse' | 'fine' = 'coarse'
const onCopy = fn()

const touchScreen = () => {
  pointer = 'coarse'
  onCopy.mockClear()
  const own = Object.getOwnPropertyDescriptor(window, 'matchMedia')
  const real = window.matchMedia.bind(window)
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => (query === '(pointer: coarse)' ? { matches: pointer === 'coarse', media: query } : real(query)),
  })
  return () => {
    if (own) Object.defineProperty(window, 'matchMedia', own)
    else Reflect.deleteProperty(window, 'matchMedia')
  }
}

function Chat() {
  return (
    <main className={page}>
      <div className={box}>
        <ScrollFrame gap="12" footer={<TextArea label="Reply" labelHidden rows={2} />}>
          {lines.map((text) => (
            <p key={text} className={line}>
              {text}
            </p>
          ))}
          <Button size="sm" onClick={onCopy}>
            Copy the message
          </Button>
        </ScrollFrame>
      </div>
    </main>
  )
}

const finger = (target: Element) => {
  const r = target.getBoundingClientRect()
  const x = r.left + r.width / 2
  const y = r.top + r.height / 2
  const send = (type: 'touchstart' | 'touchmove' | 'touchend', dy: number) => {
    const touch = new Touch({ identifier: 1, target, clientX: x, clientY: y - dy })
    const touches = type === 'touchend' ? [] : [touch]
    target.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches, targetTouches: touches, changedTouches: [touch] }))
  }
  return {
    down: () => {
      send('touchstart', 0)
    },
    move: (dy: number) => {
      send('touchmove', dy)
    },
    up: (dy = 0) => {
      send('touchend', dy)
    },
  }
}

const chatParts = async (root: HTMLElement, draft = 'Half a reply') => {
  const canvas = within(root)
  const reply = canvas.getByRole('textbox', { name: 'Reply' })
  await userEvent.click(reply)
  await userEvent.keyboard(draft)
  await expect(reply).toHaveFocus()
  return { canvas, reply, message: canvas.getByText('Message 5') }
}

const touchChat: StoryObj<typeof meta> = { render: () => <Chat />, beforeEach: touchScreen }

const dragCloses: StoryObj<typeof meta> = {
  ...touchChat,
  play: async ({ canvasElement }) => {
    const { reply, message } = await chatParts(canvasElement)
    // The user drags the transcript 11 px: the reply box loses the focus, so the keyboard closes.
    const press = finger(message)
    press.down()
    press.move(11)
    await expect(reply).not.toHaveFocus()
    press.up(11)
    // The draft stays, and a tap on the reply box opens the keyboard again with it.
    await expect(reply).toHaveValue('Half a reply')
    await userEvent.click(reply)
    await expect(reply).toHaveFocus()
    await expect(reply).toHaveValue('Half a reply')
  },
}

/** On a touch screen a drag of the transcript closes the keyboard of the reply box; the draft stays. */
export const DragClosesKeyboardDark: StoryObj<typeof meta> = { ...dragCloses, globals: { mode: 'dark' } }
export const DragClosesKeyboardLight: StoryObj<typeof meta> = { ...dragCloses, globals: { mode: 'light' } }

/** A press that has moved 10 px or less is not a drag: the keyboard stays open while the finger is down. */
export const ShortDragKeepsKeyboard: StoryObj<typeof meta> = {
  ...touchChat,
  globals: { mode: 'dark' },
  play: async ({ canvasElement }) => {
    const { reply, message } = await chatParts(canvasElement)
    const press = finger(message)
    press.down()
    press.move(5)
    press.move(10)
    await expect(reply).toHaveFocus()
    // One more pixel makes it a drag.
    press.move(11)
    await expect(reply).not.toHaveFocus()
    press.up(11)
  },
}

/** A scroll from code, such as an auto-scroll to a new message, never closes the keyboard. */
export const CodeScrollKeepsKeyboard: StoryObj<typeof meta> = {
  ...touchChat,
  globals: { mode: 'dark' },
  play: async ({ canvasElement }) => {
    const { reply, message } = await chatParts(canvasElement)
    const body = message.parentElement
    if (body === null) throw new Error('no body')
    body.scrollTop = 200
    body.dispatchEvent(new Event('scroll'))
    body.scrollTo({ top: body.scrollHeight })
    body.dispatchEvent(new Event('scroll'))
    await new Promise((resolve) => requestAnimationFrame(resolve))
    await expect(body.scrollTop).toBeGreaterThan(200)
    await expect(reply).toHaveFocus()
    // The same frame still closes it for the user's own drag.
    const press = finger(message)
    press.down()
    press.move(40)
    await expect(reply).not.toHaveFocus()
    press.up(40)
  },
}

/** With a mouse (a fine pointer) nothing changes: a drag or a tap on the transcript leaves the reply box focused. */
export const FinePointerKeepsKeyboard: StoryObj<typeof meta> = {
  ...touchChat,
  globals: { mode: 'dark' },
  play: async ({ canvasElement }) => {
    const { reply, message } = await chatParts(canvasElement)
    pointer = 'fine'
    const drag = finger(message)
    drag.down()
    drag.move(40)
    drag.up(40)
    const tap = finger(message)
    tap.down()
    tap.up()
    await expect(reply).toHaveFocus()
    // The same drag on a touch screen closes it.
    pointer = 'coarse'
    drag.down()
    drag.move(40)
    await expect(reply).not.toHaveFocus()
    drag.up(40)
  },
}

/** A tap on a blank part of the transcript (a press and release within 10 px) closes the keyboard; the draft stays. */
export const TapClosesKeyboard: StoryObj<typeof meta> = {
  ...touchChat,
  globals: { mode: 'dark' },
  play: async ({ canvasElement }) => {
    const { reply, message } = await chatParts(canvasElement)
    const tap = finger(message)
    tap.down()
    tap.move(4)
    await expect(reply).toHaveFocus()
    tap.up(4)
    await expect(reply).not.toHaveFocus()
    await expect(reply).toHaveValue('Half a reply')
  },
}

/** A tap on a button in a message does the button's action only and leaves the keyboard open. */
export const TapOnButtonKeepsKeyboard: StoryObj<typeof meta> = {
  ...touchChat,
  globals: { mode: 'dark' },
  play: async ({ canvasElement }) => {
    const { canvas, reply, message } = await chatParts(canvasElement)
    const copy = canvas.getByRole('button', { name: 'Copy the message' })
    const tap = finger(copy)
    tap.down()
    tap.up()
    // The click that follows a tap; a button's click() does not move the focus.
    copy.click()
    await expect(onCopy).toHaveBeenCalledTimes(1)
    await expect(reply).toHaveFocus()
    // A tap beside the button, on the transcript, still closes it.
    const blank = finger(message)
    blank.down()
    blank.up()
    await expect(reply).not.toHaveFocus()
  },
}
