import type { Meta, StoryObj } from '@storybook/react-vite'
import { Children, useState, type ReactNode } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { CodeLines, type CodeKind, type CodeSegment } from './code-lines'
import { MarkdownView, type MarkdownHighlight } from './markdown-view'
import { ScriptExplanation, type ScriptStep } from './script-explanation'
import { expectScrollAreas } from '../controls/scroll-area.testing'
import { atTextSize, textSizes } from '../controls/text-size.testing'

const page = css({ bg: 'bg.canvas', p: '24', display: 'flex', flexWrap: 'wrap', gap: '24', alignItems: 'flex-start' })
// The file preview and viewer panels of Toolkit D3, D6 and D10 (#0f1626, merged into surface.overlay).
const panel = css({ w: 'shell.dialogLg', bg: 'surface.overlay', borderWidth: 'default', borderStyle: 'solid', borderColor: 'border.default', borderRadius: 'xl', overflow: 'hidden' })

const script = [
  '#!/usr/bin/env bash',
  'set -euo pipefail',
  '',
  'file="$1"',
  'out="${2:-values.json}"',
  '',
  'if [ ! -f "$file" ]; then',
  '  echo "no such file: $file" >&2',
  '  exit 2',
  'fi',
  '',
  'jq -e ".values | length > 0" "$file" > /dev/null',
]

const steps: ScriptStep[] = [
  { text: 'Stops at the first error, so a failed step never passes silently.', line: 2 },
  { text: 'Reads the record path and where to write the result.', line: 4 },
  { text: 'Exits with code 2 when the record is missing.', line: 9 },
  { text: 'Checks that the record holds at least one value.', line: 12 },
]

function Content({ onLineSelect }: { onLineSelect?: (line: number) => void }) {
  return (
    <main className={page}>
      <div className={panel} data-testid="preview">
        <MarkdownView>
          <h1>writer</h1>
          <p>
            Drafts a doc from a brief and its sources, then has the <code>writing-reviewer</code> agent grade it. See the <a href="#rules">writing rules</a>.
          </p>
          <h2>Steps</h2>
          <ol>
            <li>Read the brief and every source it names.</li>
            <li>Draft the piece for its form.</li>
            <li>
              Lint it and fix what the script flags.
              <ul>
                <li>Patterns first, then the claims.</li>
              </ul>
            </li>
          </ol>
          <ol data-testid="loose">
            <li>
              <p>A loose item.</p>
              <p>Its second paragraph.</p>
            </li>
          </ol>
          <pre>toolkit/skills/writer/SKILL.md</pre>
        </MarkdownView>
      </div>
      <div className={panel} data-testid="code">
        <CodeLines lines={script} start={1} />
      </div>
      <div className={panel} data-testid="explain">
        <ScriptExplanation
          summary="Checks that a values record exists and holds at least one value."
          facts={[
            { key: 'In', value: 'values record path' },
            { key: 'Out', value: 'values.json' },
            { key: 'Exit', value: '0 ok, 2 no record' },
          ]}
          steps={steps}
          note="Claude wrote this explanation from the script."
          {...(onLineSelect === undefined ? {} : { onLineSelect })}
        />
      </div>
      <Swatches />
    </main>
  )
}

