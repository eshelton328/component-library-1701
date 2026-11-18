import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
import { PanelIcon, ResetIcon } from '../foundations/icons'
import { Workbench } from './workbench'
import { expectCutText } from '../controls/tooltip.testing'

const frame = css({ h: 'shell.dialogLg', bg: 'bg.canvas' })
const panes = css({ flex: '1', bg: 'surface.pane', borderWidth: 'default', borderColor: 'border.default', borderRadius: 'xl', textStyle: 'body', color: 'fg.default', p: '12' })
const swatches = {
  selected: css({ bg: 'surface.selected' }),
  active: css({ bg: 'border.active' }),
  border: css({ bg: 'border.default' }),
  text: css({ bg: 'fg.default' }),
  muted: css({ bg: 'fg.muted' }),
  subtle: css({ bg: 'fg.subtle' }),
  accent: css({ bg: 'fg.accent' }),
  needsYou: css({ bg: 'status.needsYou.fg' }),
}

const workspaces = [
  { value: 'omni-brain', label: 'omni-brain', count: 3, content: <div className={panes}>The omni-brain panes</div> },
  { value: 'the-bridge', label: 'the-bridge', count: 2, content: <div className={panes}>The the-bridge panes</div> },
  { value: 'omni', label: 'omni', count: 1, content: <div className={panes}>The omni panes</div> },
  { value: 'skill-evals', label: 'skill-evals', count: 1, content: <div className={panes}>The skill-evals panes</div> },
]

function Page({ onValueChange }: { onValueChange?: (value: string) => void }) {
  return (
    <div className={frame}>
      <Workbench
        workspaces={workspaces}
        onValueChange={onValueChange}
        actions={<Button size="sm">New chat</Button>}
        summary="omni-brain · 2 panes"
        hints={['Cmd+1–4 focus a pane', 'Cmd+D split', 'Cmd+W close pane']}
        alert="the-bridge › hono server needs you"
      />
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </div>
  )
}

const swatch = (root: HTMLElement, name: string) => {
  const el = root.querySelector(`[data-swatch="${name}"]`)
  if (el === null) throw new Error(`no swatch ${name}`)
  return getComputedStyle(el).backgroundColor
}
const find = (root: HTMLElement, selector: string) => {
  const el = root.querySelector(selector)
  if (!(el instanceof HTMLElement)) throw new Error(`no ${selector}`)
  return el
}
const pad = (s: CSSStyleDeclaration) => [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft]
const rect = (el: Element) => el.getBoundingClientRect()

const meta = {
  title: 'Layout/Workbench',
  component: Page,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const list = canvas.getByRole('tablist', { name: 'Workspaces' })
    // The bar: 12 top, 10 bottom, 16 sides, gap 8; the tabs 4 apart with 12 at the start.
    const bar = getComputedStyle(find(canvasElement, '.workspace-tabs__bar'))
    await expect(pad(bar)).toEqual(['12px', '16px', '10px', '16px'])
    await expect(bar.columnGap).toBe('8px')
    const l = getComputedStyle(list)
    await expect([l.columnGap, l.paddingLeft]).toEqual(['4px', '12px'])
    // Selected tab: surface.selected, border.active, fg.default label; count in mono, fg.muted.
    const selected = canvas.getByRole('tab', { name: /omni-brain/ })
    await expect(selected).toHaveAttribute('aria-selected', 'true')
    const s = getComputedStyle(selected)
    await expect([s.backgroundColor, s.borderTopColor, s.color]).toEqual([swatch(canvasElement, 'selected'), swatch(canvasElement, 'active'), swatch(canvasElement, 'text')])
    await expect([s.height, s.paddingLeft, s.paddingRight, s.columnGap, s.borderTopLeftRadius, s.fontSize]).toEqual(['32px', '8px', '10px', '6px', '8px', '14px'])
    const selectedCount = getComputedStyle(find(selected, '.workspace-tabs__count'))
    await expect(selectedCount.color).toBe(swatch(canvasElement, 'muted'))
    await expect(selectedCount.fontFamily).toContain('Mono')
    // Idle tab: no fill, border.default, fg.muted label; count fg.subtle.
    const idle = canvas.getByRole('tab', { name: /the-bridge/ })
    const i = getComputedStyle(idle)
    await expect([i.backgroundColor, i.borderTopColor, i.color]).toEqual(['rgba(0, 0, 0, 0)', swatch(canvasElement, 'border'), swatch(canvasElement, 'muted')])
    await expect(getComputedStyle(find(idle, '.workspace-tabs__count')).color).toBe(swatch(canvasElement, 'subtle'))
    // The selected workspace's panes, in a 10 px padded panel that fills the height above the status bar.
    const panel = canvas.getByRole('tabpanel')
    await expect(within(panel).getByText('The omni-brain panes')).toBeVisible()
    await expect(pad(getComputedStyle(panel))).toEqual(['10px', '10px', '10px', '10px'])
    // The status bar: 6 top, 8 bottom, 16 sides, gap 20, mono; summary cyan, hints muted, the alert amber at the end.
    const status = find(canvasElement, '.workbench__status')
    const st = getComputedStyle(status)
    await expect(pad(st)).toEqual(['6px', '16px', '8px', '16px'])
    await expect(st.columnGap).toBe('20px')
    await expect(st.fontFamily).toContain('Mono')
    await expect(getComputedStyle(canvas.getByText('omni-brain · 2 panes')).color).toBe(swatch(canvasElement, 'accent'))
    await expect(getComputedStyle(canvas.getByText('Cmd+D split')).color).toBe(swatch(canvasElement, 'muted'))
    const alert = canvas.getByText('the-bridge › hono server needs you')
    await expect(getComputedStyle(alert).color).toBe(swatch(canvasElement, 'needsYou'))
    await expect(Math.round(rect(status).right - rect(alert).right)).toBe(16)
    await expect(Math.round(rect(panel).bottom)).toBe(Math.round(rect(status).top))
    await expect(Math.round(rect(status).bottom)).toBe(Math.round(rect(find(canvasElement, '.workbench__root')).bottom))
    // The action sits after the tabs.
    await expect(rect(canvas.getByRole('button', { name: 'New chat' })).left).toBeGreaterThan(rect(list).right - 1)
  },
} satisfies Meta<typeof Page>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

