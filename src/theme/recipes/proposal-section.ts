import { defineSlotRecipe } from '@pandacss/dev'

// The sections inside a proposal block (proposal-block.ts).
// A labelled section: D15 diff 403:1455 and D19 reason 403:3408. A column
// with gap 4; the label in Geist Mono 11 #4a5675 (eyebrow, fg.subtle on
// surface.inset), the text in Geist Regular 12/17 #e6ecff (`small`).
// Diff lines 403:1457, 403:1460, 403:1463: radius 6, padding 8 by 5 (5 is
// no token: 6, d-072), gap 6, 4 apart; the sign in Geist Mono 12, the text
// in Geist Regular 12/17. A removed line is rgba(255,107,128,0.1)
// (diff.removed.bg), sign #ff6b80 (status.danger.fg), text #ff9aab
// (diff.removed.fg) struck through; an added line is diff.added.
// The command box of D1 105:294: rgba(7,11,20,0.7) (merged into
// surface.well), radius 6, padding 8, Geist Mono 12 #e6ecff.
export const proposalSection = defineSlotRecipe({
  className: 'proposal-section',
  jsx: ['ProposalSection', 'ProposalDiff', 'ProposalCommand'],
  staticCss: ['*'],
  slots: ['root', 'label', 'text', 'lines', 'line', 'sign', 'lineText', 'command'],
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: '4', minW: '0' },
    label: { textStyle: 'eyebrow', textTransform: 'uppercase', color: 'fg.subtle', m: '0' },
    text: { textStyle: 'small', color: 'fg.default', m: '0', overflowWrap: 'anywhere' },
    lines: { display: 'flex', flexDirection: 'column', gap: '4', m: '0', p: '0', listStyle: 'none' },
    // Each line carries data-change="removed" or "added"; one list holds both.
    line: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '6',
      px: '8',
      py: '6',
      borderRadius: 'sm',
      '&[data-change=removed]': { bg: 'diff.removed.bg' },
      '&[data-change=added]': { bg: 'diff.added.bg' },
    },
    sign: {
      flexShrink: '0',
      textStyle: 'mono',
      '[data-change=removed] > &': { color: 'status.danger.fg' },
      '[data-change=added] > &': { color: 'diff.added.fg' },
    },
    lineText: {
      minW: '0',
      textStyle: 'small',
      textDecoration: 'none',
      // Keep spaces and indentation, so a change in whitespace shows.
      whiteSpace: 'pre-wrap',
      overflowWrap: 'anywhere',
      '[data-change=removed] > &': { color: 'diff.removed.fg', textDecoration: 'line-through' },
      '[data-change=added] > &': { color: 'diff.added.fg' },
    },
    command: {
      m: '0',
      p: '8',
      bg: 'surface.well',
      borderRadius: 'sm',
      color: 'fg.default',
      textStyle: 'mono',
      whiteSpace: 'pre-wrap',
      overflowWrap: 'anywhere',
      '& code': { font: 'inherit' },
    },
  },
})
