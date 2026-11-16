import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Stack } from '../controls/layout'
import { MoreIcon } from '../foundations/icons'
import { GroupHeader } from './group-header'

const page = css({ bg: 'bg.canvas', p: '24' })
const pane = css({ bg: 'surface.pane', p: '12', borderRadius: 'xl', w: 'shell.listPane' })
const row = css({ px: '12', py: '8', textStyle: 'body', color: 'fg.default' })
// A bare icon button for the actions slot, as the Workbench sidebar draws its more icon (105:637).
// The icon set has no grip, so the story draws one for the leading slot.
const more = css({
  display: 'inline-flex',
  p: '0',
  bg: 'transparent',
  color: 'fg.muted',
  cursor: 'pointer',
  borderRadius: 'xs',
  _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
})
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  muted: css({ bg: 'fg.muted' }),
  subtle: css({ bg: 'fg.subtle' }),
  needsYou: css({ bg: 'status.needsYou.fg' }),
  working: css({ bg: 'status.working.fg' }),
}

function Grip() {
  return (
    <svg viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="4" r="1" />
      <circle cx="9" cy="4" r="1" />
      <circle cx="5" cy="7" r="1" />
      <circle cx="9" cy="7" r="1" />
      <circle cx="5" cy="10" r="1" />
      <circle cx="9" cy="10" r="1" />
    </svg>
  )
}
type Group = { id: string; label: string; rows: string[]; dot?: 'needsYou' | 'working' }
const groups: Group[] = [
  { id: 'needs', label: 'Needs you', rows: ['drift check wants to run git mv', 'Hono RPC client or plain fetch?'], dot: 'needsYou' },
  { id: 'next', label: 'Next steps', rows: ['Write the tickets for increment one'], dot: 'working' },
  { id: 'snoozed', label: 'Snoozed', rows: ['Review the token names'] },
]

