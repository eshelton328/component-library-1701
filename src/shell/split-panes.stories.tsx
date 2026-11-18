import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
import { Pane } from './pane'
import { SplitPanes, type SplitPart } from './split-panes'
import { expectCutText } from '../controls/tooltip.testing'
import { expectScrollAreas } from '../controls/scroll-area.testing'

const frame = css({ h: 'shell.dialogLg', p: '10', bg: 'bg.canvas' })
const body = css({ textStyle: 'body', color: 'fg.default', p: '12' })
const swatches = {
  pane: css({ bg: 'surface.pane' }),
  border: css({ bg: 'border.default' }),
  focus: css({ bg: 'border.focus' }),
  text: css({ bg: 'fg.default' }),
  muted: css({ bg: 'fg.muted' }),
}

function Swatches() {
  return (
    <div hidden>
      {Object.entries(swatches).map(([name, className]) => (
        <span key={name} data-swatch={name} className={className} />
      ))}
      <span data-swatch="strong" className={strongBorder} />
    </div>
  )
}

const swatch = (root: HTMLElement, name: string) => {
  const el = root.querySelector(`[data-swatch="${name}"]`)
  if (el === null) throw new Error(`no swatch ${name}`)
  return getComputedStyle(el).backgroundColor
}

// Chromium draws the 1.5 px borderWidths.strong at a whole pixel at 1x, so the test compares with this swatch.
const strongBorder = css({ borderWidth: 'strong', borderStyle: 'solid' })

const titles = ['bridge themes', 'drift check', 'brain git', 'hono server']

function Workbench({ count, onActivate }: { count: number; onActivate?: (title: string) => void }) {
  const [focused, setFocused] = useState(titles[0])
  return (
    <div className={frame}>
      <SplitPanes
        panes={titles.slice(0, count).map((t) => ({
          id: t.replace(' ', '-'),
          content: (
            <Pane
              title={t}
              meta="Opus 5.5"
              actions={
                <Button size="sm" iconOnly aria-label={`Actions for ${t}`}>
                  ⋯
                </Button>
              }
              focused={focused === t}
              onActivate={() => {
                setFocused(t)
                onActivate?.(t)
              }}
            >
              <p className={body}>The chat in {t}.</p>
            </Pane>
          ),
        }))}
      />
      <Swatches />
    </div>
  )
}

const rect = (el: Element) => el.getBoundingClientRect()

const meta = {
  title: 'Layout/Split panes',
  component: Workbench,
  args: { count: 2 },
  play: async ({ canvasElement }) => {
    // A pane body scrolls with no scroll bar and keeps a scroll at its end from moving the page.
    await expectScrollAreas(canvasElement, 'both', '.pane__body')
    const canvas = within(canvasElement)
    const a = canvas.getByRole('region', { name: 'bridge themes' })
    const b = canvas.getByRole('region', { name: 'drift check' })
    // Two panes side by side, 10 apart, with a column handle between them.
    await expect(Math.round(rect(b).left - rect(a).right)).toBe(10)
    await expect(Math.round(rect(a).top)).toBe(Math.round(rect(b).top))
    await expect(canvas.getByRole('separator', { name: 'Resize columns' })).toBeVisible()
    // Glass: surface.pane, radius 12, the 12 px blur.
    for (const p of [a, b]) {
      const s = getComputedStyle(p)
      await expect(s.backgroundColor).toBe(swatch(canvasElement, 'pane'))
      await expect(s.borderTopLeftRadius).toBe('12px')
      await expect(s.backdropFilter).toBe('blur(12px)')
    }
    // The focused pane: borderWidths.strong (1.5 px) in border.focus and aria-current; the idle one: 1 px border.default.
    const fa = getComputedStyle(a)
    const fb = getComputedStyle(b)
    const strong = canvasElement.querySelector('[data-swatch="strong"]')
    if (strong === null) throw new Error('no strong swatch')
    await expect([fa.borderTopWidth, fa.borderTopColor]).toEqual([getComputedStyle(strong).borderTopWidth, swatch(canvasElement, 'focus')])
    await expect([fb.borderTopWidth, fb.borderTopColor]).toEqual(['1px', swatch(canvasElement, 'border')])
    await expect(a).toHaveAttribute('aria-current', 'true')
    await expect(b).not.toHaveAttribute('aria-current')
    // The header: padding 8 by 12, gap 8, a 1 px rule; the title in label and fg.default, the model in mono and fg.muted.
    const header = a.querySelector('.pane__header')
    if (!(header instanceof HTMLElement)) throw new Error('no header')
    const h = getComputedStyle(header)
    await expect([h.paddingTop, h.paddingRight, h.paddingBottom, h.paddingLeft, h.columnGap]).toEqual(['8px', '12px', '8px', '12px', '8px'])
    await expect([h.borderBottomWidth, h.borderBottomColor]).toEqual(['1px', swatch(canvasElement, 'border')])
    const title = getComputedStyle(within(a).getByRole('heading', { level: 2, name: 'bridge themes' }))
    await expect([title.fontSize, title.fontWeight, title.color]).toEqual(['14px', '500', swatch(canvasElement, 'text')])
    const model = getComputedStyle(within(a).getByText('Opus 5.5'))
    await expect([model.fontSize, model.color]).toEqual(['12px', swatch(canvasElement, 'muted')])
    await expect(model.fontFamily).toContain('Mono')
    // The actions sit at the end of the header, 12 from the edge plus the border.
    const button = within(a).getByRole('button', { name: 'Actions for bridge themes' })
    await expect(Math.round(rect(a).right - rect(button).right - Number.parseFloat(fa.borderRightWidth))).toBe(12)
  },
} satisfies Meta<typeof Workbench>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

