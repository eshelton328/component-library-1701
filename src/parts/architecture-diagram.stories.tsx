import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { expectScrollAreas } from '../controls/scroll-area.testing'
import { ArchitectureDiagram, diagramShapeNames, type ArchitectureDiagramProps, type DiagramArrow, type DiagramPart, type DiagramShape } from './architecture-diagram'

// The card the page sets the diagram in (Figma 224:141: surface.pane, 12 radius, 12 by 16 padding).
const card = css({ bg: 'surface.pane', borderWidth: 'default', borderStyle: 'solid', borderColor: 'border.default', borderRadius: 'xl', px: '16', py: '12' })
const page = css({ bg: 'bg.canvas', p: '24', display: 'flex', flexDirection: 'column', gap: '24' })
// The phone's column (227:90): 358 wide with 16 padding, so the drawing's box is 324 wide.
const phone = css({ w: 'shell.popoverPicker' })

const w = 186
const h = 52
const part = (id: string, name: string, typeLine: string, shape: DiagramShape, ours: boolean, col: number, row: number, width = w): DiagramPart => ({
  id,
  name,
  typeLine,
  shape,
  ours,
  x: 24 + col * 206,
  y: 40 + row * 92,
  width,
  height: h,
})
// An arrow down from one part's bottom middle to another's top middle, with its label beside the middle.
const down = (id: string, from: DiagramPart, to: DiagramPart, label: string): DiagramArrow => {
  const a = { x: from.x + from.width / 2, y: from.y + h }
  const b = { x: to.x + to.width / 2, y: to.y }
  const mid = (a.y + b.y) / 2
  return { id, from: from.id, to: to.id, label, points: [a, { x: a.x, y: mid }, { x: b.x, y: mid }, b], labelAt: { x: b.x + 6, y: (mid + b.y) / 2 } }
}

// System (224:2): the devices, Tailscale, the server and its web app, the library, herdr and the stores, in the Mac.
const iphone = part('iphone', 'iPhone and iPad', 'Device · Safari', 'device', false, 1, 0)
const tailscale = part('tailscale', 'Tailscale Serve', 'Service · HTTPS proxy', 'service', false, 1, 1)
const web = part('web', 'the-bridge web', 'Web app · React on Vite', 'webApp', true, 0, 2)
const server = part('server', 'the-bridge server', 'Server · Hono on Node', 'service', true, 2, 2)
const library = part('library', 'component-library-1701', 'Package · React parts', 'package', true, 0, 3)
const herdr = part('herdr', 'herdr', 'Terminal app · panes', 'terminalApp', false, 1, 3)
const disk = part('disk', 'Disk stores', 'Data store · SQLite', 'dataStore', true, 2, 3)
const sessions = part('sessions', 'Claude Code', 'Folder · session files', 'folder', false, 1, 4)
const brain = part('brain', 'Brain', 'Folder · notes and records', 'folder', true, 2, 4)
const systemParts = [iphone, tailscale, web, server, library, herdr, disk, sessions, brain]
const system: ArchitectureDiagramProps = {
  title: 'How the system works',
  caption: 'Container view of NCC-1701. Generated from the code on main, 2026-11-26: package.json files, imports and config.',
  width: 640,
  height: 512,
  parts: systemParts,
  boundaries: [{ id: 'mac', label: 'Mac', x: 8, y: 106, width: 624, height: 398 }],
  arrows: [
    down('a1', iphone, tailscale, 'HTTPS on the tailnet'),
    down('a2', tailscale, web, 'serves'),
    down('a3', tailscale, server, '/api'),
    down('a4', web, library, 'imports'),
    down('a5', server, disk, 'reads and writes'),
    down('a6', server, herdr, 'runs chats'),
    down('a7', herdr, sessions, 'writes'),
    down('a8', disk, brain, 'reads'),
  ],
}

// The-bridge's component view (230:2): its packages and files in the repository.
const contract = part('contract', 'contract/', 'File · API schema', 'file', true, 1, 0)
const webPkg = part('web-pkg', 'web', 'Web app · React on Vite', 'webApp', true, 0, 1)
const serverPkg = part('server-pkg', 'server', 'Service · Hono on Node', 'service', true, 2, 1)
const lib = part('lib', 'component-library-1701', 'Package · from GitHub Packages', 'package', false, 0, 2)
const db = part('db', 'the-bridge.db', 'Data store · SQLite', 'dataStore', true, 2, 2)
const repository: ArchitectureDiagramProps = {
  title: 'How the-bridge works',
  caption: 'Component view of the-bridge. Generated from the code on main, 2026-11-26.',
  width: 640,
  height: 328,
  parts: [contract, webPkg, serverPkg, lib, db],
  boundaries: [{ id: 'repo', label: 'the-bridge repository', x: 8, y: 8, width: 624, height: 312 }],
  arrows: [down('b1', contract, webPkg, 'types'), down('b2', contract, serverPkg, 'routes'), down('b3', webPkg, lib, 'imports'), down('b4', serverPkg, db, 'reads and writes')],
}

