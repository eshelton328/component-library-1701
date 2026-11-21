import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
import { Inline, Stack } from '../controls/layout'
import { ChatIcon, ChevronRightIcon, SparkFilledIcon } from '../foundations/icons'
import { Badge } from './badge'
import { ContextMeter } from './context-meter'
import { KindMark } from './kind-mark'
import { KindTile } from './kind-tile'
import { ListRow } from './list-row'
import { StatusPill } from './status-pill'
import { TagsLine } from './meta-line'
import { Thumbnail } from './thumbnail'
import { expectCutText } from '../controls/tooltip.testing'

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
          {/* Rows with a tags line, which follows the age's colour rule. */}
          <ListRow title="Tagged" meta="ncc-1701" trailing="1d">
            <TagsLine tags={['global/planning']} />
          </ListRow>
          <ListRow title="Tagged and selected" meta="ncc-1701" trailing="1d" selected>
            <TagsLine tags={['global/planning']} />
          </ListRow>
          <ListRow title="Tagged and snoozed" meta="ncc-1701" trailing="1d" snoozed>
            <TagsLine tags={['global/planning']} />
          </ListRow>
          <ListRow title="Tagged and running" meta="ncc-1701" trailing="1d" running>
            <TagsLine tags={['global/planning']} />
          </ListRow>
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
    // The title element, which holds the sidebar row's TruncatedText, marks it.
    await expect(canvas.getByText('Current, no select').closest('.list-row__title')).toHaveAttribute('aria-current', 'true')
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
    // A tags line in a row follows the same rule.
    const tags = (title: string) => colourOf(rowOf(title).querySelector('.tags-line__root'))
    await expect(tags('Tagged')).toBe(subtle)
    await expect([tags('Tagged and selected'), tags('Tagged and snoozed'), tags('Tagged and running')]).toEqual([muted, muted, muted])
    // A sidebar row has 24 px at the start and one line of title with an ellipsis.
    const chat = rowOf(/^Build the list row/)
    await expect(getComputedStyle(chat).paddingLeft).toBe('24px')
    const chatTitle = canvas.getByRole('button', { name: /^Build the list row/ })
    // The TruncatedText in the title button cuts it.
    const chatText = chatTitle.querySelector('.truncated-text')
    if (chatText === null) throw new Error('no truncated text')
    await expect(getComputedStyle(chatText).textOverflow).toBe('ellipsis')
    await expect(chatText.scrollWidth).toBeGreaterThan(chatText.clientWidth)
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

/**
 * A row with onSelect takes the selected fill while it is pressed and drops it when the press ends (screen review
 * R38: on a phone or tablet a tapped row shows the tap and does not stay highlighted). A static row, a press on a
 * button in the row and a selected row show no pressed fill.
 */
function PressedRows() {
  return (
    <main className={page}>
      <div className={inboxList}>
        <Stack gap="2">
          <ListRow title="Tap this row" meta="ncc-1701 · review" leading={<span className={tile} />} trailing="2m" snoozed onSelect={() => undefined}>
            <TagsLine tags={['global/planning']} />
          </ListRow>
          <ListRow title="A static row" meta="ncc-1701 · read only" leading={<span className={tile} />} trailing="5m" />
          <ListRow title="The open row" meta="ncc-1701 · question" leading={<span className={tile} />} trailing="9m" selected onSelect={() => undefined} />
          <ListRow
            title="A row with actions"
            meta="ncc-1701 · approval"
            leading={<span className={tile} />}
            trailing="1h"
            onSelect={() => undefined}
            actions={
              <Button size="sm" variant="primary">
                Approve
              </Button>
            }
          />
          <ListRow title="A card row" meta="ncc-1701 · artifact" surface="card" trailing="3h" onSelect={() => undefined} />
          <ListRow title="A finished row" meta="ncc-1701 · done" leading={<KindTile kind="next" />} trailing="1d" finished onSelect={() => undefined} />
        </Stack>
      </div>
      <span hidden data-swatch="subtle" className={css({ color: 'fg.subtle' })} />
      <span hidden data-swatch="muted" className={css({ color: 'fg.muted' })} />
      <span hidden data-swatch="selected" className={css({ bg: 'surface.selected' })} />
      <span hidden data-swatch="pane" className={css({ bg: 'surface.pane' })} />
    </main>
  )
}

const pressedPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const swatch = (name: string) => {
    const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
    if (el === null) throw new Error(`no swatch ${name}`)
    return getComputedStyle(el)
  }
  const rowOf = (name: string) => {
    const row = canvas.getByText(name).closest('.list-row__root')
    if (!(row instanceof HTMLElement)) throw new Error(`no row ${name}`)
    return row
  }
  const fill = (row: HTMLElement) => getComputedStyle(row).backgroundColor
  const selected = swatch('selected').backgroundColor
  const clear = 'rgba(0, 0, 0, 0)'
  const row = rowOf('Tap this row')
  const title = canvas.getByRole('button', { name: 'Tap this row' })
  const colourOf = (el: Element | null) => {
    if (el === null) throw new Error('no element')
    return getComputedStyle(el).color
  }
  await expect(fill(row)).toBe(clear)
  await expect(getComputedStyle(row).opacity).toBe('0.85')
  // Down: the selected fill, with no selected border; the age and tags turn fg.muted (fg.subtle is not allowed on
  // surface.selected), and the snoozed row is not dimmed, so its text keeps 4.5:1.
  await fireEvent.pointerDown(title, { button: 0, pointerType: 'touch' })
  await expect(fill(row)).toBe(selected)
  await expect(getComputedStyle(row).borderTopColor).toBe(clear)
  await expect(getComputedStyle(row).opacity).toBe('1')
  await expect([colourOf(row.querySelector('.list-row__trailing')), colourOf(row.querySelector('.tags-line__root'))]).toEqual([swatch('muted').color, swatch('muted').color])
  // Up: the fill is gone and the row is as before, so a tap leaves nothing highlighted.
  await fireEvent.pointerUp(title, { button: 0, pointerType: 'touch' })
  await expect(fill(row)).toBe(clear)
  await expect(getComputedStyle(row).opacity).toBe('0.85')
  // A press that becomes a scroll (pointercancel) or leaves the row (React's pointerleave, from pointerout) drops the fill too.
  await fireEvent.pointerDown(title, { button: 0, pointerType: 'touch' })
  await expect(fill(row)).toBe(selected)
  await fireEvent.pointerCancel(title, { pointerType: 'touch' })
  await expect(fill(row)).toBe(clear)
  await fireEvent.pointerDown(title, { button: 0, pointerType: 'mouse' })
  await fireEvent.pointerOut(title, { pointerType: 'mouse', relatedTarget: canvasElement })
  await expect(fill(row)).toBe(clear)
  // A secondary button does not press the row.
  await fireEvent.pointerDown(title, { button: 2, pointerType: 'mouse' })
  await expect(fill(row)).toBe(clear)
  await fireEvent.pointerUp(title, { button: 2, pointerType: 'mouse' })
  // A row without onSelect is not pressable: no fill.
  const staticRow = rowOf('A static row')
  await fireEvent.pointerDown(canvas.getByText('A static row'), { button: 0, pointerType: 'touch' })
  await expect(staticRow).not.toHaveAttribute('data-pressed')
  await expect(fill(staticRow)).toBe(clear)
  await fireEvent.pointerUp(canvas.getByText('A static row'), { button: 0, pointerType: 'touch' })
  // A selected row keeps its own colours while pressed.
  const open = rowOf('The open row')
  const openBefore = [fill(open), getComputedStyle(open).borderTopColor]
  await fireEvent.pointerDown(canvas.getByRole('button', { name: 'The open row' }), { button: 0, pointerType: 'mouse' })
  await expect([fill(open), getComputedStyle(open).borderTopColor]).toEqual(openBefore)
  await fireEvent.pointerUp(canvas.getByRole('button', { name: 'The open row' }), { button: 0, pointerType: 'mouse' })
  // A press on a button in `actions` presses that button, not the row.
  const actionsRow = rowOf('A row with actions')
  const approve = within(actionsRow).getByRole('button', { name: 'Approve' })
  await fireEvent.pointerDown(approve, { button: 0, pointerType: 'touch' })
  await expect(fill(actionsRow)).toBe(clear)
  await fireEvent.pointerUp(approve, { button: 0, pointerType: 'touch' })
  // A card row (surface.pane) takes the same fill while pressed and goes back to surface.pane.
  const card = rowOf('A card row')
  const cardTitle = canvas.getByRole('button', { name: 'A card row' })
  await expect(fill(card)).toBe(swatch('pane').backgroundColor)
  await fireEvent.pointerDown(cardTitle, { button: 0, pointerType: 'touch' })
  await expect(fill(card)).toBe(selected)
  await fireEvent.pointerUp(cardTitle, { button: 0, pointerType: 'touch' })
  await expect(fill(card)).toBe(swatch('pane').backgroundColor)
  // A finished row's kind tile is faded, but whole while pressed: on surface.selected the faded tile is under 3:1.
  const finished = rowOf('A finished row')
  const finishedTile = finished.querySelector('.list-row__leading')
  if (finishedTile === null) throw new Error('no leading')
  const finishedTitle = canvas.getByRole('button', { name: 'A finished row' })
  await expect(getComputedStyle(finishedTile).opacity).toBe('0.75')
  await fireEvent.pointerDown(finishedTitle, { button: 0, pointerType: 'touch' })
  await expect(getComputedStyle(finishedTile).opacity).toBe('1')
  await fireEvent.pointerUp(finishedTitle, { button: 0, pointerType: 'touch' })
  await expect(getComputedStyle(finishedTile).opacity).toBe('0.75')
  // A whole click (down, up, click) leaves no pressed fill.
  await userEvent.click(title)
  await expect(row).not.toHaveAttribute('data-pressed')
  await expect(fill(row)).toBe(clear)
}

