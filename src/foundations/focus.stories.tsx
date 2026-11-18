import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'

// The page rule in panda.config.ts (screen review R16): an element that has the
// focus but not :focus-visible, such as after a mouse or touch press, draws no
// browser default outline. A keyboard focus is :focus-visible, so the rule
// leaves it alone, and the recipes' focusRing stays the only library ring.
const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', display: 'grid', gap: '16', justifyItems: 'start' })
const panel = css({ p: '16', borderRadius: 'xl', borderWidth: 'default', borderStyle: 'solid', borderColor: 'border.default', textStyle: 'body' })

function Targets() {
  return (
    <main className={page}>
      <div role="group" aria-label="Plain panel" tabIndex={0} className={panel}>
        A plain element that takes the focus and has no recipe ring.
      </div>
      <button type="button">A plain button</button>
    </main>
  )
}

const meta = {
  title: 'Foundations/Focus outline',
  component: Targets,
  play: async ({ canvasElement }) => {
    // Real presses through the test runner's browser session: a synthetic click calls focus() from code, which
    // Chromium treats as focus-visible.
    const { userEvent } = await import('vitest/browser')
    const canvas = within(canvasElement)
    for (const target of [canvas.getByRole('group', { name: 'Plain panel' }), canvas.getByRole('button', { name: 'A plain button' })]) {
      // A pointer press gives the focus without focus-visible: the page rule draws a transparent outline.
      await userEvent.click(target)
      await waitFor(() => expect(target).toHaveFocus())
      await expect(target.matches(':focus-visible')).toBe(false)
      await expect(getComputedStyle(target).outlineColor).toBe('rgba(0, 0, 0, 0)')
    }
    // The keyboard gives focus-visible, which the rule does not match: the browser's keyboard outline still shows.
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    const first = canvas.getByRole('group', { name: 'Plain panel' })
    await expect(first).toHaveFocus()
    await expect(first.matches(':focus-visible')).toBe(true)
    await expect(getComputedStyle(first).outlineColor).not.toBe('rgba(0, 0, 0, 0)')
    await expect(getComputedStyle(first).outlineStyle).not.toBe('none')
  },
} satisfies Meta<typeof Targets>
export default meta

// Only the story test runner has the browser session that sends real presses, so the Storybook UI leaves these
// stories out; the test runner still runs them.

export const Dark: StoryObj<typeof meta> = { tags: ['!dev'], globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { tags: ['!dev'], globals: { mode: 'light' } }
