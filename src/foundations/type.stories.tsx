import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { css } from '../../styled-system/css'

// The text styles (d-041). A theme can change their size, family and
// weight (d-046); components use textStyle, never fontSize alone. The `Sm`
// styles are the compact sizes of Figma's Inbox screens (D1 list rows
// 346:202 and 346:203, detail body 346:354), on the 4 px grid. `labelXs`
// and `labelSmStrong` are the small Inbox button labels (D16 403:1848,
// 403:3928), `labelXsStrong` the discussion's author name (T20 402:11858)
// and `bodyLg` the Read the whole prompt dialog (D08 346:3548, 15/23 in
// Figma, 15/24 on the grid).
const page = css({ bg: 'bg.canvas', p: '24', display: 'grid', gap: '12' })
const row = css({ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'baseline', gap: '16' })
const name = css({ textStyle: 'mono', color: 'fg.muted' })

const styles = [
  { name: 'heading', className: css({ textStyle: 'heading', color: 'fg.default' }) },
  { name: 'title', className: css({ textStyle: 'title', color: 'fg.default' }) },
  { name: 'subtitle', className: css({ textStyle: 'subtitle', color: 'fg.default' }) },
  { name: 'paneTitle', className: css({ textStyle: 'paneTitle', color: 'fg.default' }) },
  { name: 'label', className: css({ textStyle: 'label', color: 'fg.default' }) },
  { name: 'labelSm', className: css({ textStyle: 'labelSm', color: 'fg.default' }) },
  { name: 'labelSmStrong', className: css({ textStyle: 'labelSmStrong', color: 'fg.default' }) },
  { name: 'labelXs', className: css({ textStyle: 'labelXs', color: 'fg.default' }) },
  { name: 'labelXsStrong', className: css({ textStyle: 'labelXsStrong', color: 'fg.default' }) },
  { name: 'bodyLg', className: css({ textStyle: 'bodyLg', color: 'fg.default' }) },
  { name: 'body', className: css({ textStyle: 'body', color: 'fg.default' }) },
  { name: 'bodySm', className: css({ textStyle: 'bodySm', color: 'fg.default' }) },
  { name: 'small', className: css({ textStyle: 'small', color: 'fg.muted' }) },
  { name: 'mono', className: css({ textStyle: 'mono', color: 'fg.muted' }) },
  { name: 'monoCaps', className: css({ textStyle: 'monoCaps', color: 'fg.muted' }) },
  { name: 'monoSm', className: css({ textStyle: 'monoSm', color: 'fg.muted' }) },
  { name: 'code', className: css({ textStyle: 'code', color: 'fg.default' }) },
  { name: 'eyebrow', className: css({ textStyle: 'eyebrow', color: 'fg.muted' }) },
  { name: 'navLabel', className: css({ textStyle: 'navLabel', color: 'fg.muted' }) },
  { name: 'badge', className: css({ textStyle: 'badge', color: 'fg.default' }) },
]

function TypeScale() {
  return (
    <main className={page}>
      {styles.map((s) => (
        <div key={s.name} className={row}>
          <span className={name}>{s.name}</span>
          <span className={s.className} data-style={s.name}>
            Review the agent run before it merges
          </span>
        </div>
      ))}
    </main>
  )
}

const meta = {
  title: 'Foundations/Type',
  component: TypeScale,
  play: async ({ canvasElement }) => {
    const sample = (name: string) => {
      const el = canvasElement.querySelector(`[data-style="${name}"]`)
      if (!(el instanceof HTMLElement)) throw new Error(`no ${name}`)
      const style = getComputedStyle(el)
      return { family: style.fontFamily.split(',')[0], size: style.fontSize, weight: style.fontWeight, lineHeight: el.getBoundingClientRect().height, tracking: style.letterSpacing }
    }
    // One line of each compact style lays out to a whole number of pixels on the 4 px grid. Chromium reports a letter spacing of 0 as `normal`.
    await expect(sample('labelSm')).toEqual({ family: '"Geist Variable"', size: '13px', weight: '500', lineHeight: 16, tracking: 'normal' })
    await expect(sample('bodySm')).toEqual({ family: '"Geist Variable"', size: '13px', weight: '400', lineHeight: 20, tracking: 'normal' })
    await expect(sample('monoSm')).toEqual({ family: '"Geist Mono Variable"', size: '11px', weight: '400', lineHeight: 16, tracking: 'normal' })
    await expect(sample('labelSmStrong')).toEqual({ family: '"Geist Variable"', size: '13px', weight: '600', lineHeight: 16, tracking: 'normal' })
    await expect(sample('labelXs')).toEqual({ family: '"Geist Variable"', size: '12px', weight: '500', lineHeight: 16, tracking: 'normal' })
    await expect(sample('labelXsStrong')).toEqual({ family: '"Geist Variable"', size: '12px', weight: '600', lineHeight: 16, tracking: 'normal' })
    await expect(sample('bodyLg')).toEqual({ family: '"Geist Variable"', size: '15px', weight: '400', lineHeight: 24, tracking: 'normal' })
  },
} satisfies Meta<typeof TypeScale>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
