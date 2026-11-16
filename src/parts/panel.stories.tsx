import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
import { Grid } from '../controls/layout'
import { Panel } from './panel'

const page = css({ bg: 'bg.canvas', p: '24' })
const tall = css({ h: 'shell.dialog', display: 'flex', flexDirection: 'column' })
const row = css({ textStyle: 'body', color: 'fg.default', py: '8', px: '4' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  pane: css({ bg: 'surface.pane' }),
  border: css({ bg: 'border.default' }),
  text: css({ bg: 'fg.default' }),
  muted: css({ bg: 'fg.muted' }),
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
    // The pane header: 4 px side and 8 px bottom padding, an 8 px gap, a 15 px SemiBold title and a 12 px mono count.
    const header = getComputedStyle(part(list, 'header'))
    await expect([header.paddingLeft, header.paddingBottom, header.columnGap]).toEqual(['4px', '8px', '8px'])
    const title = getComputedStyle(part(list, 'title'))
    await expect([title.fontSize, title.fontWeight, title.color]).toEqual(['15px', '600', swatch('text')])
    const count = getComputedStyle(part(list, 'meta'))
    await expect([count.fontSize, count.color]).toEqual(['12px', swatch('muted')])
    await expect(count.fontFamily).toContain('Mono')
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
