import type { ReactNode } from 'react'
import { icon, type IconVariantProps } from '../../styled-system/recipes'

// The library's icon set (d-048), copied from the Figma design file
// PZoW9BBu43qRgon1KhJcwU. Each icon is drawn on a 24 grid with round caps
// and joins in currentColor, so it takes the colour of its text. The node
// that each icon comes from is in its comment; an icon drawn at another
// size in Figma was scaled to the 24 grid, stroke and all.

/** An icon size, one of the `sizes.icon` tokens. */
export type IconSize = Extract<IconVariantProps['size'], string>

export type IconProps = {
  /** The size in px, from the `sizes.icon` tokens. Defaults to `24`. */
  size?: IconSize | undefined
  /**
   * A name for an icon that stands alone. Without one (or with only
   * spaces) the icon is hidden from assistive technology, because the
   * text next to it names it.
   */
  title?: string | undefined
}

type SvgProps = IconProps & { strokeWidth?: string | undefined; children: ReactNode }

function Svg({ size = '24', title, strokeWidth, children }: SvgProps) {
  const named = title !== undefined && title.trim() !== ''
  const stroked = strokeWidth !== undefined
  return (
    <svg
      viewBox="0 0 24 24"
      className={icon({ size })}
      fill={stroked ? 'none' : 'currentColor'}
      stroke={stroked ? 'currentColor' : 'none'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={named ? 'img' : undefined}
      aria-hidden={named ? undefined : true}
      focusable="false"
    >
      {named ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

/** A toolkit skill: a wand. Figma node 499:205. */
export function SkillIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M15 4V2" />
      <path d="M15 16V14" />
      <path d="M8 9H10" />
      <path d="M20 9H22" />
      <path d="M17.8 11.8L19 13" />
      <path d="M17.8 6.2L19 5" />
      <path d="M3 21L12 12" />
      <path d="M12.2 6.2L11 5" />
    </Svg>
  )
}

/** A toolkit agent: a robot. Figma node 499:267. */
export function AgentIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M12 8V4H8" />
      <path d="M18 8H6C4.895 8 4 8.895 4 10V18C4 19.105 4.895 20 6 20H18C19.105 20 20 19.105 20 18V10C20 8.895 19.105 8 18 8Z" />
      <path d="M2 14H4" />
      <path d="M20 14H22" />
      <path d="M15 13V15" />
      <path d="M9 13V15" />
    </Svg>
  )
}

/** A toolkit rule: scales. Figma node 499:318. */
export function RuleIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M16 16L19 8L22 16C21.13 16.65 20.08 17 19 17C17.92 17 16.87 16.65 16 16Z" />
      <path d="M2 16L5 8L8 16C7.13 16.65 6.08 17 5 17C3.92 17 2.87 16.65 2 16Z" />
      <path d="M7 21H17" />
      <path d="M12 3V21" />
      <path d="M3 7H5C7 7 10 6 12 5C14 6 17 7 19 7H21" />
    </Svg>
  )
}

/** A toolkit workflow: two linked boxes. Figma node 499:359. */
export function WorkflowIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M9 3H5C3.895 3 3 3.895 3 5V9C3 10.105 3.895 11 5 11H9C10.105 11 11 10.105 11 9V5C11 3.895 10.105 3 9 3Z" />
      <path d="M7 11V15C7 15.53 7.211 16.039 7.586 16.414C7.961 16.789 8.47 17 9 17H13" />
      <path d="M19 13H15C13.895 13 13 13.895 13 15V19C13 20.105 13.895 21 15 21H19C20.105 21 21 20.105 21 19V15C21 13.895 20.105 13 19 13Z" />
    </Svg>
  )
}

/** A toolkit hook: an anchor. Figma node 499:392. */
export function HookIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M12 22V8" />
      <path d="M5 12H2C2 14.652 3.054 17.196 4.929 19.071C6.804 20.946 9.348 22 12 22C14.652 22 17.196 20.946 19.071 19.071C20.946 17.196 22 14.652 22 12H19" />
      <path d="M12 8C13.657 8 15 6.657 15 5C15 3.343 13.657 2 12 2C10.343 2 9 3.343 9 5C9 6.657 10.343 8 12 8Z" />
    </Svg>
  )
}

/** The Inbox Approval kind: a shield with a check. Figma node 346:197, drawn at 16 px and scaled to 24. */
export function ApproveIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M12 3L19 6V11C19 15.5 16 19 12 21C8 19 5 15.5 5 11V6L12 3Z" />
      <path d="M9 12L11 14L15 10" />
    </Svg>
  )
}

