import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
import { Stack } from '../controls/layout'
import { ListRow } from './list-row'
import { StatusPill } from './status-pill'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', display: 'grid', gap: '24', justifyItems: 'start' })
const inboxList = css({ bg: 'surface.pane', w: 'shell.listPane', px: '12', py: '12', borderRadius: 'xl' })
const sidebar = css({ bg: 'surface.pane', w: 'shell.sidebar', px: '10', py: '12', borderRadius: 'xl' })
// A stand-in for the kind tile, which is not built yet.
const tile = css({ display: 'block', w: 'control.sm', h: 'control.sm', borderRadius: 'md', bg: 'status.needsYou.bg' })
const dot = css({ display: 'block', w: 'icon.16', h: 'icon.16', borderRadius: 'full', bg: 'kind.agent' })

const onSelect = fn<(id: string) => void>()
const onApprove = fn()

function Lists() {
  return (
    <main className={page}>
      <div className={inboxList}>
        <Stack gap="2">
          <ListRow
            title="Approve the push to main for component-library-1701"
            meta="ncc-1701 · Claude · approval"
            leading={<span className={tile} />}
            trailing="2m"
            onSelect={() => { onSelect('approval') }}
            actions={
              <>
                <Button size="sm" variant="primary" onClick={onApprove}>
                  Approve
                </Button>
                <Button size="sm">Deny</Button>
              </>
            }
          />
          <ListRow title="Which token for the chat row indent?" meta="ncc-1701 · Codex · question" leading={<span className={tile} />} trailing="14m" selected onSelect={() => { onSelect('question') }} />
          <ListRow title="Review the dialog PR" meta="component-library-1701 · review" leading={<span className={tile} />} trailing="1h" snoozed onSelect={() => { onSelect('review') }}>
            Snoozed until 9:00
          </ListRow>
          <ListRow title="Open and snoozed" meta="ncc-1701 · review" leading={<span className={tile} />} trailing="5h" selected snoozed onSelect={() => { onSelect('open-snoozed') }} />
          <ListRow
            title="Sync the tokens to Figma"
            meta="ncc-1701 · next step"
            leading={<span className={tile} />}
            trailing={
              <>
                3h
                <StatusPill tone="working" label="Working" dot />
              </>
            }
            running
            onSelect={() => { onSelect('running') }}
          />
        </Stack>
      </div>
      <div className={sidebar}>
        <Stack gap="4">
          <ListRow variant="sidebar" title="Build the list row and its stories for the Data display group" meta="opus · 42%" leading={<span className={dot} />} trailing={<StatusPill tone="running" label="Running" />} onSelect={() => { onSelect('chat-1') }} />
          <ListRow variant="sidebar" title="Figma sync" meta="sonnet · 12%" leading={<span className={dot} />} trailing={<StatusPill tone="idle" label="Idle" />} selected onSelect={() => { onSelect('chat-2') }} />
          <ListRow variant="sidebar" title="A row with no select" meta="read only" leading={<span className={dot} />} />
          <ListRow variant="sidebar" title="Current, no select" meta="read only" leading={<span className={dot} />} selected />
        </Stack>
      </div>
      <span hidden data-swatch="subtle" className={css({ color: 'fg.subtle' })} />
      <span hidden data-swatch="muted" className={css({ color: 'fg.muted' })} />
    </main>
  )
}

