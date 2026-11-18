import { type KeyboardEvent, type ReactNode, type RefObject, useEffect, useId, useRef } from 'react'
import { AgentIcon, ChevronRightIcon, CloseIcon, HookIcon, type IconProps, RuleIcon, SkillIcon, WorkflowIcon } from '../foundations/icons'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { mapGraph, mapLegend, mapNode, mapSelectionCard } from '../../styled-system/recipes'
import { Button } from '../controls/button'
import { TruncatedText } from '../controls/tooltip'
import { type Box, linkRoute, uprightRoute } from './map-graph-route'
import type { ToolkitKind } from './meta-line'

const kindIcons: Record<ToolkitKind, (props: IconProps) => React.JSX.Element> = {
  skill: SkillIcon,
  agent: AgentIcon,
  rule: RuleIcon,
  workflow: WorkflowIcon,
  hook: HookIcon,
}

const kindNames: Record<ToolkitKind, string> = { skill: 'Skill', agent: 'Agent', rule: 'Rule', workflow: 'Workflow', hook: 'Hook' }

/** How a node shows: `lit` (the default), `dim` (not linked to the selection) or `selected`. */
export type MapNodeState = 'lit' | 'dim' | 'selected'

/**
 * The border of a lit node: `kind` (the default) in the full kind colour, as
 * on the toolkit map (D2); `muted` in kindBorder, about 60 % of it, for the
 * Links graph's nodes that are not the open item (D19 493:84); `faint` in
 * kindBorderFaint, about 45 %, for the nodes of the Links panels' rows (D19
 * 482:549). The icon stays in the full kind colour, and a dim or selected
 * node keeps its own border.
 */
export type MapNodeTone = 'kind' | 'muted' | 'faint'

/**
 * How a node draws its name: `mono` (the default) in mono 12 from the
 * node's start; `label` in the label style (14/20), with the icon and name
 * centred, for the open item on the Links graph (D19 writer 493:78).
 */
export type MapNodeLabelStyle = 'mono' | 'label'

const node = createSlotRecipeContext(mapNode)
const NodeRoot = node.withProvider('button', 'root')
const NodeIcon = node.withContext('span', 'icon')
const NodeLabel = node.withContext('span', 'label')
const NodeMeta = node.withContext('span', 'meta')

export type MapNodeProps = {
  /** The item name, such as "writer". */
  label: string
  /** The toolkit kind; it sets the icon and the border colour. */
  kind: ToolkitKind
  /** Short text at the end of the node in the kind colour, such as "every session". */
  meta?: string | undefined
  /** `lit` (the default), `dim` or `selected`. */
  state?: MapNodeState | undefined
  /** The border of a lit node: `kind` (the default), `muted` or `faint`; see `MapNodeTone`. */
  tone?: MapNodeTone | undefined
  /** `mono` (the default) or `label`; see `MapNodeLabelStyle`. */
  labelStyle?: MapNodeLabelStyle | undefined
  /** Called when the node is clicked, or pressed with Enter or Space. */
  onClick?: (() => void) | undefined
  /** Called on a key press, before the button handles it. */
  onKeyDown?: ((event: KeyboardEvent<HTMLButtonElement>) => void) | undefined
  /** The id of an element that describes the node, such as its links. */
  describedBy?: string | undefined
}

/**
 * One item on the toolkit map: a button with the kind icon, the name and
 * an optional meta text. It fills the box it is placed in. A label too long
 * for the node ends with an ellipsis and shows in full in a tooltip on hover
 * and keyboard focus. `aria-pressed`
 * tells assistive technology whether it is the selected item.
 */
export function MapNode({ label, kind, meta, state = 'lit', tone = 'kind', labelStyle = 'mono', onClick, onKeyDown, describedBy }: MapNodeProps) {
  const Icon = kindIcons[kind]
  return (
    <NodeRoot
      type="button"
      kind={kind}
      labelStyle={labelStyle}
      aria-pressed={state === 'selected'}
      aria-describedby={describedBy}
      data-state={state}
      data-tone={tone}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <NodeIcon>
        <Icon size="16" />
      </NodeIcon>
      <NodeLabel>
        <TruncatedText>{label}</TruncatedText>
      </NodeLabel>
      {meta !== undefined && meta !== '' ? <NodeMeta>{meta}</NodeMeta> : null}
    </NodeRoot>
  )
}

