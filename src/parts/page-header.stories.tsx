import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
import { Stack } from '../controls/layout'
import { ViewSwitch } from '../controls/view-switch'
import { PageHeader } from './page-header'
import { StatusPill } from './status-pill'
import { expectCutText } from '../controls/tooltip.testing'

const page = css({ bg: 'bg.canvas', p: '24' })
const pane = css({ bg: 'surface.pane', p: '12', borderRadius: 'xl', w: 'shell.listPane' })
const phone = css({ w: 'shell.popoverLg' })
const found = css({ textStyle: 'mono', color: 'fg.muted' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  default: css({ color: 'fg.default' }),
  muted: css({ color: 'fg.muted' }),
  subtle: css({ color: 'fg.subtle' }),
}

const views = [
  { value: 'list', label: 'List' },
  { value: 'map', label: 'Map' },
  { value: 'activity', label: 'Activity' },
] as const

function Headers() {
  return (
    <main className={page}>
      <Stack gap="32">
        <div className={pane} data-testid="pane">
          <PageHeader size="pane" level={2} title="Inbox" count={7} countLabel="7 tasks" />
        </div>
        <div data-testid="artifacts">
          <PageHeader title="Artifacts" count={12}>
            <span className={found}>Found 2 new</span>
            <Button>+ Add a link</Button>
          </PageHeader>
        </div>
        <div data-testid="toolkit">
          <PageHeader title="Toolkit" count={46}>
            <StatusPill label="Read-only" />
            <ViewSwitch label="View" items={views} defaultValue="list" />
          </PageHeader>
        </div>
        <div className={phone} data-testid="phone">
          <PageHeader size="phone" title="Skills" count={18}>
            <Button size="lg">Edit</Button>
          </PageHeader>
        </div>
        <div className={phone} data-testid="blank">
          <PageHeader size="phone" title="Runs" count={3} countLabel=" ">
            {false}
            <></>
          </PageHeader>
        </div>
        <div className={phone} data-testid="long">
          <PageHeader size="phone" title="A title far too long to fit on one phone row" />
        </div>
      </Stack>
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const meta = {
  title: 'Navigation/Page header',
  component: Headers,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const swatch = (name: string) => {
      const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
      return el === null ? '' : getComputedStyle(el).color
    }
    const part = (id: string, slot: string) => {
      const el = canvas.getByTestId(id).querySelector(`.page-header__${slot}`)
      if (!(el instanceof HTMLElement)) throw new Error(`no ${slot} in ${id}`)
      return el
    }
    // The title styles: pane 15/20, page 20/28, phone 28/40, all SemiBold in fg.default.
    for (const [id, size, line] of [['pane', 15, 20], ['artifacts', 20, 28], ['phone', 28, 40]] as const) {
      const t = getComputedStyle(part(id, 'title'))
      await expect([t.fontSize, t.fontWeight]).toEqual([`${String(size)}px`, '600'])
      await expect(parseFloat(t.lineHeight)).toBeCloseTo(line, 0)
      await expect(t.color).toBe(swatch('default'))
    }
    // The count: mono 12 in fg.subtle in a pane (Figma #4a5675), body 14 in fg.muted on a page.
    const paneCount = getComputedStyle(part('pane', 'count'))
    await expect(paneCount.fontSize).toBe('12px')
    await expect(paneCount.fontFamily).toMatch(/mono/i)
    const pageCount = getComputedStyle(part('toolkit', 'count'))
    await expect([pageCount.fontSize, pageCount.fontWeight]).toEqual(['14px', '400'])
    await expect(pageCount.fontFamily).not.toMatch(/mono/i)
    await expect(pageCount.color).toBe(swatch('muted'))
    await expect(paneCount.color).toBe(swatch('subtle'))
    // Title, count and actions sit 8 apart; the actions end at the right edge of the row.
    const title = part('toolkit', 'title').getBoundingClientRect()
    const count = part('toolkit', 'count').getBoundingClientRect()
    await expect(count.left - title.right).toBe(8)
    const root = part('toolkit', 'root').getBoundingClientRect()
    const actions = part('toolkit', 'actions')
    await expect(actions.getBoundingClientRect().right).toBe(root.right)
    await expect(getComputedStyle(actions).columnGap).toBe('8px')
    // Headings: level 1 by default, level 2 when set; the count label replaces the bare number.
    await expect(canvas.getByRole('heading', { level: 1, name: 'Toolkit', hidden: false })).toBeInTheDocument()
    await expect(canvas.getByRole('heading', { level: 2, name: 'Inbox' })).toBeInTheDocument()
    await expect(part('pane', 'count')).toHaveAttribute('aria-hidden', 'true')
    await expect(part('pane', 'countLabel')).toHaveTextContent('7 tasks')
    await expect(part('pane', 'countLabel').getBoundingClientRect().width).toBeLessThanOrEqual(1)
    await expect(part('toolkit', 'count')).not.toHaveAttribute('aria-hidden')
    // A blank count label leaves the count readable; actions that render nothing take no room.
    await expect(part('blank', 'count')).not.toHaveAttribute('aria-hidden')
    await expect(canvas.getByTestId('blank').querySelector('.page-header__countLabel')).toBeNull()
    await expect(part('blank', 'actions').getBoundingClientRect().width).toBe(0)
    await expect(getComputedStyle(part('blank', 'actions')).display).toBe('none')
    // No count and no actions render no empty slots; a long title ends in an ellipsis inside the row.
    await expect(canvas.getByTestId('long').querySelector('.page-header__count')).toBeNull()
    await expect(canvas.getByTestId('long').querySelector('.page-header__actions')).toBeNull()
    const long = part('long', 'title')
    // The TruncatedText in the title cuts it.
    const longText = long.querySelector('.truncated-text')
    if (longText === null) throw new Error('no truncated text')
    await expect(getComputedStyle(longText).textOverflow).toBe('ellipsis')
    await expect(long.getBoundingClientRect().right).toBeLessThanOrEqual(canvas.getByTestId('long').getBoundingClientRect().right)
  },
} satisfies Meta<typeof Headers>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onAdd = fn()

function Editable() {
  const [editing, setEditing] = useState(false)
  return (
    <main className={page}>
      <PageHeader title="Toolkit" count={46}>
        {editing ? <StatusPill label="Editing" tone="needsYou" /> : null}
        <Button onClick={onAdd} aria-label="Add" iconOnly>
          +
        </Button>
        <Button variant={editing ? 'primary' : 'secondary'} onClick={() => {
          setEditing((e) => !e)
        }}>
          {editing ? 'Done' : 'Edit'}
        </Button>
      </PageHeader>
    </main>
  )
}

/** The actions are the caller's own controls: the header passes clicks through and keeps no state. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => <Editable />,
  play: async ({ canvasElement }) => {
    onAdd.mockClear()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Add' }))
    await expect(onAdd).toHaveBeenCalledTimes(1)
    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }))
    await expect(canvas.getByRole('button', { name: 'Done' })).toBeInTheDocument()
    await expect(canvas.getByText('Editing')).toBeInTheDocument()
    // Tab order follows the row: the add button, then Done.
    canvas.getByRole('button', { name: 'Done' }).blur()
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Add' })).toHaveFocus()
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Done' })).toHaveFocus()
  },
}

const narrowBox = css({ w: 'shell.popoverSm' })

/** A long title is cut to one line and shows in full in a tooltip, on hover and on keyboard focus. */
export const LongTitle: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <div className={narrowBox}>
        <PageHeader title="skill-eval-round-with-held-out-cases-and-a-trigger-set" count={7} />
      </div>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const title = canvasElement.querySelector('.page-header__title')
    if (title === null) throw new Error('no title')
    await expectCutText(title, 'skill-eval-round-with-held-out-cases-and-a-trigger-set')
    await expect(within(canvasElement).getByRole('heading', { level: 1, name: 'skill-eval-round-with-held-out-cases-and-a-trigger-set' })).toBeInTheDocument()
  },
}
