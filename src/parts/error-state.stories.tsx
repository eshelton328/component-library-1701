import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
import { Stack } from '../controls/layout'
import { CompassIcon, InboxIcon, RefreshIcon } from '../foundations/icons'
import { ErrorState } from './error-state'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24' })
// A page frame: the space a crash screen gets inside the app frame.
const pageFrame = css({ display: 'flex', h: 'shell.dialog', bg: 'bg.canvas', borderWidth: 'default', borderStyle: 'solid', borderColor: 'border.default' })
// A pane frame: a Workbench sidebar whose content failed.
const paneFrame = css({ display: 'flex', w: 'shell.sidebar', h: 'shell.popover', bg: 'surface.pane', borderWidth: 'default', borderStyle: 'solid', borderColor: 'border.default', borderRadius: 'xl' })
// An inline frame: a block inside a pane.
const inlineFrame = css({ w: 'shell.dialogLg', p: '16', bg: 'surface.pane' })

// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  default: css({ color: 'fg.default' }),
  muted: css({ color: 'fg.muted' }),
  danger: css({ color: 'status.danger.fg' }),
  dangerBg: css({ color: 'status.danger.bg' }),
  dangerBorder: css({ color: 'status.danger.border' }),
  idle: css({ color: 'status.idle.fg' }),
  idleBg: css({ color: 'status.idle.bg' }),
  idleBorder: css({ color: 'status.idle.border' }),
  well: css({ color: 'surface.well' }),
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

function first(root: Element, selector: string): HTMLElement {
  const el = root.querySelector(selector)
  if (!(el instanceof HTMLElement)) throw new Error(`no ${selector}`)
  return el
}

function svgIn(root: Element): SVGSVGElement {
  const el = root.querySelector('svg')
  if (!(el instanceof SVGSVGElement)) throw new Error('no svg')
  return el
}

const box = (el: Element) => el.getBoundingClientRect()
const style = (el: Element) => getComputedStyle(el)

const STACK = `TypeError: Cannot read properties of undefined (reading 'tasks')
    at InboxList (http://localhost:5173/src/inbox/list.tsx:42:17)
    at renderWithHooks (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js:5642:22)`

const retry = fn()

function Gallery() {
  return (
    <main className={page}>
      <Stack gap="24">
        <div className={pageFrame} data-testid="page-danger">
          <ErrorState
            title="Something went wrong"
            description="The-bridge hit an error it could not recover from. Try again, or reload the app."
            details={STACK}
            actions={
              <>
                <Button variant="primary" onClick={retry}>
                  <RefreshIcon />
                  Try again
                </Button>
                <Button>Reload app</Button>
              </>
            }
          />
        </div>
        <div className={pageFrame} data-testid="page-neutral">
          <ErrorState tone="neutral" level={2} title="Nothing here yet" description="This workspace has no sessions." actions={<Button>Go to Inbox</Button>} />
        </div>
        <div className={paneFrame} data-testid="pane-danger">
          <ErrorState
            size="pane"
            title="The file tree did not load"
            description="git ls-files exited with code 128 in /Users/erik/ncc-1701/projects/ncc-1701/component-library-1701-worktrees/a-very-long-branch-name-that-does-not-fit"
            actions={<Button size="sm">Try again</Button>}
          />
        </div>
        <div className={paneFrame} data-testid="pane-neutral">
          <ErrorState size="pane" tone="neutral" level={3} title="Session not found" description="It may have been closed in another window." />
        </div>
        <div className={inlineFrame} data-testid="inline-danger">
          <ErrorState
            size="inline"
            title="This chart did not load"
            description="The usage service returned 503."
            details="Error: 503 Service Unavailable"
            actions={
              <Button size="sm" variant="secondary">
                Retry
              </Button>
            }
          />
        </div>
        <div className={inlineFrame} data-testid="inline-neutral">
          <ErrorState size="inline" tone="neutral" title="No preview for this file type" />
        </div>
        <div className={inlineFrame} data-testid="inline-long">
          <ErrorState
            size="inline"
            title="Failed:/Users/erik/ncc-1701/projects/ncc-1701/component-library-1701-worktrees/a-very-long-branch-name/src/parts/a-file.tsx"
            actions={<Button size="sm">Retry</Button>}
          />
        </div>
      </Stack>
      <Swatches />
    </main>
  )
}

