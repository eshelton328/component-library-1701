import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { BrainIcon, PlusIcon, TerminalIcon } from '../foundations/icons'
import { OptionList, type OptionListItem } from './option-list'
import { restPointerOn } from './pointer.testing'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', display: 'grid', gap: '24', justifyItems: 'start' })
// The sort sheet's surface at the sheet body's width (Artifacts M4, 407:814: 364 wide inside 12 padding).
const sheet = css({ bg: 'surface.overlay', px: '12', py: '8', borderRadius: 'xl', w: 'shell.popoverLg' })
// Swatches of the expected tokens, so the play functions compare resolved colours.
const defaultSwatch = css({ color: 'fg.default' })
const mutedSwatch = css({ color: 'fg.muted' })
const accentSwatch = css({ color: 'fg.accent' })
const selectedSwatch = css({ color: 'surface.selected' })
const outlineSwatch = css({ color: 'border.selected' })
const borderSwatch = css({ color: 'border.default' })
const radioSwatch = css({ color: 'accent.default' })
const onAccentSwatch = css({ color: 'fg.onAccent' })

// The rows of the Artifacts M4 sort sheet (407:790, 407:797, 407:802, 407:807).
const sorts: readonly OptionListItem[] = [
  { value: 'newest', label: 'Newest first', description: 'Most recently found at the top' },
  { value: 'oldest', label: 'Oldest first', description: 'Earliest found at the top' },
  { value: 'title', label: 'Title', description: 'A to Z' },
  { value: 'project', label: 'Project', description: 'Grouped by project' },
]

function Sorts() {
  return (
    <main className={page}>
      <div className={sheet}>
        <OptionList label="Sort by" items={sorts} defaultValue="newest" />
      </div>
      <div className={sheet}>
        <OptionList
          label="Group by"
          items={[
            { value: 'none', label: 'No groups' },
            { value: 'kind', label: 'Kind' },
            { value: 'owner', label: 'Owner', description: 'Not available yet', disabled: true },
          ]}
          defaultValue="kind"
        />
      </div>
      <span hidden data-swatch="default" className={defaultSwatch} />
      <span hidden data-swatch="muted" className={mutedSwatch} />
      <span hidden data-swatch="accent" className={accentSwatch} />
    </main>
  )
}

function swatch(name: string) {
  const el = document.querySelector(`[data-swatch="${name}"]`)
  if (el === null) throw new Error(`no ${name} swatch`)
  return getComputedStyle(el).color
}

function rowOf(radio: HTMLElement) {
  const row = radio.closest('label')
  if (!(row instanceof HTMLElement)) throw new Error('no row')
  return row
}

function checkOf(row: HTMLElement) {
  const check = row.querySelector('.option-list__itemControl')
  if (!(check instanceof HTMLElement)) throw new Error('no check')
  return check
}

