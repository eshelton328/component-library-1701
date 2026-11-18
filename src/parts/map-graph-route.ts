// The lines of `MapGraph`, as pure functions of the node boxes, so the
// routes can be checked without a page.

// How far a link between two nodes in one column bows out to the right.
const BOW = 40
// How many straight pieces stand for one curve when a route is checked.
const CURVE_STEPS = 24
// How far a point must lie inside a node box to count as behind it.
const EPSILON = 1e-6

/** A node's box on the canvas, in px. */
export type Box = { x: number; y: number; width: number; height: number }
/** A point on the canvas, in px. */
export type Point = { x: number; y: number }
/** A line: its SVG path and the point where it meets the node it links to. */
export type Route = { d: string; end: Point }

// A route as a start point and steps: straight to `to`, or curved through `via`.
type Step = { to: Point; via?: Point | undefined }
type Shape = { start: Point; steps: Step[] }

const n = (v: number) => String(v)

function pathOf({ start, steps }: Shape): string {
  return [`M ${n(start.x)} ${n(start.y)}`, ...steps.map((s) => (s.via === undefined ? `L ${n(s.to.x)} ${n(s.to.y)}` : `Q ${n(s.via.x)} ${n(s.via.y)} ${n(s.to.x)} ${n(s.to.y)}`))].join(' ')
}

// The route as straight pieces; each curve becomes CURVE_STEPS of them.
function pointsOf({ start, steps }: Shape): Point[] {
  const points = [start]
  let from = start
  for (const s of steps) {
    const via = s.via
    if (via === undefined) points.push(s.to)
    else {
      for (let i = 1; i <= CURVE_STEPS; i += 1) {
        const t = i / CURVE_STEPS
        const u = 1 - t
        points.push({ x: u * u * from.x + 2 * u * t * via.x + t * t * s.to.x, y: u * u * from.y + 2 * u * t * via.y + t * t * s.to.y })
      }
    }
    from = s.to
  }
  return points
}

// Whether the straight piece from `p` to `q` passes inside `box`; a piece
// along an edge or touching a corner does not (Liang–Barsky clipping).
function piecePasses(p: Point, q: Point, box: Box): boolean {
  const dx = q.x - p.x
  const dy = q.y - p.y
  const edges: [number, number][] = [
    [-dx, p.x - (box.x + EPSILON)],
    [dx, box.x + box.width - EPSILON - p.x],
    [-dy, p.y - (box.y + EPSILON)],
    [dy, box.y + box.height - EPSILON - p.y],
  ]
  let t0 = 0
  let t1 = 1
  for (const [step, room] of edges) {
    if (step === 0) {
      if (room <= 0) return false
    } else {
      const t = room / step
      if (step < 0) t0 = Math.max(t0, t)
      else t1 = Math.min(t1, t)
    }
  }
  return t0 < t1
}

// How many of `boxes` the route passes inside, its curves included.
function crossings(shape: Shape, boxes: readonly Box[]): number {
  const points = pointsOf(shape)
  return boxes.filter((box) => points.some((p, i) => i > 0 && piecePasses(points[i - 1] ?? p, p, box))).length
}

/**
 * A line from the side of `a` that faces `b` to the side of `b` that faces
 * `a`, curved with level ends. Two nodes in one column join on the right,
 * bowed out by BOW.
 */
export function linkRoute(a: Box, b: Box): Route {
  const ay = a.y + a.height / 2
  const by = b.y + b.height / 2
  const apart = Math.abs(a.x - b.x) >= Math.min(a.width, b.width)
  if (!apart) {
    const sx = a.x + a.width
    const ex = b.x + b.width
    const cx = Math.max(sx, ex) + BOW
    return { d: `M ${n(sx)} ${n(ay)} C ${n(cx)} ${n(ay)} ${n(cx)} ${n(by)} ${n(ex)} ${n(by)}`, end: { x: ex, y: by } }
  }
  const forward = b.x > a.x
  const sx = forward ? a.x + a.width : a.x
  const ex = forward ? b.x : b.x + b.width
  const mx = (sx + ex) / 2
  return { d: `M ${n(sx)} ${n(ay)} C ${n(mx)} ${n(ay)} ${n(mx)} ${n(by)} ${n(ex)} ${n(by)}`, end: { x: ex, y: by } }
}

const inside = (box: Box, x: number) => x > box.x && x < box.x + box.width

// The line down the lane at `lx`, the centre x of `owner`, one of the two
// nodes. It meets the lane's node head-on and turns into the side of the
// other node that faces the lane, or meets it head-on too when the lane
// runs through it.
function laneShape(upper: Box, lower: Box, owner: Box, lx: number): { shape: Shape; ends: { upper: Point; lower: Point } } {
  const top = upper.y + upper.height
  const foot = lower.y
  if (owner === lower && !inside(upper, lx)) {
    // Out of the upper node's side, round into the lane, down into the lower node's top.
    const sx = lx > upper.x + upper.width / 2 ? upper.x + upper.width : upper.x
    const sy = upper.y + upper.height / 2
    const k = Math.min(Math.abs(lx - sx), foot - sy)
    return {
      shape: { start: { x: sx, y: sy }, steps: [{ via: { x: lx, y: sy }, to: { x: lx, y: sy + k } }, { to: { x: lx, y: foot } }] },
      ends: { upper: { x: sx, y: sy }, lower: { x: lx, y: foot } },
    }
  }
  if (owner === upper && !inside(lower, lx)) {
    // Out of the upper node's foot, down the lane, round into the lower node's side.
    const ex = lx > lower.x + lower.width / 2 ? lower.x + lower.width : lower.x
    const ey = lower.y + lower.height / 2
    const k = Math.min(Math.abs(lx - ex), ey - top)
    return {
      shape: { start: { x: lx, y: top }, steps: [{ to: { x: lx, y: ey - k } }, { via: { x: lx, y: ey }, to: { x: ex, y: ey } }] },
      ends: { upper: { x: lx, y: top }, lower: { x: ex, y: ey } },
    }
  }
  // The lane runs through both nodes: straight from one to the other.
  return { shape: { start: { x: lx, y: top }, steps: [{ to: { x: lx, y: foot } }] }, ends: { upper: { x: lx, y: top }, lower: { x: lx, y: foot } } }
}

/**
 * A line between nodes in rows (`orientation="vertical"`, M17 493:152).
 * It runs down a lane at the centre x of one of the two nodes, from the
 * upper node to the lower one. The lanes go in order of how many lines
 * their node has, so lines share the lane of a hub such as the open item;
 * the first lane whose whole line, turn included, passes inside none of
 * `others` wins. `others` holds every node except `a` and `b`. Two nodes
 * that share rows in y join side to side, as in `linkRoute`.
 */
export function uprightRoute(a: Box, b: Box, others: readonly Box[], degree: (box: Box) => number): Route {
  const aOver = a.y + a.height <= b.y
  const bOver = b.y + b.height <= a.y
  if (!aOver && !bOver) return linkRoute(a, b)
  const upper = aOver ? a : b
  const lower = aOver ? b : a
  const lanes = [upper, lower].sort((p, q) => degree(q) - degree(p)).map((owner) => laneShape(upper, lower, owner, owner.x + owner.width / 2))
  const route = lanes.find((lane) => crossings(lane.shape, others) === 0) ?? laneShape(upper, lower, lower, lower.x + lower.width / 2)
  return { d: pathOf(route.shape), end: b === lower ? route.ends.lower : route.ends.upper }
}
