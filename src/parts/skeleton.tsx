import { useEffect, useState, type ReactNode } from 'react'
import { styled } from '../../styled-system/jsx'
import { skeleton, skeletonGroup, type SkeletonVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'

const Shape = styled('span', skeleton)

export type SkeletonProps = Scalar<SkeletonVariantProps>

export type SkeletonShape = NonNullable<SkeletonProps['shape']>
export type SkeletonWidth = NonNullable<SkeletonProps['width']>
export type SkeletonSize = NonNullable<SkeletonProps['size']>

/**
 * A placeholder in the shape of content that is still loading, so nothing moves when the content comes. It
 * shimmers slowly; with prefers-reduced-motion it is a still block. It is hidden from assistive technology:
 * put the skeletons in a `SkeletonGroup`, which says what loads.
 *
 * - `line` (the default) is one line of the text style it sits in, such as a row's title or meta. `width`
 *   is `full` (the default), `long` (3/4), `half` or `short` (1/3) of its parent, or `word` (40 px) in a box
 *   that is as wide as its text, such as a group header's label.
 * - `block` fills its parent (`size="fill"`, the default), or takes the width of its parent at a Thumbnail's
 *   `ratio` (`wide`, `compact`, `banner`), or a part's size: a kind tile (`kindTileSm`, `kindTileLg`) or an
 *   artifact row's preview (`thumbnailSm` 64 × 40, `thumbnailMd` 76 × 48, `thumbnailLg` 128 × 72).
 * - `circle` takes an icon size (`icon12` to `icon24`), such as a kind mark's.
 */
export function Skeleton({ shape = 'line', width, size, ratio }: SkeletonProps) {
  const sized = shape === 'line' ? { width: width ?? 'full' } : { size: size ?? (shape === 'circle' ? 'icon16' : 'fill'), ratio }
  return (
    <Shape shape={shape} {...sized} aria-hidden="true" data-skeleton={shape}>
      {shape === 'line' ? '\u{a0}' : null}
    </Shape>
  )
}

export type SkeletonGroupProps = {
  /** What loads, such as "Loading the Inbox". A screen reader says it once, as a status. */
  label: string
  /** The skeletons, such as rows with `loading` set. */
  children: ReactNode
}

/**
 * The place that waits for content: a status named by `label`. The status is in place empty first and then
 * says `label` as hidden text, so a screen reader announces it; it is never `aria-busy`, which would stop
 * the announcement. Its skeletons are hidden from assistive technology; the caller replaces the group with the
 * content when it comes.
 */
export function SkeletonGroup({ label, children }: SkeletonGroupProps) {
  const [said, setSaid] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSaid(true)
    })
    return () => {
      clearTimeout(timer)
    }
  }, [])
  const classes = skeletonGroup()
  return (
    <div role="status" aria-label={label} className={classes.root}>
      <span className={classes.label}>{said ? label : ''}</span>
      {children}
    </div>
  )
}