const meta = {
  title: 'Status/Error state',
  component: Gallery,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const s = (name: string) => swatch(canvasElement, name)
    const part = (id: string) => first(canvas.getByTestId(id), '.error-state__root')
    retry.mockClear()

    // Page, danger: a real h1 and no live region; the app moves focus to the heading.
    const pageRoot = part('page-danger')
    await expect(pageRoot.getAttribute('role')).toBeNull()
    const h1 = within(pageRoot).getByRole('heading', { level: 1, name: 'Something went wrong' })
    await expect(h1.tabIndex).toBe(-1)
    await expect([style(h1).fontSize, style(h1).fontWeight, style(h1).color]).toEqual(['20px', '600', s('default')])
    const pageDescription = first(pageRoot, '.error-state__description')
    await expect([style(pageDescription).fontSize, style(pageDescription).color]).toEqual(['14px', s('muted')])
    // The tile: 40 px, radius 10, the danger tint and colour, a 24 px icon.
    const pageTile = first(pageRoot, '.error-state__tile')
    await expect([box(pageTile).width, box(pageTile).height, style(pageTile).borderTopLeftRadius]).toEqual([40, 40, '10px'])
    await expect([style(pageTile).backgroundColor, style(pageTile).color]).toEqual([s('dangerBg'), s('danger')])
    await expect(box(svgIn(pageTile)).width).toBe(24)
    await expect(svgIn(pageTile).getAttribute('aria-hidden')).toBe('true')
    // Spacing: 16 between groups, 8 between title and description, buttons 8 apart.
    const pageText = first(pageRoot, '.error-state__text')
    await expect(box(pageText).top - box(pageTile).bottom).toBe(16)
    await expect(box(pageDescription).top - box(h1).bottom).toBe(8)
    const tryAgain = within(pageRoot).getByRole('button', { name: 'Try again' })
    const reload = within(pageRoot).getByRole('button', { name: 'Reload app' })
    await expect(box(tryAgain).top - box(pageText).bottom).toBe(16)
    await expect(box(reload).left - box(tryAgain).right).toBe(8)
    // Centred in its frame, at most shell.dialogLg (540) wide, text centred.
    const pageContent = first(pageRoot, '.error-state__content')
    await expect(style(pageContent).maxWidth).toBe('540px')
    await expect(style(pageContent).textAlign).toBe('center')
    const frame = box(canvas.getByTestId('page-danger'))
    const content = box(pageContent)
    await expect(Math.abs(content.left + content.width / 2 - (frame.left + frame.width / 2))).toBeLessThanOrEqual(1)
    // The content and the details below it, 16 apart, sit in the middle of the frame's height.
    const pageDetails = box(first(pageRoot, '.error-state__details'))
    await expect(pageDetails.top - content.bottom).toBe(16)
    await expect(Math.abs(content.top - frame.top - (frame.bottom - pageDetails.bottom))).toBeLessThanOrEqual(1)
    // The actions report through their own handlers.
    await userEvent.click(tryAgain)
    await expect(retry).toHaveBeenCalledTimes(1)

    // Details start closed; the keyboard opens and closes them.
    const toggle = within(pageRoot).getByRole('button', { name: 'Error details' })
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    const trace = first(pageRoot, 'pre')
    await expect(toggle.getAttribute('aria-controls')).toBe(trace.id)
    await expect(trace).not.toBeVisible()
    toggle.focus()
    await userEvent.keyboard('{Enter}')
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(trace).toBeVisible()
    await expect(trace.textContent).toBe(STACK)
    await expect([style(trace).backgroundColor, style(trace).fontSize, style(trace).paddingTop, style(trace).borderTopLeftRadius]).toEqual([s('well'), '12px', '8px', '6px'])
    await expect(style(trace).fontFamily).toMatch(/Mono/)
    await expect(style(trace).whiteSpace).toBe('pre-wrap')
    await expect(style(trace).textAlign).toBe('start')
    await userEvent.keyboard(' ')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(trace).not.toBeVisible()
    await expect([style(toggle).fontSize, style(toggle).color, box(toggle).height]).toEqual(['12px', s('muted'), 28])

    // Page, neutral: the compass on the idle tint, the heading at the level asked for.
    const neutralRoot = part('page-neutral')
    await expect(within(neutralRoot).getByRole('heading', { level: 2, name: 'Nothing here yet' })).toBeInTheDocument()
    const neutralTile = first(neutralRoot, '.error-state__tile')
    await expect([style(neutralTile).backgroundColor, style(neutralTile).color]).toEqual([s('idleBg'), s('idle')])
    await expect(within(neutralRoot).queryByRole('button', { name: 'Error details' })).toBeNull()

    // Pane, danger: an alert with an h2, compact: a 36 px tile, radius 8, a 20 px icon, 12 between groups.
    const paneRoot = part('pane-danger')
    await expect(paneRoot).toHaveAttribute('role', 'alert')
    const h2 = within(paneRoot).getByRole('heading', { level: 2, name: 'The file tree did not load' })
    await expect([style(h2).fontSize, style(h2).fontWeight]).toEqual(['15px', '600'])
    const paneTile = first(paneRoot, '.error-state__tile')
    await expect([box(paneTile).width, box(paneTile).height, style(paneTile).borderTopLeftRadius]).toEqual([36, 36, '8px'])
    await expect(box(svgIn(paneTile)).width).toBe(20)
    const paneText = first(paneRoot, '.error-state__text')
    await expect(box(paneText).top - box(paneTile).bottom).toBe(12)
    await expect(box(first(paneRoot, '.error-state__description')).top - box(h2).bottom).toBe(4)
    await expect(style(first(paneRoot, '.error-state__content')).maxWidth).toBe('440px')
    // A long path wraps inside the pane; nothing overflows.
    await expect(paneRoot.scrollWidth).toBeLessThanOrEqual(paneRoot.clientWidth)
    await expect(box(first(paneRoot, '.error-state__description')).right).toBeLessThanOrEqual(box(canvas.getByTestId('pane-danger')).right)

    // Pane, neutral: an h3 when asked.
    const paneNeutral = part('pane-neutral')
    await expect(paneNeutral).toHaveAttribute('role', 'alert')
    await expect(within(paneNeutral).getByRole('heading', { level: 3, name: 'Session not found' })).toBeInTheDocument()

    // Inline, danger: an alert with no heading, one row in a danger border, radius 10, padding 8 by 12.
    const inlineRoot = part('inline-danger')
    await expect(inlineRoot).toHaveAttribute('role', 'alert')
    await expect(within(inlineRoot).queryByRole('heading')).toBeNull()
    const inline = style(inlineRoot)
    await expect([inline.borderTopWidth, inline.borderTopColor, inline.borderTopLeftRadius, inline.paddingTop, inline.paddingLeft]).toEqual(['1px', s('dangerBorder'), '10px', '8px', '12px'])
    const inlineTile = first(inlineRoot, '.error-state__tile')
    await expect([style(inlineTile).backgroundColor, style(inlineTile).color]).toEqual(['rgba(0, 0, 0, 0)', s('danger')])
    await expect(box(svgIn(inlineTile)).width).toBe(16)
    const inlineTitle = within(inlineRoot).getByText('This chart did not load')
    await expect([inlineTitle.tagName, style(inlineTitle).fontSize, style(inlineTitle).fontWeight]).toEqual(['P', '14px', '500'])
    const inlineDescription = within(inlineRoot).getByText('The usage service returned 503.')
    await expect([style(inlineDescription).fontSize, style(inlineDescription).color]).toEqual(['12px', s('muted')])
    // Icon, text and action on one row, 8 apart; the action at the end.
    const inlineText = first(inlineRoot, '.error-state__text')
    await expect(box(inlineText).left - box(inlineTile).right).toBe(8)
    const retryInline = within(inlineRoot).getByRole('button', { name: 'Retry' })
    await expect(Math.round(box(inlineRoot).right - box(retryInline).right)).toBe(13)
    const inlineContent = box(first(inlineRoot, '.error-state__content'))
    await expect(Math.abs(box(retryInline).top + box(retryInline).height / 2 - (inlineContent.top + inlineContent.height / 2))).toBeLessThanOrEqual(1)
    // Its details sit under the row, closed.
    await expect(within(inlineRoot).getByRole('button', { name: 'Error details' })).toHaveAttribute('aria-expanded', 'false')

    // Inline, neutral: the idle border and colour, no actions slot.
    const inlineNeutral = part('inline-neutral')
    await expect(style(inlineNeutral).borderTopColor).toBe(s('idleBorder'))
    await expect(style(first(inlineNeutral, '.error-state__tile')).color).toBe(s('idle'))
    await expect(inlineNeutral.querySelector('.error-state__actions')).toBeNull()

    // A long title with no spaces wraps; the row does not overflow.
    const longRoot = part('inline-long')
    await expect(longRoot.scrollWidth).toBeLessThanOrEqual(longRoot.clientWidth)
    await expect(box(first(longRoot, '.error-state__title')).height).toBeGreaterThan(20)
  },
} satisfies Meta<typeof Gallery>
export default meta

