import { defineSlotRecipe } from '@pandacss/dev'

// The one-line record of a tool call in a chat. Workbench D2 105:871 and
// phone M3 105:2787: a row with gap 6, centred, no fill, border or padding;
// a 6 px dot (105:872) and the call in Geist Mono 12 (`mono`) in #8a97b8
// (fg.muted), name and target in one run (105:873). The dot is #6ee7a8
// (status.done) on a finished call and #9b8cff (merged into
// status.running) on the running call of M12 147:383. Figma draws no failed
// call and no expanded output: a failed call takes status.danger, and the
// output takes the transcript card of D3 105:1345 (rgba(7,11,20,0.6) =
// surface.well, padding 10, radius 8, Mono 11 merged into `mono`, #e6ecff).
export const toolLine = defineSlotRecipe({
  className: 'tool-line',
  jsx: ['ToolLine'],
  staticCss: ['*'],
  slots: ['root', 'header', 'dot', 'text', 'chevron', 'output'],
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: '6', minW: '0' },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '6',
      minW: '0',
      maxW: '100%',
      alignSelf: 'flex-start',
      p: '0',
      bg: 'transparent',
      borderWidth: '0',
      borderRadius: 'xs',
      color: 'fg.muted',
      textStyle: 'mono',
      textAlign: 'start',
      outline: 'none',
      '&:is(button)': { cursor: 'pointer' },
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
    },
    dot: { flexShrink: '0', w: '6', h: '6', borderRadius: 'full' },
    // TruncatedText inside cuts a long tool and target and shows it whole in a tooltip.
    text: { minW: '0' },
    chevron: { display: 'inline-flex', flexShrink: '0' },
    output: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4',
      minW: '0',
      p: '10',
      bg: 'surface.well',
      borderRadius: 'md',
      color: 'fg.default',
      textStyle: 'mono',
      whiteSpace: 'pre-wrap',
      overflowWrap: 'anywhere',
      _hidden: { display: 'none' },
    },
  },
  variants: {
    state: {
      running: { dot: { bg: 'status.running.fg' } },
      done: { dot: { bg: 'status.done.fg' } },
      failed: { dot: { bg: 'status.danger.fg' } },
    },
  },
  defaultVariants: { state: 'done' },
})