const swatches = {
  default: css({ color: 'fg.default' }),
  muted: css({ color: 'fg.muted' }),
  accent: css({ color: 'fg.accent' }),
  raised: css({ color: 'surface.raised' }),
  border: css({ color: 'border.default' }),
  selectedBorder: css({ color: 'border.selected' }),
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

const swatch = (root: HTMLElement, name: string) => {
  const el = root.querySelector(`[data-swatch="${name}"]`)
  return el === null ? '' : getComputedStyle(el).color
}

const pick = (root: Element, selector: string): HTMLElement => {
  const el = root.querySelector(selector)
  if (!(el instanceof HTMLElement)) throw new Error(`no ${selector}`)
  return el
}

const all = (root: Element, selector: string): HTMLElement[] => Array.from(root.querySelectorAll(selector)).filter((el) => el instanceof HTMLElement)

const font = (el: HTMLElement) => {
  const s = getComputedStyle(el)
  return [s.fontSize, Math.round(Number.parseFloat(s.lineHeight)), s.fontWeight]
}

const box = (el: HTMLElement) => el.getBoundingClientRect()

// The box of an element's text, not of the element: a grid item fills its cell.
const textBox = (el: HTMLElement) => {
  const range = document.createRange()
  range.selectNodeContents(el)
  return range.getBoundingClientRect()
}

const meta = {
  title: 'Data display/Markdown view',
  component: Content,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Rendered Markdown (427:284): padding 20 by 24, blocks 10 apart.
    const md = pick(canvas.getByTestId('preview'), '.markdown-view')
    const mdStyle = getComputedStyle(md)
    await expect([mdStyle.paddingTop, mdStyle.paddingRight, mdStyle.paddingBottom, mdStyle.paddingLeft]).toEqual(['20px', '24px', '20px', '24px'])
    const h1 = pick(md, 'h1')
    const p = pick(md, 'p')
    const h2 = pick(md, 'h2')
    await expect(box(p).top - box(h1).bottom).toBe(10)
    await expect(font(h1)).toEqual(['20px', 28, '600'])
    await expect(getComputedStyle(h1).color).toBe(swatch(canvasElement, 'default'))
    await expect(font(p)).toEqual(['14px', 20, '400'])
    await expect(getComputedStyle(p).color).toBe(swatch(canvasElement, 'muted'))
    await expect(font(h2)).toEqual(['14px', 20, '500'])
    await expect(getComputedStyle(h2).color).toBe(swatch(canvasElement, 'default'))
    // Lists: numbered, markers inside the text column, items 10 apart.
    const ol = pick(md, 'ol')
    await expect(getComputedStyle(ol).listStyleType).toBe('decimal')
    await expect(getComputedStyle(ol).listStylePosition).toBe('inside')
    await expect(box(ol).left).toBe(box(p).left)
    const items = all(ol, ':scope > li')
    const [first, second] = items
    if (first === undefined || second === undefined) throw new Error('no items')
    await expect(box(second).top - box(first).bottom).toBe(10)
    await expect(font(first)).toEqual(['14px', 20, '400'])
    await expect(getComputedStyle(first).color).toBe(swatch(canvasElement, 'muted'))
    // A loose item's first paragraph stays on the marker's 20 px line; the next is 10 below it.
    // An inline box is as tall as the font's content area, which differs by font, so the check
    // compares its centre with the centre of the first line rather than its top.
    const loose = pick(canvas.getByTestId('loose'), 'li')
    const [para1, para2] = all(loose, 'p')
    if (para1 === undefined || para2 === undefined) throw new Error('no loose paragraphs')
    const centre = (box(para1).top + box(para1).bottom) / 2
    await expect(Math.abs(centre - (box(loose).top + 10))).toBeLessThanOrEqual(1)
    await expect(box(para2).top - box(loose).top).toBe(30)
    await expect(getComputedStyle(pick(ol, 'ul')).listStyleType).toBe('disc')
    // Inline code and the path line use `code` (Mono 14/20); links the accent.
    const code = pick(p, 'code')
    await expect(font(code)).toEqual(['14px', 20, '400'])
    await expect(getComputedStyle(code).fontFamily).toContain('Geist Mono')
    await expect(font(pick(md, 'pre'))).toEqual(['14px', 20, '400'])
    await expect(getComputedStyle(pick(md, 'a')).color).toBe(swatch(canvasElement, 'accent'))

    // Code lines (432:2304): padding 16, numbers right-aligned 16 before the code, lines 2 apart.
    const lines = pick(canvas.getByTestId('code'), '.code-lines__root')
    const linesStyle = getComputedStyle(lines)
    await expect(linesStyle.paddingTop).toBe('16px')
    await expect(linesStyle.paddingLeft).toBe('16px')
    const numbers = all(lines, '.code-lines__number')
    const texts = all(lines, '.code-lines__text')
    await expect(numbers.map((n) => n.textContent)).toEqual(script.map((_, i) => String(i + 1)))
    const nine = numbers[8]
    const ten = numbers[9]
    const firstNumber = numbers[0]
    const firstText = texts[0]
    const secondText = texts[1]
    if (nine === undefined || ten === undefined || firstNumber === undefined || firstText === undefined || secondText === undefined) throw new Error('no lines')
    await expect(textBox(nine).right).toBe(textBox(ten).right)
    await expect(textBox(firstNumber).right).toBe(textBox(ten).right)
    await expect(box(firstText).left - textBox(ten).right).toBe(16)
    await expect(box(secondText).top - box(firstText).bottom).toBe(2)
    await expect(font(firstText)).toEqual(['12px', 16, '400'])
    await expect(getComputedStyle(firstText).color).toBe(swatch(canvasElement, 'default'))
    await expect(getComputedStyle(firstNumber).color).toBe(swatch(canvasElement, 'muted'))
    await expect(firstNumber.getAttribute('aria-hidden')).toBe('true')
    await expect(getComputedStyle(firstNumber).userSelect).toBe('none')
    await expect(firstText.textContent).toBe('#!/usr/bin/env bash\n')
    await expect(box(firstText).height).toBe(16)
    // Copying the code keeps blank lines and leaves out the numbers.
    const selection = window.getSelection()
    if (selection === null) throw new Error('no selection')
    selection.selectAllChildren(lines)
    await expect(selection.toString().replace(/\n$/, '')).toBe(script.join('\n'))
    selection.removeAllRanges()

    // Script explanation (440:1423): padding 20, sections 16 apart.
    const explain = pick(canvas.getByTestId('explain'), '.script-explanation__root')
    await expect(getComputedStyle(explain).paddingTop).toBe('20px')
    const card = within(explain).getByRole('region', { name: 'Overview' })
    const cardStyle = getComputedStyle(card)
    await expect(cardStyle.backgroundColor).toBe(swatch(canvasElement, 'raised'))
    await expect(cardStyle.borderTopColor).toBe(swatch(canvasElement, 'border'))
    await expect(cardStyle.borderTopLeftRadius).toBe('10px')
    await expect([cardStyle.paddingTop, cardStyle.paddingLeft]).toEqual(['12px', '16px'])
    const label = pick(card, '.script-explanation__label')
    await expect(getComputedStyle(label).textTransform).toBe('uppercase')
    await expect(getComputedStyle(label).color).toBe(swatch(canvasElement, 'muted'))
    await expect(getComputedStyle(pick(card, '.script-explanation__summary')).color).toBe(swatch(canvasElement, 'default'))
    await expect(getComputedStyle(pick(card, 'dt')).color).toBe(swatch(canvasElement, 'muted'))
    await expect(getComputedStyle(pick(card, 'dd')).color).toBe(swatch(canvasElement, 'default'))
    const walkthrough = within(explain).getByRole('list', { name: 'Walkthrough' })
    await expect(box(walkthrough).top - box(card).bottom).toBeGreaterThanOrEqual(16)
    const rows = all(walkthrough, 'li')
    const [row1, row2] = rows
    if (row1 === undefined || row2 === undefined) throw new Error('no steps')
    await expect(rows.length).toBe(steps.length)
    await expect(box(row2).top - box(row1).bottom).toBe(12)
    const badge = pick(row1, '.script-explanation__stepNumber')
    const badgeStyle = getComputedStyle(badge)
    await expect(badge.textContent).toBe('1')
    await expect(badge.getAttribute('aria-hidden')).toBe('true')
    await expect(badgeStyle.backgroundColor).toBe(swatch(canvasElement, 'raised'))
    await expect(badgeStyle.borderTopColor).toBe(swatch(canvasElement, 'border'))
    await expect(badgeStyle.borderTopLeftRadius).toBe('999px')
    const text = pick(row1, '.script-explanation__stepText')
    await expect(box(text).left - box(badge).right).toBe(10)
    await expect(font(text)).toEqual(['14px', 20, '400'])
    const link = pick(row1, '.script-explanation__lineLink')
    const linkStyle = getComputedStyle(link)
    await expect(link.textContent).toBe('line 2')
    await expect(linkStyle.borderTopColor).toBe(swatch(canvasElement, 'selectedBorder'))
    await expect(linkStyle.borderTopLeftRadius).toBe('6px')
    await expect(linkStyle.color).toBe(swatch(canvasElement, 'accent'))
    await expect([linkStyle.paddingTop, linkStyle.paddingLeft]).toEqual(['2px', '6px'])
    // Without onLineSelect, the line is text, not a button.
    await expect(within(explain).queryByRole('button')).toBeNull()
    const note = pick(explain, '.script-explanation__note')
    await expect(font(note)).toEqual(['12px', 16, '400'])
    await expect(getComputedStyle(note).color).toBe(swatch(canvasElement, 'muted'))
    // The spark before the note (440:1480 draws 14 px): 12 px, 6 before the text, hidden from assistive technology.
    const spark = note.querySelector('svg')
    if (!(spark instanceof SVGSVGElement)) throw new Error('no spark')
    await expect(spark.getBoundingClientRect().width).toBe(12)
    await expect(spark.getAttribute('aria-hidden')).toBe('true')
    const noteText = document.createRange()
    noteText.selectNode(note.lastChild ?? note)
    await expect(noteText.getBoundingClientRect().left - spark.getBoundingClientRect().right).toBe(6)
  },
} satisfies Meta<typeof Content>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onLineSelect = fn<(line: number) => void>()

