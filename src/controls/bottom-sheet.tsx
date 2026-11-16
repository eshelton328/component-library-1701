import { Dialog as ArkDialog } from '@ark-ui/react/dialog'
import { Portal } from '@ark-ui/react/portal'
import { useId, type ReactElement, type ReactNode } from 'react'
import { CloseIcon } from '../foundations/icons'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { bottomSheet, type BottomSheetVariantProps } from '../../styled-system/recipes'
import type { Scalar } from './scalar'

const { withRootProvider, withContext } = createSlotRecipeContext(bottomSheet)
const Root = withRootProvider(ArkDialog.Root)
const Backdrop = withContext(ArkDialog.Backdrop, 'backdrop')
const Positioner = withContext(ArkDialog.Positioner, 'positioner')
const Content = withContext(ArkDialog.Content, 'content')
const Grabber = withContext('div', 'grabber')
const Header = withContext('div', 'header')
const Title = withContext(ArkDialog.Title, 'title')
const HeaderLeading = withContext('div', 'headerLeading')
const HeaderActions = withContext('div', 'headerActions')
const CloseTrigger = withContext(ArkDialog.CloseTrigger, 'closeTrigger')

/**
 * Give a sheet either a `title`, which shows in the title row and names the sheet for assistive technology, or a
 * `label`, which names a sheet that has no visible title, such as the chat actions sheet.
 */
export type BottomSheetProps = ({ title: string; label?: undefined } | { title?: undefined; label: string }) & {
  /** The content under the title, such as the rows of a sort or snooze sheet. */
  children?: ReactNode
  /** The element that opens the sheet, such as a `Button`. Leave it out to open the sheet with `open`. */
  trigger?: ReactElement | undefined
  /** Whether the sheet is open. Set it with `onOpenChange` to control the sheet. When set, `defaultOpen` has no effect. */
  open?: boolean | undefined
  defaultOpen?: boolean | undefined
  onOpenChange?: ((open: boolean) => void) | undefined
  /** Show a close button at the end of the title row, as the tablet side chat does. It needs a `title`. */
  closeButton?: boolean | undefined
  /**
   * Buttons at the end of the title row, such as Done, Clear or Add. Wrap one in `BottomSheetClose` to close the
   * sheet with it. It needs a `title`.
   */
  actions?: ReactNode
  /**
   * A button at the start of the title row, such as Cancel. With it, the title is centred between the start and
   * the end of the row, as the Add a link sheet draws it. It needs a `title`.
   */
  leading?: ReactNode
  /** The element that gets the focus when the sheet opens. When not set, Ark picks the first element that takes the focus. */
  initialFocus?: (() => HTMLElement | null) | undefined
  /** `md` (the default) has a 17 px title, as the snooze and sort sheets do. `sm` has a 15 px title, as the Workbench chat actions sheet does. */
  size?: 'sm' | 'md' | undefined
}

// Omit `size` from each member of the union, so the title or label choice stays.
type WithoutSize<T> = T extends unknown ? Omit<T, 'size'> : never

/**
 * A sheet at the bottom of the window on a scrim, with a grabber at the top: the snooze,
 * sort and chat actions sheets of the phone. It keeps the focus inside while
 * it is open; Escape, a click on the scrim and `BottomSheetClose` close it,
 * and the focus goes back to the trigger.
 */
export function BottomSheet(input: BottomSheetProps) {
  return <SizedBottomSheet {...input} />
}

/**
 * The bottom sheet with every size, for the parts built on it: `sm` and
 * `md` are the sheets, `lg` the More drawer, with a larger title. The
 * package does not export it, so `BottomSheetProps` offers only `sm` and `md`.
 */
export function SizedBottomSheet({ title, label, children, trigger, open, defaultOpen, onOpenChange, closeButton = false, actions, leading, initialFocus, size }: WithoutSize<BottomSheetProps> & Scalar<BottomSheetVariantProps>) {
  const hasLeading = present(leading)
  return (
    <Root
      size={size}
      lazyMount
      unmountOnExit
      {...(initialFocus === undefined ? {} : { initialFocusEl: initialFocus })}
      {...(open === undefined ? {} : { open })}
      {...(open === undefined && defaultOpen !== undefined ? { defaultOpen } : {})}
      onOpenChange={(details) => {
        onOpenChange?.(details.open)
      }}
    >
      {trigger === undefined ? null : <ArkDialog.Trigger asChild>{trigger}</ArkDialog.Trigger>}
      <Portal>
        <Backdrop />
        <Positioner>
          {/* The name stays set when a title replaces the label while the sheet is open: Ark looks for the title only when it opens. */}
          <Content aria-label={title ?? label}>
            <Grabber aria-hidden="true" />
            {title === undefined ? null : (
              <Header data-leading={hasLeading ? '' : undefined}>
                {hasLeading ? <HeaderLeading>{leading}</HeaderLeading> : null}
                <Title>{title}</Title>
                {present(actions) ? <HeaderActions>{actions}</HeaderActions> : null}
                {closeButton ? (
                  <CloseTrigger aria-label="Close">
                    <CloseIcon size="18" />
                  </CloseTrigger>
                ) : null}
              </Header>
            )}
            {children}
          </Content>
        </Positioner>
      </Portal>
    </Root>
  )
}

function present(node: ReactNode) {
  return node !== undefined && node !== null && node !== false
}

/** An element that closes the sheet it is in, such as a Cancel button or a row that picks a value. Wrap it in this. */
export function BottomSheetClose({ children }: { children: ReactElement }) {
  // Ark gives every close trigger of a dialog the same id; each one gets its own.
  const id = useId()
  return (
    <ArkDialog.CloseTrigger asChild id={id}>
      {children}
    </ArkDialog.CloseTrigger>
  )
}