const legend = createSlotRecipeContext(mapLegend)
const LegendRoot = legend.withProvider('div', 'root')
const LegendList = legend.withContext('ul', 'list')
const LegendItem = legend.withContext('li', 'item')
const LegendIcon = legend.withContext('span', 'icon')
const LegendHint = legend.withContext('span', 'hint')

export type MapLegendProps = {
  /** The kinds to list, in order. Defaults to rule, hook, skill, agent and workflow, as in Figma. */
  kinds?: readonly ToolkitKind[] | undefined
  /** A hint after the kinds, such as "Select an item to light its links". */
  hint?: string | undefined
}

/** The key of the map: each kind's icon in its colour and its name, then a hint. */
export function MapLegend({ kinds = ['rule', 'hook', 'skill', 'agent', 'workflow'], hint }: MapLegendProps) {
  return (
    <LegendRoot>
      <LegendList aria-label="Kinds">
        {kinds.map((kind) => {
          const Icon = kindIcons[kind]
          return (
            <LegendItem key={kind}>
              <LegendIcon data-kind={kind}>
                <Icon size="12" />
              </LegendIcon>
              {kindNames[kind]}
            </LegendItem>
          )
        })}
      </LegendList>
      {hint !== undefined && hint !== '' ? <LegendHint>{hint}</LegendHint> : null}
    </LegendRoot>
  )
}

const card = createSlotRecipeContext(mapSelectionCard)
const CardRoot = card.withProvider('section', 'root')
const CardTitle = card.withContext('div', 'title')
const CardIcon = card.withContext('span', 'icon')
const CardName = card.withContext('h3', 'name')
const CardKind = card.withContext('span', 'kind')
const CardClose = card.withContext('span', 'close')
const CardDescription = card.withContext('p', 'description')
const CardCounts = card.withContext('p', 'counts')
const CardAction = card.withContext('div', 'action')

export type MapSelectionCardProps = {
  /** The item name, such as "writer". */
  name: string
  /** The toolkit kind; it sets the icon, the kind text and their colour. */
  kind: ToolkitKind
  /** One or two lines on what the item does. */
  description?: string | undefined
  /** How many files the item links to. */
  linksTo?: number | undefined
  /** How many files link to the item. */
  linkedFrom?: number | undefined
  /** The label of the open button, such as "Open writer". No button when not set. */
  actionLabel?: string | undefined
  /** Called by the open button. */
  onAction?: (() => void) | undefined
  /** Called by the close button. No close button when not set. */
  onClose?: (() => void) | undefined
}

/** The card for the selected map item: its name and kind, what it does, its link counts and an open button. */
export function MapSelectionCard({ name, kind, description, linksTo, linkedFrom, actionLabel, onAction, onClose }: MapSelectionCardProps) {
  const Icon = kindIcons[kind]
  const counts = [linksTo === undefined ? '' : `→ links to ${String(linksTo)}`, linkedFrom === undefined ? '' : `← linked from ${String(linkedFrom)}`].filter((c) => c !== '')
  return (
    <CardRoot kind={kind} aria-label={name}>
      <CardTitle>
        <CardIcon>
          <Icon size="16" />
        </CardIcon>
        <CardName>
          <TruncatedText>{name}</TruncatedText>
        </CardName>
        <CardKind>{kindNames[kind]}</CardKind>
        {onClose === undefined ? null : (
          <CardClose>
            <Button variant="secondary" size="sm" iconOnly aria-label={`Close ${name}`} onClick={onClose}>
              <CloseIcon size="12" />
            </Button>
          </CardClose>
        )}
      </CardTitle>
      {description !== undefined && description !== '' ? <CardDescription>{description}</CardDescription> : null}
      {counts.length > 0 ? <CardCounts>{counts.join('   ')}</CardCounts> : null}
      {actionLabel !== undefined && actionLabel !== '' ? (
        <CardAction>
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
            <ChevronRightIcon size="12" />
          </Button>
        </CardAction>
      ) : null}
    </CardRoot>
  )
}