/** Each line link reports its line, by click or by keyboard. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => <Content onLineSelect={onLineSelect} />,
  play: async ({ canvasElement }) => {
    onLineSelect.mockClear()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'line 9' }))
    await expect(onLineSelect).toHaveBeenCalledTimes(1)
    await expect(onLineSelect).toHaveBeenLastCalledWith(9)
    const last = canvas.getByRole('button', { name: 'line 12' })
    last.focus()
    await userEvent.keyboard('{Enter}')
    await expect(onLineSelect).toHaveBeenLastCalledWith(12)
    await expect(onLineSelect).toHaveBeenCalledTimes(2)
  },
}

// A tiny demo highlighter for the story only; the app plugs in a real one (d-068).
// It colours `ts` fences and returns undefined for every other language.
const tokens = /(\/\/.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|\b(function|return|const|let|if|else|export|import|from)\b|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_]\w*)(?=\()/g

const demoKind = (m: RegExpExecArray): CodeKind | undefined => {
  if (m[1] !== undefined) return 'comment'
  if (m[2] !== undefined) return 'string'
  if (m[3] !== undefined) return 'keyword'
  if (m[4] !== undefined) return 'number'
  if (m[5] !== undefined) return 'function'
  return undefined
}

const demoLine = (line: string): CodeSegment[] => {
  const parts: CodeSegment[] = []
  let at = 0
  for (const m of line.matchAll(tokens)) {
    if (m.index > at) parts.push({ text: line.slice(at, m.index) })
    parts.push({ text: m[0], kind: demoKind(m) })
    at = m.index + m[0].length
  }
  if (at < line.length) parts.push({ text: line.slice(at) })
  return parts
}

const demoHighlight: MarkdownHighlight = (code, lang) => (lang === 'ts' ? code.split('\n').map(demoLine) : undefined)

const tsFence = ["// Adds the tax to a price.", "export function total(price: number) {", "  const rate = 0.2", "  return price * (1 + rate) + ' EUR'", '}'].join('\n')
const bashFence = ['set -euo pipefail', 'pnpm verify'].join('\n')

const keywordSwatch = css({ color: 'code.keyword' })

function Highlighted() {
  return (
    <main className={page}>
      <div className={panel} data-testid="highlighted">
        <MarkdownView highlight={demoHighlight}>
          <h1>total</h1>
          <p>Adds the tax to a price.</p>
          <pre>
            <code className="language-ts">{`${tsFence}\n`}</code>
          </pre>
          <p>Check it before you push:</p>
          <pre>
            <code className="language-bash">{`${bashFence}\n`}</code>
          </pre>
        </MarkdownView>
      </div>
      <span hidden data-swatch="keyword" className={keywordSwatch} />
      <span hidden data-swatch="muted" className={swatches.muted} />
    </main>
  )
}

/** Fenced code in syntax colours from the caller's `highlight`; a fence it returns nothing for stays plain. */
const highlightedPlay: NonNullable<StoryObj<typeof meta>['play']> = async ({ canvasElement }) => {
  const md = pick(within(canvasElement).getByTestId('highlighted'), '.markdown-view')
  const [ts, bash] = all(md, 'pre > code')
  if (ts === undefined || bash === undefined) throw new Error('no fences')
  const keyword = pick(ts, '[data-kind="keyword"]')
  await expect(keyword.textContent).toBe('export')
  await expect(getComputedStyle(keyword).color).toBe(swatch(canvasElement, 'keyword'))
  await expect(getComputedStyle(keyword).color).not.toBe(swatch(canvasElement, 'muted'))
  await expect(all(ts, '[data-kind]').map((el) => el.dataset['kind'])).toEqual(expect.arrayContaining(['comment', 'keyword', 'function', 'number', 'string']))
  // The bash fence has no highlighter result: plain text, no coloured pieces.
  await expect(all(bash, '[data-kind]')).toEqual([])
  await expect(getComputedStyle(bash).color).toBe(swatch(canvasElement, 'muted'))
  // The text, and so the copied code, is the original code.
  await expect(ts.textContent).toBe(`${tsFence}\n`)
  await expect(bash.textContent).toBe(`${bashFence}\n`)
  const selection = window.getSelection()
  if (selection === null) throw new Error('no selection')
  selection.selectAllChildren(ts)
  await expect(selection.toString().replace(/\n$/, '')).toBe(tsFence)
  selection.removeAllRanges()
}

