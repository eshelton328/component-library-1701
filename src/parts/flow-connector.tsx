import { createSlotRecipeContext } from '../../styled-system/jsx'
import { flowBranch, flowLine, flowLoop } from '../../styled-system/recipes'

// The connectors between the steps of a workflow flow. Each one fills the
// box its caller gives it (a grid cell or a flex item), so the caller lays
// out the steps and the connectors with them; the lines and the arrow
// heads are drawn in CSS and hidden from assistive technology, and a label
// is read as text.

const line = createSlotRecipeContext(flowLine)
const LineRoot = line.withProvider('span', 'root')
const LineStroke = line.withContext('span', 'line')
const LineHead = line.withContext('span', 'head')
const LineLabel = line.withContext('span', 'label')

/** Where a line points: its head is at that end of its box. */
export type FlowLineDirection = 'right' | 'down' | 'left' | 'up'

/** The colour of a line: `default` is the muted text colour, `needsYou` the colour of a step that waits for the owner, such as a gate's way out. */
export type FlowLineTone = 'default' | 'needsYou'

/** The space between the two parallel steps of a fork or a join, a spacing token. */
export type FlowBranchGap = '0' | '2' | '4' | '6' | '8' | '10' | '12' | '16' | '20' | '24' | '32' | '40'

export type FlowLineProps = {
  /**
   * Where the line points. `right` and `left` draw it across its box, 12 px
   * high, as wide as its container gives it; `down` and `up` draw it down
   * its box, 12 px wide, as high as its container gives it. The line starts
   * at the box's start and the head's tip stops 2 px (spacing `2`) before
   * the box's end, as in Figma, so a box from one step's edge to the next
   * one's edge draws the arrow between them without touching the next
   * step. Defaults to `right`.
   */
  direction?: FlowLineDirection | undefined
  /** `default` (muted) or `needsYou` (amber, for a gate's way out). Defaults to `default`. */
  tone?: FlowLineTone | undefined
  /**
   * A short label, such as "no" on a gate's way out: beside a vertical line,
   * 8 px from it and 12 px under its start, or under a horizontal one, in
   * the middle, in `small` text in the line's colour. It does not take
   * space in the layout.
   */
  label?: string | undefined
}

function present(text: string | undefined): text is string {
  return text !== undefined && text !== ''
}

/** A straight connector with an arrow head, across or down its box, at any length. */
export function FlowLine({ direction = 'right', tone = 'default', label }: FlowLineProps) {
  return (
    <LineRoot direction={direction} tone={tone} data-direction={direction}>
      <LineStroke aria-hidden="true" />
      <LineHead aria-hidden="true" />
      {present(label) ? <LineLabel>{label}</LineLabel> : null}
    </LineRoot>
  )
}

const branch = createSlotRecipeContext(flowBranch)
const BranchRoot = branch.withProvider('span', 'root')
const Stem = branch.withContext('span', 'stem')
const Spine = branch.withContext('span', 'spine')
const Arm = branch.withContext('span', 'arm')
const BranchHead = branch.withContext('span', 'head')

export type FlowBranchProps = {
  /**
   * `fork` runs from one step into two parallel steps, with a head on each
   * arm; `join` runs from the two into one, with a head on the stem.
   */
  kind: 'fork' | 'join'
  /**
   * The way the flow runs. `down`: the box spans the two parallel steps
   * side by side, and the one step is above (fork) or below (join) it.
   * `right`: the box spans the two steps one over the other, and the one
   * step is left (fork) or right (join) of it. The box fills its container;
   * the spine is halfway along the flow, and each head's tip stops 2 px
   * (spacing `2`) before the box's far side, off the step it points at.
   * Defaults to `down`.
   */
  direction?: 'right' | 'down' | undefined
  /** The space between the two parallel steps, so each arm meets the middle of its step. Defaults to `8`. */
  gap?: FlowBranchGap | undefined
}

/** An elbow connector that forks one step into two parallel steps, or joins the two into one. */
export function FlowBranch({ kind, direction = 'down', gap = '8' }: FlowBranchProps) {
  return (
    <BranchRoot kind={kind} direction={direction} gap={gap} aria-hidden="true" data-kind={kind} data-direction={direction}>
      <Stem />
      <Spine />
      <Arm data-side="start" />
      <Arm data-side="end" />
      {kind === 'fork' ? (
        <>
          <BranchHead data-side="start" />
          <BranchHead data-side="end" />
        </>
      ) : (
        <BranchHead />
      )}
    </BranchRoot>
  )
}

const loop = createSlotRecipeContext(flowLoop)
const LoopRoot = loop.withProvider('span', 'root')
const LoopDown = loop.withContext('span', 'down')
const LoopBack = loop.withContext('span', 'back')
const LoopHead = loop.withContext('span', 'head')
const LoopLabel = loop.withContext('span', 'label')

export type FlowLoopProps = {
  /** A short label in `mono` under the line, in its middle, such as "new failure". It does not take space in the layout. */
  label?: string | undefined
}

/**
 * A dashed connector in the needs-you colour from a later step back to an
 * earlier point. It runs down the right side of its box from the top right
 * corner and back along the bottom towards the bottom left corner, where its
 * head points left, its tip 4 px (spacing `4`) in from the corner, as in
 * Figma. Give it a box from the earlier point's right edge to the middle of
 * the later step, and from under the later step down to the height of the
 * earlier point's middle.
 */
export function FlowLoop({ label }: FlowLoopProps) {
  return (
    <LoopRoot>
      <LoopDown aria-hidden="true" />
      <LoopBack aria-hidden="true" />
      <LoopHead aria-hidden="true" />
      {present(label) ? <LoopLabel>{label}</LoopLabel> : null}
    </LoopRoot>
  )
}
