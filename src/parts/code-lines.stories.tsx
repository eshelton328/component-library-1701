import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { CodeLines, type CodeSegment } from './code-lines'
import { expectScrollAreas, expectWheelScrollsPast } from '../controls/scroll-area.testing'

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
    // The code scrolls sideways with no scroll bar and keeps a sideways swipe at its end from moving the page; a
    // vertical scroll over it still moves the page.
    await expectScrollAreas(canvasElement, 'x', '.code-lines__root')
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

// The script of the Toolkit M22 file preview (`code` 487:2231), lines 1 to 10 as Figma draws them.
const script = [
  '#!/usr/bin/env bash',
  '# commit-msg <message-file>',
  '# Checks a commit message against toolkit/rules/commits-and-prs.md and',
  '# exits 1 with one line per problem. Git runs it from the top of the work',
  '# tree once `core.hooksPath` is `toolkit/hooks` (link.sh sets that).',
  'set -u',
  'RULE="toolkit/rules/commits-and-prs.md"',
  'TYPES="feat fix perf refactor docs test build ci chore revert"',
  'TOOLKIT_SCOPES="skills rules toolkit hooks"',
  'MAX=72',
]
// Lines 3, 4, 5 and 8 (487:2238, 487:2241, 487:2244, 487:2253) are two lines high in M22; the rest are one.
const wrappedLines = new Set([3, 4, 5, 8])
// The file preview's fill, edge to edge on the phone.
const preview = css({ bg: 'surface.overlay' })
// The phone page: the preview fills the 390 px viewport, so its text column is as wide as on the phone.
const phonePage = css({ bg: 'bg.canvas', display: 'grid', gap: '24' })

function Script() {
  return (
    <main className={phonePage}>
      <div className={preview} data-testid="wrap">
        <CodeLines lines={script} wrap />
      </div>
      <div className={preview} data-testid="nowrap">
        <CodeLines lines={script} />
      </div>
    </main>
  )
}

function codeBox(root: HTMLElement, id: string): HTMLElement {
  const box = within(root).getByTestId(id).querySelector('.code-lines__root')
  if (!(box instanceof HTMLElement)) throw new Error(`no code box in ${id}`)
  return box
}

function numbers(root: HTMLElement, id: string): HTMLElement[] {
  return Array.from(within(root).getByTestId(id).querySelectorAll('.code-lines__number')).filter((el) => el instanceof HTMLElement)
}

// How many text lines an element is high, in its own line height.
function rowsOf(el: HTMLElement): number {
  return Math.round(el.getBoundingClientRect().height / Number.parseFloat(getComputedStyle(el).lineHeight))
}

// The box of the drawn digits, not of the grid cell, which stretches to the row.
function glyphs(el: HTMLElement): DOMRect {
  const range = document.createRange()
  range.selectNodeContents(el)
  return range.getBoundingClientRect()
}

const phone = { m22: { name: 'Phone (M22)', styles: { width: '390px', height: '844px' } } }

/**
 * `wrap`: M22's script on a 390 px phone. Lines 3, 4, 5 and 8 wrap under
 * themselves with the number on their first line; nothing is cut and nothing
 * scrolls sideways. Below it, the same script without `wrap` keeps each line
 * on one line and scrolls sideways, as before.
 */
const wrapStory: StoryObj<typeof meta> = {
  render: () => <Script />,
  parameters: { viewport: { options: phone } },
  play: async ({ canvasElement }) => {
    const box = codeBox(canvasElement, 'wrap')
    await expect(window.innerWidth).toBe(390)
    await expect(box.getBoundingClientRect().width).toBe(390)
    await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth)
    await expect(getComputedStyle(box).overflowX).toBe('visible')
    const rows = texts(canvasElement, 'wrap')
    const nums = numbers(canvasElement, 'wrap')
    await expect(rows).toHaveLength(script.length)
    await expect(rows.map((r) => r.textContent)).toEqual(script.map((l) => `${l}\n`))
    for (const [i, row] of rows.entries()) {
      const line = i + 1
      const num = nums[i]
      if (num === undefined) throw new Error(`no number for line ${String(line)}`)
      await expect(getComputedStyle(row).whiteSpace).toBe('pre-wrap')
      // Nothing is cut: the line fits its column.
      await expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth)
      await expect(rowsOf(row)).toBe(wrappedLines.has(line) ? 2 : 1)
      // The number is drawn on the line's first visual line.
      const lineHeight = Number.parseFloat(getComputedStyle(row).lineHeight)
      const digits = glyphs(num)
      await expect(Math.abs(digits.top - row.getBoundingClientRect().top)).toBeLessThan(1)
      await expect(digits.height).toBeLessThanOrEqual(lineHeight + 1)
      await expect(num.textContent).toBe(String(line))
    }
    // The continuation lines up with the text column: every line starts at the same x.
    const lefts = new Set(rows.map((r) => Math.round(r.getBoundingClientRect().left)))
    await expect(lefts.size).toBe(1)

    // Without wrap, as before: one line each, and the long lines scroll the box sideways.
    const plain = codeBox(canvasElement, 'nowrap')
    await expect(getComputedStyle(plain).overflowX).toBe('auto')
    await expect(plain.scrollWidth).toBeGreaterThan(plain.clientWidth)
    for (const row of texts(canvasElement, 'nowrap')) {
      await expect(getComputedStyle(row).whiteSpace).toBe('pre')
      await expect(rowsOf(row)).toBe(1)
    }
  },
}
export const WrapDark: StoryObj<typeof meta> = { ...wrapStory, globals: { mode: 'dark', viewport: { value: 'm22' } } }
export const WrapLight: StoryObj<typeof meta> = { ...wrapStory, globals: { mode: 'light', viewport: { value: 'm22' } } }

const scroller = css({ h: 'shell.dialog', overflowY: 'auto' })
const filler = css({ h: 'shell.dialogLg' })

/**
 * Code in a page that scrolls: a vertical mouse wheel over it scrolls the page, as the code scrolls only sideways.
 * Only the story test runner has the real wheel, so the Storybook UI leaves the story out.
 */
export const WheelScrollsPage: StoryObj<typeof meta> = {
  tags: ['!dev'],
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <div className={scroller} data-testid="scroller">
        <div className={panel}>
          <CodeLines lines={lines} segments={highlighted} />
        </div>
        <div className={filler} />
      </div>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const code = canvasElement.querySelector('.code-lines__root')
    const page = canvasElement.querySelector('[data-testid="scroller"]')
    if (!(code instanceof HTMLElement) || !(page instanceof HTMLElement)) throw new Error('no code or scroller')
    await expectWheelScrollsPast(code, page)
  },
}
