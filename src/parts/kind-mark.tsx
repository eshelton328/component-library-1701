import { kindMark, type KindMarkVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'

export type KindMarkProps = Scalar<KindMarkVariantProps> & {
  /**
   * A name for a mark that stands alone, such as "Claude". Without one the
   * mark is hidden from assistive technology, because the text next to it
   * names the kind.
   */
  title?: string | undefined
}

export type KindMarkKind = NonNullable<KindMarkProps['kind']>
export type KindMarkSize = NonNullable<KindMarkProps['size']>

// The marks from the Figma design file PZoW9BBu43qRgon1KhJcwU, copied path
// for path at each size, with the 2 px stroke Figma keeps at every size.
// Each list item is one <path d>.
const marks: Record<KindMarkKind, Record<KindMarkSize, readonly string[]>> = {
  claude: {
    // 12 px: the 16 px mark (105:179) scaled by 0.75, on the 4 px icon scale.
    '12': ['M7.5 6H11M7.06 7.06L9.535 9.535M6 7.5V11M4.94 7.06L2.465 9.535M4.5 6H1M4.94 4.94L2.465 2.465M6 4.5V1M7.06 4.94L9.535 2.465'],
    // kind · claude 16, node 105:179
    '16': [
      'M9.99999 7.99998H14.6667M9.41333 9.41331L12.7133 12.7133M7.99999 9.99998V14.6666M6.58666 9.41331L3.28666 12.7133M5.99999 7.99998H1.33333M6.58666 6.58665L3.28666 3.28665M7.99999 5.99998V1.33331M9.41333 6.58665L12.7133 3.28665',
    ],
    // kind · claude 20, node 105:787
    '20': [
      'M12.5 10.0001H18.3334M11.7667 11.7667L15.8917 15.8917M10 12.5001V18.3334M8.23335 11.7667L4.10835 15.8917M7.50002 10.0001H1.66669M8.23335 8.23341L4.10835 4.10841M10 7.50008V1.66675M11.7667 8.23341L15.8917 4.10841',
    ],
  },
  codex: {
    // 12 px: the 16 px mark (105:264) scaled by 0.75.
    '12': ['M6 1L10.5 3.5V8.5L6 11L1.5 8.5V3.5L6 1Z', 'M4.5 5L5.5 6L4.5 7', 'M6.5 7H7.5'],
    // kind · codex 16, node 105:264
    '16': ['M8 1.33331L14 4.66665V11.3333L8 14.6666L2 11.3333V4.66665L8 1.33331Z', 'M6 6.66669L7.33333 8.00002L6 9.33335', 'M8.66669 9.33331H10'],
    // kind · codex 20, node 128:275
    '20': ['M10 1.66675L17.5 5.83341V14.1667L10 18.3334L2.5 14.1667V5.83341L10 1.66675Z', 'M7.5 8.33325L9.16667 9.99992L7.5 11.6666', 'M10.8335 11.6667H12.5002'],
  },
  shell: {
    // 12 px: the 16 px mark (105:318) scaled by 0.75.
    '12': ['M2 8.5L5 5.5L2 2.5', 'M6 9.5H10'],
    // kind · shell 16, node 105:318
    '16': ['M2.66667 11.3334L6.66667 7.33337L2.66667 3.33337', 'M8 12.6666H13.3333'],
    // Figma has no 20 px shell mark: the 16 px one (105:318) scaled by 1.25,
    // with the stroke kept at 2 as Figma keeps it on the other marks.
    '20': ['M3.333 14.167L8.333 9.167L3.333 4.167', 'M10 15.833H16.667'],
  },
}

/**
 * The Claude, Codex or shell mark. `size` is `12` (for the 13 px mark in
 * Figma), `16` (the default) or `20`.
 */
export function KindMark({ kind = 'claude', size = '16', title }: KindMarkProps) {
  const named = title !== undefined && title.trim() !== ''
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={kindMark({ kind, size })}
      data-kind={kind}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={named ? 'img' : undefined}
      aria-hidden={named ? undefined : true}
      focusable="false"
    >
      {named ? <title>{title}</title> : null}
      {marks[kind][size].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
