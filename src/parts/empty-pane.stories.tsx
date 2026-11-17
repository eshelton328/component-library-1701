import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Button } from '../controls/button'
import { EmptyPane } from './empty-pane'
import { KindMark } from './kind-mark'
import { ListRow } from './list-row'

// The empty pane of Workbench D1 (105:347) in a pane-sized box.
const pane = css({ display: 'flex', flexDirection: 'column', bg: 'surface.pane', w: 'shell.dialogWide', h: 'shell.dialogWide', p: '10' })
const swatches = { default: css({ color: 'fg.default' }), muted: css({ color: 'fg.muted' }), border: css({ color: 'border.default' }) }
const kinds = [
  ['claude', 'Claude Code'],
  ['codex', 'Codex'],
  ['shell', 'shell'],
] as const

function Empty() {
  return (
    <main className={pane}>
      <EmptyPane
        title="Empty pane"
        description="Start a chat here, or open one from this workspace"
        actions={kinds.map(([kind, label]) => (
          <Button key={kind} size="sm">
            <KindMark kind={kind} size="16" />
            {label}
          </Button>
        ))}
        listLabel="Open in this pane"
      >
        <ListRow variant="sidebar" density="compact" title="hono server" meta="Sonnet 5.5" leading={<KindMark kind="claude" size="16" />} />
        <ListRow variant="sidebar" density="compact" title="cross-family x2" meta="Opus 5.5" leading={<KindMark kind="claude" size="16" />} />
      </EmptyPane>
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const meta = {
  title: 'Layout/Empty pane',
  component: Empty,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const swatch = (name: string) => {
      const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
      if (el === null) throw new Error(`no swatch ${name}`)
      return getComputedStyle(el).color
    }
    const font = (el: HTMLElement) => {
      const s = getComputedStyle(el)
      return [s.fontSize, Math.round(parseFloat(s.lineHeight)), s.fontWeight, s.color]
    }
    // The pane is named by its title, has a dashed 1 px border.default outline, no fill, and fills its parent.
    const root = canvas.getByRole('region', { name: 'Empty pane' })
    const box = getComputedStyle(root)
    await expect([box.borderTopStyle, box.borderTopWidth, box.borderTopColor, box.backgroundColor]).toEqual(['dashed', '1px', swatch('border'), 'rgba(0, 0, 0, 0)'])
    const parent = root.parentElement
    if (parent === null) throw new Error('no parent')
    await expect(root.getBoundingClientRect().height).toBe(parent.getBoundingClientRect().height - 20)
    // The title in paneTitle (SemiBold 15/20), the line in bodySm (13/20) in fg.muted, centred, 12 apart.
    const title = canvas.getByText('Empty pane')
    const line = canvas.getByText('Start a chat here, or open one from this workspace')
    await expect(font(title)).toEqual(['15px', 20, '600', swatch('default')])
    await expect(font(line)).toEqual(['13px', 20, '400', swatch('muted')])
    await expect(Math.round(line.getBoundingClientRect().top - title.getBoundingClientRect().bottom)).toBe(12)
    const middle = (el: HTMLElement) => Math.round(el.getBoundingClientRect().left + el.getBoundingClientRect().width / 2)
    await expect(middle(title)).toBe(middle(root))
    // The start buttons sit 8 apart.
    const claude = canvas.getByRole('button', { name: 'Claude Code' })
    const codex = canvas.getByRole('button', { name: 'Codex' })
    await expect(Math.round(codex.getBoundingClientRect().left - claude.getBoundingClientRect().right)).toBe(8)
    // The list is 380 wide, named by its eyebrow label, 2 over the rows.
    const list = canvas.getByRole('group', { name: 'Open in this pane' })
    await expect(list.getBoundingClientRect().width).toBe(380)
    const label = within(list).getByText('Open in this pane')
    await expect(getComputedStyle(label).textTransform).toBe('uppercase')
    await expect(getComputedStyle(label).fontFamily).toMatch(/Mono/)
    const row = list.children[1]
    if (!(row instanceof HTMLElement)) throw new Error('no row')
    await expect(Math.round(row.getBoundingClientRect().top - label.getBoundingClientRect().bottom)).toBe(2)
  },
} satisfies Meta<typeof Empty>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
