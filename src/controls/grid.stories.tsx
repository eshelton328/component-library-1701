import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Grid, Stack } from './layout'
import { columns, gaps, styleOf } from './layout-test'

const page = css({ bg: 'bg.canvas', p: '24' })
const card = css({ bg: 'surface.pane', p: '16', borderRadius: 'lg', textStyle: 'body', color: 'fg.default' })

function Grids() {
  return (
    <main className={page}>
      <Stack gap="24">
      <Grid columns="3" gap="12" data-testid="three">
        {['Inbox', 'Artifacts', 'Toolkit', 'Workbench', 'Settings'].map((n) => (
          <div key={n} className={card}>
            {n}
          </div>
        ))}
      </Grid>
      {gaps.map((g) => (
        <Grid key={g} gap={g} data-testid={`all-gap-${g}`} />
      ))}
      {columns.map((c) => (
        <Grid key={c} columns={c} data-testid={`all-columns-${c}`}>
          <span />
        </Grid>
      ))}
      </Stack>
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
    for (const g of gaps) await expect(styleOf(canvasElement, `all-gap-${g}`).rowGap).toBe(`${g}px`)
    for (const c of columns) await expect(styleOf(canvasElement, `all-columns-${c}`).gridTemplateColumns.split(' ')).toHaveLength(Number(c))
  },
} satisfies Meta<typeof Grids>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