/** The Inbox Question kind: a question mark in a circle. Figma node 346:221, drawn at 16 px and scaled to 24. */
export function QuestionIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M12 21C16.971 21 21 16.971 21 12C21 7.029 16.971 3 12 3C7.029 3 3 7.029 3 12C3 16.971 7.029 21 12 21Z" />
      <path d="M9.5 9.5C9.5 8 10.6 7 12 7C13.4 7 14.5 8 14.5 9.3C14.5 11 12 11.3 12 13.2" />
      <path d="M12 16.6V16.8" />
    </Svg>
  )
}

/** The Inbox Review kind: an eye. Figma node 346:239, drawn at 16 px and scaled to 24. */
export function ReviewIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M2.5 12C5 7 8.5 5 12 5C15.5 5 19 7 21.5 12C19 17 15.5 19 12 19C8.5 19 5 17 2.5 12Z" />
      <path d="M12 15C13.657 15 15 13.657 15 12C15 10.343 13.657 9 12 9C10.343 9 9 10.343 9 12C9 13.657 10.343 15 12 15Z" />
    </Svg>
  )
}

/** The Inbox Action kind: a checked box. Figma node 346:250, drawn at 16 px and scaled to 24. */
export function ActionIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M17 4H7C5.343 4 4 5.343 4 7V17C4 18.657 5.343 20 7 20H17C18.657 20 20 18.657 20 17V7C20 5.343 18.657 4 17 4Z" />
      <path d="M8.5 12L11 14.5L15.5 9.5" />
    </Svg>
  )
}

/** The Inbox Next step kind: an arrow in a circle. Figma node 346:268, drawn at 16 px and scaled to 24. */
export function NextIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M12 21C16.971 21 21 16.971 21 12C21 7.029 16.971 3 12 3C7.029 3 3 7.029 3 12C3 16.971 7.029 21 12 21Z" />
      <path d="M8 12H16M12.5 15.5L16 12L12.5 8.5" />
    </Svg>
  )
}

/** Home, in the nav rail and the tab bar. Figma node 346:5577. */
export function HomeIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="1.8">
      <path d="M4 11L12 4L20 11V20H14.5V14.5H9.5V20H4V11Z" />
    </Svg>
  )
}

/** Inbox, in the nav rail and the tab bar. Figma node 346:5583. */
export function InboxIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="1.8">
      <path d="M3 13L6 5H18L21 13V19H3V13Z" />
      <path d="M3 13H8.5L10 15.5H14L15.5 13H21" />
    </Svg>
  )
}

/** Workspaces, in the nav rail and the tab bar. Figma node 346:5592. */
export function WorkspacesIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="1.8">
      <path d="M9.5 4H5.5C4.672 4 4 4.672 4 5.5V9.5C4 10.328 4.672 11 5.5 11H9.5C10.328 11 11 10.328 11 9.5V5.5C11 4.672 10.328 4 9.5 4Z" />
      <path d="M18.5 4H14.5C13.672 4 13 4.672 13 5.5V9.5C13 10.328 13.672 11 14.5 11H18.5C19.328 11 20 10.328 20 9.5V5.5C20 4.672 19.328 4 18.5 4Z" />
      <path d="M9.5 13H5.5C4.672 13 4 13.672 4 14.5V18.5C4 19.328 4.672 20 5.5 20H9.5C10.328 20 11 19.328 11 18.5V14.5C11 13.672 10.328 13 9.5 13Z" />
      <path d="M18.5 13H14.5C13.672 13 13 13.672 13 14.5V18.5C13 19.328 13.672 20 14.5 20H18.5C19.328 20 20 19.328 20 18.5V14.5C20 13.672 19.328 13 18.5 13Z" />
    </Svg>
  )
}

/** Projects, in the nav rail and the tab bar: a folder. Figma node 346:5601. */
export function ProjectsIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="1.8">
      <path d="M3 7V18.5H21V8.5H11.5L9.5 5.5H3V7Z" />
    </Svg>
  )
}

/** More, in the nav rail and the tab bar: three dots. Filled, not stroked. Figma node 346:5607. */
export function MoreIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5.5 13.2C6.163 13.2 6.7 12.662 6.7 12C6.7 11.337 6.163 10.8 5.5 10.8C4.837 10.8 4.3 11.337 4.3 12C4.3 12.662 4.837 13.2 5.5 13.2Z" />
      <path d="M12 13.2C12.663 13.2 13.2 12.662 13.2 12C13.2 11.337 12.663 10.8 12 10.8C11.337 10.8 10.8 11.337 10.8 12C10.8 12.662 11.337 13.2 12 13.2Z" />
      <path d="M18.5 13.2C19.163 13.2 19.7 12.662 19.7 12C19.7 11.337 19.163 10.8 18.5 10.8C17.837 10.8 17.3 11.337 17.3 12C17.3 12.662 17.837 13.2 18.5 13.2Z" />
    </Svg>
  )
}

