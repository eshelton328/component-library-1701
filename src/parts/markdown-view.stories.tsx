import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { CodeLines } from './code-lines'
import { MarkdownView } from './markdown-view'
import { ScriptExplanation, type ScriptStep } from './script-explanation'

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
    await expect(font(h1)).toEqual(['20px', 29, '600'])
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
    const loose = pick(canvas.getByTestId('loose'), 'li')
    const [para1, para2] = all(loose, 'p')
    if (para1 === undefined || para2 === undefined) throw new Error('no loose paragraphs')
    await expect(Math.abs(box(para1).top - box(loose).top)).toBeLessThanOrEqual(1)
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
    await expect(font(firstText)).toEqual(['12px', 17, '400'])
    await expect(getComputedStyle(firstText).color).toBe(swatch(canvasElement, 'default'))
    await expect(getComputedStyle(firstNumber).color).toBe(swatch(canvasElement, 'muted'))
    await expect(firstNumber.getAttribute('aria-hidden')).toBe('true')
    await expect(getComputedStyle(firstNumber).userSelect).toBe('none')
    await expect(firstText.textContent).toBe('#!/usr/bin/env bash\n')
    await expect(box(firstText).height).toBe(17)
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
    await expect(font(note)).toEqual(['12px', 17, '400'])
    await expect(getComputedStyle(note).color).toBe(swatch(canvasElement, 'muted'))
    // The spark before the note (440:1480): 14 px, 6 before the text, hidden from assistive technology.
    const spark = note.querySelector('svg')
    if (!(spark instanceof SVGSVGElement)) throw new Error('no spark')
    await expect(spark.getBoundingClientRect().width).toBe(14)
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
