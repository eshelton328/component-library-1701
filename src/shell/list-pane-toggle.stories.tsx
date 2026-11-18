import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { ListPaneToggle } from './list-pane-toggle'

const page = css({ bg: 'bg.canvas', p: '24', display: 'flex', gap: '12', alignItems: 'center' })

const labels = { open: 'Hide the workspace sidebar', closed: 'Show the workspace sidebar' }

// The open toggle (Workbench D2 158:6) and the closed one (D1 158:2), and a
// controlled one that the page's state opens and closes.
function Toggles({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [open, setOpen] = useState(true)
  return (
    <main className={page}>
      <ListPaneToggle open label={labels.open} onOpenChange={() => undefined} data-figma="158:6" />
      <ListPaneToggle open={false} label={labels.closed} onOpenChange={() => undefined} data-figma="158:2" />
      <ListPaneToggle
        open={open}
        label={open ? 'Hide the list' : 'Show the list'}
        controls="list-pane"
        onOpenChange={(next) => {
          onOpenChange(next)
          setOpen(next)
        }}
      />
      <div id="list-pane" hidden={!open}>
        The list
      </div>
      <div hidden>
        <span data-swatch="selectedBorder" className={css({ color: 'border.selected' })} />
        <span data-swatch="default" className={css({ color: 'border.default' })} />
        <span data-swatch="selected" className={css({ color: 'surface.selected' })} />
      </div>
    </main>
  )
}

const meta = {
  title: 'Layout/List pane toggle',
  component: Toggles,
  args: { onOpenChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const swatch = (name: string) => {
      const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
      if (el === null) throw new Error(`no swatch ${name}`)
      return getComputedStyle(el).color
    }
    // Open: pressed, border.selected on each side over the pressed fill, a 28 px square with a 16 px icon.
    const open = canvas.getByRole('button', { name: labels.open })
    await expect(open).toHaveAttribute('aria-pressed', 'true')
    await expect(open).toHaveAttribute('data-figma', '158:6')
    const o = getComputedStyle(open)
    const selectedBorder = swatch('selectedBorder')
    await expect([o.borderTopColor, o.borderRightColor, o.borderBottomColor, o.borderLeftColor]).toEqual([selectedBorder, selectedBorder, selectedBorder, selectedBorder])
    await expect(o.backgroundColor).toBe(swatch('selected'))
    await expect([o.height, o.width]).toEqual(['28px', '28px'])
    const icon = open.querySelector('svg')
    if (icon === null) throw new Error('no icon')
    await expect(getComputedStyle(icon).width).toBe('16px')
    // Closed: not pressed, the plain sm button's border.default.
    const closed = canvas.getByRole('button', { name: labels.closed })
    await expect(closed).toHaveAttribute('aria-pressed', 'false')
    await expect(closed).toHaveAttribute('data-figma', '158:2')
    const c = getComputedStyle(closed)
    await expect(c.borderTopColor).toBe(swatch('default'))
    await expect(c.borderTopColor).not.toBe(selectedBorder)
    await expect([c.height, c.width]).toEqual(['28px', '28px'])
    // Controlled: a click calls onOpenChange with the new state, and the page's state toggles aria-pressed.
    const toggle = canvas.getByRole('button', { name: 'Hide the list' })
    await expect(toggle).toHaveAttribute('aria-controls', 'list-pane')
    await userEvent.click(toggle)
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false)
    const shown = canvas.getByRole('button', { name: 'Show the list' })
    await expect(shown).toHaveAttribute('aria-pressed', 'false')
    await expect(canvas.queryByText('The list')).not.toBeVisible()
    await userEvent.click(shown)
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true)
    await expect(canvas.getByRole('button', { name: 'Hide the list' })).toHaveAttribute('aria-pressed', 'true')
    await expect(args.onOpenChange).toHaveBeenCalledTimes(2)
  },
} satisfies Meta<typeof Toggles>
export default meta

/** Open (pressed, border.selected), closed, and a controlled toggle, in dark mode. */
export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
/** The same toggles in light mode. */
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
