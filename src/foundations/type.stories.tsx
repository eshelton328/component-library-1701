import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { css, cx } from '../../styled-system/css'
import { textSizeClass, type TextSize } from './text-size'

// The text styles (d-041). A theme can change their size, family and
// weight (d-046); components use textStyle, never fontSize alone. The `Sm`
// styles are the compact sizes of Figma's Inbox screens (D1 list rows
// 346:202 and 346:203, detail body 346:354), on the 4 px grid. `labelXs`
// and `labelSmStrong` are the small Inbox button labels (D16 403:1848,
// 403:3928), `labelXsStrong` the discussion's author name (T20 402:11858)
// and `bodyLg` the Read the whole prompt dialog (D08 346:3548, 15/23 in
// Figma, 15/24 on the grid). `smallXs` is the Artifacts Sort menu's
// descriptions and note (D6 403:8884, 403:8907: Regular 11 on 14 px lines,
// 11/16 on the grid). `pageCount` is the Artifacts page count (D1
// 402:15373: Regular 16 on 21 px lines, 16/20 on the grid). `headingSm` is
// the open artifact's title on desktop (D2 403:465, D7 452:2354, D8
// 452:2964, D9 452:3582: SemiBold 26 on an auto line in a 34 px box, 26/36
// on the grid), one step under `heading`.
//
// Each style also comes in a Small and a Large text size (d-119): the
// text-small or text-large class on <html> picks one, as the dark class
// picks the mode, and Default needs no class. The Sizes story shows the
// three side by side; tokens/sizes/AGENTS.md has the table.
const page = css({ bg: 'bg.canvas', p: '24', display: 'grid', gap: '12' })
const row = css({ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'baseline', gap: '16' })
const name = css({ textStyle: 'mono', color: 'fg.muted' })

const styles = [
  { name: 'heading', className: css({ textStyle: 'heading', color: 'fg.default' }) },
  { name: 'headingSm', className: css({ textStyle: 'headingSm', color: 'fg.default' }) },
  { name: 'title', className: css({ textStyle: 'title', color: 'fg.default' }) },
  { name: 'subtitle', className: css({ textStyle: 'subtitle', color: 'fg.default' }) },
  { name: 'paneTitle', className: css({ textStyle: 'paneTitle', color: 'fg.default' }) },
  { name: 'label', className: css({ textStyle: 'label', color: 'fg.default' }) },
  { name: 'labelLg', className: css({ textStyle: 'labelLg', color: 'fg.default' }) },
  { name: 'labelSm', className: css({ textStyle: 'labelSm', color: 'fg.default' }) },
  { name: 'labelSmStrong', className: css({ textStyle: 'labelSmStrong', color: 'fg.default' }) },
  { name: 'labelXs', className: css({ textStyle: 'labelXs', color: 'fg.default' }) },
  { name: 'labelXsStrong', className: css({ textStyle: 'labelXsStrong', color: 'fg.default' }) },
  { name: 'bodyLg', className: css({ textStyle: 'bodyLg', color: 'fg.default' }) },
  { name: 'body', className: css({ textStyle: 'body', color: 'fg.default' }) },
  { name: 'pageCount', className: css({ textStyle: 'pageCount', color: 'fg.muted' }) },
  { name: 'bodySm', className: css({ textStyle: 'bodySm', color: 'fg.default' }) },
  { name: 'small', className: css({ textStyle: 'small', color: 'fg.muted' }) },
  { name: 'smallXs', className: css({ textStyle: 'smallXs', color: 'fg.muted' }) },
  { name: 'mono', className: css({ textStyle: 'mono', color: 'fg.muted' }) },
  { name: 'monoCaps', className: css({ textStyle: 'monoCaps', color: 'fg.muted' }) },
  { name: 'monoSm', className: css({ textStyle: 'monoSm', color: 'fg.muted' }) },
  { name: 'code', className: css({ textStyle: 'code', color: 'fg.default' }) },
  { name: 'eyebrow', className: css({ textStyle: 'eyebrow', color: 'fg.muted' }) },
  { name: 'navLabel', className: css({ textStyle: 'navLabel', color: 'fg.muted' }) },
  { name: 'railLabel', className: css({ textStyle: 'railLabel', color: 'fg.muted' }) },
  { name: 'badge', className: css({ textStyle: 'badge', color: 'fg.default' }) },
  { name: 'pill', className: css({ textStyle: 'pill', color: 'fg.default' }) },
]

