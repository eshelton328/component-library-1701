import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
import { Stack } from '../controls/layout'
import { Message } from './message'
import { expectCutText } from '../controls/tooltip.testing'

const page = css({ bg: 'surface.pane', p: '24', w: 'shell.dialogLg' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  raised: css({ color: 'surface.raised' }),
  default: css({ color: 'fg.default' }),
  muted: css({ color: 'fg.muted' }),
  subtle: css({ color: 'fg.subtle' }),
  claude: css({ color: 'agent.claude' }),
  codex: css({ color: 'agent.codex' }),
}

function Swatches() {
  return (
    <div hidden>
      {Object.entries(swatches).map(([name, className]) => (
        <span key={name} data-swatch={name} className={className} />
      ))}
    </div>
  )
}

function swatch(root: HTMLElement, name: string): string {
  const el = root.querySelector(`[data-swatch="${name}"]`)
  return el === null ? '' : getComputedStyle(el).color
}

function slot(root: HTMLElement, id: string, name: string): HTMLElement {
  const el = within(root).getByTestId(id).querySelector(`.message__${name}`)
  if (!(el instanceof HTMLElement)) throw new Error(`no ${name} in ${id}`)
  return el
}

const answer = 'Three directions: a tiled home, a star map of agents, and a split-pane workbench. The workbench suits long sessions on the desktop.'

function Messages() {
  return (
    <main className={page}>
      <Stack gap="16">
        <div data-testid="user">
          <Message from="user" time="09:41" dateTime="2026-11-15T09:41">
            Brainstorm layouts for the-bridge that go beyond a sidebar and a chat.
          </Message>
        </div>
        <div data-testid="claude">
          <Message name="Claude" time="09:42" dateTime="2026-11-15T09:42" actions={<Button size="sm">Copy</Button>}>
            {answer}
          </Message>
        </div>
        <div data-testid="claude-16">
          <Message name="writer" markSize="16">The Toolkit discussion draws a 15 px mark (D05 438:29).</Message>
        </div>
        <div data-testid="codex">
          <Message kind="codex" actions={[]}>
            3 candidate pairs, 1 stale link.
          </Message>
        </div>
        <div data-testid="shell">
          <Message kind="shell" name=" ">
            On branch main
          </Message>
        </div>
        <div data-testid="unnamed-user">
          <Message from="user" name="">
            Thanks.
          </Message>
        </div>
      </Stack>
      <Swatches />
    </main>
  )
}

const meta = {
  title: 'Conversation/Message',
  component: Messages,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const s = (name: string) => swatch(canvasElement, name)
    // Each message is an article named by its author; the user's name is "You", read but not shown.
    const user = within(canvas.getByTestId('user')).getByRole('article', { name: 'You' })
    const youName = slot(canvasElement, 'user', 'srName')
    await expect(youName.getBoundingClientRect().width).toBeLessThanOrEqual(1)
    // The user's bubble: the width of the transcript, surface.raised, radius 12, padding 10 by 12, no border.
    const bubble = getComputedStyle(user)
    await expect(user.getBoundingClientRect().width).toBe(canvas.getByTestId('user').getBoundingClientRect().width)
    await expect(bubble.backgroundColor).toBe(s('raised'))
    await expect([bubble.borderTopLeftRadius, bubble.paddingTop, bubble.paddingLeft, bubble.borderTopWidth]).toEqual(['12px', '10px', '12px', '0px'])
    // The text is body (Regular 14/20) in fg.default; the time is mono in fg.muted at the end.
    const text = getComputedStyle(slot(canvasElement, 'user', 'body'))
    await expect([text.fontSize, text.fontWeight, text.color]).toEqual(['14px', '400', s('default')])
    await expect(parseFloat(text.lineHeight)).toBeCloseTo(20, 0)
    const userTime = slot(canvasElement, 'user', 'time')
    await expect(userTime.tagName).toBe('TIME')
    await expect(userTime).toHaveAttribute('datetime', '2026-11-15T09:41')
    await expect([getComputedStyle(userTime).color, getComputedStyle(userTime).fontSize]).toEqual([s('muted'), '12px'])
    await expect(userTime.getBoundingClientRect().right).toBeCloseTo(user.getBoundingClientRect().right - 12, 0)
    // The assistant's message: no fill; author row, body and actions 6 apart.
    const claude = canvas.getByRole('article', { name: 'Claude' })
    await expect(getComputedStyle(claude).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    const author = slot(canvasElement, 'claude', 'author')
    const body = slot(canvasElement, 'claude', 'body')
    const actions = slot(canvasElement, 'claude', 'actions')
    await expect(body.getBoundingClientRect().top - author.getBoundingClientRect().bottom).toBe(6)
    await expect(actions.getBoundingClientRect().top - body.getBoundingClientRect().bottom).toBe(6)
    // The author row: a 12 px Claude mark, 6 px before the name in label (Medium 14) and fg.default, then the time in fg.subtle.
    const mark = author.querySelector('svg')
    if (mark === null) throw new Error('no mark')
    await expect(mark).toHaveAttribute('aria-hidden', 'true')
    await expect([mark.getBoundingClientRect().width, mark.getBoundingClientRect().height]).toEqual([12, 12])
    await expect(getComputedStyle(mark).color).toBe(s('claude'))
    const name = slot(canvasElement, 'claude', 'name')
    await expect(name.getBoundingClientRect().left - mark.getBoundingClientRect().right).toBe(6)
    await expect([getComputedStyle(name).fontSize, getComputedStyle(name).fontWeight, getComputedStyle(name).color]).toEqual(['14px', '500', s('default')])
    const time = slot(canvasElement, 'claude', 'time')
    await expect(time.getBoundingClientRect().left - name.getBoundingClientRect().right).toBe(6)
    await expect([getComputedStyle(time).color, getComputedStyle(time).fontFamily]).toEqual([s('subtle'), expect.stringMatching(/Mono/)])
    await expect(getComputedStyle(body).color).toBe(s('default'))
    await expect(body).toHaveTextContent(answer)
    // With no name, or a blank one, the message shows and is named by its kind; a blank user name is "You".
    await expect(canvas.getByRole('article', { name: 'Codex' })).toBe(canvas.getByTestId('codex').firstElementChild)
    await expect(slot(canvasElement, 'codex', 'name')).toHaveTextContent(/^Codex$/)
    await expect(canvas.getByRole('article', { name: 'Shell' })).toBe(canvas.getByTestId('shell').firstElementChild)
    await expect(within(canvas.getByTestId('unnamed-user')).getByRole('article', { name: 'You' })).toBeInTheDocument()
    // `markSize="16"`: a 16 px mark (Figma 15, D05 438:29), still 6 px before the name.
    const bigAuthor = slot(canvasElement, 'claude-16', 'author')
    const bigMark = bigAuthor.querySelector('svg')
    if (bigMark === null) throw new Error('no 16 px mark')
    await expect([bigMark.getBoundingClientRect().width, bigMark.getBoundingClientRect().height]).toEqual([16, 16])
    await expect(slot(canvasElement, 'claude-16', 'name').getBoundingClientRect().left - bigMark.getBoundingClientRect().right).toBe(6)
    // Codex: its own mark; actions that render nothing leave no actions slot.
    const codexMark = canvas.getByTestId('codex').querySelector('svg')
    if (codexMark === null) throw new Error('no codex mark')
    await expect(getComputedStyle(codexMark).color).toBe(s('codex'))
    await expect(canvas.getByTestId('codex').querySelector('.message__actions')).toBeNull()
    await expect(canvas.getByTestId('codex').querySelector('.message__time')).toBeNull()
  },
} satisfies Meta<typeof Messages>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onCopy = fn()

/** The message only shows its actions; a Copy button calls the caller's handler. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <Message
        name="Claude"
        actions={
          <Button size="sm" onClick={onCopy}>
            Copy
          </Button>
        }
      >
        {answer}
      </Message>
    </main>
  ),
  play: async ({ canvasElement }) => {
    onCopy.mockClear()
    const canvas = within(canvasElement)
    const copy = canvas.getByRole('button', { name: 'Copy' })
    await userEvent.click(copy)
    await expect(onCopy).toHaveBeenCalledTimes(1)
    copy.blur()
    await userEvent.tab()
    await expect(copy).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(onCopy).toHaveBeenCalledTimes(2)
  },
}

const narrowBox = css({ w: 'shell.popoverSm' })

/** A long author name is cut to one line and shows in full in a tooltip, on hover and on keyboard focus. */
export const LongName: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <div className={narrowBox}>
        <Message name="skill-eval-round-with-held-out-cases-and-a-trigger-set" time="09:41">
          Done.
        </Message>
      </div>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const name = canvasElement.querySelector('.message__name')
    if (name === null) throw new Error('no name')
    await expectCutText(name, 'skill-eval-round-with-held-out-cases-and-a-trigger-set')
    await expect(within(canvasElement).getByRole('article', { name: 'skill-eval-round-with-held-out-cases-and-a-trigger-set' })).toBeInTheDocument()
  },
}

