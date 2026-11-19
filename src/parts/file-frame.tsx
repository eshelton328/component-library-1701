import type { ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { fileFrame, type FileFrameVariantProps } from '../../styled-system/recipes'
import { BareIconButton } from '../controls/bare-icon-button'
import type { Scalar } from '../controls/scalar'
import { TruncatedText } from '../controls/tooltip'
import { CodeIcon, CopyIcon, FileIcon, LockIcon } from '../foundations/icons'

const { withProvider, withContext } = createSlotRecipeContext(fileFrame)
const Root = withProvider('section', 'root')
const Bar = withContext('div', 'bar')
const Icon = withContext('span', 'icon')
const Name = withContext('span', 'name')
const Meta = withContext('span', 'meta')
const End = withContext('span', 'end')
const ReadOnly = withContext('span', 'readOnly')
const Body = withContext('div', 'body')
const Foot = withContext('p', 'foot')
const FootIcon = withContext('span', 'footIcon')

// A slot given as `false`, `null` or an empty string is left out, as React leaves it out.
const shown = (node: ReactNode) => node !== undefined && node !== null && typeof node !== 'boolean' && node !== ''

/** The `data-figma` names of a FileFrame's root, bar, body and foot. */
export type FileFrameLayers = {
  root?: string | undefined
  bar?: string | undefined
  body?: string | undefined
  foot?: string | undefined
}

export type FileFrameProps = Scalar<FileFrameVariantProps> & {
  /** The file's name or path, such as "SKILL.md" or "scripts/check", in mono after the icon. It names the frame. */
  name: string
  /** `file` draws the file icon (a document); `code` the code icon (a script). Both draw at 16 px. `file` by default. */
  icon?: 'file' | 'code' | undefined
  /** Text after the name in mono, muted, such as "137 lines · the prompt"; none when not set. */
  meta?: ReactNode
  /** Items at the start of the bar's end group, before the copy icon, such as a `ViewSwitch`. */
  actions?: ReactNode
  /**
   * Called with `name` when the copy icon is pressed. With it, the bar draws a bare 12 px copy icon (a
   * `BareIconButton`) after `actions`; without it, no copy icon. The frame does not touch the clipboard.
   */
  onCopy?: ((name: string) => void) | undefined
  /** The copy icon's accessible name; "Copy" and `name` when not set. */
  copyLabel?: string | undefined
  /** Ends the bar with a 12 px lock and "Read-only" in small text. No lock when not set. */
  readOnly?: boolean | undefined
  /** A line under the body in small muted text, such as what uses the file; none when not set. */
  foot?: ReactNode
  /** An icon before `foot`, such as `<SkillIcon />`. It draws at 12 px whatever its `size`. */
  footIcon?: ReactNode
  /**
   * Names for the frame's parts, each written as its `data-figma` attribute, such as "file preview" for the root and
   * "preview bar" for the bar, so an app's check can find the element that matches a Figma layer. It changes nothing on
   * screen; a part not named has no `data-figma`.
   */
  figma?: FileFrameLayers | undefined
  /** The file's body, such as a `MarkdownView` or `CodeLines`; it sits under the bar with no padding. Bar only when not set. */
  children?: ReactNode
}

/**
 * A file shown read-only: a 37 px bar with the file or code icon, the name in
 * mono and its meta, then at the bar's end the caller's `actions`, the copy
 * icon (`onCopy`) and Read-only (`readOnly`); under it the file's body, and
 * an optional `foot` line. `variant="box"` (the default) draws it as a
 * bordered box with round corners; `variant="flush"` draws no border and
 * fills its column, for the viewer inside a `FileBrowser`. The name and the
 * end group keep their width; a box too narrow for the bar cuts its end.
 */
export function FileFrame({
  name,
  icon = 'file',
  meta,
  actions,
  onCopy,
  copyLabel,
  readOnly = false,
  foot,
  footIcon,
  children,
  variant,
  figma,
}: FileFrameProps) {
  const hasActions = shown(actions)
  return (
    <Root variant={variant} aria-label={name} data-figma={figma?.root}>
      <Bar data-figma={figma?.bar}>
        <Icon>{icon === 'code' ? <CodeIcon size="16" /> : <FileIcon size="16" />}</Icon>
        <Name>
          <TruncatedText>{name}</TruncatedText>
        </Name>
        {shown(meta) ? <Meta>{typeof meta === 'string' ? <TruncatedText>{meta}</TruncatedText> : meta}</Meta> : null}
        {hasActions || onCopy !== undefined || readOnly ? (
          <End>
            {hasActions ? actions : null}
            {onCopy === undefined ? null : (
              <BareIconButton
                label={copyLabel ?? `Copy ${name}`}
                icon={<CopyIcon size="12" />}
                onClick={() => {
                  onCopy(name)
                }}
              />
            )}
            {readOnly ? (
              <ReadOnly>
                <LockIcon size="12" />
                Read-only
              </ReadOnly>
            ) : null}
          </End>
        ) : null}
      </Bar>
      {shown(children) ? <Body data-figma={figma?.body}>{children}</Body> : null}
      {shown(foot) ? (
        <Foot data-figma={figma?.foot}>
          {shown(footIcon) ? <FootIcon>{footIcon}</FootIcon> : null}
          {foot}
        </Foot>
      ) : null}
    </Root>
  )
}