/** The arrow keys move between workspaces and select them; a click selects one. */
export const Behaviour: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  args: { onValueChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('tab', { name: /omni-brain/ }))
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(canvas.getByRole('tab', { name: /the-bridge/ })).toHaveAttribute('aria-selected', 'true'))
    await expect(args.onValueChange).toHaveBeenLastCalledWith('the-bridge')
    await waitFor(() => expect(within(canvas.getByRole('tabpanel')).getByText('The the-bridge panes')).toBeVisible())
    await expect(canvas.queryByText('The omni-brain panes')).not.toBeVisible()
    await userEvent.click(canvas.getByRole('tab', { name: /skill-evals/ }))
    await expect(args.onValueChange).toHaveBeenLastCalledWith('skill-evals')
    await expect(canvas.getByRole('tab', { name: /skill-evals/ })).toHaveAttribute('aria-selected', 'true')
  },
}

/** Controlled with `value`; with no summary, hints or alert there is no status bar. */
export const Controlled: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <div className={frame}>
      <Workbench workspaces={workspaces} value="omni" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('tab', { name: /^omni\s*1$/ })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(canvas.getByRole('tab', { name: /the-bridge/ }))
    await expect(canvas.getByRole('tab', { name: /^omni\s*1$/ })).toHaveAttribute('aria-selected', 'true')
    await expect(canvasElement.querySelector('.workbench__status')).toBeNull()
    // With no status bar, the panes reach the bottom.
    const root = find(canvasElement, '.workbench__root')
    await expect(Math.round(rect(canvas.getByRole('tabpanel')).bottom)).toBe(Math.round(rect(root).bottom))
  },
}

const x = { value: 'x', label: 'x-ray', count: 1, content: <div className={panes}>The x-ray panes</div> }

function Changing() {
  const [items, setItems] = useState(workspaces.slice(0, 2))
  return (
    <div className={frame}>
      <button type="button" onClick={() => { setItems((i) => [x, ...i]) }}>
        Add first
      </button>
      <button type="button" onClick={() => { setItems((i) => i.filter((w) => w.value !== 'the-bridge')) }}>
        Remove the-bridge
      </button>
      <button type="button" onClick={() => { setItems((i) => [...i, workspaces[1] ?? x]) }}>
        Restore the-bridge
      </button>
      <Workbench workspaces={items} />
    </div>
  )
}

/** Uncontrolled tabs keep their workspace while others are added; when it is removed, the first is selected and stays selected. */
export const ChangingWorkspaces: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => <Changing />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const tab = (name: RegExp) => canvas.getByRole('tab', { name })
    await expect(tab(/omni-brain/)).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(canvas.getByRole('button', { name: 'Add first' }))
    await expect(tab(/omni-brain/)).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(tab(/the-bridge/))
    await userEvent.click(canvas.getByRole('button', { name: 'Remove the-bridge' }))
    await waitFor(() => expect(tab(/x-ray/)).toHaveAttribute('aria-selected', 'true'))
    await userEvent.click(canvas.getByRole('button', { name: 'Restore the-bridge' }))
    await expect(tab(/x-ray/)).toHaveAttribute('aria-selected', 'true')
    await expect(tab(/the-bridge/)).toHaveAttribute('aria-selected', 'false')
  },
}

