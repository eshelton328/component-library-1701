import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
import { Grid } from '../controls/layout'
import { Panel } from './panel'
import { expectCutText } from '../controls/tooltip.testing'

const page = css({ bg: 'bg.canvas', p: '24' })
const tall = css({ h: 'shell.dialog', display: 'flex', flexDirection: 'column' })
const row = css({ textStyle: 'body', color: 'fg.default', py: '8', px: '4' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  pane: css({ bg: 'surface.pane' }),
  border: css({ bg: 'border.default' }),
  text: css({ bg: 'fg.default' }),
  muted: css({ bg: 'fg.muted' }),
  subtle: css({ bg: 'fg.subtle' }),
}

const plus = (
  <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M7 2v10M2 7h10" />
  </svg>
)

function Panels() {
  return (
    <main className={page}>
      <Grid columns="3" gap="24">
        <div className={tall}>
          <Panel variant="list" title="Inbox" meta="7">
            <div className={row}>Approve the release plan</div>
            <div className={row}>Answer the token question</div>
          </Panel>
        </div>
        <div className={tall}>
          <Panel variant="sidebar" title="Workspaces" actions={<Button size="sm" iconOnly aria-label="New workspace">{plus}</Button>}>
            <div className={row}>ncc-1701</div>
            <div className={row}>omni</div>
          </Panel>
        </div>
        <Panel title="Linked from 4" meta="2 skills, 2 rules">
          <div className={row}>toolkit/rules/writing.md</div>
          <div className={row}>toolkit/skills/writer</div>
        </Panel>
      </Grid>
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const px = (v: string) => Number.parseFloat(v)

const meta = {
  title: 'Layout/Panel',
  component: Panels,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const swatch = (name: string) => {
      const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
      if (el === null) throw new Error(`no swatch ${name}`)
      return getComputedStyle(el).backgroundColor
    }
    // Each panel is a region named by its title, with an h2 title.
    const list = canvas.getByRole('region', { name: 'Inbox' })
    const sidebar = canvas.getByRole('region', { name: 'Workspaces' })
    const section = canvas.getByRole('region', { name: 'Linked from 4' })
    await expect(within(list).getByRole('heading', { level: 2, name: 'Inbox' })).toBeVisible()
    for (const p of [list, sidebar, section]) {
      const s = getComputedStyle(p)
      // Glass: surface.pane, a 1 px border.default border on four sides and the 12 px glass blur.
      await expect(s.backgroundColor).toBe(swatch('pane'))
      await expect([s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth]).toEqual(['1px', '1px', '1px', '1px'])
      await expect(s.borderTopColor).toBe(swatch('border'))
      await expect(s.backdropFilter).toBe('blur(12px)')
    }
    const pad = (el: HTMLElement) => {
      const s = getComputedStyle(el)
      return [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft]
    }
    // Padding: Inbox 14 × 12 (14 takes 16), Workbench 12 × 10, Toolkit 12 × 16.
    await expect(pad(list)).toEqual(['16px', '12px', '16px', '12px'])
    await expect(pad(sidebar)).toEqual(['12px', '10px', '12px', '10px'])
    await expect(pad(section)).toEqual(['12px', '16px', '12px', '16px'])
    // Only the Toolkit section has the 12 px radius.
    await expect(getComputedStyle(list).borderTopLeftRadius).toBe('0px')
    await expect(getComputedStyle(section).borderTopLeftRadius).toBe('12px')
    const part = (el: HTMLElement, slot: string) => {
      const found = el.querySelector(`.panel__${slot}`)
      if (!(found instanceof HTMLElement)) throw new Error(`no ${slot}`)
      return found
    }
    // The pane headers: 4 px side and 8 px bottom padding, an 8 px gap, a 15 px SemiBold title and a 12 px mono count.
    for (const p of [list, sidebar]) {
      const header = getComputedStyle(part(p, 'header'))
      await expect([header.paddingLeft, header.paddingRight, header.paddingBottom, header.columnGap]).toEqual(['4px', '4px', '8px', '8px'])
      const title = getComputedStyle(part(p, 'title'))
      await expect([title.fontSize, title.fontWeight, title.color]).toEqual(['15px', '600', swatch('text')])
    }
    const count = getComputedStyle(part(list, 'meta'))
    // The list count is #4a5675 in Figma (346:149): fg.subtle.
    await expect([count.fontSize, count.color]).toEqual(['12px', swatch('subtle')])
    await expect(count.fontFamily).toContain('Mono')
    // The section panel is as tall as its content, though its Grid row is 440 px tall.
    await expect(Math.round(section.getBoundingClientRect().height)).toBeLessThan(Math.round(list.getBoundingClientRect().height))
    // The section title is an eyebrow: mono, capitals, fg.muted.
    const eyebrow = getComputedStyle(part(section, 'title'))
    await expect([eyebrow.textTransform, eyebrow.color]).toEqual(['uppercase', swatch('muted')])
    await expect(eyebrow.fontFamily).toContain('Mono')
    // The actions sit at the end of the header.
    const button = within(sidebar).getByRole('button', { name: 'New workspace' })
    await expect(Math.round(sidebar.getBoundingClientRect().right - px(getComputedStyle(sidebar).paddingRight) - 1 - button.getBoundingClientRect().right)).toBe(4)
    // The section header is 8 px above the body.
    await expect(Math.round(part(section, 'body').getBoundingClientRect().top - part(section, 'header').getBoundingClientRect().bottom)).toBe(8)
  },
} satisfies Meta<typeof Panels>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const rows = Array.from({ length: 30 }, (_, i) => `Task ${String(i + 1)}`)

/** A panel with no header is not a named region, and a long body scrolls under a fixed header. */
export const Behaviour: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <Grid columns="3" gap="24">
        <div className={tall} data-testid="tall">
          <Panel variant="list" title="Inbox" meta="30">
            {rows.map((r) => (
              <button key={r} type="button" className={row}>
                {r}
              </button>
            ))}
          </Panel>
        </div>
        <div className={tall} data-testid="short">
          <Panel variant="sidebar" title="Workspaces">
            <div className={row}>ncc-1701</div>
          </Panel>
        </div>
        <div data-testid="bare">
          <Panel>
            <div className={row}>No header</div>
          </Panel>
        </div>
        <div data-testid="empty-slots">
          <Panel meta={null} actions={false}>
            <div className={row}>Slots set to nothing</div>
          </Panel>
        </div>
        <div data-testid="zero">
          <Panel meta={0}>
            <div className={row}>A count of zero</div>
          </Panel>
        </div>
      </Grid>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const bare = canvasElement.querySelector('[data-testid="bare"] section')
    if (!(bare instanceof HTMLElement)) throw new Error('no bare panel')
    await expect(bare).not.toHaveAttribute('aria-labelledby')
    await expect(bare.querySelector('.panel__header')).toBeNull()
    await expect(canvas.queryAllByRole('region')).toHaveLength(2)
    // false and null slots make no header; a count of 0 shows.
    await expect(canvasElement.querySelector('[data-testid="empty-slots"] .panel__header')).toBeNull()
    await expect(canvasElement.querySelector('[data-testid="zero"] .panel__meta')).toHaveTextContent('0')
    // A pane panel with a short body still fills the height of its parent.
    const short = canvasElement.querySelector('[data-testid="short"]')
    if (!(short instanceof HTMLElement)) throw new Error('no short')
    const sidebar = canvas.getByRole('region', { name: 'Workspaces' })
    await expect(Math.round(sidebar.getBoundingClientRect().height)).toBe(Math.round(short.getBoundingClientRect().height))
    // The list panel keeps the height its parent gives it, and its body scrolls.
    const list = canvas.getByRole('region', { name: 'Inbox' })
    const tall = canvasElement.querySelector('[data-testid="tall"]')
    if (!(tall instanceof HTMLElement)) throw new Error('no tall')
    await expect(Math.round(list.getBoundingClientRect().height)).toBe(Math.round(tall.getBoundingClientRect().height))
    const body = list.querySelector('.panel__body')
    if (!(body instanceof HTMLElement)) throw new Error('no body')
    await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
    const header = list.querySelector('.panel__header')
    if (!(header instanceof HTMLElement)) throw new Error('no header')
    const top = header.getBoundingClientRect().top
    body.scrollTop = 200
    await expect(body.scrollTop).toBe(200)
    await expect(header.getBoundingClientRect().top).toBe(top)
  },
}