const meta = {
  title: 'Forms/Option list',
  component: Sorts,
  play: async ({ canvasElement }) => {
    // Put the runner's pointer on the canvas padding before the rows' idle fills are read.
    await restPointerOn(canvasElement)
    const canvas = within(canvasElement)
    const group = canvas.getByRole('radiogroup', { name: 'Sort by' })
    const radios = within(group).getAllByRole('radio')
    // Each row is a radio named by its title alone.
    for (const [i, name] of ['Newest first', 'Oldest first', 'Title', 'Project'].entries()) {
      await expect(radios[i]).toHaveAccessibleName(name)
    }
    await expect(within(group).getByRole('radio', { name: 'Newest first' })).toBeChecked()
    await expect(within(group).getByRole('radio', { name: 'Oldest first' })).not.toBeChecked()
    // The description describes the radio for assistive technology.
    await expect(within(group).getByRole('radio', { name: 'Title' })).toHaveAccessibleDescription('A to Z')
    const rows = radios.map(rowOf)
    const [first, second] = rows
    if (first === undefined || second === undefined) throw new Error('no rows')
    const style = getComputedStyle(first)
    // Padding 8/12, radius 8, no fill and no border (407:790).
    await expect([style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft]).toEqual(['8px', '12px', '8px', '12px'])
    await expect(style.borderTopLeftRadius).toBe('8px')
    await expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)')
    await expect(style.borderTopWidth).toBe('0px')
    // 2 between rows.
    await expect(second.getBoundingClientRect().top - first.getBoundingClientRect().bottom).toBe(2)
    // Title: label, Medium 14/20 in fg.default. Description: small, Regular 12/16 in fg.muted
    // (Figma draws Regular 11, which the inventory merges into small).
    const title = getComputedStyle(within(first).getByText('Newest first'))
    await expect([title.fontSize, title.fontWeight]).toEqual(['14px', '500'])
    await expect(parseFloat(title.lineHeight)).toBeCloseTo(20, 0)
    await expect(title.color).toBe(swatch('default'))
    const description = getComputedStyle(within(first).getByText('Most recently found at the top'))
    await expect([description.fontSize, description.fontWeight]).toEqual(['12px', '400'])
    await expect(parseFloat(description.lineHeight)).toBeCloseTo(16, 0)
    await expect(description.color).toBe(swatch('muted'))
    // Row height: 8 + 20 + 2 + 16 + 8 with the text style line heights.
    await expect(Math.round(first.getBoundingClientRect().height)).toBe(54)
    // The text column and the check are 10 apart; the check is 16 px in fg.accent.
    const check = checkOf(first)
    const body = first.querySelector('.option-list__itemBody')
    if (body === null) throw new Error('no text column')
    await expect(check.getBoundingClientRect().left - body.getBoundingClientRect().right).toBe(10)
    const icon = check.querySelector('svg')
    if (icon === null) throw new Error('no check icon')
    await expect(icon.getAttribute('viewBox')).toBe('0 0 24 24')
    await expect([icon.getBoundingClientRect().width, icon.getBoundingClientRect().height]).toEqual([16, 16])
    await expect(getComputedStyle(icon).stroke).toBe(swatch('accent'))
    // The check shows on the chosen row only; the others keep its space.
    await expect(rows.map((row) => getComputedStyle(checkOf(row)).visibility)).toEqual(['visible', 'hidden', 'hidden', 'hidden'])
    await expect(checkOf(second).getBoundingClientRect().width).toBe(16)
    // A row with no description has the title only.
    const plain = rowOf(canvas.getByRole('radio', { name: 'Kind' }))
    await expect(Math.round(plain.getBoundingClientRect().height)).toBe(36)
    // A disabled row is dimmed and cannot be chosen.
    const owner = canvas.getByRole('radio', { name: 'Owner' })
    await expect(owner).toBeDisabled()
    await expect(getComputedStyle(rowOf(owner)).opacity).toBe('0.45')
  },
} satisfies Meta<typeof Sorts>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

// A stand-in for the caller's pill (Inbox D2 346:794): a story in this tier cannot import Badge from parts.
const pill = css({ display: 'inline-flex', px: '8', py: '2', borderRadius: 'full', bg: 'accent.faint', color: 'fg.accent', textStyle: 'pill' })

// The Choose one list of Inbox D2 (346:787): the first option carries a Recommended pill (346:789).
const choices: readonly OptionListItem[] = [
  {
    value: 'rpc',
    label: 'Hono RPC client',
    description: 'One source of types for server and client. Ties the frontend to Hono.',
    badge: <span className={pill}>Recommended</span>,
  },
  { value: 'fetch', label: 'Plain fetch with zod schemas', description: 'Works with any server. The schemas are a second copy of the types.' },
  { value: 'other', label: 'Something else' },
]

function Choices() {
  return (
    <main className={page}>
      <div className={sheet}>
        <OptionList label="Choose one" items={choices} />
      </div>
    </main>
  )
}

const badgePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const rpc = canvas.getByRole('radio', { name: 'Hono RPC client' })
  // The pill is not part of the name; it describes the radio before the description.
  await expect(rpc).toHaveAccessibleName('Hono RPC client')
  await expect(rpc).toHaveAccessibleDescription('Recommended One source of types for server and client. Ties the frontend to Hono.')
  await expect(canvas.getByRole('radio', { name: 'Something else' })).not.toHaveAttribute('aria-describedby')
  // The label and the pill sit in one row, 8 apart and centred on each other (346:792).
  const label = within(rowOf(rpc)).getByText('Hono RPC client')
  const badge = rowOf(rpc).querySelector('.option-list__itemBadge')
  if (!(badge instanceof HTMLElement)) throw new Error('no badge')
  const l = label.getBoundingClientRect()
  const b = badge.getBoundingClientRect()
  await expect(b.left - l.right).toBe(8)
  await expect(Math.abs(b.top + b.height / 2 - (l.top + l.height / 2))).toBeLessThan(1)
  await expect(getComputedStyle(label).fontWeight).toBe('500')
  // A row without a pill keeps its height: 8 + 20 + 8.
  await expect(Math.round(rowOf(canvas.getByRole('radio', { name: 'Something else' })).getBoundingClientRect().height)).toBe(36)
  // Picking the row with the pill works as any other row.
  await userEvent.click(label)
  await expect(rpc).toBeChecked()
}