// Every shape, ours and a third party's, and a build step (228:182).
const shapes = Object.keys(diagramShapeNames).filter((s): s is DiagramShape => s in diagramShapeNames)
const everyShape: ArchitectureDiagramProps = {
  title: 'Every shape',
  caption: 'Every shape, as our code and as a third party.',
  width: 640,
  height: 48 + 3 * 92,
  boundaries: [{ id: 'all', label: 'A boundary', x: 8, y: 8, width: 624, height: 32 + 3 * 92 }],
  parts: shapes.map((s, i) => part(s, diagramShapeNames[s], `${i % 2 === 0 ? 'Our code' : 'Third party'} · ${s}`, s, i % 2 === 0, i % 3, Math.floor(i / 3))),
  arrows: [down('s1', part('device', '', '', 'device', false, 0, 0), part('webApp', '', '', 'webApp', false, 0, 1), 'calls')],
}

const meta = {
  title: 'Data display/Architecture diagram',
  component: ArchitectureDiagram,
  args: system,
  render: (args) => (
    <main className={page}>
      <div className={card} data-testid="card">
        <ArchitectureDiagram {...args} />
      </div>
    </main>
  ),
} satisfies Meta<typeof ArchitectureDiagram>
export default meta
type Story = StoryObj<typeof meta>

const legendNames = (root: HTMLElement) => within(root).getAllByRole('listitem').filter((li) => li.closest('ul[aria-label="Legend"]') !== null).map((li) => li.textContent)
const listed = (root: HTMLElement, name: string) => within(within(root).getByRole('list', { name })).getAllByRole('listitem').map((li) => li.textContent)

// The legend has only the shapes in use, in the legend's order, then Our code, Third party and Boundary when used;
// the list for screen readers has each part and each arrow; the drawing is hidden from them.
const expectText = async (root: HTMLElement, props: ArchitectureDiagramProps) => {
  const used = new Set(props.parts.map((p) => p.shape))
  const owners = [props.parts.some((p) => p.ours) ? 'Our code' : null, props.parts.some((p) => !p.ours) ? 'Third party' : null]
  const expected = [...shapes.filter((s) => used.has(s)).map((s) => diagramShapeNames[s]), ...owners, (props.boundaries ?? []).length > 0 ? 'Boundary' : null]
  await expect(legendNames(root)).toEqual(expected.filter((n) => n !== null))
  await expect(listed(root, `Parts of ${props.title}`)).toEqual(props.parts.map((p) => `${p.name}, ${p.typeLine}`))
  const names = new Map(props.parts.map((p) => [p.id, p.name]))
  await expect(listed(root, `Arrows of ${props.title}`)).toEqual(props.arrows.map((a) => `${names.get(a.from) ?? ''} → ${names.get(a.to) ?? ''}: ${a.label}`))
  await expect(root.querySelector('.architecture-diagram__svg')).toHaveAttribute('aria-hidden', 'true')
  await expect(within(root).getByRole('figure', { name: props.title })).toBeVisible()
}

const systemPlay: Story['play'] = async ({ canvasElement }) => {
  await expectText(canvasElement, system)
  // Each part is drawn as its shape, with our code on the accent fill.
  await expect([...canvasElement.querySelectorAll('[data-shape]')].filter((g) => g.tagName === 'g').length).toBe(systemParts.length)
  const body = canvasElement.querySelector('.architecture-diagram__body')
  if (!(body instanceof HTMLElement)) throw new Error('no body')
  // Wide enough: no scroll, no hint, no tab stop.
  await expect(body.scrollWidth).toBeLessThanOrEqual(body.clientWidth)
  await expect(within(canvasElement).queryByText('Scroll sideways to see the whole diagram.')).toBeNull()
  await expect(body).not.toHaveAttribute('tabindex')
}

/** System on desktop (Figma 224:2): the Mac boundary, our code in accent and third parties in neutral. */
export const SystemDark: Story = { args: { ...system, scrollHint: 'Scroll sideways to see the whole diagram.' }, play: systemPlay, globals: { mode: 'dark' } }
export const SystemLight: Story = { args: { ...system, scrollHint: 'Scroll sideways to see the whole diagram.' }, play: systemPlay, globals: { mode: 'light' } }