type Story = StoryObj<typeof meta>

export const Dark: Story = { globals: { mode: 'dark' } }
export const Light: Story = { globals: { mode: 'light' } }

function NotFound() {
  return (
    <main className={page}>
      <div className={pageFrame}>
        <ErrorState
          tone="neutral"
          icon={<CompassIcon />}
          title="Page not found"
          description="There is no page at /workspaces/archive. It may have moved, or the link is wrong."
          actions={
            <Button variant="primary">
              <InboxIcon />
              Go to Inbox
            </Button>
          }
        />
      </div>
      <Swatches />
    </main>
  )
}

const notFound: Story = {
  render: () => <NotFound />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const s = (name: string) => swatch(canvasElement, name)
    // Not found is the same part in the neutral tone, with the caller's copy and icon.
    const heading = canvas.getByRole('heading', { level: 1, name: 'Page not found' })
    const root = first(canvasElement, '.error-state__root')
    await expect(root.getAttribute('role')).toBeNull()
    const tile = first(root, '.error-state__tile')
    await expect([style(tile).backgroundColor, style(tile).color]).toEqual([s('idleBg'), s('idle')])
    // The caller's icon is sized by the state, not by its own size prop.
    await expect(box(svgIn(tile)).width).toBe(24)
    await expect(canvas.getByRole('button', { name: 'Go to Inbox' })).toBeInTheDocument()
    // The app moves focus to the heading.
    heading.focus()
    await expect(heading).toHaveFocus()
  },
}

