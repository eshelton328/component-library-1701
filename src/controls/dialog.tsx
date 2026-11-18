import { Dialog as ArkDialog } from '@ark-ui/react/dialog'
import { Portal } from '@ark-ui/react/portal'
import type { ReactElement, ReactNode } from 'react'
import { CloseIcon } from '../foundations/icons'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { dialog, type DialogVariantProps } from '../../styled-system/recipes'
import { dataAttributesOf } from './data-attributes'
import type { PopoverDataAttributes } from './popover'
import type { Scalar } from './scalar'

const { withRootProvider, withContext } = createSlotRecipeContext(dialog)
const Root = withRootProvider(ArkDialog.Root)
const Backdrop = withContext(ArkDialog.Backdrop, 'backdrop')
const Positioner = withContext(ArkDialog.Positioner, 'positioner')
const Content = withContext(ArkDialog.Content, 'content')
const Header = withContext('div', 'header')
const Title = withContext(ArkDialog.Title, 'title')
const Description = withContext(ArkDialog.Description, 'description')
const CloseTrigger = withContext(ArkDialog.CloseTrigger, 'closeTrigger')
const Footer = withContext('div', 'footer')
const HeaderAction = withContext('div', 'headerAction')
const Heading = withContext('div', 'heading')
const Meta = withContext('p', 'meta')

export type DialogProps = Scalar<DialogVariantProps> & {
  /** The dialog title. It names the dialog for assistive technology. */
  title: string
  /**
   * A line 4 px under the title that names what the dialog acts on, such as a task's place and status (Inbox D20
   * 403:3917), in mono.
   */
  meta?: ReactNode
  /** A sentence under the title that says what the dialog is for. */
  description?: ReactNode
  /** The content between the description and the buttons, such as a form. */
  children?: ReactNode
  /** The buttons at the end, such as Cancel and Remove task, in that order. */
  actions?: ReactNode
  /** The element that opens the dialog, such as a `Button`. Leave it out to open the dialog with `open`. */
  trigger?: ReactElement | undefined
  /** Whether the dialog is open. Set it with `onOpenChange` to control the dialog. When set, `defaultOpen` has no effect. */
  open?: boolean | undefined
  defaultOpen?: boolean | undefined
  onOpenChange?: ((open: boolean) => void) | undefined
  /** `alertdialog` for a confirm dialog that asks before an action that cannot be undone. */
  role?: 'dialog' | 'alertdialog' | undefined
  /** Show a close button in the header, as the New chat dialog does. */
  closeButton?: boolean | undefined
  /**
   * The element that gets the focus when the dialog opens, such as the first field of a form. When not set, Ark
   * picks it: in an `alertdialog`, the `DialogClose` button, such as Cancel; in a `dialog`, the first element that
   * takes the focus, which can be the close button.
   */
  initialFocus?: (() => HTMLElement | null) | undefined
  /**
   * An action at the end of the title row, before the close button, such as a Done `Button variant="text"` wrapped in
   * `DialogClose` (Inbox D8).
   */
  headerAction?: ReactNode
  /** A class added to the dialog's box, after its own. */
  className?: string | undefined
} & PopoverDataAttributes

/**
 * A dialog on a scrim: the confirm dialog of Inbox (`md`), the New chat
 * form of Workbench (`lg`) and the Inbox suggested prompt (`wide`). It keeps the focus inside while it is open;
 * Escape and a click on the scrim close it, and the focus goes back to the
 * trigger.
 */
export function Dialog({ title, meta, description, children, actions, trigger, open, defaultOpen, onOpenChange, role = 'dialog', closeButton = false, initialFocus, size, headerAction, className, ...rest }: DialogProps) {
  return (
    <Root
      size={size}
      role={role}
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
          <Content {...dataAttributesOf(rest)} {...(className === undefined ? {} : { className })}>
            <Header>
              {meta === undefined || meta === null || typeof meta === 'boolean' ? (
                <Title>{title}</Title>
              ) : (
                <Heading>
                  <Title>{title}</Title>
                  <Meta>{meta}</Meta>
                </Heading>
              )}
              {headerAction === undefined || headerAction === null || typeof headerAction === 'boolean' ? null : <HeaderAction>{headerAction}</HeaderAction>}
              {closeButton ? (
                <CloseTrigger aria-label="Close">
                  <CloseIcon size="16" />
                </CloseTrigger>
              ) : null}
            </Header>
            {description === undefined ? null : <Description>{description}</Description>}
            {children}
            {actions === undefined ? null : <Footer>{actions}</Footer>}
          </Content>
        </Positioner>
      </Portal>
    </Root>
  )
}

/** A button that closes the dialog it is in, such as Cancel. Wrap a `Button` in it. */
export function DialogClose({ children }: { children: ReactElement }) {
  return <ArkDialog.CloseTrigger asChild>{children}</ArkDialog.CloseTrigger>
}