/** One pane fills the space, with no handle. */
export const One: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  args: { count: 1 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const a = canvas.getByRole('region', { name: 'bridge themes' })
    const split = canvasElement.querySelector('.splitter__root')
    if (split === null) throw new Error('no split')
    await expect(Math.round(rect(a).width)).toBe(Math.round(rect(split).width))
    await expect(canvas.queryByRole('separator')).toBeNull()
  },
}

/** Three panes: the first on the left, the second over the third on the right (D11). */
export const Three: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  args: { count: 3 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [a, b, c] = titles.slice(0, 3).map((t) => rect(canvas.getByRole('region', { name: t })))
    if (a === undefined || b === undefined || c === undefined) throw new Error('no panes')
    await expect(Math.round(b.left - a.right)).toBe(10)
    await expect(Math.round(c.top - b.bottom)).toBe(10)
    await expect(Math.round(c.left)).toBe(Math.round(b.left))
    await expect(Math.round(a.height)).toBe(Math.round(b.height + c.height + 10))
    await expect(canvas.getAllByRole('separator', { name: 'Resize rows' })).toHaveLength(1)
  },
}

/** Four panes in two columns, clockwise from the top left: the fourth sits under the first. */
export const Four: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  args: { count: 4 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const [a, b, c, d] = titles.map((t) => rect(canvas.getByRole('region', { name: t })))
    if (a === undefined || b === undefined || c === undefined || d === undefined) throw new Error('no panes')
    await expect(Math.round(a.top)).toBe(Math.round(b.top))
    await expect(Math.round(c.top)).toBe(Math.round(d.top))
    await expect(Math.round(d.left)).toBe(Math.round(a.left))
    await expect(Math.round(c.left)).toBe(Math.round(b.left))
    await expect(Math.round(d.top - a.bottom)).toBe(10)
    await expect(Math.round(c.top - b.bottom)).toBe(10)
    await expect(canvas.getAllByRole('separator', { name: 'Resize rows' })).toHaveLength(2)
    await expect(canvas.getAllByRole('separator', { name: 'Resize columns' })).toHaveLength(1)
  },
}

/** Clicking or tabbing into an idle pane reports it; the app moves the focus border. */
export const Behaviour: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  args: { count: 2, onActivate: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const a = canvas.getByRole('region', { name: 'bridge themes' })
    const b = canvas.getByRole('region', { name: 'drift check' })
    await userEvent.click(within(b).getByText('The chat in drift check.'))
    await expect(args.onActivate).toHaveBeenCalledWith('drift check')
    await waitFor(() => expect(b).toHaveAttribute('aria-current', 'true'))
    await expect(a).not.toHaveAttribute('aria-current')
    // A click in the focused pane reports nothing.
    await userEvent.click(within(b).getByText('The chat in drift check.'))
    await expect(args.onActivate).toHaveBeenCalledTimes(1)
    // Tabbing into the first pane's button reports that pane.
    within(a).getByRole('button', { name: 'Actions for bridge themes' }).focus()
    await expect(args.onActivate).toHaveBeenLastCalledWith('bridge themes')
    await waitFor(() => expect(a).toHaveAttribute('aria-current', 'true'))
  },
}

