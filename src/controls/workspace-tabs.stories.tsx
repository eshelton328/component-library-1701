import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { WorkspaceTabs } from './workspace-tabs'

const frame = css({ display: 'flex', h: 'shell.dialog', bg: 'bg.canvas' })
const panes = css({ flex: '1', bg: 'surface.pane', borderRadius: 'xl', textStyle: 'body', color: 'fg.default', p: '12' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  subtle: css({ color: 'fg.subtle' }),
  muted: css({ color: 'fg.muted' }),
  needsYou: css({ color: 'status.needsYou.fg' }),
}

// Workbench D1 105:108: every tab has a grip; omni-brain and the-bridge need Erik.
const workspaces = [
  { value: 'omni-brain', label: 'omni-brain', count: 3, draggable: true, needsYou: true, content: <div className={panes}>The omni-brain panes</div> },
  { value: 'the-bridge', label: 'the-bridge', count: 2, draggable: true, needsYou: true, content: <div className={panes}>The the-bridge panes</div> },
  { value: 'omni', label: 'omni', count: 1, draggable: true, content: <div className={panes}>The omni panes</div> },
  { value: 'skill-evals', label: 'skill-evals', count: 1, content: <div className={panes}>The skill-evals panes</div> },
]

const onValueChange = fn<(value: string) => void>()

function Tabs() {
  return (
    <div className={frame}>
      <WorkspaceTabs label="Workspaces" items={workspaces} onValueChange={onValueChange} />
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </div>
  )
}

const meta = {
  title: 'Navigation/Workspace tabs',
  component: Tabs,
  play: async ({ canvasElement }) => {
    onValueChange.mockClear()
    const canvas = within(canvasElement)
    const swatch = (name: string) => {
      const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
      if (el === null) throw new Error(`no swatch ${name}`)
      return getComputedStyle(el).color
    }
    const part = (tab: HTMLElement, slot: string) => {
      const el = tab.querySelector(`.workspace-tabs__${slot}`)
      if (!(el instanceof HTMLElement)) throw new Error(`no ${slot}`)
      return el
    }
    // The needs-you dot is announced as part of the tab name; the grip is not.
    const omniBrain = canvas.getByRole('tab', { name: 'omni-brain 3 , needs you' })
    const omni = canvas.getByRole('tab', { name: 'omni 1' })
    const evals = canvas.getByRole('tab', { name: 'skill-evals 1' })
    // The grip: a 12 px icon before the label, 6 apart, fg.muted on the selected tab and fg.subtle on the others.
    const grip = part(omniBrain, 'grip')
    await expect(grip.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    await expect(grip.getBoundingClientRect().width).toBe(12)
    await expect(omniBrain).toHaveAttribute('aria-selected', 'true')
    await expect(getComputedStyle(grip).color).toBe(swatch('muted'))
    await expect(getComputedStyle(part(omni, 'grip')).color).toBe(swatch('subtle'))
    await expect(evals.querySelector('.workspace-tabs__grip')).toBeNull()
    // The dot: 6 px, round, status.needsYou.fg, 6 after the count.
    const dot = part(omniBrain, 'dot')
    const d = getComputedStyle(dot)
    await expect([d.width, d.height, d.backgroundColor]).toEqual(['6px', '6px', swatch('needsYou')])
    await expect(dot).toHaveAttribute('aria-hidden', 'true')
    await expect(dot.getBoundingClientRect().left - part(omniBrain, 'count').getBoundingClientRect().right).toBe(6)
    await expect(omni.querySelector('.workspace-tabs__dot')).toBeNull()
    // The arrow keys still move between tabs and select them.
    await userEvent.click(omniBrain)
    await userEvent.keyboard('{ArrowRight}')
    const bridge = canvas.getByRole('tab', { name: 'the-bridge 2 , needs you' })
    await waitFor(() => expect(bridge).toHaveFocus())
    await waitFor(() => expect(bridge).toHaveAttribute('aria-selected', 'true'))
    await expect(onValueChange).toHaveBeenCalledWith('the-bridge')
  },
} satisfies Meta<typeof Tabs>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
