import { Popover as ArkPopover } from '@ark-ui/react/popover'
import { Portal } from '@ark-ui/react/portal'
import type { ReactElement, ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { popover } from '../../styled-system/recipes'

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
}

/**
 * A box of controls that a button opens, such as the filter popover. A
 * click outside it or Escape closes it, and Escape returns the focus to
 * the trigger.
 */
export function Popover({ trigger, label, children, note, actions, open, onOpenChange, placement = 'bottom-end' }: PopoverProps) {
  return (
    <Root
      positioning={{ placement, gutter: 6 }}
      {...(open === undefined ? {} : { open })}
      onOpenChange={(details) => {
        onOpenChange?.(details.open)
      }}
    >
      <ArkPopover.Trigger asChild>{trigger}</ArkPopover.Trigger>
      <Portal>
        <Positioner>
          <Content aria-label={label}>
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
}

/** A labelled group of rows in a `Popover`. */
export function PopoverSection({ label, children }: PopoverSectionProps) {
  return (
    <Section role="group" aria-label={label}>
      <SectionLabel aria-hidden="true">{label}</SectionLabel>
      {children}
    </Section>
  )
}
