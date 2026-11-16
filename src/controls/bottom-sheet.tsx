import { Dialog as ArkDialog } from '@ark-ui/react/dialog'
import { Portal } from '@ark-ui/react/portal'
import type { ReactElement, ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { bottomSheet } from '../../styled-system/recipes'

const { withRootProvider, withContext } = createSlotRecipeContext(bottomSheet)
const Root = withRootProvider(ArkDialog.Root)
const Backdrop = withContext(ArkDialog.Backdrop, 'backdrop')
const Positioner = withContext(ArkDialog.Positioner, 'positioner')
const Content = withContext(ArkDialog.Content, 'content')
const Grabber = withContext('div', 'grabber')
const Header = withContext('div', 'header')
const Title = withContext(ArkDialog.Title, 'title')
const CloseTrigger = withContext(ArkDialog.CloseTrigger, 'closeTrigger')

/** A sheet with a visible title, which also names it for assistive technology. */
type Titled = { title: string; label?: undefined }
/** A sheet with no visible title, named by `label`, such as the chat actions sheet. */
type Untitled = { title?: undefined; label: string }

export type BottomSheetProps = (Titled | Untitled) & {
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
  /** The element that gets the focus when the sheet opens. When not set, Ark picks the first element that takes the focus. */
  initialFocus?: (() => HTMLElement | null) | undefined
}

/**
 * A sheet that rises from the bottom of the window on a scrim: the snooze,
 * sort and chat actions sheets of the phone. It keeps the focus inside while
 * it is open; Escape, a click on the scrim and `BottomSheetClose` close it,
 * and the focus goes back to the trigger.
 */
export function BottomSheet({ title, label, children, trigger, open, defaultOpen, onOpenChange, closeButton = false, initialFocus }: BottomSheetProps) {
  return (
    <Root
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
          <Content {...(title === undefined ? { 'aria-label': label } : {})}>
            <Grabber aria-hidden="true" />
            {title === undefined ? null : (
              <Header>
                <Title>{title}</Title>
                {closeButton ? (
                  <CloseTrigger aria-label="Close">
                    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" />
                    </svg>
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

/** An element that closes the sheet it is in, such as a Cancel button or a row that picks a value. Wrap it in this. */
export function BottomSheetClose({ children }: { children: ReactElement }) {
  return <ArkDialog.CloseTrigger asChild>{children}</ArkDialog.CloseTrigger>
}
