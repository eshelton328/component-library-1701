import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from './button'
import { Dialog, DialogClose } from './dialog'
import { Stack } from './layout'
import { TextArea, TextField } from './text-field'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', minH: 'shell.dialog' })
// A swatch of the scrim token, so the play function compares resolved colours.
const scrimSwatch = css({ bg: 'overlay.scrim' })

function Confirm({ open, onOpenChange }: { open?: boolean; onOpenChange?: (open: boolean) => void }) {
  return (
    <Dialog
      role="alertdialog"
      title="Remove this task?"
      description="The task leaves Inbox, and its chat stays in Workbench."
      trigger={<Button variant="dangerText">Remove</Button>}
      {...(open === undefined ? {} : { open })}
      {...(onOpenChange === undefined ? {} : { onOpenChange })}
      actions={
        <>
          <DialogClose>
            <Button>Keep it</Button>
          </DialogClose>
          <Button variant="danger">Remove task</Button>
        </>
      }
    />
  )
}

function NewChat({ open }: { open?: boolean }) {
  return (
    <Dialog
      size="lg"
      title="New chat"
      closeButton
      initialFocus={() => document.querySelector<HTMLElement>('input[name="chat-name"]')}
      trigger={<Button>New chat</Button>}
      {...(open === undefined ? {} : { open })}
      actions={
        <>
          <DialogClose>
            <Button size="sm">Cancel</Button>
          </DialogClose>
          <Button size="sm" variant="primary">
            Start chat
          </Button>
        </>
      }
    >
      <Stack gap="16">
        <TextField label="Name" name="chat-name" />
        <TextArea label="Prompt" rows={4} />
      </Stack>
    </Dialog>
  )
}

function OpenDialogs() {
  return (
    <main className={page}>
      <Confirm open />
      <span hidden data-swatch="scrim" className={scrimSwatch} />
    </main>
  )
}

const meta = {
  title: 'Overlays/Dialog',
  component: OpenDialogs,
  play: async () => {
    // The dialog renders in a portal, outside the story's canvas.
    const body = within(document.body)
    const box = await body.findByRole('alertdialog', { name: 'Remove this task?' })
    await expect(box).toHaveAccessibleDescription('The task leaves Inbox, and its chat stays in Workbench.')
    await expect(box.getBoundingClientRect().width).toBe(440)
    const style = getComputedStyle(box)
    await expect(style.borderTopLeftRadius).toBe('16px')
    await expect(style.paddingTop).toBe('20px')
    await expect(style.boxShadow).not.toBe('none')
    await expect(getComputedStyle(within(box).getByText('Remove this task?')).fontSize).toBe('17px')
    // The buttons sit at the end, Keep it first.
    const keep = within(box).getByRole('button', { name: 'Keep it' })
    const remove = within(box).getByRole('button', { name: 'Remove task' })
    await expect(keep.getBoundingClientRect().right).toBeLessThan(remove.getBoundingClientRect().left)
    await expect(Math.round(box.getBoundingClientRect().right - remove.getBoundingClientRect().right)).toBe(21)
    // A scrim covers the page behind the dialog.
    const scrim = document.querySelector('.dialog__backdrop')
    if (!(scrim instanceof HTMLElement)) throw new Error('no scrim')
    await expect(scrim.getBoundingClientRect().width).toBe(window.innerWidth)
    const swatch = document.querySelector('[data-swatch="scrim"]')
    if (swatch === null) throw new Error('no swatch')
    await expect(getComputedStyle(scrim).backgroundColor).toBe(getComputedStyle(swatch).backgroundColor)
    await expect(within(box).queryByRole('button', { name: 'Close' })).toBeNull()
  },
} satisfies Meta<typeof OpenDialogs>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const formPlay = async () => {
  const body = within(document.body)
  const box = await body.findByRole('dialog', { name: 'New chat' })
  await expect(box.getBoundingClientRect().width).toBe(540)
  await expect(getComputedStyle(within(box).getByText('New chat')).fontSize).toBe('20px')
  await expect(within(box).getByRole('button', { name: 'Close' })).toBeInTheDocument()
  await expect(within(box).getByRole('textbox', { name: 'Name' })).toBeInTheDocument()
}

/** The New chat form: a large dialog with a close button. */
export const FormDark: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <NewChat open />
    </main>
  ),
  play: formPlay,
  globals: { mode: 'dark' },
}
export const FormLight: StoryObj<typeof meta> = { ...FormDark, globals: { mode: 'light' } }

const onOpenChange = fn<(open: boolean) => void>()

/** A click opens the dialog with the focus inside; Tab stays inside; Escape, Cancel and the close button close it. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <Stack gap="12">
        <Confirm onOpenChange={onOpenChange} />
        <NewChat />
        {/* A controlled dialog that is closed stays closed, also with defaultOpen. */}
        <Dialog title="Controlled" open={false} defaultOpen />
      </Stack>
    </main>
  ),
  play: async ({ canvasElement }) => {
    onOpenChange.mockClear()
    const canvas = within(canvasElement)
    const body = within(document.body)
    const trigger = canvas.getByRole('button', { name: 'Remove' })
    await expect(body.queryByRole('alertdialog')).toBeNull()
    await expect(body.queryByRole('dialog', { name: 'Controlled' })).toBeNull()
    await userEvent.click(trigger)
    const box = await body.findByRole('alertdialog')
    await expect(onOpenChange).toHaveBeenLastCalledWith(true)
    // A confirm dialog opens with the focus on the safe choice, Keep it.
    await waitFor(() => expect(within(box).getByRole('button', { name: 'Keep it' })).toHaveFocus())
    // Tab moves between the two buttons and never leaves the dialog.
    for (let i = 0; i < 3; i += 1) {
      await userEvent.tab()
      await expect(box.contains(document.activeElement)).toBe(true)
    }
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('alertdialog')).toBeNull())
    await expect(onOpenChange).toHaveBeenLastCalledWith(false)
    await waitFor(() => expect(trigger).toHaveFocus())
    // Keep it closes the dialog.
    await userEvent.click(trigger)
    await userEvent.click(within(await body.findByRole('alertdialog')).getByRole('button', { name: 'Keep it' }))
    await waitFor(() => expect(body.queryByRole('alertdialog')).toBeNull())
    // The close button closes the New chat form.
    await userEvent.click(canvas.getByRole('button', { name: 'New chat' }))
    const form = await body.findByRole('dialog', { name: 'New chat' })
    // The form opens with the focus on its first field, not on the close button.
    await waitFor(() => expect(within(form).getByRole('textbox', { name: 'Name' })).toHaveFocus())
    await userEvent.click(within(form).getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(canvas.getByRole('button', { name: 'New chat' })).toHaveFocus())
  },
}