function Headers({ onOpenChange = () => undefined, onMenu = () => undefined }: { onOpenChange?: (id: string, open: boolean) => void; onMenu?: () => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ needs: true, next: true, snoozed: false })
  return (
    <main className={page}>
      <Stack gap="16">
        <div className={pane} data-testid="inbox">
          {groups.map((g) => {
            const isOpen = open[g.id] === true
            return (
              <section key={g.id}>
                <GroupHeader
                  label={g.label}
                  count={g.rows.length}
                  dot={g.dot}
                  open={isOpen}
                  contentId={`rows-${g.id}`}
                  onOpenChange={(next) => {
                    setOpen((o) => ({ ...o, [g.id]: next }))
                    onOpenChange(g.id, next)
                  }}
                />
                <div id={`rows-${g.id}`} hidden={!isOpen}>
                  {g.rows.map((r) => (
                    <div key={r} className={row}>
                      {r}
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
        <div className={pane} data-testid="sidebar">
          <GroupHeader
            variant="sidebar"
            label="omni-brain"
            count={3}
            dot="needsYou"
            open
            onOpenChange={(next) => {
              onOpenChange('sidebar', next)
            }}
            leading={<Grip />}
            actions={
              <button type="button" className={more} aria-label="Workspace actions" onClick={onMenu}>
                <MoreIcon size="14" />
              </button>
            }
          />
        </div>
        <div className={pane} data-testid="static">
          <GroupHeader label="Kind" />
        </div>
        <div className={pane} data-testid="empty-slots">
          <GroupHeader variant="sidebar" label="Workspace" leading={false} actions={null} />
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
  title: 'Data display/Group header',
  component: Headers,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const swatch = (name: string) => {
      const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
      if (el === null) throw new Error(`no swatch ${name}`)
      return getComputedStyle(el).backgroundColor
    }
    const one = (root: Element, selector: string) => {
      const el = root.querySelector(selector)
      if (!(el instanceof Element)) throw new Error(`no ${selector}`)
      return el
    }
    const width = (el: Element) => el.getBoundingClientRect().width

    // Inbox list headers: padding 16/4/6/4, eyebrow text in fg.muted, in capitals.
    const needs = canvas.getByRole('button', { name: /needs you/i })
    await expect(needs).toHaveAttribute('aria-expanded', 'true')
    await expect(needs).toHaveAttribute('aria-controls', 'rows-needs')
    await expect(canvas.getByRole('button', { name: /snoozed/i })).toHaveAttribute('aria-expanded', 'false')
    const listRoot = one(canvas.getByTestId('inbox'), '.group-header__root')
    const ls = getComputedStyle(listRoot)
    await expect([ls.paddingTop, ls.paddingRight, ls.paddingBottom, ls.paddingLeft]).toEqual(['16px', '4px', '6px', '4px'])
    const label = getComputedStyle(one(listRoot, '.group-header__label'))
    await expect([label.fontSize, label.letterSpacing, label.textTransform, label.color]).toEqual(['11px', '0.44px', 'uppercase', swatch('muted')])
    await expect(label.fontFamily).toContain('Geist Mono')
    // The count is #4a5675 in Figma (346:193): fg.subtle.
    await expect(getComputedStyle(one(listRoot, '.group-header__count')).color).toBe(swatch('subtle'))
    await expect(width(one(listRoot, '.group-header__chevron'))).toBe(12)
    // The dot: 6 px, in the status colour the caller names.
    const dot = one(listRoot, '.group-header__dot')
    await expect(width(dot)).toBe(6)
    await expect(getComputedStyle(dot).backgroundColor).toBe(swatch('needsYou'))
    const nextDot = one(canvas.getByRole('button', { name: /next steps/i }), '.group-header__dot')
    await expect(getComputedStyle(nextDot).backgroundColor).toBe(swatch('working'))
    await expect(canvas.getByRole('button', { name: /snoozed/i }).querySelector('.group-header__dot')).toBeNull()
    // The items are 6 apart.
    await expect(getComputedStyle(needs).columnGap).toBe('6px')

    // Workbench sidebar header: padding 8/6/6/4, radius 8, a 14 px chevron, the actions at the end.
    const sideRoot = one(canvas.getByTestId('sidebar'), '.group-header__root')
    const ss = getComputedStyle(sideRoot)
    await expect([ss.paddingTop, ss.paddingRight, ss.paddingBottom, ss.paddingLeft, ss.borderTopLeftRadius]).toEqual(['8px', '6px', '6px', '4px', '8px'])
    await expect(width(one(sideRoot, '.group-header__chevron'))).toBe(14)
    await expect(width(one(sideRoot, '.group-header__leading svg'))).toBe(14)
    const actions = one(sideRoot, '.group-header__actions')
    await expect(actions.getBoundingClientRect().right).toBe(sideRoot.getBoundingClientRect().right - 6)

    // A header with no onOpenChange is not a button and has no chevron.
    const staticRoot = canvas.getByTestId('static')
    await expect(within(staticRoot).queryByRole('button')).toBeNull()
    await expect(staticRoot.querySelector('.group-header__chevron')).toBeNull()
    await expect(staticRoot).toHaveTextContent('Kind')
    // Empty leading and actions leave no box, so the name starts at the padding.
    const emptyRoot = one(canvas.getByTestId('empty-slots'), '.group-header__root')
    await expect(emptyRoot.querySelector('.group-header__leading, .group-header__actions')).toBeNull()
    await expect(one(emptyRoot, '.group-header__label').getBoundingClientRect().left - emptyRoot.getBoundingClientRect().left).toBe(4)
  },
} satisfies Meta<typeof Headers>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

/** Pressing a header, by pointer or keyboard, reports the new state, and the caller shows or hides the rows. */
export const Behaviour: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  args: { onOpenChange: fn(), onMenu: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const snoozed = canvas.getByRole('button', { name: /snoozed/i })
    const rows = canvasElement.querySelector('#rows-snoozed')
    if (!(rows instanceof HTMLElement)) throw new Error('no rows')
    await expect(rows).not.toBeVisible()
    const closedPath = snoozed.querySelector('path')?.getAttribute('d')
    await userEvent.click(snoozed)
    await expect(args.onOpenChange).toHaveBeenLastCalledWith('snoozed', true)
    await expect(snoozed).toHaveAttribute('aria-expanded', 'true')
    await expect(rows).toBeVisible()
    // The chevron turns from right to down.
    await expect(snoozed.querySelector('path')?.getAttribute('d')).not.toBe(closedPath)
    // Enter and Space press it too.
    snoozed.focus()
    await userEvent.keyboard('{Enter}')
    await expect(args.onOpenChange).toHaveBeenLastCalledWith('snoozed', false)
    await expect(rows).not.toBeVisible()
    await userEvent.keyboard(' ')
    await expect(args.onOpenChange).toHaveBeenLastCalledWith('snoozed', true)
    await expect(args.onOpenChange).toHaveBeenCalledTimes(3)
    // The actions sit outside the toggle: pressing one does not open or close its group.
    await userEvent.click(canvas.getByRole('button', { name: 'Workspace actions' }))
    await expect(args.onMenu).toHaveBeenCalledOnce()
    await expect(args.onOpenChange).toHaveBeenCalledTimes(3)
    // The sidebar header's own toggle does report through the same spy.
    await userEvent.click(canvas.getByRole('button', { name: /omni-brain/i }))
    await expect(args.onOpenChange).toHaveBeenLastCalledWith('sidebar', false)
  },
}
