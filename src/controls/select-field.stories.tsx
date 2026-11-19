import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { FolderIcon } from '../foundations/icons'
import { SelectField } from './select-field'
import { TextField } from './text-field'
import { expectCutText } from './tooltip.testing'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', display: 'grid', gap: '20', w: 'shell.dialog', minH: 'shell.dialog' })
const sizes = ['sm', 'md', 'lg', 'xl'] as const
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  inset: css({ color: 'surface.inset' }),
  border: css({ color: 'border.default' }),
  active: css({ color: 'border.active' }),
  text: css({ color: 'fg.default' }),
  muted: css({ color: 'fg.muted' }),
  subtle: css({ color: 'fg.subtle' }),
}

const projects = [
  { value: 'ncc-1701', label: 'ncc-1701' },
  { value: 'pinpoint', label: 'pinpoint' },
  { value: 'omni', label: 'omni' },
] as const

// The Artifacts Project field (D5 403:7580, M6 408:744): the folder, the project in mono and the chevron, in the
// text field's inset box. A text field beside it shows the look it copies.
function Fields() {
  return (
    <main className={page}>
      <SelectField label="Project" icon={<FolderIcon />} mono options={projects} defaultValue="ncc-1701" />
      <TextField label="Title" defaultValue="Link title" />
      <SelectField label="Project, empty" options={projects} placeholder="Pick a project" />
      <SelectField label="Project, disabled" icon={<FolderIcon size="12" />} options={projects} defaultValue="omni" disabled />
      {sizes.map((s) => (
        <SelectField key={s} size={s} label={`Project, ${s}`} options={projects} defaultValue="omni" />
      ))}
      <SelectField label="Project, hidden label" labelHidden options={projects} defaultValue="omni" />
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

function swatch(name: string) {
  const el = document.querySelector(`[data-swatch="${name}"]`)
  if (el === null) throw new Error(`no ${name} swatch`)
  return getComputedStyle(el).color
}

const meta = {
  title: 'Forms/Select field',
  component: Fields,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // The label and the picked value name the trigger.
    const project = canvas.getByRole('button', { name: 'Project ncc-1701' })
    await expect(project).toHaveAttribute('aria-haspopup', 'menu')
    const p = getComputedStyle(project)
    // The text field's look: the inset fill, a 1 px border.default border, radius md and 10 px sides.
    const input = getComputedStyle(canvas.getByRole('textbox', { name: 'Title' }))
    await expect(p.backgroundColor).toBe(swatch('inset'))
    await expect(p.backgroundColor).toBe(input.backgroundColor)
    await expect(p.borderTopColor).toBe(swatch('border'))
    await expect([p.borderTopWidth, p.borderRadius, p.paddingLeft, p.paddingRight]).toEqual([input.borderTopWidth, input.borderRadius, '10px', '10px'])
    await expect(project.getBoundingClientRect().height).toBe(32)
    await expect(project.getBoundingClientRect().width).toBe(canvas.getByRole('textbox', { name: 'Title' }).getBoundingClientRect().width)
    // The label over it is the text field's label.
    const label = canvas.getByText('Project')
    await expect(getComputedStyle(label).fontSize).toBe(getComputedStyle(canvas.getByText('Title')).fontSize)
    await expect(getComputedStyle(label).color).toBe(swatch('muted'))
    // The folder at the start and the chevron at the end, both 16 px in fg.muted, 6 from the value.
    const [folder, chevron] = Array.from(project.querySelectorAll('svg'))
    if (folder === undefined || chevron === undefined) throw new Error('no icons')
    const box = project.getBoundingClientRect()
    const f = folder.getBoundingClientRect()
    const c = chevron.getBoundingClientRect()
    await expect([f.width, f.height, c.width, c.height]).toEqual([16, 16, 16, 16])
    await expect(f.left - box.left).toBe(11)
    await expect(box.right - c.right).toBe(11)
    await expect(getComputedStyle(folder).color).toBe(swatch('muted'))
    await expect(getComputedStyle(chevron).color).toBe(swatch('muted'))
    // The value starts 6 after the folder, in mono 12/16 and fg.default.
    const value = within(project).getByText('ncc-1701')
    const v = getComputedStyle(value)
    await expect(value.getBoundingClientRect().left - f.right).toBe(6)
    await expect(v.fontSize).toBe('12px')
    await expect(Number.parseFloat(v.lineHeight)).toBeCloseTo(16, 2)
    await expect(v.fontFamily).toMatch(/mono/i)
    await expect(v.color).toBe(swatch('text'))
    // Without `mono`, the value is in body, as the text field's text.
    const empty = canvas.getByRole('button', { name: 'Project, empty Pick a project' })
    const placeholder = getComputedStyle(within(empty).getByText('Pick a project'))
    await expect([placeholder.fontSize, placeholder.fontFamily]).toEqual([input.fontSize, input.fontFamily])
    // With no pick, the placeholder is in fg.subtle, and no icon comes before it.
    await expect(placeholder.color).toBe(swatch('subtle'))
    await expect(empty.querySelectorAll('svg')).toHaveLength(1)
    // A disabled field fades and opens nothing; its icon draws at 16 whatever its own size.
    const disabled = canvas.getByRole('button', { name: 'Project, disabled omni' })
    await expect(disabled).toBeDisabled()
    await expect(getComputedStyle(disabled).opacity).toBe('0.45')
    await expect(disabled.querySelector('svg')?.getBoundingClientRect().width).toBe(16)
    // The sizes come from a list, so their CSS comes only from staticCss.
    const heights = sizes.map((s) => canvas.getByRole('button', { name: `Project, ${s} omni` }).getBoundingClientRect().height)
    await expect(heights).toEqual([28, 32, 36, 44])
    // A hidden label still names the field, and takes no room.
    const hidden = canvas.getByRole('button', { name: 'Project, hidden label omni' })
    await expect(canvas.getByText('Project, hidden label').getBoundingClientRect().width).toBeLessThanOrEqual(1)
    await expect(hidden).toBeVisible()
  },
} satisfies Meta<typeof Fields>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onValueChange = fn<(value: string) => void>()

function Picker() {
  const [value, setValue] = useState('ncc-1701')
  return (
    <main className={page}>
      <SelectField
        label="Project"
        icon={<FolderIcon />}
        mono
        options={[...projects, { value: 'archive', label: 'archive', disabled: true }]}
        value={value}
        onValueChange={(next) => {
          onValueChange(next)
          setValue(next)
        }}
      />
      <span hidden data-swatch="active" className={swatches.active} />
    </main>
  )
}

/** A press opens the list with the picked project checked; Enter picks; the field shows the pick; Escape closes. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => <Picker />,
  play: async ({ canvasElement }) => {
    onValueChange.mockClear()
    const canvas = within(canvasElement)
    const body = within(document.body)
    const field = canvas.getByRole('button', { name: 'Project ncc-1701' })
    await userEvent.click(field)
    const menu = await body.findByRole('menu')
    await expect(field).toHaveAttribute('aria-expanded', 'true')
    await expect(getComputedStyle(field).borderTopColor).toBe(swatch('active'))
    await expect(within(menu).getByRole('group', { name: 'Project' })).toBeInTheDocument()
    await expect(within(menu).getByRole('menuitemradio', { name: 'ncc-1701' })).toHaveAttribute('aria-checked', 'true')
    await waitFor(() => expect(menu).toHaveFocus())
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(within(menu).getByRole('menuitemradio', { name: 'pinpoint' })).toHaveAttribute('data-highlighted'))
    await userEvent.keyboard('{Enter}')
    await expect(onValueChange).toHaveBeenLastCalledWith('pinpoint')
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull())
    const changed = canvas.getByRole('button', { name: 'Project pinpoint' })
    await waitFor(() => expect(changed).toHaveFocus())
    // Escape closes without a pick, and a disabled project picks nothing.
    await userEvent.click(changed)
    await body.findByRole('menu')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull())
    await userEvent.click(changed)
    await userEvent.click(within(await body.findByRole('menu')).getByRole('menuitemradio', { name: 'archive' }))
    await expect(onValueChange).toHaveBeenCalledTimes(1)
  },
}

/** An uncontrolled field shows the project the user picks. */
export const Uncontrolled: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <SelectField label="Project" options={projects} defaultValue="omni" />
    </main>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Project omni' }))
    await userEvent.click(within(await within(document.body).findByRole('menu')).getByRole('menuitemradio', { name: 'pinpoint' }))
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Project pinpoint' })).toBeInTheDocument())
  },
}

const narrow = css({ w: 'shell.popoverXs' })
const longName = 'component-library-1701-worktrees-add-link-choices'

/** A long project is cut to one line and shows whole in a tooltip on the field. */
export const LongValue: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <div className={narrow}>
        <SelectField label="Project" icon={<FolderIcon />} mono options={[{ value: 'long', label: longName }]} defaultValue="long" />
      </div>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('button', { name: `Project ${longName}` })
    const value = field.querySelector('.select-field__value')
    if (value === null) throw new Error('no value')
    await expectCutText(value, longName, field)
    // The chevron stays in the box.
    const chevron = field.querySelectorAll('svg')[1]
    await expect(chevron?.getBoundingClientRect().right).toBe(field.getBoundingClientRect().right - 11)
  },
}