// The Inbox discussion (D15 403:1442 and 403:1444) draws both messages in Geist Regular 13/19: `size="sm"` sets the body
// in `bodySm` (13/20, d-090); `md` keeps `body` (14/20).
const compactLine = 'Can you also link each ticket to its Figma frame? The frames are listed in pages.md.'
const narrow = css({ bg: 'surface.pane', p: '24', w: 'shell.popover' })

function Compact() {
  return (
    <main className={narrow}>
      <Stack gap="16">
        <div data-testid="sm-user">
          <Message from="user" size="sm">
            {compactLine}
          </Message>
        </div>
        <div data-testid="sm-claude">
          <Message size="sm">{compactLine}</Message>
        </div>
        <div data-testid="md-user">
          <Message from="user">{compactLine}</Message>
        </div>
      </Stack>
    </main>
  )
}

const compactPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  for (const id of ['sm-user', 'sm-claude']) {
    const body = getComputedStyle(slot(canvasElement, id, 'body'))
    await expect([body.fontSize, body.fontWeight]).toEqual(['13px', '400'])
    await expect(parseFloat(body.lineHeight)).toBeCloseTo(20, 0)
  }
  const md = getComputedStyle(slot(canvasElement, 'md-user', 'body'))
  await expect(md.fontSize).toBe('14px')
}

