import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Switch, type SwitchProps } from './switch'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24', display: 'grid', gap: '24', justifyItems: 'start' })
// The phone More drawer's sheet and the desktop nav rail, the two places the switch sits (d-118).
const drawer = css({ bg: 'surface.overlay', p: '12', borderRadius: '2xl', w: 'shell.popoverLg' })
const rail = css({ bg: 'surface.chrome', px: '6', py: '16', w: 'shell.rail' })
// Swatches of the expected tokens, so the play functions compare resolved colours.
const swatches = {
  accent: css({ bg: 'accent.default' }),
  control: css({ bg: 'border.control' }),
  onAccent: css({ bg: 'fg.onAccent' }),
  default: css({ bg: 'fg.default' }),
  muted: css({ bg: 'fg.muted' }),
  focus: css({ bg: 'border.focus' }),
}
// The width of a `strong` outline as the browser draws it.
const ring = css({ outlineWidth: 'strong', outlineStyle: 'solid' })

const onCheckedChange = fn<(checked: boolean) => void>()

function Frame(props: SwitchProps) {
  const [checked, setChecked] = useState(props.defaultChecked === true)
  return (
    <main className={page}>
      <div className={props.layout === 'stacked' ? rail : drawer}>
        <Switch
          {...props}
          defaultChecked={undefined}
          checked={checked}
          onCheckedChange={(next) => {
            setChecked(next)
            onCheckedChange(next)
          }}
        />
      </div>
      <p>State {checked ? 'on' : 'off'}</p>
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
        <span data-ring className={ring} />
      </div>
    </main>
  )
}

function swatch(name: string) {
  const el = document.querySelector(`[data-swatch="${name}"]`)
  if (el === null) throw new Error(`no ${name} swatch`)
  return getComputedStyle(el).backgroundColor
}

function parts(canvasElement: HTMLElement, name: string) {
  const input = within(canvasElement).getByRole('switch', { name })
  const root = input.closest('label')
  const control = root?.querySelector('[data-part="control"]')
  const thumb = root?.querySelector('[data-part="thumb"]')
  const label = root?.querySelector('[data-part="label"]')
  if (root === null || !(control instanceof HTMLElement) || !(thumb instanceof HTMLElement) || !(label instanceof HTMLElement)) {
    throw new Error(`no switch parts for ${name}`)
  }
  return { input, root, control, thumb, label }
}

/** The track is 36 x 20 with a 16 px thumb 2 in from its start when off and its end when on. */
async function expectTrack(control: HTMLElement, thumb: HTMLElement, on: boolean) {
  const c = control.getBoundingClientRect()
  const t = thumb.getBoundingClientRect()
  await expect([c.width, c.height]).toEqual([36, 20])
  await expect([t.width, t.height]).toEqual([16, 16])
  await expect(t.top - c.top).toBe(2)
  await expect(on ? c.right - t.right : t.left - c.left).toBe(2)
  await expect(getComputedStyle(control).borderTopLeftRadius).toBe('999px')
  await expect(getComputedStyle(control).backgroundColor).toBe(swatch(on ? 'accent' : 'control'))
  await expect(getComputedStyle(thumb).backgroundColor).toBe(swatch('onAccent'))
}

