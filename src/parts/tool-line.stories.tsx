import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Stack } from '../controls/layout'
import { ToolLine } from './tool-line'
import { expectCutText } from '../controls/tooltip.testing'

const page = css({ bg: 'surface.pane', p: '24', w: 'shell.dialogLg' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  muted: css({ color: 'fg.muted' }),
  default: css({ color: 'fg.default' }),
  done: css({ color: 'status.done.fg' }),
  running: css({ color: 'status.running.fg' }),
  failed: css({ color: 'status.danger.fg' }),
  well: css({ color: 'surface.well' }),
  focus: css({ color: 'border.focus' }),
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
  const el = within(root).getByTestId(id).querySelector(`.tool-line__${name}`)
  if (!(el instanceof HTMLElement)) throw new Error(`no ${name} in ${id}`)
  return el
}

function Lines() {
  return (
    <main className={page}>
      <Stack gap="12">
        <div data-testid="done">
          <ToolLine name="Read" target="f-005-the-bridge/requirements.md" />
        </div>
        <div data-testid="running">
          <ToolLine name="Writing" target="layout-notes.md" state="running" />
        </div>
        <div data-testid="failed">
          <ToolLine name="Bash" target="pnpm verify" state="failed" stateLabel="Failed with exit code 1" />
        </div>
        <div data-testid="empty">
          <ToolLine name="Grep" target="TODO" onOpenChange={() => undefined}>
            {[]}
            {[false, null]}
            <></>
          </ToolLine>
        </div>
        <div data-testid="open">
          <ToolLine name="Bash" target="git status --short" open onOpenChange={() => undefined}>
            {'M AGENTS.md\n?? toolkit/rules/diagrams.md'}
          </ToolLine>
        </div>
      </Stack>
      <Swatches />
    </main>
  )
}

const meta = {
  title: 'Conversation/Tool line',
  component: Lines,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // A 6 px round dot, 6 px before the text, centred in the row.
    const dot = slot(canvasElement, 'done', 'dot')
    const box = dot.getBoundingClientRect()
    await expect([box.width, box.height]).toEqual([6, 6])
    await expect(getComputedStyle(dot).borderTopLeftRadius).not.toBe('0px')
    const text = slot(canvasElement, 'done', 'text')
    await expect(text.getBoundingClientRect().left - box.right).toBe(6)
    const header = slot(canvasElement, 'done', 'header').getBoundingClientRect()
    await expect(box.top - header.top).toBeCloseTo(header.bottom - box.bottom, 0)
    // The name and target in one run, Mono 12 in fg.muted, with no fill or padding.
    await expect(text).toHaveTextContent(/^Read f-005-the-bridge\/requirements\.md$/)
    const style = getComputedStyle(text)
    await expect(style.fontSize).toBe('12px')
    await expect(style.fontFamily).toMatch(/Mono/)
    await expect(style.color).toBe(swatch(canvasElement, 'muted'))
    const head = getComputedStyle(slot(canvasElement, 'done', 'header'))
    await expect([head.backgroundColor, head.paddingTop, head.paddingLeft]).toEqual(['rgba(0, 0, 0, 0)', '0px', '0px'])
    // The dot takes the state's colour and names the state.
    await expect(getComputedStyle(dot).backgroundColor).toBe(swatch(canvasElement, 'done'))
    await expect(getComputedStyle(slot(canvasElement, 'running', 'dot')).backgroundColor).toBe(swatch(canvasElement, 'running'))
    await expect(getComputedStyle(slot(canvasElement, 'failed', 'dot')).backgroundColor).toBe(swatch(canvasElement, 'failed'))
    await expect(within(canvas.getByTestId('done')).getByRole('img', { name: 'Done' })).toBe(dot)
    await expect(canvas.getByRole('img', { name: 'Running' })).toBeInTheDocument()
    await expect(canvas.getByRole('img', { name: 'Failed with exit code 1' })).toBeInTheDocument()
    // A line without output is not a button.
    await expect(within(canvas.getByTestId('done')).queryByRole('button')).toBeNull()
    // Output that renders nothing (empty arrays, null, false, an empty fragment) makes no button and no card.
    await expect(within(canvas.getByTestId('empty')).queryByRole('button')).toBeNull()
    await expect(canvas.getByTestId('empty').querySelector('.tool-line__output')).toBeNull()
    // The open output sits 6 px under the line in the transcript card: surface.well, padding 10, radius 8, Mono 12 in fg.default.
    const toggle = within(canvas.getByTestId('open')).getByRole('button')
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const output = slot(canvasElement, 'open', 'output')
    await expect(toggle.getAttribute('aria-controls')).toBe(output.id)
    await expect(output.getBoundingClientRect().top - toggle.getBoundingClientRect().bottom).toBe(6)
    const card = getComputedStyle(output)
    await expect(card.backgroundColor).toBe(swatch(canvasElement, 'well'))
    await expect([card.paddingTop, card.paddingLeft, card.borderTopLeftRadius]).toEqual(['10px', '10px', '8px'])
    await expect([card.fontSize, card.color, card.whiteSpace]).toEqual(['12px', swatch(canvasElement, 'default'), 'pre-wrap'])
    // The chevron is 12 px.
    const chevron = slot(canvasElement, 'open', 'chevron').getBoundingClientRect()
    await expect([chevron.width, chevron.height]).toEqual([12, 12])
  },
} satisfies Meta<typeof Lines>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onOpenChange = fn()

function Expandable() {
  const [open, setOpen] = useState(false)
  return (
    <main className={page}>
      <ToolLine
        name="Bash"
        target="git status --short"
        open={open}
        onOpenChange={(next) => {
          onOpenChange(next)
          setOpen(next)
        }}
      >
        {'M AGENTS.md\n?? toolkit/rules/diagrams.md'}
      </ToolLine>
      <Swatches />
    </main>
  )
}

/** The line is a button that shows and hides its output on a click, Enter or Space, with the focus ring from the keyboard. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => <Expandable />,
  play: async ({ canvasElement }) => {
    onOpenChange.mockClear()
    const canvas = within(canvasElement)
    const toggle = canvas.getByRole('button', { name: 'Done Bash git status --short' })
    await expect(toggle).toHaveAttribute('type', 'button')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    const output = canvasElement.querySelector('.tool-line__output')
    if (!(output instanceof HTMLElement)) throw new Error('no output')
    await expect(toggle.getAttribute('aria-controls')).toBe(output.id)
    await expect(output).not.toBeVisible()
    await userEvent.click(toggle)
    await expect(onOpenChange).toHaveBeenLastCalledWith(true)
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(output).toBeVisible()
    await expect(output).toHaveTextContent('M AGENTS.md')
    toggle.blur()
    await userEvent.tab()
    await expect(toggle).toHaveFocus()
    const focus = getComputedStyle(toggle)
    await expect(focus.outlineStyle).toBe('solid')
    await expect(focus.outlineColor).toBe(swatch(canvasElement, 'focus'))
    await userEvent.keyboard('{Enter}')
    await expect(onOpenChange).toHaveBeenLastCalledWith(false)
    await expect(output).not.toBeVisible()
    await userEvent.keyboard(' ')
    await expect(onOpenChange).toHaveBeenLastCalledWith(true)
    await expect(onOpenChange).toHaveBeenCalledTimes(3)
    await expect(output).toBeVisible()
  },
}

const narrowBox = css({ w: 'shell.popoverSm' })

const longTarget = 'src/parts/skill-eval-round-with-held-out-cases-and-a-trigger-set/index.stories.tsx'

/**
 * A long line is cut to one line and shows in full in a tooltip: on the
 * line's button when it has output, and as its own tab stop when it has none.
 */
export const LongTarget: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <Stack gap="8">
        <div className={narrowBox} data-testid="toggle">
          <ToolLine name="Read" target={longTarget} onOpenChange={() => undefined}>
            output
          </ToolLine>
        </div>
        <div className={narrowBox} data-testid="static">
          <ToolLine name="Edit" target={longTarget} />
        </div>
      </Stack>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const toggle = within(canvas.getByTestId('toggle')).getByRole('button')
    const text = toggle.querySelector('.tool-line__text')
    const staticText = canvas.getByTestId('static').querySelector('.tool-line__text')
    if (text === null || staticText === null) throw new Error('no text')
    await expectCutText(text, `Read ${longTarget}`, toggle)
    await expectCutText(staticText, `Edit ${longTarget}`)
  },
}
