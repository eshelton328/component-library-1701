import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from './button'
import { Checkbox } from './checkbox'
import { Inline } from './layout'
import { Popover, PopoverSection } from './popover'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', minH: 'shell.dialogLg' })

const kinds = ['Approval', 'Question', 'Review', 'Action', 'Next step']
const projects = ['ncc-1701', 'omni', 'component-library-1701']

// The Inbox filter popover (D4): kind and project sections, and a footer with a count and Clear.
function Filters({ open, onClear }: { open?: boolean; onClear?: () => void }) {
  const [picked, setPicked] = useState<readonly string[]>(['Approval', 'Question', 'ncc-1701'])
  const toggle = (v: string, on: boolean) => {
    setPicked((p) => (on ? [...p, v] : p.filter((x) => x !== v)))
  }
  return (
    <Inline justify="end">
      <Popover
        trigger={<Button>Filter</Button>}
        label="Filters"
        {...(open === undefined ? {} : { open })}
        note={`${String(picked.length)} filters on`}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setPicked([])
              onClear?.()
            }}
          >
            Clear
          </Button>
        }
      >
        <PopoverSection label="Kind">
          {kinds.map((k) => (
            <Checkbox key={k} label={k} checked={picked.includes(k)} onCheckedChange={(on) => { toggle(k, on) }} />
          ))}
        </PopoverSection>
        <PopoverSection label="Project">
          {projects.map((k) => (
            <Checkbox key={k} label={k} checked={picked.includes(k)} onCheckedChange={(on) => { toggle(k, on) }} />
          ))}
        </PopoverSection>
      </Popover>
    </Inline>
  )
}

function OpenFilters() {
  return (
    <main className={page}>
      <Filters open />
    </main>
  )
}

const meta = {
  title: 'Overlays/Popover',
  component: OpenFilters,
  play: async () => {
    // The popover renders in a portal, outside the story's canvas.
    const body = within(document.body)
    const box = await body.findByRole('dialog', { name: 'Filters' })
    await expect(box.getBoundingClientRect().width).toBe(320)
    const style = getComputedStyle(box)
    await expect(style.borderTopLeftRadius).toBe('12px')
    await expect(style.paddingTop).toBe('8px')
    await expect(style.boxShadow).not.toBe('none')
    // It opens 6 px under the trigger, aligned at its end.
    const trigger = body.getByRole('button', { name: 'Filter' })
    await waitFor(() => expect(Math.round(box.getBoundingClientRect().top - trigger.getBoundingClientRect().bottom)).toBe(6))
    await expect(Math.round(box.getBoundingClientRect().right)).toBe(Math.round(trigger.getBoundingClientRect().right))
    // Two named sections with capital labels in mono text.
    const kind = within(box).getByRole('group', { name: 'Kind' })
    await expect(within(kind).getAllByRole('checkbox')).toHaveLength(5)
    const label = within(kind).getByText('Kind')
    await expect(getComputedStyle(label).textTransform).toBe('uppercase')
    await expect(getComputedStyle(label).fontSize).toBe('11px')
    await expect(within(box).getByRole('group', { name: 'Project' })).toBeInTheDocument()
    await expect(within(box).getByText('3 filters on')).toBeInTheDocument()
    await expect(within(box).getByRole('button', { name: 'Clear' })).toBeInTheDocument()
  },
} satisfies Meta<typeof OpenFilters>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onClear = fn()

/** A click opens the popover; the controls inside work; Escape and a click outside close it. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <Filters onClear={onClear} />
      <p>Outside the popover</p>
    </main>
  ),
  play: async ({ canvasElement }) => {
    onClear.mockClear()
    const canvas = within(canvasElement)
    const body = within(document.body)
    const trigger = canvas.getByRole('button', { name: 'Filter' })
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(trigger)
    const box = await body.findByRole('dialog', { name: 'Filters' })
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(within(box).getByRole('checkbox', { name: 'Review' }))
    await expect(within(box).getByText('4 filters on')).toBeInTheDocument()
    await userEvent.click(within(box).getByRole('button', { name: 'Clear' }))
    await expect(onClear).toHaveBeenCalledTimes(1)
    await expect(within(box).getByText('0 filters on')).toBeInTheDocument()
    // Escape closes it and returns the focus to the trigger.
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('dialog', { name: 'Filters' })).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
    // A click outside closes it.
    await userEvent.click(trigger)
    await body.findByRole('dialog', { name: 'Filters' })
    await userEvent.click(canvas.getByText('Outside the popover'))
    await waitFor(() => expect(body.queryByRole('dialog', { name: 'Filters' })).toBeNull())
  },
}

const widths = [
  ['sm', 240],
  ['filter', 300],
  ['md', 320],
  ['lg', 360],
  ['picker', 380],
] as const

// One open popover per width, each under its own button.
function Widths() {
  return (
    <main className={page}>
      <Inline justify="end">
        {widths.map(([w]) => (
          <Popover key={w} trigger={<Button>{w}</Button>} label={`Width ${w}`} width={w} open>
            <Checkbox label={`A ${w} row`} />
          </Popover>
        ))}
      </Inline>
    </main>
  )
}

/** The widths (Inbox D4 346:1737 is 300, D3 346:1234 is 380): each box takes its width token. */
export const Width: StoryObj<typeof meta> = {
  render: () => <Widths />,
  play: async () => {
    const body = within(document.body)
    for (const [w, px] of widths) {
      const box = await body.findByRole('dialog', { name: `Width ${w}` })
      await expect(box.getBoundingClientRect().width).toBe(px)
    }
  },
}
