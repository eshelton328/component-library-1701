import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { Stack } from '../controls/layout'
import { AgentIcon, RuleIcon } from '../foundations/icons'
import { ChatPath, FlowDiagram, type FlowStep } from './flow-diagram'

const page = css({ bg: 'bg.canvas', p: '24' })
const column = css({ w: 'shell.listPane' })
const narrow = css({ w: 'shell.popoverSm' })
// Swatches of the expected tokens, so the play function compares resolved colours.
const swatches = {
  raised: css({ bg: 'surface.raised' }),
  overlay: css({ bg: 'surface.overlay' }),
  selected: css({ bg: 'surface.selected' }),
  border: css({ bg: 'border.default' }),
  amberBorder: css({ bg: 'status.needsYou.border' }),
  amber: css({ bg: 'status.needsYou.fg' }),
  amberTint: css({ bg: 'status.needsYou.bg' }),
  accent: css({ bg: 'accent.default' }),
  active: css({ bg: 'border.active' }),
  fgAccent: css({ bg: 'fg.accent' }),
  text: css({ bg: 'fg.default' }),
  muted: css({ bg: 'fg.muted' }),
  rule: css({ bg: 'kind.rule' }),
  agent: css({ bg: 'kind.agent' }),
}

// The writer skill's steps, from Toolkit D14 (460:2) and M12 (461:572).
const steps: FlowStep[] = [
  { title: 'Name the reader', description: 'One line: who reads it and what they do next.' },
  {
    title: 'Read the reference',
    description: 'Follow the shape of the form.',
    uses: [{ label: 'references/<form>.md' }, { label: 'ste100', kind: 'rule', icon: <RuleIcon size="12" /> }],
  },
  { title: 'Run the lint', description: 'Fix every fail. An edit after the lint means a new run.', uses: [{ label: 'scripts/check', kind: 'code' }], loop: 'until no fail' },
  {
    title: 'Have it reviewed',
    description: 'Give the agent only the draft, the form and the sources.',
    uses: [{ label: 'writing-reviewer', kind: 'agent', icon: <AgentIcon size="12" /> }],
    loop: 'until pass',
  },
]

function Flow() {
  return (
    <main className={page}>
      <Stack gap="24">
        <div className={column}>
          <FlowDiagram label="How writer works" steps={steps} />
        </div>
        <div className={column}>
          <ChatPath
            title="A chat answer takes a shorter path"
            description="Steps 1, 3, 4, 5 and 6: lint with --form chat."
            steps={[
              { number: '1', label: 'Name the reader' },
              { number: '3', label: 'List the claims' },
              { number: '6', label: 'Run the lint', note: '--form chat' },
              { number: '→', label: 'Send the text', note: 'unchanged' },
            ]}
          />
        </div>
        <FlowDiagram label="One step" steps={[{ title: 'Only step' }]} />
        <div className={narrow} data-testid="narrow">
          <Stack gap="12">
            <FlowDiagram
              label="Long names"
              steps={[{ title: 'checkReleaseRegistryAuthenticationConfiguration', uses: [{ label: 'checkReleaseRegistryAuthenticationConfiguration', kind: 'rule', icon: <RuleIcon /> }] }]}
            />
            <ChatPath title="Long" steps={[{ number: '1', label: 'checkReleaseRegistryAuthenticationConfiguration', note: '--form=checkReleaseRegistryAuthentication' }]} />
          </Stack>
        </div>
      </Stack>
      <div hidden>
        {Object.entries(swatches).map(([name, className]) => (
          <span key={name} data-swatch={name} className={className} />
        ))}
      </div>
    </main>
  )
}

