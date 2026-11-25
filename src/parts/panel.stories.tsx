import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
import { Grid } from '../controls/layout'
import { Panel } from './panel'
import { expectCutText } from '../controls/tooltip.testing'
import { expectScrollAreas, expectWheelScrollsPast } from '../controls/scroll-area.testing'

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
    // A panel body scrolls with no scroll bar. It sits in a page's flow, so it contains no axis.
    await expectScrollAreas(canvasElement, 'none', '.panel__body')
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

const scroller = css({ h: 'shell.dialog', overflowY: 'auto' })

/**
 * A short panel in a page that scrolls: a mouse wheel over its body scrolls the page. Only the story test runner has
 * the real wheel, so the Storybook UI leaves the story out.
 */
export const WheelScrollsPage: StoryObj<typeof meta> = {
  tags: ['!dev'],
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <div className={scroller} data-testid="scroller" tabIndex={0}>
        <Panel title="Linked from 4" meta="2 skills, 2 rules">
          <div className={row}>toolkit/rules/writing.md</div>
          <div className={row}>toolkit/skills/writer</div>
        </Panel>
        {rows.map((r) => (
          <div key={r} className={row}>
            {r}
          </div>
        ))}
      </div>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const body = canvasElement.querySelector('.panel__body')
    const page = canvasElement.querySelector('[data-testid="scroller"]')
    if (!(body instanceof HTMLElement) || !(page instanceof HTMLElement)) throw new Error('no panel body or scroller')
    await expectWheelScrollsPast(body, page)
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
  needsTint: css({ color: 'status.needsYou.faint' }),
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
  // The tint is status.needsYou.faint (Figma's 0.08, 346:772), not the pill tint status.needsYou.bg.
  await expect(waiting.backgroundImage).toBe(`linear-gradient(${color('needsTint')}, ${color('needsTint')})`)
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

const resultSwatches = {
  doneBorder: css({ color: 'status.done.border' }),
  dangerBorder: css({ color: 'status.danger.border' }),
  plainBorder: css({ color: 'border.default' }),
}

// The result card of a finished task (Inbox D7 346:3067, a green border) and the card of a removed task (D21
// 403:4261, a red border), beside a default panel.
function Results() {
  return (
    <main className={page}>
      <Grid columns="3" gap="24">
        <Panel title="Result" meta="done" tone="done">
          <p className={css({ textStyle: 'small', color: 'fg.muted' })}>Created 9 issues in NCC.</p>
        </Panel>
        <Panel title="Removed" meta="just now" tone="danger">
          <p className={css({ textStyle: 'small', color: 'fg.muted' })}>The task and its chat are gone.</p>
        </Panel>
        <Panel title="Plain">
          <div className={row}>web/src/api.ts</div>
        </Panel>
      </Grid>
      <div hidden>
        {Object.entries(resultSwatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

// `done` and `danger` change only the border: status.done.border and status.danger.border, on the default pane fill
// with no tint. The default panel keeps border.default. The axe test checks the text contrast.
const resultPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const color = (name: string) => getComputedStyle(canvasElement.querySelector(`[data-swatch="${name}"]`) ?? canvasElement).color
  const done = getComputedStyle(canvas.getByRole('region', { name: 'Result' }))
  const danger = getComputedStyle(canvas.getByRole('region', { name: 'Removed' }))
  const plain = getComputedStyle(canvas.getByRole('region', { name: 'Plain' }))
  await expect(done.borderTopColor).toBe(color('doneBorder'))
  await expect(done.borderLeftColor).toBe(color('doneBorder'))
  await expect(danger.borderTopColor).toBe(color('dangerBorder'))
  await expect(danger.borderBottomColor).toBe(color('dangerBorder'))
  await expect(plain.borderTopColor).toBe(color('plainBorder'))
  for (const card of [done, danger]) {
    await expect(card.backgroundColor).toBe(plain.backgroundColor)
    await expect(card.backgroundImage).toBe('none')
    await expect(card.borderTopWidth).toBe(plain.borderTopWidth)
  }
}

/** `tone="done"` and `tone="danger"`: the Inbox result card (D7) and removed task card (D21). */
export const ResultDark: StoryObj<typeof meta> = { render: () => <Results />, globals: { mode: 'dark' }, play: resultPlay }
export const ResultLight: StoryObj<typeof meta> = { render: () => <Results />, globals: { mode: 'light' }, play: resultPlay }

// `variant="notice"`: the Inbox waiting card (D2 346:772, M5 346:9897), a one-row card padded 10/12 inside its 1 px
// border, Figma's 55 high with a 34 px row (it was 64 with the section padding).
function Notice() {
  return (
    <main className={page}>
      <Panel variant="notice" tone="needsYou">
        <div className={noticeRow}>hono server is waiting</div>
      </Panel>
    </main>
  )
}

const noticeRow = css({ h: 'control.md', textStyle: 'label' })

const noticePlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const card = canvasElement.querySelector('.panel__root')
  if (!(card instanceof HTMLElement)) throw new Error('no notice card')
  const s = getComputedStyle(card)
  await expect([s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft]).toEqual(['10px', '12px', '10px', '12px'])
  await expect(s.borderTopLeftRadius).toBe('12px')
  // 1 + 10 + 32 + 10 + 1: the card is as tall as its row, not stretched.
  await expect(Math.round(card.getBoundingClientRect().height)).toBe(54)
}

export const NoticeDark: StoryObj<typeof meta> = { render: () => <Notice />, globals: { mode: 'dark' }, play: noticePlay }
export const NoticeLight: StoryObj<typeof meta> = { render: () => <Notice />, globals: { mode: 'light' }, play: noticePlay }

const pageScroller = css({ h: 'shell.dialog', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16' })
const cardWidth = css({ w: 'shell.dialogLg' })
const atEnd = css({ alignSelf: 'flex-end' })

function TouchEdge() {
  return (
    <main className={page}>
      <div className={pageScroller} data-testid="page">
        <div className={cardWidth}>
          <Panel tone="needsYou">
            <div className={row}>Which colour for the QA card?</div>
            <div className={atEnd}>
              <Button variant="primary" size="lg" touch onClick={sendTouch}>
                Send answer
              </Button>
            </div>
          </Panel>
        </div>
        <div className={cardWidth}>
          <Panel variant="notice" title="Waiting">
            <div className={atEnd}>
              <Button size="sm" touch onClick={openTouch}>
                Open
              </Button>
            </div>
          </Panel>
        </div>
        <Panel title="Direct child" meta="30">
          {rows.map((r) => (
            <div key={r} className={row}>
              {r}
            </div>
          ))}
        </Panel>
        <div className={row} data-testid="after">
          After the panel
        </div>
        <div className={cardWidth} data-testid="long">
          <Panel title="Linked from 30">
            {rows.map((r) => (
              <div key={r} className={row}>
                {r}
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </main>
  )
}

const sendTouch = fn()
const openTouch = fn()

const touchPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  // A Button touch at the end corner of a section or notice body keeps its whole touch area (R72): a point 6 px past
  // the button's end and bottom edges, inside its 12 px area but outside the body, hits the button and a tap there
  // presses it. A scrolling body clipped the area at its edge, so that point hit the panel.
  for (const [name, called] of [
    ['Send answer', sendTouch],
    ['Open', openTouch],
  ] as const) {
    called.mockClear()
    const button = canvas.getByRole('button', { name })
    const body = button.closest('.panel__body')
    if (!(body instanceof HTMLElement)) throw new Error(`no body for ${name}`)
    const b = button.getBoundingClientRect()
    const r = body.getBoundingClientRect()
    const at = { x: Math.round(b.right + 6), y: Math.round(b.bottom + 6) }
    await expect([at.x > r.right, at.y > r.bottom]).toEqual([true, true])
    const hit = document.elementFromPoint(at.x, at.y)
    await expect(hit).toBe(button)
    // A tap goes to the element drawn at its point, so a click on that element is the tap.
    if (hit instanceof HTMLElement) hit.click()
    await expect(called).toHaveBeenCalledTimes(1)
    await expect(getComputedStyle(body).overflowY).toBe('visible')
  }
  // A long section grows as tall as its content and its page scrolls; the panel does not scroll or spill out of the
  // page, which keeps its fixed height.
  const page = canvasElement.querySelector('[data-testid="page"]')
  const long = canvasElement.querySelector('[data-testid="long"] section')
  if (!(page instanceof HTMLElement) || !(long instanceof HTMLElement)) throw new Error('no page or long panel')
  const body = long.querySelector('.panel__body')
  if (!(body instanceof HTMLElement)) throw new Error('no long body')
  await expect(body.scrollHeight).toBe(body.clientHeight)
  await expect(long.getBoundingClientRect().height).toBeGreaterThan(page.clientHeight)
  await expect(page.scrollHeight).toBeGreaterThan(page.clientHeight)
  const pageBox = page.getBoundingClientRect()
  page.scrollTop = page.scrollHeight
  await expect(Math.round(long.getBoundingClientRect().bottom)).toBeLessThanOrEqual(Math.round(pageBox.bottom))
  page.scrollTop = 0
  // A section that is a direct child of the page's flex column does not shrink (Codex review of #361): its body does
  // not overflow, and the next item starts under the panel, so no row draws over it.
  const direct = canvas.getByRole('region', { name: 'Direct child' })
  const directBody = direct.querySelector('.panel__body')
  const after = canvasElement.querySelector('[data-testid="after"]')
  if (!(directBody instanceof HTMLElement) || !(after instanceof HTMLElement)) throw new Error('no direct panel or marker')
  await expect(directBody.scrollHeight).toBe(directBody.clientHeight)
  await expect(Math.round(after.getBoundingClientRect().top)).toBeGreaterThanOrEqual(Math.round(directBody.getBoundingClientRect().top + directBody.scrollHeight))
}

/** A section or notice panel with a touch button at its end corner, and a long section in a page that scrolls (R72). */
export const TouchAreaDark: StoryObj<typeof meta> = { render: () => <TouchEdge />, globals: { mode: 'dark' }, play: touchPlay }
export const TouchAreaLight: StoryObj<typeof meta> = { render: () => <TouchEdge />, globals: { mode: 'light' }, play: touchPlay }