const narrowFrame = css({ h: 'shell.dialogLg', w: 'shell.popoverLg', bg: 'bg.canvas' })

const longHint = 'Cmd+Shift+Option+D split the focused pane down and keep the chat'

/** A hint that does not fit in the status bar is cut and shows in full in a tooltip, on hover and on keyboard focus. */
export const LongHint: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <div className={narrowFrame}>
      <Workbench workspaces={workspaces} summary="omni-brain · 2 panes" hints={[longHint]} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expectCutText(find(canvasElement, '.workbench__hint'), longHint)
  },
}

const twoFrames = css({ display: 'flex', flexDirection: 'column', gap: '16', bg: 'bg.canvas' })

/** The desktop Workbench bar (D1 105:105) beside the default one, each with the sidebar toggle before the tabs. */
function Desktop() {
  return (
    <div className={twoFrames}>
      {(['compact', 'md'] as const).map((size) => (
        <div key={size} className={frame} data-size={size}>
          <Workbench
            label={`Workspaces ${size}`}
            size={size}
            workspaces={workspaces}
            leading={
              <Button size="sm" iconOnly aria-label={`Show the sidebar ${size}`}>
                <PanelIcon size="16" />
              </Button>
            }
            actions={<Button size="sm">New chat</Button>}
            summary="omni-brain · 2 panes"
          />
        </div>
      ))}
    </div>
  )
}

const sized = (root: HTMLElement, size: string) => find(root, `[data-size="${size}"]`)

/**
 * `size="compact"` (Workbench D1 105:105): a 52 px bar with the 32 px tabs 12
 * down, and the panes right under it with no top padding, 10 at the sides
 * and bottom (105:177). The default `md` bar keeps its 58 px and 10 px panes.
 */
const compactPlay: NonNullable<StoryObj<typeof meta>['play']> = async ({ canvasElement }) => {
  const compact = sized(canvasElement, 'compact')
  const bar = find(compact, '.workspace-tabs__bar')
  await expect(rect(bar).height).toBe(52)
  await expect(pad(getComputedStyle(bar))).toEqual(['10px', '16px', '6px', '16px'])
  const tab = within(compact).getByRole('tab', { name: /omni-brain/ })
  await expect(rect(tab).height).toBe(32)
  await expect(Math.round(rect(tab).top - rect(bar).top)).toBe(12)
  const panel = within(compact).getByRole('tabpanel')
  await expect(pad(getComputedStyle(panel))).toEqual(['0px', '10px', '10px', '10px'])
  await expect(Math.round(rect(panel).top - rect(find(compact, '.workbench__root')).top)).toBe(52)
  // The default bar is unchanged: 12 + 2 + 32 + 2 + 10 = 58, and the panes padded 10 on every side.
  const md = sized(canvasElement, 'md')
  const mdBar = find(md, '.workspace-tabs__bar')
  await expect(rect(mdBar).height).toBe(58)
  await expect(pad(getComputedStyle(mdBar))).toEqual(['12px', '16px', '10px', '16px'])
  await expect(pad(getComputedStyle(within(md).getByRole('tabpanel')))).toEqual(['10px', '10px', '10px', '10px'])
}

export const CompactDark: StoryObj<typeof meta> = { globals: { mode: 'dark' }, render: () => <Desktop />, play: compactPlay }
export const CompactLight: StoryObj<typeof meta> = { globals: { mode: 'light' }, render: () => <Desktop />, play: compactPlay }

/**
 * `leading` (Workbench D1 158:2): the sidebar toggle at the start of the bar,
 * 16 in, before the tabs; the tab group starts 8 after it, and New chat
 * stays after the tabs. With no `leading`, the bar has no leading slot.
 */
const leadingPlay: NonNullable<StoryObj<typeof meta>['play']> = async ({ canvasElement }) => {
  for (const size of ['compact', 'md']) {
    const root = sized(canvasElement, size)
    const toggle = within(root).getByRole('button', { name: `Show the sidebar ${size}` })
    const list = within(root).getByRole('tablist', { name: `Workspaces ${size}` })
    const bar = find(root, '.workspace-tabs__bar')
    await expect(Math.round(rect(toggle).left - rect(bar).left)).toBe(16)
    await expect(Math.round(rect(list).left - rect(toggle).right)).toBe(8)
    await expect(rect(toggle).height).toBe(28)
    await expect(Math.round(rect(toggle).top + rect(toggle).height / 2)).toBe(Math.round(rect(list).top + rect(list).height / 2))
    await expect(rect(toggle.querySelector('svg') ?? toggle).width).toBe(16)
    await expect(rect(within(root).getByRole('button', { name: 'New chat' })).left).toBeGreaterThan(rect(list).right - 1)
    // The toggle is before the tabs in the tab order.
    await expect(toggle.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  }
}

export const LeadingDark: StoryObj<typeof meta> = { globals: { mode: 'dark' }, render: () => <Desktop />, play: leadingPlay }
export const LeadingLight: StoryObj<typeof meta> = { globals: { mode: 'light' }, render: () => <Desktop />, play: leadingPlay }

/** With no `leading`, the bar draws no leading slot and the tabs start 16 in. */
export const NoLeading: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <div className={frame}>
      <Workbench workspaces={workspaces} size="compact" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.workspace-tabs__leading')).toBeNull()
    const bar = find(canvasElement, '.workspace-tabs__bar')
    await expect(Math.round(rect(within(canvasElement).getByRole('tablist')).left - rect(bar).left)).toBe(16)
  },
}

