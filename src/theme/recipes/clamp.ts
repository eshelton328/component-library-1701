import { defineRecipe } from '@pandacss/dev'

// A block cut to a number of lines, such as the prompt of an Inbox task
// (D1 346:370), which shows about five lines and ends in a fade (346:372)
// above "Read the whole prompt". It takes the text style of its parent.
//
// `lines` sets --clamp-lines, and `fade` chooses how the block is cut.
// Without `fade` it uses line-clamp, so the last line ends in an ellipsis.
// With `fade` it cuts by height instead (its lines as a max height, in the
// parent's line height) and has no line-clamp, because Chrome draws "…" at
// the end of a clamped last line even under the mask. Figma cuts the prompt
// mid-sentence with no ellipsis and fades it (M10 `fade` 346:11014, M2
// 346:9300, D1 346:372). The fade runs over 40 px: Figma fades over 44,
// which is 4 px from the nearest spacing token (40, d-072). The fade is a
// mask, which uses only alpha, so it fades into whatever fill is behind the
// block and needs no colour token: #000 is opaque. The component sets
// data-cut when the text is longer than the lines; a block that fits has no
// mask.
//
// Text sizes (d-122): `lines` counts lines at Small, the size of the Figma
// frames. At Default each font size is 8/7 of Small's and at Large (8/7)²,
// so a text that fits N lines at Small needs up to ceil(N × 8/7) lines at
// Default and ceil(N × 64/49) at Large; --clamp-lines takes those counts
// under the text-default and text-large classes (5 lines: 6 and 7; 8: 10
// and 11), so the text is never cut sooner than at Small. The cut and the
// fade work as at Small, from the new count.
//
// `reserve` keeps the height of the lines when the text is shorter: Figma
// keeps the Inbox prompt box 128 px high for a prompt of three lines (D16
// 403:1854), as for one of five (D1 346:370).
export const clamp = defineRecipe({
  className: 'clamp',
  jsx: ['Clamp'],
  staticCss: ['*'],
  base: {
    minW: '0',
    overflowWrap: 'anywhere',
  },
  variants: {
    lines: {
      '1': { '--clamp-lines': '1', _textDefault: { '--clamp-lines': '2' }, _textLarge: { '--clamp-lines': '2' } },
      '2': { '--clamp-lines': '2', _textDefault: { '--clamp-lines': '3' }, _textLarge: { '--clamp-lines': '3' } },
      '3': { '--clamp-lines': '3', _textDefault: { '--clamp-lines': '4' }, _textLarge: { '--clamp-lines': '4' } },
      '4': { '--clamp-lines': '4', _textDefault: { '--clamp-lines': '5' }, _textLarge: { '--clamp-lines': '6' } },
      '5': { '--clamp-lines': '5', _textDefault: { '--clamp-lines': '6' }, _textLarge: { '--clamp-lines': '7' } },
      '6': { '--clamp-lines': '6', _textDefault: { '--clamp-lines': '7' }, _textLarge: { '--clamp-lines': '8' } },
      '8': { '--clamp-lines': '8', _textDefault: { '--clamp-lines': '10' }, _textLarge: { '--clamp-lines': '11' } },
    },
    fade: {
      true: {
        overflow: 'hidden',
        maxH: 'calc(var(--clamp-lines) * 1lh)',
        '&[data-cut]': { maskImage: 'linear-gradient(to bottom, #000 calc(100% - token(spacing.40)), transparent)' },
      },
      false: { lineClamp: 'var(--clamp-lines)' },
    },
    reserve: {
      true: { minH: 'calc(var(--clamp-lines) * 1lh)' },
      false: {},
    },
  },
  defaultVariants: { lines: '4', fade: false, reserve: false },
})
