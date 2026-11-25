import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { expectScrollAreas } from '../controls/scroll-area.testing'
import { atTextSize, textSizes, textSpills } from '../controls/text-size.testing'
import { DiagramFrame } from './diagram-frame'

const page = css({ bg: 'surface.pane', p: '24', display: 'flex', flexDirection: 'column', gap: '24', w: 'shell.dialogLg' })
const phone = css({ bg: 'surface.pane', p: '16', display: 'flex', flexDirection: 'column', gap: '16', w: 'shell.popover' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  well: css({ color: 'surface.well' }),
  border: css({ color: 'border.default' }),
  muted: css({ color: 'fg.muted' }),
  text: css({ color: 'fg.default' }),
  danger: css({ color: 'status.danger.fg' }),
}

const source = ['flowchart LR', '  A[Prompt] --> B{Chat idle?}', '  B -- yes --> C[Send]', '  B -- no --> D[Queue]'].join('\n')

// A picture in place of a drawn diagram: a wide box with two labels, as an SVG
// in a data URL. A story may draw it; the app draws Mermaid's own SVG.
const picture = (width: number) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(width)}" height="120" viewBox="0 0 ${String(width)} 120"><rect x="1" y="1" width="${String(width - 2)}" height="118" rx="8" fill="none" stroke="#5ee1ff"/><text x="20" y="66" fill="#e6ecff" font-size="16">Prompt to Send</text></svg>`,
  )

function Swatches() {
  return (
    <div hidden>
      {Object.entries(swatches).map(([name, className]) => (
        <span key={name} data-swatch={name} className={className} />
      ))}
    </div>
  )
}

function Frames({ onShowSourceChange }: { onShowSourceChange?: (shown: boolean) => void }) {
  return (
    <main className={page}>
      <div data-testid="ready">
        <DiagramFrame label="Mermaid" source={source} onShowSourceChange={onShowSourceChange}>
          <img src={picture(320)} alt="Flowchart: Prompt, then Chat idle?, then Send or Queue" width={320} height={120} />
        </DiagramFrame>
      </div>
      <div data-testid="loading">
        <DiagramFrame label="Mermaid" source={source} state="loading" />
      </div>
      <div data-testid="error">
        <DiagramFrame label="Mermaid" source={'flowchart LR\n  A --> '} state="error" error="Parse error on line 2: expected a node" />
      </div>
      <Swatches />
    </main>
  )
}

const swatch = (root: HTMLElement, name: string) => {
  const el = root.querySelector(`[data-swatch="${name}"]`)
  if (el === null) throw new Error(`no swatch ${name}`)
  return getComputedStyle(el).color
}

const meta = {
  title: 'Data display/Diagram frame',
  component: Frames,
  args: { onShowSourceChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const ready = canvas.getByTestId('ready')
    // A figure named by its label, on the well with a 1 px border.
    const figure = within(ready).getByRole('figure', { name: 'Mermaid' })
    const s = getComputedStyle(figure)
    await expect(s.backgroundColor).toBe(swatch(canvasElement, 'well'))
    await expect([s.borderTopWidth, s.borderTopColor, s.borderTopLeftRadius]).toEqual(['1px', swatch(canvasElement, 'border'), '12px'])
    await expect(getComputedStyle(within(ready).getByText('Mermaid')).textTransform).toBe('uppercase')
    await expect(within(ready).getByRole('img', { name: /Flowchart/ })).toBeVisible()
    await expectScrollAreas(canvasElement, 'x', '[data-testid=ready] .diagram-frame__body')
    // Show source swaps the picture for the source, and back.
    const toggle = within(ready).getByRole('button', { name: 'Show source' })
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(toggle)
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(args.onShowSourceChange).toHaveBeenLastCalledWith(true)
    await expect(within(ready).queryByRole('img')).toBeNull()
    const code = ready.querySelector('pre code')
    await expect(code?.textContent).toBe(source)
    await userEvent.click(toggle)
    await expect(args.onShowSourceChange).toHaveBeenLastCalledWith(false)
    await expect(within(ready).getByRole('img', { name: /Flowchart/ })).toBeVisible()
    // Loading: a status that says what loads, and no toggle.
    const loading = canvas.getByTestId('loading')
    await expect(within(loading).getByRole('status')).toHaveTextContent('Loading the Mermaid diagram')
    await expect(within(loading).queryByRole('button')).toBeNull()
    // Error: the reason in red and the source, with no toggle.
    const error = canvas.getByTestId('error')
    const reason = within(error).getByText(/did not draw: Parse error on line 2/)
    await expect(getComputedStyle(reason).color).toBe(swatch(canvasElement, 'danger'))
    await expect(error.querySelector('pre code')?.textContent).toBe('flowchart LR\n  A --> ')
    await expect(within(error).queryByRole('button')).toBeNull()
  },
} satisfies Meta<typeof Frames>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

/** A picture wider than the phone column scrolls sideways in the frame; the page does not. */
export const WidePhone: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={phone}>
      <DiagramFrame label="Mermaid" source={source}>
        <img src={picture(900)} alt="A wide flowchart" width={900} height={120} />
      </DiagramFrame>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const body = canvasElement.querySelector('.diagram-frame__body')
    if (!(body instanceof HTMLElement)) throw new Error('no body')
    await expect(body.scrollWidth).toBeGreaterThan(body.clientWidth)
    const main = canvasElement.querySelector('main')
    if (main === null) throw new Error('no main')
    await expect(main.scrollWidth).toBeLessThanOrEqual(main.clientWidth)
  },
}

function AtSizes() {
  return (
    <main className={phone}>
      <div data-testid="frame">
        <DiagramFrame label="Mermaid sequence diagram" source={source} state="error" error="Parse error on line 2: expected a node after the arrow" />
      </div>
      <div data-testid="frame">
        <DiagramFrame label="Mermaid sequence diagram" source={source}>
          <img src={picture(240)} alt="A flowchart" width={240} height={120} />
        </DiagramFrame>
      </div>
    </main>
  )
}

const atSizesPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const frames = within(canvasElement).getAllByTestId('frame')
  for (const size of textSizes) {
    await atTextSize(size, async () => {
      for (const [i, frame] of frames.entries()) await expect({ size, frame: i, spills: textSpills(frame) }).toEqual({ size, frame: i, spills: [] })
    })
  }
}

/** The header, the reason and the source at Small, Default and Large in the phone column: no text sticks out. */
export const DiagramFrameTextSizesDark: StoryObj<typeof meta> = { render: () => <AtSizes />, globals: { mode: 'dark', textSize: 'small' }, play: atSizesPlay }
export const DiagramFrameTextSizesLight: StoryObj<typeof meta> = { render: () => <AtSizes />, globals: { mode: 'light', textSize: 'small' }, play: atSizesPlay }