const meta = {
  title: 'Data display/Flow diagram',
  component: Flow,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const swatch = (name: string) => {
      const el = canvasElement.querySelector(`[data-swatch="${name}"]`)
      if (el === null) throw new Error(`no swatch ${name}`)
      return getComputedStyle(el).backgroundColor
    }
    const box = (el: Element) => el.getBoundingClientRect()
    const style = (el: Element) => getComputedStyle(el)

    // An ordered list of steps, each with a heading.
    const flow = canvas.getByRole('list', { name: 'How writer works' })
    await expect(flow.tagName).toBe('OL')
    const items = Array.from(flow.children)
    await expect(items).toHaveLength(4)
    await expect(within(flow).getAllByRole('heading').map((h) => h.textContent)).toEqual(steps.map((s) => s.title))
    // A card: raised, 1 px border, radius 10, 10 × 12 padding, the number on the left.
    const [first, second, third] = items
    if (first === undefined || second === undefined || third === undefined) throw new Error('no steps')
    const html = (el: Element | null | undefined) => {
      if (!(el instanceof HTMLElement)) throw new Error('not an element')
      return el
    }
    const card = html(first.firstElementChild)
    const c = style(card)
    await expect([c.backgroundColor, c.borderTopColor, c.borderTopWidth, c.borderTopLeftRadius, c.paddingTop, c.paddingLeft, c.columnGap]).toEqual([
      swatch('raised'),
      swatch('border'),
      '1px',
      '10px',
      '10px',
      '12px',
      '10px',
    ])
    const number = within(card).getByText('1')
    const n = style(number)
    await expect([n.backgroundColor, n.borderTopColor, n.borderTopLeftRadius, n.color, n.fontSize, n.paddingLeft]).toEqual([swatch('overlay'), swatch('border'), '8px', swatch('text'), '12px', '8px'])
    await expect(Math.round(box(number).height)).toBe(18)
    await expect(box(number).right).toBeLessThan(box(within(card).getByRole('heading')).left)
    const title = style(within(card).getByRole('heading'))
    await expect([title.fontSize, title.fontWeight, title.color]).toEqual(['14px', '500', swatch('text')])
    const desc = style(within(card).getByText(/^One line/))
    await expect([desc.fontSize, desc.color]).toEqual(['12px', swatch('muted')])
    // An arrow joins each step to the next, and none follows the last.
    const connector = card.nextElementSibling
    if (connector === null) throw new Error('no connector')
    await expect(connector).toHaveAttribute('aria-hidden', 'true')
    await expect(Math.round(box(connector).height)).toBe(12)
    await expect(style(connector).color).toBe(swatch('muted'))
    await expect(box(second).top).toBe(box(connector).bottom)
    await expect(items[3]?.children).toHaveLength(1)
    await expect(canvas.getByRole('list', { name: 'One step' }).querySelectorAll('.flow-diagram__connector')).toHaveLength(0)
    // Uses chips: overlay, 1 px border, radius 6, mono, coloured by kind.
    const uses = within(html(second)).getByRole('list', { name: 'Uses' })
    const [fileChip, ruleChip] = within(uses).getAllByRole('listitem')
    if (fileChip === undefined || ruleChip === undefined) throw new Error('no chips')
    const f = style(fileChip)
    await expect([f.backgroundColor, f.borderTopColor, f.borderTopLeftRadius, f.paddingTop, f.paddingLeft, f.fontSize, f.color]).toEqual([
      swatch('overlay'),
      swatch('border'),
      '6px',
      '2px',
      '6px',
      '12px',
      swatch('text'),
    ])
    await expect(style(ruleChip).color).toBe(swatch('rule'))
    await expect(ruleChip.querySelector('svg')).not.toBeNull()
    await expect(style(within(html(items[3])).getByText('writing-reviewer')).color).toBe(swatch('agent'))
    await expect(style(within(html(third)).getByText('scripts/check')).color).toBe(swatch('fgAccent'))
    // A step that repeats has an amber border and a loop marker on an amber tint.
    const loopCard = html(third.firstElementChild)
    await expect(style(loopCard).borderTopColor).toBe(swatch('amberBorder'))
    const loop = within(html(third)).getByText('Repeats until no fail')
    await expect([style(loop).color, style(loop).backgroundColor, style(loop).borderTopLeftRadius]).toEqual([swatch('amber'), swatch('amberTint'), '6px'])
    await expect(style(card).borderTopColor).toBe(swatch('border'))

    // Long names break inside a 240 px column instead of overflowing it, and a chip icon is 12 px whatever its size prop.
    const narrowBox = box(canvas.getByTestId('narrow'))
    const longFlow = canvas.getByRole('list', { name: 'Long names' })
    for (const el of Array.from(canvas.getByTestId('narrow').querySelectorAll('li, h4, span'))) {
      await expect(box(el).right).toBeLessThanOrEqual(narrowBox.right + 0.5)
      // No text runs out of its own box either.
      await expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1)
    }
    const longIcon = within(longFlow).getByRole('list', { name: 'Uses' }).querySelector('svg')
    if (longIcon === null) throw new Error('no icon')
    await expect([box(longIcon).width, box(longIcon).height]).toEqual([12, 12])
    // Each list keeps role="list", so Safari keeps it a list without bullets.
    await expect(flow).toHaveAttribute('role', 'list')
    await expect(within(html(second)).getByRole('list', { name: 'Uses' })).toHaveAttribute('role', 'list')

    // The chat path: a named region with its steps as pills in an ordered list.
    const chat = canvas.getByRole('region', { name: 'A chat answer takes a shorter path' })
    const r = style(chat)
    await expect([r.backgroundColor, r.borderTopColor, r.borderTopLeftRadius, r.paddingTop, r.paddingLeft, r.rowGap]).toEqual([swatch('raised'), swatch('border'), '10px', '16px', '16px', '10px'])
    await expect(style(within(chat).getByRole('heading')).textTransform).toBe('uppercase')
    await expect(within(chat).getByRole('list')).toHaveAttribute('role', 'list')
    const pills = within(within(chat).getByRole('list')).getAllByRole('listitem')
    await expect(pills.map((p) => p.textContent)).toEqual(['1Name the reader', '3List the claims', '6Run the lint--form chat', '→Send the textunchanged'])
    const pill = html(pills[0]?.firstElementChild)
    const p = style(pill)
    await expect([p.borderTopColor, p.borderTopLeftRadius, p.paddingLeft, p.paddingRight, p.columnGap]).toEqual([swatch('accent'), '8px', '6px', '10px', '6px'])
    const circle = style(within(pill).getByText('1'))
    await expect([circle.backgroundColor, circle.borderTopColor, circle.color]).toEqual([swatch('selected'), swatch('active'), swatch('fgAccent')])
    await expect(style(within(chat).getByText('--form chat')).color).toBe(swatch('muted'))
    // An arrow between pills, pointing right; none after the last.
    const arrows = chat.querySelectorAll('.chat-path__arrow')
    await expect(arrows).toHaveLength(3)
    await expect(style(arrows[0] ?? chat).color).toBe(swatch('muted'))
    // Each arrow is drawn pointing its way (the down and right icons), not turned by CSS.
    const arrowIcon = arrows[0]?.querySelector('svg') ?? chat
    const connectorIcon = connector.querySelector('svg') ?? chat
    await expect(arrowIcon.querySelector('path')?.getAttribute('d')).toBe('M5 12H19M12 5L19 12L12 19')
    await expect(connectorIcon.querySelector('path')?.getAttribute('d')).toBe('M12 5V19M19 12L12 19L5 12')
    for (const icon of [arrowIcon, connectorIcon]) {
      await expect([style(icon).transform, box(icon).width, box(icon).height, style(icon).color]).toEqual(['none', 12, 12, swatch('muted')])
    }
  },
} satisfies Meta<typeof Flow>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
