import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import {
  ActionIcon,
  AgentIcon,
  ApproveIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  HomeIcon,
  HookIcon,
  InboxIcon,
  MoreIcon,
  NextIcon,
  ProjectsIcon,
  QuestionIcon,
  ReviewIcon,
  RuleIcon,
  SearchIcon,
  SkillIcon,
  WorkflowIcon,
  WorkspacesIcon,
  type IconProps,
  type IconSize,
} from './icons'

const page = css({ bg: 'bg.canvas', p: '24', display: 'grid', gap: '24', color: 'fg.default' })
const group = css({ display: 'grid', gap: '12' })
const heading = css({ textStyle: 'eyebrow', color: 'fg.muted' })
const grid = css({ display: 'grid', gap: '12', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' })
const cell = css({ display: 'grid', justifyItems: 'center', gap: '8', p: '12', borderRadius: 'md', bg: 'surface.pane', color: 'fg.default' })
const label = css({ textStyle: 'mono', color: 'fg.muted' })
const row = css({ display: 'flex', alignItems: 'center', gap: '12', color: 'fg.accent' })

type Entry = { name: string; Icon: (props: IconProps) => React.JSX.Element }

const groups: { title: string; icons: Entry[] }[] = [
  {
    title: 'Toolkit kinds',
    icons: [
      { name: 'skill', Icon: SkillIcon },
      { name: 'agent', Icon: AgentIcon },
      { name: 'rule', Icon: RuleIcon },
      { name: 'workflow', Icon: WorkflowIcon },
      { name: 'hook', Icon: HookIcon },
    ],
  },
  {
    title: 'Inbox kinds',
    icons: [
      { name: 'approve', Icon: ApproveIcon },
      { name: 'question', Icon: QuestionIcon },
      { name: 'review', Icon: ReviewIcon },
      { name: 'action', Icon: ActionIcon },
      { name: 'next', Icon: NextIcon },
    ],
  },
  {
    title: 'Navigation',
    icons: [
      { name: 'home', Icon: HomeIcon },
      { name: 'inbox', Icon: InboxIcon },
      { name: 'workspaces', Icon: WorkspacesIcon },
      { name: 'projects', Icon: ProjectsIcon },
      { name: 'more', Icon: MoreIcon },
    ],
  },
  {
    title: 'Controls',
    icons: [
      { name: 'search', Icon: SearchIcon },
      { name: 'close', Icon: CloseIcon },
      { name: 'check', Icon: CheckIcon },
      { name: 'chevronDown', Icon: ChevronDownIcon },
      { name: 'chevronRight', Icon: ChevronRightIcon },
    ],
  },
]

const sizes = ['12', '14', '16', '18', '20', '24'] as const satisfies readonly IconSize[]

function Icons() {
  return (
    <main className={page}>
      {groups.map((g) => (
        <section key={g.title} className={group}>
          <h2 className={heading}>{g.title}</h2>
          <div className={grid}>
            {g.icons.map(({ name, Icon }) => (
              <figure key={name} className={cell} data-testid={`icon-${name}`}>
                <Icon />
                <figcaption className={label}>{name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
      <section className={group}>
        <h2 className={heading}>Sizes</h2>
        <div className={row} data-testid="sizes">
          {sizes.map((s) => (
            <SkillIcon key={s} size={s} />
          ))}
        </div>
      </section>
      <section className={group}>
        <h2 className={heading}>With a title</h2>
        <div className={row}>
          <SearchIcon size="20" title="Search" />
          <span data-testid="blank-title">
            <CloseIcon size="20" title={' \n '} />
          </span>
        </div>
      </section>
    </main>
  )
}

const svgIn = (el: HTMLElement) => {
  const svg = el.querySelector('svg')
  if (!(svg instanceof SVGSVGElement)) throw new Error('no svg')
  return svg
}

const meta = {
  title: 'Foundations/Icons',
  component: Icons,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const all = groups.flatMap((g) => g.icons)
    for (const { name } of all) {
      const cellEl = canvas.getByTestId(`icon-${name}`)
      const svg = svgIn(cellEl)
      const style = getComputedStyle(svg)
      // Each icon is drawn on the 24 grid and defaults to 24 px.
      await expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
      await expect(svg.getBoundingClientRect().width).toBe(24)
      await expect(svg.getBoundingClientRect().height).toBe(24)
      // Hidden from assistive technology when it has no title.
      await expect(svg.getAttribute('aria-hidden')).toBe('true')
      await expect(svg.querySelector('title')).toBeNull()
      // Each path draws something inside the 24 grid.
      const paths = Array.from(svg.querySelectorAll('path'))
      await expect(paths.length).toBeGreaterThan(0)
      for (const path of paths) {
        await expect(path.getTotalLength()).toBeGreaterThan(0)
        const box = path.getBBox()
        await expect(box.x).toBeGreaterThanOrEqual(0)
        await expect(box.y).toBeGreaterThanOrEqual(0)
        await expect(box.x + box.width).toBeLessThanOrEqual(24)
        await expect(box.y + box.height).toBeLessThanOrEqual(24)
      }
      if (name === 'more') {
        // More is three filled dots, as in Figma 346:5607.
        await expect(style.fill).toBe(getComputedStyle(cellEl).color)
        await expect(style.stroke).toBe('none')
      } else {
        await expect(style.fill).toBe('none')
        await expect(style.stroke).toBe(getComputedStyle(cellEl).color)
        await expect(style.strokeLinecap).toBe('round')
        await expect(style.strokeLinejoin).toBe('round')
        const nav = ['home', 'inbox', 'workspaces', 'projects'].includes(name)
        await expect(style.strokeWidth).toBe(nav ? '1.8px' : '2px')
      }
    }
    // The size prop maps to the sizes.icon tokens.
    const sized = Array.from(canvas.getByTestId('sizes').querySelectorAll('svg'))
    await expect(sized.map((s) => s.getBoundingClientRect().width)).toEqual([12, 14, 16, 18, 20, 24])
    await expect(sized.map((s) => s.getBoundingClientRect().height)).toEqual([12, 14, 16, 18, 20, 24])
    // A title names the icon and shows it to assistive technology.
    const named = canvas.getByRole('img', { name: 'Search' })
    await expect(named.getAttribute('aria-hidden')).toBeNull()
    await expect(named.getBoundingClientRect().width).toBe(20)
    // A title of only spaces names nothing, so the icon stays hidden.
    const blank = svgIn(canvas.getByTestId('blank-title'))
    await expect(blank.getAttribute('aria-hidden')).toBe('true')
    await expect(blank.getAttribute('role')).toBeNull()
  },
} satisfies Meta<typeof Icons>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }
