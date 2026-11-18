import { defineSlotRecipe } from '@pandacss/dev'

// The "Explain" view of a script in Toolkit D10 (explain pane 440:1423):
// padding 18 (20 here, d-072) and 16 between sections. The overview card
// 440:1424 is #17213a (surface.raised) with a 1 px #24314f border, radius
// 10 (`radius.lg`), padding 12 by 14 (12 by 16), 8 between rows. Labels
// are Geist Mono 12 caps #8a97b8 (440:1425), merged into `eyebrow`. The
// In / Out / Exit rows (440:1427) have a 10 gap, keys mono #8a97b8 and
// values mono #e6ecff; each key sits in a 40 px column (In 440:1428, Out
// 440:1431, Exit 440:1434; T06 440:1930 to 440:1936 and M08 440:1635 to
// 440:1641 the same), so every value starts 50 after its key's start. The
// column is `spacing.40` at least and grows for a longer key. Steps (440:1437) are 12 apart; each row (440:1438)
// has a 10 gap: a round number badge (440:1439: a 22 by 22 circle, 24 here
// on the 4 px grid (d-072), surface.raised, 1 px border.default, digit
// Regular 12/17 #e6ecff), the text (440:1443, body
// #e6ecff) and a line link (440:1441: 1 px cyan 0.5 border, radius 5 merged
// into `radius.sm`, padding 2 by 6, mono #5ee1ff). The note (440:1480) is
// Regular 12/17 #8a97b8.
//
// `layout: narrow` is the phone's Explain view (M08 `explain` 440:1630, 366
// wide): no padding, so the overview card (440:1631) starts at the item's
// edge; the card, WALKTHROUGH (440:1643) and the steps (440:1644) 12 apart;
// the steps 10 apart; and each line link (440:1648) 4 under its step's text
// (440:1650) at the text's start, not at the row's end.
export const scriptExplanation = defineSlotRecipe({
  className: 'script-explanation',
  jsx: ['ScriptExplanation'],
  staticCss: ['*'],
  slots: ['root', 'card', 'label', 'summary', 'facts', 'factKey', 'factValue', 'steps', 'step', 'stepNumber', 'stepText', 'lineLink', 'note'],
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: '16', p: '20', minW: '0' },
    card: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8',
      py: '12',
      px: '16',
      bg: 'surface.raised',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      borderRadius: 'lg',
    },
    label: { textStyle: 'eyebrow', textTransform: 'uppercase', color: 'fg.muted', m: '0' },
    summary: { textStyle: 'body', color: 'fg.default', m: '0' },
    facts: {
      display: 'grid',
      gridTemplateColumns: 'minmax(token(spacing.40), max-content) minmax(0, 1fr)',
      columnGap: '10',
      rowGap: '8',
      m: '0',
    },
    factKey: { textStyle: 'mono', color: 'fg.muted' },
    factValue: { textStyle: 'mono', color: 'fg.default', m: '0', overflowWrap: 'anywhere' },
    steps: { display: 'flex', flexDirection: 'column', gap: '12', m: '0', p: '0', listStyle: 'none' },
    step: { display: 'flex', alignItems: 'flex-start', gap: '10' },
    stepNumber: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: '0',
      w: '24',
      h: '24',
      textStyle: 'small',
      color: 'fg.default',
      bg: 'surface.raised',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      borderRadius: 'full',
      fontVariantNumeric: 'tabular-nums',
    },
    stepText: { flex: '1', minW: '0', textStyle: 'body', color: 'fg.default', overflowWrap: 'anywhere' },
    lineLink: {
      flexShrink: '0',
      px: '6',
      py: '2',
      textStyle: 'mono',
      color: 'fg.accent',
      bg: 'transparent',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.selected',
      borderRadius: 'sm',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      _hover: { bg: 'accent.faint' },
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
    },
    // The note starts with a 13 px spark (14 here), 6 before the text.
    note: { display: 'flex', alignItems: 'center', gap: '6', textStyle: 'small', color: 'fg.muted', m: '0' },
  },
  variants: {
    layout: {
      wide: {},
      narrow: {
        root: { p: '0', gap: '12' },
        steps: { gap: '10' },
        // The number in the first column; the text and, under it, the line link in the second. The
        // number spans both rows, so a one-line text (20) keeps its link 4 under it, not under the 24 px number.
        step: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', columnGap: '10', rowGap: '4' },
        stepNumber: { gridRow: 'span 2' },
        lineLink: { gridColumn: '2', justifySelf: 'start' },
      },
    },
  },
  defaultVariants: { layout: 'wide' },
})
