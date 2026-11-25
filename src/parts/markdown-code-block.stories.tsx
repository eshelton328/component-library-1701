import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { expectScrollAreas } from '../controls/scroll-area.testing'
import { atTextSize, textSizes, textSpills } from '../controls/text-size.testing'
import type { CodeSegment } from './code-lines'
import { MarkdownCodeBlock } from './markdown-code-block'
import { MarkdownView } from './markdown-view'

// A narrow column (the list pane's width), as a chat reply's text on a phone or in a pane.
const column = css({ bg: 'bg.canvas', p: '16', w: 'shell.listPane', display: 'flex', flexDirection: 'column', gap: '16' })

const tsCode = [
  "import { MarkdownView } from '@eshelton328/component-library-1701'",
  '',
  '// A reply that renders its Markdown, with a very long line that scrolls the block sideways rather than wrap.',
  'export function Reply({ text }: { text: string }) {',
  '  return <MarkdownView>{text}</MarkdownView>',
  '}',
].join('\n')

const tsSegments: CodeSegment[][] = [
  [{ text: 'import', kind: 'keyword' }, { text: ' { MarkdownView } ' }, { text: 'from', kind: 'keyword' }, { text: ' ' }, { text: "'@eshelton328/component-library-1701'", kind: 'string' }],
  [],
  [{ text: '// A reply that renders its Markdown, with a very long line that scrolls the block sideways rather than wrap.', kind: 'comment' }],
  [{ text: 'export', kind: 'keyword' }, { text: ' ' }, { text: 'function', kind: 'keyword' }, { text: ' ' }, { text: 'Reply', kind: 'function' }, { text: '({ text }: { text: string }) {' }],
  [{ text: '  ' }, { text: 'return', kind: 'keyword' }, { text: ' <MarkdownView>{text}</MarkdownView>' }],
  [{ text: '}' }],
]

const diffCode = ['--- a/greet.ts', '+++ b/greet.ts', ' export function greet(name: string) {', "-  return 'Hi ' + name", '+  return `Hello, ${name}`', ' }'].join('\n')

const meta = {
  title: 'Data display/Markdown code block',
  component: MarkdownCodeBlock,
  args: { code: tsCode, language: 'ts', segments: tsSegments },
} satisfies Meta<typeof MarkdownCodeBlock>

export default meta
type Story = StoryObj<typeof meta>

const copied = fn(() => Promise.resolve(true))

/** A chat reply's text: every basic mark, inline code as badges, a code block and a diff. */
function Reply() {
  return (
    <div className={column} data-testid="reply">
      <MarkdownView padding="none" inlineCode="badge">
        <h1>Heading one</h1>
        <h2>Heading two</h2>
        <h3>Heading three</h3>
        <h4>Heading four</h4>
        <p>
          Some <em>italic</em>, <strong>bold</strong> and <del>struck</del> text, with <code>pnpm verify</code> and{' '}
          <code>MarkdownView</code> as inline code.
        </p>
        <blockquote>
          <p>A quote from the brief, in its own block.</p>
        </blockquote>
        <hr />
        <ul>
          <li>
            A list
            <ul>
              <li>with a nested item</li>
            </ul>
          </li>
          <li className="task-list-item">
            <input type="checkbox" checked disabled readOnly aria-label="Task done" /> a done task
          </li>
        </ul>
        <MarkdownCodeBlock code={tsCode} language="ts" segments={tsSegments} onCopy={copied} />
        <MarkdownCodeBlock code={diffCode} language="diff" onCopy={copied} />
      </MarkdownView>
    </div>
  )
}

const replyPlay: Story['play'] = async ({ canvasElement }) => {
  const reply = within(canvasElement).getByTestId('reply')
  const [ts, diff] = [...reply.querySelectorAll<HTMLElement>('.markdown-code-block__root')]
  if (ts === undefined || diff === undefined) throw new Error('no code blocks')
  // The head shows the language and a copy button.
  await expect(within(ts).getByText('ts')).toBeVisible()
  await expect(within(ts).getByRole('button', { name: 'Copy code' })).toBeVisible()
  // A long line stays on one line and scrolls the body sideways; the body is a tab stop.
  const body = ts.querySelector<HTMLElement>('.markdown-code-block__body')
  if (body === null) throw new Error('no body')
  await expect(getComputedStyle(body).whiteSpace).toBe('pre')
  await expect(body.scrollWidth).toBeGreaterThan(body.clientWidth)
  await expect(body).toHaveAttribute('tabindex', '0')
  await expectScrollAreas(reply, 'x', '.markdown-code-block__body')
  // The syntax colours are CodeLines' segments.
  await expect(ts.querySelectorAll('[data-kind=keyword]').length).toBeGreaterThan(0)
  // A diff tints its added and removed lines, never its file headers.
  const changes = [...diff.querySelectorAll('.markdown-code-block__line')].map((l) => l.getAttribute('data-change'))
  await expect(changes).toEqual([null, null, null, 'removed', 'added', null])
  const added = diff.querySelector<HTMLElement>('[data-change=added]')
  if (added === null) throw new Error('no added line')
  await expect(getComputedStyle(added).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  // Inline code is a badge; code in a block is not.
  const inline = reply.querySelector<HTMLElement>('p > code')
  if (inline === null) throw new Error('no inline code')
  await expect(getComputedStyle(inline).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  const inBlock = ts.querySelector<HTMLElement>('pre > code')
  if (inBlock === null) throw new Error('no block code')
  await expect(getComputedStyle(inBlock).backgroundColor).toBe('rgba(0, 0, 0, 0)')
  // h4 steps down from h2; the quote has its bar; the rule is a line; italics slant.
  const size = (sel: string) => Number.parseFloat(getComputedStyle(reply.querySelector(sel) ?? reply).fontSize)
  await expect(size('h4')).toBeLessThan(size('h2'))
  const quote = reply.querySelector<HTMLElement>('blockquote')
  const rule = reply.querySelector<HTMLElement>('hr')
  const em = reply.querySelector<HTMLElement>('em')
  if (quote === null || rule === null || em === null) throw new Error('no quote, rule or em')
  await expect(getComputedStyle(quote).borderInlineStartWidth).toBe('2px')
  await expect(getComputedStyle(rule).borderTopWidth).toBe('1px')
  await expect(getComputedStyle(em).fontStyle).toBe('italic')
}

export const ReplyDark: Story = { render: () => <Reply />, play: replyPlay, globals: { mode: 'dark' } }
export const ReplyLight: Story = { render: () => <Reply />, play: replyPlay, globals: { mode: 'light' } }

/** Copy: the button gives the whole code to `onCopy` and says "Copied", or "Copy failed" when it resolves false. */
export const Copy: Story = {
  args: { onCopy: fn(() => Promise.resolve(true)) },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Copy code' }))
    await expect(args.onCopy).toHaveBeenCalledWith(tsCode)
    await expect(await canvas.findByText('Copied')).toBeVisible()
  },
}

export const CopyFailed: Story = {
  args: { onCopy: fn(() => Promise.resolve(false)) },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Copy code' }))
    await expect(await canvas.findByText('Copy failed')).toBeVisible()
  },
}

/** No language and no `onCopy`: no head, only the code (a caller that draws no copy button, such as Toolkit). */
export const NoHead: Story = {
  args: { code: 'echo hi', language: undefined, segments: undefined },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.markdown-code-block__head')).toBeNull()
    await expect(canvasElement.querySelector('.markdown-code-block__body')?.textContent).toBe('echo hi')
  },
}

const longCode = Array.from({ length: 30 }, (_, i) => `line ${String(i + 1)}`).join('\n')

/** A long block folds after 20 lines; "Show all 30 lines" shows the rest, and Copy still copies all 30. */
export const Fold: Story = {
  args: { code: longCode, language: 'txt', segments: undefined, onCopy: fn(() => Promise.resolve(true)) },
  play: async ({ canvas, canvasElement, args }) => {
    const lines = () => canvasElement.querySelectorAll('.markdown-code-block__line').length
    await expect(lines()).toBe(20)
    const more = canvas.getByRole('button', { name: 'Show all 30 lines' })
    await expect(more).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(canvas.getByRole('button', { name: 'Copy code' }))
    await expect(args.onCopy).toHaveBeenCalledWith(longCode)
    await userEvent.click(more)
    await expect(lines()).toBe(30)
    await expect(canvas.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true')
  },
}

/** A block only a few lines over the fold shows them all: it folds only when it hides 6 or more. */
export const NoFoldNearLimit: Story = {
  args: { code: Array.from({ length: 25 }, (_, i) => String(i)).join('\n'), segments: undefined },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('.markdown-code-block__line').length).toBe(25)
    await expect(canvasElement.querySelector('.markdown-code-block__foot')).toBeNull()
  },
}

/** The reply at Small, Default and Large (d-122, d-131): no text spills out of its box at any size. */
function TextSizesReply() {
  return (
    <div className={column} data-testid="sizes">
      <MarkdownView padding="none" inlineCode="badge">
        <p>
          Run <code>pnpm verify</code> before you finish.
        </p>
        <blockquote>
          <p>A short quote.</p>
        </blockquote>
        <hr />
        <MarkdownCodeBlock code={'pnpm install\npnpm verify'} language="sh" onCopy={copied} />
      </MarkdownView>
      <MarkdownView padding="none" size="sm" inlineCode="badge">
        <p>
          Small: <code>pnpm verify</code>.
        </p>
        <MarkdownCodeBlock code="pnpm verify" language="sh" onCopy={copied} />
      </MarkdownView>
    </div>
  )
}

const textSizesPlay: Story['play'] = async ({ canvasElement }) => {
  const root = within(canvasElement).getByTestId('sizes')
  for (const size of textSizes)
    await atTextSize(size, async () => {
      await waitFor(() => expect({ size, spills: textSpills(root) }).toEqual({ size, spills: [] }))
    })
}

export const TextSizesDark: Story = { render: () => <TextSizesReply />, play: textSizesPlay, globals: { mode: 'dark' } }
export const TextSizesLight: Story = { render: () => <TextSizesReply />, play: textSizesPlay, globals: { mode: 'light' } }