/** Search: a magnifier. Figma node 346:1236, drawn at 14 px and scaled to 24. */
export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M11 17.5C14.59 17.5 17.5 14.59 17.5 11C17.5 7.41 14.59 4.5 11 4.5C7.41 4.5 4.5 7.41 4.5 11C4.5 14.59 7.41 17.5 11 17.5Z" />
      <path d="M16 16L20 20" />
    </Svg>
  )
}

/** Close or clear: an x. Figma node 346:320, drawn at 14 px and scaled to 24. */
export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M6 6L18 18M18 6L6 18" />
    </Svg>
  )
}

/** A check mark. Figma node 346:1252, drawn at 16 px and scaled to 24. */
export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M5 12.5L10 17.5L19 7" />
    </Svg>
  )
}

/** A chevron that points down. Figma node 346:189, drawn at 12 px and scaled to 24. */
export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M6 9L12 15L18 9" />
    </Svg>
  )
}

/** A chevron that points right. Figma node 346:300, drawn at 12 px and scaled to 24. */
export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M9 5L16 12L9 19" />
    </Svg>
  )
}

/** A paper clip, for attachments. Figma node 105:901, drawn at 14 px and scaled to 24. */
export function ClipIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M21.44 11.05L12.25 20.24C11.12 21.37 9.6 22 8 22C6.41 22 4.89 21.37 3.76 20.24C2.63 19.11 2 17.59 2 16C2 14.4 2.63 12.88 3.76 11.75L12.33 3.18C13.08 2.43 14.1 2.01 15.16 2C16.22 2 17.24 2.42 18 3.17C18.75 3.93 19.17 4.94 19.17 6.01C19.17 7.07 18.75 8.09 18 8.84L9.41 17.41C9.03 17.79 8.53 18 8 18C7.46 18 6.96 17.79 6.58 17.41C6.2 17.03 5.99 16.53 5.99 16C5.99 15.46 6.2 14.96 6.58 14.58L15.07 6.1" />
    </Svg>
  )
}

/** A rounded square, for Stop. Figma node 105:911, drawn at 12 px and scaled to 24. */
export function StopIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M8 6H16C17.1 6 18 6.9 18 8V16C18 17.1 17.1 18 16 18H8C6.9 18 6 17.1 6 16V8C6 6.9 6.9 6 8 6Z" />
    </Svg>
  )
}

/** An arrow that points up, for Send. Figma node 105:917, drawn at 14 px and scaled to 24. */
export function ArrowUpIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M5 12L12 5L19 12" />
      <path d="M12 19V5" />
    </Svg>
  )
}

// The icons below come from the Inbox, Workbench, Toolkit and Artifacts
// screens. Each keeps the set's stroke on the 24 grid: 2, or 1.8 for the
// navigation icons. Figma draws most of them as instances resized without
// scaling the stroke (2 or 1.8 at every size); the others scale to 2.

/** A spark: a four-point star. Figma node 402:15455, drawn at 10 px and scaled to 24. */
export function SparkIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z" />
    </Svg>
  )
}

/** A sparkle: a tall four-point star. Figma node 105:2956, drawn at 18 px and scaled to 24. */
export function SparkleIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M12 3L13.9 8.8L20 10.7L14.2 12.6L12 18.5L10.1 12.6L4 10.7L10.1 8.8L12 3Z" />
    </Svg>
  )
}

/** Edit: a pencil. Figma node 346:366, drawn at 14 px and scaled to 24. */
export function EditIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M4 20H8L19 9L15 5L4 16V20Z" />
    </Svg>
  )
}

/** Delete: a bin. Figma node 405:424, drawn at 16 px and scaled to 24. */
export function TrashIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M3 6H21M8 6V4H16V6M19 6L18 20H6L5 6" />
    </Svg>
  )
}

/** Copy: two overlapping squares. Figma node 346:2262, drawn at 12 px and scaled to 24. */
export function CopyIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M20 8H10C8.895 8 8 8.895 8 10V20C8 21.105 8.895 22 10 22H20C21.105 22 22 21.105 22 20V10C22 8.895 21.105 8 20 8Z" />
      <path d="M4 16C2.9 16 2 15.1 2 14V4C2 2.9 2.9 2 4 2H14C15.1 2 16 2.9 16 4" />
    </Svg>
  )
}

/** Snooze: a clock. Figma node 346:205, drawn at 12 px and scaled to 24. */
export function SnoozeIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M12 20.5C16.694 20.5 20.5 16.694 20.5 12C20.5 7.306 16.694 3.5 12 3.5C7.306 3.5 3.5 7.306 3.5 12C3.5 16.694 7.306 20.5 12 20.5Z" />
      <path d="M12 7.5V12L15 14" />
    </Svg>
  )
}

