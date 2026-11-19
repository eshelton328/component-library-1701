import { defineRecipe } from '@pandacss/dev'
import { desktopStars, phoneStars, tabletStars, type Star } from './backdrop-stars'
import { scrollArea } from './scroll-area'

// The page backdrop: bg.canvas under a radial glow, with stars over it.
// Figma (Inbox D1 346:5, T1 346:5353, M1 346:8982) draws the glow as an
// ellipse centred on the frame with radii of half its width and height,
// stops rgba(27,42,85,0.85) at 0, rgba(17,27,53,0.425) at 0.5 and the
// canvas colour at alpha 0 at 1. Those are backdrop.glow, backdrop.glowEdge
// and transparent (CSS gradients mix in premultiplied alpha, so transparent
// black and transparent canvas give the same pixels). `closest-side` on a
// centred ellipse is half the width and half the height.
// The stars come from the theme too: backdrop.star, which the light mode
// sets to alpha 0, as it sets glowEdge, so a theme can drop them (d-035).
// Each star is one radial gradient layer at its Figma centre. Its 0.5 px
// anti-aliased edge is centred on the radius (solid to r - 0.25, clear at
// r + 0.25), so the star covers the area of its Figma circle.

const glow =
  'radial-gradient(ellipse closest-side at 50% 50%, token(colors.backdrop.glow) 0%, token(colors.backdrop.glowEdge) 50%, transparent 100%)'

const star = ([x, y, d]: Star) =>
  `radial-gradient(circle at ${String(x)}% ${String(y)}%, token(colors.backdrop.star) ${String(d / 2 - 0.25)}px, transparent ${String(d / 2 + 0.25)}px)`

// Stars first: the first layer paints on top.
const sky = (stars: readonly Star[]) => [...stars.map(star), glow].join(', ')

/** The page background: canvas, glow and stars, per size. */
export const backdrop = defineRecipe({
  className: 'backdrop',
  jsx: ['Backdrop'],
  staticCss: ['*'],
  base: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    minW: '0',
    // The height of its parent, which must have a definite height (such as
    // 100dvh): taller content scrolls here, and the glow and stars stay put.
    h: '100%',
    minH: '0',
    overflowY: 'auto',
    ...scrollArea,
    bg: 'bg.canvas',
    color: 'fg.default',
    backgroundRepeat: 'no-repeat',
  },
  variants: {
    size: {
      desktop: { backgroundImage: sky(desktopStars) },
      tablet: { backgroundImage: sky(tabletStars) },
      phone: { backgroundImage: sky(phoneStars) },
    },
  },
  defaultVariants: { size: 'desktop' },
})
