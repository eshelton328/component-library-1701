import { defineSlotRecipe } from '@pandacss/dev'

// The connectors of a workflow flow (the-bridge's Toolkit, gap "Workflow
// page flow"): a straight line, a fork or join elbow, and a dashed loop
// back. Each fills the box its caller gives it and draws in CSS, so the
// line takes any length and the arrow head stays the same.
//
// Figma draws them as vectors with a 1.5 px stroke (borderWidths.strong)
// in the muted text colour (fg.muted, D13 447:74 to 447:82, T08 502:3,
// 502:9, M09 464:559, 464:561), or in the needs-you colour for a gate's way
// out (447:83) and the dashed loop (447:84). Each line ends in an open
// arrow head whose arms run 45° back from the tip; Figma's export measures
// them about 6.4 px long, drawn here as the two sides of a square half
// the 12 px icon (6 px) turned 45° about its corner, with the corner on the
// tip. Chrome draws a 1.5 px border 1 px wide on a 1x screen and 1.5 on a
// 2x screen, as it does the checkbox outline.

// The stroke, and its half, which centres a line on its box's edge or middle.
const stroke = 'token(borderWidths.strong)'
const half = `${stroke} / 2`

// The head: the two drawn sides of a square, turned 45° about the corner
// between them, so that corner is the tip. Each direction draws other sides.
const headBase = {
  position: 'absolute',
  w: 'calc(token(sizes.icon.12) / 2)',
  h: 'calc(token(sizes.icon.12) / 2)',
  borderWidth: '0',
  borderStyle: 'solid',
  borderColor: 'currentColor',
  transform: 'rotate(45deg)',
} as const
const heads = {
  right: { borderTopWidth: 'strong', borderRightWidth: 'strong', transformOrigin: 'top right' },
  down: { borderRightWidth: 'strong', borderBottomWidth: 'strong', transformOrigin: 'bottom right' },
  left: { borderBottomWidth: 'strong', borderLeftWidth: 'strong', transformOrigin: 'bottom left' },
  up: { borderLeftWidth: 'strong', borderTopWidth: 'strong', transformOrigin: 'top left' },
} as const

const lineBase = { position: 'absolute', borderWidth: '0', borderStyle: 'solid', borderColor: 'currentColor' } as const

const tones = {
  default: { root: { color: 'fg.muted' } },
  needsYou: { root: { color: 'status.needsYou.fg' } },
} as const

// A straight line with an arrow head at its end, across or down its box
// (D13 447:74 to 447:78, 20 px between stages; the gate's way out 447:83,
// 90 px down; T08 448:223 and M09 448:500, 18 px between column steps). The
// box is the 12 px head wide across the line and fills its container along
// it; the line runs the whole length and the head's tip is the box's end.
// A label stands beside a vertical line, 8 from it and 12 under its start
// (`no`, 447:85), and under a horizontal one, in the middle.
export const flowLine = defineSlotRecipe({
  className: 'flow-line',
  jsx: ['FlowLine'],
  staticCss: ['*'],
  slots: ['root', 'line', 'head', 'label'],
  base: {
    root: { position: 'relative', display: 'block', flexShrink: '0' },
    line: lineBase,
    head: headBase,
    label: { position: 'absolute', textStyle: 'small', color: 'currentColor', whiteSpace: 'nowrap' },
  },
  variants: {
    direction: {
      right: {
        root: { w: '100%', minW: 'icon.12', h: 'icon.12' },
        line: { insetInline: '0', top: `calc(50% - ${half})`, borderTopWidth: 'strong' },
        head: { ...heads.right, right: '0', top: '50%' },
      },
      left: {
        root: { w: '100%', minW: 'icon.12', h: 'icon.12' },
        line: { insetInline: '0', top: `calc(50% - ${half})`, borderTopWidth: 'strong' },
        head: { ...heads.left, left: '0', bottom: '50%' },
      },
      down: {
        root: { h: '100%', minH: 'icon.12', w: 'icon.12' },
        line: { insetBlock: '0', left: `calc(50% - ${half})`, borderLeftWidth: 'strong' },
        head: { ...heads.down, right: '50%', bottom: '0' },
      },
      up: {
        root: { h: '100%', minH: 'icon.12', w: 'icon.12' },
        line: { insetBlock: '0', left: `calc(50% - ${half})`, borderLeftWidth: 'strong' },
        head: { ...heads.up, left: '50%', top: '0' },
      },
    },
    tone: tones,
  },
  compoundVariants: [
    { direction: ['right', 'left'], css: { label: { top: '100%', insetInline: '0', display: 'flex', justifyContent: 'center', mt: '2' } } },
    { direction: ['down', 'up'], css: { label: { left: '100%', top: '12', ms: '2' } } },
  ],
  defaultVariants: { direction: 'right', tone: 'default' },
})

