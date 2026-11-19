import type { ReactNode } from 'react'
import { styled } from '../../styled-system/jsx'
import { backdrop, type BackdropVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'

const Root = styled('div', backdrop)

export type BackdropProps = Scalar<BackdropVariantProps> & {
  /** What sits on the backdrop: the app shell or a page. */
  children?: ReactNode
}

/**
 * The page background: `bg.canvas` under a radial glow centred on the
 * page, with stars. `size` picks the star field drawn for that frame size:
 * `desktop` (99 stars, the default), `tablet` (58) or `phone` (22). The
 * glow and stars come from the theme's `backdrop.*` colours, so a theme or
 * mode can turn them off. It takes the height of its parent, which must
 * have a definite height (such as `100dvh`); taller content scrolls inside
 * it, with no scroll bar and no bounce of the page, while the glow and stars
 * stay put.
 */
export function Backdrop({ size, children }: BackdropProps) {
  return <Root size={size}>{children}</Root>
}