const narrowBox = css({ w: 'shell.popoverSm' })

/** A long title is cut to one line and shows in full in a tooltip, on hover and on keyboard focus. */
export const LongTitle: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <div className={narrowBox}>
        <Panel variant="list" title="skill-eval-round-with-held-out-cases-and-a-trigger-set" meta="7">
          <p>Rows</p>
        </Panel>
      </div>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const title = canvasElement.querySelector('.panel__title')
    if (title === null) throw new Error('no title')
    await expectCutText(title, 'skill-eval-round-with-held-out-cases-and-a-trigger-set')
    await expect(within(canvasElement).getByRole('region', { name: 'skill-eval-round-with-held-out-cases-and-a-trigger-set' })).toBeInTheDocument()
  },
}

const needsSwatches = {
  needsBorder: css({ color: 'status.needsYou.border' }),
  plainBorder: css({ color: 'border.default' }),
  muted: css({ color: 'fg.muted' }),
}

// The "waiting for this answer" box of Inbox D2 (346:772), beside a default panel.
function Waiting() {
  return (
    <main className={page}>
      <Grid columns="2" gap="24">
        <Panel title="Waiting for this answer" meta="since 2m" tone="needsYou">
          <div className={row}>Which client should the web app use?</div>
          <p className={css({ textStyle: 'small', color: 'fg.muted' })}>Answer below to unblock the task.</p>
        </Panel>
        <Panel title="Context" meta="3 files">
          <div className={row}>web/src/api.ts</div>
        </Panel>
        <Panel variant="list" title="Needs you" meta="2" tone="needsYou">
          <div className={row}>Answer the client question</div>
        </Panel>
      </Grid>
      <div hidden>
        {Object.entries(needsSwatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

// The needs-you tone: the needs-you border and a tint laid over the pane fill. The axe test checks the text contrast.
const needsPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const color = (name: string) => getComputedStyle(canvasElement.querySelector(`[data-swatch="${name}"]`) ?? canvasElement).color
  const waiting = getComputedStyle(canvas.getByRole('region', { name: 'Waiting for this answer' }))
  const plain = getComputedStyle(canvas.getByRole('region', { name: 'Context' }))
  await expect(waiting.borderTopColor).toBe(color('needsBorder'))
  await expect(waiting.backgroundImage).toContain('linear-gradient')
  await expect(waiting.backgroundColor).toBe(plain.backgroundColor)
  await expect(plain.borderTopColor).toBe(color('plainBorder'))
  await expect(plain.backgroundImage).toBe('none')
  // A needs-you list keeps its count readable on the tint: fg.muted, not the list's fg.subtle.
  const list = canvas.getByRole('region', { name: 'Needs you' })
  const count = within(list).getByText('2')
  await expect(getComputedStyle(count).color).toBe(color('muted'))
}

export const NeedsYouDark: StoryObj<typeof meta> = { render: () => <Waiting />, globals: { mode: 'dark' }, play: needsPlay }
export const NeedsYouLight: StoryObj<typeof meta> = { render: () => <Waiting />, globals: { mode: 'light' }, play: needsPlay }

const accentSwatches = {
  accentBorder: css({ color: 'border.selected' }),
  accentFill: css({ bg: 'surface.selected' }),
  muted: css({ color: 'fg.muted' }),
}

// The run card of Inbox D6 (346:2688): a cyan border and the selected fill, as a selected or running row has.
function RunCard() {
  return (
    <main className={page}>
      <Grid columns="2" gap="24">
        <Panel title="Running in quiet-nebula" meta="Working" tone="accent">
          <p className={css({ textStyle: 'mono', color: 'fg.muted' })}>the-bridge · Sonnet 5.5 · Creating 9 issues in NCC…</p>
        </Panel>
        <Panel variant="list" title="Running" meta="1" tone="accent">
          <div className={row}>Write the tickets for increment one</div>
        </Panel>
      </Grid>
      <div hidden>
        {Object.entries(accentSwatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

// The accent tone: border.selected (Figma #5ee1ff at 0.45) on surface.selected (#14263f). The axe test checks the text contrast.
const accentPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const swatch = (name: string) => getComputedStyle(canvasElement.querySelector(`[data-swatch="${name}"]`) ?? canvasElement)
  const card = getComputedStyle(canvas.getByRole('region', { name: 'Running in quiet-nebula' }))
  await expect(card.borderTopColor).toBe(swatch('accentBorder').color)
  await expect(card.backgroundColor).toBe(swatch('accentFill').backgroundColor)
  await expect(card.backgroundImage).toBe('none')
  // An accent list keeps its count readable: fg.subtle is not for surface.selected, so it takes fg.muted.
  const list = canvas.getByRole('region', { name: 'Running' })
  await expect(getComputedStyle(within(list).getByText('1')).color).toBe(swatch('muted').color)
}

/** `tone="accent"`: the Inbox run card (D6, D9–D11), as a section and as a list. */
export const AccentDark: StoryObj<typeof meta> = { render: () => <RunCard />, globals: { mode: 'dark' }, play: accentPlay }
export const AccentLight: StoryObj<typeof meta> = { render: () => <RunCard />, globals: { mode: 'light' }, play: accentPlay }