// The gap between the two branches (one value for each spacing token, as
// the layout recipes' gap) sets where their arms sit: each arm is
// in the middle of its branch, a quarter of (the box less the gap) in from
// its side, as two equal steps the gap apart have their middles.
const arm = 'calc((100% - var(--flow-branch-gap)) / 4)'
const armLine = `calc((100% - var(--flow-branch-gap)) / 4 - ${half})`
const armFar = 'calc(100% - (100% - var(--flow-branch-gap)) / 4)'
const branchGap = {
  '0': { root: { '--flow-branch-gap': 'token(spacing.0)' } },
  '2': { root: { '--flow-branch-gap': 'token(spacing.2)' } },
  '4': { root: { '--flow-branch-gap': 'token(spacing.4)' } },
  '6': { root: { '--flow-branch-gap': 'token(spacing.6)' } },
  '8': { root: { '--flow-branch-gap': 'token(spacing.8)' } },
  '10': { root: { '--flow-branch-gap': 'token(spacing.10)' } },
  '12': { root: { '--flow-branch-gap': 'token(spacing.12)' } },
  '16': { root: { '--flow-branch-gap': 'token(spacing.16)' } },
  '20': { root: { '--flow-branch-gap': 'token(spacing.20)' } },
  '24': { root: { '--flow-branch-gap': 'token(spacing.24)' } },
  '32': { root: { '--flow-branch-gap': 'token(spacing.32)' } },
  '40': { root: { '--flow-branch-gap': 'token(spacing.40)' } },
} as const