export const PressedDark: StoryObj<typeof meta> = { render: () => <PressedRows />, globals: { mode: 'dark' }, play: pressedPlay }
export const PressedLight: StoryObj<typeof meta> = { render: () => <PressedRows />, globals: { mode: 'light' }, play: pressedPlay }

const longMeta = 'opus 5.5 · high effort · 42% of the context window'

/**
 * The sidebar meta is cut to one line and shows in full in a tooltip, on
 * hover and as its own tab stop above the title button's hit area. A click
 * on the cut meta still selects the row.
 */
const onSelectLong = fn()
export const LongMeta: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <div className={sidebar}>
        <ListRow variant="sidebar" title="Figma sync" meta={longMeta} onSelect={onSelectLong} />
      </div>
    </main>
  ),
  play: async ({ canvasElement }) => {
    onSelectLong.mockClear()
    const meta = canvasElement.querySelector('.list-row__meta')
    if (meta === null) throw new Error('no meta')
    await expectCutText(meta, longMeta)
    const text = meta.querySelector('.truncated-text')
    if (!(text instanceof HTMLElement)) throw new Error('no truncated text')
    await userEvent.click(text)
    await expect(onSelectLong).toHaveBeenCalledTimes(1)
  },
}

const accentText = css({ color: 'fg.accent' })
const longChat = 'Run the skill eval round with held-out cases and a trigger set'

function SearchResults() {
  return (
    <main className={page}>
      <div className={inboxList}>
        <ListRow title="Read the skill eval results and pick the next round" highlight="eval" meta="ncc-1701 · f-005" trailing="12m" onSelect={() => { onSelect('result') }} />
      </div>
      <div className={sidebar}>
        <ListRow variant="sidebar" title={longChat} highlight={['eval', 'trigger']} meta="opus · 42%" leading={<span className={dot} />} onSelect={() => { onSelect('chat') }} />
      </div>
      <span hidden data-swatch="accent" className={accentText} />
    </main>
  )
}

/**
 * Search results: `highlight` marks the matches of the query in the title
 * (Inbox D10, Artifacts D4). The title button keeps its whole name, and a
 * cut sidebar title shows the plain title in its tooltip.
 */
const search: StoryObj<typeof meta> = {
  render: () => <SearchResults />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const accent = getComputedStyle(canvasElement.querySelector('[data-swatch="accent"]') ?? canvasElement).color
    const result = canvas.getByRole('button', { name: 'Read the skill eval results and pick the next round' })
    const marks = Array.from(result.querySelectorAll('mark'))
    await expect(marks.map((mark) => mark.textContent)).toEqual(['eval'])
    const mark = marks[0]
    if (mark === undefined) throw new Error('no mark')
    await expect([getComputedStyle(mark).color, getComputedStyle(mark).fontWeight, getComputedStyle(mark).textDecorationLine]).toEqual([accent, '600', 'underline'])
    // The sidebar title is still cut by TruncatedText, with its matches marked.
    const chat = canvas.getByRole('button', { name: longChat })
    await expect(Array.from(chat.querySelectorAll('mark'), (m) => m.textContent)).toEqual(['eval', 'trigger'])
    // Cut, and its tooltip shows the whole plain title, with no marks.
    await expectCutText(chat, longChat, chat)
  },
}
export const SearchDark: StoryObj<typeof meta> = { ...search, globals: { mode: 'dark' } }
export const SearchLight: StoryObj<typeof meta> = { ...search, globals: { mode: 'light' } }

const onNested = fn<(id: string) => void>()

/** A subtask's chat under the chat that started it, and one more step in (Workbench D18 417:1204). */
function Nested() {
  return (
    <main className={page}>
      <div className={sidebar}>
        <Stack gap="4">
          <ListRow variant="sidebar" title="bridge themes" meta="Opus 5.5" leading={<span className={dot} />} selected onSelect={() => { onNested('parent') }} />
          <ListRow variant="sidebar" level={1} title="theme tokens" meta="Opus 5.5" leading={<span className={dot} />} running onSelect={() => { onNested('child') }} />
          <ListRow variant="sidebar" level={2} title="token names" meta="Opus 5.5" leading={<span className={dot} />} onSelect={() => { onNested('grandchild') }} />
        </Stack>
      </div>
      <span hidden data-swatch="muted" className={css({ color: 'fg.muted' })} />
    </main>
  )
}

// The ↳ is fg.muted in `body` (14), 10 before the kind mark; level 2 moves it 24 further in.
const nestedPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  onNested.mockClear()
  const canvas = within(canvasElement)
  const muted = getComputedStyle(canvasElement.querySelector('[data-swatch="muted"]') ?? canvasElement).color
  const rowOf = (name: string) => {
    const row = canvas.getByRole('button', { name }).closest('.list-row__root')
    if (!(row instanceof HTMLElement)) throw new Error(`no row ${name}`)
    return row
  }
  const leftOf = (row: HTMLElement, selector: string) => {
    const el = row.querySelector(selector)
    if (!(el instanceof HTMLElement)) throw new Error(`no ${selector}`)
    return el.getBoundingClientRect().left
  }
  const [parent, child, grandchild] = [rowOf('bridge themes'), rowOf('theme tokens'), rowOf('token names')]
  await expect(parent.querySelector('.list-row__nest')).toBeNull()
  const nest = child.querySelector('.list-row__nest')
  if (!(nest instanceof HTMLElement)) throw new Error('no nest')
  await expect(nest).toHaveAttribute('aria-hidden', 'true')
  await expect([getComputedStyle(nest).color, getComputedStyle(nest).fontSize]).toEqual([muted, '14px'])
  // The ↳ takes the kind mark's place; the kind mark moves in by the ↳ and the 10 gap.
  await expect(leftOf(child, '.list-row__nest')).toBe(leftOf(parent, '.list-row__leading'))
  await expect(leftOf(child, '.list-row__leading') - nest.getBoundingClientRect().right).toBe(10)
  await expect(leftOf(grandchild, '.list-row__nest') - leftOf(child, '.list-row__nest')).toBe(24)
  // The selected and running colours span the whole row width, as at level 0.
  await expect(child.getBoundingClientRect().width).toBe(parent.getBoundingClientRect().width)
  // A nested row selects from a click or the keyboard like any other.
  await userEvent.click(canvas.getByText('theme tokens'))
  await expect(onNested).toHaveBeenCalledWith('child')
  canvas.getByRole('button', { name: 'token names' }).focus()
  await userEvent.keyboard('{Enter}')
  await expect(onNested).toHaveBeenCalledWith('grandchild')
  // The ↳ is not part of the row's name.
  await expect(canvas.getByRole('button', { name: 'theme tokens' })).toBeInTheDocument()
}

