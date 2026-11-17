import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { ScrollFrame } from '../controls/scroll-frame'
import { TerminalLines } from './terminal-lines'

// The shell pane of Workbench D1 (105:337), in a short pane, so the lines scroll in a ScrollFrame body (d-107).
const pane = css({ display: 'flex', flexDirection: 'column', bg: 'surface.pane', w: 'shell.dialogLg', h: 'shell.popoverSm' })
const swatches = {
  default: css({ color: 'fg.default' }),
  modified: css({ color: 'status.needsYou.fg' }),
  deleted: css({ color: 'status.danger.fg' }),
  untracked: css({ color: 'status.done.fg' }),
}

function Shell() {
  return (
    <main>
      <div className={pane}>
        <ScrollFrame header={<span>pnpm dev</span>}>
          <TerminalLines
            label="shell"
            prompt="$"
            lines={[
              { text: '$ git status --short' },
              { text: ' M AGENTS.md', tone: 'modified' },
              { text: ' M projects/ncc-1701/captures/README.md', tone: 'modified' },
              { text: ' D projects/omni/ROADMAP.md', tone: 'deleted' },
              { text: '?? notes/default-frontend-stack.md', tone: 'untracked' },
              { text: '?? toolkit/rules/diagrams.md', tone: 'untracked' },
              { text: '$ git log --oneline -3' },
              { text: '08ba27e feat: add ScrollFrame' },
              { text: 'c8b45f1 feat: add a submenu' },
              { text: '011180d feat: add Toolkit switch' },
            ]}
          />
        </ScrollFrame>
      </div>
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const meta = {
  title: 'Data display/Terminal lines',
  component: Shell,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const swatch = (name: string) => {
      const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
      if (el === null) throw new Error(`no swatch ${name}`)
      return getComputedStyle(el).color
    }
    const log = canvas.getByRole('log', { name: 'shell' })
    // Mono 12/16, lines 20 apart.
    const first = within(log).getByText('$ git status --short')
    const style = getComputedStyle(first)
    await expect([style.fontSize, Math.round(parseFloat(style.lineHeight)), style.fontWeight, style.color]).toEqual(['12px', 16, '400', swatch('default')])
    await expect(style.fontFamily).toMatch(/Mono/)
    const second = within(log).getByText('M AGENTS.md')
    await expect(Math.round(second.getBoundingClientRect().top - first.getBoundingClientRect().top)).toBe(20)
    // Git's colours: modified amber, deleted red, untracked green; the leading space stays.
    await expect(second.textContent).toBe(' M AGENTS.md')
    await expect(getComputedStyle(second).color).toBe(swatch('modified'))
    await expect(getComputedStyle(within(log).getByText('D projects/omni/ROADMAP.md')).color).toBe(swatch('deleted'))
    await expect(getComputedStyle(within(log).getByText('?? toolkit/rules/diagrams.md')).color).toBe(swatch('untracked'))
    // The prompt ends in an 8 × 16 block cursor, 4 after the "$", hidden from assistive technology.
    const cursor = log.querySelector('.terminal-lines__cursor')
    if (!(cursor instanceof HTMLElement)) throw new Error('no cursor')
    const box = cursor.getBoundingClientRect()
    await expect([box.width, box.height]).toEqual([8, 16])
    await expect(getComputedStyle(cursor).backgroundColor).toBe(swatch('default'))
    await expect(cursor).toHaveAttribute('aria-hidden', 'true')
    const prompt = cursor.parentElement
    if (prompt === null) throw new Error('no prompt')
    const text = document.createRange()
    text.selectNodeContents(prompt.firstChild ?? prompt)
    await expect(prompt.textContent).toBe('$')
    await expect(Math.round(box.left - text.getBoundingClientRect().right)).toBe(4)
    // In a ScrollFrame the body scrolls the lines; the terminal itself does not clip them.
    const body = log.parentElement
    if (body === null) throw new Error('no body')
    await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
    await expect(log.scrollHeight).toBe(log.clientHeight)
  },
} satisfies Meta<typeof Shell>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
