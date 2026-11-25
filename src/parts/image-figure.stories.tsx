import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { atTextSize, textSizes, textSpills } from '../controls/text-size.testing'
import { ImageFigure } from './image-figure'

const page = css({ bg: 'surface.pane', p: '24', display: 'flex', flexDirection: 'column', gap: '24', w: 'shell.dialogLg' })
const phone = css({ bg: 'surface.pane', p: '16', display: 'flex', flexDirection: 'column', gap: '16', w: 'shell.popover' })
const swatches = { well: css({ color: 'surface.well' }), muted: css({ color: 'fg.muted' }) }

// A picture as an SVG in a data URL, so a story loads nothing from outside. The app sends PNG, JPEG, GIF or WebP.
const picture = (width: number, height: number) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(width)}" height="${String(height)}" viewBox="0 0 ${String(width)} ${String(height)}"><rect x="1" y="1" width="${String(width - 2)}" height="${String(height - 2)}" rx="8" fill="none" stroke="#5ee1ff"/><text x="20" y="40" fill="#e6ecff" font-size="16">Weekly builds</text></svg>`,
  )
// A URL that does not load: a PNG with broken bytes.
const broken = 'data:image/png;base64,AAAA'

function Swatches() {
  return (
    <div hidden>
      {Object.entries(swatches).map(([name, className]) => (
        <span key={name} data-swatch={name} className={className} />
      ))}
    </div>
  )
}
const swatch = (root: HTMLElement, name: string) => {
  const el = root.querySelector(`[data-swatch="${name}"]`)
  if (el === null) throw new Error(`no swatch ${name}`)
  return getComputedStyle(el).color
}

function Figures({ onStateChange }: { onStateChange?: (state: string) => void }) {
  return (
    <main className={page}>
      <div data-testid="ready">
        <ImageFigure src={picture(320, 180)} alt="Chart of weekly builds" onStateChange={onStateChange} />
      </div>
      <div data-testid="error">
        <ImageFigure src={broken} alt="Missing chart" />
      </div>
      <Swatches />
    </main>
  )
}

const meta = {
  title: 'Data display/Image figure',
  component: Figures,
  args: { onStateChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const ready = canvas.getByTestId('ready')
    // The picture loads, the skeleton goes, and the picture keeps its own size.
    await waitFor(() => expect(args.onStateChange).toHaveBeenCalledWith('ready'))
    await expect(within(ready).queryByRole('status')).toBeNull()
    const img = within(ready).getByRole('img', { name: 'Chart of weekly builds' })
    await expect(img).toBeVisible()
    await expect(Math.round(img.getBoundingClientRect().width)).toBe(320)
    // A button opens the picture in a dialog named by its text alternative; Escape closes it and the focus goes back.
    const open = within(ready).getByRole('button', { name: 'Open the image: Chart of weekly builds' })
    await userEvent.click(open)
    const dialog = await within(document.body).findByRole('dialog', { name: 'Chart of weekly builds' })
    await expect(within(dialog).getByRole('img', { name: 'Chart of weekly builds' })).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(open).toHaveFocus())
    // A picture that does not load: a line with its text alternative on the well, no picture and no button.
    const error = canvas.getByTestId('error')
    const line = await within(error).findByRole('status')
    await expect(line).toHaveTextContent('This image did not load: Missing chart')
    await expect(getComputedStyle(line).color).toBe(swatch(canvasElement, 'muted'))
    await expect(getComputedStyle(line).backgroundColor).toBe(swatch(canvasElement, 'well'))
    await expect(within(error).queryByRole('img')).toBeNull()
    await expect(within(error).queryByRole('button')).toBeNull()
  },
} satisfies Meta<typeof Figures>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

/** A picture wider than the phone column shrinks to the column's width at its own ratio; the page does not scroll. */
export const WidePhone: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={phone}>
      <ImageFigure src={picture(1200, 600)} alt="A wide chart" />
    </main>
  ),
  play: async ({ canvasElement }) => {
    const img = await within(canvasElement).findByRole('img', { name: 'A wide chart' })
    const main = canvasElement.querySelector('main')
    if (main === null) throw new Error('no main')
    await waitFor(() => expect(img).toBeVisible())
    const box = img.getBoundingClientRect()
    const inner = main.clientWidth - Number.parseFloat(getComputedStyle(main).paddingLeft) - Number.parseFloat(getComputedStyle(main).paddingRight)
    await expect(Math.round(box.width)).toBe(Math.round(inner))
    await expect(Math.round(box.height)).toBe(Math.round(box.width / 2))
    await expect(main.scrollWidth).toBeLessThanOrEqual(main.clientWidth)
  },
}

function AtSizes() {
  return (
    <main className={phone}>
      <div data-testid="figure">
        <ImageFigure src={broken} alt="The weekly builds chart from the brain's images folder" />
      </div>
    </main>
  )
}
const atSizesPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const figure = within(canvasElement).getByTestId('figure')
  await within(figure).findByRole('status')
  for (const size of textSizes) {
    await atTextSize(size, async () => {
      await expect({ size, spills: textSpills(figure) }).toEqual({ size, spills: [] })
    })
  }
}

/** The line of a picture that did not load at Small, Default and Large in the phone column: no text sticks out. */
export const ImageFigureTextSizesDark: StoryObj<typeof meta> = { render: () => <AtSizes />, globals: { mode: 'dark', textSize: 'small' }, play: atSizesPlay }
export const ImageFigureTextSizesLight: StoryObj<typeof meta> = { render: () => <AtSizes />, globals: { mode: 'light', textSize: 'small' }, play: atSizesPlay }
