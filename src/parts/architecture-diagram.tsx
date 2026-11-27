import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { architectureDiagram } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(architectureDiagram)
const Root = withProvider('figure', 'root')
const Body = withContext('div', 'body')
const Svg = withContext('svg', 'svg')
const Shape = withContext('path', 'shape')
const Mark = withContext('path', 'mark')
const Dot = withContext('path', 'dot')
const Name = withContext('text', 'name')
const Type = withContext('text', 'type')
const Arrow = withContext('path', 'arrow')
const Head = withContext('path', 'head')
const ArrowLabel = withContext('text', 'arrowLabel')
const Boundary = withContext('rect', 'boundary')
const BoundaryLabel = withContext('text', 'boundaryLabel')
const Hint = withContext('p', 'hint')
const Legend = withContext('ul', 'legend')
const LegendItem = withContext('li', 'legendItem')
const Caption = withContext('figcaption', 'caption')
const Text = withContext('div', 'text')

/** The shapes of a diagram part (the design notes' set, Figma legend 224:204). */
export type DiagramShape = 'device' | 'service' | 'webApp' | 'terminalApp' | 'package' | 'dataStore' | 'folder' | 'file' | 'buildStep'

/** A point in the laid-out diagram, in px from its top left. */
export type DiagramPoint = { x: number; y: number }

/** A part at its laid-out box: its name and type line ("Server · Hono on Node"), its shape, and whether it is our code. */
export type DiagramPart = { id: string; name: string; typeLine: string; shape: DiagramShape; ours: boolean; x: number; y: number; width: number; height: number }

/** A dashed outline with its label, such as the Mac or a repository. */
export type DiagramBoundary = { id: string; label: string; x: number; y: number; width: number; height: number }

/** A labelled arrow from the part that starts the call to the part it calls, along `points`, with its label at `labelAt`. */
export type DiagramArrow = { id: string; from: string; to: string; label: string; points: readonly DiagramPoint[]; labelAt: DiagramPoint }

export type ArchitectureDiagramProps = {
  /** The figure's name, such as "How the system works". The page draws it in its heading; here it names the figure. */
  title: string
  /** The line under the diagram: its view, commit and date. */
  caption?: string | undefined
  /** The laid-out size in px. */
  width: number
  height: number
  parts: readonly DiagramPart[]
  boundaries?: readonly DiagramBoundary[] | undefined
  arrows: readonly DiagramArrow[]
  /** Shown under the drawing while it is wider than its box, such as "Scroll sideways to see the whole diagram." */
  scrollHint?: string | undefined
}

/** The legend's name of each shape, in the legend's order. */
export const diagramShapeNames = {
  device: 'Device',
  package: 'Package',
  service: 'Service or system',
  webApp: 'Web app',
  terminalApp: 'Terminal app',
  folder: 'Folder of files',
  dataStore: 'Data store',
  file: 'File or schema',
  buildStep: 'Build step',
} as const satisfies Record<DiagramShape, string>

// The outline of a shape in a w by h box, and the marks on it, scaled by k (1 in the diagram, smaller in the legend).
// Sizes from Figma 224:166 to 224:201 and 228:182, in the diagram's base units.
function outline(shape: DiagramShape, w: number, h: number, k: number): string {
  const r = (rx: number) => `M${String(rx)} 0H${String(w - rx)}A${String(rx)} ${String(rx)} 0 0 1 ${String(w)} ${String(rx)}V${String(h - rx)}A${String(rx)} ${String(rx)} 0 0 1 ${String(w - rx)} ${String(h)}H${String(rx)}A${String(rx)} ${String(rx)} 0 0 1 0 ${String(h - rx)}V${String(rx)}A${String(rx)} ${String(rx)} 0 0 1 ${String(rx)} 0Z`
  switch (shape) {
    case 'device':
      return r(Math.min(11 * k, h / 2))
    case 'buildStep':
      return r(h / 2)
    case 'dataStore': {
      const ry = 5 * k
      return `M0 ${String(ry)}A${String(w / 2)} ${String(ry)} 0 0 1 ${String(w)} ${String(ry)}V${String(h - ry)}A${String(w / 2)} ${String(ry)} 0 0 1 0 ${String(h - ry)}Z`
    }
    case 'folder': {
      const tab = Math.min(37 * k, w / 3)
      const drop = 6.5 * k
      return `M0 ${String(h)}V0H${String(tab)}L${String(tab + drop)} ${String(drop)}H${String(w)}V${String(h)}Z`
    }
    case 'file': {
      const f = 10 * k
      return `M0 0H${String(w - f)}L${String(w)} ${String(f)}V${String(h)}H0Z`
    }
    case 'service':
    case 'package':
    case 'webApp':
    case 'terminalApp':
      return r(Math.min(2 * k, h / 2))
  }
}

