import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from './button'
import { Dialog } from './dialog'
import { Stack } from './layout'
import { Tooltip, TruncatedText } from './tooltip'
import { expectCutText } from './tooltip.testing'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '40', textStyle: 'body' })
// A narrow box, so a long text does not fit in it.
const narrow = css({ w: 'shell.popoverSm', p: '8', bg: 'surface.pane', borderWidth: 'default', borderStyle: 'solid', borderColor: 'border.default' })
// A button stretched to the width of its box and clipped (so it can shrink), so its label is cut too.
const column = css({ display: 'flex', flexDirection: 'column' })
const fill = css({ overflow: 'hidden' })
const swatches = {
  overlay: css({ bg: 'surface.overlay' }),
  text: css({ bg: 'fg.default' }),
  border: css({ bg: 'border.default' }),
}

const long = 'skill-eval-round-with-held-out-cases-and-a-trigger-set'
const short = 'writer'

function Swatches() {
  return (
    <div hidden>
      {Object.entries(swatches).map(([name, className]) => (
        <span key={name} data-swatch={name} className={className} />
      ))}
    </div>
  )
}

function OpenTooltip() {
  return (
    <main className={page}>
      <Stack gap="40">
        <span />
        <Tooltip content="Copy the path" open>
          <Button>Copy</Button>
        </Tooltip>
      </Stack>
      <Swatches />
    </main>
  )
}

const tooltipOf = () => within(document.body).queryByRole('tooltip')

const meta = {
  title: 'Overlays/Tooltip',
  component: OpenTooltip,
  play: async ({ canvasElement }) => {
    const swatch = (name: string) => {
      const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
      if (el === null) throw new Error(`no swatch ${name}`)
      return getComputedStyle(el).backgroundColor
    }
    // The tooltip renders in a portal, outside the story's canvas.
    const tip = await within(document.body).findByRole('tooltip')
    await expect(tip).toHaveTextContent('Copy the path')
    const s = getComputedStyle(tip)
    await expect([s.backgroundColor, s.color, s.borderTopColor, s.borderTopWidth, s.borderTopLeftRadius]).toEqual([swatch('overlay'), swatch('text'), swatch('border'), '1px', '8px'])
    await expect([s.paddingTop, s.paddingLeft, s.fontSize]).toEqual(['4px', '8px', '12px'])
    await expect(s.boxShadow).not.toBe('none')
    // It opens 6 px above the button.
    const trigger = within(canvasElement).getByRole('button', { name: 'Copy' })
    await waitFor(() => expect(Math.round(trigger.getBoundingClientRect().top - tip.getBoundingClientRect().bottom)).toBe(6))
    await expect(trigger).toHaveAccessibleDescription('Copy the path')
  },
} satisfies Meta<typeof OpenTooltip>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

/** Hover and keyboard focus open the tooltip; moving away and Escape close it. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <Stack gap="40">
        <span />
        <Tooltip content="Copy the path">
          <Button>Copy</Button>
        </Tooltip>
      </Stack>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Copy' })
    await expect(tooltipOf()).toBeNull()
    await userEvent.hover(trigger)
    await waitFor(() => expect(tooltipOf()).toHaveTextContent('Copy the path'))
    await userEvent.unhover(trigger)
    await waitFor(() => expect(tooltipOf()).toBeNull())
    await userEvent.tab()
    await expect(trigger).toHaveFocus()
    await waitFor(() => expect(tooltipOf()).toHaveTextContent('Copy the path'))
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(tooltipOf()).toBeNull())
  },
}

function Truncation() {
  return (
    <main className={page}>
      <Stack gap="16">
        <div className={narrow} data-testid="cut">
          <TruncatedText>{long}</TruncatedText>
        </div>
        <div className={narrow} data-testid="fits">
          <TruncatedText>{short}</TruncatedText>
        </div>
        <div className={`${narrow} ${column}`}>
          <Button className={fill}>
            <TruncatedText>{`Open ${long}`}</TruncatedText>
          </Button>
        </div>
      </Stack>
    </main>
  )
}

const text = (canvasElement: HTMLElement, id: string) => {
  const box = within(canvasElement).getByTestId(id)
  const el = box.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error(`no text in ${id}`)
  return el
}

/**
 * TruncatedText: a cut text ends with an ellipsis and shows in full in a
 * tooltip on hover and on keyboard focus. Text that fits gets no tooltip
 * and no tab stop. The element keeps the whole text for assistive
 * technology.
 */
