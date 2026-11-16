import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { KindMark, type KindMarkKind, type KindMarkSize } from './kind-mark'

const page = css({ bg: 'bg.canvas', p: '24', display: 'grid', gap: '16', justifyItems: 'start' })
const pane = css({ bg: 'surface.pane', p: '16', borderRadius: 'xl', display: 'grid', gap: '12' })
const row = css({ display: 'flex', alignItems: 'center', gap: '12' })
const table = css({ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', alignItems: 'center', justifyItems: 'start', gap: '12' })
const label = css({ textStyle: 'mono', color: 'fg.muted' })

const kinds = ['claude', 'codex', 'shell'] as const satisfies readonly KindMarkKind[]
const sizes = ['14', '16', '20'] as const satisfies readonly KindMarkSize[]
const swatches: Record<KindMarkKind, string> = {
  claude: css({ color: 'agent.claude' }),
  codex: css({ color: 'fg.default' }),
  shell: css({ color: 'fg.muted' }),
}

function Marks() {
  return (
    <main className={page}>
      <div className={pane}>
        <div className={table}>
          {kinds.map((k) => [
            <span key={k} className={label}>
              {k}
            </span>,
            ...sizes.map((s) => (
              <span key={`${k}-${s}`} data-testid={`mark-${k}-${s}`}>
                <KindMark kind={k} size={s} />
              </span>
            )),
          ])}
        </div>
        <div className={row}>
          <KindMark kind="claude" title="Claude" />
          <span data-testid="blank-title">
            <KindMark kind="codex" title=" " />
          </span>
        </div>
      </div>
      <div hidden>
        {kinds.map((k) => (
          <span key={k} data-testid={`swatch-${k}`} className={swatches[k]} />
        ))}
      </div>
    </main>
  )
}

const meta = {
  title: 'Data display/Kind mark',
  component: Marks,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    for (const k of kinds) {
      const colour = getComputedStyle(canvas.getByTestId(`swatch-${k}`)).color
      for (const s of sizes) {
        const svg = canvas.getByTestId(`mark-${k}-${s}`).querySelector('svg')
        if (!(svg instanceof SVGSVGElement)) throw new Error(`no ${k} ${s} mark`)
        const px = Number(s)
        // The size comes from sizes.icon; the drawing is Figma's at that size.
        await expect(svg.getBoundingClientRect().width).toBe(px)
        await expect(svg.getBoundingClientRect().height).toBe(px)
        await expect(svg.getAttribute('viewBox')).toBe(`0 0 ${s} ${s}`)
        const style = getComputedStyle(svg)
        await expect(style.stroke).toBe(colour)
        await expect(style.fill).toBe('none')
        await expect(style.strokeWidth).toBe('2px')
        await expect(style.strokeLinecap).toBe('round')
        await expect(svg.getAttribute('aria-hidden')).toBe('true')
        const paths = Array.from(svg.querySelectorAll('path'))
        await expect(paths.length).toBeGreaterThan(0)
        for (const path of paths) {
          await expect(path.getTotalLength()).toBeGreaterThan(0)
          const box = path.getBBox()
          await expect(box.x).toBeGreaterThanOrEqual(0)
          await expect(box.y).toBeGreaterThanOrEqual(0)
          await expect(box.x + box.width).toBeLessThanOrEqual(px)
          await expect(box.y + box.height).toBeLessThanOrEqual(px)
        }
      }
    }
    // A title names a mark that stands alone; one of only spaces does not.
    const named = canvas.getByRole('img', { name: 'Claude' })
    await expect(named.getBoundingClientRect().width).toBe(16)
    const blank = canvas.getByTestId('blank-title').querySelector('svg')
    await expect(blank?.getAttribute('aria-hidden')).toBe('true')
    await expect(blank?.getAttribute('role')).toBeNull()
  },
} satisfies Meta<typeof Marks>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
