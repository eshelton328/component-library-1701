import { defineRecipe } from '@pandacss/dev'

// The needs-you badge on a nav item's icon, shared by the nav rail and the
// tab bar: rail 346:120 (digit 346:121), tablet tab 346:5587, phone tab
// 252:15. Figma draws it 17 x 15 with padding x 5 / y 1 and a 2 px ring
// stroked inside the box, so the ring covers 2 px of that padding. Here the
// ring is a border, so the padding is Figma's less the ring: y 1 - 2 takes
// `0`. A one-digit badge is a 16 x 16 circle, not Figma's 17 x 15 oval
// (the owner, 2026-11-16: round badges stay round): x padding `2` and a 16 px
// minimum width, so two digits grow it into a pill.
export const navBadge = defineRecipe({
  className: 'nav-badge',
  jsx: ['NavBadge'],
  staticCss: ['*'],
  base: {
    position: 'absolute',
    // Figma left 14 / top -4 from the 24 px icon (tabs; the rail draws
    // 13 / -5 from a 22 px icon). Left 14 takes `16`, the larger of 12 and 16 (d-072).
    top: '-4',
    insetStart: '16',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minW: '16',
    px: '2',
    py: '0',
    borderRadius: 'full',
    borderWidth: 'ring',
    borderStyle: 'solid',
    borderColor: 'surface.overlay',
    bg: 'status.needsYou.fg',
    color: 'fg.onAccent',
    textStyle: 'badge',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  },
})
