import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { OptionList, type OptionListItem } from './option-list'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', display: 'grid', gap: '24', justifyItems: 'start' })
// The sort sheet's surface at the sheet body's width (Artifacts M4, 407:814: 364 wide inside 12 padding).
const sheet = css({ bg: 'surface.overlay', px: '12', py: '8', borderRadius: 'xl', w: 'shell.popoverLg' })
// Swatches of the expected tokens, so the play functions compare resolved colours.
const defaultSwatch = css({ color: 'fg.default' })
const mutedSwatch = css({ color: 'fg.muted' })
const accentSwatch = css({ color: 'fg.accent' })

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
    // Title: label, Medium 14/20 in fg.default. Description: small, Regular 12/17 in fg.muted
    // (Figma draws Regular 11, which the inventory merges into small).
    const title = getComputedStyle(within(first).getByText('Newest first'))
    await expect([title.fontSize, title.fontWeight]).toEqual(['14px', '500'])
    await expect(parseFloat(title.lineHeight)).toBeCloseTo(20, 0)
    await expect(title.color).toBe(swatch('default'))
    const description = getComputedStyle(within(first).getByText('Most recently found at the top'))
    await expect([description.fontSize, description.fontWeight]).toEqual(['12px', '400'])
    await expect(parseFloat(description.lineHeight)).toBeCloseTo(17, 0)
    await expect(description.color).toBe(swatch('muted'))
    // Row height: 8 + 20 + 2 + 17 + 8 with the text style line heights.
    await expect(Math.round(first.getBoundingClientRect().height)).toBe(55)
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
