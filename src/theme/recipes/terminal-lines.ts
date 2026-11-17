import { defineSlotRecipe } from '@pandacss/dev'

// The lines of a Workbench shell pane (D1 105:337): Geist Mono 12/16
// (`mono`, 105:338), 20 apart (gap 4), padded 12, no fill. Git colours its
// short status: a modified file amber (status.needsYou.fg), a deleted one
// red (status.danger.fg), an untracked one green (status.done.fg); other
// lines fg.default. The prompt line ends in a block cursor (105:346,
// 8 × 15 in Figma, 8 × 16 on the 4 px grid, d-100 rule 3), 4 after the
// prompt. The cursor fill is not in the gap row; it takes fg.default, the
// colour of the text it follows. The lines do not scroll; a ScrollFrame
// body or a pane body scrolls them.
export const terminalLines = defineSlotRecipe({
  className: 'terminal-lines',
  jsx: ['TerminalLines'],
  staticCss: ['*'],
  slots: ['root', 'line', 'prompt', 'cursor'],
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: '4', m: '0', p: '12', textStyle: 'mono', color: 'fg.default' },
    line: {
      whiteSpace: 'pre',
      // An empty line keeps a full line height, as a terminal shows a blank line.
      _empty: { _before: { content: '"\\200b"' } },
      '&[data-tone=modified]': { color: 'status.needsYou.fg' },
      '&[data-tone=deleted]': { color: 'status.danger.fg' },
      '&[data-tone=untracked]': { color: 'status.done.fg' },
    },
    prompt: { display: 'flex', alignItems: 'center', gap: '4', whiteSpace: 'pre' },
    cursor: { display: 'inline-block', flexShrink: '0', w: '8', h: '16', bg: 'fg.default' },
  },
})