export const CompactDark: StoryObj<typeof meta> = { globals: { mode: 'dark' }, render: () => <Compact />, play: compactPlay }
export const CompactLight: StoryObj<typeof meta> = { globals: { mode: 'light' }, render: () => <Compact />, play: compactPlay }

// A message from another chat (the-bridge R55): never the owner's bubble. An amber bar on the start side, then an
// author row of the chat icon and "From <name>" in status.needsYou.fg, and the content in fg.default.
type Rgba = [number, number, number, number]

/** Reads a computed `rgb()` or `rgba()` colour. */
function parseRgba(value: string): Rgba {
  const parts = /^rgba?\(([^)]+)\)$/.exec(value)?.[1]?.split(',').map(Number)
  if (parts === undefined || parts.length < 3 || parts.some(Number.isNaN)) throw new Error(`not an rgb colour: ${value}`)
  const [r = 0, g = 0, b = 0, a = 1] = parts
  return [r, g, b, a]
}

/** Lays `top` over `under` (source-over), as the browser paints it. */
function over(top: Rgba, under: Rgba): Rgba {
  const a = top[3] + under[3] * (1 - top[3])
  if (a === 0) return [0, 0, 0, 0]
  const mix = (t: number, u: number) => (t * top[3] + u * under[3] * (1 - top[3])) / a
  return [mix(top[0], under[0]), mix(top[1], under[1]), mix(top[2], under[2]), a]
}

/** The colour behind an element: its own and its ancestors' fills, laid over each other and over `base`. */
function paintedBackground(el: Element | null, base: Rgba): Rgba {
  let colour: Rgba = [0, 0, 0, 0]
  for (let node = el; node !== null && colour[3] < 1; node = node.parentElement) {
    colour = over(colour, parseRgba(getComputedStyle(node).backgroundColor))
  }
  return over(colour, base)
}

