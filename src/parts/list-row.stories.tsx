import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
import { Stack } from '../controls/layout'
import { ListRow } from './list-row'
import { StatusPill } from './status-pill'
import { TagsLine } from './meta-line'
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
  // Title 16 + gap 4 + meta 16, padding 10 and a 1 px border on each side. Figma's row is 55 with no border.
  await expect(compact.getBoundingClientRect().height).toBe(58)
  // A default row keeps label and mono.
  const plain = rowOf('A default row')
  await expect(text(plain, 'title')).toEqual(['14px', 20, '500'])
  await expect(text(plain, 'meta')).toEqual(['12px', 16, '400'])
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
}

/** `finished`: the done rows of Inbox D7, with a muted title unless the row is open. */
export const FinishedDark: StoryObj<typeof meta> = { render: () => <Finished />, globals: { mode: 'dark' }, play: finishedPlay }
export const FinishedLight: StoryObj<typeof meta> = { render: () => <Finished />, globals: { mode: 'light' }, play: finishedPlay }
