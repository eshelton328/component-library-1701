import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Logo, type LogoSize } from './logo'

const page = css({ bg: 'bg.canvas', p: '24', display: 'grid', gap: '16', justifyItems: 'start' })
const rail = css({ bg: 'surface.chrome', p: '16', borderRadius: 'xl', display: 'flex', alignItems: 'center', gap: '12' })
// A parent's text colour does not change the logo.
const muted = css({ color: 'fg.muted' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  accent: css({ color: 'fg.accent' }),
  text: css({ color: 'fg.default' }),
  muted: css({ color: 'fg.muted' }),
}

const sizes = ['28', '24'] as const satisfies readonly LogoSize[]

function Logos() {
  return (
    <main className={page}>
      <div className={rail}>
        {sizes.map((s) => (
          <span key={s} data-testid={`logo-${s}`}>
            <Logo size={s} />
          </span>
        ))}
        <span data-testid="logo-default">
          <Logo />
        </span>
        <Logo title="Span" />
        <span data-testid="blank-title">
          <Logo title={' \n '} />
        </span>
        <span data-testid="muted" className={muted}>
          <Logo />
        </span>
      </div>
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

function swatch(name: string) {
  const el = document.querySelector(`[data-swatch="${name}"]`)
  if (el === null) throw new Error(`no ${name} swatch`)
  return getComputedStyle(el).color
}

const svgIn = (el: HTMLElement) => {
  const svg = el.querySelector('svg')
  if (!(svg instanceof SVGSVGElement)) throw new Error('no svg')
  return svg
}

const meta = {
  title: 'Navigation/Logo',
  component: Logos,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Each size comes from a size token: 28 (kindTile.sm, as in the rail) and 24 (icon.24).
    for (const s of sizes) {
      const box = svgIn(canvas.getByTestId(`logo-${s}`)).getBoundingClientRect()
      await expect([box.width, box.height]).toEqual([Number(s), Number(s)])
    }
    // 28 is the default.
    const svg = svgIn(canvas.getByTestId('logo-default'))
    await expect(svg.getBoundingClientRect().width).toBe(28)
    await expect(svg.getAttribute('viewBox')).toBe('0 0 28 28')
    // Without a title the logo is decorative.
    await expect(svg.getAttribute('aria-hidden')).toBe('true')
    await expect(svg.getAttribute('role')).toBeNull()
    await expect(svg.querySelector('title')).toBeNull()
    // The bridge: three stroked paths in fg.accent, round caps and joins, Figma's 1.75 and 1.3125 strokes.
    const paths = Array.from(svg.querySelectorAll('path'))
    await expect(paths).toHaveLength(4)
    const [arch, deck, pillars, spark] = paths.map((p) => getComputedStyle(p))
    for (const style of [arch, deck, pillars]) {
      await expect(style?.stroke).toBe(swatch('accent'))
      await expect(style?.fill).toBe('none')
      await expect(style?.strokeLinecap).toBe('round')
      await expect(style?.strokeLinejoin).toBe('round')
    }
    await expect([arch?.strokeWidth, deck?.strokeWidth, pillars?.strokeWidth]).toEqual(['1.75px', '1.75px', '1.3125px'])
    // The spark: filled in fg.default, not stroked.
    await expect(spark?.fill).toBe(swatch('text'))
    await expect(spark?.stroke).toBe('none')
    // Every path draws inside the 28 grid.
    for (const path of paths) {
      await expect(path.getTotalLength()).toBeGreaterThan(0)
      const b = path.getBBox()
      await expect(b.x).toBeGreaterThanOrEqual(0)
      await expect(b.y).toBeGreaterThanOrEqual(0)
      await expect(b.x + b.width).toBeLessThanOrEqual(28)
      await expect(b.y + b.height).toBeLessThanOrEqual(28)
    }
    // A title names the logo for assistive technology.
    const named = canvas.getByRole('img', { name: 'Span' })
    await expect(named.getAttribute('aria-hidden')).toBeNull()
    // A title of only spaces names nothing, so the logo stays hidden.
    const blank = svgIn(canvas.getByTestId('blank-title'))
    await expect(blank.getAttribute('aria-hidden')).toBe('true')
    await expect(blank.getAttribute('role')).toBeNull()
    // Inside fg.muted text the bridge stays fg.accent and the spark fg.default.
    const inMuted = Array.from(svgIn(canvas.getByTestId('muted')).querySelectorAll('path')).map((p) => getComputedStyle(p))
    await expect(getComputedStyle(canvas.getByTestId('muted')).color).toBe(swatch('muted'))
    await expect(inMuted[0]?.stroke).toBe(swatch('accent'))
    await expect(inMuted[3]?.fill).toBe(swatch('text'))
  },
} satisfies Meta<typeof Logos>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
