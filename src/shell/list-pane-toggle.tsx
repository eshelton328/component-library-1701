import { Button } from '../controls/button'
import { dataAttributesOf } from '../controls/data-attributes'
import type { PopoverDataAttributes } from '../controls/popover'
import { PanelIcon } from '../foundations/icons'

export type ListPaneToggleProps = {
  /** Whether the list pane is open. The button is pressed while it is. */
  open: boolean
  /** Called with the new state, `!open`, when the user clicks the button. */
  onOpenChange: (open: boolean) => void
  /**
   * The button's accessible name, which the page sets for each state, such
   * as "Hide the workspace sidebar" while open and "Show the workspace
   * sidebar" while closed.
   */
  label: string
  /** The id of the list pane the button opens and closes; sets `aria-controls`. */
  controls?: string | undefined
} & PopoverDataAttributes

/**
 * The button that opens and closes a list pane, such as the Workbench
 * sidebar: a `sm` icon-only `Button` with the panel icon at 16. Open, it is
 * pressed (`aria-pressed`) and draws `border.selected` (Workbench D2 158:6);
 * closed, it is the plain `sm` button (D1 158:2). It is controlled: the page
 * keeps the open state and passes it in. `data-*` props, such as
 * `data-figma`, go on the button.
 */
export function ListPaneToggle({ open, onOpenChange, label, controls, ...rest }: ListPaneToggleProps) {
  return (
    <Button
      {...dataAttributesOf(rest)}
      size="sm"
      iconOnly
      pressed={open}
      pressedBorder="selected"
      aria-label={label}
      aria-controls={controls}
      onClick={() => {
        onOpenChange(!open)
      }}
    >
      <PanelIcon size="16" />
    </Button>
  )
}
