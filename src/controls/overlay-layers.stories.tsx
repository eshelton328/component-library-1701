import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { BottomSheet } from './bottom-sheet'
import { Button } from './button'
import { Dialog, DialogClose } from './dialog'
import { Stack } from './layout'
import { Menu } from './menu'
import { SelectField } from './select-field'
import { motionDone } from './bottom-sheet.testing'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', minH: 'shell.dialog' })

const projects = [
  { value: 'ncc-1701', label: 'ncc-1701' },
  { value: 'pinpoint', label: 'pinpoint' },
  { value: 'omni', label: 'omni' },
] as const

// The Artifacts Add a link dialog (D5) with its Project field: a SelectField whose list opens over the dialog.
function AddLink({ trigger }: { trigger: string }) {
  return (
    <Dialog
      size="lg"
      padding="form"
      title="Add a link"
      trigger={<Button>{trigger}</Button>}
      actions={
        <>
          <DialogClose>
            <Button size="sm">Cancel</Button>
          </DialogClose>
          <Button size="sm" variant="primary">
            Add link
          </Button>
        </>
      }
    >
      <SelectField label="Project" options={projects} defaultValue="ncc-1701" />
    </Dialog>
  )
}

function SelectInDialog() {
  return (
    <main className={page}>
      <AddLink trigger="Add a link" />
    </main>
  )
}

function MenuInSheet() {
  const [picked, setPicked] = useState('none')
  return (
    <main className={page}>
      <Stack gap="12">
        <p>{`Picked: ${picked}`}</p>
        <BottomSheet title="Chat" trigger={<Button>Open chat sheet</Button>}>
          {/* The rows under the button make the sheet taller than the menu, so the whole menu opens over the sheet. */}
          <Stack gap="12">
            <Menu
              trigger={<Button>Chat actions</Button>}
              items={[
                { value: 'pin', label: 'Pin to sidebar' },
                { value: 'rename', label: 'Rename' },
              ]}
              onSelect={setPicked}
            />
            <p>Model: opus</p>
            <p>Workspace: the-bridge</p>
            <p>Started: today</p>
            <p>Messages: 12</p>
            <p>Context: 40%</p>
          </Stack>
        </BottomSheet>
      </Stack>
    </main>
  )
}

function DialogFromSheet() {
  return (
    <main className={page}>
      <BottomSheet title="Links" trigger={<Button>Open links sheet</Button>}>
        <AddLink trigger="New link" />
      </BottomSheet>
    </main>
  )
}

// A real pointer click by the test runner's browser at the centre of `el`, in viewport coordinates: it lands on
// whatever is drawn at that point, as a mouse or a finger does. A synthetic click would reach `el` even under a
// dialog that covers it.
async function press(el: Element) {
  const { userEvent } = await import('vitest/browser')
  const r = el.getBoundingClientRect()
  // Move to the point, then press and release the left button there.
  await userEvent.pointer([{ coords: { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } }, '[MouseLeft]'])
}

async function key(text: string) {
  const { userEvent } = await import('vitest/browser')
  await userEvent.keyboard(text)
}

const body = () => within(document.body)

// Opens the Project list of the Add a link dialog with the pointer and picks pinpoint with the pointer.
async function pickProject(dialog: HTMLElement) {
  await press(within(dialog).getByRole('button', { name: 'Project ncc-1701' }))
  const menu = await body().findByRole('menu')
  await press(within(menu).getByRole('menuitemradio', { name: 'pinpoint' }))
  await waitFor(() => expect(body().queryByRole('menu')).toBeNull())
  await expect(within(dialog).getByRole('button', { name: 'Project pinpoint' })).toBeInTheDocument()
}

const selectInDialogPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  await press(within(canvasElement).getByRole('button', { name: 'Add a link' }))
  const dialog = await body().findByRole('dialog', { name: 'Add a link' })
  await pickProject(dialog)
  await expect(dialog).toBeInTheDocument()
}

const menuInSheetPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  await press(canvas.getByRole('button', { name: 'Open chat sheet' }))
  const sheet = await body().findByRole('dialog', { name: 'Chat' })
  await motionDone(sheet)
  await press(within(sheet).getByRole('button', { name: 'Chat actions' }))
  const menu = await body().findByRole('menu', { name: 'Chat actions' })
  await press(within(menu).getByRole('menuitem', { name: 'Pin to sidebar' }))
  await waitFor(() => expect(canvas.getByText('Picked: pin')).toBeInTheDocument())
  await expect(body().getByRole('dialog', { name: 'Chat' })).toBeInTheDocument()
}

const dialogFromSheetPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  await press(within(canvasElement).getByRole('button', { name: 'Open links sheet' }))
  const sheet = await body().findByRole('dialog', { name: 'Links' })
  await motionDone(sheet)
  await press(within(sheet).getByRole('button', { name: 'New link' }))
  const dialog = await body().findByRole('dialog', { name: 'Add a link' })
  await pickProject(dialog)
  // The sheet stays open under the dialog; the modal dialog hides it from assistive technology meanwhile.
  await expect(body().getByRole('dialog', { name: 'Links', hidden: true })).toBeInTheDocument()
}

// Escape closes only the top overlay: the list first, then the dialog.
const escapePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  await press(within(canvasElement).getByRole('button', { name: 'Add a link' }))
  const dialog = await body().findByRole('dialog', { name: 'Add a link' })
  await press(within(dialog).getByRole('button', { name: 'Project ncc-1701' }))
  const menu = await body().findByRole('menu')
  await waitFor(() => expect(menu.contains(document.activeElement)).toBe(true))
  await key('{Escape}')
  await waitFor(() => expect(body().queryByRole('menu')).toBeNull())
  await expect(body().getByRole('dialog', { name: 'Add a link' })).toBeInTheDocument()
  await key('{Escape}')
  await waitFor(() => expect(body().queryByRole('dialog', { name: 'Add a link' })).toBeNull())
}

const meta = {
  title: 'Overlays/Overlay layers',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta

/** A SelectField in a Dialog: its list opens over the dialog, and a pointer picks a project. */
export const SelectInDialogDark: StoryObj<typeof meta> = { render: () => <SelectInDialog />, play: selectInDialogPlay, globals: { mode: 'dark' } }
export const SelectInDialogLight: StoryObj<typeof meta> = { render: () => <SelectInDialog />, play: selectInDialogPlay, globals: { mode: 'light' } }

/** A Menu in a BottomSheet: it opens over the sheet, and a pointer picks an action. */
export const MenuInSheetDark: StoryObj<typeof meta> = { render: () => <MenuInSheet />, play: menuInSheetPlay, globals: { mode: 'dark' } }
export const MenuInSheetLight: StoryObj<typeof meta> = { render: () => <MenuInSheet />, play: menuInSheetPlay, globals: { mode: 'light' } }

/** A Dialog opened from a BottomSheet opens over the sheet, and its SelectField's list over the dialog. */
export const DialogFromSheetDark: StoryObj<typeof meta> = { render: () => <DialogFromSheet />, play: dialogFromSheetPlay, globals: { mode: 'dark' } }
export const DialogFromSheetLight: StoryObj<typeof meta> = { render: () => <DialogFromSheet />, play: dialogFromSheetPlay, globals: { mode: 'light' } }

/** Escape closes the top overlay only: the open list, then the dialog. */
export const EscapeClosesTop: StoryObj<typeof meta> = { render: () => <SelectInDialog />, play: escapePlay, globals: { mode: 'dark' } }
