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
