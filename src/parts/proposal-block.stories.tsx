import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Stack } from '../controls/layout'
import { CheckIcon } from '../foundations/icons'
import { ProposalBlock, ProposalCommand, ProposalDiff, ProposalSection } from './proposal-block'

const page = css({ bg: 'surface.pane', p: '24', w: 'shell.dialogLg' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  inset: css({ color: 'surface.inset' }),
  well: css({ color: 'surface.well' }),
  discuss: css({ color: 'accent.discuss' }),
  updateBorder: css({ color: 'status.running.border' }),
  danger: css({ color: 'status.danger.fg' }),
  dangerBorder: css({ color: 'status.danger.border' }),
  amber: css({ color: 'status.needsYou.fg' }),
  amberBg: css({ color: 'status.needsYou.bg' }),
  amberBorder: css({ color: 'status.needsYou.border' }),
  default: css({ color: 'fg.default' }),
  muted: css({ color: 'fg.muted' }),
  subtle: css({ color: 'fg.subtle' }),
  removedBg: css({ color: 'diff.removed.bg' }),
  removedFg: css({ color: 'diff.removed.fg' }),
  addedBg: css({ color: 'diff.added.bg' }),
  addedFg: css({ color: 'diff.added.fg' }),
}

function Swatches() {
  return (
    <div hidden>
      {Object.entries(swatches).map(([name, className]) => (
        <span key={name} data-swatch={name} className={className} />
      ))}
    </div>
  )
}

function swatch(root: HTMLElement, name: string): string {
  const el = root.querySelector(`[data-swatch="${name}"]`)
  return el === null ? '' : getComputedStyle(el).color
}

function first(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector)
  if (!(el instanceof HTMLElement)) throw new Error(`no ${selector}`)
  return el
}

const noop = () => undefined

function Update({ onApply = noop, onDiscard = noop }: { onApply?: () => void; onDiscard?: () => void }) {
  return (
    <ProposalBlock
      label="Proposed · Update this task"
      actions={[
        { label: 'Apply', variant: 'primary', icon: <CheckIcon size="14" />, onClick: onApply },
        { label: 'Discard', onClick: onDiscard },
        { label: 'Edit first', onClick: noop },
      ]}
    >
      <ProposalDiff
        label="Suggested prompt"
        lines={[
          { change: 'removed', text: 'Link each ticket to its requirement IDs and leave them in Backlog' },
          { change: 'added', text: 'Link each ticket to its requirement IDs and to its Figma frame from pages.md, and leave them in Backlog' },
          { change: 'added', text: 'Before writing, check that each frame exists, and list any that do not.' },
          { change: 'added', text: '  - indented  twice' },
        ]}
      />
    </ProposalBlock>
  )
}

function Blocks() {
  return (
    <main className={page}>
      <Stack gap="24">
        <div data-testid="update">
          <Update />
        </div>
        <div data-testid="remove">
          <ProposalBlock
            tone="remove"
            label="Proposed · Remove this task"
            title="Write the tickets for increment one"
            note="It moves to Done as Removed. You can restore it from there."
            actions={[
              { label: 'Remove…', variant: 'dangerText', onClick: noop },
              { label: 'Keep it', onClick: noop },
            ]}
          >
            <ProposalSection label="Reason">Split into three tasks: the Workbench, Inbox and App frame tickets.</ProposalSection>
          </ProposalBlock>
        </div>
        <div data-testid="approval">
          <ProposalBlock
            tone="approval"
            label="Approval needed"
            title="Codex wants to run a command"
            actions={[
              { label: 'Allow once', variant: 'primary', onClick: noop },
              { label: 'Always allow', onClick: noop },
              { label: 'Deny', variant: 'dangerText', onClick: noop },
            ]}
          >
            <ProposalCommand>git mv notes/research/old.md archive/</ProposalCommand>
            <ProposalSection label="Why">
              <ul>
                <li>old.md has not changed since March.</li>
              </ul>
            </ProposalSection>
          </ProposalBlock>
        </div>
      </Stack>
      <Swatches />
    </main>
  )
}

