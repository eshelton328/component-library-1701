import type { ReactNode } from 'react'
import { styled } from '../../styled-system/jsx'
import { navBadge } from '../../styled-system/recipes'

/** A page in the nav rail or the tab bar, such as Inbox or Projects. */
export type NavItem = {
  value: string
  label: string
  /** The page's icon, such as `<InboxIcon />`. It takes the item's colour. */
  icon: ReactNode
  /** The number of things that need Erik on the page. A count of 1 or more shows the needs-you badge; a fraction is rounded down. */
  badge?: number | undefined
}

const Badge = styled('span', navBadge)

/**
 * The count an item's badge shows: its `badge` rounded down to a whole
 * number, or undefined when that is below 1 or not a finite number, and the
 * item shows no badge.
 */
export function badgeCount(item: NavItem): number | undefined {
  if (item.badge === undefined || !Number.isFinite(item.badge)) return undefined
  const whole = Math.floor(item.badge)
  return whole >= 1 ? whole : undefined
}

/** The words that follow the label for screen readers, such as ", 3 need you". */
export function badgeText(count: number): string {
  return `, ${String(count)} ${count === 1 ? 'needs' : 'need'} you`
}

/** The needs-you badge on an item's icon. Counts above 9 show as 9+, so the badge fits the rail. */
export function NavBadge({ count }: { count: number }) {
  return <Badge aria-hidden="true">{count > 9 ? '9+' : String(count)}</Badge>
}
