import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import {
  ActionIcon,
  AgentIcon,
  ApproveIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArtifactsIcon,
  BookIcon,
  BrainIcon,
  BranchIcon,
  BubbleIcon,
  BulbIcon,
  CalendarIcon,
  ChartIcon,
  ChatIcon,
  CheckIcon,
  CheckMarkIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipIcon,
  ClockIcon,
  CloseBoldIcon,
  CloseCircleIcon,
  CloseIcon,
  CodeIcon,
  CompassIcon,
  CopyIcon,
  CpuIcon,
  CrossMarkIcon,
  EditIcon,
  ExternalLinkIcon,
  FeatureIcon,
  FileIcon,
  FilterIcon,
  FolderIcon,
  GridIcon,
  GripIcon,
  HomeIcon,
  HookIcon,
  InboxIcon,
  InfoIcon,
  LinearIcon,
  LinkIcon,
  LinkMarkIcon,
  LinksIcon,
  ListIcon,
  LockIcon,
  LoopIcon,
  MapIcon,
  MaximizeIcon,
  MoreIcon,
  MoveIcon,
  NextIcon,
  PanelIcon,
  PlayIcon,
  PlusIcon,
  ProjectsIcon,
  QuestionIcon,
  RefreshIcon,
  ReportIcon,
  ResetIcon,
  ReviewIcon,
  RuleIcon,
  SearchIcon,
  SettingsIcon,
  SkillIcon,
  SnoozeIcon,
  SortDescIcon,
  SortIcon,
  SparkFilledIcon,
  SparkIcon,
  SparkleIcon,
  SplitIcon,
  StopIcon,
  StopSignIcon,
  TagIcon,
  TerminalIcon,
  ToolkitIcon,
  TrashIcon,
  UndoIcon,
  WarningIcon,
  WorkflowIcon,
  WorkspacesIcon,
  type IconProps,
  type IconSize,
} from './icons'
import * as iconModule from './icons'

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
      { name: 'toolkit', Icon: ToolkitIcon },
      { name: 'artifacts', Icon: ArtifactsIcon },
      { name: 'brain', Icon: BrainIcon },
      { name: 'settings', Icon: SettingsIcon },
      { name: 'more', Icon: MoreIcon },
    ],
  },
  {
    title: 'Controls',
    icons: [
      { name: 'search', Icon: SearchIcon },
      { name: 'close', Icon: CloseIcon },
      { name: 'closeBold', Icon: CloseBoldIcon },
      { name: 'closeCircle', Icon: CloseCircleIcon },
      { name: 'check', Icon: CheckIcon },
      { name: 'chevronDown', Icon: ChevronDownIcon },
      { name: 'chevronRight', Icon: ChevronRightIcon },
    ],
  },
  {
    title: 'Composer',
    icons: [
      { name: 'clip', Icon: ClipIcon },
      { name: 'stop', Icon: StopIcon },
      { name: 'arrowUp', Icon: ArrowUpIcon },
    ],
  },
  {
    title: 'Actions',
    icons: [
      { name: 'plus', Icon: PlusIcon },
      { name: 'edit', Icon: EditIcon },
      { name: 'copy', Icon: CopyIcon },
      { name: 'trash', Icon: TrashIcon },
      { name: 'play', Icon: PlayIcon },
      { name: 'reset', Icon: ResetIcon },
      { name: 'snooze', Icon: SnoozeIcon },
      { name: 'move', Icon: MoveIcon },
      { name: 'maximize', Icon: MaximizeIcon },
      { name: 'grip', Icon: GripIcon },
      { name: 'chevronLeft', Icon: ChevronLeftIcon },
    ],
  },
  {
    title: 'Objects',
    icons: [
      { name: 'spark', Icon: SparkIcon },
      { name: 'sparkFilled', Icon: SparkFilledIcon },
      { name: 'sparkle', Icon: SparkleIcon },
      { name: 'file', Icon: FileIcon },
      { name: 'folder', Icon: FolderIcon },
      { name: 'tag', Icon: TagIcon },
      { name: 'link', Icon: LinkIcon },
      { name: 'linkMark', Icon: LinkMarkIcon },
      { name: 'links', Icon: LinksIcon },
      { name: 'lock', Icon: LockIcon },
      { name: 'branch', Icon: BranchIcon },
      { name: 'chat', Icon: ChatIcon },
      { name: 'bubble', Icon: BubbleIcon },
      { name: 'map', Icon: MapIcon },
      { name: 'linear', Icon: LinearIcon },
      { name: 'feature', Icon: FeatureIcon },
      { name: 'chart', Icon: ChartIcon },
      { name: 'clock', Icon: ClockIcon },
      { name: 'calendar', Icon: CalendarIcon },
      { name: 'cpu', Icon: CpuIcon },
      { name: 'book', Icon: BookIcon },
    ],
  },
  {
    title: 'Lists',
    icons: [
      { name: 'sort', Icon: SortIcon },
      { name: 'sortDesc', Icon: SortDescIcon },
      { name: 'filter', Icon: FilterIcon },
      { name: 'refresh', Icon: RefreshIcon },
      { name: 'list', Icon: ListIcon },
      { name: 'externalLink', Icon: ExternalLinkIcon },
      { name: 'undo', Icon: UndoIcon },
    ],
  },
  {
    title: 'Status',
    icons: [
      { name: 'warning', Icon: WarningIcon },
      { name: 'info', Icon: InfoIcon },
      { name: 'bulb', Icon: BulbIcon },
      { name: 'report', Icon: ReportIcon },
      { name: 'stopSign', Icon: StopSignIcon },
      { name: 'compass', Icon: CompassIcon },
    ],
  },
  {
    // The ✓ and ✗ characters in text (Toolkit D28 492:2185), which Glyph draws.
    title: 'Marks in text',
    icons: [
      { name: 'checkMark', Icon: CheckMarkIcon },
      { name: 'crossMark', Icon: CrossMarkIcon },
    ],
  },
  {
    title: 'Views',
    icons: [
      { name: 'panel', Icon: PanelIcon },
      { name: 'split', Icon: SplitIcon },
      { name: 'grid', Icon: GridIcon },
    ],
  },
  {
    title: 'Flow',
    icons: [
      { name: 'code', Icon: CodeIcon },
      { name: 'terminal', Icon: TerminalIcon },
      { name: 'loop', Icon: LoopIcon },
      { name: 'arrowDown', Icon: ArrowDownIcon },
      { name: 'arrowRight', Icon: ArrowRightIcon },
    ],
  },
]

