import { Portal } from '@ark-ui/react/portal'
import { createToaster as createArkToaster, Toast as ArkToast, Toaster as ArkToaster, type CreateToasterReturn } from '@ark-ui/react/toast'
import type { ReactNode } from 'react'
import { CloseIcon } from '../foundations/icons'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { toast, type ToastVariantProps } from '../../styled-system/recipes'
import type { Scalar } from './scalar'

const { withProvider, withContext } = createSlotRecipeContext(toast)
// The static toast: plain elements, so it shows open with no timer and no Toaster.
const StaticRoot = withProvider('div', 'root')
const StaticDescription = withContext('span', 'description')
const StaticAction = withContext('button', 'actionTrigger')
const StaticClose = withContext('button', 'closeTrigger')
// The toast inside a Toaster: Ark's parts, which time it, pause it on hover and dismiss it.
const Group = withProvider(ArkToaster, 'group')
const LiveRoot = withProvider(ArkToast.Root, 'root')
const LiveDescription = withContext(ArkToast.Description, 'description')
const LiveAction = withContext(ArkToast.ActionTrigger, 'actionTrigger')
const LiveClose = withContext(ArkToast.CloseTrigger, 'closeTrigger')
const Icon = withContext('span', 'icon')

/** The tone of a toast: its border colour. */
export type ToastTone = NonNullable<Scalar<ToastVariantProps>['tone']>

/** A button in a toast, such as Undo. */
export type ToastAction = {
  /** The button label, such as "Undo". */
  label: string
  /** Called when the user clicks the button. In a `Toaster`, the toast then closes. */
  onClick: () => void
}

export type ToastProps = Scalar<ToastVariantProps> & {
  /** The message, such as "Created 3 tasks from a discussion". */
  children: string
  /** An icon before the message, such as `<CheckIcon size="12" />`. It is drawn in the done colour. */
  icon?: ReactNode
  /** A button after the message, such as Undo. */
  action?: ToastAction | undefined
  /** Called when the user clicks the close button. Without it, the toast has no close button. */
  onClose?: (() => void) | undefined
  /** The name of the close button. Defaults to "Dismiss". */
  closeLabel?: string | undefined
}

/**
 * A short message that confirms an action, such as "Moved bridge themes to
 * the-bridge", with an optional icon, a button such as Undo and a close
 * button. This one is static: it stays open and has no timer, for design
 * canvases and pages that place it themselves. It is a `status` live
 * region, so assistive technology reads it when it appears. To show toasts
 * that close by themselves, use `createToaster` and `Toaster`.
 */
export function Toast({ children, icon, action, onClose, closeLabel = 'Dismiss', tone }: ToastProps) {
  return (
    <StaticRoot tone={tone} role="status" aria-atomic="true">
      {icon === undefined ? null : <Icon aria-hidden="true">{icon}</Icon>}
      <StaticDescription>{children}</StaticDescription>
      {action === undefined ? null : (
        <StaticAction type="button" onClick={action.onClick}>
          {action.label}
        </StaticAction>
      )}
      {onClose === undefined ? null : (
        <StaticClose type="button" aria-label={closeLabel} onClick={onClose}>
          <CloseIcon size="12" />
        </StaticClose>
      )}
    </StaticRoot>
  )
}

/** A toast for `ToasterStore.show`. */
export type ToastOptions = {
  /** The message. */
  text: string
  /** An icon before the message, such as `<CheckIcon size="12" />`. */
  icon?: ReactNode
  /** A button after the message, such as Undo. A click runs it and closes the toast. */
  action?: ToastAction | undefined
  /** Whether the toast has a close button. Escape closes a focused toast either way. */
  closable?: boolean | undefined
  tone?: ToastTone | undefined
  /** How long the toast stays, in ms. Defaults to the toaster's `duration`. Hovering pauses it. */
  duration?: number | undefined
  /** The toast id. Showing a toast with the id of an open one replaces it. */
  id?: string | undefined
}

