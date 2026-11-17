import { defineRecipe } from '@pandacss/dev'

// A block cut to a number of lines, such as the prompt of an Inbox task
// (D1 346:370), which shows about five lines and ends in a fade (346:372)
// above "Read the whole prompt". It takes the text style of its parent.
//
// Without `fade` the last line ends in an ellipsis. With `fade` the end
// fades out over 40 px instead: Figma fades over 44, which is 4 px from the
// nearest spacing token (40, d-072). The fade is a mask, which uses only
// alpha, so it fades into whatever fill is behind the block and needs no
// colour token: #000 is opaque. The component sets data-cut when the text is
// longer than the lines; a block that fits has no mask.
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
      '1': { lineClamp: '1' },
      '2': { lineClamp: '2' },
      '3': { lineClamp: '3' },
      '4': { lineClamp: '4' },
      '5': { lineClamp: '5' },
      '6': { lineClamp: '6' },
      '8': { lineClamp: '8' },
    },
    fade: {
      true: {
        '&[data-cut]': { maskImage: 'linear-gradient(to bottom, #000 calc(100% - token(spacing.40)), transparent)' },
      },
      false: {},
    },
  },
  defaultVariants: { lines: '4', fade: false },
})
