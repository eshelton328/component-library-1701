import { Fragment, type ReactNode } from 'react'
import type { ComponentProps } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import {
  kindBadge,
  metaChip,
  metaLine,
  pathBadge,
  tagsLine,
  type KindBadgeVariantProps,
  type MetaChipVariantProps,
  type MetaLineVariantProps,
  type TagsLineVariantProps,
} from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'
import { useInputModality } from '../controls/input-modality'
import { ChevronDownIcon, CopyIcon } from '../foundations/icons'
import { BareIconButton } from '../controls/bare-icon-button'
import { TruncatedText } from '../controls/tooltip'

// React renders nothing for null, undefined, booleans and the empty string,
// so a slot or item holding one of them is left out with its gap and separator.
function present(node: ReactNode): boolean {
  return node !== null && node !== undefined && typeof node !== 'boolean' && node !== ''
}

const line = createSlotRecipeContext(metaLine)
const LineRoot = line.withProvider('span', 'root')
const LineLeading = line.withContext('span', 'leading')
const LineItem = line.withContext('span', 'item')
const LineSeparator = line.withContext('span', 'separator')
const LineTrailing = line.withContext('span', 'trailing')

export type MetaLineProps = Scalar<MetaLineVariantProps> & {
  /** The items, in order, such as the project and the source. A "·" goes between them; empty items (null, false, '') are left out. */
  items: readonly ReactNode[]
  /** A mark before the items, such as a kind mark. `icon` sizes it: `sm` (the default) draws 12 px, as in a row; `md` draws 16 px, the card's mark (Figma 14). Pass a `KindMark size="16"` to `md`, so its stroke stays 2 px. */
  leading?: ReactNode
  /** An item pushed to the end of the line, such as the age. */
  trailing?: ReactNode
}

/**
 * The meta line under a row or card title: muted mono text, with a "·"
 * between the items. Each item truncates when the line is too narrow; a
 * text item then shows in full in a tooltip.
 */
export function MetaLine({ items, leading, trailing, icon }: MetaLineProps) {
  const shown = items.filter(present)
  return (
    <LineRoot icon={icon}>
      {present(leading) ? <LineLeading>{leading}</LineLeading> : null}
      {shown.map((item, i) => (
        <Fragment key={i}>
          {i > 0 ? <LineSeparator>·</LineSeparator> : null}
          <LineItem>{typeof item === 'string' || typeof item === 'number' ? <TruncatedText>{String(item)}</TruncatedText> : item}</LineItem>
        </Fragment>
      ))}
      {present(trailing) ? <LineTrailing>{trailing}</LineTrailing> : null}
    </LineRoot>
  )
}

const chip = createSlotRecipeContext(metaChip)
const ChipRoot = chip.withProvider('span', 'root')
const ChipIcon = chip.withContext('span', 'icon')
const ChipLabel = chip.withContext('span', 'label')
const ChipButtonRoot = chip.withProvider('button', 'root')
const ChipChevron = chip.withContext('span', 'chevron')

export type MetaChipProps = Scalar<MetaChipVariantProps> & {
  /** The chip text, such as a project, a feature or an age. */
  label: string
  /** A 12 px icon before the label, such as a folder or a kind mark. */
  icon?: ReactNode
}

/**
 * A read-only chip of meta, such as the project of a task. `size` is `sm`
 * (Inbox task, `monoSm`) or `md` (Artifacts item, `mono`, the default). `tone` sets the text:
 * `default`, `muted` (an age) or `issue` (an issue ID, such as NCC-28).
 * `surface` sets the fill: `inset` (the default, `surface.inset`) or `raised`,
 * the opaque `surface.raised` of the Inbox task chips, such as the NCC chip.
 */
export function MetaChip({ label, icon, size, tone, surface }: MetaChipProps) {
  return (
    <ChipRoot size={size} tone={tone} surface={surface}>
      {present(icon) ? <ChipIcon>{icon}</ChipIcon> : null}
      <ChipLabel>
        <TruncatedText>{label}</TruncatedText>
      </ChipLabel>
    </ChipRoot>
  )
}

export type MetaChipButtonProps = Omit<ComponentProps<'button'>, 'children'> &
  Scalar<MetaChipVariantProps> & {
    /** The chip text, such as the project of the open artifact. */
    label: string
    /** A 12 px icon before the label, such as a folder. */
    icon?: ReactNode
  }

/**
 * A `MetaChip` that is a button: the same chip (`size`, `tone` and `surface`
 * as on `MetaChip`) with a 12 px down chevron after the label, such as the
 * project chip of an open artifact that opens the project menu. Pass it as
 * the `trigger` of a `Menu`; it passes its props and ref to the `<button>`.
 * It is `type="button"` unless you set `type`. It tints on hover
 * (`accent.faint`), draws the focus ring on keyboard focus and the
 * `border.active` border while its menu is open (`aria-expanded`).
 */
