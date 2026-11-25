import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { atTextSize, textSizes, textSpills } from '../controls/text-size.testing'
import { Callout, type CalloutTone } from './callout'
import { MarkdownView } from './markdown-view'

const page = css({ bg: 'surface.pane', display: 'flex', flexDirection: 'column', gap: '24', p: '24', w: 'shell.dialogLg' })
const phone = css({ bg: 'surface.raised', display: 'flex', flexDirection: 'column', gap: '16', p: '16', w: 'shell.popover' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  'note.fg': css({ color: 'callout.note.fg' }),
  'note.border': css({ color: 'callout.note.border' }),
  'tip.fg': css({ color: 'callout.tip.fg' }),
  'tip.border': css({ color: 'callout.tip.border' }),
  'important.fg': css({ color: 'callout.important.fg' }),
  'important.border': css({ color: 'callout.important.border' }),
  'warning.fg': css({ color: 'callout.warning.fg' }),
  'warning.border': css({ color: 'callout.warning.border' }),
  'caution.fg': css({ color: 'callout.caution.fg' }),
  'caution.border': css({ color: 'callout.caution.border' }),
  muted: css({ color: 'fg.muted' }),
}

const tones = [
  ['note', 'Note', 'Useful information that a reader should know, even when they skim.'],
  ['tip', 'Tip', 'Helpful advice for doing things better or more easily.'],
  ['important', 'Important', 'Key information that a reader needs to reach their goal.'],
  ['warning', 'Warning', 'Urgent information that needs immediate attention to avoid problems.'],
  ['caution', 'Caution', 'Advice about risks or the bad outcomes of certain actions.'],
] as const satisfies readonly (readonly [CalloutTone, string, string])[]

function Callouts() {
  return (
    <main className={page}>
      <MarkdownView padding="none">
        <p>Text before the callouts.</p>
        {tones.map(([tone, , text]) => (
          <Callout key={tone} tone={tone}>
            <p>{text}</p>
          </Callout>
        ))}
        <Callout tone="tip" title="Run the check first">
          <p>A custom title replaces the tone's name.</p>
          <ul>
            <li>It holds a list too.</li>
          </ul>
        </Callout>
      </MarkdownView>
      <MarkdownView size="sm" padding="none">
        <Callout tone="warning" size="sm" title="Small warning">
          <p>The small size of the Inbox detail.</p>
        </Callout>
      </MarkdownView>
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const swatch = (root: HTMLElement, name: string) => {
  const el = root.querySelector(`[data-swatch="${name}"]`)
  if (el === null) throw new Error(`no swatch ${name}`)
  return getComputedStyle(el).color
}

const meta = {
  title: 'Data display/Callout',
  component: Callouts,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const [tone, title, text] of tones) {
      // A note named by its title, with the tone's border, title and icon colour.
      const box = canvas.getByRole('note', { name: title })
      const s = getComputedStyle(box)
      await expect({ tone, width: s.borderTopWidth, border: s.borderTopColor }).toEqual({ tone, width: '1px', border: swatch(canvasElement, `${tone}.border`) })
      const heading = within(box).getByText(title)
      await expect({ tone, fg: getComputedStyle(heading).color }).toEqual({ tone, fg: swatch(canvasElement, `${tone}.fg`) })
      const icon = box.querySelector('svg')
      if (icon === null) throw new Error(`no icon in ${tone}`)
      await expect(icon).toHaveAttribute('aria-hidden', 'true')
      await expect(getComputedStyle(icon).color).toBe(swatch(canvasElement, `${tone}.fg`))
      // The body keeps the muted text of the MarkdownView round it.
      await expect(getComputedStyle(within(box).getByText(text)).color).toBe(swatch(canvasElement, 'muted'))
    }
    const custom = canvas.getByRole('note', { name: 'Run the check first' })
    await expect(within(custom).getByRole('list')).toBeVisible()
    // md: the title in label (14), the body in body (14); sm: labelSm (13) and bodySm (13).
    const small = canvas.getByRole('note', { name: 'Small warning' })
    await expect(getComputedStyle(within(small).getByText('Small warning')).fontSize).toBe('13px')
    await expect(getComputedStyle(within(small).getByText('The small size of the Inbox detail.')).fontSize).toBe('13px')
    const note = canvas.getByRole('note', { name: 'Note' })
    await expect(getComputedStyle(within(note).getByText('Note')).fontSize).toBe('14px')
  },
} satisfies Meta<typeof Callouts>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

function AtSizes() {
  return (
    <main className={phone}>
      <MarkdownView padding="none">
        {tones.map(([tone, , text]) => (
          <div key={tone} data-testid="callout">
            <Callout tone={tone} title={`${tone} with a long title that wraps onto a second line in the phone column`}>
              <p>{text} https://example.com/a/very/long/path/that/must/break/inside/the/column</p>
            </Callout>
          </div>
        ))}
      </MarkdownView>
    </main>
  )
}

const atSizesPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const boxes = within(canvasElement).getAllByTestId('callout')
  for (const size of textSizes) {
    await atTextSize(size, async () => {
      for (const [i, box] of boxes.entries()) await expect({ size, box: i, spills: textSpills(box) }).toEqual({ size, box: i, spills: [] })
    })
  }
}

/** Each tone with a long title and a long URL at Small, Default and Large in the phone column on a message bubble: the title wraps and no text sticks out. */
export const CalloutTextSizesDark: StoryObj<typeof meta> = { render: () => <AtSizes />, globals: { mode: 'dark', textSize: 'small' }, play: atSizesPlay }
export const CalloutTextSizesLight: StoryObj<typeof meta> = { render: () => <AtSizes />, globals: { mode: 'light', textSize: 'small' }, play: atSizesPlay }