const meta = {
  title: 'Conversation/Proposal block',
  component: Blocks,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const s = (name: string) => swatch(canvasElement, name)
    const update = canvas.getByTestId('update')
    const remove = canvas.getByTestId('remove')
    const approval = canvas.getByTestId('approval')
    // Each block is a group named by its label, which shows in capitals in eyebrow (Mono 11).
    const group = canvas.getByRole('group', { name: 'Proposed · Update this task' })
    const label = first(update, '.proposal-block__label')
    await expect(getComputedStyle(label).textTransform).toBe('uppercase')
    await expect(getComputedStyle(label).fontSize).toBe('11px')
    await expect(getComputedStyle(label).color).toBe(s('discuss'))
    // Update: surface.inset, a violet 1 px border, radius 12, padding 12, sections 12 apart.
    const root = getComputedStyle(group)
    await expect(root.backgroundColor).toBe(s('inset'))
    await expect([root.borderTopWidth, root.borderTopColor]).toEqual(['1px', s('updateBorder')])
    await expect([root.borderTopLeftRadius, root.paddingTop, root.paddingLeft, root.rowGap]).toEqual(['12px', '12px', '12px', '12px'])
    // The diff: label in fg.subtle, lines 4 apart, radius 6, padding 6 by 8, sign 6 before the text.
    await expect(getComputedStyle(first(update, '.proposal-section__label')).color).toBe(s('subtle'))
    const lines = update.querySelectorAll('li')
    await expect(lines).toHaveLength(4)
    // Spaces and indentation in a line are kept.
    const indented = within(update).getByText((_, el) => el?.tagName === 'INS' && el.textContent === '  - indented  twice')
    await expect(getComputedStyle(indented).whiteSpace).toBe('pre-wrap')
    const [a, b] = [lines[0], lines[1]]
    if (a === undefined || b === undefined) throw new Error('no lines')
    await expect(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom).toBe(4)
    const line = getComputedStyle(a)
    await expect([line.borderTopLeftRadius, line.paddingTop, line.paddingLeft]).toEqual(['6px', '6px', '8px'])
    await expect(line.backgroundColor).toBe(s('removedBg'))
    await expect(getComputedStyle(b).backgroundColor).toBe(s('addedBg'))
    const sign = first(a, '.proposal-section__sign')
    const del = within(a).getByRole('deletion')
    await expect(del.getBoundingClientRect().left - sign.getBoundingClientRect().right).toBe(6)
    await expect(getComputedStyle(sign).color).toBe(s('danger'))
    await expect(getComputedStyle(sign).fontFamily).toMatch(/Mono/)
    await expect(sign).toHaveAttribute('aria-hidden', 'true')
    await expect([getComputedStyle(del).color, getComputedStyle(del).textDecorationLine, getComputedStyle(del).fontSize]).toEqual([s('removedFg'), 'line-through', '12px'])
    const ins = within(b).getByRole('insertion')
    await expect([getComputedStyle(ins).color, getComputedStyle(ins).textDecorationLine]).toEqual([s('addedFg'), 'none'])
    await expect(getComputedStyle(first(b, '.proposal-section__sign')).color).toBe(s('addedFg'))
    // The buttons: 8 apart, 28 px high, Apply primary with its icon.
    const apply = within(update).getByRole('button', { name: 'Apply' })
    const discard = within(update).getByRole('button', { name: 'Discard' })
    await expect(discard.getBoundingClientRect().left - apply.getBoundingClientRect().right).toBe(8)
    await expect(apply.getBoundingClientRect().height).toBe(28)
    await expect(apply.querySelector('svg')).not.toBeNull()
    // Remove: a red border and label, the title struck through in fg.muted, the reason and the note.
    const removeRoot = getComputedStyle(canvas.getByRole('group', { name: 'Proposed · Remove this task' }))
    await expect([removeRoot.backgroundColor, removeRoot.borderTopWidth, removeRoot.borderTopColor]).toEqual([s('inset'), '1px', s('dangerBorder')])
    await expect([removeRoot.borderTopLeftRadius, removeRoot.paddingTop, removeRoot.paddingLeft, removeRoot.rowGap]).toEqual(['12px', '12px', '12px', '12px'])
    await expect(getComputedStyle(first(remove, '.proposal-block__label')).color).toBe(s('danger'))
    const title = getComputedStyle(within(remove).getByText('Write the tickets for increment one'))
    await expect([title.color, title.textDecorationLine, title.fontSize, title.fontWeight]).toEqual([s('muted'), 'line-through', '14px', '500'])
    const reason = within(remove).getByText(/Split into three tasks/)
    await expect([getComputedStyle(reason).color, getComputedStyle(reason).fontSize]).toEqual([s('default'), '12px'])
    const note = within(remove).getByText(/moves to Done/)
    await expect([getComputedStyle(note).color, getComputedStyle(note).fontSize]).toEqual([s('muted'), '12px'])
    // Approval: the amber tint and border, radius 10, gap 8; the command in surface.well, radius 6, padding 8, Mono 12.
    const approvalRoot = getComputedStyle(canvas.getByRole('group', { name: 'Approval needed' }))
    await expect([approvalRoot.backgroundColor, approvalRoot.borderTopColor]).toEqual([s('amberBg'), s('amberBorder')])
    await expect([approvalRoot.borderTopLeftRadius, approvalRoot.paddingTop, approvalRoot.paddingLeft, approvalRoot.rowGap]).toEqual(['10px', '12px', '12px', '8px'])
    // A section label on the amber tint is fg.muted; section text may hold a list, inside the section.
    const why = within(approval).getByText('Why')
    await expect(getComputedStyle(why).color).toBe(s('muted'))
    const list = approval.querySelector('ul')
    // A div, not a p: HTML parsing would move a list out of a p on a server render.
    await expect(list?.closest('.proposal-section__text')?.tagName).toBe('DIV')
    await expect(getComputedStyle(first(approval, '.proposal-block__label')).color).toBe(s('amber'))
    const command = getComputedStyle(first(approval, 'pre'))
    await expect([command.backgroundColor, command.borderTopLeftRadius, command.paddingTop, command.fontSize, command.color]).toEqual([s('well'), '6px', '8px', '12px', s('default')])
    await expect(getComputedStyle(first(approval, 'code')).fontFamily).toBe(command.fontFamily)
  },
} satisfies Meta<typeof Blocks>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onApply = fn()
const onDiscard = fn()

/** Each button calls only its own callback, from a click or the keyboard. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <Update onApply={onApply} onDiscard={onDiscard} />
    </main>
  ),
  play: async ({ canvasElement }) => {
    onApply.mockClear()
    onDiscard.mockClear()
    const canvas = within(canvasElement)
    const apply = canvas.getByRole('button', { name: 'Apply' })
    await expect(apply).toHaveAttribute('type', 'button')
    await userEvent.click(apply)
    await expect(onApply).toHaveBeenCalledTimes(1)
    await expect(onDiscard).not.toHaveBeenCalled()
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Discard' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    await expect(onDiscard).toHaveBeenCalledTimes(2)
    await expect(onApply).toHaveBeenCalledTimes(1)
  },
}
