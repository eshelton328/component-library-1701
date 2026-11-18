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

// Toolkit items and full pages (screen review R9). vp1512 is the width of the Figma desktop frames.
const vp1512 = { w1512: { name: 'Figma desktop (1512)', styles: { width: '1512px', height: '982px' } } }
// Query containers as wide as the Figma frames' detail spaces: 1028 beside a list pane (D03 427:250), 1448 for a full page (D02 426:53).
const itemSpace = css({ containerType: 'inline-size', bg: 'bg.canvas', w: 'shell.itemWide' })
const pageSpace = css({ containerType: 'inline-size', bg: 'bg.canvas', w: 'shell.pageWide' })

function ToolkitSpaces({ wide }: { wide: boolean }) {
  const parts = (key: string) => [
    <Container key={`${key}-item`} size="item" data-testid={`${key}-item`}>
      <p className={text}>An open Toolkit item: 948 of content, 40 sides.</p>
    </Container>,
    <Container key={`${key}-page`} size="page" data-testid={`${key}-page`}>
      <p className={text}>A Toolkit full page: 1384 of content, 32 sides.</p>
    </Container>,
    <Container key={`${key}-desktop`} data-testid={`${key}-desktop`}>
      <p className={text}>Desktop: no max width.</p>
    </Container>,
    <Container key={`${key}-detail`} size="detail" data-testid={`${key}-detail`}>
      <p className={text}>Detail: 748, or 1024 in the middle from 1600.</p>
    </Container>,
  ]
  if (wide)
    return (
      <main className={space} data-testid="wide-space">
        {parts('wide')}
      </main>
    )
  return (
    <main>
      <div className={itemSpace} data-testid="item-space">
        {parts('item-space')}
      </div>
      <div className={pageSpace} data-testid="page-space">
        {parts('page-space')}
      </div>
    </main>
  )
}

const box = (root: HTMLElement, id: string) => {
  const el = root.querySelector<HTMLElement>(`[data-testid="${id}"]`)
  if (el === null) throw new Error(`no ${id}`)
  const s = getComputedStyle(el)
  const rect = el.getBoundingClientRect()
  const content = el.firstElementChild?.getBoundingClientRect().width
  return { rect, content, pad: pad(s) }
}
const parentRect = (root: HTMLElement, id: string) => {
  const el = root.querySelector<HTMLElement>(`[data-testid="${id}"]`)
  if (el === null) throw new Error(`no ${id}`)
  return el.getBoundingClientRect()
}
const itemPad = ['24px', '40px', '32px', '40px']
const pagePad = ['24px', '32px', '32px', '32px']

// Below shell.detailWideFrom (1600): item and page fill their space, with no max width; desktop and detail stay as they were.
const toolkitNarrow: NonNullable<StoryObj<typeof meta>['play']> = async ({ canvasElement }) => {
  for (const [spaceId, width] of [
    ['item-space', 1028],
    ['page-space', 1448],
  ] as const) {
    const parent = parentRect(canvasElement, spaceId)
    await expect(parent.width).toBe(width)
    const item = box(canvasElement, `${spaceId}-item`)
    await expect(item.pad).toEqual(itemPad)
    await expect(item.rect.width).toBe(width)
    await expect(item.content).toBe(width - 80)
    await expect(item.rect.left).toBe(parent.left)
    const page = box(canvasElement, `${spaceId}-page`)
    await expect(page.pad).toEqual(pagePad)
    await expect(page.rect.width).toBe(width)
    await expect(page.content).toBe(width - 64)
    await expect(page.rect.left).toBe(parent.left)
    const desktop = box(canvasElement, `${spaceId}-desktop`)
    await expect(desktop.pad).toEqual(itemPad)
    await expect(desktop.rect.width).toBe(width)
    const detail = box(canvasElement, `${spaceId}-detail`)
    await expect(detail.rect.width).toBe(828)
    await expect(detail.rect.left).toBe(parent.left)
  }
  // The Figma frames: the item 1028 with 948 of content (D03 427:250), the page 1448 with 1384 (D02 426:53).
  await expect(box(canvasElement, 'item-space-item').content).toBe(948)
  await expect(box(canvasElement, 'page-space-page').content).toBe(1384)
}

// From shell.detailWideFrom: item 1028 and page 1448 wide, padding included, in the middle; desktop fills, detail is 1104 in the middle.
const toolkitWide: NonNullable<StoryObj<typeof meta>['play']> = async ({ canvasElement }) => {
  const parent = parentRect(canvasElement, 'wide-space')
  const centred = async (rect: DOMRect) => expect(rect.left - parent.left).toBe(parent.right - rect.right)
  const item = box(canvasElement, 'wide-item')
  await expect(item.pad).toEqual(itemPad)
  await expect(item.rect.width).toBe(1028)
  await expect(item.content).toBe(948)
  await centred(item.rect)
  const page = box(canvasElement, 'wide-page')
  await expect(page.pad).toEqual(pagePad)
  await expect(page.rect.width).toBe(1448)
  await expect(page.content).toBe(1384)
  await centred(page.rect)
  const desktop = box(canvasElement, 'wide-desktop')
  await expect(desktop.pad).toEqual(itemPad)
  await expect(desktop.rect.width).toBe(parent.width)
  const detail = box(canvasElement, 'wide-detail')
  await expect(detail.rect.width).toBe(1104)
  await centred(detail.rect)
}

/** At the 1512 px of the Figma frames, an item fills a 1028 space and a page a 1448 space. */
export const ToolkitAt1512Dark: StoryObj<typeof meta> = {
  render: () => <ToolkitSpaces wide={false} />,
  parameters: { viewport: { options: vp1512 } },
  globals: { mode: 'dark', viewport: { value: 'w1512' } },
  play: toolkitNarrow,
}
export const ToolkitAt1512Light: StoryObj<typeof meta> = { ...ToolkitAt1512Dark, globals: { mode: 'light', viewport: { value: 'w1512' } } }
/** At 1920 px the item is 1028 wide and the page 1448, each in the middle. */
export const ToolkitAt1920Dark: StoryObj<typeof meta> = {
  render: () => <ToolkitSpaces wide />,
  parameters: { viewport: { options: vp1920 } },
  globals: { mode: 'dark', viewport: { value: 'w1920' } },
  play: toolkitWide,
}
export const ToolkitAt1920Light: StoryObj<typeof meta> = { ...ToolkitAt1920Dark, globals: { mode: 'light', viewport: { value: 'w1920' } } }
/** At 3540 px, Erik's screen, they stay 1028 and 1448, in the middle. */
export const ToolkitAt3540Dark: StoryObj<typeof meta> = {
  render: () => <ToolkitSpaces wide />,
  parameters: { viewport: { options: vp3540 } },
  globals: { mode: 'dark', viewport: { value: 'w3540' } },
  play: toolkitWide,
}
export const ToolkitAt3540Light: StoryObj<typeof meta> = { ...ToolkitAt3540Dark, globals: { mode: 'light', viewport: { value: 'w3540' } } }