export const HighlightedDark: StoryObj<typeof meta> = { render: () => <Highlighted />, play: highlightedPlay, globals: { mode: 'dark' } }
export const HighlightedLight: StoryObj<typeof meta> = { render: () => <Highlighted />, play: highlightedPlay, globals: { mode: 'light' } }

// Colours every word as a keyword, so each line has several coloured pieces.
const everyWord: MarkdownHighlight = (code) => code.split('\n').map((line) => line.split(/( )/).map((text) => (text === ' ' ? { text } : { text, kind: 'keyword' })))

function Updating() {
  const [code, setCode] = useState('a b\nc d')
  return (
    <main className={page}>
      <button
        type="button"
        onClick={() => {
          setCode('a\nc')
        }}
      >
        Shorten
      </button>
      <div className={panel} data-testid="updating">
        <MarkdownView highlight={everyWord}>
          <pre>
            <code className="language-txt">{`${code}\n`}</code>
          </pre>
        </MarkdownView>
      </div>
    </main>
  )
}

/** When the code changes, each coloured piece shows its new text: keys never repeat across lines. */
export const HighlightedUpdate: StoryObj<typeof meta> = {
  render: () => <Updating />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const code = pick(canvas.getByTestId('updating'), 'pre > code')
    await expect(code.textContent).toBe('a b\nc d\n')
    await userEvent.click(canvas.getByRole('button', { name: 'Shorten' }))
    await expect(pick(canvas.getByTestId('updating'), 'pre > code').textContent).toBe('a\nc\n')
    await expect(all(canvas.getByTestId('updating'), '[data-kind]').map((el) => el.textContent)).toEqual(['a', 'c'])
  },
}

