import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { css } from '../../styled-system/css'
import { token } from '../../styled-system/tokens'
import { expectScrollAreas } from '../controls/scroll-area.testing'
import { MarkdownView } from './markdown-view'
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from './table'

// A chat reply on the desktop: the chat column (shell.thread) on the canvas.
const desktopPage = css({ bg: 'bg.canvas', p: '24' })
const thread = css({ w: 'shell.thread' })
// The phone: the reply fills the 390 px viewport with the page's own 16 sides.
const phonePage = css({ bg: 'bg.canvas', px: '16', py: '24' })

const swatches = {
  label: css({ textStyle: 'label', color: 'fg.default' }),
  labelSm: css({ textStyle: 'labelSm' }),
  body: css({ textStyle: 'body', color: 'fg.muted' }),
  bodySm: css({ textStyle: 'bodySm' }),
  border: css({ color: 'border.default' }),
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

function swatch(root: HTMLElement, name: keyof typeof swatches): CSSStyleDeclaration {
  const el = root.querySelector(`[data-swatch="${name}"]`)
  if (!(el instanceof HTMLElement)) throw new Error(`no ${name} swatch`)
  return getComputedStyle(el)
}

function pick(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector(selector)
  if (!(el instanceof HTMLElement)) throw new Error(`no ${selector}`)
  return el
}

function all(root: ParentNode, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll(selector)).filter((el) => el instanceof HTMLElement)
}

const font = (s: CSSStyleDeclaration) => [s.fontFamily, s.fontSize, s.lineHeight, s.fontWeight]

// The node react-markdown hands each override; the parts must not write it to the DOM.
const node = { type: 'element' }