const meta = {
  title: 'Forms/Switch',
  component: Frame,
  args: { label: 'Notifications' },
  // Off: an inline row in the drawer, the label in `label` (Medium 14/20, fg.default), the track at the row's end.
  // A click on the row and Space turn it on and off.
  play: async ({ canvasElement }) => {
    onCheckedChange.mockClear()
    const { input, root, control, thumb, label } = parts(canvasElement, 'Notifications')
    await expect(input).not.toBeChecked()
    // With no hint the switch has no description.
    await expect(input).not.toHaveAttribute('aria-describedby')
    await expect(root.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
    await expect(Math.round(control.getBoundingClientRect().right)).toBe(Math.round(root.getBoundingClientRect().right))
    await expect(label.getBoundingClientRect().left).toBe(root.getBoundingClientRect().left)
    const l = getComputedStyle(label)
    await expect([l.fontSize, l.fontWeight, l.color]).toEqual(['14px', '500', swatch('default')])
    await expect(Number.parseFloat(l.lineHeight)).toBeCloseTo(20, 0)
    await expectTrack(control, thumb, false)
    await userEvent.click(label)
    await expect(onCheckedChange).toHaveBeenLastCalledWith(true)
    await expect(input).toBeChecked()
    await expectTrack(control, thumb, true)
    // The focus stays on the switch after the click, and Space turns it off again.
    await userEvent.keyboard(' ')
    await expect(onCheckedChange).toHaveBeenLastCalledWith(false)
    await expect(input).not.toBeChecked()
    await expect(onCheckedChange).toHaveBeenCalledTimes(2)
  },
} satisfies Meta<typeof Frame>
export default meta

type Story = StoryObj<typeof meta>

export const OffDark: Story = { globals: { mode: 'dark' } }
export const OffLight: Story = { globals: { mode: 'light' } }

// On: the track is accent.default with the thumb at its end; Tab reaches it and draws the focus ring on the track;
// Space turns it off.
const onPlay: Story['play'] = async ({ canvasElement }) => {
  onCheckedChange.mockClear()
  const { input, control, thumb } = parts(canvasElement, 'Notifications')
  await expect(input).toBeChecked()
  await expect(input).toHaveAttribute('role', 'switch')
  await expectTrack(control, thumb, true)
  await userEvent.tab()
  await expect(input).toHaveFocus()
  const ringWidth = getComputedStyle(canvasElement.querySelector('[data-ring]') ?? canvasElement).outlineWidth
  const focused = getComputedStyle(control)
  await expect([focused.outlineStyle, focused.outlineWidth, focused.outlineColor, focused.outlineOffset]).toEqual(['solid', ringWidth, swatch('focus'), '2px'])
  await userEvent.keyboard(' ')
  await expect(onCheckedChange).toHaveBeenLastCalledWith(false)
  await expect(input).not.toBeChecked()
  await expectTrack(control, thumb, false)
}
export const OnDark: Story = { args: { defaultChecked: true }, play: onPlay, globals: { mode: 'dark' } }
export const OnLight: Story = { args: { defaultChecked: true }, play: onPlay, globals: { mode: 'light' } }

// Disabled: dimmed, and neither a click nor Space turns it.
const disabledPlay: Story['play'] = async ({ canvasElement }) => {
  onCheckedChange.mockClear()
  const { input, root, label } = parts(canvasElement, 'Notifications')
  await expect(input).toBeDisabled()
  await expect(getComputedStyle(root).opacity).toBe('0.45')
  await userEvent.click(label, { pointerEventsCheck: 0 })
  input.focus()
  await userEvent.keyboard(' ')
  await expect(onCheckedChange).not.toHaveBeenCalled()
  await expect(input).not.toBeChecked()
  await expect(within(canvasElement).getByText('State off')).toBeInTheDocument()
}
export const DisabledDark: Story = { args: { disabled: true }, play: disabledPlay, globals: { mode: 'dark' } }
export const DisabledLight: Story = { args: { disabled: true }, play: disabledPlay, globals: { mode: 'light' } }

// With a hint: the line under the label in `small` (fg.muted), 2 apart. It is the switch's accessible description,
// not part of its name, and a click on it turns the switch too.
const hintPlay: Story['play'] = async ({ canvasElement }) => {
  onCheckedChange.mockClear()
  const { input, root, label } = parts(canvasElement, 'Notifications')
  await expect(input).toHaveAccessibleName('Notifications')
  await expect(input).toHaveAccessibleDescription('Push alerts on this device')
  const hint = within(root).getByText('Push alerts on this device')
  const h = getComputedStyle(hint)
  await expect([h.fontSize, h.fontWeight, h.color]).toEqual(['12px', '400', swatch('muted')])
  await expect(hint.getBoundingClientRect().top - label.getBoundingClientRect().bottom).toBe(2)
  await expect(hint.getBoundingClientRect().left).toBe(label.getBoundingClientRect().left)
  await expect(root.getBoundingClientRect().height).toBe(44)
  await userEvent.click(hint)
  await expect(onCheckedChange).toHaveBeenLastCalledWith(true)
  await expect(within(canvasElement).getByText('State on')).toBeInTheDocument()
}
export const HintDark: Story = { args: { hint: 'Push alerts on this device' }, play: hintPlay, globals: { mode: 'dark' } }
export const HintLight: Story = { args: { hint: 'Push alerts on this device' }, play: hintPlay, globals: { mode: 'light' } }

// Stacked, in the 64 px rail: the track centred over the label and the hint, both in railLabel (Medium 9/12,
// fg.muted), centred and wrapping inside the rail; the row is at least 44 high and as wide as the rail's content.
const stackedPlay: Story['play'] = async ({ canvasElement }) => {
  onCheckedChange.mockClear()
  const { input, root, control, thumb, label } = parts(canvasElement, 'Notifications')
  await expect(input).toHaveAccessibleDescription('On this device')
  const box = root.getBoundingClientRect()
  const railBox = root.parentElement?.getBoundingClientRect()
  if (railBox === undefined) throw new Error('no rail')
  await expect(box.width).toBe(52)
  await expect(box.height).toBeGreaterThanOrEqual(44)
  const c = control.getBoundingClientRect()
  await expect(c.left - box.left).toBeCloseTo(box.right - c.right, 1)
  await expect(c.top - box.top).toBe(6)
  await expect(label.getBoundingClientRect().top - c.bottom).toBe(4)
  const hint = within(root).getByText('On this device')
  for (const el of [label, hint]) {
    const s = getComputedStyle(el)
    await expect([s.fontSize, s.fontWeight, s.color, s.textAlign]).toEqual(['9px', '500', swatch('muted'), 'center'])
    await expect(el.getBoundingClientRect().left).toBeGreaterThanOrEqual(railBox.left)
    await expect(el.getBoundingClientRect().right).toBeLessThanOrEqual(railBox.right)
  }
  // "On this device" wraps to two lines in the rail.
  await expect(hint.getBoundingClientRect().height).toBeGreaterThan(Number.parseFloat(getComputedStyle(hint).lineHeight) * 1.5)
  await expectTrack(control, thumb, false)
  await userEvent.click(control)
  await expect(onCheckedChange).toHaveBeenLastCalledWith(true)
  await expectTrack(control, thumb, true)
}
/** A controlled switch whose caller refuses every change, as a setting that fails to turn on. */
function Refusing(props: SwitchProps) {
  return (
    <main className={page}>
      <div className={drawer}>
        <Switch {...props} checked={false} onCheckedChange={onCheckedChange} />
      </div>
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

// A refused change: the caller keeps `checked` false, so the switch and its input stay off after a click and Space.
const refusedPlay: Story['play'] = async ({ canvasElement }) => {
  onCheckedChange.mockClear()
  const { input, control, thumb, label } = parts(canvasElement, 'Notifications')
  await userEvent.click(label)
  await expect(onCheckedChange).toHaveBeenLastCalledWith(true)
  await waitFor(() => expect(input).not.toBeChecked())
  await expectTrack(control, thumb, false)
  await userEvent.keyboard(' ')
  await expect(onCheckedChange).toHaveBeenCalledTimes(2)
  await waitFor(() => expect(input).not.toBeChecked())
}
export const Refused: Story = { render: (args) => <Refusing {...args} />, play: refusedPlay, globals: { mode: 'dark' } }

/** The declarations a `(forced-colors: active)` rule of this page's styles sets on elements with `className`. */
function forcedColours(className: string) {
  const found: Record<string, string> = {}
  const visit = (rules: CSSRuleList, forced: boolean) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSMediaRule) visit(rule.cssRules, forced || rule.conditionText.includes('forced-colors: active'))
      else if (rule instanceof CSSLayerBlockRule || rule instanceof CSSSupportsRule) visit(rule.cssRules, forced)
      else if (forced && rule instanceof CSSStyleRule && rule.selectorText.includes(className)) {
        for (const name of Array.from(rule.style)) found[`${rule.selectorText.includes('checked') ? 'checked ' : ''}${name}`] = rule.style.getPropertyValue(name)
      }
    }
  }
  for (const sheet of Array.from(document.styleSheets)) visit(sheet.cssRules, false)
  return found
}

// Forced colours (Windows High Contrast): the browser paints every background as Canvas, which would hide the thumb on
// its track. The thumb keeps CanvasText and the track that is on takes Highlight, so the state still shows.
const forcedPlay: Story['play'] = async ({ canvasElement }) => {
  const { thumb } = parts(canvasElement, 'Notifications')
  await expect(thumb).toBeVisible()
  await expect(forcedColours('switch__thumb')).toMatchObject({ 'forced-color-adjust': 'none', 'background-color': 'canvastext' })
  await expect(forcedColours('switch__control')).toMatchObject({ 'forced-color-adjust': 'none', 'checked background-color': 'highlight' })
}
export const ForcedColours: Story = { args: { defaultChecked: true }, play: forcedPlay, globals: { mode: 'dark' } }

export const StackedDark: Story = { args: { layout: 'stacked', hint: 'On this device' }, play: stackedPlay, globals: { mode: 'dark' } }
export const StackedLight: Story = { args: { layout: 'stacked', hint: 'On this device' }, play: stackedPlay, globals: { mode: 'light' } }
