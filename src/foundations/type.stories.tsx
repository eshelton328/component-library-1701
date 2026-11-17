import type { Meta, StoryObj } from '@storybook/react-vite'
import { css } from '../../styled-system/css'

// The twelve text styles (d-041). A theme can change their size, family
// and weight (d-046); components use textStyle, never fontSize alone.
const page = css({ bg: 'bg.canvas', p: '24', display: 'grid', gap: '12' })
const row = css({ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'baseline', gap: '16' })
const name = css({ textStyle: 'mono', color: 'fg.muted' })

const styles = [
  { name: 'heading', className: css({ textStyle: 'heading', color: 'fg.default' }) },
  { name: 'title', className: css({ textStyle: 'title', color: 'fg.default' }) },
  { name: 'subtitle', className: css({ textStyle: 'subtitle', color: 'fg.default' }) },
  { name: 'paneTitle', className: css({ textStyle: 'paneTitle', color: 'fg.default' }) },
  { name: 'label', className: css({ textStyle: 'label', color: 'fg.default' }) },
  { name: 'body', className: css({ textStyle: 'body', color: 'fg.default' }) },
  { name: 'small', className: css({ textStyle: 'small', color: 'fg.muted' }) },
  { name: 'mono', className: css({ textStyle: 'mono', color: 'fg.muted' }) },
  { name: 'monoCaps', className: css({ textStyle: 'monoCaps', color: 'fg.muted' }) },
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
          <span className={s.className}>Review the agent run before it merges</span>
        </div>
      ))}
    </main>
  )
}

const meta = { title: 'Foundations/Type', component: TypeScale } satisfies Meta<typeof TypeScale>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