/** A link: two chain links. Figma node 346:412, drawn at 13 px and scaled to 24. */
export function LinkIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M10 14L14 10" />
      <path d="M8.5 11.5L6.5 13.5C5.837 14.163 5.464 15.062 5.464 16C5.464 16.938 5.837 17.837 6.5 18.5C7.163 19.163 8.062 19.535 9 19.535C9.938 19.535 10.837 19.163 11.5 18.5L13.5 16.5" />
      <path d="M15.5 12.5L17.5 10.5C18.163 9.837 18.536 8.938 18.536 8C18.536 7.062 18.163 6.163 17.5 5.5C16.837 4.837 15.938 4.464 15 4.464C14.062 4.464 13.163 4.837 12.5 5.5L10.5 7.5" />
    </Svg>
  )
}

/** A folder with a rounded tab. Figma node 128:332, drawn at 18 px and scaled to 24. */
export function FolderIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M4 20H20C20.53 20 21.039 19.789 21.414 19.414C21.789 19.039 22 18.53 22 18V8C22 7.47 21.789 6.961 21.414 6.586C21.039 6.211 20.53 6 20 6H12.07C11.741 5.998 11.417 5.915 11.127 5.758C10.838 5.601 10.591 5.375 10.41 5.1L9.59 3.9C9.409 3.625 9.162 3.399 8.873 3.242C8.583 3.085 8.259 3.002 7.93 3H4C3.47 3 2.961 3.211 2.586 3.586C2.211 3.961 2 4.47 2 5V18C2 19.1 2.9 20 4 20Z" />
    </Svg>
  )
}

/** A tag. Figma node 346:344, drawn at 12 px and scaled to 24. */
export function TagIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M3.5 12.5V4.5H11.5L20 13L13 20L3.5 12.5Z" />
      <path d="M8 8.2V8.4" />
    </Svg>
  )
}

/** Play or run: a triangle. Filled, not stroked. Figma node 346:397, drawn at 14 px and scaled to 24. */
export function PlayIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 5.5L18 12L8 18.5V5.5Z" />
    </Svg>
  )
}

/** Locked or read-only: a padlock. Figma node 425:13, drawn at 13 px and scaled to 24. */
export function LockIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M17 11H7C5.896 11 5 11.895 5 13V19C5 20.105 5.896 21 7 21H17C18.105 21 19 20.105 19 19V13C19 11.895 18.105 11 17 11Z" />
      <path d="M8 11V7C8 5.939 8.422 4.922 9.172 4.172C9.922 3.421 10.939 3 12 3C13.061 3 14.078 3.421 14.829 4.172C15.579 4.922 16 5.939 16 7V11" />
    </Svg>
  )
}

/** Add: a plus. Figma node 346:1265, drawn at 16 px and scaled to 24. */
export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M12 5V19M5 12H19" />
    </Svg>
  )
}

/** A drag handle: two columns of dots. Figma node 105:624, drawn at 14 px and scaled to 24. */
export function GripIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M9 7C9.552 7 10 6.552 10 6C10 5.448 9.552 5 9 5C8.448 5 8 5.448 8 6C8 6.552 8.448 7 9 7Z" />
      <path d="M9 13C9.552 13 10 12.552 10 12C10 11.448 9.552 11 9 11C8.448 11 8 11.448 8 12C8 12.552 8.448 13 9 13Z" />
      <path d="M9 19C9.552 19 10 18.552 10 18C10 17.448 9.552 17 9 17C8.448 17 8 17.448 8 18C8 18.552 8.448 19 9 19Z" />
      <path d="M15 7C15.552 7 16 6.552 16 6C16 5.448 15.552 5 15 5C14.448 5 14 5.448 14 6C14 6.552 14.448 7 15 7Z" />
      <path d="M15 13C15.552 13 16 12.552 16 12C16 11.448 15.552 11 15 11C14.448 11 14 11.448 14 12C14 12.552 14.448 13 15 13Z" />
      <path d="M15 19C15.552 19 16 18.552 16 18C16 17.448 15.552 17 15 17C14.448 17 14 17.448 14 18C14 18.552 14.448 19 15 19Z" />
    </Svg>
  )
}

/** Back: a chevron that points left. Figma node 105:1812, drawn at 20 px and scaled to 24. */
export function ChevronLeftIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M15 18L9 12L15 6" />
    </Svg>
  )
}

/** Maximize: two arrows that point apart. Figma node 105:199, drawn at 13 px and scaled to 24. */
export function MaximizeIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M15 3H21V9" />
      <path d="M9 21H3V15" />
      <path d="M21 3L14 10" />
      <path d="M3 21L10 14" />
    </Svg>
  )
}

