import type { Meta, StoryObj } from '@storybook/react-vite'
import { css } from '../../styled-system/css'

// Every surface with the text colours allowed on it. The story test runs
// axe on each mode, so a text colour that fails contrast on a surface fails
// the test. tokens/contrast.json checks the same pairs from the token values.
const page = css({ bg: 'bg.canvas', p: '24', display: 'grid', gap: '16', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' })
const box = css({ p: '16', borderRadius: 'xl', borderWidth: 'default', borderStyle: 'solid', borderColor: 'border.default', display: 'grid', gap: '4' })
const name = css({ textStyle: 'eyebrow', color: 'fg.muted' })
const strong = css({ textStyle: 'paneTitle', color: 'fg.default' })
const body = css({ textStyle: 'body', color: 'fg.muted' })
const subtle = css({ textStyle: 'mono', color: 'fg.subtle' })
const accent = css({ textStyle: 'label', color: 'fg.accent' })

const surfaces = [
  { token: 'surface.chrome', className: css({ bg: 'surface.chrome' }), subtle: true },
  { token: 'surface.pane', className: css({ bg: 'surface.pane' }), subtle: true },
  { token: 'surface.overlay', className: css({ bg: 'surface.overlay', boxShadow: 'overlay' }), subtle: true },
  { token: 'surface.inset', className: css({ bg: 'surface.inset' }), subtle: true },
  { token: 'surface.well', className: css({ bg: 'surface.well' }), subtle: true },
  { token: 'surface.raised', className: css({ bg: 'surface.raised' }), subtle: false },
  { token: 'surface.selected', className: css({ bg: 'surface.selected', borderColor: 'border.selected' }), subtle: false },
]

function Surfaces() {
  return (
    <main className={page}>
      {surfaces.map((s) => (
        <section key={s.token} className={`${box} ${s.className}`}>
          <span className={name}>{s.token}</span>
          <span className={strong}>Default text</span>
          <span className={body}>Muted text for meta and descriptions.</span>
          {s.subtle ? <span className={subtle}>Subtle · 3 items · 2h</span> : null}
          <span className={accent}>Accent link</span>
        </section>
      ))}
    </main>
  )
}

const meta = { title: 'Foundations/Surfaces', component: Surfaces } satisfies Meta<typeof Surfaces>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
