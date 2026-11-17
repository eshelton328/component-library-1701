import { Popover as ArkPopover } from '@ark-ui/react/popover'
import { Portal } from '@ark-ui/react/portal'
import type { ReactElement, ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { popover } from '../../styled-system/recipes'
import { dataAttributesOf } from './data-attributes'

const { withRootProvider, withContext } = createSlotRecipeContext(popover)
const Root = withRootProvider(ArkPopover.Root)
const Positioner = withContext(ArkPopover.Positioner, 'positioner')
const Content = withContext(ArkPopover.Content, 'content')
const Section = withContext('div', 'section')
const SectionLabel = withContext('div', 'sectionLabel')
const Footer = withContext('div', 'footer')
const Note = withContext('span', 'note')

export type PopoverProps = {
  /** The element that opens the popover, such as the Filter `Button`. It must pass its props and ref to a DOM element. */
  trigger: ReactElement
  /** The accessible name of the popover, such as "Filters". */
  label: string
  /** The content, such as `PopoverSection`s of checkboxes. */
  children: ReactNode
  /** A short text at the start of the footer row, such as "Showing 6 of 7". */
  note?: ReactNode
  /** The buttons at the end of the footer row, such as Clear. */
  actions?: ReactNode
  /** Whether the popover is open. Set it with `onOpenChange` to control the popover. */
  open?: boolean | undefined
  onOpenChange?: ((open: boolean) => void) | undefined
  /** Where the popover opens next to the trigger; `bottom-end` when not set. */
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | undefined
  /**
   * The box width: `xs` 160 (the Workbench skill picker after "/", D1 105:406), `sm` 240 (a small menu), `filter`
   * 300 (the Inbox Filter menu), `md` 320 (a filter or snooze popover; the default), `lg` 360 (a wide skill list) or
   * `picker` 380 (the Run in picker). It never grows past the space beside the trigger.
   */
  width?: 'xs' | 'sm' | 'filter' | 'md' | 'lg' | 'picker' | undefined
  /**
   * Whether the popover may move to the other side of the trigger when `placement` has too little room; `true` when
   * not set. With `false` it keeps `placement`, and a long popover scrolls in the room it has.
   */
  flip?: boolean | undefined
  /**
   * The box fill: `overlay` (the default) is `surface.overlay`, nearly opaque, so what lies under the popover shows
   * faintly; `raised` is the opaque `surface.raised` (#17213a in dark mode), as Figma fills the Inbox popovers, such as the
   * Filter menu (D4 346:1737).
   */
  surface?: 'overlay' | 'raised' | undefined
  /**
   * The box spacing: `default` pads the box 8; `compact` pads it 6 and gives each section label a 20 px row, as the
   * Workbench skill picker draws it (D1 105:406), so a 160 px box holds a compact `OptionList` with a 130 px text
   * column.
   */
  density?: 'default' | 'compact' | undefined
  /**
   * Whether opening the popover moves the focus to its first control; `true` when not set. With `false` the focus
   * stays where it was, such as in the message box that opened the skill picker with "/", so typing goes on there.
   */
  autoFocus?: boolean | undefined
  /** A class added to the popover's box, after its own. */
  className?: string | undefined
} & PopoverDataAttributes

/**
 * `data-*` attributes set on the popover's box, such as a key an app's checks find it by. Ark's own `data-scope`,
 * `data-part` and `data-state` are left as Ark sets them.
 */
export type PopoverDataAttributes = { [key: `data-${string}`]: string | number | boolean | undefined }


/**
 * A box of controls that a button opens, such as the filter popover. A
 * click outside it or Escape closes it, and Escape returns the focus to
 * the trigger.
 */
export function Popover({ trigger, label, children, note, actions, open, onOpenChange, placement = 'bottom-end', width, flip = true, surface, density, autoFocus = true, className, ...rest }: PopoverProps) {
  return (
    <Root
      width={width}
      surface={surface}
      density={density}
      autoFocus={autoFocus}
      positioning={{ placement, gutter: 6, flip }}
      {...(open === undefined ? {} : { open })}
      onOpenChange={(details) => {
        onOpenChange?.(details.open)
      }}
    >
      <ArkPopover.Trigger asChild>{trigger}</ArkPopover.Trigger>
      <Portal>
        <Positioner>
          <Content {...dataAttributesOf(rest)} aria-label={label} {...(className === undefined ? {} : { className })}>
            {children}
            {note === undefined && actions === undefined ? null : (
              <Footer>
                <Note>{note}</Note>
                {actions}
              </Footer>
            )}
          </Content>
        </Positioner>
      </Portal>
    </Root>
  )
}

export type PopoverSectionProps = {
  /** The label of the group, such as "Kind". It shows in capitals. */
  label: string
  children: ReactNode
  /**
   * Draw a 1 px rule after the label, to the end of its row, as the Workbench skill picker's SKILLS label has
   * (D1 105:409). No rule when not set.
   */
  rule?: boolean | undefined
}

/** A labelled group of rows in a `Popover`. */
export function PopoverSection({ label, children, rule = false }: PopoverSectionProps) {
  return (
    <Section role="group" aria-label={label}>
      <SectionLabel aria-hidden="true" data-rule={rule ? '' : undefined}>
        {label}
      </SectionLabel>
      {children}
    </Section>
  )
}