// An elbow between one step and two parallel steps: a fork from the one
// into the two, or a join from the two into the one. The box spans both
// parallel steps across the flow, with the same gap between them as the
// steps have, and fills its container along the flow; the stem runs from
// the middle of the one side to the spine halfway, and an arm from the
// spine to the middle of each branch on the other side. A fork has a head
// on each arm, a join one on the stem.
// - right: D13 447:79 and 447:80 (step 3 into steps 4 and 5, 20 × 160, the
//   spine 11 in) and 447:81, 447:82 (steps 4 and 5 into step 6); the
//   parallel cards are 32 apart.
// - down: T08 `fork · 4 and 5` 502:2 and `join · 4 and 5` 502:8 (22 high,
//   the spine 8 from the cards) and M09 464:559, 464:561 (187 × 23 between
//   the middles of two cards 8 apart, the spine 9 under the card). The
//   spine sits halfway here, so a 22 px box puts it 11 from each side.
export const flowBranch = defineSlotRecipe({
  className: 'flow-branch',
  jsx: ['FlowBranch'],
  staticCss: ['*'],
  slots: ['root', 'stem', 'spine', 'arm', 'head'],
  base: {
    root: { position: 'relative', display: 'block', flexShrink: '0', w: '100%', h: '100%', color: 'fg.muted' },
    stem: lineBase,
    spine: lineBase,
    arm: lineBase,
    head: headBase,
  },
  variants: {
    kind: { fork: {}, join: {} },
    direction: {
      down: {
        root: { minH: 'icon.12', minW: 'calc(2 * token(sizes.icon.12))' },
        stem: { left: `calc(50% - ${half})`, borderLeftWidth: 'strong' },
        spine: { top: `calc(50% - ${half})`, insetInline: armLine, borderTopWidth: 'strong' },
        arm: { borderLeftWidth: 'strong', '&[data-side=start]': { left: armLine }, '&[data-side=end]': { right: armLine } },
      },
      right: {
        root: { minW: 'icon.12', minH: 'calc(2 * token(sizes.icon.12))' },
        stem: { top: `calc(50% - ${half})`, borderTopWidth: 'strong' },
        spine: { left: `calc(50% - ${half})`, insetBlock: armLine, borderLeftWidth: 'strong' },
        arm: { borderTopWidth: 'strong', '&[data-side=start]': { top: armLine }, '&[data-side=end]': { bottom: armLine } },
      },
    },
    gap: branchGap,
  },
  compoundVariants: [
    {
      kind: 'fork',
      direction: 'down',
      css: {
        stem: { top: '0', bottom: '50%' },
        arm: { top: '50%', bottom: '0' },
        head: {
          ...heads.down,
          bottom: '0',
          '&[data-side=start]': { right: `calc(100% - ${arm})` },
          '&[data-side=end]': { right: arm },
        },
      },
    },
    {
      kind: 'join',
      direction: 'down',
      css: {
        stem: { top: '50%', bottom: '0' },
        arm: { top: '0', bottom: '50%' },
        head: { ...heads.down, bottom: '0', right: '50%' },
      },
    },
    {
      kind: 'fork',
      direction: 'right',
      css: {
        stem: { left: '0', right: '50%' },
        arm: { left: '50%', right: '0' },
        head: {
          ...heads.right,
          right: '0',
          '&[data-side=start]': { top: arm },
          '&[data-side=end]': { top: armFar },
        },
      },
    },
    {
      kind: 'join',
      direction: 'right',
      css: {
        stem: { left: '50%', right: '0' },
        arm: { left: '0', right: '50%' },
        head: { ...heads.right, right: '0', top: '50%' },
      },
    },
  ],
  defaultVariants: { kind: 'fork', direction: 'down', gap: '8' },
})

// A dashed loop from a later step back to an earlier point (D13 `arrow`
// 447:84, 1094 × 107.5): from its box's top right corner, under the later
// step, down the right side and back along the bottom into the earlier
// point, with the head on the bottom left corner pointing at it. The lines
// sit on the box's edges, so the box runs from the later step's middle to
// the earlier point's edge across, and from under the later step to the
// height the line meets the earlier point. In the needs-you colour,
// dashed; an optional label in mono under the line, in its middle
// (`new failure`, 447:86, in Figma 4 under the line, nearer the turn).
export const flowLoop = defineSlotRecipe({
  className: 'flow-loop',
  jsx: ['FlowLoop'],
  staticCss: ['*'],
  slots: ['root', 'path', 'head', 'label'],
  base: {
    root: {
      position: 'relative',
      display: 'block',
      w: '100%',
      h: '100%',
      minW: 'calc(2 * token(sizes.icon.12))',
      minH: 'icon.12',
      color: 'status.needsYou.fg',
    },
    path: {
      position: 'absolute',
      top: '0',
      left: '0',
      right: `calc(-1 * ${half})`,
      bottom: `calc(-1 * ${half})`,
      borderWidth: '0',
      borderStyle: 'dashed',
      borderColor: 'currentColor',
      borderRightWidth: 'strong',
      borderBottomWidth: 'strong',
    },
    head: { ...headBase, ...heads.left, left: '0', bottom: '0' },
    label: {
      position: 'absolute',
      top: `calc(100% + ${half} + token(spacing.4))`,
      insetInline: '0',
      display: 'flex',
      justifyContent: 'center',
      textStyle: 'mono',
      color: 'currentColor',
      whiteSpace: 'nowrap',
    },
  },
})