// A component that accepts exactly one child, as some Markdown renderers' wrappers do.
function OnlyChild({ children }: { children: ReactNode }) {
  return <div data-testid="only">{Children.only(children)}</div>
}

function Wrapped() {
  return (
    <main className={page}>
      <div className={panel} data-testid="wrapped">
        <MarkdownView highlight={demoHighlight}>
          <OnlyChild>
            <pre>
              <code className="language-ts">{`${tsFence}\n`}</code>
            </pre>
          </OnlyChild>
          <OnlyChild>
            <pre>
              <code className="language-bash">{`${bashFence}\n`}</code>
            </pre>
          </OnlyChild>
          <OnlyChild>
            <p>Plain text.</p>
          </OnlyChild>
        </MarkdownView>
      </div>
    </main>
  )
}

/** A wrapper that calls `Children.only` still gets one child, coloured or not. */
export const HighlightedSingleChild: StoryObj<typeof meta> = {
  render: () => <Wrapped />,
  play: async ({ canvasElement }) => {
    const wrappers = within(canvasElement).getAllByTestId('only')
    await expect(wrappers.length).toBe(3)
    const [ts, bash, plain] = wrappers
    if (ts === undefined || bash === undefined || plain === undefined) throw new Error('no wrappers')
    await expect(pick(ts, '[data-kind="keyword"]').textContent).toBe('export')
    await expect(pick(ts, 'pre > code').textContent).toBe(`${tsFence}\n`)
    await expect(all(bash, '[data-kind]')).toEqual([])
    await expect(pick(bash, 'pre > code').textContent).toBe(`${bashFence}\n`)
    await expect(pick(plain, 'p').textContent).toBe('Plain text.')
  },
}

/** Bold text uses the `heading` weight token (600) in `fg.default`, not the browser's default bold. */
export const Strong: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <div className={panel}>
        <MarkdownView>
          <p>
            Plain, then <strong>bold</strong>.
          </p>
        </MarkdownView>
      </div>
      <span hidden data-swatch="default" className={css({ color: 'fg.default' })} />
    </main>
  ),
  globals: { mode: 'dark' },
  play: async ({ canvasElement }) => {
    const strong = pick(canvasElement, '.markdown-view strong')
    const ref = pick(canvasElement, '[data-swatch="default"]')
    await expect(getComputedStyle(strong).fontWeight).toBe('600')
    await expect(getComputedStyle(strong).color).toBe(getComputedStyle(ref).color)
  },
}

/** The small size, as the Inbox detail sections draw their body text (D1 346:354): bodySm, with labelSm subheadings. */
function Small() {
  return (
    <main className={page}>
      <div className={panel} data-testid="sm">
        <MarkdownView size="sm">
          <h2>Why</h2>
          <p>Tickets come before any code, and nothing blocks them.</p>
          <ul>
            <li>One ticket per screen</li>
          </ul>
        </MarkdownView>
      </div>
      <div className={panel} data-testid="md">
        <MarkdownView>
          <h2>Why</h2>
          <p>The default size.</p>
        </MarkdownView>
      </div>
    </main>
  )
}