function Controlled() {
  const [sizes, setSizes] = useState<Partial<Record<SplitPart, number[]>>>({ columns: [60, 40] })
  return (
    <div className={frame}>
      <SplitPanes
        sizes={sizes}
        onSizeChange={(part, size) => { setSizes((s) => ({ ...s, [part]: size })); }}
        panes={titles.slice(0, 3).map((t) => ({ id: t.replace(' ', '-'), content: <Pane title={t} /> }))}
      />
      <output>{(sizes.columns ?? []).map((n) => Math.round(n)).join(' : ')}</output>
    </div>
  )
}

/** Sizes controlled with `sizes` and `onSizeChange`: the columns start at 60 : 40 and the keyboard moves them. */
export const ControlledSizes: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const a = rect(canvas.getByRole('region', { name: 'bridge themes' }))
    const b = rect(canvas.getByRole('region', { name: 'drift check' }))
    await expect(a.width).toBeGreaterThan(b.width * 1.4)
    await expect(canvas.getByRole('status')).toHaveTextContent('60 : 40')
    canvas.getByRole('separator', { name: 'Resize columns' }).focus()
    await userEvent.keyboard('{End}')
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('90 : 10'))
  },
}

function Growing() {
  const [order, setOrder] = useState(['bridge themes', 'drift check'])
  return (
    <div className={frame}>
      <button type="button" onClick={() => { setOrder((o) => [...o, 'brain git']); }}>
        Add a pane
      </button>
      <button type="button" onClick={() => { setOrder((o) => [...o].reverse()); }}>
        Swap
      </button>
      <SplitPanes
        panes={order.map((t) => ({
          id: `chat:${t}`,
          content: (
            <Pane title={t}>
              <input aria-label={`Draft in ${t}`} />
            </Pane>
          ),
        }))}
      />
    </div>
  )
}

/** A pane keeps its state when a pane is added; a pane that changes column does not take another pane's state. Ids may hold colons. */
export const KeepsState: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => <Growing />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('textbox', { name: 'Draft in drift check' }), 'unsent')
    await userEvent.click(canvas.getByRole('button', { name: 'Add a pane' }))
    await expect(canvas.getByRole('region', { name: 'brain git' })).toBeVisible()
    await expect(canvas.getByRole('textbox', { name: 'Draft in drift check' })).toHaveValue('unsent')
    // The new pane gets a share of the right column.
    await expect(rect(canvas.getByRole('region', { name: 'brain git' })).height).toBeGreaterThan(100)
    // Ids with colons still resize from the keyboard.
    const rows = canvas.getByRole('separator', { name: 'Resize rows' })
    const before = rect(canvas.getByRole('region', { name: 'drift check' })).height
    rows.focus()
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(rect(canvas.getByRole('region', { name: 'drift check' })).height).toBeGreaterThan(before))
    // Reversing moves panes between columns; none takes another's draft.
    await userEvent.click(canvas.getByRole('button', { name: 'Swap' }))
    await expect(canvas.getByRole('textbox', { name: 'Draft in bridge themes' })).toHaveValue('')
    await expect(canvas.getByRole('textbox', { name: 'Draft in brain git' })).toHaveValue('')
  },
}

const narrowBox = css({ display: 'flex', w: 'shell.popoverSm', h: 'shell.popoverSm' })

/** A long pane title is cut to one line and shows in full in a tooltip, on hover and on keyboard focus. */
export const LongTitle: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <div className={frame}>
      <div className={narrowBox}>
        <Pane title="skill-eval-round-with-held-out-cases-and-a-trigger-set" meta="Opus 5.5" focused>
          <div className={body}>Chat</div>
        </Pane>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const title = canvasElement.querySelector('.pane__title')
    if (title === null) throw new Error('no title')
    await expectCutText(title, 'skill-eval-round-with-held-out-cases-and-a-trigger-set')
    await expect(within(canvasElement).getByRole('region', { name: 'skill-eval-round-with-held-out-cases-and-a-trigger-set' })).toBeInTheDocument()
  },
}
