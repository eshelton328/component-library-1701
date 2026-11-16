import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from './button'
import { Stack } from './layout'
import { Tooltip, TruncatedText } from './tooltip'

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