/** WCAG 2 contrast ratio of two opaque colours. */
function contrast(a: Rgba, b: Rgba) {
  const luminance = (c: Rgba) => {
    const [r, g, bl] = [c[0], c[1], c[2]].map((v) => {
      const s = v / 255
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (bl ?? 0)
  }
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05)
}

const peerSwatches = {
  needsYou: css({ color: 'status.needsYou.fg' }),
  default: css({ color: 'fg.default' }),
  canvas: css({ color: 'bg.canvas' }),
}
const raisedBox = css({ bg: 'surface.raised', p: '12', borderRadius: 'xl' })
const peerText = 'Port question: 5190 is in use by another lab. I recommend 5191 and wait for your answer before any Serve change.'

function Peers() {
  return (
    <main className={page}>
      <Stack gap="16">
        <div data-testid="peer">
          <Message from="peer" name="bridge-header-lab" time="10:27" dateTime="2026-11-23T10:27">
            {peerText}
          </Message>
        </div>
        <div data-testid="peer-raised" className={raisedBox}>
          <Message from="peer" name="bridge-coord">
            Go.
          </Message>
        </div>
        <div data-testid="peer-blank">
          <Message from="peer" name=" ">
            A message with no sender name.
          </Message>
        </div>
        <div data-testid="peer-label-only">
          <Message from="peer" name="bridge-inbox">
            {null}
          </Message>
        </div>
        <div data-testid="user">
          <Message from="user">My own message stays a bubble.</Message>
        </div>
      </Stack>
      <div hidden>
        {Object.entries(peerSwatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const peerPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const s = (name: string) => swatch(canvasElement, name)
  const base = parseRgba(s('canvas'))
  // The message is an article named by its label; it is never the owner's bubble: no fill, no radius.
  const peer = within(canvas.getByTestId('peer')).getByRole('article', { name: 'From bridge-header-lab' })
  const root = getComputedStyle(peer)
  await expect(root.backgroundColor).toBe('rgba(0, 0, 0, 0)')
  await expect(root.borderTopLeftRadius).toBe('0px')
  // The bar: 2 px (borderWidths.ring), solid, status.needsYou.fg, on the start side only, 10 px before the content.
  await expect([root.borderLeftWidth, root.borderLeftStyle, root.borderLeftColor]).toEqual(['2px', 'solid', s('needsYou')])
  await expect([root.borderTopWidth, root.borderRightWidth, root.borderBottomWidth]).toEqual(['0px', '0px', '0px'])
  await expect(root.paddingLeft).toBe('10px')
  const author = slot(canvasElement, 'peer', 'author')
  const body = slot(canvasElement, 'peer', 'body')
  await expect(author.getBoundingClientRect().left - peer.getBoundingClientRect().left).toBe(12)
  await expect(body.getBoundingClientRect().left - peer.getBoundingClientRect().left).toBe(12)
  await expect(body.getBoundingClientRect().top - author.getBoundingClientRect().bottom).toBe(6)
  // The author row: the 12 px chat icon, hidden from assistive technology, then "From <name>" in label, both amber.
  const icon = author.querySelector('svg')
  if (icon === null) throw new Error('no chat icon')
  await expect(icon).toHaveAttribute('aria-hidden', 'true')
  await expect([icon.getBoundingClientRect().width, icon.getBoundingClientRect().height]).toEqual([12, 12])
  await expect(getComputedStyle(icon).color).toBe(s('needsYou'))
  const name = slot(canvasElement, 'peer', 'name')
  await expect(name).toHaveTextContent(/^From bridge-header-lab$/)
  await expect(name.getBoundingClientRect().left - icon.getBoundingClientRect().right).toBe(6)
  await expect([getComputedStyle(name).fontSize, getComputedStyle(name).fontWeight, getComputedStyle(name).color]).toEqual(['14px', '500', s('needsYou')])
  await expect(slot(canvasElement, 'peer', 'time')).toHaveAttribute('datetime', '2026-11-23T10:27')
  // The content stays readable: body text in fg.default.
  await expect([getComputedStyle(body).fontSize, getComputedStyle(body).color]).toEqual(['14px', s('default')])
  await expect(body).toHaveTextContent(peerText)
  // Contrast, as painted: the label and the body text reach 4.5:1 and the bar 3:1, on the pane and on a raised box.
  for (const id of ['peer', 'peer-raised']) {
    const article = within(canvas.getByTestId(id)).getByRole('article')
    const behind = paintedBackground(article, base)
    const label = parseRgba(getComputedStyle(slot(canvasElement, id, 'name')).color)
    const text = parseRgba(getComputedStyle(slot(canvasElement, id, 'body')).color)
    const bar = parseRgba(getComputedStyle(article).borderLeftColor)
    await expect(contrast(label, behind), `label on ${id}`).toBeGreaterThanOrEqual(4.5)
    await expect(contrast(text, behind), `text on ${id}`).toBeGreaterThanOrEqual(4.5)
    await expect(contrast(bar, behind), `bar on ${id}`).toBeGreaterThanOrEqual(3)
  }
  // A blank name shows "From another chat"; a message with no content shows its label only.
  await expect(within(canvas.getByTestId('peer-blank')).getByRole('article', { name: 'From another chat' })).toBeInTheDocument()
  await expect(within(canvas.getByTestId('peer-label-only')).getByRole('article', { name: 'From bridge-inbox' })).toBeInTheDocument()
  await expect(canvas.getByTestId('peer-label-only').querySelector('.message__body')).toBeNull()
  // The owner's message beside it keeps its bubble and has no bar.
  const user = getComputedStyle(within(canvas.getByTestId('user')).getByRole('article', { name: 'You' }))
  await expect(user.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  await expect(user.borderLeftWidth).toBe('0px')
}

export const PeerDark: StoryObj<typeof meta> = { globals: { mode: 'dark' }, render: () => <Peers />, play: peerPlay }
export const PeerLight: StoryObj<typeof meta> = { globals: { mode: 'light' }, render: () => <Peers />, play: peerPlay }