/** A side panel: a square with a bar on the left. Figma node 158:3, drawn at 16 px and scaled to 24. */
export function PanelIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M19 3H5C3.895 3 3 3.895 3 5V19C3 20.105 3.895 21 5 21H19C20.105 21 21 20.105 21 19V5C21 3.895 20.105 3 19 3Z" />
      <path d="M9 3V21" />
    </Svg>
  )
}

/** Split view: a square in two columns. Figma node 158:541, drawn at 12 px and scaled to 24. */
export function SplitIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M19 3H5C3.895 3 3 3.895 3 5V19C3 20.105 3.895 21 5 21H19C20.105 21 21 20.105 21 19V5C21 3.895 20.105 3 19 3Z" />
      <path d="M12 3V21" />
    </Svg>
  )
}

/** A grid view: four squares. Figma node 105:2963, drawn at 18 px and scaled to 24. */
export function GridIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M9 3H4C3.448 3 3 3.448 3 4V9C3 9.552 3.448 10 4 10H9C9.552 10 10 9.552 10 9V4C10 3.448 9.552 3 9 3Z" />
      <path d="M20 3H15C14.448 3 14 3.448 14 4V9C14 9.552 14.448 10 15 10H20C20.552 10 21 9.552 21 9V4C21 3.448 20.552 3 20 3Z" />
      <path d="M20 14H15C14.448 14 14 14.448 14 15V20C14 20.552 14.448 21 15 21H20C20.552 21 21 20.552 21 20V15C21 14.448 20.552 14 20 14Z" />
      <path d="M9 14H4C3.448 14 3 14.448 3 15V20C3 20.552 3.448 21 4 21H9C9.552 21 10 20.552 10 20V15C10 14.448 9.552 14 9 14Z" />
    </Svg>
  )
}

/** A chat or message: a speech box. Figma names it chat and msg. Figma node 105:1918, drawn at 18 px and scaled to 24. */
export function ChatIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M21 15C21 15.53 20.789 16.039 20.414 16.414C20.039 16.789 19.53 17 19 17H7L3 21V5C3 4.47 3.211 3.961 3.586 3.586C3.961 3.211 4.47 3 5 3H19C19.53 3 20.039 3.211 20.414 3.586C20.789 3.961 21 4.47 21 5V15Z" />
    </Svg>
  )
}

/** A comment: a square speech bubble. Figma node 403:950, drawn at 16 px and scaled to 24. */
export function BubbleIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M3.75 4.5H20.25V15.75H10.95L6.75 19.5V15.75H3.75V4.5Z" />
    </Svg>
  )
}

/** Move: two arrows that point opposite ways. Figma node 105:2975, drawn at 18 px and scaled to 24. */
export function MoveIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M8 3L4 7L8 11" />
      <path d="M4 7H20" />
      <path d="M16 21L20 17L16 13" />
      <path d="M20 17H4" />
    </Svg>
  )
}

/** A git branch. Figma node 105:2938, drawn at 18 px and scaled to 24. */
export function BranchIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M6 9C7.657 9 9 7.657 9 6C9 4.343 7.657 3 6 3C4.343 3 3 4.343 3 6C3 7.657 4.343 9 6 9Z" />
      <path d="M6 21C7.657 21 9 19.657 9 18C9 16.343 7.657 15 6 15C4.343 15 3 16.343 3 18C3 19.657 4.343 21 6 21Z" />
      <path d="M18 9C19.657 9 21 7.657 21 6C21 4.343 19.657 3 18 3C16.343 3 15 4.343 15 6C15 7.657 16.343 9 18 9Z" />
      <path d="M6 9V15" />
      <path d="M18 9C18 11.387 17.052 13.676 15.364 15.364C13.676 17.052 11.387 18 9 18" />
    </Svg>
  )
}

/** A file: a page with a folded corner. Figma node 435:215, drawn at 16 px and scaled to 24. */
export function FileIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M14 2.001H6C5.47 2.001 4.961 2.212 4.586 2.587C4.211 2.962 4 3.471 4 4.001V20.001C4 20.531 4.211 21.04 4.586 21.415C4.961 21.79 5.47 22.001 6 22.001H18C18.53 22.001 19.039 21.79 19.414 21.415C19.789 21.04 20 20.531 20 20.001V8.001L14 2.001Z" />
      <path d="M14 2.001V8.001H20" />
    </Svg>
  )
}