/** An option with a pill after its label, such as Recommended (Inbox D2, T3, M5). */
export const BadgeDark: StoryObj<typeof meta> = { globals: { mode: 'dark' }, render: () => <Choices />, play: badgePlay }
export const BadgeLight: StoryObj<typeof meta> = { globals: { mode: 'light' }, render: () => <Choices />, play: badgePlay }

const onValueChange = fn<(value: string) => void>()
const onItemSelect = fn<(value: string) => void>()

function Controlled() {
  const [value, setValue] = useState<string | null>('newest')
  return (
    <main className={page}>
      <div className={sheet}>
        <OptionList
          label="Sort by"
          items={[...sorts, { value: 'size', label: 'Size', disabled: true }]}
          value={value}
          onValueChange={(next) => {
            setValue(next)
            onValueChange(next)
          }}
          onItemSelect={onItemSelect}
        />
      </div>
      <output data-testid="value">{value}</output>
    </main>
  )
}

/** A click, Space and Enter choose a row and call `onItemSelect`; arrow keys move the choice without it. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    onValueChange.mockClear()
    onItemSelect.mockClear()
    const canvas = within(canvasElement)
    const value = canvas.getByTestId('value')
    // A click on a row's text chooses it once.
    await userEvent.click(canvas.getByText('Title'))
    await expect(onValueChange).toHaveBeenCalledTimes(1)
    await expect(onValueChange).toHaveBeenLastCalledWith('title')
    await expect(onItemSelect).toHaveBeenCalledTimes(1)
    await expect(onItemSelect).toHaveBeenLastCalledWith('title')
    await expect(value).toHaveTextContent('title')
    await expect(canvas.getByRole('radio', { name: 'Title' })).toBeChecked()
    await expect(getComputedStyle(checkOf(rowOf(canvas.getByRole('radio', { name: 'Title' })))).visibility).toBe('visible')
    await expect(getComputedStyle(checkOf(rowOf(canvas.getByRole('radio', { name: 'Newest first' })))).visibility).toBe('hidden')
    // A click on the chosen row picks it again without a change.
    await userEvent.click(canvas.getByText('Title'))
    await expect(onValueChange).toHaveBeenCalledTimes(1)
    await expect(onItemSelect).toHaveBeenCalledTimes(2)
    // Tab moves the focus to the chosen row; arrow keys move the choice, not a pick.
    onItemSelect.mockClear()
    canvas.getByRole('radio', { name: 'Title' }).blur()
    await userEvent.tab()
    await waitFor(() => expect(canvas.getByRole('radio', { name: 'Title' })).toHaveFocus())
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(canvas.getByRole('radio', { name: 'Project' })).toHaveFocus())
    await expect(onValueChange).toHaveBeenLastCalledWith('project')
    await expect(value).toHaveTextContent('project')
    await userEvent.keyboard('{ArrowUp}')
    await expect(value).toHaveTextContent('title')
    await expect(onItemSelect).not.toHaveBeenCalled()
    // The focused row shows a focus ring.
    await expect(getComputedStyle(rowOf(canvas.getByRole('radio', { name: 'Title' }))).outlineStyle).toBe('solid')
    // Space and Enter pick the focused row.
    await userEvent.keyboard(' ')
    await expect(onItemSelect).toHaveBeenLastCalledWith('title')
    await userEvent.keyboard('{ArrowUp}')
    await userEvent.keyboard('{Enter}')
    await expect(onItemSelect).toHaveBeenLastCalledWith('oldest')
    await expect(onItemSelect).toHaveBeenCalledTimes(2)
    await expect(value).toHaveTextContent('oldest')
    // A disabled row does not change the choice.
    onValueChange.mockClear()
    onItemSelect.mockClear()
    await userEvent.click(canvas.getByText('Size'), { pointerEventsCheck: 0 })
    await expect(onValueChange).not.toHaveBeenCalled()
    await expect(onItemSelect).not.toHaveBeenCalled()
    await expect(value).toHaveTextContent('oldest')
  },
}

const onFormChange = fn<(value: string) => void>()

/** In a form the radios submit the item's own value; values with spaces keep their names and descriptions; a reset clears the choice. */
export const InForm: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <form className={sheet} aria-label="Sort form">
        <OptionList
          label="Sort by"
          name="sort"
          items={[
            { value: 'Last modified', label: 'Last modified', description: 'Most recently changed at the top' },
            { value: 'Default order', label: 'Default order', description: 'As the server sends them' },
          ]}
          onValueChange={onFormChange}
        />
        <button type="reset">Reset</button>
      </form>
    </main>
  ),
  play: async ({ canvasElement }) => {
    onFormChange.mockClear()
    const canvas = within(canvasElement)
    const form = canvas.getByRole('form', { name: 'Sort form' })
    if (!(form instanceof HTMLFormElement)) throw new Error('no form')
    const modified = canvas.getByRole('radio', { name: 'Last modified' })
    await expect(modified).toHaveAccessibleDescription('Most recently changed at the top')
    await expect(canvas.getByRole('radio', { name: 'Default order' })).toHaveAccessibleDescription('As the server sends them')
    await expect(new FormData(form).get('sort')).toBeNull()
    await userEvent.click(canvas.getByText('Last modified'))
    await expect(onFormChange).toHaveBeenLastCalledWith('Last modified')
    await expect(new FormData(form).get('sort')).toBe('Last modified')
    await userEvent.click(canvas.getByText('Default order'))
    await expect(onFormChange).toHaveBeenLastCalledWith('Default order')
    await expect(new FormData(form).get('sort')).toBe('Default order')
    // A reset clears the choice without calling onValueChange with no value.
    onFormChange.mockClear()
    await userEvent.click(canvas.getByRole('button', { name: 'Reset' }))
    await waitFor(() => expect(canvas.getByRole('radio', { name: 'Default order' })).not.toBeChecked())
    await expect(onFormChange).not.toHaveBeenCalled()
    await expect(new FormData(form).get('sort')).toBeNull()
  },
}