export const NestedDark: StoryObj<typeof meta> = { render: () => <Nested />, globals: { mode: 'dark' }, play: nestedPlay }
export const NestedLight: StoryObj<typeof meta> = { render: () => <Nested />, globals: { mode: 'light' }, play: nestedPlay }

const onCompact = fn<(id: string) => void>()

/** Compact rows, as the Inbox list draws them (D1 346:237): a 13 px title and an 11 px mono meta line and age. */
function Compact() {
  return (
    <main className={page}>
      <div className={inboxList}>
        <Stack gap="2">
          <ListRow density="compact" title="Pick the header logo" meta="ncc-1701 · f-005 · NCC-36" leading={<span className={tile} />} trailing="1h" onSelect={() => { onCompact('logo') }} />
          <ListRow density="compact" title="Write the tickets for increment one" meta="ncc-1701 · f-005 · NCC-28" leading={<span className={tile} />} trailing="2h" selected onSelect={() => { onCompact('tickets') }} />
          <ListRow title="A default row" meta="ncc-1701 · f-005" leading={<span className={tile} />} trailing="3h" />
        </Stack>
      </div>
    </main>
  )
}

const compactPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  onCompact.mockClear()
  const canvas = within(canvasElement)
  const rowOf = (name: string) => {
    const row = canvas.getByText(name).closest('.list-row__root')
    if (!(row instanceof HTMLElement)) throw new Error(`no row ${name}`)
    return row
  }
  const text = (row: HTMLElement, slot: string) => {
    const el = row.querySelector(`.list-row__${slot}`)
    if (el === null) throw new Error(`no ${slot}`)
    const style = getComputedStyle(el)
    // The laid-out height of one line, a whole number of pixels.
    return [style.fontSize, el.getBoundingClientRect().height, style.fontWeight]
  }
  const compact = rowOf('Pick the header logo')
  // labelSm for the title, monoSm for the meta and the age.
  await expect(text(compact, 'title')).toEqual(['13px', 16, '500'])
  await expect(text(compact, 'meta')).toEqual(['11px', 16, '400'])
  await expect(text(compact, 'trailing')).toEqual(['11px', 16, '400'])
  // Title 16 + gap 2 + meta 16, padding 10 and a 1 px border on each side: 56, Figma's 55 (346:237) on the 4 px grid (d-100).
  await expect(compact.getBoundingClientRect().height).toBe(56)
  const body = compact.querySelector('.list-row__body')
  if (body === null) throw new Error('no body')
  await expect(getComputedStyle(body).rowGap).toBe('2px')
  // A default row keeps label and mono, its 4 px gap and its height: 1 + 10 + 20 + 4 + 16 + 10 + 1.
  const plain = rowOf('A default row')
  await expect(text(plain, 'title')).toEqual(['14px', 20, '500'])
  await expect(text(plain, 'meta')).toEqual(['12px', 16, '400'])
  await expect(plain.getBoundingClientRect().height).toBe(62)
  // A compact row selects like any other.
  await userEvent.click(canvas.getByText('Pick the header logo'))
  await expect(onCompact).toHaveBeenLastCalledWith('logo')
  await expect(canvas.getByRole('button', { name: 'Write the tickets for increment one' })).toHaveAttribute('aria-current', 'true')
}

export const CompactDark: StoryObj<typeof meta> = { render: () => <Compact />, globals: { mode: 'dark' }, play: compactPlay }
export const CompactLight: StoryObj<typeof meta> = { render: () => <Compact />, globals: { mode: 'light' }, play: compactPlay }

const finishedSwatches = { default: css({ color: 'fg.default' }), muted: css({ color: 'fg.muted' }) }