const smallPlay: NonNullable<StoryObj<typeof meta>['play']> = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const sm = pick(canvas.getByTestId('sm'), '.markdown-view')
  const md = pick(canvas.getByTestId('md'), '.markdown-view')
  // A one-line paragraph and item lay out at 20, a subheading at 16: whole pixels on the 4 px grid.
  await expect([font(pick(sm, 'p')), box(pick(sm, 'p')).height]).toEqual([['13px', 20, '400'], 20])
  await expect([font(pick(sm, 'li')), box(pick(sm, 'li')).height]).toEqual([['13px', 20, '400'], 20])
  await expect([font(pick(sm, 'h2')), box(pick(sm, 'h2')).height]).toEqual([['13px', 16, '500'], 16])
  // The default size keeps body and label.
  await expect(font(pick(md, 'p'))).toEqual(['14px', 20, '400'])
  await expect(font(pick(md, 'h2'))).toEqual(['14px', 20, '500'])
}

export const SmallDark: StoryObj<typeof meta> = { render: () => <Small />, play: smallPlay, globals: { mode: 'dark' } }
export const SmallLight: StoryObj<typeof meta> = { render: () => <Small />, play: smallPlay, globals: { mode: 'light' } }

// An Inbox detail section (D1 346:354) draws its own column; the text starts at its edge.
const section = css({ w: 'shell.dialogLg', bg: 'surface.pane', p: '16' })

/** `padding="none"`: the text sits flush in a box that sets its own padding, as an Inbox detail section does. */
function Flush() {
  return (
    <main className={page}>
      <div className={section} data-testid="flush">
        <MarkdownView size="sm" padding="none">
          <p>Tickets come before any code, and nothing blocks them.</p>
        </MarkdownView>
      </div>
      <div className={section} data-testid="padded">
        <MarkdownView size="sm">
          <p>The default padding.</p>
        </MarkdownView>
      </div>
    </main>
  )
}

const flushPlay: NonNullable<StoryObj<typeof meta>['play']> = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const flush = canvas.getByTestId('flush')
  const view = pick(flush, '.markdown-view')
  const s = getComputedStyle(view)
  await expect([s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft]).toEqual(['0px', '0px', '0px', '0px'])
  // The paragraph starts at the section's content edge and the view is as tall as its one line.
  await expect(box(pick(view, 'p')).left - box(flush).left).toBe(16)
  await expect(box(view).height).toBe(20)
  await expect(font(pick(view, 'p'))).toEqual(['13px', 20, '400'])
  // The default keeps the 20 by 24 padding.
  const padded = getComputedStyle(pick(canvas.getByTestId('padded'), '.markdown-view'))
  await expect([padded.paddingTop, padded.paddingLeft]).toEqual(['20px', '24px'])
}

export const FlushDark: StoryObj<typeof meta> = { render: () => <Flush />, play: flushPlay, globals: { mode: 'dark' } }
export const FlushLight: StoryObj<typeof meta> = { render: () => <Flush />, play: flushPlay, globals: { mode: 'light' } }

// The phone's Toolkit item (M08 `content` 440:1630): 12 px in from each side of the 390 px screen.
const phoneItem = css({ bg: 'bg.canvas', px: '12', py: '12', display: 'flex', flexDirection: 'column', gap: '24' })
const phone = { m08: { name: 'Phone (M08)', styles: { width: '390px', height: '844px' } } }
// The overview's In, Out and Exit (440:1634 to 440:1642).
const m08Facts = [
  { key: 'In', value: 'one or more files, --form, --ste' },
  { key: 'Out', value: 'one JSON line for each file' },
  { key: 'Exit', value: '0 pass · 1 a rule fails · 2 bad input' },
]

/** `layout="narrow"`: the phone's Explain view (Toolkit M08) on a 390 px screen, then the default `wide` layout. */
function Narrow() {
  return (
    <main className={phoneItem}>
      <div data-testid="narrow">
        <ScriptExplanation
          layout="narrow"
          summary="Checks a draft against the writing rules and prints one JSON line for each file."
          facts={m08Facts}
          steps={steps}
          note="Claude wrote this explanation from the script."
          onLineSelect={() => undefined}
        />
      </div>
      <div data-testid="wide">
        <ScriptExplanation summary="The default layout." summaryLabel="Default" stepsLabel="Default steps" facts={m08Facts} steps={steps.slice(0, 2)} />
      </div>
      <Swatches />
    </main>
  )
}

const factCells = (root: HTMLElement) => {
  const keys = all(root, '.script-explanation__factKey')
  const values = all(root, '.script-explanation__factValue')
  return keys.map((key, i) => {
    const value = values[i]
    if (value === undefined) throw new Error(`no value for ${key.textContent}`)
    return { key, value }
  })
}

