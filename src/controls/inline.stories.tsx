import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from './button'
import { Grid, Inline, Stack } from './layout'
import { justifies, styleOf } from './layout-test'

const page = css({ bg: 'bg.canvas', p: '24' })

function Inlines() {
  return (
    <main className={page}>
      <Stack gap="24">
        <Inline gap="8" data-testid="row">
          <Button variant="primary">Approve</Button>
          <Button>Discuss</Button>
          <Button variant="dangerText">Deny</Button>
        </Inline>
        <Inline justify="between" data-testid="between">
          <Button>Back</Button>
          <Button variant="primary">Next</Button>
        </Inline>
        <Grid columns="3">
          <Inline gap="6" wrap data-testid="wrap">
            {['skills', 'agents', 'rules', 'workflows', 'hooks'].map((k) => (
              <Button key={k} size="sm">
                {k}
              </Button>
            ))}
          </Inline>
        </Grid>
        {justifies.map(([j]) => (
          <Inline key={j} justify={j} data-testid={`all-justify-${j}`} />
        ))}
        <Inline align="baseline" data-testid="baseline" />
      </Stack>
    </main>
  )
}

const meta = {
  title: 'Layout/Inline',
  component: Inlines,
  play: async ({ canvasElement }) => {
    await expect(styleOf(canvasElement, 'row').columnGap).toBe('8px')
    await expect(styleOf(canvasElement, 'between').justifyContent).toBe('space-between')
    await expect(styleOf(canvasElement, 'wrap').flexWrap).toBe('wrap')
    await expect(styleOf(canvasElement, 'wrap').columnGap).toBe('6px')
    for (const [j, css] of justifies) await expect(styleOf(canvasElement, `all-justify-${j}`).justifyContent).toBe(css)
    await expect(styleOf(canvasElement, 'baseline').alignItems).toBe('baseline')
  },
} satisfies Meta<typeof Inlines>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