// The done rows of Inbox D7 (346:2940): a finished row that is not open shows its title in #8a97b8.
function Finished() {
  return (
    <main className={page}>
      <div className={inboxList}>
        <Stack gap="2">
          <ListRow density="compact" title="drift check wants to run git mv" meta="omni-brain · drift check" leading={<span className={tile} />} trailing="11:20" finished onSelect={() => undefined} />
          <ListRow density="compact" title="Write the tickets for increment one" meta="ncc-1701 · f-005 · NCC-28" leading={<span className={tile} />} trailing="10:05" finished selected onSelect={() => undefined} />
          <ListRow density="compact" title="Pick the header logo" meta="ncc-1701 · f-005 · NCC-36" leading={<span className={tile} />} trailing="1h" onSelect={() => undefined} />
        </Stack>
      </div>
      <div hidden>
        {Object.entries(finishedSwatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const finishedPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const colour = (name: string) => getComputedStyle(canvasElement.querySelector(`[data-swatch="${name}"]`) ?? canvasElement).color
  const titleColour = (name: string) => getComputedStyle(canvas.getByRole('button', { name })).color
  // A finished row that is not open has a fg.muted title; an open one keeps fg.default, as an open row does.
  await expect(titleColour('drift check wants to run git mv')).toBe(colour('muted'))
  await expect(titleColour('Write the tickets for increment one')).toBe(colour('default'))
  await expect(titleColour('Pick the header logo')).toBe(colour('default'))
  // The meta line keeps its colour, and the row is not faded as a snoozed row is.
  await expect(getComputedStyle(canvas.getByText('omni-brain · drift check')).color).toBe(colour('muted'))
  const row = canvas.getByRole('button', { name: 'drift check wants to run git mv' }).closest('.list-row__root')
  if (!(row instanceof HTMLElement)) throw new Error('no row')
  await expect(getComputedStyle(row).opacity).toBe('1')
  // The kind tile of a finished row that is not open fades to opacity.finished (0.75; Figma 0.6, 346:2940); an open
  // finished row and an unfinished row keep it whole.
  const leading = (name: string) => {
    const el = canvas.getByRole('button', { name }).closest('.list-row__root')?.querySelector('.list-row__leading')
    if (!(el instanceof HTMLElement)) throw new Error(`no leading in ${name}`)
    return getComputedStyle(el).opacity
  }
  await expect(leading('drift check wants to run git mv')).toBe('0.75')
  await expect(leading('Write the tickets for increment one')).toBe('1')
  await expect(leading('Pick the header logo')).toBe('1')
}

/** `finished`: the done rows of Inbox D7, with a muted title and a faded kind tile unless the row is open. */
export const FinishedDark: StoryObj<typeof meta> = { render: () => <Finished />, globals: { mode: 'dark' }, play: finishedPlay }
export const FinishedLight: StoryObj<typeof meta> = { render: () => <Finished />, globals: { mode: 'light' }, play: finishedPlay }

/**
 * A Workbench sidebar chat (D2 105:705, 105:643): a compact sidebar row with the model and a context meter in its
 * meta and a Needs you pill at the end, in the 308 px row of a 328 px sidebar.
 */
function SidebarMeta() {
  const chatMeta = (model: string, value: number) => (
    <Inline gap="4" align="center">
      <span>{model}</span>
      <ContextMeter value={value} high={value >= 75} />
    </Inline>
  )
  return (
    <main className={page}>
      <div className={sidebar}>
        <Stack gap="4">
          <ListRow variant="sidebar" density="compact" title="hono server" meta={chatMeta('Sonnet 5.5', 78)} leading={<KindMark kind="claude" size="16" />} trailing={<StatusPill tone="needsYou" label="Needs you" dot />} onSelect={() => undefined} />
          <ListRow variant="sidebar" density="compact" level={1} title="theme tokens" meta={chatMeta('Opus 5.5', 26)} leading={<KindMark kind="claude" size="16" />} trailing={<StatusPill tone="running" label="Running" dot />} onSelect={() => undefined} />
          <ListRow variant="sidebar" title="A default sidebar row" meta="Opus 5.5" leading={<KindMark kind="claude" size="16" />} onSelect={() => undefined} />
        </Stack>
      </div>
    </main>
  )
}

const sidebarMetaPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const rowOf = (name: string) => {
    const row = canvas.getByRole('button', { name }).closest('.list-row__root')
    if (!(row instanceof HTMLElement)) throw new Error(`no row ${name}`)
    return row
  }
  const part = (row: HTMLElement, selector: string) => {
    const el = row.querySelector(selector)
    if (!(el instanceof HTMLElement)) throw new Error(`no ${selector}`)
    return el
  }
  const chat = rowOf('hono server')
  await expect(chat.getBoundingClientRect().width).toBe(308)
  // Figma draws the kind mark 22 in (105:706); a compact sidebar row pads 20 inside its 1 px border, so 21.
  await expect(part(chat, '.list-row__leading').getBoundingClientRect().left - chat.getBoundingClientRect().left).toBe(21)
  // The model and the whole meter, "78%" included, fit beside the Needs you pill: nothing in the meta is cut.
  const metaLine = part(chat, '.list-row__meta')
  await expect(metaLine.scrollWidth).toBeLessThanOrEqual(metaLine.clientWidth)
  await expect(part(chat, '.context-meter__value').getBoundingClientRect().right).toBeLessThanOrEqual(metaLine.getBoundingClientRect().right)
  await expect(getComputedStyle(metaLine).fontSize).toBe('11px')
  // A nested compact row keeps 24 at the start, so its ↳ sits 25 in, as before (Figma 27, 199:68).
  const nested = rowOf('theme tokens')
  await expect(getComputedStyle(nested).paddingLeft).toBe('24px')
  await expect(part(nested, '.list-row__nest').getBoundingClientRect().left - nested.getBoundingClientRect().left).toBe(25)
  // A sidebar row at the default density keeps 24 at the start.
  await expect(getComputedStyle(rowOf('A default sidebar row')).paddingLeft).toBe('24px')
}

/** `variant="sidebar" density="compact"`: the Workbench sidebar chat, whose model and context meter fit beside its pill. */
export const SidebarMetaDark: StoryObj<typeof meta> = { render: () => <SidebarMeta />, globals: { mode: 'dark' }, play: sidebarMetaPlay }
export const SidebarMetaLight: StoryObj<typeof meta> = { render: () => <SidebarMeta />, globals: { mode: 'light' }, play: sidebarMetaPlay }

const artifactList = css({ bg: 'surface.pane', w: 'shell.listPane', px: '12', py: '12', borderRadius: 'xl' })
const libraryList = css({ bg: 'bg.canvas', w: 'shell.listPane', display: 'grid', gap: '6' })
const phoneList = css({ bg: 'bg.canvas', w: 'shell.listPane', px: '12', display: 'grid', gap: '6' })
// A stand-in for the row's preview, shorter than the title and meta.
const preview = css({ display: 'block', w: 'control.xl', h: 'control.sm', borderRadius: 'sm', bg: 'surface.raised' })
const artifactSwatches = {
  working: css({ color: 'status.working.fg' }),
  pane: css({ color: 'surface.pane' }),
  border: css({ color: 'border.default' }),
}

/**
 * The Artifacts rows: the list beside an open artifact (D2 403:219), the
 * library's list view (D4 403:8216) and the phone's library (M1 406:121).
 */
function ArtifactRows() {
  return (
    <main className={page}>
      <div className={artifactList}>
        <Stack gap="2">
          <ListRow padding="sm" trailingAlign="center" dot="working" dotLabel="New" dotPosition="end" title="Skill eval pass rates" meta="skill-evals" leading={<span className={preview} />} trailing="12m" onSelect={() => undefined} />
          <ListRow padding="sm" trailingAlign="center" title="Inbox task lifecycle" meta="ncc-1701" leading={<span className={preview} />} trailing="2h" selected onSelect={() => undefined} />
          <ListRow title="A default row" meta="ncc-1701" leading={<span className={preview} />} trailing="3h" />
        </Stack>
      </div>
      <div className={libraryList}>
        <ListRow surface="card" padding="lg" trailingAlign="center" dot="working" dotLabel="New" title="Hono server spike" leading={<span className={preview} />} trailing={<Inline gap="16" align="center">40m<Button size="sm">Open</Button></Inline>}>
          <span>A spike of the Hono server</span>
          <span>Codex · ncc-1701</span>
        </ListRow>
        <ListRow surface="card" padding="lg" title="Selected in a card" meta="ncc-1701" leading={<span className={preview} />} trailing="1d" selected />
      </div>
      <div className={phoneList}>
        <ListRow padding="phone" title="Logo options" meta="ncc-1701" leading={<Thumbnail kind="doc" size="md" />} trailing={<Stack gap="4" align="end">5m<Badge label="New" icon={<SparkFilledIcon size="12" />} tone="working" size="xs" /></Stack>} onSelect={() => undefined} />
      </div>
      <div hidden>
        {Object.entries(artifactSwatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const artifactRowsPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const colour = (name: string) => getComputedStyle(canvasElement.querySelector(`[data-swatch="${name}"]`) ?? canvasElement).color
  const rowOf = (name: string) => {
    const row = canvas.getByText(name).closest('.list-row__root')
    if (!(row instanceof HTMLElement)) throw new Error(`no row ${name}`)
    return row
  }
  const part = (row: HTMLElement, slot: string) => {
    const el = row.querySelector(`.list-row__${slot}`)
    if (!(el instanceof HTMLElement)) throw new Error(`no ${slot}`)
    return el
  }
  const box = (el: HTMLElement) => el.getBoundingClientRect()
  const pad = (row: HTMLElement) => {
    const style = getComputedStyle(row)
    return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft]
  }
  // D2: 8 inside the 1 px border, so the title and meta row is 58, Figma's height (403:219).
  const d2 = rowOf('Skill eval pass rates')
  await expect(pad(d2)).toEqual(['8px', '8px', '8px', '8px'])
  await expect(box(d2).height).toBe(58)
  await expect(pad(rowOf('Inbox task lifecycle'))).toEqual(['8px', '8px', '8px', '8px'])
  // The age is centred down the row (403:218).
  const age = box(part(d2, 'trailing'))
  await expect(age.top + age.height / 2).toBe(box(d2).top + box(d2).height / 2)
  // The New dot: 6 px in status.working.fg, named for screen readers, at the end of the title line, 12 before the age (403:213).
  const dot = canvas.getAllByRole('img', { name: 'New' })[0]
  if (!(dot instanceof HTMLElement)) throw new Error('no dot')
  await expect(d2.contains(dot)).toBe(true)
  await expect([box(dot).width, box(dot).height, getComputedStyle(dot).backgroundColor]).toEqual([6, 6, colour('working')])
  await expect(age.left - box(dot).right).toBe(12)
  const d2Title = part(d2, 'title')
  await expect(box(dot).top + 3).toBe(box(d2Title).top + box(d2Title).height / 2)
  // D4: the row is a box on surface.pane in a border.default border, 12 inside it (403:8216), with the age and Open
  // centred down the row and the New dot 8 after the title (403:8233).
  const d4 = rowOf('Hono server spike')
  await expect(pad(d4)).toEqual(['12px', '12px', '12px', '12px'])
  await expect([getComputedStyle(d4).backgroundColor, getComputedStyle(d4).borderTopColor, getComputedStyle(d4).borderTopWidth]).toEqual([colour('pane'), colour('border'), '1px'])
  const d4Dot = within(d4).getByRole('img', { name: 'New' })
  await expect(box(d4Dot).left - box(part(d4, 'title')).right).toBe(8)
  const d4End = box(part(d4, 'trailing'))
  await expect(d4End.top + d4End.height / 2).toBe(box(d4).top + box(d4).height / 2)
  // A selected card row takes the selected colours.
  const selectedCard = rowOf('Selected in a card')
  await expect(getComputedStyle(selectedCard).backgroundColor).not.toBe(colour('pane'))
  await expect(getComputedStyle(selectedCard).borderTopColor).not.toBe(colour('border'))
  // M1 (406:121): the 48 px preview sits 9 down in Figma's 66 px row: the 1 px border and 8 inside it, and 4 at the
  // sides. The age stays on the title line, with the 16 px New badge under it.
  const phone = rowOf('Logo options')
  await expect(pad(phone)).toEqual(['8px', '4px', '8px', '4px'])
  const phonePreview = part(phone, 'leading')
  await expect(box(phonePreview).height).toBe(48)
  await expect(box(phonePreview).top - box(phone).top).toBe(9)
  await expect(box(part(phone, 'trailing')).top).toBe(box(part(phone, 'title')).top)
  await expect(box(phone).height).toBe(66)
  // A default row keeps its 10 px padding, clear border, no fill, no dot, and its age on the title line.
  const plain = rowOf('A default row')
  await expect(pad(plain)).toEqual(['10px', '10px', '10px', '10px'])
  await expect(getComputedStyle(plain).borderTopColor).toBe('rgba(0, 0, 0, 0)')
  await expect(getComputedStyle(plain).backgroundColor).toBe('rgba(0, 0, 0, 0)')
  await expect(plain.querySelector('.list-row__dot')).toBeNull()
  await expect(box(part(plain, 'trailing')).top).toBe(box(part(plain, 'title')).top)
  await expect(box(plain).height).toBe(62)
}

/** `padding`, `surface="card"`, `trailingAlign` and `dot`: the Artifacts rows (D2, D4, M1). */
export const ArtifactRowsDark: StoryObj<typeof meta> = { render: () => <ArtifactRows />, globals: { mode: 'dark' }, play: artifactRowsPlay }
export const ArtifactRowsLight: StoryObj<typeof meta> = { render: () => <ArtifactRows />, globals: { mode: 'light' }, play: artifactRowsPlay }

const rowParts = (canvasElement: HTMLElement, name: string) => {
  const row = within(canvasElement).getByText(name).closest('.list-row__root')
  if (!(row instanceof HTMLElement)) throw new Error(`no row ${name}`)
  const slot = (part: string) => {
    const el = row.querySelector(`.list-row__${part}`)
    if (!(el instanceof HTMLElement)) throw new Error(`no ${part}`)
    return el.getBoundingClientRect()
  }
  return { row: row.getBoundingClientRect(), slot }
}

/**
 * The library's list view row (D4 403:8216): the body 16 after the 128 × 72
 * preview (403:8217 ends at x 237, the title 403:8232 starts at x 253) and
 * centred down the 98 px row (the text frame 403:8230, 62 high, 18 below the
 * row's top). A row without the props keeps the 10 gap and the body at the top.
 */
function ListViewRows() {
  const body = (
    <>
      <span>A spike of the Hono server</span>
      <span>Codex · ncc-1701</span>
    </>
  )
  return (
    <main className={page}>
      <div className={libraryList}>
        <ListRow surface="card" padding="lg" leadingGap="16" bodyAlign="center" trailingAlign="center" title="Hono server spike" leading={<Thumbnail kind="chart" size="lg" />} trailing="40m">
          {body}
        </ListRow>
        <ListRow surface="card" padding="lg" trailingAlign="center" title="Without the list view props" leading={<Thumbnail kind="chart" size="lg" />} trailing="40m">
          {body}
        </ListRow>
      </div>
    </main>
  )
}

const listViewRowsPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const d4 = rowParts(canvasElement, 'Hono server spike')
  const preview = d4.slot('leading')
  const text = d4.slot('body')
  await expect([preview.width, preview.height]).toEqual([128, 72])
  // 1 + 12 + 72 + 12 + 1: Figma's 98 px row.
  await expect(d4.row.height).toBe(98)
  // The body starts 16 after the preview (Figma 237 to 253).
  await expect(text.left - preview.right).toBe(16)
  // The body is centred down the row: for Figma's 62 px text frame that is 18 below the row's top.
  await expect(text.top - d4.row.top).toBe((d4.row.height - text.height) / 2)
  await expect(text.top - d4.row.top).toBeGreaterThan(13)
  // Without the props the body is 10 after the preview and at the top, 13 below the row's top (the border and 12).
  const plain = rowParts(canvasElement, 'Without the list view props')
  await expect(plain.slot('body').left - plain.slot('leading').right).toBe(10)
  await expect(plain.slot('body').top - plain.row.top).toBe(13)
}

/** `leadingGap="16"` and `bodyAlign="center"`: the Artifacts library's list view row (D4). */
export const ListViewRowDark: StoryObj<typeof meta> = { render: () => <ListViewRows />, globals: { mode: 'dark' }, play: listViewRowsPlay }
export const ListViewRowLight: StoryObj<typeof meta> = { render: () => <ListViewRows />, globals: { mode: 'light' }, play: listViewRowsPlay }

/**
 * The phone library's rows (M1 406:121, 406:148): 66 high around the 48 px
 * preview (406:122), which sits 9 below the row's top, the 1 px border and
 * 8 inside it.
 */
function PhoneRows() {
  return (
    <main className={page}>
      <div className={phoneList}>
        <ListRow padding="phone" title="Skill eval pass rates" meta="skill-evals" leading={<Thumbnail kind="chart" size="md" />} trailing="5m" onSelect={() => undefined} />
        <ListRow padding="phone" title="Hono server spike" meta="ncc-1701" leading={<Thumbnail kind="doc" size="md" />} trailing="40m" selected onSelect={() => undefined} />
      </div>
    </main>
  )
}

const phoneRowsPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  for (const name of ['Skill eval pass rates', 'Hono server spike']) {
    const phone = rowParts(canvasElement, name)
    const preview = phone.slot('leading')
    await expect([preview.width, preview.height]).toEqual([76, 48])
    // 1 + 8 + 48 + 8 + 1: Figma's 66 px row, with the preview 9 below its top and 4 inside the border at the side.
    await expect(phone.row.height).toBe(66)
    await expect(preview.top - phone.row.top).toBe(9)
    await expect(preview.left - phone.row.left).toBe(5)
  }
}

/** `padding="phoneSides"`: the Inbox phone list's compact rows (M1 346:9052), 4 at the sides and 10 above and below. */
function PhoneSidesRows() {
  return (
    <main className={page}>
      <div className={phoneList}>
        <ListRow density="compact" padding="phoneSides" title="Write the tickets for increment one" meta="ncc-1701 · f-005" leading={<KindTile kind="skill" />} trailing="2h" onSelect={() => undefined} />
        <ListRow density="compact" title="The same row with the default padding" meta="ncc-1701 · f-005" leading={<KindTile kind="skill" />} trailing="2h" onSelect={() => undefined} />
      </div>
    </main>
  )
}

const phoneSidesPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const rowOf = (name: string) => {
    const row = canvas.getByText(name).closest('.list-row__root')
    if (!(row instanceof HTMLElement)) throw new Error(`no row ${name}`)
    return row
  }
  const sides = rowOf('Write the tickets for increment one')
  const plain = rowOf('The same row with the default padding')
  const style = getComputedStyle(sides)
  await expect([style.paddingLeft, style.paddingRight, style.paddingTop, style.paddingBottom]).toEqual(['4px', '4px', '10px', '10px'])
  // The tile is 1 + 4 in from the row's edge, and the row is as high as a default compact row.
  const tile = sides.querySelector('.list-row__leading')
  if (!(tile instanceof HTMLElement)) throw new Error('no leading')
  await expect(tile.getBoundingClientRect().left - sides.getBoundingClientRect().left).toBe(5)
  await expect(sides.getBoundingClientRect().height).toBe(plain.getBoundingClientRect().height)
}

export const PhoneSidesRowDark: StoryObj<typeof meta> = { render: () => <PhoneSidesRows />, globals: { mode: 'dark' }, play: phoneSidesPlay }

/** `padding="phone"`: the phone library's 66 px rows (M1). */
export const PhoneRowDark: StoryObj<typeof meta> = { render: () => <PhoneRows />, globals: { mode: 'dark' }, play: phoneRowsPlay }
export const PhoneRowLight: StoryObj<typeof meta> = { render: () => <PhoneRows />, globals: { mode: 'light' }, play: phoneRowsPlay }

/**
 * The phone search match row (M5 408:99): New ends the meta line (408:94)
 * at the body's right edge, level with the meta text, after a flexible
 * gap (the 112 px spacer 408:98). A row without `metaTrailing` keeps its
 * meta as the body's own child, with no meta row.
 */
function MetaTrailingRows() {
  return (
    <main className={page}>
      <div className={phoneList}>
        <ListRow padding="phone" title="Logo options" meta="ncc-1701" metaTrailing={<Badge label="New" icon={<SparkFilledIcon size="12" />} tone="working" size="xs" />} leading={<Thumbnail kind="doc" size="md" />} trailing="5m" onSelect={() => undefined} />
        <ListRow padding="phone" title="Long meta" meta="averyverylongprojectnamewithnospacesandnohyphens" metaTrailing={<Badge label="New" icon={<SparkFilledIcon size="12" />} tone="working" size="xs" />} leading={<Thumbnail kind="doc" size="md" />} trailing="5m" onSelect={() => undefined} />
        <ListRow padding="phone" title="Without a meta part" meta="ncc-1701" leading={<Thumbnail kind="doc" size="md" />} trailing="5m" onSelect={() => undefined} />
      </div>
    </main>
  )
}

const metaTrailingPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const rowOf = (name: string) => {
    const row = canvas.getByText(name).closest('.list-row__root')
    if (!(row instanceof HTMLElement)) throw new Error(`no row ${name}`)
    return row
  }
  const part = (row: HTMLElement, slot: string) => {
    const el = row.querySelector(`.list-row__${slot}`)
    if (!(el instanceof HTMLElement)) throw new Error(`no ${slot}`)
    return el.getBoundingClientRect()
  }
  const match = rowOf('Logo options')
  const badge = within(match).getByText('New').closest('.badge__root')
  if (!(badge instanceof HTMLElement)) throw new Error('no badge')
  await expect(match.querySelector('.list-row__metaTrailing')?.contains(badge)).toBe(true)
  const end = badge.getBoundingClientRect()
  const body = part(match, 'body')
  const metaText = part(match, 'meta')
  // New ends at the body's right edge, after the meta text, and is centred on the meta line (Figma y 240.5 against 240).
  await expect(end.height).toBe(16)
  await expect(end.right).toBe(body.right)
  await expect(end.left).toBeGreaterThan(metaText.left)
  await expect(end.top + end.height / 2).toBe(metaText.top + metaText.height / 2)
  // The part does not grow the row: it is still the 66 px phone row (M1).
  await expect(match.getBoundingClientRect().height).toBe(66)
  // A long word in the meta wraps inside its width, so the meta text never runs under the badge.
  const long = rowOf('Long meta')
  const longMeta = long.querySelector('.list-row__meta')
  const longBadge = long.querySelector('.list-row__metaTrailing')
  if (!(longMeta instanceof HTMLElement) || !(longBadge instanceof HTMLElement)) throw new Error('no long meta row parts')
  const range = document.createRange()
  range.selectNodeContents(longMeta)
  await expect(range.getBoundingClientRect().right).toBeLessThanOrEqual(longBadge.getBoundingClientRect().left)
  await expect(longMeta.scrollWidth).toBeLessThanOrEqual(longMeta.clientWidth)
  // The long word does not widen the rows past the list, and the badge stays inside the body.
  const list = long.parentElement
  if (!(list instanceof HTMLElement)) throw new Error('no list')
  await expect(long.getBoundingClientRect().right).toBeLessThanOrEqual(list.getBoundingClientRect().right)
  await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth)
  await expect(longBadge.getBoundingClientRect().right).toBeLessThanOrEqual(part(long, 'body').right)
  // Without `metaTrailing` the meta is the body's own child, with no meta row, in the same 66 px row.
  const plain = rowOf('Without a meta part')
  await expect(plain.querySelector('.list-row__metaRow')).toBeNull()
  await expect(plain.querySelector('.list-row__meta')?.parentElement).toBe(plain.querySelector('.list-row__body'))
  await expect(plain.getBoundingClientRect().height).toBe(66)
}

