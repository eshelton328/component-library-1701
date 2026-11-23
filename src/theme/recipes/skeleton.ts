import { defineRecipe } from '@pandacss/dev'

// The fill of a Skeleton: skeleton.base with a band of skeleton.shine that crosses it slowly and repeats
// (duration.shimmer, easing.shimmer). With prefers-reduced-motion it is a still block of skeleton.base.
const fill = {
  bg: 'skeleton.base',
  backgroundImage: 'linear-gradient(90deg, token(colors.skeleton.base) 25%, token(colors.skeleton.shine) 50%, token(colors.skeleton.base) 75%)',
  backgroundSize: '200% 100%',
  animationName: 'shimmer',
  animationDuration: 'shimmer',
  animationTimingFunction: 'shimmer',
  animationIterationCount: 'infinite',
  _motionReduce: { animationName: 'none', backgroundImage: 'none' },
} as const

// A placeholder for content that is still loading (the loading standard, 2026-11-23). A line takes the text
// style of the element it sits in: its box is one line of that text (a no-break space), so the content that
// replaces it takes the same height, and the bar is that line less 4 above and below. A block fills its parent
// or takes a size of the part it stands for; a circle takes an icon size.
export const skeleton = defineRecipe({
  className: 'skeleton',
  jsx: ['Skeleton'],
  staticCss: ['*'],
  base: { flexShrink: '0', color: 'transparent', userSelect: 'none', pointerEvents: 'none' },
  variants: {
    shape: {
      line: {
        display: 'block',
        position: 'relative',
        overflow: 'hidden',
        _before: { content: '""', position: 'absolute', insetInline: '0', top: '4', bottom: '4', borderRadius: 'sm', ...fill },
      },
      block: { display: 'block', borderRadius: 'md', ...fill },
      circle: { display: 'block', borderRadius: 'full', ...fill },
    },
    width: {
      full: { w: '100%' },
      long: { w: '3/4' },
      half: { w: '1/2' },
      short: { w: '1/3' },
      // A word, such as a group header's label, in a box that is as wide as its text.
      word: { w: '40' },
    },
    size: {
      fill: { w: '100%', h: '100%' },
      icon12: { w: 'icon.12', h: 'icon.12' },
      icon16: { w: 'icon.16', h: 'icon.16' },
      icon20: { w: 'icon.20', h: 'icon.20' },
      icon24: { w: 'icon.24', h: 'icon.24' },
      kindTileSm: { w: 'kindTile.sm', h: 'kindTile.sm' },
      kindTileLg: { w: 'kindTile.lg', h: 'kindTile.lg' },
      // An artifact preview's box (Thumbnail): sm is the desktop row's 64 × 40 and md the phone row's 76 × 48; with `fill` the
      // block takes its parent's width and `ratio` sets its height, as a card's preview does.
      thumbnailSm: { w: 'thumbnail.sm', aspectRatio: '8 / 5' },
      thumbnailMd: { w: 'thumbnail.md', aspectRatio: '19 / 12' },
      thumbnailLg: { w: 'thumbnail.lg', aspectRatio: '16 / 9' },
    },
    // The height of a `fill` block from its width, as a Thumbnail's `shape`: wide 16:9, compact 8:5, banner 2:1.
    ratio: {
      wide: { h: 'auto', aspectRatio: '16 / 9' },
      compact: { h: 'auto', aspectRatio: '8 / 5' },
      banner: { h: 'auto', aspectRatio: '2 / 1' },
    },
  },
  defaultVariants: { shape: 'line' },
})
