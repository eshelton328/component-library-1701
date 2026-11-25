import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'
import { scrollAreaX } from './scroll-area'

// A fenced code block in rendered Markdown, such as a chat reply's code
// (the-bridge chat rich text, 2026-11-25). No Figma frame draws one: the box
// takes surface.well ("command blocks"), a 1 px border.default line and
// radius md; the head holds the fence's language in labelSm, fg.muted, and
// the caller's copy button at its end. The body is the code in the `code`
// style on one line each: a long line scrolls the body sideways (scrollAreaX)
// and never wraps, and the body is then a tab stop. Syntax colours are the
// `code.*` tokens of CodeLines. In a diff, an added line takes the
// diff.added tint and text colour, a removed line diff.removed, as the
// ProposalDiff lines do, its syntax pieces in the line's diff colour. A long block
// folds: the foot holds "Show all" under the first lines.
export const markdownCodeBlock = defineSlotRecipe({
  className: 'markdown-code-block',
  jsx: ['MarkdownCodeBlock'],
  staticCss: ['*'],
  slots: ['root', 'head', 'label', 'status', 'body', 'code', 'line', 'foot'],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      minW: '0',
      bg: 'surface.well',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      borderRadius: 'md',
      overflow: 'hidden',
    },
    head: {
      display: 'flex',
      alignItems: 'center',
      gap: '8',
      minH: 'control.sm',
      ps: '12',
      pe: '6',
      py: '2',
      borderBottomWidth: 'default',
      borderBottomStyle: 'solid',
      borderBottomColor: 'border.default',
    },
    label: { flex: '1', minW: '0', textStyle: 'labelSm', color: 'fg.muted', overflowWrap: 'anywhere' },
    status: { textStyle: 'labelSm', color: 'fg.muted' },
    body: {
      m: '0',
      p: '12',
      textStyle: 'code',
      color: 'fg.default',
      whiteSpace: 'pre',
      overflowWrap: 'normal',
      overflowX: 'auto',
      ...scrollAreaX,
      outline: 'none',
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '-2' },
    },
    // A grid as wide as the longest line, so a diff line's tint spans the scrolled width.
    code: { display: 'grid', minW: '100%', w: 'max-content', font: 'inherit' },
    line: {
      display: 'block',
      '&[data-change=added]': { bg: 'diff.added.bg', color: 'diff.added.fg' },
      '&[data-change=removed]': { bg: 'diff.removed.bg', color: 'diff.removed.fg' },
      // A changed line's syntax pieces take its diff colour: a `code.*` colour on a diff tint is not checked for
      // contrast (code.comment on diff.removed.bg is 4.45:1 in Light), and the diff colour is.
      '&[data-change] [data-kind]': { color: 'inherit' },
    },
    foot: {
      display: 'flex',
      justifyContent: 'center',
      py: '2',
      borderTopWidth: 'default',
      borderTopStyle: 'solid',
      borderTopColor: 'border.default',
    },
  },
})