/** `metaTrailing`: a New badge that ends the meta line of a phone search match row (M5). */
export const MetaTrailingDark: StoryObj<typeof meta> = { render: () => <MetaTrailingRows />, globals: { mode: 'dark' }, play: metaTrailingPlay }
export const MetaTrailingLight: StoryObj<typeof meta> = { render: () => <MetaTrailingRows />, globals: { mode: 'light' }, play: metaTrailingPlay }

/**
 * The phone search match row (M5 408:76): the age (408:93) ends the title
 * line (408:92) at the body's right edge, and the meta line (408:94) runs
 * on under it, so New (408:99) ends under the age. A row with the default
 * placement keeps the age in its own column after the body.
 */
function TrailingTitleRows() {
  return (
    <main className={page}>
      <div className={phoneList}>
        <ListRow padding="phone" trailingPlacement="title" title="Logo options" meta="ncc-1701" metaTrailing={<Badge label="New" icon={<SparkFilledIcon size="12" />} tone="working" size="xs" />} leading={<Thumbnail kind="doc" size="md" />} trailing="5m" onSelect={onTrailingTitle} />
        <ListRow padding="phone" title="Age in a column" meta="ncc-1701" metaTrailing={<Badge label="New" icon={<SparkFilledIcon size="12" />} tone="working" size="xs" />} leading={<Thumbnail kind="doc" size="md" />} trailing="5m" onSelect={() => undefined} />
      </div>
    </main>
  )
}