const meta = {
  title: 'Data display/List row',
  component: Lists,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const rowOf = (name: string | RegExp) => {
      const row = canvas.getByText(name).closest('.list-row__root')
      if (!(row instanceof HTMLElement)) throw new Error('no row')
      return row
    }
    const approval = rowOf(/^Approve the push/)
    const question = rowOf('Which token for the chat row indent?')
    const snoozed = rowOf('Review the dialog PR')
    const running = rowOf('Sync the tokens to Figma')
    const style = getComputedStyle(approval)
    await expect([style.paddingTop, style.paddingLeft, style.borderTopLeftRadius]).toEqual(['10px', '10px', '10px'])
    // Selected and running rows share the selected colours; a default row has none.
    await expect(getComputedStyle(question).backgroundColor).not.toBe(style.backgroundColor)
    await expect(getComputedStyle(running).backgroundColor).toBe(getComputedStyle(question).backgroundColor)
    await expect(getComputedStyle(question).borderTopColor).not.toBe(style.borderTopColor)
    await expect(canvas.getByRole('button', { name: 'Which token for the chat row indent?' })).toHaveAttribute('aria-current', 'true')
    await expect(canvas.getByRole('button', { name: 'Sync the tokens to Figma' })).not.toHaveAttribute('aria-current')
    await expect(getComputedStyle(snoozed).opacity).toBe('0.85')
    // A selected row is not dimmed, also when it is snoozed.
    await expect(getComputedStyle(rowOf('Open and snoozed')).opacity).toBe('1')
    // A selected row without onSelect still marks the current item.
    await expect(canvas.getByText('Current, no select')).toHaveAttribute('aria-current', 'true')
    await expect(within(snoozed).getByText('Snoozed until 9:00')).toBeInTheDocument()
    await expect(within(running).getByText('Working')).toBeInTheDocument()
    // The age is fg.subtle (Figma #4a5675), but fg.muted on a selected or running row (surface.selected)
    // and on a snoozed row, where the 0.85 opacity would take fg.subtle under 4.5:1.
    const colourOf = (el: Element | null) => {
      if (el === null) throw new Error('no element')
      return getComputedStyle(el).color
    }
    const subtle = colourOf(canvasElement.querySelector('[data-swatch="subtle"]'))
    const muted = colourOf(canvasElement.querySelector('[data-swatch="muted"]'))
    const age = (row: HTMLElement) => colourOf(row.querySelector('.list-row__trailing'))
    await expect(age(approval)).toBe(subtle)
    await expect([age(question), age(running), age(snoozed)]).toEqual([muted, muted, muted])
    // A sidebar row has 24 px at the start and one line of title with an ellipsis.
    const chat = rowOf(/^Build the list row/)
    await expect(getComputedStyle(chat).paddingLeft).toBe('24px')
    const chatTitle = canvas.getByRole('button', { name: /^Build the list row/ })
    await expect(getComputedStyle(chatTitle).textOverflow).toBe('ellipsis')
    await expect(chatTitle.scrollWidth).toBeGreaterThan(chatTitle.clientWidth)
    await expect(chatTitle.getBoundingClientRect().height).toBe(20)
    // A row with no onSelect has no button.
    await expect(canvas.queryByRole('button', { name: 'A row with no select' })).toBeNull()
  },
} satisfies Meta<typeof Lists>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

/** A click anywhere on a row selects it; a button in the row does not; Enter on the title selects it and rings the row. */
export const Behaviour: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    onSelect.mockClear()
    onApprove.mockClear()
    const canvas = within(canvasElement)
    const approvalRow = canvas.getByText(/^Approve the push/).closest('.list-row__root')
    if (!(approvalRow instanceof HTMLElement)) throw new Error('no row')
    // The title button covers the row: the element at the age, far from the title, is the button.
    const age = within(approvalRow).getByText('2m').getBoundingClientRect()
    const hit = document.elementFromPoint(age.left + age.width / 2, age.top + age.height / 2)
    const approvalTitle = within(approvalRow).getByRole('button', { name: /^Approve the push/ })
    await expect(hit).toBe(approvalTitle)
    await userEvent.click(approvalTitle)
    await expect(onSelect).toHaveBeenLastCalledWith('approval')
    // The Approve button sits above it.
    const approve = within(approvalRow).getByRole('button', { name: 'Approve' }).getBoundingClientRect()
    await expect(document.elementFromPoint(approve.left + approve.width / 2, approve.top + approve.height / 2)?.closest('button')?.textContent).toBe('Approve')
    // The space between Approve and Deny belongs to the row, not to the actions slot.
    const deny = within(approvalRow).getByRole('button', { name: 'Deny' }).getBoundingClientRect()
    await expect(document.elementFromPoint((approve.right + deny.left) / 2, approve.top + approve.height / 2)).toBe(approvalTitle)
    // A click on Approve runs the button and does not select the row.
    await userEvent.click(within(approvalRow).getByRole('button', { name: 'Approve' }))
    await expect(onApprove).toHaveBeenCalledTimes(1)
    await expect(onSelect).toHaveBeenCalledTimes(1)
    // The keyboard reaches the title; Enter selects; the row shows the focus ring.
    const title = canvas.getByRole('button', { name: 'Review the dialog PR' })
    title.focus()
    await userEvent.keyboard('{Enter}')
    await expect(onSelect).toHaveBeenLastCalledWith('review')
    await userEvent.tab({ shift: true })
    await userEvent.tab()
    await expect(title).toHaveFocus()
    const row = title.closest('.list-row__root')
    if (!(row instanceof HTMLElement)) throw new Error('no row')
    await expect(getComputedStyle(row).outlineStyle).toBe('solid')
  },
}
