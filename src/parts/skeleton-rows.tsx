import { Stack } from '../controls/layout'
import { Card } from './card'
import { GroupHeader, type GroupHeaderProps } from './group-header'
import { ListRow } from './list-row'
import type { KindMarkKind } from './kind-mark'
import { Message } from './message'
import { Skeleton } from './skeleton'

// The loading presets of the-bridge's common shapes (the loading standard, 2026-11-23): each is the real part
// with `loading` set and skeletons in its slots, so it has the size of the part that replaces it. Put them in a
// SkeletonGroup.

export type InboxRowSkeletonProps = {
  /** The phone's row, with the 4 px side inset of the Inbox phone list (`padding="phoneSides"`, M1 346:9052). */
  phone?: boolean | undefined
}

/** An Inbox row that loads: a kind tile, the title and the meta line, and the age. */
export function InboxRowSkeleton({ phone = false }: InboxRowSkeletonProps) {
  return (
    <ListRow
      loading
      title=""
      density="compact"
      padding={phone ? 'phoneSides' : undefined}
      leading={<Skeleton shape="block" size="kindTileSm" />}
      meta={<Skeleton width="half" />}
      trailing={<Skeleton width="word" />}
    />
  )
}

/** A Workspaces sidebar chat row that loads: a kind mark, the title and the model, and the status. */
export function ChatRowSkeleton() {
  return (
    <ListRow
      loading
      title=""
      variant="sidebar"
      density="compact"
      leading={<Skeleton shape="circle" size="icon16" />}
      meta={<Skeleton width="half" />}
      trailing={<Skeleton width="word" />}
    />
  )
}

export type GroupHeaderSkeletonProps = Pick<GroupHeaderProps, 'variant'>

/** A group header that loads, such as a Workspaces workspace or an Inbox group: its label as a word. */
export function GroupHeaderSkeleton({ variant }: GroupHeaderSkeletonProps) {
  return <GroupHeader loading label="" variant={variant} />
}

export type TranscriptEntrySkeletonProps = {
  /** `user` draws the owner's bubble with one line; `assistant` (the default) draws three lines of a reply. */
  from?: 'user' | 'assistant' | undefined
  /** The chat's kind, whose mark and name head a reply: `claude` (the default), `codex` or `shell`. */
  kind?: KindMarkKind | undefined
}

/** A transcript entry that loads: the owner's prompt bubble, or a reply's lines. */
export function TranscriptEntrySkeleton({ from = 'assistant', kind = 'claude' }: TranscriptEntrySkeletonProps) {
  return from === 'user' ? (
    <Message from="user">
      <Skeleton width="long" />
    </Message>
  ) : (
    <Message from="assistant" kind={kind}>
      <Skeleton width="full" />
      <Skeleton width="full" />
      <Skeleton width="half" />
    </Message>
  )
}

export type ArtifactRowSkeletonProps = {
  /** The preview's size: `sm` (64 × 40, the desktop and tablet rows, the default) or `md` (76 × 48, the phone's). */
  size?: 'sm' | 'md' | undefined
}

/** An artifact row that loads: the preview, the title and the meta line. */
export function ArtifactRowSkeleton({ size = 'sm' }: ArtifactRowSkeletonProps) {
  return (
    <ListRow
      loading
      title=""
      leading={<Skeleton shape="block" size={size === 'md' ? 'thumbnailMd' : 'thumbnailSm'} />}
      meta={<Skeleton width="half" />}
    />
  )
}

/** An artifact card that loads: the wide preview, the title, the description and the meta row. */
export function ArtifactCardSkeleton() {
  return (
    <Card
      loading
      title=""
      description=" "
      media={<Skeleton shape="block" ratio="wide" />}
      meta={<Skeleton width="half" />}
    />
  )
}

export type DetailBodySkeletonProps = {
  /** How many lines of text load, 3 by default. The last one is half as wide. */
  lines?: 1 | 2 | 3 | 4 | 5 | 6 | undefined
}

/** The body of a detail pane that loads, such as an Inbox item's: lines of the text style it sits in, as one paragraph. */
export function DetailBodySkeleton({ lines = 3 }: DetailBodySkeletonProps) {
  return (
    <Stack gap="0">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? 'half' : 'full'} />
      ))}
    </Stack>
  )
}