/** Where the toasts appear and how long they stay; see `createToaster`. */
export type ToasterOptions = {
  /** Where the toasts sit in the window. Defaults to `bottom-start`, as in Inbox D18. */
  placement?: 'top-start' | 'top' | 'top-end' | 'bottom-start' | 'bottom' | 'bottom-end' | undefined
  /** How far the toasts sit from the window's edges, as a CSS length or one per edge. Defaults to `1rem`. */
  offsets?: string | Record<'left' | 'right' | 'bottom' | 'top', string> | undefined
  /** How long a toast stays, in ms. Defaults to 5000. */
  duration?: number | undefined
  /** How many toasts show at once; more wait in a queue. Defaults to 3. */
  max?: number | undefined
}

/** The toasts of a `Toaster`. Create one with `createToaster`, outside any component. */
export type ToasterStore = {
  /** Shows a toast and returns its id. */
  show: (options: ToastOptions) => string
  /** Closes the toast with this id, or every toast when no id is given. */
  dismiss: (id?: string) => void
}

type ToastLook = { text: string; icon: ReactNode; tone: ToastTone | undefined }
type Internals = { store: CreateToasterReturn; looks: Map<string, ToastLook> }
// The Ark store and the look of each toast, kept out of the public type.
const internals = new WeakMap<ToasterStore, Internals>()

/**
 * Creates the store of a `Toaster`: call it once, outside any component, and
 * pass the result to `<Toaster toaster={...} />`. Then `show` a toast from
 * any event handler.
 */
export function createToaster({ placement = 'bottom-start', offsets, duration = 5000, max = 3 }: ToasterOptions = {}): ToasterStore {
  const store = createArkToaster({ placement, duration, max, ...(offsets === undefined ? {} : { offsets }) })
  const looks = new Map<string, ToastLook>()
  let count = 0
  const toaster: ToasterStore = {
    show: ({ text, icon, action, closable, tone, duration: own, id }) => {
      count += 1
      const key = id ?? `toast-${String(count)}`
      // The look is stored first: the store renders the toast as soon as it is created.
      looks.set(key, { text, icon, tone })
      return store.create({
        id: key,
        description: text,
        type: 'info',
        // Every field is set, so a toast shown again with the same id keeps nothing of the old one, such as its action.
        duration: own ?? duration,
        action: action === undefined ? undefined : { label: action.label, onClick: action.onClick },
        title: undefined,
        meta: undefined,
        closable: closable ?? false,
        onStatusChange: (details) => {
          if (details.status === 'unmounted') looks.delete(key)
        },
      })
    },
    dismiss: (id) => {
      store.dismiss(id)
    },
  }
  internals.set(toaster, { store, looks })
  return toaster
}

export type ToasterProps = {
  /** The store from `createToaster`. */
  toaster: ToasterStore
  /** The name of the toast region for assistive technology. Defaults to "Notifications". */
  label?: string | undefined
  /** The name of each toast's close button. Defaults to "Dismiss". */
  closeLabel?: string | undefined
}

/**
 * Shows the toasts of a `createToaster` store, stacked at its placement over
 * the page. Put it once near the root of the app. Each toast is a `status`
 * in a polite live region; it closes after its duration, and hovering or
 * focusing it pauses the timer. Escape closes the focused toast, and
 * Alt+T moves the focus to the toasts.
 */
export function Toaster({ toaster, label, closeLabel = 'Dismiss' }: ToasterProps) {
  const own = internals.get(toaster)
  if (own === undefined) return null
  return (
    <Portal>
      <Group toaster={own.store} {...(label === undefined ? {} : { label })}>
        {(item) => {
          const look = item.id === undefined ? undefined : own.looks.get(item.id)
          if (look === undefined) return null
          return (
            <LiveRoot key={item.id} tone={look.tone}>
              {look.icon === undefined ? null : <Icon aria-hidden="true">{look.icon}</Icon>}
              <LiveDescription>{look.text}</LiveDescription>
              {item.action === undefined ? null : <LiveAction>{item.action.label}</LiveAction>}
              {item.closable === true ? (
                <LiveClose aria-label={closeLabel}>
                  <CloseIcon size="12" />
                </LiveClose>
              ) : null}
            </LiveRoot>
          )
        }}
      </Group>
    </Portal>
  )
}
