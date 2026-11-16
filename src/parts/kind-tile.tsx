import type { IconProps } from '../foundations/icons'
import {
  ActionIcon,
  AgentIcon,
  ApproveIcon,
  HookIcon,
  NextIcon,
  QuestionIcon,
  ReviewIcon,
  RuleIcon,
  SkillIcon,
  WorkflowIcon,
} from '../foundations/icons'
import { styled } from '../../styled-system/jsx'
import { kindTile, type KindTileVariantProps } from '../../styled-system/recipes'
import type { Scalar } from '../controls/scalar'

const Tile = styled('span', kindTile)

type Props = Scalar<KindTileVariantProps>
export type KindTileKind = NonNullable<Props['kind']>
export type KindTileSize = NonNullable<Props['size']>

export type KindTileProps = Props & {
  /**
   * A name for a tile that stands alone, such as "Approval". Without one
   * the tile is hidden from assistive technology, because the row's text
   * names the kind.
   */
  title?: string | undefined
}

const icons: Record<KindTileKind, (props: IconProps) => React.JSX.Element> = {
  approval: ApproveIcon,
  question: QuestionIcon,
  review: ReviewIcon,
  action: ActionIcon,
  next: NextIcon,
  skill: SkillIcon,
  agent: AgentIcon,
  rule: RuleIcon,
  workflow: WorkflowIcon,
  hook: HookIcon,
}

/**
 * A square tile with the icon of an Inbox kind (`approval`, `question`,
 * `review`, `action`, `next`) or a toolkit kind (`skill`, `agent`, `rule`,
 * `workflow`, `hook`) on a tint of its colour. `size` is `sm` (28 px with
 * a 16 px icon, the default) or `lg` (36 px with an 18 px icon).
 */
export function KindTile({ kind = 'approval', size = 'sm', title }: KindTileProps) {
  const Icon = icons[kind]
  return (
    <Tile kind={kind} size={size} data-kind={kind}>
      <Icon size={size === 'lg' ? '18' : '16'} title={title} />
    </Tile>
  )
}
