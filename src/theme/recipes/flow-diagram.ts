import { defineSlotRecipe } from '@pandacss/dev'

// The colour of a "uses" chip's text, by what the step uses. Figma
// (Toolkit D14 460:2) draws files and skills in text colour, rules in
// amber, scripts in cyan and agents in violet.
const usesTones = {
  '&[data-kind=file]': { color: 'fg.default' },
  '&[data-kind=skill]': { color: 'fg.default' },
  '&[data-kind=code]': { color: 'fg.accent' },
  '&[data-kind=rule]': { color: 'kind.rule' },
  '&[data-kind=agent]': { color: 'kind.agent' },
  '&[data-kind=workflow]': { color: 'kind.workflow' },
  '&[data-kind=hook]': { color: 'kind.hook' },
}

// The steps of a skill, drawn top to bottom as on the phone (Toolkit M12
// 461:572): step cards with an arrow between them. A card (461:582,
// 460:3) is surface.raised with a 1 px border and radius 10, the number
// badge on the left and the title, description and "uses" chips on the
// right. A step that repeats (460:48) has an amber border and a loop
// marker (460:59).
export const flowDiagram = defineSlotRecipe({
  className: 'flow-diagram',
  jsx: ['FlowDiagram'],
  staticCss: ['*'],
  slots: ['root', 'step', 'card', 'number', 'body', 'title', 'description', 'uses', 'chip', 'chipIcon', 'loop', 'connector'],
  base: {
    root: { display: 'flex', flexDirection: 'column', listStyle: 'none', m: '0', p: '0' },
    step: { display: 'flex', flexDirection: 'column' },
    card: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10',
      py: '10',
      px: '12',
      bg: 'surface.raised',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      borderRadius: 'lg',
      '&[data-loop]': { borderColor: 'status.needsYou.border' },
    },
    number: {
      flexShrink: '0',
      px: '8',
      textStyle: 'mono',
      color: 'fg.default',
      bg: 'surface.overlay',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      borderRadius: 'md',
      fontVariantNumeric: 'tabular-nums',
    },
    body: { display: 'flex', flexDirection: 'column', gap: '4', minW: '0' },
    title: { textStyle: 'label', color: 'fg.default', m: '0', overflowWrap: 'anywhere' },
    description: { textStyle: 'small', color: 'fg.muted', m: '0', overflowWrap: 'anywhere' },
    uses: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6', listStyle: 'none', m: '0', p: '0', pt: '4' },
    chip: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6',
      py: '2',
      px: '6',
      textStyle: 'mono',
      bg: 'surface.overlay',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      borderRadius: 'sm',
      // A long name breaks inside the chip rather than overflow the card.
      maxW: '100%',
      minW: '0',
      overflowWrap: 'anywhere',
      ...usesTones,
    },
    // The icon is drawn at 12 px, whatever size it was given.
    chipIcon: { display: 'inline-flex', flexShrink: '0', '& svg': { w: 'icon.12!', h: 'icon.12!' } },
    loop: {
      display: 'inline-flex',
      alignItems: 'center',
      py: '2',
      px: '6',
      textStyle: 'mono',
      color: 'status.needsYou.fg',
      bg: 'status.needsYou.bg',
      borderRadius: 'sm',
    },
    // The arrow to the next step: a 12 px arrow in a 14 px row (461:579).
    connector: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      h: 'icon.14',
      color: 'fg.muted',
    },
  },
})

// The shorter path a chat answer takes (D14 501:62): a box with a title, a
// line of text and the steps it keeps as pills in a wrapping row, with an
// arrow between them. A pill (501:66) has a 1 px cyan border, radius 8, a
// number circle on surface.selected and the step name; a pill may add a
// short note in muted text (501:94).
export const chatPath = defineSlotRecipe({
  className: 'chat-path',
  jsx: ['ChatPath'],
  staticCss: ['*'],
  slots: ['root', 'title', 'description', 'steps', 'step', 'pill', 'number', 'label', 'note', 'arrow'],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10',
      py: '16',
      px: '16',
      bg: 'surface.raised',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      borderRadius: 'lg',
    },
    title: { textStyle: 'mono', color: 'fg.muted', textTransform: 'uppercase', m: '0' },
    description: { textStyle: 'small', color: 'fg.muted', m: '0' },
    steps: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8', listStyle: 'none', m: '0', p: '0' },
    step: { display: 'inline-flex', alignItems: 'center', gap: '8', maxW: '100%', minW: '0' },
    pill: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6',
      py: '6',
      ps: '6',
      pe: '10',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'accent.default',
      borderRadius: 'md',
      minW: '0',
    },
    number: {
      flexShrink: '0',
      py: '2',
      px: '8',
      textStyle: 'mono',
      color: 'fg.accent',
      bg: 'surface.selected',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.active',
      borderRadius: 'md',
    },
    label: { textStyle: 'label', color: 'fg.default', minW: '0', overflowWrap: 'anywhere' },
    note: { textStyle: 'small', color: 'fg.muted', minW: '0', overflowWrap: 'anywhere' },
    // An arrow pointing right (501:70).
    arrow: { display: 'inline-flex', color: 'fg.muted' },
  },
})
