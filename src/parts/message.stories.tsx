import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
import { Stack } from '../controls/layout'
import { Message } from './message'

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
    // The author row: a 14 px Claude mark, 6 px before the name in label (Medium 14) and fg.default, then the time in fg.subtle.
    const mark = author.querySelector('svg')
    if (mark === null) throw new Error('no mark')
    await expect(mark).toHaveAttribute('aria-hidden', 'true')
    await expect([mark.getBoundingClientRect().width, mark.getBoundingClientRect().height]).toEqual([14, 14])
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
