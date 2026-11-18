import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from './button'
import { Container, Stack } from './layout'
import { gaps, styleOf } from './layout-test'

const page = css({ bg: 'bg.canvas' })
// A pane wider than the detail column (two 540 blocks side by side set its width to 1080), and one narrower than it.
const wide = css({ w: 'max-content', display: 'flex', flexDirection: 'column' })
const ruler = css({ display: 'flex', '& > *': { w: 'shell.dialogLg', flexShrink: '0' } })
const narrow = css({ w: 'shell.popover', display: 'flex', flexDirection: 'column' })
const text = css({ textStyle: 'body', color: 'fg.default' })

function Containers() {
  return (
    <main className={page}>
      <Stack gap="0">
        <Container data-testid="desktop">
          <p className={text}>Desktop: 24 top, 32 bottom, 40 sides.</p>
        </Container>
        <Container size="tablet" gap="12" data-testid="tablet">
          <p className={text}>Tablet: 12 top, 20 bottom, 24 sides.</p>
          <Button>A button 12 below</Button>
        </Container>
        <Container size="phone" data-testid="phone">
          <p className={text}>Phone: 4 top, 12 bottom, 12 sides.</p>
        </Container>
        <div className={wide}>
          <div className={ruler} aria-hidden="true">
            <span />
            <span />
          </div>
          <Container size="detail" data-testid="detail">
            <p className={text}>Detail: the desktop padding, content at most 748 wide.</p>
          </Container>
        </div>
        <div className={narrow}>
          <Container size="detail" data-testid="detail-narrow">
            <p className={text}>A narrow pane: the column fits it.</p>
          </Container>
        </div>
        {gaps.map((g) => (
          <Container key={g} gap={g} data-testid={`all-gap-${g}`} />
        ))}
      </Stack>
    </main>
  )
}

const pad = (s: CSSStyleDeclaration) => [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft]

const meta = {
  title: 'Layout/Container',
  component: Containers,
  play: async ({ canvasElement }) => {
    await expect(pad(styleOf(canvasElement, 'desktop'))).toEqual(['24px', '40px', '32px', '40px'])
    await expect(pad(styleOf(canvasElement, 'tablet'))).toEqual(['12px', '24px', '20px', '24px'])
    await expect(pad(styleOf(canvasElement, 'phone'))).toEqual(['4px', '12px', '12px', '12px'])
    // A detail column (Inbox D1 346:306): the desktop padding, its content at most 748 (shell.detail)
    // at the start of a wider pane, and no wider than a narrower pane.
    const detail = canvasElement.querySelector<HTMLElement>('[data-testid="detail"]')
    if (detail === null) throw new Error('no detail column')
    await expect(pad(getComputedStyle(detail))).toEqual(['24px', '40px', '32px', '40px'])
    await expect(detail.parentElement?.getBoundingClientRect().width).toBe(1080)
    await expect(detail.getBoundingClientRect().width).toBe(828)
    await expect(detail.getBoundingClientRect().left).toBe(detail.parentElement?.getBoundingClientRect().left)
    const fit = canvasElement.querySelector<HTMLElement>('[data-testid="detail-narrow"]')
    await expect(fit?.getBoundingClientRect().width).toBe(320)
    // Children stack, gap apart, and the default gap is 0.
    await expect(styleOf(canvasElement, 'tablet').flexDirection).toBe('column')
    await expect(styleOf(canvasElement, 'tablet').rowGap).toBe('12px')
    await expect(styleOf(canvasElement, 'desktop').rowGap).toBe('0px')
    // Every gap is in the package CSS, not only the values in this file.
    for (const g of gaps) await expect(styleOf(canvasElement, `all-gap-${g}`).rowGap).toBe(`${g}px`)
  },
} satisfies Meta<typeof Containers>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

// The viewports of the stories: the 1440 px of the review frames, a 1920 px screen and Erik's 3540 px screen.
const vp1440 = { w1440: { name: 'Desktop (1440)', styles: { width: '1440px', height: '900px' } } }
const vp1920 = { w1920: { name: 'Wide (1920)', styles: { width: '1920px', height: '1080px' } } }
const vp3540 = { w3540: { name: 'Ultra-wide (3540)', styles: { width: '3540px', height: '1440px' } } }

// A query container as wide as the window, as the AppShell detail is.
// A block fills the width, so the main element is as wide as the window.
const space = css({ containerType: 'inline-size', bg: 'bg.canvas' })

function DetailSpace() {
  return (
    <main className={space} data-testid="space">
      <Container size="detail" data-testid="detail-space">
        <p className={text}>A detail column. From a 1600 px space it is 1024 wide, in the middle; below, 748 at the start.</p>
      </Container>
    </main>
  )
}

// Below shell.detailWideFrom (1600) the column is 748 + 2 × 40 at the start; from it, 1024 + 2 × 40 in the middle.
const detailAt =
  (wide: boolean): NonNullable<StoryObj<typeof meta>['play']> =>
  async ({ canvasElement }) => {
    const parent = canvasElement.querySelector<HTMLElement>('[data-testid="space"]')?.getBoundingClientRect()
    const column = canvasElement.querySelector<HTMLElement>('[data-testid="detail-space"]')?.getBoundingClientRect()
    if (parent === undefined || column === undefined) throw new Error('no detail space')
    await expect(column.width).toBe(wide ? 1104 : 828)
    if (wide) await expect(column.left - parent.left).toBe(parent.right - column.right)
    else await expect(column.left).toBe(parent.left)
  }

/** At 1440 px nothing moves: the column is 828 wide at the start, as in every Figma desktop frame. */
export const DetailAt1440Dark: StoryObj<typeof meta> = {
  render: () => <DetailSpace />,
  parameters: { viewport: { options: vp1440 } },
  globals: { mode: 'dark', viewport: { value: 'w1440' } },
  play: detailAt(false),
}
export const DetailAt1440Light: StoryObj<typeof meta> = { ...DetailAt1440Dark, globals: { mode: 'light', viewport: { value: 'w1440' } } }
/** At 1920 px the column is 1104 wide (1024 and its padding), in the middle. */
export const DetailAt1920Dark: StoryObj<typeof meta> = {
  render: () => <DetailSpace />,
  parameters: { viewport: { options: vp1920 } },
  globals: { mode: 'dark', viewport: { value: 'w1920' } },
  play: detailAt(true),
}
export const DetailAt1920Light: StoryObj<typeof meta> = { ...DetailAt1920Dark, globals: { mode: 'light', viewport: { value: 'w1920' } } }
/** At 3540 px it stays 1104 wide, in the middle. */
export const DetailAt3540Dark: StoryObj<typeof meta> = {
  render: () => <DetailSpace />,
  parameters: { viewport: { options: vp3540 } },
  globals: { mode: 'dark', viewport: { value: 'w3540' } },
  play: detailAt(true),
}
export const DetailAt3540Light: StoryObj<typeof meta> = { ...DetailAt3540Dark, globals: { mode: 'light', viewport: { value: 'w3540' } } }
