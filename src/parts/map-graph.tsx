import { type KeyboardEvent, type ReactNode, useId } from 'react'
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
export function MapNode({ label, kind, meta, state = 'lit', onClick, onKeyDown, describedBy }: MapNodeProps) {
  const Icon = kindIcons[kind]
  return (
    <NodeRoot type="button" kind={kind} aria-pressed={state === 'selected'} aria-describedby={describedBy} data-state={state} onClick={onClick} onKeyDown={onKeyDown}>
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
}

export type MapGraphEdge = {
  /** The id of the node that links. */
  from: string
  /** The id of the node it links to; the line ends in a dot there. */
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
  /** The width and height of every node, in px. Defaults to 220 × 34, as in Figma (426:464). */
  nodeSize?: { width: number; height: number } | undefined
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
}

const NODE_SIZE = { width: 220, height: 34 }
// The radius of the dot at the end of a link (426:369 is 6 × 6).
const DOT = 3

/**
 * The toolkit map: nodes placed at the x and y they are given, lines for
 * the links between them, and column headings. When a node is selected,
 * its links light up and the nodes it does not link to go dim. Each node
 * is a button in the tab order; Enter or Space selects it, and Escape
 * clears the selection. The map does no layout: the caller places nodes.
 * With `orientation="vertical"` the lines run between nodes in rows over
 * and under each other, for the phone.
 */
export function MapGraph({ label, width, height, nodes, edges = [], columns = [], nodeSize = NODE_SIZE, orientation = 'horizontal', selectedId = null, onSelect, legend, card }: MapGraphProps) {
  const idBase = useId()
  const names = new Map(nodes.map((n) => [n.id, n.label]))
  // The links of a node as a sentence, so a screen reader hears their direction.
  const linksOf = (id: string) => {
    const out = edges.filter((e) => e.from === id && e.to !== id).flatMap((e) => names.get(e.to) ?? [])
    const into = edges.filter((e) => e.to === id && e.from !== id).flatMap((e) => names.get(e.from) ?? [])
    return [out.length > 0 ? `Links to ${out.join(', ')}.` : '', into.length > 0 ? `Linked from ${into.join(', ')}.` : ''].filter((t) => t !== '').join(' ')
  }
  const boxes = new Map(nodes.map((n) => [n.id, { x: n.x, y: n.y, width: nodeSize.width, height: nodeSize.height }]))
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
    <GraphRoot role="group" aria-label={label}>
      <Scroller>
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
                <EdgeEnd cx={e.end.x} cy={e.end.y} r={DOT} data-lit={e.lit ? '' : undefined} />
              </g>
            ))}
          </g>
          {nodes.map((n, i) => {
            const links = linksOf(n.id)
            const linksId = `${idBase}-links-${String(i)}`
            return (
              <NodeBox key={n.id} x={n.x} y={n.y} width={nodeSize.width} height={nodeSize.height}>
                <MapNode
                  label={n.label}
                  kind={n.kind}
                  meta={n.meta}
                  state={stateOf(n.id)}
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
