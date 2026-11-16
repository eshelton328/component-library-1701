import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from './button'
import { Menu, type MenuEntry } from './menu'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', minH: 'shell.dialog' })

function Pencil() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10.5 2.5l3 3L6 13H3v-3l7.5-7.5z" />
    </svg>
  )
}
function Trash() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.7 8.5h5.6l.7-8.5" />
    </svg>
  )
}
function More() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <circle cx="3.5" cy="8" r="1.25" />
      <circle cx="8" cy="8" r="1.25" />
      <circle cx="12.5" cy="8" r="1.25" />
    </svg>
  )
}

// The Workbench chat actions (D2b): rename, pin, an unavailable action, and delete.
const chatActions: readonly MenuEntry[] = [
  { value: 'rename', label: 'Rename', icon: <Pencil /> },
  { value: 'pin', label: 'Pin to sidebar' },
  { value: 'export', label: 'Export transcript', disabled: true },
  { type: 'separator' },
  { value: 'delete', label: 'Delete chat', icon: <Trash />, tone: 'danger' },
]

function OpenMenu() {
  return (
    <main className={page}>
      <Menu open trigger={<Button>Chat actions</Button>} items={chatActions} />
    </main>
  )
}

const meta = {
  title: 'Overlays/Menu',
  component: OpenMenu,
  play: async () => {
    // The menu renders in a portal, outside the story's canvas.
    const body = within(document.body)
    const menu = await body.findByRole('menu')
    const rename = within(menu).getByRole('menuitem', { name: 'Rename' })
    await expect(rename.getBoundingClientRect().height).toBe(32)
    const remove = within(menu).getByRole('menuitem', { name: 'Delete chat' })
    await expect(getComputedStyle(remove).color).not.toBe(getComputedStyle(rename).color)
    const exportItem = within(menu).getByRole('menuitem', { name: 'Export transcript' })
    await expect(exportItem).toHaveAttribute('aria-disabled', 'true')
    await expect(getComputedStyle(exportItem).opacity).toBe('0.45')
    await expect(within(menu).getByRole('separator')).toBeInTheDocument()
    await expect(getComputedStyle(menu).boxShadow).not.toBe('none')
    await expect(body.getByRole('button', { name: 'Chat actions' })).toHaveAttribute('aria-expanded', 'true')
  },
} satisfies Meta<typeof OpenMenu>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onSelect = fn<(value: string) => void>()

/** A click opens the menu; the arrow keys skip a disabled action; Enter picks; Escape closes. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <Menu trigger={<Button iconOnly aria-label="Row actions"><More /></Button>} items={chatActions} onSelect={onSelect} placement="bottom-end" />
    </main>
  ),
  play: async ({ canvasElement }) => {
    onSelect.mockClear()
    const canvas = within(canvasElement)
    const body = within(document.body)
    const trigger = canvas.getByRole('button', { name: 'Row actions' })
    await userEvent.click(trigger)
    const menu = await body.findByRole('menu')
    await waitFor(() => expect(menu).toHaveFocus())
    // Rename, Pin, then Delete: Export is disabled, so the arrow skips it.
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Delete chat' })).toHaveAttribute('data-highlighted'))
    await userEvent.keyboard('{Enter}')
    await expect(onSelect).toHaveBeenLastCalledWith('delete')
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
    // Escape closes without a pick.
    await userEvent.click(trigger)
    await body.findByRole('menu')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull())
    await expect(onSelect).toHaveBeenCalledTimes(1)
    // A click picks an action.
    await userEvent.click(trigger)
    await userEvent.click(within(await body.findByRole('menu')).getByRole('menuitem', { name: 'Rename' }))
    await expect(onSelect).toHaveBeenLastCalledWith('rename')
  },
}

const many: readonly MenuEntry[] = Array.from({ length: 80 }, (_, i) => ({ value: `action-${String(i)}`, label: `Action ${String(i + 1)}` }))

/** A menu longer than the window scrolls and stays inside the window. */
export const LongMenu: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <Menu open trigger={<Button>Many actions</Button>} items={many} />
    </main>
  ),
  play: async () => {
    const menu = await within(document.body).findByRole('menu')
    await waitFor(() => expect(menu.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight))
    await expect(menu.scrollHeight).toBeGreaterThan(menu.clientHeight)
    await expect(within(menu).getByRole('menuitem', { name: 'Action 1' }).getBoundingClientRect().height).toBe(32)
  },
}

function TitledPencil() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <title>Pencil</title>
      <path d="M10.5 2.5l3 3L6 13H3v-3l7.5-7.5z" />
    </svg>
  )
}

/** Typeahead matches the label, not the text inside an icon. */
export const Typeahead: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <Menu
        trigger={<Button>Chat actions</Button>}
        items={[
          { value: 'rename', label: 'Rename', icon: <TitledPencil /> },
          { value: 'pin', label: 'Pin to sidebar' },
        ]}
      />
    </main>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Chat actions' }))
    const menu = await within(document.body).findByRole('menu')
    await waitFor(() => expect(menu).toHaveFocus())
    await userEvent.keyboard('p')
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Pin to sidebar' })).toHaveAttribute('data-highlighted'))
    // Ark joins keys pressed within a short time into one search, so wait before the next key.
    await new Promise((resolve) => setTimeout(resolve, 600))
    await userEvent.keyboard('r')
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: /Rename/ })).toHaveAttribute('data-highlighted'))
  },
}