/** A map of linked parts: three joined circles. Figma node 425:24, drawn at 15 px and scaled to 24. */
export function MapIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M5 8C6.105 8 7 7.105 7 6C7 4.895 6.105 4 5 4C3.895 4 3 4.895 3 6C3 7.105 3.895 8 5 8Z" />
      <path d="M19 8C20.105 8 21 7.105 21 6C21 4.895 20.105 4 19 4C17.895 4 17 4.895 17 6C17 7.105 17.895 8 19 8Z" />
      <path d="M12 20C13.105 20 14 19.105 14 18C14 16.895 13.105 16 12 16C10.895 16 10 16.895 10 18C10 19.105 10.895 20 12 20Z" />
      <path d="M7 6H17M6 8L11 16M18 8L13 16" />
    </Svg>
  )
}

/** Reset: an arrow that turns back. Figma node 346:360, drawn at 14 px and scaled to 24. */
export function ResetIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M4.5 12C4.502 13.717 5.093 15.381 6.175 16.714C7.256 18.048 8.762 18.97 10.442 19.327C12.121 19.683 13.872 19.453 15.402 18.674C16.932 17.895 18.149 16.615 18.849 15.048C19.548 13.48 19.689 11.719 19.247 10.06C18.806 8.401 17.808 6.944 16.421 5.932C15.035 4.92 13.343 4.414 11.628 4.499C9.913 4.585 8.28 5.255 7 6.4" />
      <path d="M4 3.5V8H8.5" />
    </Svg>
  )
}

/** A Linear issue: a check in a circle. Figma node 346:338, drawn at 12 px and scaled to 24. */
export function LinearIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M12 20.5C16.694 20.5 20.5 16.694 20.5 12C20.5 7.306 16.694 3.5 12 3.5C7.306 3.5 3.5 7.306 3.5 12C3.5 16.694 7.306 20.5 12 20.5Z" />
      <path d="M8 12L11 15L16 9" />
    </Svg>
  )
}

/** A feature: a hexagon. Figma node 346:333, drawn at 12 px and scaled to 24. */
export function FeatureIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" />
    </Svg>
  )
}

/** Toolkit, in the navigation: a wrench. Figma node 425:7, drawn at 20 px and scaled to 24. */
export function ToolkitIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="1.8">
      <path d="M14.7 6.3C14.517 6.487 14.414 6.738 14.414 7C14.414 7.262 14.517 7.513 14.7 7.7L16.3 9.3C16.487 9.483 16.738 9.586 17 9.586C17.262 9.586 17.513 9.483 17.7 9.3L21.47 5.53C21.973 6.641 22.125 7.879 21.906 9.079C21.688 10.279 21.109 11.384 20.246 12.246C19.384 13.109 18.279 13.688 17.079 13.906C15.879 14.125 14.641 13.973 13.53 13.47L6.62 20.38C6.222 20.778 5.683 21.001 5.12 21.001C4.557 21.001 4.018 20.778 3.62 20.38C3.222 19.982 2.999 19.443 2.999 18.88C2.999 18.317 3.222 17.778 3.62 17.38L10.53 10.47C10.027 9.359 9.875 8.121 10.094 6.921C10.312 5.721 10.891 4.616 11.754 3.754C12.616 2.891 13.721 2.312 14.921 2.094C16.121 1.875 17.359 2.027 18.47 2.53L14.71 6.29L14.7 6.3Z" />
    </Svg>
  )
}

/** Artifacts, in the navigation: three stacked layers. Figma node 424:3896, drawn at 22 px and scaled to 24. */
export function ArtifactsIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="1.8">
      <path d="M2 17L12 22L22 17M2 12L12 17L22 12M12 2L2 7L12 12L22 7L12 2Z" />
    </Svg>
  )
}

// The icons below come from the Toolkit screens: the file tree, the flow
// diagram (D14 501:62, M12 461:572) and the step chips. The Toolkit page
// draws them at 1.8 at every size; like the other content icons they take
// a 2 stroke on the 24 grid.

/** Code or a script: two angle brackets. Figma node 432:2214, drawn at 13 px and scaled to 24. */
export function CodeIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M16 18L22 12L16 6M8 6L2 12L8 18" />
    </Svg>
  )
}

/** A loop: a circle that turns back on itself. Figma node 459:617, drawn at 12 px and scaled to 24. */
export function LoopIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M21 12C21.002 14.061 20.296 16.06 19.001 17.663C17.706 19.267 15.9 20.377 13.885 20.808C11.869 21.24 9.767 20.967 7.929 20.034C6.091 19.102 4.628 17.567 3.786 15.686C2.944 13.805 2.772 11.692 3.301 9.699C3.83 7.707 5.026 5.957 6.69 4.741C8.354 3.525 10.385 2.917 12.444 3.019C14.502 3.12 16.464 3.926 18 5.3L21 8" />
      <path d="M21 3V8H16" />
    </Svg>
  )
}