const graph = createSlotRecipeContext(mapGraph)
const GraphRoot = graph.withProvider('div', 'root')
const Scroller = graph.withContext('div', 'scroller')
const Svg = graph.withContext('svg', 'svg')
const ColumnLabel = graph.withContext('text', 'columnLabel')
const Edge = graph.withContext('path', 'edge')
const EdgeEnd = graph.withContext('circle', 'edgeEnd')
const NodeBox = graph.withContext('foreignObject', 'node')
const Links = graph.withContext('span', 'links')
const Legend = graph.withContext('div', 'legend')
const Card = graph.withContext('div', 'card')

export type MapGraphNode = {
  /** A unique id, used by edges and `selectedId`. */
  id: string
  /** The item name. */
  label: string
  /** The toolkit kind. */
  kind: ToolkitKind
  /** Short text at the end of the node, such as "every session". */
  meta?: string | undefined
  /** The left edge of the node on the canvas, in px. */
  x: number
  /** The top edge of the node on the canvas, in px. */
  y: number
  /**
   * The width and height of this node, in px, in place of the map's
   * `nodeSize`; its lines meet its own edges. The Links graph's open item is
   * 150 × 40 where the others are 180 × 32 (D19 493:78).
   */
  size?: { width: number; height: number } | undefined
  /** How the node draws its name: `mono` (the default) or `label`, as the open item on the Links graph. */
  labelStyle?: MapNodeLabelStyle | undefined
}

export type MapGraphEdge = {
  /** The id of the node that links. */
  from: string
  /** The id of the node it links to; the line ends there, in a dot unless `edgeEnd` is `none`. */
  to: string
}

export type MapGraphColumn = {
  /** The heading, such as "Skills"; it shows in capitals. */
  label: string
  /** The left edge of the heading, in px. */
  x: number
  /** The top edge of the heading, in px. */
  y: number
}

/**
 * The scale range of a zoomable map. `min` defaults to 1, the drawing at its
 * own size, and `max` to 3. Below 1 the whole drawing can shrink to fit a
 * small window.
 */
export type MapGraphZoom = {
  /** The smallest scale, such as 0.5 for half size. Defaults to 1. */
  min?: number | undefined
  /** The largest scale. Defaults to 3. */
  max?: number | undefined
}

export type MapGraphProps = {
  /** The accessible name of the map, such as "Toolkit map". */
  label: string
  /** The canvas width, in px. */
  width: number
  /** The canvas height, in px. */
  height: number
  /** The items, each placed at its x and y. The map does no layout of its own. */
  nodes: readonly MapGraphNode[]
  /** The links, drawn as lines between nodes. An edge to an unknown id is not drawn. */
  edges?: readonly MapGraphEdge[] | undefined
  /** Column headings. */
  columns?: readonly MapGraphColumn[] | undefined
  /** The width and height of each node with no `size` of its own, in px. Defaults to 220 × 34, as in Figma (426:464). */
  nodeSize?: { width: number; height: number } | undefined
  /** The border of each lit node: `kind` (the default), or `muted` for the Links graph (D19); see `MapNodeTone`. */
  nodeTone?: MapNodeTone | undefined
  /**
   * What each line ends in: `dot` (the default), a 6 px dot at the node it
   * links to, as on the toolkit map (D2 426:447); or `none`, a line that
   * ends at the node's edge, as on the Links graph (D19 493:89).
   */
  edgeEnd?: 'dot' | 'none' | undefined
  /**
   * How the lines run. `horizontal` (the default) joins each pair of nodes
   * side to side, for columns of nodes. `vertical` is for nodes in rows over
   * and under each other, as on the phone's Links graph (Toolkit M17,
   * 493:152): each line runs down a lane at the centre of one of its two
   * nodes that passes no other node, meets that node at its top or foot,
   * and meets the other node at the side that faces the lane. When both
   * lanes pass a node, the line goes round it, down a free lane beside the
   * two nodes inside the graph. Two nodes in one row still join side to
   * side.
   */
  orientation?: 'horizontal' | 'vertical' | undefined
  /** The selected node's id. Its links light up and the nodes it does not touch go dim. */
  selectedId?: string | null | undefined
  /** Called with a node's id when it is selected, and with `null` when Escape clears the selection. */
  onSelect?: ((id: string | null) => void) | undefined
  /** The legend, shown at the bottom left; usually a `MapLegend`. */
  legend?: ReactNode
  /** The selection card, shown at the bottom right; usually a `MapSelectionCard`. */
  card?: ReactNode
  /**
   * Pinch zoom and drag, for the phone's map window (Toolkit M11 461:866).
   * Off by default: the map scrolls sideways as before, with the same DOM
   * and styles. `true` scales from 1 to 3; `{ min, max }` sets the range.
   * When on, the map's window (its scroller, `data-allow-pinch`) takes the
   * touch gestures itself (`touch-action: none`): two pointers scale the
   * drawing about their midpoint within the range, and one pointer drags
   * it, so far that the drawing never leaves the window. A press that moves
   * less than 4 px is a tap, so a node still selects; the click after a
   * drag selects nothing. A node that takes the keyboard focus is moved
   * into the window.
   */
  zoom?: boolean | MapGraphZoom | undefined
}