const narrowPlay: NonNullable<StoryObj<typeof meta>['play']> = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  await expect(window.innerWidth).toBe(390)
  const holder = canvas.getByTestId('narrow')
  const root = pick(holder, '.script-explanation__root')
  // No padding: the card (440:1631) starts at the item's edge, 12 in from the screen.
  const s = getComputedStyle(root)
  await expect([s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft]).toEqual(['0px', '0px', '0px', '0px'])
  const card = within(root).getByRole('region', { name: 'Overview' })
  await expect(box(card).left).toBe(box(holder).left)
  await expect(box(card).left).toBe(12)
  await expect(box(card).width).toBe(366)
  // The card, WALKTHROUGH and the steps are 12 apart; the steps 10 apart.
  const walkthrough = within(root).getByRole('list', { name: 'Walkthrough' })
  const labels = all(root, ':scope > .script-explanation__label')
  const stepsLabel = labels[0]
  if (stepsLabel === undefined) throw new Error('no Walkthrough label')
  await expect(box(stepsLabel).top - box(card).bottom).toBe(12)
  await expect(box(walkthrough).top - box(stepsLabel).bottom).toBe(12)
  const rows = all(walkthrough, 'li')
  await expect(rows.length).toBe(steps.length)
  for (const [i, row] of rows.entries()) {
    const next = rows[i + 1]
    if (next !== undefined) await expect(box(next).top - box(row).bottom).toBe(10)
    // Each line link sits 4 under its step's text, at the text's start, and ends the row.
    const text = pick(row, '.script-explanation__stepText')
    const link = pick(row, '.script-explanation__lineLink')
    const badge = pick(row, '.script-explanation__stepNumber')
    await expect(box(text).left - box(badge).right).toBe(10)
    await expect(box(link).top - box(text).bottom).toBe(4)
    await expect(box(link).left).toBe(box(text).left)
    await expect(box(link).bottom).toBe(box(row).bottom)
    await expect(box(link).width).toBeLessThan(box(text).width)
  }
  // The keys sit in a 40 px column: every value starts at one x, 50 after its key's start (440:1635, 440:1636).
  const facts = factCells(root)
  await expect(facts.map((f) => f.key.textContent)).toEqual(['In', 'Out', 'Exit'])
  for (const { key, value } of facts) {
    await expect(box(key).width).toBe(40)
    await expect(box(value).left - box(key).left).toBe(50)
  }
  await expect(new Set(facts.map((f) => box(f.value).left)).size).toBe(1)

  // The default layout keeps its 20 px padding, its parts 16 apart and each line link at the end of its row.
  const wide = pick(canvas.getByTestId('wide'), '.script-explanation__root')
  const w = getComputedStyle(wide)
  await expect([w.paddingTop, w.paddingRight, w.paddingBottom, w.paddingLeft]).toEqual(['20px', '20px', '20px', '20px'])
  await expect(w.rowGap).toBe('16px')
  const wideRows = all(wide, 'li')
  const [wideRow1, wideRow2] = wideRows
  if (wideRow1 === undefined || wideRow2 === undefined) throw new Error('no wide steps')
  await expect(box(wideRow2).top - box(wideRow1).bottom).toBe(12)
  const wideLink = pick(wideRow1, '.script-explanation__lineLink')
  const wideText = pick(wideRow1, '.script-explanation__stepText')
  await expect(box(wideLink).top).toBe(box(wideText).top)
  await expect(box(wideLink).left).toBeGreaterThan(box(wideText).right)
  await expect(box(wideLink).right).toBe(box(wideRow1).right)
  // D10 and T06 put the keys in the same 40 px column (440:1428, 440:1930).
  for (const { key, value } of factCells(wide)) {
    await expect(box(value).left - box(key).left).toBe(50)
  }
}

export const NarrowDark: StoryObj<typeof meta> = {
  render: () => <Narrow />,
  play: narrowPlay,
  parameters: { viewport: { options: phone } },
  globals: { mode: 'dark', viewport: { value: 'm08' } },
}
export const NarrowLight: StoryObj<typeof meta> = {
  render: () => <Narrow />,
  play: narrowPlay,
  parameters: { viewport: { options: phone } },
  globals: { mode: 'light', viewport: { value: 'm08' } },
}