/** A terminal: a prompt and a cursor line. Figma names it term. Figma node 459:622, drawn at 13 px and scaled to 24. */
export function TerminalIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M4 17L10 11L4 5M12 19H20" />
    </Svg>
  )
}

/** An arrow that points down, between the steps of a flow. Figma node 461:580, drawn at 12 px and scaled to 24. */
export function ArrowDownIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M12 5V19M19 12L12 19L5 12" />
    </Svg>
  )
}

/**
 * An arrow that points right, between the steps of a path. Figma node
 * 501:70, drawn at 12 px as the down arrow turned a quarter, exported as
 * drawn and scaled to 24.
 */
export function ArrowRightIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M5 12H19M12 5L19 12L12 19" />
    </Svg>
  )
}

// The icons below fill the gaps the screen rebuild found: the list toolbars
// of Artifacts and Toolkit (sort, filter, refresh, list), the preview footer
// (external link), the undo toast, the Toolkit item pages (chart, clock,
// cpu, book) and the More drawer (brain). Each path is the Figma export of
// its node, scaled to the 24 grid. Content icons take the 2 stroke; Brain is
// a navigation item and takes 1.8, like Toolkit and Artifacts.

/** Sort: three lines that get shorter. Figma node 425:63, drawn at 15 px and scaled to 24. */
export function SortIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M3 6H21M6 12H18M10 18H14" />
    </Svg>
  )
}

/**
 * Filter: three centred lines that narrow like a funnel. Figma names the
 * layer Frame (402:15414, in the Artifacts Filter button), drawn at 15 px
 * and scaled to 24. It is close to Sort but narrower at each line.
 */
export function FilterIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M4 6H20M7 12H17M10 18H14" />
    </Svg>
  )
}

/**
 * Refresh: a circle that turns back on itself, with its arrow head. Figma
 * node 402:15376, drawn at 13 px and scaled to 24. Figma draws the same
 * shape as `LoopIcon` (459:617); this one names the action.
 */
export function RefreshIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M21 12C21.002 14.061 20.296 16.06 19.001 17.664C17.706 19.267 15.9 20.377 13.885 20.809C11.869 21.24 9.767 20.967 7.929 20.035C6.091 19.102 4.628 17.567 3.786 15.686C2.944 13.805 2.772 11.692 3.301 9.7C3.83 7.708 5.026 5.957 6.69 4.741C8.354 3.525 10.385 2.917 12.444 3.019C14.502 3.121 16.464 3.926 18 5.3L21 8" />
      <path d="M16 8H21V3" />
    </Svg>
  )
}

/** A list view: three lines, each after a dot. Figma node 402:15424, drawn at 15 px and scaled to 24. */
export function ListIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M9 6H20M9 12H20M9 18H20M4 6H4.01M4 12H4.01M4 18H4.01" />
    </Svg>
  )
}

/** Open elsewhere: an arrow out of a square. Figma names it ext. Figma node 403:506, drawn at 14 px and scaled to 24. */
export function ExternalLinkIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M21 9V3H15M21 3L10 14M18 13V19C18 19.531 17.789 20.039 17.414 20.414C17.039 20.789 16.53 21 16 21H5C4.47 21 3.961 20.789 3.586 20.414C3.211 20.039 3 19.531 3 19V8C3 7.47 3.211 6.961 3.586 6.586C3.961 6.211 4.47 6 5 6H11" />
    </Svg>
  )
}

/** Undo: an arrow that points left and turns back down. Figma node 403:1960, drawn at 14 px and scaled to 24. */
export function UndoIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M7.5 6L3.75 9.75L7.5 13.5M4.5 9.75H14.25C15.642 9.75 16.978 10.303 17.962 11.288C18.947 12.272 19.5 13.608 19.5 15C19.5 16.392 18.947 17.728 17.962 18.712C16.978 19.697 15.642 20.25 14.25 20.25H10.5" />
    </Svg>
  )
}

/** A chart: three bars on two axes, for the Activity view. Figma node 457:9, drawn at 15 px and scaled to 24. */
export function ChartIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M3 3V21H21" />
      <path d="M7 16V12M12 16V8M17 16V9" />
    </Svg>
  )
}

/**
 * A clock, for when a rule loads. Figma node 427:629, drawn at 16 px and
 * scaled to 24. Larger in its face than `SnoozeIcon` (346:205).
 */
export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M12 21C16.971 21 21 16.971 21 12C21 7.029 16.971 3 12 3C7.029 3 3 7.029 3 12C3 16.971 7.029 21 12 21Z" />
      <path d="M12 7V12L15 14" />
    </Svg>
  )
}

