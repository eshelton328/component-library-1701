import type { ComponentPropsWithRef } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { inlineChip } from '../../styled-system/recipes'
import { TruncatedText } from '../controls/tooltip'
import { ChatIcon, FileIcon } from '../foundations/icons'

const { withProvider, withContext } = createSlotRecipeContext(inlineChip)
const Root = withProvider('a', 'root')
const Icon = withContext('span', 'icon')
const Label = withContext('span', 'label')
const Detail = withContext('span', 'detail')

/**
 * The link props of an inline chip: `href`, `onClick`, `ref` and the other `<a>` props, so a router can wrap the chip
 * as its link (TanStack Router's `createLink`). The chip draws its own text, class and style.
 */
export type InlineChipLinkProps = Omit<ComponentPropsWithRef<'a'>, 'children' | 'className' | 'style'>

export type FileChipProps = InlineChipLinkProps & {
  /** The file's path as the text wrote it, such as "web/src/blocks/MarkdownText.tsx". */
  path: string
  /** The line the link opens at, drawn as ":42" after the path; none when not set. */
  line?: number | undefined
}

/**
 * A file path in running text that opens the file, such as a path in a chat message. The path is in mono with a file
 * icon; a long path breaks anywhere and wraps with the text. The chip is a link: the caller gives it `href` and
 * handles the press.
 */
export function FileChip({ path, line, ...link }: FileChipProps) {
  return (
    <Root kind="file" {...link}>
      <Icon aria-hidden>
        <FileIcon />
      </Icon>
      <Label>{path}</Label>
      {line === undefined ? null : <Detail>:{line}</Detail>}
    </Root>
  )
}

export type MentionChipProps = InlineChipLinkProps & {
  /** The chat's name as the text wrote it, without the at sign before it, such as "bridge-coord". */
  name: string
}

/**
 * A chat's name in running text that opens the chat, such as a mention of "bridge-coord" in a message. The name is
 * drawn with a chat icon and no at sign, in the text colour. The chip never breaks over two lines: at a line end it
 * moves to the next line whole, and a name wider than the column ends with an ellipsis and shows whole in a tooltip.
 * The chip is a link: the caller gives it `href` and handles the press.
 */
export function MentionChip({ name, ...link }: MentionChipProps) {
  return (
    <Root kind="mention" {...link}>
      <Icon aria-hidden>
        <ChatIcon />
      </Icon>
      <Label>
        <TruncatedText>{name}</TruncatedText>
      </Label>
    </Root>
  )
}