const phoneColumn = css({ w: 'shell.popover', bg: 'surface.pane' })
const wideFormula = css({ display: 'inline-block', w: 'shell.dialogLg' })
// Math as KaTeX writes it: `.katex` inline and a `.katex-display` block. The app gives the block a tab stop.
function MathText() {
  return (
    <main className={page}>
      <div className={phoneColumn}>
        <MarkdownView>
          <p>
            The area is <span className="katex">πr²</span> here.
          </p>
          <div className="katex-display" tabIndex={0} data-testid="display">
            <span className="katex">
              <span className={wideFormula}>a wide display formula that is wider than the phone column</span>
            </span>
          </div>
          <p>After the formula.</p>
        </MarkdownView>
      </div>
    </main>
  )
}

const mathPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const display = within(canvasElement).getByTestId('display')
  // A wide display formula scrolls sideways in its own box; the column does not.
  await expectScrollAreas(canvasElement, 'x', '.katex-display')
  await expect(display.scrollWidth).toBeGreaterThan(display.clientWidth)
  const column = display.closest('.markdown-view')
  if (!(column instanceof HTMLElement)) throw new Error('no view')
  await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth)
  // No margin of its own: the view's 10 px gap sets it apart, as every block.
  await expect(getComputedStyle(display).marginTop).toBe('0px')
  // The formula keeps the text colour round it.
  const inline = canvasElement.querySelector('p .katex')
  if (!(inline instanceof HTMLElement)) throw new Error('no inline formula')
  await expect(getComputedStyle(inline).color).toBe(getComputedStyle(inline.parentElement ?? inline).color)
}

/** KaTeX math in the phone column: a wide display formula scrolls in its own box, and a formula keeps the text colour. */
export const MathDark: StoryObj<typeof meta> = { render: () => <MathText />, play: mathPlay, globals: { mode: 'dark' } }
export const MathLight: StoryObj<typeof meta> = { render: () => <MathText />, play: mathPlay, globals: { mode: 'light' } }


// A flag in a fact value at Large on the phone (the-bridge Toolkit, NCC-145): the browser may break a line after a
// hyphen-minus before a letter, so "--ste" showed as "--" and "ste". Each space-separated token of a value stays on
// one line when it fits; a token wider than the line still breaks inside itself.
const flagWidths = { popoverSm: css({ w: 'shell.popoverSm' }), popover: css({ w: 'shell.popover' }), phone: css({ w: 'shell.popoverPicker' }) }
// A token wider than the narrowest column still breaks inside itself and stays in its box.
const flagFacts = [...m08Facts, { key: 'Env', value: 'WRITER_RULES_DIRECTORY_OVERRIDE_FOR_THE_STE_CHECK' }]
function FlagWords() {
  return (
    <main className={phoneItem}>
      {Object.entries(flagWidths).map(([width, className]) => (
        <div key={width} className={className} data-testid={`flags-${width}`}>
          <ScriptExplanation layout="narrow" summary={`Flags at ${width}.`} summaryLabel={`Overview ${width}`} stepsLabel={`Steps ${width}`} facts={flagFacts} steps={[]} />
        </div>
      ))}
    </main>
  )
}

// The tokens (runs between spaces) inside `root` that the browser drew on more than one line.
const splitTokens = (root: Element): string[] => {
  const out: string[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    for (const match of (node.textContent ?? '').matchAll(/\S+/g)) {
      const range = document.createRange()
      range.setStart(node, match.index)
      range.setEnd(node, match.index + match[0].length)
      const tops = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)))
      if (tops.size > 1) out.push(match[0])
    }
  }
  return out
}

const flagWordsPlay: NonNullable<StoryObj<typeof meta>['play']> = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  for (const size of textSizes) {
    await atTextSize(size, async () => {
      for (const width of Object.keys(flagWidths)) {
        const values = all(canvas.getByTestId(`flags-${width}`), '.script-explanation__factValue')
        const split = values.slice(0, 3).flatMap(splitTokens)
        for (const value of values) await expect(value.scrollWidth).toBeLessThanOrEqual(value.clientWidth)
        await expect({ size, width, split }).toEqual({ size, width, split: [] })
        // The value keeps its text as given: real hyphen-minus signs, which a copy takes along.
        await expect(values[0]?.textContent).toBe('one or more files, --form, --ste')
      }
    })
  }
}

/** The phone's In, Out and Exit values at Small, Default and Large: a flag such as "--ste" never breaks after "--". */
export const FlagWordsDark: StoryObj<typeof meta> = { render: () => <FlagWords />, play: flagWordsPlay, globals: { mode: 'dark', textSize: 'small' } }
export const FlagWordsLight: StoryObj<typeof meta> = { render: () => <FlagWords />, play: flagWordsPlay, globals: { mode: 'light', textSize: 'small' } }