/** A model or processor: a chip with pins. Figma node 433:531, drawn at 14 px and scaled to 24. */
export function CpuIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M17 5H7C5.895 5 5 5.895 5 7V17C5 18.104 5.895 19 7 19H17C18.104 19 19 18.104 19 17V7C19 5.895 18.104 5 17 5Z" />
      <path d="M9 2V5M15 2V5M9 19V22M15 19V22M2 9H5M2 15H5M19 9H22M19 15H22M9 9H15V15H9V9Z" />
    </Svg>
  )
}

/**
 * A book. Figma node 464:398, drawn at 14 px and scaled to 24. The second
 * path is rounded to whole numbers on the 24 grid (Figma's 19.502 becomes
 * 19.5); the change is under 0.003 px.
 */
export function BookIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M4 19.5C4 18.837 4.263 18.201 4.732 17.732C5.201 17.263 5.837 17 6.5 17H20V3H6.5C5.837 3 5.201 3.263 4.732 3.732C4.263 4.201 4 4.837 4 5.5V19.5Z" />
      <path d="M4 19.5C4 20.163 4.263 20.799 4.732 21.268C5.201 21.737 5.837 22 6.5 22H20V17" />
    </Svg>
  )
}

/** The brain, in the More drawer: two lobes. Figma node 415:341, drawn at 20 px and scaled to 24. */
export function BrainIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="1.8">
      <path d="M12 5C12 4.205 11.684 3.442 11.122 2.879C10.559 2.316 9.796 2 9 2C8.205 2 7.442 2.316 6.879 2.879C6.316 3.442 6 4.205 6 5C5.441 5.043 4.905 5.242 4.453 5.573C4.001 5.905 3.651 6.357 3.443 6.878C3.235 7.398 3.177 7.967 3.275 8.519C3.374 9.071 3.625 9.584 4 10C3.625 10.417 3.374 10.93 3.275 11.482C3.177 12.034 3.235 12.603 3.443 13.123C3.651 13.644 4.001 14.096 4.453 14.427C4.905 14.759 5.441 14.958 6 15C6 15.796 6.316 16.559 6.879 17.122C7.442 17.684 8.205 18 9 18C9.796 18 10.559 17.684 11.122 17.122C11.684 16.559 12 15.796 12 15M12 5V15M12 5C12 4.205 12.316 3.442 12.879 2.879C13.442 2.316 14.205 2 15 2C15.796 2 16.559 2.316 17.122 2.879C17.684 3.442 18 4.205 18 5C18.559 5.043 19.095 5.242 19.547 5.573C19.999 5.905 20.349 6.357 20.557 6.878C20.766 7.398 20.824 7.967 20.725 8.519C20.627 9.071 20.376 9.584 20 10C20.376 10.417 20.627 10.93 20.725 11.482C20.824 12.034 20.766 12.603 20.557 13.123C20.349 13.644 19.999 14.096 19.547 14.427C19.095 14.759 18.559 14.958 18 15C18 15.796 17.684 16.559 17.122 17.122C16.559 17.684 15.796 18 15 18C14.205 18 13.442 17.684 12.879 17.122C12.316 16.559 12 15.796 12 15" />
    </Svg>
  )
}

/**
 * A warning: an exclamation mark in a triangle. For an error or a failed
 * load, as in `ErrorState`. Figma has no drawing of it; it is drawn on the
 * 24 grid in the set's style (stroke 2, round caps and joins).
 */
export function WarningIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M21.73 18L13.73 4C13.556 3.693 13.303 3.438 12.998 3.26C12.693 3.082 12.347 2.989 11.995 2.989C11.642 2.989 11.296 3.082 10.991 3.26C10.686 3.438 10.433 3.693 10.26 4L2.26 18C2.083 18.306 1.991 18.653 1.991 19.006C1.992 19.36 2.085 19.707 2.262 20.012C2.439 20.318 2.693 20.571 2.999 20.747C3.306 20.923 3.653 21.014 4.006 21.012H20.006C20.357 21.012 20.702 20.918 21.006 20.743C21.31 20.567 21.562 20.314 21.737 20.01C21.913 19.706 22.005 19.36 22.005 19.009C22.005 18.658 21.912 18.304 21.73 18Z" />
      <path d="M12 9V13" />
      <path d="M12 16.9V17.1" />
    </Svg>
  )
}

/**
 * A compass. For a page or an item that was not found, as in a neutral
 * `ErrorState`. Figma has no drawing of it; it is drawn on the 24 grid in
 * the set's style (stroke 2, round caps and joins).
 */
export function CompassIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth="2">
      <path d="M12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22Z" />
      <path d="M16.24 7.76L14.12 14.12L7.76 16.24L9.88 9.88L16.24 7.76Z" />
    </Svg>
  )
}