const onTrailingTitle = fn()

const trailingTitlePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  onTrailingTitle.mockClear()
  const match = rowParts(canvasElement, 'Logo options')
  const matchRow = within(canvasElement).getByText('Logo options').closest('.list-row__root')
  if (!(matchRow instanceof HTMLElement)) throw new Error('no match row')
  const age = within(matchRow).getByText('5m')
  const badge = within(matchRow).getByText('New').closest('.badge__root')
  if (!(badge instanceof HTMLElement)) throw new Error('no badge')
  const ageBox = age.getBoundingClientRect()
  const body = match.slot('body')
  const title = match.slot('title')
  // The age ends the title line at the body's right edge, centred on the title line (Figma 408:93 at y 218.5, 17 high).
  await expect(age.closest('.list-row__body')).not.toBeNull()
  await expect(ageBox.right).toBe(body.right)
  await expect(ageBox.top + ageBox.height / 2).toBe(title.top + title.height / 2)
  // New ends the meta line under the age (408:99 ends at x 374, as the meta line 408:94).
  await expect(badge.getBoundingClientRect().right).toBe(ageBox.right)
  // The row stays the 66 px phone row (M1).
  await expect(match.row.height).toBe(66)
  // The title button's cover lies over the age, so a click on the age selects the row.
  const hit = document.elementFromPoint(ageBox.left + ageBox.width / 2, ageBox.top + ageBox.height / 2)
  const titleButton = within(matchRow).getByRole('button', { name: 'Logo options' })
  await expect(hit === titleButton).toBe(true)
  // The title button is the row's tab stop, and Enter on it selects the row.
  await userEvent.tab()
  await expect(document.activeElement === titleButton).toBe(true)
  await userEvent.keyboard('{Enter}')
  await expect(onTrailingTitle).toHaveBeenCalledTimes(1)
  // With the default placement the age is its own column after the body, and New ends before it.
  const column = rowParts(canvasElement, 'Age in a column')
  const columnRow = within(canvasElement).getByText('Age in a column').closest('.list-row__root')
  if (!(columnRow instanceof HTMLElement)) throw new Error('no column row')
  const trailing = columnRow.querySelector('.list-row__trailing')
  await expect(trailing?.parentElement).toBe(columnRow)
  await expect(column.slot('trailing').left).toBeGreaterThan(column.slot('body').right)
  await expect(columnRow.querySelector('.list-row__titleRow .list-row__trailing')).toBeNull()
  await expect(column.row.height).toBe(66)
}