// The font size and line height in px of each style in each text size, as
// tokens/sizes/AGENTS.md lists them.
const expected: Record<string, Record<TextSize, [number, number]>> = {
  heading: { small: [26, 36], default: [28, 40], large: [30, 44] },
  headingSm: { small: [24, 32], default: [26, 36], large: [28, 40] },
  title: { small: [18, 24], default: [20, 28], large: [22, 32] },
  subtitle: { small: [16, 24], default: [17, 24], large: [18, 24] },
  paneTitle: { small: [14, 20], default: [15, 20], large: [16, 20] },
  label: { small: [13, 20], default: [14, 20], large: [15, 20] },
  labelLg: { small: [15, 24], default: [16, 24], large: [17, 24] },
  labelSm: { small: [12, 16], default: [13, 16], large: [14, 20] },
  labelSmStrong: { small: [12, 16], default: [13, 16], large: [14, 20] },
  labelXs: { small: [11, 16], default: [12, 16], large: [13, 16] },
  labelXsStrong: { small: [11, 16], default: [12, 16], large: [13, 16] },
  body: { small: [13, 20], default: [14, 20], large: [15, 24] },
  pageCount: { small: [15, 20], default: [16, 20], large: [17, 24] },
  bodyLg: { small: [14, 24], default: [15, 24], large: [16, 24] },
  bodySm: { small: [12, 20], default: [13, 20], large: [14, 20] },
  small: { small: [11, 16], default: [12, 16], large: [13, 16] },
  smallXs: { small: [10, 16], default: [11, 16], large: [12, 16] },
  mono: { small: [11, 16], default: [12, 16], large: [13, 16] },
  monoCaps: { small: [11, 16], default: [12, 16], large: [13, 16] },
  monoSm: { small: [10, 16], default: [11, 16], large: [12, 16] },
  code: { small: [13, 20], default: [14, 20], large: [15, 24] },
  eyebrow: { small: [10, 16], default: [11, 16], large: [12, 16] },
  navLabel: { small: [9, 12], default: [10, 12], large: [11, 16] },
  railLabel: { small: [9, 12], default: [9, 12], large: [10, 12] },
  badge: { small: [9, 12], default: [10, 12], large: [11, 16] },
  pill: { small: [10, 16], default: [11, 16], large: [12, 16] },
}

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

const textSizes = ['small', 'default', 'large'] as const satisfies readonly TextSize[]
const columns = css({ bg: 'bg.canvas', p: '24', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24' })
const column = css({ display: 'grid', alignContent: 'start', gap: '12' })
const heading = css({ textStyle: 'eyebrow', color: 'fg.muted' })

function TextSizes() {
  return (
    <main className={columns}>
      {textSizes.map((size) => (
        <section key={size} className={cx(column, textSizeClass[size] ?? undefined)} data-size={size}>
          <h2 className={heading}>{size}</h2>
          {styles.map((s) => (
            <span key={s.name} className={s.className} data-style={s.name}>
              Review the run
            </span>
          ))}
        </section>
      ))}
    </main>
  )
}

const measure = (el: Element): [number, number] => {
  if (!(el instanceof HTMLElement)) throw new Error('not an element')
  return [parseFloat(getComputedStyle(el).fontSize), el.getBoundingClientRect().height]
}

// Every style in the scale has the size and line height of the table, and
// each line is a whole multiple of 4 px.
const checkScale = async (root: ParentNode, size: TextSize) => {
  for (const s of styles) {
    const el = root.querySelector(`[data-style="${s.name}"]`)
    if (el === null) throw new Error(`no ${s.name}`)
    const [fontSize, line] = measure(el)
    await expect({ style: s.name, size, px: [fontSize, line] }).toEqual({ style: s.name, size, px: expected[s.name]?.[size] })
    await expect(line % 4).toBe(0)
  }
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
    await expect(sample('smallXs')).toEqual({ family: '"Geist Variable"', size: '11px', weight: '400', lineHeight: 16, tracking: 'normal' })
    await expect(sample('bodyLg')).toEqual({ family: '"Geist Variable"', size: '15px', weight: '400', lineHeight: 24, tracking: 'normal' })
    await expect(sample('pageCount')).toEqual({ family: '"Geist Variable"', size: '16px', weight: '400', lineHeight: 20, tracking: 'normal' })
    await expect(sample('headingSm')).toEqual({ family: '"Geist Variable"', size: '26px', weight: '600', lineHeight: 36, tracking: 'normal' })
    await expect(sample('heading')).toMatchObject({ size: '28px', weight: '600' })
  },
} satisfies Meta<typeof TypeScale>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

/** Small, Default and Large side by side, each column under its class. */
export const Sizes: StoryObj<typeof meta> = {
  // The Default column needs no class on <html>, whatever the toolbar picks.
  globals: { textSize: 'default' },
  render: () => <TextSizes />,
  play: async ({ canvasElement }) => {
    // Every style of the table is in the scale.
    await expect(styles.map((s) => s.name).sort()).toEqual(Object.keys(expected).sort())
    for (const size of textSizes) {
      const col = canvasElement.querySelector(`[data-size="${size}"]`)
      if (col === null) throw new Error(`no ${size} column`)
      await checkScale(col, size)
    }
    // Only the size and line height change: the family, weight and letter spacing stay.
    const at = (size: TextSize, style: string) => {
      const el = canvasElement.querySelector(`[data-size="${size}"] [data-style="${style}"]`)
      if (el === null) throw new Error(`no ${style} in ${size}`)
      const c = getComputedStyle(el)
      return { family: c.fontFamily, weight: c.fontWeight, tracking: c.letterSpacing }
    }
    for (const style of ['heading', 'eyebrow', 'mono']) {
      await expect(at('small', style)).toEqual(at('default', style))
      await expect(at('large', style)).toEqual(at('default', style))
    }
  },
}

/** The text-small class on <html> makes the whole page Small. */
export const SmallOnRoot: StoryObj<typeof meta> = {
  globals: { textSize: 'small' },
  play: async ({ canvasElement }) => {
    await expect(document.documentElement.classList.contains('text-small')).toBe(true)
    await checkScale(canvasElement, 'small')
  },
}

/** The text-large class on <html> makes the whole page Large. */
export const LargeOnRoot: StoryObj<typeof meta> = {
  globals: { textSize: 'large' },
  play: async ({ canvasElement }) => {
    await expect(document.documentElement.classList.contains('text-large')).toBe(true)
    await checkScale(canvasElement, 'large')
  },
}