const meta = {
  title: 'Data display/Table',
  component: Table,
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

function Reply() {
  return (
    <main className={desktopPage}>
      <div className={thread} data-testid="reply">
        <MarkdownView padding="none">
          <p>The three gates ran on the release branch:</p>
          <Table node={node}>
            <TableHead node={node}>
              <TableRow node={node}>
                <TableHeaderCell node={node}>Gate</TableHeaderCell>
                <TableHeaderCell node={node}>Result</TableHeaderCell>
                <TableHeaderCell node={node}>Time</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody node={node}>
              <TableRow node={node}>
                <TableCell node={node}>Typecheck</TableCell>
                <TableCell node={node}>Passed</TableCell>
                <TableCell node={node}>41 s</TableCell>
              </TableRow>
              <TableRow node={node}>
                <TableCell node={node}>Story tests</TableCell>
                <TableCell node={node}>Passed after one retry</TableCell>
                <TableCell node={node}>6 min</TableCell>
              </TableRow>
              <TableRow node={node}>
                <TableCell node={node}>API report</TableCell>
                <TableCell node={node}>
                  <del>Failed</del> Passed
                </TableCell>
                <TableCell node={node}>12 s</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <ul className="contains-task-list" data-testid="tasks">
            <li className="task-list-item">
              <input type="checkbox" checked disabled aria-label="Done" /> Merge the table part
            </li>
            <li className="task-list-item">
              <input type="checkbox" disabled aria-label="To do" /> Map the GFM elements in the-bridge
            </li>
          </ul>
          <p>
            Release notes: <a href="https://example.com/releases">https://example.com/releases</a>
          </p>
          <Table size="sm">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Size</TableHeaderCell>
                <TableHeaderCell>Text</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>sm</TableCell>
                <TableCell>bodySm and labelSm, as the Inbox detail</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </MarkdownView>
      </div>
      <Swatches />
    </main>
  )
}

/**
 * A table in a desktop chat reply, with GFM strikethrough, a task list and an
 * autolink around it. The frame is as wide as the table; the header row is in
 * `label`, the cells in `body`, 8 by 12 apart, with lines between the rows.
 * Below it, the same part with `size="sm"`.
 */
const desktop: Story = {
  render: () => <Reply />,
  play: async ({ canvasElement }) => {
    const reply = pick(canvasElement, '[data-testid="reply"]')
    const [table, small] = all(reply, '.table__frame')
    if (table === undefined || small === undefined) throw new Error('no tables')
    await expectScrollAreas(canvasElement, 'x', '.table__frame')
    // The frame hugs the table, and the table fits: nothing scrolls on the desktop.
    await expect(table.getBoundingClientRect().width).toBeLessThan(reply.getBoundingClientRect().width)
    await expect(table.scrollWidth).toBeLessThanOrEqual(table.clientWidth)
    const th = pick(table, 'th')
    const td = pick(table, 'td')
    // The header cell has the header weight and style: `label` in fg.default.
    const label = swatch(canvasElement, 'label')
    await expect(getComputedStyle(th).fontWeight).toBe(token('fontWeights.text.label'))
    await expect(font(getComputedStyle(th))).toEqual(font(label))
    await expect(getComputedStyle(th).color).toBe(label.color)
    await expect(getComputedStyle(th).textAlign).toBe('start')
    // The cells are `body` in fg.muted.
    const body = swatch(canvasElement, 'body')
    await expect(font(getComputedStyle(td))).toEqual(font(body))
    await expect(getComputedStyle(td).color).toBe(body.color)
    // Cell padding is spacing.8 by spacing.12, on the 4 px grid.
    for (const cell of [th, td]) {
      const s = getComputedStyle(cell)
      await expect([s.paddingTop, s.paddingBottom]).toEqual([token('spacing.8'), token('spacing.8')])
      await expect([s.paddingLeft, s.paddingRight]).toEqual([token('spacing.12'), token('spacing.12')])
    }
    // Lines: under the header and between body rows, none under the last row.
    const border = swatch(canvasElement, 'border').color
    const head = pick(table, 'thead')
    await expect([getComputedStyle(head).borderBottomWidth, getComputedStyle(head).borderBottomColor]).toEqual([token('borderWidths.default'), border])
    const rows = all(table, 'tbody tr')
    await expect(rows.map((r) => getComputedStyle(r).borderBottomWidth)).toEqual([token('borderWidths.default'), token('borderWidths.default'), '0px'])
    await expect(getComputedStyle(table).borderTopColor).toBe(border)
    // react-markdown's node prop never reaches the DOM.
    await expect(reply.querySelector('[node]')).toBeNull()
    // size sm: bodySm cells and labelSm headers.
    await expect(font(getComputedStyle(pick(small, 'td')))).toEqual(font(swatch(canvasElement, 'bodySm')))
    await expect(font(getComputedStyle(pick(small, 'th')))).toEqual(font(swatch(canvasElement, 'labelSm')))
    // GFM in MarkdownView: strikethrough, a task list with no markers and a disabled checkbox, autolinks as links.
    await expect(getComputedStyle(pick(reply, 'del')).textDecorationLine).toBe('line-through')
    const tasks = all(pick(reply, '[data-testid="tasks"]'), 'li')
    for (const task of tasks) {
      await expect(getComputedStyle(task).listStyleType).toBe('none')
      const box = pick(task, 'input')
      await expect(box).toBeDisabled()
      await expect(getComputedStyle(box).marginRight).toBe(token('spacing.8'))
    }
    await expect(getComputedStyle(pick(reply, 'a')).textDecorationLine).toBe('underline')
  },
}
export const DesktopDark: Story = { ...desktop, globals: { mode: 'dark' } }
export const DesktopLight: Story = { ...desktop, globals: { mode: 'light' } }

const phone = { phone: { name: 'Phone (390)', styles: { width: '390px', height: '844px' } } }

const services = [
  ['checkout-gateway', 'running', '5181', 'build-host', '2026-11-23 09:14', 'Serves the API and the chat stream'],
  ['vite', 'running', '5173', 'build-host', '2026-11-23 09:15', 'Serves the web app with hot reload'],
  ['storybook', 'stopped', '6006', 'build-host', '2026-11-22 18:40', 'Shows the component library'],
] as const

function Wide() {
  return (
    <main className={phonePage} data-testid="root">
      <MarkdownView padding="none">
        <p>Each service on this machine:</p>
        <Table>
          <TableHead>
            <TableRow>
              {['Service', 'State', 'Port', 'Machine', 'Started', 'What it does'].map((h) => (
                <TableHeaderCell key={h}>{h}</TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {services.map((row) => (
              <TableRow key={row[0]}>
                {row.map((cell, i) => (
                  <TableCell key={String(i)}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </MarkdownView>
    </main>
  )
}

/**
 * A six-column table on a 390 px phone. The table is wider than the reply,
 * so it scrolls sideways in its frame and the page does not. The words stay
 * whole, and the first column keeps "checkout-gateway" on one line.
 */
const narrow: Story = {
  render: () => <Wide />,
  parameters: { viewport: { options: phone } },
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(390)
    const root = pick(canvasElement, '[data-testid="root"]')
    const frame = pick(canvasElement, '.table__frame')
    await expectScrollAreas(canvasElement, 'x', '.table__frame')
    // The frame scrolls sideways; the story root and the page do not.
    await expect(getComputedStyle(frame).overflowX).toBe('auto')
    await expect(frame.scrollWidth).toBeGreaterThan(frame.clientWidth)
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth)
    await expect(frame.getBoundingClientRect().right).toBeLessThanOrEqual(root.getBoundingClientRect().right)
    // The frame takes the focus, so the keyboard can scroll it.
    await expect(frame.tabIndex).toBe(0)
    // The frame is its own element between the MarkdownView and the table.
    await expect(frame.parentElement?.classList.contains('markdown-view')).toBe(true)
    await expect(frame.firstElementChild?.tagName).toBe('TABLE')
    // The first column is one line high: "checkout-gateway" is not broken, not even at its hyphen.
    const first = pick(frame, 'tbody td')
    await expect(first.textContent).toBe('checkout-gateway')
    // A cell is as tall as its row, so measure the text itself.
    const range = document.createRange()
    range.selectNodeContents(first)
    await expect(range.getClientRects()).toHaveLength(1)
    await expect(Math.round(range.getBoundingClientRect().height)).toBeLessThanOrEqual(Math.round(Number.parseFloat(getComputedStyle(first).lineHeight)))
  },
}
export const NarrowDark: Story = { ...narrow, globals: { mode: 'dark', viewport: { value: 'phone' } } }
export const NarrowLight: Story = { ...narrow, globals: { mode: 'light', viewport: { value: 'phone' } } }

// The props react-markdown spreads on a th or td for a GFM column with `:--` or `:-:` (hast-util-to-jsx-runtime turns
// the cell's align into a style).
const gfm = {
  left: { style: { textAlign: 'left' } },
  center: { style: { textAlign: 'center' } },
} as const

const longPath = 'projects/ncc-1701/component-library-1701-worktrees/lib-table-part/src/parts/table.stories.tsx'

function Aligned() {
  return (
    <main className={phonePage} data-testid="root">
      <MarkdownView padding="none">
        {/* The props react-markdown writes for a GFM delimiter row `| :-- | --- | :-: | --: |`, and the align attribute of other renderers. */}
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell {...gfm.left}>Kind</TableHeaderCell>
              <TableHeaderCell>File</TableHeaderCell>
              <TableHeaderCell {...gfm.center}>Lines</TableHeaderCell>
              <TableHeaderCell align="right">Size</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell {...gfm.left}>story</TableCell>
              <TableCell>
                <code>{longPath}</code>
              </TableCell>
              <TableCell {...gfm.center}>214</TableCell>
              <TableCell align="right">9 KB</TableCell>
            </TableRow>
            <TableRow>
              <TableCell {...gfm.left}>commit</TableCell>
              <TableCell>
                <code>a3f9c2e17b04d5e6f8091a2b3c4d5e6f7a8b9c0d</code>
              </TableCell>
              <TableCell {...gfm.center}>1</TableCell>
              <TableCell align="right">40 B</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </MarkdownView>
    </main>
  )
}

/**
 * GFM alignment and a long path on a 390 px phone. Left, center and right
 * come from `style.textAlign` (react-markdown) or `align`; a column with none
 * starts at the start. The path and the hash are inline code, which breaks
 * anywhere, so they wrap in their cell and the table still fits the phone.
 */
const alignment: Story = {
  render: () => <Aligned />,
  parameters: { viewport: { options: phone } },
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(390)
    const frame = pick(canvasElement, '.table__frame')
    const aligns = (row: HTMLElement[]) => row.map((c) => getComputedStyle(c).textAlign)
    const heads = all(frame, 'th')
    const cells = all(frame, 'tbody tr:first-child td')
    await expect(aligns(heads)).toEqual(['left', 'start', 'center', 'right'])
    await expect(aligns(cells)).toEqual(['left', 'start', 'center', 'right'])
    // The alignment is the recipe's, not an inline style.
    for (const cell of [...heads, ...cells]) await expect(cell.getAttribute('style')).toBeNull()
    // The long path wraps in its cell: the table fits the phone and nothing scrolls.
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth)
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth)
    const pathCell = cells[1]
    if (pathCell === undefined) throw new Error('no path cell')
    const code = pick(pathCell, 'code')
    await expect(code.getBoundingClientRect().height).toBeGreaterThan(2 * Number.parseFloat(getComputedStyle(code).lineHeight))
    await expect(code.getBoundingClientRect().right).toBeLessThanOrEqual(pathCell.getBoundingClientRect().right)
  },
}
export const AlignmentDark: Story = { ...alignment, globals: { mode: 'dark', viewport: { value: 'phone' } } }
export const AlignmentLight: Story = { ...alignment, globals: { mode: 'light', viewport: { value: 'phone' } } }