const sizes = ['12', '16', '20', '24'] as const satisfies readonly IconSize[]

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

const filled = ['more', 'play', 'sparkFilled', 'closeBold']

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
    // Every icon the module exports is shown here, so the checks below cover it.
    const shown = new Set<unknown>(all.map(({ Icon }) => Icon))
    const missing = Object.entries(iconModule).filter(([key, value]) => key.endsWith('Icon') && !shown.has(value))
    await expect(missing.map(([key]) => key)).toEqual([])
    for (const { name } of all) {
      const cellEl = canvas.getByTestId(`icon-${name}`)
      const svg = svgIn(cellEl)
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
      // The paint is checked on each path, so a path cannot override it.
      const text = getComputedStyle(cellEl).color
      const nav = ['home', 'inbox', 'workspaces', 'projects', 'toolkit', 'artifacts', 'brain', 'settings'].includes(name)
      for (const path of paths) {
        const style = getComputedStyle(path)
        if (filled.includes(name)) {
          // More (346:5607), Play (346:397) and the filled spark (406:145) are filled, not stroked, as in Figma.
          await expect(style.fill).toBe(text)
          await expect(style.stroke).toBe('none')
        } else {
          await expect(style.fill).toBe('none')
          await expect(style.stroke).toBe(text)
          await expect(style.strokeLinecap).toBe('round')
          await expect(style.strokeLinejoin).toBe('round')
          await expect(style.strokeWidth).toBe(nav ? '1.8px' : '2px')
        }
      }
    }
    // Sort descending (346:175) is an upright arrow with its head at the bottom, beside the lines,
    // so it does not read as Filter's funnel or Sort's three lines.
    const sortDesc = svgIn(canvas.getByTestId('icon-sortDesc'))
    await expect(sortDesc.innerHTML).not.toBe(svgIn(canvas.getByTestId('icon-filter')).innerHTML)
    await expect(sortDesc.innerHTML).not.toBe(svgIn(canvas.getByTestId('icon-sort')).innerHTML)
    const [arrow, lines] = Array.from(sortDesc.querySelectorAll('path')).map((p) => p.getBBox())
    if (arrow === undefined || lines === undefined) throw new Error('sortDesc needs an arrow and lines')
    await expect(arrow.height).toBe(14)
    await expect(arrow.width).toBeLessThanOrEqual(6)
    await expect(arrow.x + arrow.width).toBeLessThan(lines.x)
    // Calendar (346:5328, the Snooze menu's "Pick a date and time…") is a 16 by 15 page with a line under its top
    // and two rings above it.
    const [sheet, rings] = Array.from(svgIn(canvas.getByTestId('icon-calendar')).querySelectorAll('path')).map((p) => p.getBBox())
    if (sheet === undefined || rings === undefined) throw new Error('calendar needs a page and rings')
    await expect([sheet.x, sheet.y, sheet.width, sheet.height]).toEqual([4, 5, 16, 15])
    await expect([rings.y, rings.height]).toEqual([3, 7])
    // Close circle (346:4201, the Inbox search clear button) is an x inside a circle of radius 9.
    const [ring, cross] = Array.from(svgIn(canvas.getByTestId('icon-closeCircle')).querySelectorAll('path')).map((p) => p.getBBox())
    if (ring === undefined || cross === undefined) throw new Error('closeCircle needs a circle and an x')
    await expect([ring.x, ring.y, ring.width, ring.height]).toEqual([3, 3, 18, 18])
    await expect([cross.x, cross.y, cross.width, cross.height]).toEqual([9, 9, 6, 6])
    // Close bold (403:8202, the clear button of a focused search field) is close's x 3 thick: two filled bars from 6
    // to 18 with round ends of radius 1.5, so each bar's box is the x's 12 plus 1.5 at each side.
    const bars = Array.from(svgIn(canvas.getByTestId('icon-closeBold')).querySelectorAll('path')).map((p) => p.getBBox())
    await expect(bars).toHaveLength(2)
    for (const bar of bars) {
      await expect([bar.x, bar.y, bar.width, bar.height].map((v) => Math.round(v * 100) / 100)).toEqual([4.5, 4.5, 15, 15])
    }
    const thin = svgIn(canvas.getByTestId('icon-close')).querySelector('path')?.getBBox()
    await expect([thin?.x, thin?.y, thin?.width, thin?.height]).toEqual([6, 6, 12, 12])
    // Settings is a gear centred on the 24 grid, its teeth from 3.14 to 20.86, with a round hole of radius 3.
    const [gear, hole] = Array.from(svgIn(canvas.getByTestId('icon-settings')).querySelectorAll('path')).map((p) => p.getBBox())
    if (gear === undefined || hole === undefined) throw new Error('settings needs a gear and a hole')
    await expect([gear.x, gear.y, gear.width, gear.height].map((v) => Math.round(v * 100) / 100)).toEqual([3.14, 3.14, 17.73, 17.73])
    await expect([hole.x, hole.y, hole.width, hole.height]).toEqual([9, 9, 6, 6])
    // The size prop maps to the sizes.icon tokens.
    const sized = Array.from(canvas.getByTestId('sizes').querySelectorAll('svg'))
    await expect(sized.map((s) => s.getBoundingClientRect().width)).toEqual([12, 16, 20, 24])
    await expect(sized.map((s) => s.getBoundingClientRect().height)).toEqual([12, 16, 20, 24])
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