// The marks on a shape (bars, glyphs, the tape, the fold), and the top of the room the text is centred in.
// A dot of radius r at (x, y), as a path, so the filled marks are one element type.
const dot = (x: number, y: number, r: number) => `M${String(x - r)} ${String(y)}a${String(r)} ${String(r)} 0 1 0 ${String(2 * r)} 0a${String(r)} ${String(r)} 0 1 0 ${String(-2 * r)} 0Z`

function marks(shape: DiagramShape, w: number, h: number, k: number): { lines: string[]; dots: string[]; top: number; left: number } {
  const bar = 11 * k
  switch (shape) {
    case 'webApp':
      return { lines: [`M0 ${String(bar)}H${String(w)}`], dots: [0, 1, 2].map((i) => dot((6 + 5.6 * i) * k, 5.5 * k, 1.6 * k)), top: bar, left: 10 }
    case 'terminalApp':
      return { lines: [`M0 ${String(bar)}H${String(w)}`, `M${String(5 * k)} ${String(3 * k)}l${String(2.5 * k)} ${String(2.5 * k)}l${String(-2.5 * k)} ${String(2.5 * k)}M${String(9 * k)} ${String(8 * k)}h${String(4 * k)}`], dots: [], top: bar, left: 10 }
    case 'package': {
      // The tape (224:173): 13 by 8, in the middle of the top edge, over the line under it.
      const tape = 13 * k
      return { lines: [`M0 ${String(8 * k)}H${String(w)}`], dots: [`M${String((w - tape) / 2)} 0h${String(tape)}v${String(8 * k)}h${String(-tape)}Z`], top: 8 * k, left: 10 }
    }
    case 'dataStore':
      return { lines: [`M0 ${String(5 * k)}A${String(w / 2)} ${String(5 * k)} 0 0 0 ${String(w)} ${String(5 * k)}`], dots: [], top: 10 * k, left: 10 }
    case 'folder':
      return { lines: [], dots: [], top: 6.5 * k, left: 10 }
    case 'file': {
      const f = 10 * k
      return { lines: [`M${String(w - f)} 0V${String(f)}H${String(w)}`], dots: [], top: 0, left: 10 }
    }
    case 'device': {
      // A phone glyph at the left (224:167): 16 by 32, 10 in, with a home bar.
      if (k < 1) return { lines: [], dots: [], top: 0, left: 10 }
      const gh = Math.min(32, h - 20)
      const gx = 10
      const gy = (h - gh) / 2
      return { lines: [`M${String(gx + 3)} ${String(gy)}h10a3 3 0 0 1 3 3v${String(gh - 6)}a3 3 0 0 1 -3 3h-10a3 3 0 0 1 -3 -3v${String(-(gh - 6))}a3 3 0 0 1 3 -3Z`, `M${String(gx + 6)} ${String(gy + gh - 4)}h4`], dots: [], top: 0, left: 34 }
    }
    case 'buildStep':
      return { lines: [], dots: [], top: 0, left: 16 }
    case 'service':
      return { lines: [], dots: [], top: 0, left: 10 }
  }
}

function ShapeDrawing({ shape, w, h, k }: { shape: DiagramShape; w: number; h: number; k: number }) {
  const m = marks(shape, w, h, k)
  return (
    <>
      <Shape d={outline(shape, w, h, k)} />
      {m.lines.map((d) => (
        <Mark key={d} d={d} />
      ))}
      {m.dots.map((d) => (
        <Dot key={d} d={d} />
      ))}
    </>
  )
}

function PartDrawing({ part }: { part: DiagramPart }) {
  const m = marks(part.shape, part.width, part.height, 1)
  const middle = m.top + (part.height - m.top) / 2
  const typed = part.typeLine !== ''
  return (
    <g transform={`translate(${String(part.x)} ${String(part.y)})`} data-ours={part.ours ? '' : undefined} data-shape={part.shape}>
      <ShapeDrawing shape={part.shape} w={part.width} h={part.height} k={1} />
      <Name x={m.left} y={typed ? middle - 7 : middle} dominantBaseline="central">
        {part.name}
      </Name>
      {typed ? (
        <Type x={m.left} y={middle + 9} dominantBaseline="central">
          {part.typeLine}
        </Type>
      ) : null}
    </g>
  )
}

// A legend icon: 30 by 20 (224:208).
function LegendIcon({ children, ours = false }: { children: ReactNode; ours?: boolean }) {
  return (
    <svg width="30" height="20" viewBox="-0.5 -0.5 31 21" aria-hidden="true">
      <g data-ours={ours ? '' : undefined}>{children}</g>
    </svg>
  )
}

const legendShapes = Object.keys(diagramShapeNames).filter((s): s is DiagramShape => s in diagramShapeNames)