export function MetaChipButton({ label, icon, size, tone, surface, type = 'button', ...props }: MetaChipButtonProps) {
  useInputModality()
  return (
    <ChipButtonRoot type={type} size={size} tone={tone} surface={surface} {...props}>
      {present(icon) ? <ChipIcon aria-hidden="true">{icon}</ChipIcon> : null}
      <ChipLabel>
        <TruncatedText>{label}</TruncatedText>
      </ChipLabel>
      <ChipChevron aria-hidden="true">
        <ChevronDownIcon size="12" />
      </ChipChevron>
    </ChipButtonRoot>
  )
}

const path = createSlotRecipeContext(pathBadge)
const PathRoot = path.withProvider('span', 'root')
const PathIcon = path.withContext('span', 'icon')
const PathText = path.withContext('code', 'path')
const PathTrailing = path.withContext('span', 'trailing')

export type PathBadgeProps = {
  /** The path, such as "toolkit/skills/writer/". */
  path: string
  /** An icon before the path, such as a folder. `iconSize` sizes it. */
  icon?: ReactNode
  /** The icon's size: `sm` (the default) draws 12 px; `md` draws 16 px, as on a file's own page on the phone. */
  iconSize?: 'sm' | 'md' | undefined
  /** An action after the path. The caller gives it its name and handler. For the copy icon, use `onCopy`. */
  trailing?: ReactNode
  /**
   * Called with the path when the user presses the copy icon. When set, the
   * badge ends with a bare 12 px copy icon (a `BareIconButton`, after
   * `trailing`), as Toolkit draws it (D3 457:50), and keeps its height. The
   * badge does not touch the clipboard; the handler copies. When not set,
   * the badge draws no copy icon.
   */
  onCopy?: ((path: string) => void) | undefined
  /** The copy icon's accessible name; "Copy <path>" when not set. */
  copyLabel?: string | undefined
}

/** The path of a file or folder in a mono badge, as on the Toolkit item page. */
export function PathBadge({ path: value, icon, iconSize, trailing, onCopy, copyLabel }: PathBadgeProps) {
  return (
    <PathRoot iconSize={iconSize}>
      {present(icon) ? <PathIcon>{icon}</PathIcon> : null}
      <PathText>
        <TruncatedText>{value}</TruncatedText>
      </PathText>
      {present(trailing) || onCopy !== undefined ? (
        <PathTrailing>
          {trailing}
          {onCopy === undefined ? null : (
            <BareIconButton
              label={copyLabel ?? `Copy ${value}`}
              icon={<CopyIcon size="12" />}
              onClick={() => {
                onCopy(value)
              }}
            />
          )}
        </PathTrailing>
      ) : null}
    </PathRoot>
  )
}

const kindCtx = createSlotRecipeContext(kindBadge)
const KindRoot = kindCtx.withProvider('span', 'root')
const KindIcon = kindCtx.withContext('span', 'icon')

/** A toolkit kind: skill, agent, rule, workflow or hook. */
export type ToolkitKind = NonNullable<Scalar<KindBadgeVariantProps>['kind']>

const kindLabels: Record<ToolkitKind, string> = { skill: 'Skill', agent: 'Agent', rule: 'Rule', workflow: 'Workflow', hook: 'Hook' }

export type KindBadgeProps = {
  /** The toolkit kind. It sets the colour and the default label. */
  kind: ToolkitKind
  /** The text; the kind's name, such as "Skill", when not set. */
  label?: string | undefined
  /** The kind icon, drawn at 12 px in the kind colour (Figma draws 14). */
  icon?: ReactNode
}

/** A pill that names the kind of a toolkit item, in the kind colour. */
export function KindBadge({ kind, label = kindLabels[kind], icon }: KindBadgeProps) {
  return (
    <KindRoot kind={kind}>
      {present(icon) ? <KindIcon>{icon}</KindIcon> : null}
      {label}
    </KindRoot>
  )
}

const tags = createSlotRecipeContext(tagsLine)
const TagsRoot = tags.withProvider('ul', 'root')
const TagsIcon = tags.withContext('span', 'icon')
const Tag = tags.withContext('li', 'tag')
const TagsSeparator = tags.withContext('span', 'separator')

export type TagsLineProps = {
  /** The tags, such as "global/planning". The line renders nothing when there are none. */
  tags: readonly string[]
  /** A 12 px tag icon, drawn before the first tag. */
  icon?: ReactNode
  /** The accessible name of the list; "Tags" when not set. */
  label?: string | undefined
  /** The text size: `md` (the default) for `mono`, `sm` for `monoSm`, as the Inbox detail draws the tags. */
  size?: Scalar<TagsLineVariantProps>['size']
}

/** The tags of an item, in mono text with a "·" between them. `size="sm"` sets them in `monoSm`, as the Inbox detail does. */
export function TagsLine({ tags: list, icon, label = 'Tags', size }: TagsLineProps) {
  if (list.length === 0) return null
  return (
    <TagsRoot aria-label={label} size={size}>
      {list.map((tag, i) => (
        <Tag key={`${String(i)}:${tag}`}>
          {i === 0 && present(icon) ? <TagsIcon aria-hidden="true">{icon}</TagsIcon> : null}
          {i > 0 ? <TagsSeparator aria-hidden="true">·</TagsSeparator> : null}
          {tag}
        </Tag>
      ))}
    </TagsRoot>
  )
}