export const TruncatedTextDark: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => <Truncation />,
  play: async ({ canvasElement }) => {
    const cut = text(canvasElement, 'cut')
    const fits = text(canvasElement, 'fits')
    // Both hold the whole text; only the long one is cut, with an ellipsis.
    await expect(cut).toHaveTextContent(long)
    await expect(getComputedStyle(cut).textOverflow).toBe('ellipsis')
    await waitFor(() => expect(cut.scrollWidth).toBeGreaterThan(cut.clientWidth))
    await expect(fits.scrollWidth).toBe(fits.clientWidth)
    // A cut text is a tab stop; text that fits is not.
    await waitFor(() => expect(cut).toHaveAttribute('tabindex', '0'))
    await expect(fits).not.toHaveAttribute('tabindex')

    // Hover on the cut text shows the whole text.
    await userEvent.hover(cut)
    await waitFor(() => expect(tooltipOf()).toHaveTextContent(long))
    await userEvent.unhover(cut)
    await waitFor(() => expect(tooltipOf()).toBeNull())

    // Hover on the text that fits shows nothing, also after the open delay.
    await userEvent.hover(fits)
    await new Promise((resolve) => setTimeout(resolve, 700))
    await expect(tooltipOf()).toBeNull()
    await userEvent.unhover(fits)

    // Keyboard: Tab reaches the cut text and opens the tooltip; Escape closes it.
    await userEvent.tab()
    await expect(cut).toHaveFocus()
    await waitFor(() => expect(tooltipOf()).toHaveTextContent(long))
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(tooltipOf()).toBeNull())

    // The next Tab skips the text that fits and lands on the button, whose cut label opens the tooltip.
    await userEvent.tab()
    const button = within(canvasElement).getByRole('button', { name: `Open ${long}` })
    await expect(button).toHaveFocus()
    await waitFor(() => expect(tooltipOf()).toHaveTextContent(`Open ${long}`))
    // Inside the button the text is no tab stop of its own.
    await expect(button.firstElementChild).not.toHaveAttribute('tabindex')
    await userEvent.tab({ shift: true })
    await waitFor(() => expect(tooltipOf()).toHaveTextContent(long))
    await expect(cut).toHaveFocus()
  },
}
export const TruncatedTextLight: StoryObj<typeof meta> = { ...TruncatedTextDark, globals: { mode: 'light' } }

/** A text that fits until its box gets narrower: it measures itself again and then shows the tooltip. */
export const TruncatedTextResize: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <div data-testid="box">
        <TruncatedText>{long}</TruncatedText>
      </div>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByTestId('box')
    const el = text(canvasElement, 'box')
    await expect(el).not.toHaveAttribute('tabindex')
    await userEvent.hover(el)
    await new Promise((resolve) => setTimeout(resolve, 700))
    await expect(tooltipOf()).toBeNull()
    await userEvent.unhover(el)
    box.className = narrow
    await waitFor(() => expect(el).toHaveAttribute('tabindex', '0'))
    await userEvent.hover(el)
    await waitFor(() => expect(tooltipOf()).toHaveTextContent(long))
    await userEvent.unhover(el)
  },
}

// The box is as wide as the plain text (a hidden copy sets it, plus 2px), so the plain text fits and the text with
// every word marked in semibold does not. The box's size never changes, so no resize tells the text to measure again.
const fitBox = css({ display: 'inline-grid', alignSelf: 'flex-start' })
const fitGhost = css({ gridArea: '1 / 1', visibility: 'hidden', pe: '2', whiteSpace: 'nowrap' })
const fitText = css({ gridArea: '1 / 1', contain: 'inline-size' })
const marked = 'skill-eval-round-with-held-out-cases'

function HighlightToggle() {
  const [query, setQuery] = useState<string | undefined>(undefined)
  return (
    <main className={page}>
      <Stack gap="16">
        <Button
          onClick={() => {
            setQuery(marked)
          }}
        >
          Search
        </Button>
        <div className={fitBox}>
          <span className={fitGhost} aria-hidden="true">
            {marked}
          </span>
          <div className={fitText} data-testid="marked">
            <TruncatedText highlight={query}>{marked}</TruncatedText>
          </div>
        </div>
      </Stack>
    </main>
  )
}