/** `trailingPlacement="title"`: the age ends the title line and New ends the meta line under it (M5). */
export const TrailingTitleDark: StoryObj<typeof meta> = { render: () => <TrailingTitleRows />, globals: { mode: 'dark' }, play: trailingTitlePlay }
export const TrailingTitleLight: StoryObj<typeof meta> = { render: () => <TrailingTitleRows />, globals: { mode: 'light' }, play: trailingTitlePlay }

/** A row whose Enter marks it read and unread: the select clears the New dot, and selecting again brings it back. */
function DotToggle() {
  const [read, setRead] = useState(false)
  return (
    <main className={page}>
      <div className={artifactList}>
        <ListRow padding="sm" trailingAlign="center" dot={read ? undefined : 'working'} dotLabel="New" dotPosition="end" title="Skill eval pass rates" meta="skill-evals" trailing="12m" onSelect={() => { setRead((value) => !value) }} />
      </div>
    </main>
  )
}

/** The title button keeps the keyboard focus when the dot goes and comes back, so it stays mounted. */
export const DotChangeKeepsFocus: StoryObj<typeof meta> = {
  render: () => <DotToggle />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('img', { name: 'New' })).toBeInTheDocument()
    await userEvent.tab()
    const title = canvas.getByRole('button', { name: 'Skill eval pass rates' })
    await expect(document.activeElement).toBe(title)
    // Enter selects the row, and the caller clears the dot: the same button keeps the focus.
    await userEvent.keyboard('{Enter}')
    await expect(canvas.queryByRole('img', { name: 'New' })).toBeNull()
    await expect(document.activeElement).toBe(title)
    await expect(title.isConnected).toBe(true)
    // Enter again brings the dot back, and the focus stays.
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByRole('img', { name: 'New' })).toBeInTheDocument()
    await expect(document.activeElement).toBe(title)
    await expect(title.isConnected).toBe(true)
  },
}

/**
 * The Toolkit phone row (M1 429:96): the name starts 12 after the 36 px
 * kind tile with `leadingGap="12"`; a row without it keeps the 10 px gap.
 */
function ToolkitPhoneRows() {
  return (
    <main className={page}>
      <div className={phoneList}>
        <ListRow padding="phone" leadingGap="12" trailingAlign="center" title="agents-md" meta="toolkit/skills/agents-md" leading={<KindTile kind="skill" size="lg" />} trailing="→0 ←1" onSelect={() => undefined} />
        <ListRow padding="phone" trailingAlign="center" title="writer" meta="toolkit/agents/writer" leading={<KindTile kind="agent" size="lg" />} trailing="→2 ←0" onSelect={() => undefined} />
      </div>
    </main>
  )
}

const toolkitPhonePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const gapOf = (name: string) => {
    const row = canvas.getByText(name).closest('.list-row__root')
    const leading = row?.querySelector('.list-row__leading')
    const body = row?.querySelector('.list-row__body')
    if (!(row instanceof HTMLElement) || !(leading instanceof HTMLElement) || !(body instanceof HTMLElement)) throw new Error(`no row ${name}`)
    return { gap: body.getBoundingClientRect().left - leading.getBoundingClientRect().right, tile: leading.getBoundingClientRect().width }
  }
  // 12 after the 36 px tile, as Figma's name (M1 429:96).
  await expect(gapOf('agents-md')).toEqual({ gap: 12, tile: 36 })
  // The default keeps the 10 px row gap.
  await expect(gapOf('writer')).toEqual({ gap: 10, tile: 36 })
}

/** `leadingGap="12"`: the Toolkit phone row (M1 429:96). */
export const LeadingGap12Dark: StoryObj<typeof meta> = { render: () => <ToolkitPhoneRows />, globals: { mode: 'dark' }, play: toolkitPhonePlay }
export const LeadingGap12Light: StoryObj<typeof meta> = { render: () => <ToolkitPhoneRows />, globals: { mode: 'light' }, play: toolkitPhonePlay }

/**
 * The Toolkit list beside an open item (D03 427:94, the open row 427:166):
 * `padding="pane"` draws each row 52 high, the 28 px kind tile, the name over
 * the path and the counts centred down it, and the open row keeps the same
 * height with its cyan border. A row without the prop keeps the 62 px Inbox
 * row with its items at the top.
 */
function ToolkitPaneRows() {
  return (
    <main className={page}>
      <div className={libraryList}>
        <ListRow padding="pane" title="agents-md" meta="toolkit/skills/agents-md" leading={<KindTile kind="skill" size="sm" />} trailing="→0 ←1" onSelect={() => undefined} />
        <ListRow padding="pane" title="writer" meta="toolkit/agents/writer" leading={<KindTile kind="agent" size="sm" />} trailing="→2 ←0" selected onSelect={() => undefined} />
        <ListRow title="commits-and-prs" meta="toolkit/skills/commits-and-prs" leading={<KindTile kind="skill" size="sm" />} trailing="→1 ←3" onSelect={() => undefined} />
      </div>
    </main>
  )
}

const toolkitPanePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const centre = (r: DOMRect) => r.top + r.height / 2
  for (const name of ['agents-md', 'writer']) {
    const pane = rowParts(canvasElement, name)
    const tile = pane.slot('leading')
    const title = pane.slot('title')
    const path = pane.slot('meta')
    // 1 + 6 + 20 + 2 + 16 + 6 + 1: Figma's 53 on the 4 px grid, the open row too (Figma 55).
    await expect(pane.row.height).toBe(52)
    await expect([tile.width, tile.height]).toEqual([28, 28])
    // The tile is centred down the row (Figma 12.5 down) and 11 in: the border and 10.
    await expect(tile.top - pane.row.top).toBe(12)
    await expect(tile.left - pane.row.left).toBe(11)
    // The name (label, 20) over the path (mono, 16), 2 apart, the pair centred.
    await expect([title.height, path.height]).toEqual([20, 16])
    await expect(path.top - title.bottom).toBe(2)
    await expect(title.top - pane.row.top).toBe(7)
    // The counts are centred down the row, not on the title line.
    await expect(centre(pane.slot('trailing'))).toBe(centre(pane.row))
  }
  // The text styles keep the row's own: the name in label (14 / 20, medium), the path in mono (12 / 16).
  const px = (value: string) => Math.round(Number.parseFloat(value))
  const titleStyle = getComputedStyle(within(canvasElement).getByRole('button', { name: 'agents-md' }))
  await expect([px(titleStyle.fontSize), px(titleStyle.lineHeight), titleStyle.fontWeight]).toEqual([14, 20, '500'])
  const pathStyle = getComputedStyle(within(canvasElement).getByText('toolkit/skills/agents-md'))
  await expect([px(pathStyle.fontSize), px(pathStyle.lineHeight)]).toEqual([12, 16])
  await expect(pathStyle.fontFamily).toMatch(/mono/i)
  // The plain row has no fill and a clear border; the open row draws the selected fill and border.
  const rowOf = (name: string) => within(canvasElement).getByText(name).closest('.list-row__root')
  const plain = rowOf('agents-md')
  const open = rowOf('writer')
  if (!(plain instanceof HTMLElement) || !(open instanceof HTMLElement)) throw new Error('no rows')
  await expect(getComputedStyle(plain).borderTopColor).toBe('rgba(0, 0, 0, 0)')
  await expect(getComputedStyle(plain).backgroundColor).toBe('rgba(0, 0, 0, 0)')
  await expect(getComputedStyle(open).borderTopWidth).toBe('1px')
  await expect(getComputedStyle(open).borderTopColor).not.toBe('rgba(0, 0, 0, 0)')
  await expect(getComputedStyle(open).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  // Without the prop the row keeps the Inbox look: 1 + 10 + 20 + 4 + 16 + 10 + 1, items at the top.
  const inbox = rowParts(canvasElement, 'commits-and-prs')
  await expect(inbox.row.height).toBe(62)
  await expect(inbox.slot('leading').top - inbox.row.top).toBe(11)
  await expect(inbox.slot('trailing').top - inbox.row.top).toBe(11)
}

/** `padding="pane"`: the Toolkit list beside an open item (D03), 52 px rows. */
export const ToolkitPaneDark: StoryObj<typeof meta> = { render: () => <ToolkitPaneRows />, globals: { mode: 'dark' }, play: toolkitPanePlay }
export const ToolkitPaneLight: StoryObj<typeof meta> = { render: () => <ToolkitPaneRows />, globals: { mode: 'light' }, play: toolkitPanePlay }

// The Activity panel's body, which has no padding: its rows run edge to edge, 8 apart (59 - 51 in Figma).
const activityList = css({ bg: 'surface.pane', w: 'shell.listPane', display: 'grid', gap: '8' })

/**
 * The Toolkit Activity list (D17 474:650; the workflow's rounds, D23, the same
 * row with no icon): `padding="flush"` and `metaStyle="small"` draw each row
 * 52 high with no side padding, the chat icon and the chevron centred down
 * it, and the time and place in the `small` sans style 2 under the title. A
 * row without the props keeps the 62 px Inbox row and its mono meta.
 */
function ActivityRows() {
  return (
    <main className={page}>
      <div className={activityList}>
        <ListRow padding="flush" metaStyle="small" title="Linear workflow setup for NCC team" meta="Nov 13 · 20:44 · omni-brain" leading={<ChatIcon size="16" />} trailing={<ChevronRightIcon size="16" />} onSelect={() => undefined} />
        <ListRow padding="flush" metaStyle="small" title="readme · cross-family x1" meta="Nov 12 · 09:10 · the-bridge" trailing={<ChevronRightIcon size="16" />} onSelect={() => undefined} />
        <ListRow title="Inbox triage" meta="Nov 11 · 18:02 · omni-brain" leading={<ChatIcon size="16" />} trailing={<ChevronRightIcon size="16" />} onSelect={() => undefined} />
      </div>
    </main>
  )
}

const activityPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const centre = (r: DOMRect) => r.top + r.height / 2
  const px = (value: string) => Math.round(Number.parseFloat(value))
  const chat = rowParts(canvasElement, 'Linear workflow setup for NCC team')
  const icon = chat.slot('leading')
  const chevron = chat.slot('trailing')
  const title = chat.slot('title')
  const time = chat.slot('meta')
  // 1 + 6 + 20 + 2 + 16 + 6 + 1: Figma's 51 on the 4 px grid.
  await expect(chat.row.height).toBe(52)
  // The 15 px chat icon and the 14 px chevron draw at 16, centred down the row.
  await expect([icon.width, icon.height, chevron.width, chevron.height]).toEqual([16, 16, 16, 16])
  await expect(centre(icon)).toBe(centre(chat.row))
  await expect(centre(chevron)).toBe(centre(chat.row))
  // No side padding: the icon starts and the chevron ends at the clear border (Figma at the row's edges).
  await expect(icon.left - chat.row.left).toBe(1)
  await expect(chat.row.right - chevron.right).toBe(1)
  // The text 6 under the top inside the border, the meta 2 under the title.
  await expect(title.top - chat.row.top).toBe(7)
  await expect([title.height, time.height]).toEqual([20, 16])
  await expect(time.top - title.bottom).toBe(2)
  // The title in label (14 / 20, medium), the meta in small sans (12 / 16, regular).
  const titleStyle = getComputedStyle(within(canvasElement).getByRole('button', { name: 'Linear workflow setup for NCC team' }))
  await expect([px(titleStyle.fontSize), px(titleStyle.lineHeight), titleStyle.fontWeight]).toEqual([14, 20, '500'])
  const timeStyle = getComputedStyle(within(canvasElement).getByText('Nov 13 · 20:44 · omni-brain'))
  await expect([px(timeStyle.fontSize), px(timeStyle.lineHeight), timeStyle.fontWeight]).toEqual([12, 16, '400'])
  await expect(timeStyle.fontFamily).not.toMatch(/mono/i)
  // A round, the same row with no icon: the same height, the title at the border.
  const round = rowParts(canvasElement, 'readme · cross-family x1')
  await expect(round.row.height).toBe(52)
  await expect(round.slot('body').left - round.row.left).toBe(1)
  await expect(centre(round.slot('trailing'))).toBe(centre(round.row))
  // Without the props the row keeps the Inbox look: 1 + 10 + 20 + 4 + 16 + 10 + 1, items at the top, mono meta.
  const inbox = rowParts(canvasElement, 'Inbox triage')
  await expect(inbox.row.height).toBe(62)
  await expect(inbox.slot('leading').top - inbox.row.top).toBe(11)
  await expect(inbox.slot('leading').left - inbox.row.left).toBe(11)
  await expect(inbox.slot('trailing').top - inbox.row.top).toBe(11)
  await expect(inbox.slot('meta').top - inbox.slot('title').bottom).toBe(4)
  await expect(getComputedStyle(within(canvasElement).getByText('Nov 11 · 18:02 · omni-brain')).fontFamily).toMatch(/mono/i)
}

/** `padding="flush"` with `metaStyle="small"`: the Toolkit Activity list (D17), 52 px rows edge to edge. */
export const ActivityDark: StoryObj<typeof meta> = { render: () => <ActivityRows />, globals: { mode: 'dark' }, play: activityPlay }
export const ActivityLight: StoryObj<typeof meta> = { render: () => <ActivityRows />, globals: { mode: 'light' }, play: activityPlay }