/** A repository's component view (230:2): files, packages, a web app and a data store in the repository boundary. */
export const RepositoryDark: Story = {
  args: repository,
  play: async ({ canvasElement }) => {
    await expectText(canvasElement, repository)
  },
  globals: { mode: 'dark' },
}

// The phone (227:2): the box is 324 wide and the drawing 640, so the box scrolls sideways with its hint under it.
const phonePlay: Story['play'] = async ({ canvasElement }) => {
  await expectText(canvasElement, system)
  const body = canvasElement.querySelector('.architecture-diagram__body')
  if (!(body instanceof HTMLElement)) throw new Error('no body')
  await expect(body.scrollWidth).toBeGreaterThan(body.clientWidth)
  const hint = within(canvasElement).getByText('Scroll sideways to see the whole diagram.')
  await expect(hint).toBeVisible()
  await expect(body).toHaveAttribute('tabindex', '0')
  await expect(body).toHaveAttribute('aria-describedby', hint.id)
  // The page does not scroll sideways; only the drawing's box does.
  await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth)
  await expectScrollAreas(canvasElement, 'x', '.architecture-diagram__body')
  body.scrollLeft = 200
  await expect(body.scrollLeft).toBeGreaterThan(0)
}
const phoneRender: Story['render'] = (args) => (
  <main className={page}>
    <div className={phone}>
      <div className={card} data-testid="card">
        <ArchitectureDiagram {...args} />
      </div>
    </div>
  </main>
)
/** System on the phone (227:2): the drawing scrolls sideways in its own box, with the hint under it (R16). */
export const PhoneDark: Story = { args: { ...system, scrollHint: 'Scroll sideways to see the whole diagram.' }, render: phoneRender, play: phonePlay, globals: { mode: 'dark' } }
export const PhoneLight: Story = { args: { ...system, scrollHint: 'Scroll sideways to see the whole diagram.' }, render: phoneRender, play: phonePlay, globals: { mode: 'light' } }

// sRGB channels and alpha of a computed colour: rgb(), rgba() or color(srgb ...).
const channels = (value: string): [number, number, number, number] => {
  const nums = (value.match(/[\d.]+/g) ?? []).map(Number)
  if (value.startsWith('color(srgb')) return [(nums[0] ?? 0) * 255, (nums[1] ?? 0) * 255, (nums[2] ?? 0) * 255, nums[3] ?? 1]
  return [nums[0] ?? 0, nums[1] ?? 0, nums[2] ?? 0, nums[3] ?? 1]
}
const over = (top: string, under: [number, number, number]): [number, number, number] => {
  const [r, g, b, a] = channels(top)
  return [r * a + under[0] * (1 - a), g * a + under[1] * (1 - a), b * a + under[2] * (1 - a)]
}
const luminance = (rgb: [number, number, number]) => {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0)
}
const ratio = (a: [number, number, number], b: [number, number, number]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05)
}

// Every shape, ours and a third party's: each outline, mark, arrow and boundary keeps 3:1 against the card.
const shapesPlay: Story['play'] = async ({ canvasElement }) => {
  await expectText(canvasElement, everyShape)
  const cardBox = canvasElement.querySelector('[data-testid=card]')
  const pageBox = canvasElement.querySelector('main')
  if (!(cardBox instanceof HTMLElement) || !(pageBox instanceof HTMLElement)) throw new Error('no card')
  const behind = over(getComputedStyle(cardBox).backgroundColor, over(getComputedStyle(pageBox).backgroundColor, [0, 0, 0]))
  const strokes = [...canvasElement.querySelectorAll('.architecture-diagram__svg :is(.architecture-diagram__shape, .architecture-diagram__arrow, .architecture-diagram__boundary)')]
  await expect(strokes.length).toBeGreaterThan(shapes.length)
  for (const el of strokes) {
    const s = getComputedStyle(el)
    const fill = s.fill.startsWith('none') ? behind : over(s.fill, behind)
    await expect({ el: el.getAttribute('class'), ok: ratio(over(s.stroke, fill), behind) >= 3 }).toEqual({ el: el.getAttribute('class'), ok: true })
  }
}
/** Every shape in the set (the legend 224:204 and the build step 228:182), as our code and as a third party's. */
export const ShapesDark: Story = { args: everyShape, play: shapesPlay, globals: { mode: 'dark' } }
export const ShapesLight: Story = { args: everyShape, play: shapesPlay, globals: { mode: 'light' } }
