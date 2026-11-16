import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { CodeLines, type CodeSegment } from './code-lines'

const page = css({ bg: 'bg.canvas', p: '24' })
// The viewer panel of Toolkit D6 (#0f1626, merged into surface.overlay).
const panel = css({ w: 'shell.dialogLg', bg: 'surface.overlay', borderWidth: 'default', borderStyle: 'solid', borderColor: 'border.default', borderRadius: 'xl', overflow: 'hidden' })

// The pieces a highlighter such as Shiki or Prism would give the caller.
const highlighted: CodeSegment[][] = [
  [{ text: '#!/usr/bin/env python3', kind: 'comment' }],
  [{ text: 'import', kind: 'keyword' }, { text: ' json' }],
  [],
  [{ text: 'def', kind: 'keyword' }, { text: ' ' }, { text: 'check', kind: 'function' }, { text: '(path, limit=' }, { text: '80', kind: 'number' }, { text: '):' }],
  [{ text: '    ' }, { text: '# Each finding has a kind.', kind: 'comment' }],
  [{ text: '    ' }, { text: 'return', kind: 'keyword' }, { text: ' ' }, { text: 'print', kind: 'function' }, { text: '(' }, { text: '"fail"', kind: 'string' }, { text: ')' }],
]
const lines = highlighted.map((line) => line.map((s) => s.text).join(''))
// Pieces that do not spell the line are ignored, so the copied text always matches `lines`.
const mismatched = [...highlighted.slice(0, 5), [{ text: 'return', kind: 'keyword' } satisfies CodeSegment]]

const swatches = {
  default: css({ color: 'fg.default' }),
  keyword: css({ color: 'code.keyword' }),
  string: css({ color: 'code.string' }),
  comment: css({ color: 'code.comment' }),
  number: css({ color: 'code.number' }),
  function: css({ color: 'code.function' }),
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

function texts(root: HTMLElement, id: string): HTMLElement[] {
  return Array.from(within(root).getByTestId(id).querySelectorAll('.code-lines__text')).filter((el) => el instanceof HTMLElement)
}

function Code() {
  return (
    <main className={page}>
      <div className={panel} data-testid="highlighted">
        <CodeLines lines={lines} segments={highlighted} />
      </div>
      <div className={panel} data-testid="mismatched">
        <CodeLines lines={lines} segments={mismatched} />
      </div>
      <Swatches />
    </main>
  )
}

const meta = {
  title: 'Data display/Code lines',
  component: Code,
  play: async ({ canvasElement }) => {
    const rows = texts(canvasElement, 'highlighted')
    const [shebang, , , def, , ret] = rows
    if (shebang === undefined || def === undefined || ret === undefined) throw new Error('no lines')
    const segment = (row: HTMLElement, kind: string) => {
      const el = row.querySelector(`[data-kind="${kind}"]`)
      if (!(el instanceof HTMLElement)) throw new Error(`no ${kind} segment`)
      return el
    }
    // Each kind takes its code.* token; the shebang is a comment (Figma 432:2307).
    await expect(getComputedStyle(segment(shebang, 'comment')).color).toBe(swatch(canvasElement, 'comment'))
    await expect(getComputedStyle(segment(def, 'keyword')).color).toBe(swatch(canvasElement, 'keyword'))
    await expect(getComputedStyle(segment(def, 'function')).color).toBe(swatch(canvasElement, 'function'))
    await expect(getComputedStyle(segment(def, 'number')).color).toBe(swatch(canvasElement, 'number'))
    await expect(getComputedStyle(segment(ret, 'string')).color).toBe(swatch(canvasElement, 'string'))
    await expect(swatch(canvasElement, 'keyword')).not.toBe(swatch(canvasElement, 'default'))
    // A piece with no kind is plain text in fg.default.
    await expect(getComputedStyle(def).color).toBe(swatch(canvasElement, 'default'))
    // The pieces render the same text as the plain line, with the line break that keeps copy intact.
    await expect(rows.map((r) => r.textContent)).toEqual(lines.map((l) => `${l}\n`))
    // A line whose pieces do not spell it is drawn plain.
    const plain = texts(canvasElement, 'mismatched')[5]
    if (plain === undefined) throw new Error('no mismatched line')
    await expect(plain.querySelector('[data-kind]')).toBeNull()
    await expect(plain.textContent).toBe(`${lines[5] ?? ''}\n`)
  },
} satisfies Meta<typeof Code>

export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