export const NotFoundDark: Story = { ...notFound, globals: { mode: 'dark' } }
export const NotFoundLight: Story = { ...notFound, globals: { mode: 'light' } }

function DetailsOpen({ onDetailsOpenChange }: { onDetailsOpenChange?: (open: boolean) => void }) {
  return (
    <main className={page}>
      <div className={paneFrame}>
        <ErrorState
          size="pane"
          level={4}
          title="The terminal crashed"
          description="The pty process exited with signal 9."
          detailsLabel="Stack trace"
          defaultDetailsOpen
          details={STACK}
          onDetailsOpenChange={onDetailsOpenChange}
          actions={<Button size="sm">Restart terminal</Button>}
        />
      </div>
      <Swatches />
    </main>
  )
}

const openChange = fn()

const detailsOpen: Story = {
  render: () => <DetailsOpen onDetailsOpenChange={openChange} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    openChange.mockClear()
    // The pane title is an h4 when asked.
    await expect(canvas.getByRole('heading', { level: 4, name: 'The terminal crashed' })).toBeInTheDocument()
    // defaultDetailsOpen starts the details open, under the caller's label.
    const toggle = canvas.getByRole('button', { name: 'Stack trace' })
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const trace = first(canvasElement, 'pre')
    await expect(trace).toBeVisible()
    // The stack wraps inside the pane; nothing overflows.
    const root = first(canvasElement, '.error-state__root')
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
    await expect(box(trace).right).toBeLessThanOrEqual(box(root).right)
    // Tab reaches the toggle after the action; Enter closes the details and reports it.
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Restart terminal' })).toHaveFocus()
    await userEvent.tab()
    await expect(toggle).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(openChange).toHaveBeenLastCalledWith(false)
    await expect(trace).not.toBeVisible()
  },
}

export const DetailsOpenDark: Story = { ...detailsOpen, globals: { mode: 'dark' } }
export const DetailsOpenLight: Story = { ...detailsOpen, globals: { mode: 'light' } }
