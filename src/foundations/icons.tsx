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
