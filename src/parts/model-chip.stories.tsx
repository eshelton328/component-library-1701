import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Inline, Stack } from '../controls/layout'
import { ModelChip, type ModelChipOption } from './model-chip'
import { expectCutText } from '../controls/tooltip.testing'

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
    // 26 px tall: 4 × 8 padding, a 1 px border, Medium 11 text on a 16 px line (the pill style on the 4 px grid).
    await expect(chip.getBoundingClientRect().height).toBeCloseTo(26, 0)
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
    // The chevron is drawn in the label's tone, fg.default, as Figma draws it (454:313), not fg.muted.
    await expect(getComputedStyle(chevron).color).toBe(swatch('text'))
    await expect(getComputedStyle(chevron).color).toBe(style.color)
    await expect(getComputedStyle(chevron).color).not.toBe(swatch('muted'))
    await expect(chip).toHaveAttribute('aria-haspopup', 'menu')
    // The effort follows the model.
    await expect(canvas.getByRole('button', { name: 'Model: Sonnet 5.5 · high effort' })).toHaveTextContent('Sonnet 5.5 · high effort')
    const disabled = canvas.getByRole('button', { name: 'Model: GPT-5.5' })
    await expect(disabled).toBeDisabled()
    await expect(getComputedStyle(disabled).opacity).toBe('0.45')
    // Without options, the chip is text: no button and no chevron.
    const text = canvas.getByText('Opus 5.5 · high effort')
    // The TruncatedText inside the chip's label holds the text.
    const staticChip = text.closest('.model-chip__root')
    if (!(staticChip instanceof HTMLElement)) throw new Error('no static chip')
    await expect(staticChip.tagName).toBe('SPAN')
    await expect(staticChip.querySelector('svg')).toBeNull()
    await expect(staticChip.getBoundingClientRect().height).toBeCloseTo(26, 0)
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

const narrowBox = css({ w: 'shell.popoverSm' })

const longEffort = 'high effort with extended thinking'

/**
 * A long model and effort are cut to one line and show in full in a
 * tooltip: on the chip's button when it opens a menu, and as its own tab
 * stop when it is text.
 */
export const LongModel: StoryObj<typeof meta> = {
  globals: { mode: 'dark' },
  render: () => (
    <main className={page}>
      <Stack gap="8">
        <div className={narrowBox}>
          <ModelChip model="Opus 5.5" effort={longEffort} options={models} value="opus-high" />
        </div>
        <div className={narrowBox} data-testid="static">
          <ModelChip model="Sonnet 5.5" effort={longEffort} />
        </div>
      </Stack>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const chip = canvas.getByRole('button', { name: `Model: Opus 5.5 · ${longEffort}` })
    const label = chip.querySelector('.model-chip__label')
    const staticLabel = canvas.getByTestId('static').querySelector('.model-chip__label')
    if (label === null || staticLabel === null) throw new Error('no label')
    await expectCutText(label, `Opus 5.5 · ${longEffort}`, chip)
    await expectCutText(staticLabel, `Sonnet 5.5 · ${longEffort}`)
  },
}

// The chip of the chat header (d-121): the caller writes the short effort ("Opus 5.5 · med", or the family alone,
// "Opus", on the phone), and `touch` reaches a 44 px touch target past the 26 px chip that opens a menu. A text chip
// (no `options`) opens nothing, so `touch` gives it no target.
function HeaderChips() {
  return (
    <main className={page}>
      <Inline gap="24">
        <ModelChip model="Opus 5.5" effort="med" options={models} value="opus-medium" touch />
        <ModelChip model="Opus" options={models} value="opus-medium" touch />
        <ModelChip model="Sonnet 5.5" effort="high" touch />
        <ModelChip model="Opus" options={models} value="opus-medium" />
      </Inline>
    </main>
  )
}

const touchPlay: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const body = within(document.body)
  const chip = canvas.getByRole('button', { name: 'Model: Opus 5.5 · med' })
  const [family] = canvas.getAllByRole('button', { name: 'Model: Opus' })
  if (family === undefined) throw new Error('no family chip')
  const staticChip = canvas.getByText('Sonnet 5.5 · high').closest('.model-chip__root')
  if (!(staticChip instanceof HTMLElement)) throw new Error('no static chip')
  for (const c of [chip, family]) {
    // The chip draws as before, 26 high; its target reaches 12 past each edge of the padding box: 48 high.
    const box = c.getBoundingClientRect()
    await expect(box.height).toBeCloseTo(26, 0)
    const before = getComputedStyle(c, '::before')
    await expect(before.position).toBe('absolute')
    await expect(Number.parseFloat(before.height)).toBeGreaterThanOrEqual(44)
    await expect(Number.parseFloat(before.width)).toBeCloseTo(c.clientWidth + 24, 0)
  }
  // The text chip with `touch` keeps its 26 px box and has no target: a tap beside it reaches what is there.
  await expect(staticChip.getBoundingClientRect().height).toBeCloseTo(26, 0)
  await expect(getComputedStyle(staticChip, '::before').content).toBe('none')
  // `touch` changes nothing drawn: the same box, padding, border and fill as the chip without it.
  const [withTouch, without] = canvas.getAllByRole('button', { name: 'Model: Opus' })
  if (withTouch === undefined || without === undefined) throw new Error('no chips to compare')
  const drawn = (el: HTMLElement) => {
    const s = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return [r.width, r.height, s.padding, s.borderWidth, s.borderColor, s.backgroundColor, s.borderRadius]
  }
  await expect(drawn(withTouch)).toEqual(drawn(without))
  await expect(getComputedStyle(without, '::before').content).toBe('none')
  // A tap 9 px above the chip opens its menu.
  const box = family.getBoundingClientRect()
  const reached = document.elementFromPoint(box.left + box.width / 2, box.top - 9)?.closest('button')
  await expect(reached).toBe(family)
  if (!(reached instanceof HTMLElement)) throw new Error('no button at the point')
  await userEvent.click(reached)
  await body.findByRole('menu')
  await expect(family).toHaveAttribute('aria-expanded', 'true')
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(body.queryByRole('menu')).toBeNull())
}

export const TouchDark: StoryObj<typeof meta> = { render: () => <HeaderChips />, globals: { mode: 'dark' }, play: touchPlay }
export const TouchLight: StoryObj<typeof meta> = { render: () => <HeaderChips />, globals: { mode: 'light' }, play: touchPlay }