// The link mark (Artifacts D2 403:500, T2 405:472) fills its box: Figma's 13 px frame is size 12 on the 4 px
// grid. LinkIcon at the same size keeps its links in the middle 15 of the 24 grid.
function LinkMarks() {
  return (
    <main className={page}>
      <div className={row}>
        <span data-testid="link-mark-12">
          <LinkMarkIcon size="12" />
        </span>
        <span data-testid="link-mark-16">
          <LinkMarkIcon size="16" />
        </span>
        <span data-testid="link-12">
          <LinkIcon size="12" />
        </span>
        <span data-testid="link-20">
          <LinkIcon size="20" />
        </span>
      </div>
    </main>
  )
}

// The gaps in px between the svg's box and the box its paths draw, the stroke included: [left, top, right, bottom].
const drawnGaps = (el: HTMLElement) => {
  const svg = svgIn(el)
  const boxes = Array.from(svg.querySelectorAll('path')).map((p) => p.getBBox())
  const half = Number.parseFloat(getComputedStyle(svg).strokeWidth) / 2
  const left = Math.min(...boxes.map((b) => b.x)) - half
  const top = Math.min(...boxes.map((b) => b.y)) - half
  const right = Math.max(...boxes.map((b) => b.x + b.width)) + half
  const bottom = Math.max(...boxes.map((b) => b.y + b.height)) + half
  const rect = svg.getBoundingClientRect()
  const scale = rect.width / 24
  return { size: [rect.width, rect.height], gaps: [left, top, 24 - right, 24 - bottom].map((g) => g * scale) }
}

const linkMarkPlay: StoryObj<typeof LinkMarks>['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  // The link mark fills its box within 1 px on each side, at the app's 12 and at 16.
  for (const [id, px] of [
    ['link-mark-12', 12],
    ['link-mark-16', 16],
  ] as const) {
    const { size, gaps } = drawnGaps(canvas.getByTestId(id))
    await expect(size).toEqual([px, px])
    for (const gap of gaps) {
      await expect(gap).toBeGreaterThanOrEqual(-0.01)
      await expect(gap).toBeLessThanOrEqual(1)
    }
  }
  // LinkIcon keeps its old drawing: 15.07 by 17.07 of the 24 grid in the middle (4.46, 3.46 from the sides).
  for (const [id, px] of [
    ['link-12', 12],
    ['link-20', 20],
  ] as const) {
    const { size, gaps } = drawnGaps(canvas.getByTestId(id))
    await expect(size).toEqual([px, px])
    const scale = px / 24
    const [left, top, right, bottom] = gaps
    await expect(left).toBeCloseTo(4.464 * scale, 2)
    await expect(top).toBeCloseTo(3.464 * scale, 2)
    await expect(right).toBeCloseTo(4.464 * scale, 2)
    await expect(bottom).toBeCloseTo(3.465 * scale, 2)
  }
}

export const LinkMarkDark: StoryObj<typeof LinkMarks> = {
  render: () => <LinkMarks />,
  globals: { mode: 'dark' },
  play: linkMarkPlay,
}
export const LinkMarkLight: StoryObj<typeof LinkMarks> = {
  render: () => <LinkMarks />,
  globals: { mode: 'light' },
  play: linkMarkPlay,
}
