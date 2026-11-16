import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Splitter } from './splitter'

const frame = css({ h: 'shell.dialog', p: '24', bg: 'bg.canvas' })
const box = css({ flex: '1', bg: 'surface.pane', borderWidth: 'default', borderColor: 'border.default', borderRadius: 'xl', textStyle: 'body', color: 'fg.default', p: '12' })
const swatches = {
  active: css({ bg: 'border.active' }),
  focus: css({ bg: 'border.focus' }),
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
  if (el === null) throw new Error(`no swatch ${name}`)
  return getComputedStyle(el).backgroundColor
}

function Two({ onSizeChange }: { onSizeChange?: (size: number[]) => void }) {
  return (
    <div className={frame}>
      <Splitter
        panels={[
          { id: 'a', content: <div className={box}>Pane A</div> },
          { id: 'b', content: <div className={box}>Pane B</div> },
        ]}
        onSizeChange={onSizeChange}
      />
      <Swatches />
    </div>
  )
}

const rect = (el: Element) => el.getBoundingClientRect()
const panelOf = (root: HTMLElement, text: string) => {
  const el = within(root).getByText(text).parentElement
  if (el === null) throw new Error(`no panel ${text}`)
  return el
}

const meta = {
  title: 'Layout/Splitter',
  component: Two,
  play: async ({ canvasElement }) => {
    const handle = within(canvasElement).getByRole('separator', { name: 'Resize' })
    const a = panelOf(canvasElement, 'Pane A')
    const b = panelOf(canvasElement, 'Pane B')
    // Equal halves, 10 apart: the handle is 4 + a 2 px line + 4.
    await expect(Math.round(rect(a).width)).toBe(Math.round(rect(b).width))
    await expect(Math.round(rect(handle).width)).toBe(10)
    await expect(Math.round(rect(b).left - rect(a).right)).toBe(10)
    await expect(Math.round(rect(handle).height)).toBe(Math.round(rect(a).height))
    const line = handle.firstElementChild
    if (!(line instanceof HTMLElement)) throw new Error('no line')
    const s = getComputedStyle(line)
    await expect([s.borderLeftWidth, s.borderLeftColor]).toEqual(['2px', 'rgba(0, 0, 0, 0)'])
    await expect(Math.round(rect(line).height)).toBe(Math.round(rect(handle).height))
    await expect(getComputedStyle(handle).cursor).toBe('col-resize')
  },
} satisfies Meta<typeof Two>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

/** Arrow keys, Home and End move the handle; double-click shares the space equally; a drag moves it; the line shows on focus. */
export const Behaviour: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  args: { onSizeChange: fn() },
  play: async ({ canvasElement, args }) => {
    const handle = within(canvasElement).getByRole('separator', { name: 'Resize' })
    const a = panelOf(canvasElement, 'Pane A')
    const line = handle.firstElementChild
    if (!(line instanceof HTMLElement)) throw new Error('no line')
    const start = rect(a).width
    await userEvent.tab()
    await expect(handle).toHaveFocus()
    // Keyboard focus shows the line in border.focus.
    await expect(getComputedStyle(line).borderLeftColor).toBe(swatch(canvasElement, 'focus'))
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(rect(a).width).toBeGreaterThan(start))
    await expect(args.onSizeChange).toHaveBeenCalled()
    await userEvent.keyboard('{Home}')
    await waitFor(() => expect(rect(a).width).toBeLessThan(start / 2))
    // Double-click gives both panels the same width again.
    await userEvent.dblClick(handle)
    await waitFor(() => expect(Math.round(rect(a).width)).toBe(Math.round(start)))
    // A pointer drag 100 px to the right widens the left panel.
    const h = rect(handle)
    const x = h.left + h.width / 2
    const y = h.top + h.height / 2
    await userEvent.pointer([
      { keys: `[MouseLeft>]`, target: handle, coords: { clientX: x, clientY: y } },
      { coords: { clientX: x + 50, clientY: y } },
      { coords: { clientX: x + 100, clientY: y } },
    ])
    await waitFor(() => expect(handle).toHaveAttribute('data-dragging'))
    // While dragging, the line shows in border.active.
    await expect(getComputedStyle(line).borderLeftColor).toBe(swatch(canvasElement, 'active'))
    await userEvent.pointer({ keys: `[/MouseLeft]`, coords: { clientX: x + 100, clientY: y } })
    await waitFor(() => expect(Math.round(rect(a).width - start)).toBeGreaterThan(80))
  },
}

function Controlled() {
  const [size, setSize] = useState<number[]>([70, 30])
  return (
    <div className={frame}>
      <Splitter
        orientation="vertical"
        handleLabel="Resize rows"
        size={size}
        onSizeChange={setSize}
        panels={[
          { id: 'top', content: <div className={box}>Top</div> },
          { id: 'bottom', content: <div className={box}>Bottom</div> },
        ]}
      />
      <output>{size.map((n) => Math.round(n)).join(' : ')}</output>
    </div>
  )
}

/** A vertical splitter controlled with `size` and `onSizeChange`. */
export const ControlledVertical: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const handle = canvas.getByRole('separator', { name: 'Resize rows' })
    const top = panelOf(canvasElement, 'Top')
    const bottom = panelOf(canvasElement, 'Bottom')
    // 70 : 30, stacked 10 apart, with a row-resize handle.
    await expect(canvas.getByRole('status')).toHaveTextContent('70 : 30')
    await expect(Math.round(rect(bottom).top - rect(top).bottom)).toBe(10)
    await expect(rect(top).height).toBeGreaterThan(rect(bottom).height * 2)
    await expect(getComputedStyle(handle).cursor).toBe('row-resize')
    handle.focus()
    await userEvent.keyboard('{End}')
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('90 : 10'))
  },
}

function Three() {
  return (
    <div className={frame}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          throw new Error('the handle submitted the form')
        }}
      >
        <Splitter
          defaultSize={[30, 50, 20]}
          panels={[
            { id: 'a', content: <div className={box}>Pane A</div> },
            { id: 'b', content: <div className={box}>Pane B</div>, minSize: 50 },
            { id: 'c', content: <div className={box}>Pane C</div> },
          ]}
        />
      </form>
    </div>
  )
}

/** Double-click on B : C keeps B at its 50 % minimum and leaves A alone; a handle in a form is not a submit button. */
export const DoubleClickWithinLimits: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => <Three />,
  play: async ({ canvasElement }) => {
    const handles = within(canvasElement).getAllByRole('separator', { name: 'Resize' })
    for (const h of handles) await expect(h).toHaveAttribute('type', 'button')
    const a = panelOf(canvasElement, 'Pane A')
    const b = panelOf(canvasElement, 'Pane B')
    const widthA = rect(a).width
    const widthB = rect(b).width
    const second = handles[1]
    if (second === undefined) throw new Error('no second handle')
    await userEvent.dblClick(second)
    await expect(Math.round(rect(a).width)).toBe(Math.round(widthA))
    await expect(Math.round(rect(b).width)).toBe(Math.round(widthB))
  },
}