/**
 * A new `highlight` can make the text wider without a change of its box:
 * TruncatedText measures again, so the marked text that no longer fits is
 * cut and shows in full in the tooltip.
 */
export const TruncatedTextHighlight: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => <HighlightToggle />,
  play: async ({ canvasElement }) => {
    const el = text(canvasElement, 'marked')
    // Plain, the text fits: no tab stop.
    await expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth)
    await expect(el).not.toHaveAttribute('tabindex')
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Search' }))
    await waitFor(() => expect(el.querySelector('mark')).not.toBeNull())
    await expect(el.scrollWidth).toBeGreaterThan(el.clientWidth)
    await expectCutText(el, marked)
  },
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * The pointer can move from the cut text onto its tooltip, and the tooltip
 * stays open there (WCAG 1.4.13). This holds for text with its own tab stop
 * and for a cut label inside a button.
 */
export const TruncatedTextHoverable: StoryObj<typeof meta> = {
  render: () => <Truncation />,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: `Open ${long}` })
    for (const [trigger, full] of [
      [text(canvasElement, 'cut'), long],
      [button, `Open ${long}`],
    ] as const) {
      await userEvent.hover(trigger)
      await waitFor(() => expect(tooltipOf()).toHaveTextContent(full))
      const tip = tooltipOf()
      if (tip === null) throw new Error('no tooltip')
      await expect(getComputedStyle(tip).pointerEvents).not.toBe('none')
      // On the tooltip, past the close delay, it is still open.
      await userEvent.hover(tip)
      await wait(500)
      await expect(tooltipOf()).toHaveTextContent(full)
      // Leaving the tooltip closes it.
      await userEvent.unhover(tip)
      await waitFor(() => expect(tooltipOf()).toBeNull())
    }
  },
}

/** Cut text in a dialog is a tab stop: the dialog's own tabindex="-1" box does not count as its focus owner. */
export const TruncatedTextInDialog: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <Dialog title="Rename" open actions={<Button>Done</Button>}>
        <div className={narrow} data-testid="cut">
          <TruncatedText>{long}</TruncatedText>
        </div>
      </Dialog>
    </main>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog', { name: 'Rename' })
    const box = within(dialog).getByTestId('cut')
    const cut = box.firstElementChild
    if (!(cut instanceof HTMLElement)) throw new Error('no text')
    await waitFor(() => expect(cut).toHaveAttribute('tabindex', '0'))
    // Wait for the dialog to move the focus inside, then Shift+Tab from Done lands on the cut text and opens its tooltip.
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
    const done = within(dialog).getByRole('button', { name: 'Done' })
    done.focus()
    await expect(done).toHaveFocus()
    await userEvent.tab({ shift: true })
    await expect(cut).toHaveFocus()
    await waitFor(() => expect(tooltipOf()).toHaveTextContent(long))
    await userEvent.keyboard('{Escape}')
  },
}

/**
 * A label in a button that stops being cut while its tooltip is open, and is
 * cut again after the pointer has left, stays closed: no hover and no focus
 * remain from before.
 */
export const TruncatedTextWidenAndNarrow: StoryObj<typeof meta> = {
  render: () => (
    <main className={page}>
      <div className={`${narrow} ${column}`} data-testid="box">
        <Button className={fill}>
          <TruncatedText>{`Open ${long}`}</TruncatedText>
        </Button>
      </div>
      <p>Outside</p>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const box = canvas.getByTestId('box')
    const button = canvas.getByRole('button', { name: `Open ${long}` })
    const label = button.firstElementChild
    if (!(label instanceof HTMLElement)) throw new Error('no label')
    await userEvent.hover(button)
    await waitFor(() => expect(tooltipOf()).toHaveTextContent(`Open ${long}`))
    // Widen: the label fits, so the tooltip closes.
    box.className = column
    await waitFor(() => expect(label.scrollWidth).toBe(label.clientWidth))
    await waitFor(() => expect(tooltipOf()).toBeNull())
    // Move away, then narrow again: the label is cut, but nothing opens it.
    await userEvent.hover(canvas.getByText('Outside'))
    box.className = `${narrow} ${column}`
    await waitFor(() => expect(label.scrollWidth).toBeGreaterThan(label.clientWidth))
    await wait(600)
    await expect(tooltipOf()).toBeNull()
  },
}
