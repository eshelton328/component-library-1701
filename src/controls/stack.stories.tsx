import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from './button'
import { Stack } from './layout'
import { styleOf } from './layout-test'

const page = css({ bg: 'bg.canvas', p: '24' })

function Stacks() {
  return (
    <main className={page}>
      <Stack gap="24">
        <Stack gap="4" data-testid="gap-4">
          <Button>Top</Button>
          <Button>Bottom</Button>
        </Stack>
        <Stack gap="40" align="start" data-testid="gap-40">
          <Button variant="primary">Start</Button>
          <Button>Aligned to the start</Button>
        </Stack>
      </Stack>
    </main>
  )
}

const meta = {
  title: 'Layout/Stack',
  component: Stacks,
  // Every gap is in the package CSS, not only the values in this file.
  play: async ({ canvasElement }) => {
    await expect(styleOf(canvasElement, 'gap-4').rowGap).toBe('4px')
    await expect(styleOf(canvasElement, 'gap-40').rowGap).toBe('40px')
    await expect(styleOf(canvasElement, 'gap-40').alignItems).toBe('start')
  },
} satisfies Meta<typeof Stacks>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
