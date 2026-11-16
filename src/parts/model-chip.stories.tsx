import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Inline, Stack } from '../controls/layout'
import { ModelChip, type ModelChipOption } from './model-chip'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', minH: 'shell.dialog' })
const pane = css({ bg: 'surface.pane', p: '16', borderRadius: 'xl' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  raised: css({ bg: 'surface.raised' }),
  border: css({ bg: 'border.default' }),
  active: css({ bg: 'border.active' }),
  text: css({ bg: 'fg.default' }),
  muted: css({ bg: 'fg.muted' }),
}

const models: readonly ModelChipOption[] = [
  { value: 'opus-high', label: 'Opus 5.5 · high effort' },
  { value: 'haiku', label: 'Haiku 5', disabled: true },
  { value: 'sonnet-high', label: 'Sonnet 5.5 · high effort' },
  { value: 'opus-medium', label: 'Opus 5.5 · medium effort' },
]

function Chips() {
  return (
    <main className={page}>
      <Stack gap="16">
        <Inline gap="8">
          <ModelChip model="Opus 5.5" options={models} value="opus-high" />
          <ModelChip model="Sonnet 5.5" effort="high effort" options={models} value="sonnet-high" />
          <ModelChip model="GPT-5.5" options={models} disabled />
        </Inline>
        <div className={pane}>
          <ModelChip model="Opus 5.5" effort="high effort" />
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
  title: 'Data display/Model chip',
  component: Chips,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const swatch = (name: string) => {
      const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
      return el === null ? '' : getComputedStyle(el).backgroundColor
    }
    const chip = canvas.getByRole('button', { name: 'Model: Opus 5.5' })
    const style = getComputedStyle(chip)
    // 24 px tall: 4 × 8 padding, a 1 px border, Medium 11 text on a 14 px line (13.98 from the 1.2727 line height).
    await expect(chip.getBoundingClientRect().height).toBeCloseTo(24, 0)
    await expect([style.paddingTop, style.paddingBottom, style.paddingLeft, style.paddingRight]).toEqual(['4px', '4px', '8px', '8px'])
    await expect(style.borderRadius).toBe('8px')
    await expect(style.borderTopWidth).toBe('1px')
    await expect(style.fontSize).toBe('11px')
    await expect(style.fontWeight).toBe('500')
    await expect(style.columnGap).toBe('6px')
    await expect(style.backgroundColor).toBe(swatch('raised'))
    await expect(style.borderTopColor).toBe(swatch('border'))
    await expect(style.color).toBe(swatch('text'))
    const chevron = chip.querySelector('svg')
    if (chevron === null) throw new Error('no chevron')
    await expect([chevron.getBoundingClientRect().width, chevron.getBoundingClientRect().height]).toEqual([12, 12])
    await expect(getComputedStyle(chevron).color).toBe(swatch('muted'))
    await expect(chip).toHaveAttribute('aria-haspopup', 'menu')
    // The effort follows the model.
    await expect(canvas.getByRole('button', { name: 'Model: Sonnet 5.5 · high effort' })).toHaveTextContent('Sonnet 5.5 · high effort')
    const disabled = canvas.getByRole('button', { name: 'Model: GPT-5.5' })
    await expect(disabled).toBeDisabled()
    await expect(getComputedStyle(disabled).opacity).toBe('0.45')
    // Without options, the chip is text: no button and no chevron.
    const text = canvas.getByText('Opus 5.5 · high effort')
    const staticChip = text.parentElement
    if (!(staticChip instanceof HTMLElement)) throw new Error('no static chip')
    await expect(staticChip.tagName).toBe('SPAN')
    await expect(staticChip.querySelector('svg')).toBeNull()
    await expect(staticChip.getBoundingClientRect().height).toBeCloseTo(24, 0)
  },
} satisfies Meta<typeof Chips>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onValueChange = fn<(value: string) => void>()

function Picker() {
  const [value, setValue] = useState('opus-high')
  const picked = models.find((m) => m.value === value)
  const [model = '', effort] = (picked?.label ?? '').split(' · ')
  return (
    <main className={page}>
      <ModelChip
        model={model}
        effort={effort}
        options={models}
        value={value}
        onValueChange={(next) => {
          onValueChange(next)
          setValue(next)
        }}
      />
      <span hidden data-swatch="active" className={swatches.active} />
    </main>
  )
}

/** A click opens the menu with the picked model checked; the arrow keys skip a disabled model; Enter picks; Escape closes. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => <Picker />,
  play: async ({ canvasElement }) => {
    onValueChange.mockClear()
    const canvas = within(canvasElement)
    const body = within(document.body)
    const chip = canvas.getByRole('button', { name: 'Model: Opus 5.5 · high effort' })
    await userEvent.click(chip)
    const menu = await body.findByRole('menu')
    await expect(chip).toHaveAttribute('aria-expanded', 'true')
    const active = canvasElement.querySelector('[data-swatch="active"]')
    await expect(getComputedStyle(chip).borderTopColor).toBe(active === null ? '' : getComputedStyle(active).backgroundColor)
    await expect(within(menu).getByRole('group', { name: 'Model' })).toBeInTheDocument()
    await expect(within(menu).getByRole('menuitemradio', { name: 'Opus 5.5 · high effort' })).toHaveAttribute('aria-checked', 'true')
    await waitFor(() => expect(menu).toHaveFocus())
    // Opus high, then Sonnet: Haiku, between them, is disabled, so the arrow skips it.
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(within(menu).getByRole('menuitemradio', { name: 'Opus 5.5 · high effort' })).toHaveAttribute('data-highlighted'))
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(within(menu).getByRole('menuitemradio', { name: 'Sonnet 5.5 · high effort' })).toHaveAttribute('data-highlighted'))
    await userEvent.keyboard('{Enter}')
    await expect(onValueChange).toHaveBeenLastCalledWith('sonnet-high')
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull())
    const changed = canvas.getByRole('button', { name: 'Model: Sonnet 5.5 · high effort' })
    await waitFor(() => expect(changed).toHaveFocus())
    // Escape closes without a pick.
    await userEvent.click(changed)
    await body.findByRole('menu')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('menu')).toBeNull())
    await expect(onValueChange).toHaveBeenCalledTimes(1)
    // A click on a disabled model picks nothing.
    await userEvent.click(changed)
    await userEvent.click(within(await body.findByRole('menu')).getByRole('menuitemradio', { name: 'Haiku 5' }))
    await expect(onValueChange).toHaveBeenCalledTimes(1)
  },
}
