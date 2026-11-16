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
    // kind · claude 14, node 105:353
    '14': [
      'M8.74996 6.99996H12.8333M8.23663 8.23663L11.1241 11.1241M6.99996 8.74996V12.8333M5.76329 8.23663L2.87579 11.1241M5.24996 6.99996H1.16663M5.76329 5.76329L2.87579 2.87579M6.99996 5.24996V1.16663M8.23663 5.76329L11.1241 2.87579',
    ],
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
    // kind · codex 14, node 105:357
    '14': ['M7 1.16663L12.25 4.08329V9.91663L7 12.8333L1.75 9.91663V4.08329L7 1.16663Z', 'M5.25 5.83337L6.41667 7.00004L5.25 8.16671', 'M7.58337 8.16663H8.75004'],
    // kind · codex 16, node 105:264
    '16': ['M8 1.33331L14 4.66665V11.3333L8 14.6666L2 11.3333V4.66665L8 1.33331Z', 'M6 6.66669L7.33333 8.00002L6 9.33335', 'M8.66669 9.33331H10'],
    // kind · codex 20, node 128:275
    '20': ['M10 1.66675L17.5 5.83341V14.1667L10 18.3334L2.5 14.1667V5.83341L10 1.66675Z', 'M7.5 8.33325L9.16667 9.99992L7.5 11.6666', 'M10.8335 11.6667H12.5002'],
  },
  shell: {
    // kind · shell 14, node 105:363
    '14': ['M2.33337 9.91663L5.83337 6.41663L2.33337 2.91663', 'M7 11.0834H11.6667'],
    // kind · shell 16, node 105:318
    '16': ['M2.66667 11.3334L6.66667 7.33337L2.66667 3.33337', 'M8 12.6666H13.3333'],
    // Figma has no 20 px shell mark: the 16 px one (105:318) scaled by 1.25,
    // with the stroke kept at 2 as Figma keeps it on the other marks.
    '20': ['M3.333 14.167L8.333 9.167L3.333 4.167', 'M10 15.833H16.667'],
  },
}

/**
 * The Claude, Codex or shell mark. `size` is `14` (the 13 px mark in
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
