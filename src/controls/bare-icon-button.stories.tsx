import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { CopyIcon, LockIcon } from '../foundations/icons'
import { BareIconButton } from './bare-icon-button'
import { Inline } from './layout'

const page = css({ bg: 'bg.canvas', color: 'fg.default', p: '24' })
// The Files viewer's bar (Toolkit D6): the file's path in small muted text, the copy icon (432:2297) and the lock.
const bar = css({ bg: 'surface.pane', px: '16', py: '8', borderRadius: 'md', textStyle: 'small', color: 'fg.muted' })
const swatches = {
  muted: css({ bg: 'fg.muted' }),
  default: css({ bg: 'fg.default' }),
  focus: css({ bg: 'border.focus' }),
}
const ring = css({ outlineWidth: 'strong', outlineStyle: 'solid' })

const copied = fn()

function ViewerBar() {
  return (
    <main className={page}>
      <div className={bar} data-testid="bar">
        <Inline gap="12" align="center">
          <span>toolkit/skills/writer/SKILL.md</span>
          <BareIconButton label="Copy toolkit/skills/writer/SKILL.md" icon={<CopyIcon />} onClick={copied} />
          <BareIconButton label="Copy at 16" icon={<CopyIcon size="16" />} />
          <BareIconButton label="Copy disabled" icon={<CopyIcon />} disabled />
          <LockIcon size="12" />
        </Inline>
      </div>
      <div hidden>
        <span data-ring className={ring} />
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

// A bare 12 × 12 button with no fill, border or padding, named by `label`, in fg.muted and fg.default on hover. An
// icon given another size still draws at 12. A key press draws the 1.5 px border.focus ring 2 outside the icon, and a
// click or Enter calls `onClick`. A disabled one fades and calls nothing.
const play: StoryObj<typeof meta>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const swatch = (name: string) => getComputedStyle(canvasElement.querySelector(`[data-swatch="${name}"]`) ?? canvasElement).backgroundColor
  copied.mockClear()
  const button = canvas.getByRole('button', { name: 'Copy toolkit/skills/writer/SKILL.md' })
  await expect(button.tagName).toBe('BUTTON')
  await expect(button).toHaveAttribute('type', 'button')
  const box = button.getBoundingClientRect()
  await expect([box.width, box.height]).toEqual([12, 12])
  for (const name of ['Copy toolkit/skills/writer/SKILL.md', 'Copy at 16']) {
    const svg = canvas.getByRole('button', { name }).querySelector('svg')
    if (svg === null) throw new Error(`no icon in ${name}`)
    const r = svg.getBoundingClientRect()
    await expect([r.width, r.height]).toEqual([12, 12])
  }
  const style = getComputedStyle(button)
  await expect([style.color, style.backgroundColor, style.borderTopWidth, style.paddingTop, style.paddingLeft, style.cursor]).toEqual([
    swatch('muted'),
    'rgba(0, 0, 0, 0)',
    '0px',
    '0px',
    '0px',
    'pointer',
  ])
  // Simulated pointer events set no :hover; Panda's hover condition also matches [data-hover].
  button.setAttribute('data-hover', '')
  await expect(getComputedStyle(button).color).toBe(swatch('default'))
  button.removeAttribute('data-hover')

  await userEvent.tab()
  await expect(button).toHaveFocus()
  const focused = getComputedStyle(button)
  // The ring is borderWidths.strong, which Chromium draws as the reference element below computes it.
  const ringWidth = getComputedStyle(canvasElement.querySelector('[data-ring]') ?? canvasElement).outlineWidth
  await expect(parseFloat(ringWidth)).toBeGreaterThan(0)
  await expect([focused.outlineColor, focused.outlineStyle, focused.outlineWidth, focused.outlineOffset]).toEqual([swatch('focus'), 'solid', ringWidth, '2px'])
  await userEvent.keyboard('{Enter}')
  await expect(copied).toHaveBeenCalledOnce()
  await userEvent.click(button)
  await expect(copied).toHaveBeenCalledTimes(2)

  const disabled = canvas.getByRole('button', { name: 'Copy disabled' })
  await expect(disabled).toBeDisabled()
  await expect(getComputedStyle(disabled).opacity).not.toBe('1')
}

const meta = {
  title: 'Actions/Bare icon button',
  component: ViewerBar,
} satisfies Meta<typeof ViewerBar>

export default meta

/** `BareIconButton`: the 12 px copy icon of the Files viewer's bar (Toolkit D6 432:2297, D10 440:1364). */
export const BareIconButtonDark: StoryObj<typeof meta> = { globals: { mode: 'dark' }, play }
export const BareIconButtonLight: StoryObj<typeof meta> = { globals: { mode: 'light' }, play }
