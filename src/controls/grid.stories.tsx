import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Grid } from './layout'
import { styleOf } from './layout-test'

const page = css({ bg: 'bg.canvas', p: '24' })
const card = css({ bg: 'surface.pane', p: '16', borderRadius: 'lg', textStyle: 'body', color: 'fg.default' })

function Grids() {
  return (
    <main className={page}>
      <Grid columns="3" gap="12" data-testid="three">
        {['Inbox', 'Artifacts', 'Toolkit', 'Workbench', 'Settings'].map((n) => (
          <div key={n} className={card}>
            {n}
          </div>
        ))}
      </Grid>
    </main>
  )
}

const meta = {
  title: 'Layout/Grid',
  component: Grids,
  play: async ({ canvasElement }) => {
    const style = styleOf(canvasElement, 'three')
    await expect(style.gridTemplateColumns.split(' ')).toHaveLength(3)
    await expect(style.rowGap).toBe('12px')
  },
} satisfies Meta<typeof Grids>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
