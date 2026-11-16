import { TreeView as ArkTreeView, createTreeCollection } from '@ark-ui/react/tree-view'
import { useMemo, type ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { treeView } from '../../styled-system/recipes'
import { ChevronDownIcon } from '../foundations/icons'

type Inner = { id: string; label: string; source: TreeViewNode; children?: Inner[] }

// Ark's Root is generic over its node type, which withProvider would lose.
function InnerRoot(props: ArkTreeView.RootProps<Inner>) {
  return <ArkTreeView.Root {...props} />
}

const { withProvider, withContext } = createSlotRecipeContext(treeView)
const Root = withProvider(InnerRoot, 'root')
const Label = withContext(ArkTreeView.Label, 'label')
const Tree = withContext(ArkTreeView.Tree, 'tree')
const Branch = withContext(ArkTreeView.Branch, 'branch')
const BranchControl = withContext(ArkTreeView.BranchControl, 'branchControl')
const BranchIndicator = withContext(ArkTreeView.BranchIndicator, 'branchIndicator')
const BranchText = withContext(ArkTreeView.BranchText, 'branchText')
const BranchContent = withContext(ArkTreeView.BranchContent, 'branchContent')
const Item = withContext(ArkTreeView.Item, 'item')
const ItemText = withContext(ArkTreeView.ItemText, 'itemText')
const Icon = withContext('span', 'icon')
const Trailing = withContext('span', 'trailing')
const Caption = withContext('span', 'caption')

/** One row in a `TreeView`. A node with `children` (even none) is a branch that opens and closes. */
export type TreeViewNode = {
  /** A value unique in the tree, such as the file's path. */
  value: string
  label: string
  /** The icon before the label. It takes the row's colour. */
  icon?: ReactNode
  /** Text at the end of the row, such as a count. */
  trailing?: ReactNode
  /** A line under the label, such as the role of a file. */
  caption?: string | undefined
  children?: readonly TreeViewNode[] | undefined
  disabled?: boolean | undefined
}

export type TreeViewProps = {
  /** The accessible name of the tree, such as "Files". */
  label: string
  nodes: readonly TreeViewNode[]
  /** The selected node. Set it with `onSelect` to control the tree. */
  selected?: string | undefined
  /** The first selected node of an uncontrolled tree. */
  defaultSelected?: string | undefined
  /** Called with the value of the node the user selects. */
  onSelect?: ((value: string) => void) | undefined
  /** The open branches. Set it with `onExpandedChange` to control the tree. */
  expanded?: readonly string[] | undefined
  /** The branches open at first in an uncontrolled tree. */
  defaultExpanded?: readonly string[] | undefined
  /** Called with the values of the open branches when one opens or closes. */
  onExpandedChange?: ((values: string[]) => void) | undefined
}

// Ark treats an empty string as no value, so each value gets a prefix.
const toArk = (v: string) => `tree:${v}`
const fromArk = (v: string) => (v.startsWith('tree:') ? v.slice(5) : undefined)
const fromArkAll = (values: readonly string[]) => values.flatMap((v) => fromArk(v) ?? [])

function toInner(node: TreeViewNode): Inner {
  const inner: Inner = { id: toArk(node.value), label: node.label, source: node }
  if (node.children !== undefined) inner.children = node.children.map(toInner)
  return inner
}

function Node({ node, indexPath }: { node: Inner; indexPath: number[] }) {
  const { source } = node
  const icon = source.icon === undefined ? null : <Icon aria-hidden="true">{source.icon}</Icon>
  const trailing = source.trailing === undefined ? null : <Trailing>{source.trailing}</Trailing>
  const caption = source.caption === undefined ? null : <Caption>{source.caption}</Caption>
  return (
    <ArkTreeView.NodeProvider node={node} indexPath={indexPath}>
      {node.children === undefined ? (
        <Item>
          {icon}
          <ItemText>{node.label}</ItemText>
          {trailing}
          {caption}
        </Item>
      ) : (
        <Branch>
          <BranchControl>
            <BranchIndicator aria-hidden="true">
              <ChevronDownIcon size="14" />
            </BranchIndicator>
            {icon}
            <BranchText>{node.label}</BranchText>
            {trailing}
            {caption}
          </BranchControl>
          <BranchContent>
            {node.children.map((child, i) => (
              <Node key={child.id} node={child} indexPath={[...indexPath, i]} />
            ))}
          </BranchContent>
        </Branch>
      )}
    </ArkTreeView.NodeProvider>
  )
}

/**
 * A tree of nodes that open and close, such as folders and files. The
 * arrow keys move between rows (Right opens a branch, Left closes it or
 * moves to its parent), Home and End go to the first and last row, and
 * Enter or a click selects a row and opens or closes a branch.
 */
export function TreeView({ label, nodes, selected, defaultSelected, onSelect, expanded, defaultExpanded, onExpandedChange }: TreeViewProps) {
  const collection = useMemo(
    () =>
      createTreeCollection<Inner>({
        rootNode: { id: 'tree:', label: '', source: { value: '', label: '' }, children: nodes.map(toInner) },
        nodeToValue: (n) => n.id,
        nodeToString: (n) => n.label,
        isNodeDisabled: (n) => n.source.disabled === true,
      }),
    [nodes],
  )
  const top = collection.rootNode.children ?? []
  return (
    <Root
      collection={collection}
      selectionMode="single"
      {...(selected === undefined ? {} : { selectedValue: [toArk(selected)] })}
      {...(defaultSelected === undefined ? {} : { defaultSelectedValue: [toArk(defaultSelected)] })}
      {...(expanded === undefined ? {} : { expandedValue: expanded.map(toArk) })}
      {...(defaultExpanded === undefined ? {} : { defaultExpandedValue: defaultExpanded.map(toArk) })}
      onSelectionChange={(details) => {
        const [value] = fromArkAll(details.selectedValue)
        if (value !== undefined) onSelect?.(value)
      }}
      onExpandedChange={(details) => {
        onExpandedChange?.(fromArkAll(details.expandedValue))
      }}
    >
      <Label>{label}</Label>
      <Tree>
        {top.map((node, i) => (
          <Node key={node.id} node={node} indexPath={[i]} />
        ))}
      </Tree>
    </Root>
  )
}