const manyWorkspaces = Array.from({ length: 12 }, (_, n) => ({ value: `ws-${String(n)}`, label: `workspace-${String(n)}`, count: n, content: <div className={panes}>The workspace-{n} panes</div> }))

/** A wide bar with the four workspaces and a narrow one with twelve, each with the reset button at the end. */
function WithTrailing() {
  return (
    <div className={twoFrames}>
      {[
        { key: 'wide', className: frame, items: workspaces },
        { key: 'narrow', className: narrowFrame, items: manyWorkspaces },
      ].map(({ key, className, items }) => (
        <div key={key} className={className} data-size={key}>
          <Workbench
            label={`Workspaces ${key}`}
            size="compact"
            workspaces={items}
            actions={<Button size="sm">New chat</Button>}
            trailing={
              <Button size="sm" iconOnly aria-label="Reset pane sizes">
                <ResetIcon size="16" />
              </Button>
            }
          />
        </div>
      ))}
    </div>
  )
}

/**
 * `trailing` (screen review R5): the Reset pane sizes button at the right
 * end of the bar, 16 from its end, right of New chat. With many tabs in a
 * narrow bar the tabs scroll and the button stays inside the bar.
 */
const trailingPlay: NonNullable<StoryObj<typeof meta>['play']> = async ({ canvasElement }) => {
  for (const size of ['wide', 'narrow']) {
    const root = sized(canvasElement, size)
    const bar = find(root, '.workspace-tabs__bar')
    const reset = within(root).getByRole('button', { name: 'Reset pane sizes' })
    const newChat = within(root).getByRole('button', { name: 'New chat' })
    await expect(reset.parentElement).toHaveClass('workspace-tabs__trailing')
    await expect(Math.round(rect(bar).right - rect(reset).right)).toBe(16)
    await expect(rect(reset).left).toBeGreaterThan(rect(newChat).right - 1)
    await expect(rect(reset.querySelector('svg') ?? reset).width).toBe(16)
    await expect(rect(reset).left).toBeGreaterThanOrEqual(rect(bar).left)
    await expect(rect(reset).right).toBeLessThanOrEqual(rect(bar).right)
  }
  // The wide bar has room: New chat stays right after the tabs and the button is pushed to the end.
  const wide = sized(canvasElement, 'wide')
  const wideList = within(wide).getByRole('tablist', { name: 'Workspaces wide' })
  await expect(Math.round(rect(within(wide).getByRole('button', { name: 'New chat' })).left - rect(wideList).right)).toBe(8)
  await expect(rect(within(wide).getByRole('button', { name: 'Reset pane sizes' })).left - rect(within(wide).getByRole('button', { name: 'New chat' })).right).toBeGreaterThan(8)
  // The narrow bar: the tabs scroll inside the list, which ends before the actions.
  const narrow = sized(canvasElement, 'narrow')
  const list = within(narrow).getByRole('tablist', { name: 'Workspaces narrow' })
  await expect(list.scrollWidth).toBeGreaterThan(list.clientWidth)
  await expect(rect(list).right).toBeLessThanOrEqual(rect(within(narrow).getByRole('button', { name: 'New chat' })).left)
}

export const TrailingDark: StoryObj<typeof meta> = { globals: { mode: 'dark' }, render: () => <WithTrailing />, play: trailingPlay }
export const TrailingLight: StoryObj<typeof meta> = { globals: { mode: 'light' }, render: () => <WithTrailing />, play: trailingPlay }

/** With no `trailing`, the bar draws no trailing slot and New chat stays right after the tabs. */
export const NoTrailing: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <div className={frame}>
      <Workbench workspaces={workspaces} size="compact" actions={<Button size="sm">New chat</Button>} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.workspace-tabs__trailing')).toBeNull()
    const list = within(canvasElement).getByRole('tablist')
    await expect(Math.round(rect(within(canvasElement).getByRole('button', { name: 'New chat' })).left - rect(list).right)).toBe(8)
  },
}
