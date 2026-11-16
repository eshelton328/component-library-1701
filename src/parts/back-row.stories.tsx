import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
import { Stack } from '../controls/layout'
import { BackRow } from './back-row'

const page = css({ bg: 'bg.canvas', p: '24' })
const phone = css({ w: 'shell.popoverLg' })
const tablet = css({ w: 'shell.dialogLg' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  accent: css({ color: 'fg.accent' }),
  focus: css({ color: 'border.focus' }),
}

function Rows() {
  return (
    <main className={page}>
      <Stack gap="24">
        <div className={phone} data-testid="inbox">
          <BackRow label="Inbox">
            <Button size="lg">Snooze</Button>
            <Button size="lg">Dismiss</Button>
          </BackRow>
        </div>
        <div className={tablet} data-testid="artifacts">
          <BackRow label="Artifacts">
            <Button>Discuss</Button>
          </BackRow>
        </div>
        <div className={phone} data-testid="toolkit">
          <BackRow label="Toolkit" backLabel="Back to the toolkit" />
        </div>
        <div className={phone} data-testid="empty">
          <BackRow label="Runs">
            {false}
            {[]}
          </BackRow>
        </div>
      </Stack>
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const meta = {
  title: 'Navigation/Back row',
  component: Rows,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const swatch = (name: string) => {
      const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
      return el === null ? '' : getComputedStyle(el).color
    }
    const part = (id: string, slot: string) => {
      const el = canvas.getByTestId(id).querySelector(`.back-row__${slot}`)
      if (!(el instanceof Element)) throw new Error(`no ${slot} in ${id}`)
      return el
    }
    // The back button is named after where it goes; a backLabel replaces that name.
    const back = canvas.getByRole('button', { name: 'Back to Inbox' })
    await expect(back).toHaveAttribute('type', 'button')
    await expect(canvas.getByRole('button', { name: 'Back to the toolkit' })).toBeInTheDocument()
    // A 20 px chevron, 4 px before the label, both in fg.accent; the label is labelLg, Medium 16/24 (d-074).
    const icon = part('inbox', 'icon').getBoundingClientRect()
    await expect([icon.width, icon.height]).toEqual([20, 20])
    const label = part('inbox', 'label')
    await expect(label.getBoundingClientRect().left - icon.right).toBe(4)
    const style = getComputedStyle(back)
    await expect(style.color).toBe(swatch('accent'))
    await expect(getComputedStyle(label).color).toBe(swatch('accent'))
    await expect(getComputedStyle(part('inbox', 'icon')).stroke).toBe(swatch('accent'))
    const text = getComputedStyle(label)
    await expect([text.fontSize, text.fontWeight]).toEqual(['16px', '500'])
    await expect(parseFloat(text.lineHeight)).toBeCloseTo(24, 0)
    // The back button has no fill or border, and is at least 28 px tall.
    await expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)')
    await expect(style.borderTopWidth).toBe('0px')
    await expect(back.getBoundingClientRect().height).toBeGreaterThanOrEqual(28)
    // The button starts at the chevron and ends 6 px after the label, so the focus ring is as far from the
    // label as from the chevron's stroke (6.67 px inside its box).
    await expect([style.paddingLeft, style.paddingRight]).toEqual(['0px', '6px'])
    await expect(back.getBoundingClientRect().left).toBe(icon.left)
    await expect(back.getBoundingClientRect().right - label.getBoundingClientRect().right).toBe(6)
    // The actions end at the right edge of the row, 8 px apart; no actions render no slot.
    const root = part('inbox', 'root').getBoundingClientRect()
    const actions = part('inbox', 'actions')
    await expect(actions.getBoundingClientRect().right).toBe(root.right)
    await expect(getComputedStyle(actions).columnGap).toBe('8px')
    await expect(canvas.getByTestId('toolkit').querySelector('.back-row__actions')).toBeNull()
    // Actions that render nothing take no room.
    await expect(getComputedStyle(part('empty', 'actions')).display).toBe('none')
    await expect(part('empty', 'actions').getBoundingClientRect().width).toBe(0)
  },
} satisfies Meta<typeof Rows>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onBack = fn()
const onDiscuss = fn()

/** The back button calls onBack on a click, Enter or Space, and shows the focus ring from the keyboard. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <div className={phone}>
        <BackRow label="Toolkit" onBack={onBack}>
          <Button onClick={onDiscuss}>Discuss</Button>
        </BackRow>
      </div>
      <div hidden>
        <span data-swatch="focus" className={swatches.focus} />
      </div>
    </main>
  ),
  play: async ({ canvasElement }) => {
    onBack.mockClear()
    onDiscuss.mockClear()
    const canvas = within(canvasElement)
    const back = canvas.getByRole('button', { name: 'Back to Toolkit' })
    await userEvent.click(back)
    await expect(onBack).toHaveBeenCalledTimes(1)
    back.blur()
    await userEvent.tab()
    await expect(back).toHaveFocus()
    const focus = getComputedStyle(back)
    const ring = canvasElement.querySelector('[data-swatch="focus"]')
    await expect(focus.outlineStyle).toBe('solid')
    await expect(focus.outlineColor).toBe(ring === null ? '' : getComputedStyle(ring).color)
    // The ring is 2 px outside the button, so it is 8 px from the end of the label.
    await expect([focus.outlineOffset, focus.paddingRight]).toEqual(['2px', '6px'])
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    await expect(onBack).toHaveBeenCalledTimes(3)
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Discuss' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(onDiscuss).toHaveBeenCalledTimes(1)
    await expect(onBack).toHaveBeenCalledTimes(3)
  },
}