const NODE_SIZE = { width: 220, height: 34 }
// A press that moves less than this, in px, is a tap and not a drag.
const TAP_SLOP = 4
const ZOOM = { min: 1, max: 3 }

type Point = { x: number; y: number }
type View = { scale: number; x: number; y: number }

/**
 * The pinch zoom and drag of a zoomable map. It keeps the view (scale and
 * offset) in a ref and writes it to the scroller as --map-graph-scale,
 * --map-graph-x and --map-graph-y, which the recipe's `zoomable` variant
 * reads, so a gesture renders nothing in React. With `range` null it does
 * nothing and removes the properties.
 */
function useZoom(ref: RefObject<HTMLDivElement | null>, range: { min: number; max: number } | null, width: number, height: number) {
  const view = useRef<View>({ scale: 1, x: 0, y: 0 })
  const min = range?.min
  const max = range?.max
  useEffect(() => {
    const scroller = ref.current
    if (scroller === null || min === undefined || max === undefined) return
    const at = (event: { clientX: number; clientY: number }): Point => {
      const r = scroller.getBoundingClientRect()
      return { x: event.clientX - r.left, y: event.clientY - r.top }
    }
    // Keeps the drawing in the window: a drawing wider than the window covers it, a narrower one stays inside it.
    const clamp = (next: View): View => {
      const scale = Math.min(Math.max(next.scale, min), max)
      const room = (inside: number, size: number, offset: number) => {
        const free = inside - size * scale
        return Math.min(Math.max(offset, Math.min(0, free)), Math.max(0, free))
      }
      return { scale, x: room(scroller.clientWidth, width, next.x), y: room(scroller.clientHeight, height, next.y) }
    }
    const show = (next: View) => {
      view.current = clamp(next)
      scroller.style.setProperty('--map-graph-scale', String(view.current.scale))
      scroller.style.setProperty('--map-graph-x', `${String(view.current.x)}px`)
      scroller.style.setProperty('--map-graph-y', `${String(view.current.y)}px`)
    }
    show(view.current)
    // The pointers down, at most two, and where the gesture started.
    const pointers = new Map<number, Point>()
    let start: { view: View; points: Point[] } = { view: view.current, points: [] }
    let dragging = false
    let skipClick = false
    const restart = () => {
      start = { view: view.current, points: [...pointers.values()] }
    }
    const down = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      if (pointers.size >= 2) return
      if (pointers.size === 0) {
        dragging = false
        skipClick = false
      } else {
        dragging = true
      }
      pointers.set(event.pointerId, at(event))
      restart()
    }
    const move = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return
      pointers.set(event.pointerId, at(event))
      const [a, b] = [...pointers.values()]
      const [a0, b0] = start.points
      if (a === undefined || a0 === undefined) return
      if (b !== undefined && b0 !== undefined) {
        // Scale by how far the pointers moved apart, about the drawing point that was under their midpoint.
        const gap0 = Math.hypot(b0.x - a0.x, b0.y - a0.y)
        if (gap0 === 0) return
        const scale = Math.min(Math.max((start.view.scale * Math.hypot(b.x - a.x, b.y - a.y)) / gap0, min), max)
        const mid0 = { x: (a0.x + b0.x) / 2, y: (a0.y + b0.y) / 2 }
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        const fixed = { x: (mid0.x - start.view.x) / start.view.scale, y: (mid0.y - start.view.y) / start.view.scale }
        show({ scale, x: mid.x - fixed.x * scale, y: mid.y - fixed.y * scale })
        return
      }
      if (!dragging && Math.hypot(a.x - a0.x, a.y - a0.y) < TAP_SLOP) return
      dragging = true
      show({ scale: start.view.scale, x: start.view.x + a.x - a0.x, y: start.view.y + a.y - a0.y })
    }
    const up = (event: PointerEvent) => {
      if (!pointers.delete(event.pointerId)) return
      if (dragging) skipClick = true
      // From two pointers to one: the one left drags on from the view the pinch left.
      restart()
    }
    // The click after a drag or a pinch selects no node.
    const click = (event: MouseEvent) => {
      if (!skipClick) return
      skipClick = false
      event.preventDefault()
      event.stopPropagation()
    }
    // A node that takes the focus moves into the window, since the window does not scroll.
    const focus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return
      const r = event.target.getBoundingClientRect()
      const w = scroller.getBoundingClientRect()
      const shift = (lo: number, hi: number, wLo: number, wHi: number) => (lo < wLo ? wLo - lo : hi > wHi ? Math.max(wHi - hi, wLo - lo) : 0)
      const dx = shift(r.left, r.right, w.left, w.left + scroller.clientWidth)
      const dy = shift(r.top, r.bottom, w.top, w.top + scroller.clientHeight)
      if (dx !== 0 || dy !== 0) show({ ...view.current, x: view.current.x + dx, y: view.current.y + dy })
    }
    scroller.addEventListener('pointerdown', down)
    scroller.addEventListener('click', click, true)
    scroller.addEventListener('focusin', focus)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      scroller.removeEventListener('pointerdown', down)
      scroller.removeEventListener('click', click, true)
      scroller.removeEventListener('focusin', focus)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      scroller.style.removeProperty('--map-graph-scale')
      scroller.style.removeProperty('--map-graph-x')
      scroller.style.removeProperty('--map-graph-y')
    }
  }, [ref, min, max, width, height])
}
// The radius of the dot at the end of a link (426:369 is 6 × 6).
const DOT = 3

