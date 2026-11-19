import { defineRecipe } from '@pandacss/dev'
import { focusRing } from './focus'

// A bare icon that is a button: no fill, no border and no padding, so it
// takes only its icon's room. Toolkit draws the copy icon this way at the end
// of the 25 px path badge (`icon/copy` D3 457:50, M2 457:192, T17 487:498,
// D10 457:127) and in the Files viewer's bar (D6 432:2297, D10 440:1364).
// The smallest Button (`xs`, control.xs 24) would make the badge 34 high.
// The icon draws at 12 (icon.12) in fg.muted, and fg.default on hover. The
// keyboard focus ring sits 2 outside the icon (radius xs), inside the badge's
// padding, so it does not change the badge's height.
export const bareIconButton = defineRecipe({
  className: 'bare-icon-button',
  jsx: ['BareIconButton'],
  staticCss: ['*'],
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: '0',
    p: '0',
    m: '0',
    bg: 'transparent',
    color: 'fg.muted',
    borderWidth: '0',
    borderRadius: 'xs',
    cursor: 'pointer',
    outline: 'none',
    _hover: { color: 'fg.default' },
    _disabled: { cursor: 'not-allowed', opacity: 'disabled', _hover: { color: 'fg.muted' } },
    [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
    // The caller passes the icon, so the size is important: a recipe's
    // `& svg` loses to the icon recipe's own size otherwise.
    '& svg': { w: 'icon.12!', h: 'icon.12!' },
  },
})
