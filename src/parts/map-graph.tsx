import { type KeyboardEvent, type ReactNode, type RefObject, useEffect, useId, useRef } from 'react'
import { AgentIcon, ChevronRightIcon, CloseIcon, HookIcon, type IconProps, LinksIcon, RuleIcon, SkillIcon, WorkflowIcon } from '../foundations/icons'
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

/**
 * How tight a node draws: `default` pads 10 px each side with a 16 px icon
 * and an 8 px gap, so the name starts 35 px in; `compact` pads 8 with a 12 px
 * icon and a 6 px gap, so the name starts 27 px in, for the tablet's and the
 * phone's 140 × 30 nodes (Toolkit T2 428:402, M11 461:921), whose 104 px
 * names show `pr-description` whole.
 */
export type MapNodeDensity = 'default' | 'compact'

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
  /** `default` or `compact` (a 12 px icon and tighter sides); see `MapNodeDensity`. */
  density?: MapNodeDensity | undefined
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
export function MapNode({ label, kind, meta, state = 'lit', tone = 'kind', labelStyle = 'mono', density = 'default', onClick, onKeyDown, describedBy }: MapNodeProps) {
  const Icon = kindIcons[kind]
  return (
    <NodeRoot
      type="button"
      kind={kind}
      labelStyle={labelStyle}
      density={density}
      aria-pressed={state === 'selected'}
      aria-describedby={describedBy}
      data-state={state}
      data-tone={tone}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <NodeIcon>
        <Icon size={density === 'compact' ? '12' : '16'} />
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
const CardCountsLabel = card.withContext('p', 'countsLabel')
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
  /**
   * The label of a links button, such as "Show links", drawn first in the
   * action row as a primary button with the links icon (Toolkit M11
   * 461:1268). With it, the open button turns secondary with no chevron and
   * both buttons take their own width, 8 px apart. No links button when not set.
   */
  linksLabel?: string | undefined
  /** Called by the links button. */
  onLinks?: (() => void) | undefined
  /** Called by the close button. No close button when not set. */
  onClose?: (() => void) | undefined
  /**
   * `default` draws the counts in words on their own line
   * (`→ links to 7   ← linked from 4`) with 16 px padding; `compact` is the
   * phone's card (Toolkit M11 461:1259): the counts as arrows and numbers
   * (`→7  ←4`, muted) at the end of the title row, 12 px top and bottom
   * padding and an 8 px gap. Assistive technology reads the default card's
   * words for the counts, as visually hidden text.
   */
  density?: 'default' | 'compact' | undefined
}

/** The card for the selected map item: its name and kind, what it does, its link counts and its buttons. */
export function MapSelectionCard({
  name,
  kind,
  description,
  linksTo,
  linkedFrom,
  actionLabel,
  onAction,
  linksLabel,
  onLinks,
  onClose,
  density = 'default',
}: MapSelectionCardProps) {
  const Icon = kindIcons[kind]
  const compact = density === 'compact'
  const words = [linksTo === undefined ? '' : `→ links to ${String(linksTo)}`, linkedFrom === undefined ? '' : `← linked from ${String(linkedFrom)}`].filter((c) => c !== '')
  const arrows = [linksTo === undefined ? '' : `→${String(linksTo)}`, linkedFrom === undefined ? '' : `←${String(linkedFrom)}`].filter((c) => c !== '')
  const wordsText = words.length > 0 ? words.join('   ') : null
  const arrowsText = arrows.length > 0 ? arrows.join('  ') : null
  const hasLinks = linksLabel !== undefined && linksLabel !== ''
  const hasAction = actionLabel !== undefined && actionLabel !== ''
  return (
    <CardRoot kind={kind} density={density} aria-label={name}>
      <CardTitle>
        <CardIcon>
          <Icon size="16" />
        </CardIcon>
        <CardName>
          <TruncatedText>{name}</TruncatedText>
        </CardName>
        <CardKind>{kindNames[kind]}</CardKind>
        {/* The arrows alone say nothing to a screen reader, so it reads the default card's words, hidden from view. */}
        {compact && arrowsText !== null ? <CardCounts aria-hidden>{arrowsText}</CardCounts> : null}
        {compact && wordsText !== null ? <CardCountsLabel>{wordsText}</CardCountsLabel> : null}
        {onClose === undefined ? null : (
          <CardClose>
            <Button variant="secondary" size="sm" iconOnly aria-label={`Close ${name}`} onClick={onClose}>
              <CloseIcon size="12" />
            </Button>
          </CardClose>
        )}
      </CardTitle>
      {description !== undefined && description !== '' ? <CardDescription>{description}</CardDescription> : null}
      {!compact && wordsText !== null ? <CardCounts>{wordsText}</CardCounts> : null}
      {hasLinks || hasAction ? (
        <CardAction data-links={hasLinks ? '' : undefined}>
          {hasLinks ? (
            <Button variant="primary" onClick={onLinks}>
              <LinksIcon size="16" />
              {linksLabel}
            </Button>
          ) : null}
          {hasAction ? (
            <Button variant={hasLinks ? 'secondary' : 'primary'} onClick={onAction}>
              {actionLabel}
              {hasLinks ? null : <ChevronRightIcon size="12" />}
            </Button>
          ) : null}
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
const Minimap = graph.withContext('div', 'minimap')
const MinimapSvg = graph.withContext('svg', 'minimapSvg')
const MinimapEdge = graph.withContext('path', 'minimapEdge')
const MinimapNode = graph.withContext('rect', 'minimapNode')
const MinimapLabel = graph.withContext('text', 'minimapLabel')
const MinimapView = graph.withContext('div', 'minimapView')

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
   * How tight each node draws: `default`, or `compact` for the tablet's and
   * the phone's 140 × 30 nodes (Toolkit T2, M11), with a 12 px icon and the
   * name 27 px in; see `MapNodeDensity`.
   */
  nodeDensity?: MapNodeDensity | undefined
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
   * less than 4 px is a tap, so a node still selects; the pointer click
   * that ends a drag selects nothing, and a key press always does. A node
   * that takes the keyboard focus is moved into the window, and a window
   * that changes size keeps the drawing inside it. With no pointers: +
   * or = zooms one step (1.25 times) in and - one step out about the
   * window's centre while the focus is in the map, 0 zooms out to `min`,
   * and Control or Command with the wheel zooms about the pointer. The map
   * describes these keys to assistive technology; a map with no nodes puts
   * its window in the tab order, so the keys can reach it.
   */
  zoom?: boolean | MapGraphZoom | undefined
  /**
   * A small map of the whole drawing in the window's top right corner, as on
   * the phone (Toolkit M11 `minimap bg` 461:1255): every heading, line and
   * node, with its name, at 0.12 scale, and a cyan box round the part of the
   * drawing that the window shows, which follows a scroll, a drag and a
   * zoom. It is a picture only: hidden from assistive technology, and a
   * pointer on it reaches the map under it. Off by default.
   */
  minimap?: boolean | undefined
}

const NODE_SIZE = { width: 220, height: 34 }
// A press that moves less than this, in px, is a tap and not a drag.
const TAP_SLOP = 4
const ZOOM = { min: 1, max: 3 }
// One zoom step of a key, or of a 100 px turn of the wheel: 1.25 times larger or smaller.
const ZOOM_STEP = 1.25
const WHEEL_STEP = 100
// The px of one wheel line, for a wheel that counts lines (deltaMode 1).
const WHEEL_LINE = 40

type Point = { x: number; y: number }
type View = { scale: number; x: number; y: number }

// The scale of the minimap: Figma draws the 712 × 900 drawing 85.44 × 108 (M11 461:1061).
const MINIMAP_SCALE = 0.12
// Where a node's name starts, in px from its left edge (1 px border, side padding, icon and gap), for each density.
const LABEL_START: Record<MapNodeDensity, number> = { default: 35, compact: 27 }

/**
 * Moves the minimap's box to the part of the drawing that the window shows:
 * the window's size at the view's scale, from the view's offset, cut to the
 * drawing, at the minimap's scale. It writes --map-graph-mini-x, -y, -w and -h,
 * which the recipe's `minimapView` reads.
 */
function placeMinimap(box: HTMLElement | null, view: View, windowWidth: number, windowHeight: number, width: number, height: number) {
  if (box === null) return
  const span = (offset: number, size: number, total: number) => {
    const start = Math.min(Math.max(-offset / view.scale, 0), total)
    const end = Math.min(Math.max((size - offset) / view.scale, 0), total)
    return { at: start * MINIMAP_SCALE, size: (end - start) * MINIMAP_SCALE }
  }
  const x = span(view.x, windowWidth, width)
  const y = span(view.y, windowHeight, height)
  box.style.setProperty('--map-graph-mini-x', `${String(x.at)}px`)
  box.style.setProperty('--map-graph-mini-y', `${String(y.at)}px`)
  box.style.setProperty('--map-graph-mini-w', `${String(x.size)}px`)
  box.style.setProperty('--map-graph-mini-h', `${String(y.size)}px`)
}

/**
 * The minimap's box for a map with no zoom: the window scrolls, so the view
 * is the scroll offset at scale 1. It follows each scroll and each change of
 * the window's size. A zoomable map places the box from `useZoom` instead.
 */
function useScrollMinimap(ref: RefObject<HTMLDivElement | null>, box: RefObject<HTMLDivElement | null>, on: boolean, width: number, height: number) {
  useEffect(() => {
    const scroller = ref.current
    if (scroller === null || !on) return
    const place = () => {
      placeMinimap(box.current, { scale: 1, x: -scroller.scrollLeft, y: -scroller.scrollTop }, scroller.clientWidth, scroller.clientHeight, width, height)
    }
    place()
    const resize = new ResizeObserver(place)
    resize.observe(scroller)
    scroller.addEventListener('scroll', place, { passive: true })
    return () => {
      resize.disconnect()
      scroller.removeEventListener('scroll', place)
    }
  }, [ref, box, on, width, height])
}

/**
 * The pinch zoom and drag of a zoomable map. It keeps the view (scale and
 * offset) in a ref and writes it to the scroller as --map-graph-scale,
 * --map-graph-x and --map-graph-y, which the recipe's `zoomable` variant
 * reads, so a gesture renders nothing in React. With `range` null it does
 * nothing and removes the properties.
 */
function useZoom(
  ref: RefObject<HTMLDivElement | null>,
  range: { min: number; max: number } | null,
  width: number,
  height: number,
  minimap: RefObject<HTMLDivElement | null>,
  withMinimap: boolean,
) {
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
      if (withMinimap) placeMinimap(minimap.current, view.current, scroller.clientWidth, scroller.clientHeight, width, height)
    }
    show(view.current)
    // Scales the view by `factor` about a point of the window, so the drawing point under it stays there.
    const zoomAt = (point: Point, factor: number) => {
      const now = view.current
      const scale = Math.min(Math.max(now.scale * factor, min), max)
      show({ scale, x: point.x - ((point.x - now.x) / now.scale) * scale, y: point.y - ((point.y - now.y) / now.scale) * scale })
    }
    // A window that changes size clamps the drawing again, so it never shows space past its edge.
    const resize = new ResizeObserver(() => {
      show(view.current)
    })
    resize.observe(scroller)
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
    let clearSkip: ReturnType<typeof setTimeout> | undefined
    const up = (event: PointerEvent) => {
      if (!pointers.delete(event.pointerId)) return
      // The browser fires the click of a release in the same task, so the flag lasts one task: a drag released
      // outside the window, which fires no click here, cannot swallow a later one.
      if (dragging && pointers.size === 0) {
        skipClick = true
        clearTimeout(clearSkip)
        clearSkip = setTimeout(() => {
          skipClick = false
        }, 0)
      }
      // From two pointers to one: the one left drags on from the view the pinch left.
      restart()
    }
    // The click after a drag or a pinch selects no node. A click from the keyboard (Enter or Space, detail 0)
    // always goes through.
    const click = (event: MouseEvent) => {
      if (!skipClick || event.detail === 0) return
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
    // Keys zoom about the window's centre when the focus is in the map: + or = one step in, - one step out, 0 to min.
    // A key with Control, Command or Alt is left to the browser.
    const key = (event: globalThis.KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const centre = { x: scroller.clientWidth / 2, y: scroller.clientHeight / 2 }
      if (event.key === '+' || event.key === '=') zoomAt(centre, ZOOM_STEP)
      else if (event.key === '-') zoomAt(centre, 1 / ZOOM_STEP)
      else if (event.key === '0') zoomAt(centre, min / view.current.scale)
      else return
      event.preventDefault()
    }
    // Control or Command with the wheel (and a trackpad pinch, which the browser sends so) zooms about the pointer.
    // A plain wheel is left alone, so the page still scrolls.
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      const px = event.deltaMode === 1 ? event.deltaY * WHEEL_LINE : event.deltaMode === 2 ? event.deltaY * scroller.clientHeight : event.deltaY
      zoomAt(at(event), ZOOM_STEP ** (-px / WHEEL_STEP))
    }
    scroller.addEventListener('pointerdown', down)
    scroller.addEventListener('keydown', key)
    scroller.addEventListener('wheel', wheel, { passive: false })
    scroller.addEventListener('click', click, true)
    scroller.addEventListener('focusin', focus)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      scroller.removeEventListener('pointerdown', down)
      scroller.removeEventListener('keydown', key)
      scroller.removeEventListener('wheel', wheel)
      scroller.removeEventListener('click', click, true)
      scroller.removeEventListener('focusin', focus)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      clearTimeout(clearSkip)
      resize.disconnect()
      scroller.style.removeProperty('--map-graph-scale')
      scroller.style.removeProperty('--map-graph-x')
      scroller.style.removeProperty('--map-graph-y')
    }
  }, [ref, min, max, width, height, minimap, withMinimap])
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
 * as on the phone (Toolkit M11); `minimap` adds a small map of the whole
 * drawing that shows where the window is, and `nodeDensity="compact"` draws
 * the tablet's and the phone's 140 × 30 nodes.
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
  nodeDensity = 'default',
  edgeEnd = 'dot',
  orientation = 'horizontal',
  selectedId = null,
  onSelect,
  legend,
  card,
  zoom = false,
  minimap = false,
}: MapGraphProps) {
  const idBase = useId()
  const scroller = useRef<HTMLDivElement>(null)
  const minimapView = useRef<HTMLDivElement>(null)
  const range = zoom === false ? null : zoom === true ? ZOOM : { min: zoom.min ?? ZOOM.min, max: zoom.max ?? ZOOM.max }
  useZoom(scroller, range, width, height, minimapView, minimap)
  useScrollMinimap(scroller, minimapView, minimap && range === null, width, height)
  const keysId = `${idBase}-zoom-keys`
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
    <GraphRoot role="group" aria-label={label} aria-describedby={range === null ? undefined : keysId} zoomable={range === null ? undefined : true}>
      <Scroller
        ref={scroller}
        data-allow-pinch={range === null ? undefined : ''}
        aria-keyshortcuts={range === null ? undefined : '+ = - 0'}
        tabIndex={range !== null && nodes.length === 0 ? 0 : undefined}
        aria-describedby={range !== null && nodes.length === 0 ? keysId : undefined}
      >
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
                  density={nodeDensity}
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
      {range === null ? null : (
        <Links id={keysId}>Pinch, or press plus or minus, to zoom, and 0 to zoom out fully. Control or Command with the mouse wheel zooms too. Drag to move.</Links>
      )}
      {minimap ? (
        <Minimap aria-hidden="true" data-minimap="">
          <MinimapSvg width={width * MINIMAP_SCALE} height={height * MINIMAP_SCALE} viewBox={`0 0 ${String(width)} ${String(height)}`}>
            {columns.map((c) => (
              <ColumnLabel key={`${c.label}:${String(c.x)}`} x={c.x} y={c.y} dominantBaseline="hanging">
                {c.label}
              </ColumnLabel>
            ))}
            {ordered.map((e) => (
              <MinimapEdge key={e.key} d={e.d} data-lit={e.lit ? '' : undefined} />
            ))}
            {nodes.map((n) => {
              const size = n.size ?? nodeSize
              const state = stateOf(n.id)
              return (
                <g key={n.id}>
                  <MinimapNode x={n.x} y={n.y} width={size.width} height={size.height} rx={8} data-kind={n.kind} data-state={state} />
                  <MinimapLabel x={n.x + LABEL_START[nodeDensity]} y={n.y + size.height / 2} dominantBaseline="central" data-state={state}>
                    {n.label}
                  </MinimapLabel>
                </g>
              )
            })}
          </MinimapSvg>
          <MinimapView ref={minimapView} />
        </Minimap>
      ) : null}
      {legend === undefined || legend === null ? null : <Legend>{legend}</Legend>}
      {card === undefined || card === null ? null : <Card>{card}</Card>}
    </GraphRoot>
  )
}