// The Run in picker (Inbox D3 346:1234) at its width, 380 less its 8 px padding.
const picker = css({ bg: 'surface.overlay', p: '8', borderRadius: 'xl', w: 'shell.popoverPicker' })
// A stand-in for the caller's status pill (346:1280): a story in this tier cannot import StatusPill from parts.
const status = css({ display: 'inline-flex', px: '8', py: '2', borderRadius: 'full', bg: 'status.needsYou.bg', color: 'status.needsYou.fg', textStyle: 'pill' })

// Run in rows (346:1243, 346:1273, 346:1264): an agent mark, a title with a pill, a mono meta line, and at the end
// a check on the chosen row or a status pill on a busy one. Stand-ins for KindMark: a story here cannot import parts.
const workspaces: readonly OptionListItem[] = [
  {
    value: 'claude',
    label: 'ncc-1701 · main',
    description: 'claude · ~/ncc-1701 · idle',
    badge: <span className={pill}>Recommended</span>,
    leading: <BrainIcon size="16" />,
  },
  {
    value: 'codex',
    label: 'component-library-1701',
    description: 'codex · inbox-gaps · 2m ago',
    leading: <TerminalIcon size="16" />,
    trailing: <span className={status}>Needs you</span>,
  },
  { value: 'new', label: 'New chat in another workspace…', leading: <PlusIcon size="16" /> },
]

function Picker() {
  return (
    <main className={page}>
      <div className={picker}>
        <OptionList label="Run in" items={workspaces} defaultValue="claude" descriptionStyle="mono" selectedFill />
      </div>
      <span hidden data-swatch="default" className={defaultSwatch} />
      <span hidden data-swatch="selected" className={selectedSwatch} />
      <span hidden data-swatch="muted" className={mutedSwatch} />
      <span hidden data-swatch="accent" className={accentSwatch} />
    </main>
  )
}

const pickerPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const claude = rowOf(canvas.getByRole('radio', { name: 'ncc-1701 · main' }))
  const codexRadio = canvas.getByRole('radio', { name: 'component-library-1701' })
  const codex = rowOf(codexRadio)
  const part = (row: HTMLElement, slot: string) => {
    const el = row.querySelector(`.option-list__${slot}`)
    if (!(el instanceof HTMLElement)) throw new Error(`no ${slot}`)
    return el
  }
  // The leading mark comes first, 16 px, 10 before the text, and is hidden from assistive technology.
  const lead = part(claude, 'itemLeading')
  await expect(claude.firstElementChild).toBe(lead)
  await expect(lead).toHaveAttribute('aria-hidden', 'true')
  await expect(lead.getBoundingClientRect().width).toBe(16)
  await expect(part(claude, 'itemBody').getBoundingClientRect().left - lead.getBoundingClientRect().right).toBe(10)
  // The pill stays beside the title.
  await expect(part(claude, 'itemBadge').getBoundingClientRect().left - within(claude).getByText('ncc-1701 · main').getBoundingClientRect().right).toBe(8)
  // The meta line is mono 12 in fg.muted.
  const meta = getComputedStyle(within(claude).getByText('claude · ~/ncc-1701 · idle'))
  await expect([meta.fontSize, meta.color]).toEqual(['12px', swatch('muted')])
  await expect(meta.fontFamily).toMatch(/Mono/)
  // `selectedFill` fills the chosen row with surface.selected (346:1243); the others have no fill.
  await expect(getComputedStyle(claude).backgroundColor).toBe(swatch('selected'))
  await expect(getComputedStyle(codex).backgroundColor).toBe('rgba(0, 0, 0, 0)')
  // The chosen row ends in its check; a row with a status pill ends in the pill and keeps no check space.
  await expect(getComputedStyle(part(claude, 'itemControl')).visibility).toBe('visible')
  const end = part(codex, 'itemTrailing')
  await expect(getComputedStyle(part(codex, 'itemControl')).display).toBe('none')
  const pad = parseFloat(getComputedStyle(codex).paddingRight)
  await expect(Math.round(codex.getBoundingClientRect().right - pad)).toBe(Math.round(end.getBoundingClientRect().right))
  // The pill describes the radio, after the description.
  await expect(codexRadio).toHaveAccessibleDescription('codex · inbox-gaps · 2m ago Needs you')
  // Choosing the busy row shows its check after the pill.
  await userEvent.click(within(codex).getByText('component-library-1701'))
  await expect(codexRadio).toBeChecked()
  await waitFor(() => expect(getComputedStyle(part(codex, 'itemControl')).display).not.toBe('none'))
  await expect(part(codex, 'itemControl').getBoundingClientRect().left).toBeGreaterThan(end.getBoundingClientRect().right)
  // A row with a plus and a title only.
  await expect(rowOf(canvas.getByRole('radio', { name: 'New chat in another workspace…' })).querySelector('.option-list__itemLeading svg')).not.toBeNull()
}

/** The Run in picker rows (Inbox D3): a leading mark, a mono meta line and a trailing status pill. */
export const PickerDark: StoryObj<typeof meta> = { globals: { mode: 'dark' }, render: () => <Picker />, play: pickerPlay }
export const PickerLight: StoryObj<typeof meta> = { globals: { mode: 'light' }, render: () => <Picker />, play: pickerPlay }

// The options of a question (Inbox D2 346:789), at the width of the question's column.
const column = css({ bg: 'surface.pane', p: '16', w: 'shell.dialogLg' })

function Cards() {
  return (
    <main className={page}>
      <div className={column}>
        <OptionList label="Choose one" items={choices} defaultValue="rpc" variant="card" />
      </div>
      <span hidden data-swatch="selected" className={selectedSwatch} />
      <span hidden data-swatch="outline" className={outlineSwatch} />
      <span hidden data-swatch="border" className={borderSwatch} />
      <span hidden data-swatch="radio" className={radioSwatch} />
      <span hidden data-swatch="onAccent" className={onAccentSwatch} />
    </main>
  )
}

const cardPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const rpcRadio = canvas.getByRole('radio', { name: 'Hono RPC client' })
  const fetchRadio = canvas.getByRole('radio', { name: 'Plain fetch with zod schemas' })
  const [rpc, plain] = [rowOf(rpcRadio), rowOf(fetchRadio)]
  const radioOf = (row: HTMLElement) => {
    const el = row.querySelector('.option-list__itemRadio')
    if (!(el instanceof HTMLElement)) throw new Error('no radio')
    return el
  }
  // A bordered card: padding 12 by 16, radius 10, 1 px border, 8 between cards.
  const s = getComputedStyle(plain)
  await expect([s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft]).toEqual(['12px', '16px', '12px', '16px'])
  await expect([s.borderTopLeftRadius, s.borderTopWidth, s.borderTopColor]).toEqual(['10px', '1px', swatch('border')])
  await expect(plain.getBoundingClientRect().top - rpc.getBoundingClientRect().bottom).toBe(8)
  // The chosen card is outlined in cyan on the selected fill.
  const c = getComputedStyle(rpc)
  await expect([c.backgroundColor, c.borderTopColor]).toEqual([swatch('selected'), swatch('outline')])
  // A 16 px radio leads, at the top, 12 before the text; the trailing check is gone.
  const radio = radioOf(rpc)
  await expect(rpc.firstElementChild).toBe(radio)
  await expect([radio.getBoundingClientRect().width, radio.getBoundingClientRect().height]).toEqual([16, 16])
  await expect(radio.getBoundingClientRect().top - rpc.getBoundingClientRect().top).toBe(13)
  const body = rpc.querySelector('.option-list__itemBody')
  if (body === null) throw new Error('no text column')
  await expect(body.getBoundingClientRect().left - radio.getBoundingClientRect().right).toBe(12)
  await expect(getComputedStyle(rpc.querySelector('.option-list__itemControl') ?? rpc).display).toBe('none')
  // The chosen radio is a cyan dot in a disc of fg.onAccent, with no cyan ring (346:790).
  const chosen = getComputedStyle(radio)
  await expect([chosen.backgroundColor, chosen.borderTopColor]).toEqual([swatch('onAccent'), swatch('onAccent')])
  const dot = getComputedStyle(radio, '::after')
  await expect([dot.width, dot.backgroundColor]).toEqual(['8px', swatch('radio')])
  await expect(getComputedStyle(radioOf(plain)).borderTopColor).not.toBe(swatch('radio'))
  // Picking another card moves the outline.
  await userEvent.click(within(plain).getByText('Plain fetch with zod schemas'))
  await expect(fetchRadio).toBeChecked()
  await waitFor(() => expect(getComputedStyle(plain).borderTopColor).toBe(swatch('outline')))
  await expect(getComputedStyle(rpc).borderTopColor).toBe(swatch('border'))
}

/** Choice cards (Inbox D2 346:789): a bordered card per option with a leading radio; the chosen one is outlined. */
export const CardDark: StoryObj<typeof meta> = { globals: { mode: 'dark' }, render: () => <Cards />, play: cardPlay }
export const CardLight: StoryObj<typeof meta> = { globals: { mode: 'light' }, render: () => <Cards />, play: cardPlay }

// `size="sm"`: the 13 px titles and 11 px mono meta of the Run in picker (D3 346:1248, 346:1251) and the 13 px
// titles of the question cards (D2 346:793), whose descriptions stay Regular 12 (346:796).
function Small() {
  return (
    <main className={page}>
      <div className={picker}>
        <OptionList label="Run in" items={workspaces} defaultValue="claude" descriptionStyle="mono" selectedFill size="sm" />
      </div>
      <div className={column}>
        <OptionList label="Choose one" items={choices} defaultValue="rpc" variant="card" size="sm" />
      </div>
    </main>
  )
}

const smallPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const font = (el: HTMLElement) => {
    const s = getComputedStyle(el)
    return [s.fontSize, Math.round(parseFloat(s.lineHeight)), s.fontWeight]
  }
  const codex = rowOf(canvas.getByRole('radio', { name: 'component-library-1701' }))
  // Picker rows: the title in labelSm (13/16), the mono meta line in monoSm (11/16).
  await expect(font(within(codex).getByText('component-library-1701'))).toEqual(['13px', 16, '500'])
  const meta = within(codex).getByText('codex · inbox-gaps · 2m ago')
  await expect(font(meta)).toEqual(['11px', 16, '400'])
  await expect(getComputedStyle(meta).fontFamily).toMatch(/Mono/)
  // A row with a meta line is 8 + 16 + 2 + 16 + 8 = 50 (Figma 49; 54 at the default size); a title-only row is 32.
  await expect(Math.round(codex.getBoundingClientRect().height)).toBe(50)
  await expect(Math.round(rowOf(canvas.getByRole('radio', { name: 'New chat in another workspace…' })).getBoundingClientRect().height)).toBe(32)
  // Cards: the title in labelSm; a text description stays small (12/16).
  const card = rowOf(canvas.getByRole('radio', { name: 'Plain fetch with zod schemas' }))
  await expect(font(within(card).getByText('Plain fetch with zod schemas'))).toEqual(['13px', 16, '500'])
  await expect(font(within(card).getByText('Works with any server. The schemas are a second copy of the types.'))).toEqual(['12px', 16, '400'])
}

export const SmallDark: StoryObj<typeof meta> = { globals: { mode: 'dark' }, render: () => <Small />, play: smallPlay }
export const SmallLight: StoryObj<typeof meta> = { globals: { mode: 'light' }, render: () => <Small />, play: smallPlay }