/**
 * A diagram that the server has laid out: each part as its shape at its box, with its name and type line; dashed
 * boundaries with their labels; arrows with a head at the part they point to and their labels. Our code has the
 * accent fill and a third party the neutral fill. Under it are the legend of the shapes in use (and Our code, Third
 * party and Boundary when used) and the caption. The drawing is hidden from screen readers, and a list carries its
 * parts and arrows (R15). When the drawing is wider than its box, the box scrolls sideways and shows `scrollHint` (R16).
 */
export function ArchitectureDiagram({ title, caption, width, height, parts, boundaries = [], arrows, scrollHint }: ArchitectureDiagramProps) {
  const id = useId()
  const head = `${id}-head`
  const hintId = `${id}-hint`
  const body = useRef<HTMLDivElement>(null)
  const [scrolls, setScrolls] = useState(false)
  useLayoutEffect(() => {
    const box = body.current
    if (box === null) return
    const measure = () => {
      setScrolls(box.scrollWidth > box.clientWidth + 1)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    return () => {
      observer.disconnect()
    }
  }, [width])
  const names = new Map(parts.map((p) => [p.id, p.name]))
  const used = new Set(parts.map((p) => p.shape))
  const hasOurs = parts.some((p) => p.ours)
  const hasTheirs = parts.some((p) => !p.ours)
  const hinted = scrolls && scrollHint !== undefined && scrollHint !== ''
  return (
    <Root aria-label={title}>
      <Body
        ref={body}
        role="group"
        aria-label={title}
        tabIndex={scrolls ? 0 : undefined}
        aria-describedby={hinted ? hintId : undefined}
      >
        <Svg width={width} height={height} viewBox={`0 0 ${String(width)} ${String(height)}`} aria-hidden="true" data-text-fixed="">
          <defs>
            <marker id={head} viewBox="0 0 8 8" refX="8" refY="4" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <Head d="M0 0L8 4L0 8Z" />
            </marker>
          </defs>
          {boundaries.map((b) => (
            <g key={b.id} transform={`translate(${String(b.x)} ${String(b.y)})`}>
              <Boundary width={b.width} height={b.height} rx="8" />
              <Mark d="M11 7h12a1.5 1.5 0 0 1 1.5 1.5v6.5h-15v-6.5a1.5 1.5 0 0 1 1.5 -1.5ZM8 17h19" />
              <BoundaryLabel x="32" y="12" dominantBaseline="central">
                {b.label}
              </BoundaryLabel>
            </g>
          ))}
          {arrows.map((a) => (
            <g key={a.id}>
              <Arrow d={a.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${String(p.x)} ${String(p.y)}`).join('')} markerEnd={`url(#${head})`} />
              <ArrowLabel x={a.labelAt.x} y={a.labelAt.y} dominantBaseline="central">
                {a.label}
              </ArrowLabel>
            </g>
          ))}
          {parts.map((p) => (
            <PartDrawing key={p.id} part={p} />
          ))}
        </Svg>
      </Body>
      {hinted ? <Hint id={hintId}>{scrollHint}</Hint> : null}
      <Legend aria-label="Legend">
        {legendShapes
          .filter((s) => used.has(s))
          .map((s) => (
            <LegendItem key={s} data-shape={s}>
              <LegendIcon>
                <ShapeDrawing shape={s} w={30} h={20} k={0.45} />
              </LegendIcon>
              {diagramShapeNames[s]}
            </LegendItem>
          ))}
        {hasOurs ? (
          <LegendItem data-shape="ours">
            <LegendIcon ours>
              <ShapeDrawing shape="service" w={30} h={20} k={0.45} />
            </LegendIcon>
            Our code
          </LegendItem>
        ) : null}
        {hasTheirs ? (
          <LegendItem data-shape="theirs">
            <LegendIcon>
              <ShapeDrawing shape="service" w={30} h={20} k={0.45} />
            </LegendIcon>
            Third party
          </LegendItem>
        ) : null}
        {boundaries.length > 0 ? (
          <LegendItem data-shape="boundary">
            <LegendIcon>
              <Boundary width="30" height="20" rx="4" />
            </LegendIcon>
            Boundary
          </LegendItem>
        ) : null}
      </Legend>
      {caption === undefined || caption === '' ? null : <Caption>{caption}</Caption>}
      <Text>
        <ul aria-label={`Parts of ${title}`}>
          {parts.map((p) => (
            <li key={p.id}>{p.typeLine === '' ? p.name : `${p.name}, ${p.typeLine}`}</li>
          ))}
        </ul>
        <ul aria-label={`Arrows of ${title}`}>
          {arrows.map((a) => (
            <li key={a.id}>{`${names.get(a.from) ?? a.from} → ${names.get(a.to) ?? a.to}: ${a.label}`}</li>
          ))}
        </ul>
      </Text>
    </Root>
  )
}
