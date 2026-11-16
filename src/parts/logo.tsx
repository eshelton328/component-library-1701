import { logo, type LogoVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'

export type LogoProps = Scalar<LogoVariantProps> & {
  /**
   * The accessible name, such as "Span". Without one (or with only spaces)
   * the logo is decorative and hidden from assistive technology, as when
   * the link around it has its own name.
   */
  title?: string | undefined
}

export type LogoSize = NonNullable<LogoProps['size']>

/**
 * The Span logo: a bridge with a spark above it, from Figma node 402:15331
 * (`logo · Span (home)`), drawn on its 28 grid with Figma's strokes. The
 * bridge is `fg.accent` and the spark `fg.default`, as Figma colours them.
 * `size` is `28` (the default, as in the rail) or `24`.
 */
export function Logo({ size = '28', title }: LogoProps) {
  const named = title !== undefined && title.trim() !== ''
  const classes = logo({ size })
  return (
    <svg
      viewBox="0 0 28 28"
      className={classes.root}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={named ? 'img' : undefined}
      aria-hidden={named ? undefined : true}
      focusable="false"
    >
      {named ? <title>{title}</title> : null}
      <path d="M2.625 19.25C10.2083 8.75 17.7917 8.75 25.375 19.25" strokeWidth="1.75" />
      <path d="M1.75 19.25H26.25" strokeWidth="1.75" />
      <path d="M8.75 13.5625V19.25M14 11.375V19.25M19.25 13.5625V19.25" strokeWidth="1.3125" />
      <path className={classes.spark} d="M14 3.0625L14.7 4.9875L16.625 5.6875L14.7 6.3875L14 8.3125L13.3 6.3875L11.375 5.6875L13.3 4.9875L14 3.0625Z" stroke="none" />
    </svg>
  )
}
