import { Fragment, type ReactNode } from 'react'
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
} from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'
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
  /** A mark before the items, such as a kind mark. `icon="md"` is the card's mark, which Figma draws at 14 px; both sizes now draw 12 px. */
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

export type MetaChipProps = Scalar<MetaChipVariantProps> & {
  /** The chip text, such as a project, a feature or an age. */
  label: string
  /** A 12 px icon before the label, such as a folder or a kind mark. */
  icon?: ReactNode
}

/**
 * A read-only chip of meta, such as the project of a task. `size` is `sm`
 * (Inbox task) or `md` (Artifacts item, the default). `tone` sets the text:
 * `default`, `muted` (an age) or `issue` (an issue ID, such as NCC-28).
 */
export function MetaChip({ label, icon, size, tone }: MetaChipProps) {
  return (
    <ChipRoot size={size} tone={tone}>
      {present(icon) ? <ChipIcon>{icon}</ChipIcon> : null}
      <ChipLabel>
        <TruncatedText>{label}</TruncatedText>
      </ChipLabel>
    </ChipRoot>
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
  /** A 12 px icon before the path, such as a folder. */
  icon?: ReactNode
  /** An action after the path, such as a copy button. The caller gives it its name and handler. */
  trailing?: ReactNode
}

/** The path of a file or folder in a mono badge, as on the Toolkit item page. */
export function PathBadge({ path: value, icon, trailing }: PathBadgeProps) {
  return (
    <PathRoot>
      {present(icon) ? <PathIcon>{icon}</PathIcon> : null}
      <PathText>
        <TruncatedText>{value}</TruncatedText>
      </PathText>
      {present(trailing) ? <PathTrailing>{trailing}</PathTrailing> : null}
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
}

/** The tags of an item, in mono text with a "·" between them. */
export function TagsLine({ tags: list, icon, label = 'Tags' }: TagsLineProps) {
  if (list.length === 0) return null
  return (
    <TagsRoot aria-label={label}>
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