/**
 * The toolkit map: nodes placed at the x and y they are given, lines for
 * the links between them, and column headings. When a node is selected,
 * its links light up and the nodes it does not link to go dim. Each node
 * is a button in the tab order; Enter or Space selects it, and Escape
 * clears the selection. The map does no layout: the caller places nodes.
 * With `orientation="vertical"` the lines run between nodes in rows over
 * and under each other, for the phone. For the Links graph (Toolkit D19)
 * the open item takes its own `size` and `labelStyle`, `nodeTone="muted"`
 * softens the other nodes' borders and `edgeEnd="none"` drops the dots.
 * With `zoom` the map is a window that pinch zooms and drags its drawing,
 * as on the phone (Toolkit M11).
 */
export function MapGraph({
  label,
  width,
  height,
  nodes,
  edges = [],
  columns = [],
  nodeSize = NODE_SIZE,
  nodeTone = 'kind',
  edgeEnd = 'dot',
  orientation = 'horizontal',
  selectedId = null,
  onSelect,
  legend,
  card,
  zoom = false,
}: MapGraphProps) {
  const idBase = useId()
  const scroller = useRef<HTMLDivElement>(null)
  const range = zoom === false ? null : zoom === true ? ZOOM : { min: zoom.min ?? ZOOM.min, max: zoom.max ?? ZOOM.max }
  useZoom(scroller, range, width, height)
  const names = new Map(nodes.map((n) => [n.id, n.label]))
  // The links of a node as a sentence, so a screen reader hears their direction.
  const linksOf = (id: string) => {
    const out = edges.filter((e) => e.from === id && e.to !== id).flatMap((e) => names.get(e.to) ?? [])
    const into = edges.filter((e) => e.to === id && e.from !== id).flatMap((e) => names.get(e.from) ?? [])
    return [out.length > 0 ? `Links to ${out.join(', ')}.` : '', into.length > 0 ? `Linked from ${into.join(', ')}.` : ''].filter((t) => t !== '').join(' ')
  }
  const boxes = new Map(nodes.map((n) => [n.id, { x: n.x, y: n.y, ...(n.size ?? nodeSize) }]))
  const selected = selectedId !== null && boxes.has(selectedId) ? selectedId : null
  const linked = new Set<string>()
  if (selected !== null) {
    linked.add(selected)
    for (const e of edges) {
      if (e.from === selected) linked.add(e.to)
      if (e.to === selected) linked.add(e.from)
    }
  }
  const stateOf = (id: string): MapNodeState => (selected === null ? 'lit' : id === selected ? 'selected' : linked.has(id) ? 'lit' : 'dim')
  // How many drawn lines each node has, so upright lines share a hub's lane.
  const degrees = new Map<Box, number>()
  for (const e of edges) {
    const a = boxes.get(e.from)
    const b = boxes.get(e.to)
    if (a === undefined || b === undefined || e.from === e.to) continue
    degrees.set(a, (degrees.get(a) ?? 0) + 1)
    degrees.set(b, (degrees.get(b) ?? 0) + 1)
  }
  const degree = (box: Box) => degrees.get(box) ?? 0
  const drawn = edges.flatMap((e, i) => {
    const a = boxes.get(e.from)
    const b = boxes.get(e.to)
    if (a === undefined || b === undefined || e.from === e.to) return []
    const lit = selected !== null && (e.from === selected || e.to === selected)
    const path =
      orientation === 'vertical'
        ? uprightRoute(
            a,
            b,
            [...boxes.values()].filter((o) => o !== a && o !== b),
            degree,
            { width, height },
          )
        : linkRoute(a, b)
    return [{ key: `${String(i)}:${e.from}>${e.to}`, lit, ...path }]
  })
  // Lit links go last, so they draw over the dim ones.
  const ordered = [...drawn.filter((e) => !e.lit), ...drawn.filter((e) => e.lit)]
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape' && selected !== null) {
      event.preventDefault()
      onSelect?.(null)
    }
  }
  return (
    <GraphRoot role="group" aria-label={label} zoomable={range === null ? undefined : true}>
      <Scroller ref={scroller} data-allow-pinch={range === null ? undefined : ''}>
        <Svg width={width} height={height} viewBox={`0 0 ${String(width)} ${String(height)}`}>
          <g aria-hidden="true">
            {columns.map((c) => (
              <ColumnLabel key={`${c.label}:${String(c.x)}`} x={c.x} y={c.y} dominantBaseline="hanging">
                {c.label}
              </ColumnLabel>
            ))}
            {ordered.map((e) => (
              <g key={e.key}>
                <Edge d={e.d} data-lit={e.lit ? '' : undefined} />
                {edgeEnd === 'dot' ? <EdgeEnd cx={e.end.x} cy={e.end.y} r={DOT} data-lit={e.lit ? '' : undefined} /> : null}
              </g>
            ))}
          </g>
          {nodes.map((n, i) => {
            const links = linksOf(n.id)
            const linksId = `${idBase}-links-${String(i)}`
            return (
              <NodeBox key={n.id} x={n.x} y={n.y} width={(n.size ?? nodeSize).width} height={(n.size ?? nodeSize).height}>
                <MapNode
                  label={n.label}
                  kind={n.kind}
                  meta={n.meta}
                  state={stateOf(n.id)}
                  tone={nodeTone}
                  labelStyle={n.labelStyle}
                  onClick={() => onSelect?.(n.id)}
                  onKeyDown={onKeyDown}
                  describedBy={links === '' ? undefined : linksId}
                />
                {links === '' ? null : <Links id={linksId}>{links}</Links>}
              </NodeBox>
            )
          })}
        </Svg>
      </Scroller>
      {legend === undefined || legend === null ? null : <Legend>{legend}</Legend>}
      {card === undefined || card === null ? null : <Card>{card}</Card>}
    </GraphRoot>
  )
}
