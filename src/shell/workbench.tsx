import type { ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { workbench } from '../../styled-system/recipes'
import { WorkspaceTabs, type WorkspaceTab } from '../controls/workspace-tabs'
import { TruncatedText } from '../controls/tooltip'

const { withProvider, withContext } = createSlotRecipeContext(workbench)
const Root = withProvider('div', 'root')
const Status = withContext('div', 'status')
const Summary = withContext('span', 'summary')
const Hint = withContext('span', 'hint')
const Alert = withContext('span', 'alert')

export type WorkbenchProps = {
  /** The accessible name of the workspace tabs. "Workspaces" by default. */
  label?: string | undefined
  /** The workspaces; each one's `content` is usually its `SplitPanes`. */
  workspaces: readonly WorkspaceTab[]
  /** The selected workspace. Set it with `onValueChange` to control the tabs. */
  value?: string | undefined
  /** The first selected workspace of an uncontrolled Workbench. */
  defaultValue?: string | undefined
  /** Called with the value of the workspace the user picks. */
  onValueChange?: ((value: string) => void) | undefined
  /** Before the tabs, at the start of the bar, such as the button that opens the workspace sidebar (Workbench D1 158:2). */
  leading?: ReactNode
  /** After the tabs, such as the button that starts a chat in the workspace. */
  actions?: ReactNode
  /** At the right end of the bar, such as the button that resets the pane sizes. */
  trailing?: ReactNode
  /**
   * The tab bar's size. `md` (the default) pads the bar 12 above and 10
   * below the tabs and the panes 10 on every side. `compact` is the 52 px
   * bar of the desktop Workbench (D1 105:105): the panes start right under
   * it, with 10 at the sides and bottom.
   */
  size?: 'md' | 'compact' | undefined
  /** The start of the status bar, in cyan, such as "omni-brain · 2 panes". */
  summary?: string | undefined
  /** Keyboard hints after the summary, such as "Cmd+D split". */
  hints?: readonly string[] | undefined
  /** At the end of the status bar, in amber: a chat that needs the user, such as "the-bridge › hono server needs you". */
  alert?: string | undefined
}

/**
 * The Workbench column: the workspace tabs, the selected workspace's panes
 * and a status bar with a summary, keyboard hints and a needs-you note
 * (Workbench D9). It fills its parent, usually the detail pane of the
 * `AppShell`. The status bar is left out when it has nothing to show.
 */
export function Workbench({ label = 'Workspaces', workspaces, value, defaultValue, onValueChange, leading, actions, trailing, size, summary, hints = [], alert }: WorkbenchProps) {
  const hasSummary = summary !== undefined && summary !== ''
  const hasAlert = alert !== undefined && alert !== ''
  return (
    <Root>
      <WorkspaceTabs label={label} items={workspaces} value={value} defaultValue={defaultValue} onValueChange={onValueChange} leading={leading} actions={actions} trailing={trailing} size={size} />
      {hasSummary || hints.length > 0 || hasAlert ? (
        // The hint bar is chrome: it keeps the Small type at every text size (d-131). The workspace's content does not.
        <Status data-text-fixed="">
          {hasSummary ? <Summary>{summary}</Summary> : null}
          {hints.map((hint) => (
            <Hint key={hint}>
              <TruncatedText>{hint}</TruncatedText>
            </Hint>
          ))}
          {hasAlert ? <Alert>{alert}</Alert> : null}
        </Status>
      ) : null}
    </Root>
  )
}
