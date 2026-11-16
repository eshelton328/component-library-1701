import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { css } from '../../styled-system/css'
import { TreeView, type TreeViewNode } from '../controls/tree-view'
import { CodeIcon } from '../foundations/icons'
import { FileTree, type FileTreeNode } from './file-tree'

const page = css({ bg: 'bg.canvas', p: '24' })
// The Toolkit file browser: a panel with the tree in a 330 px column (432:2141).
const browser = css({ w: 'shell.sidebar', bg: 'surface.overlay', borderWidth: 'default', borderStyle: 'solid', borderColor: 'border.default', borderRadius: 'xl', overflow: 'hidden' })

// The files of a skill, as Toolkit D6 draws them (432:2142).
const skill: FileTreeNode[] = [
  { path: 'SKILL.md', name: 'SKILL.md', caption: 'Instructions Claude reads first' },
  {
    path: 'references',
    name: 'references/',
    type: 'folder',
    count: 2,
    children: [
      { path: 'references/tokens.md', name: 'tokens.md' },
      { path: 'references/checklist.md', name: 'checklist.md' },
    ],
  },
  {
    path: 'scripts',
    name: 'scripts/',
    type: 'folder',
    count: 2,
    children: [
      { path: 'scripts/check-values.sh', name: 'check-values.sh', type: 'code' },
      { path: 'scripts/outline.py', name: 'outline.py', type: 'code' },
    ],
  },
  {
    path: 'evals',
    name: 'evals/',
    type: 'folder',
    children: [
      { path: 'evals/cases', name: 'cases/', type: 'folder', children: [{ path: 'evals/cases/one.md', name: 'one.md' }] },
      { path: 'evals/fixtures', name: 'fixtures/', type: 'folder' },
    ],
  },
]

const swatches = {
  well: css({ color: 'surface.well' }),
  selected: css({ color: 'surface.selected' }),
  selectedBorder: css({ color: 'border.selected' }),
  accent: css({ color: 'fg.accent' }),
  default: css({ color: 'fg.default' }),
  muted: css({ color: 'fg.muted' }),
}

function Swatches() {
  return (
    <div hidden>
      {Object.entries(swatches).map(([name, className]) => (
        <span key={name} data-swatch={name} className={className} />
      ))}
    </div>
  )
}

const swatch = (root: HTMLElement, name: string) => {
  const el = root.querySelector(`[data-swatch="${name}"]`)
  return el === null ? '' : getComputedStyle(el).color
}

function Tree() {
  return (
    <main className={page}>
      <div className={browser}>
        <FileTree nodes={skill} defaultExpanded={['references', 'scripts', 'evals', 'evals/cases']} defaultSelected="scripts/check-values.sh" />
      </div>
      <Swatches />
      <span hidden data-ref="code">
        <CodeIcon size="14" />
      </span>
    </main>
  )
}

const row = (canvasElement: HTMLElement, name: string): HTMLElement => {
  const item = within(canvasElement).getByRole('treeitem', { name: new RegExp(`^${name.replace('.', '\\.')}`) })
  // A branch's row is its control; a file's row is the item itself.
  const control = item.querySelector(':scope > .tree-view__branchControl')
  return control instanceof HTMLElement ? control : item
}

const iconOf = (el: HTMLElement) => {
  const svg = el.querySelector('.tree-view__icon svg')
  if (!(svg instanceof SVGSVGElement)) throw new Error('no icon')
  return svg
}

const textOf = (el: HTMLElement) => {
  const text = el.querySelector('.tree-view__itemText, .tree-view__branchText')
  if (!(text instanceof HTMLElement)) throw new Error('no text')
  return text
}

const meta = {
  title: 'Data display/File tree',
  component: Tree,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const tree = canvas.getByRole('tree', { name: 'Files' })
    const root = tree.parentElement
    if (root === null) throw new Error('no root')
    const rootStyle = getComputedStyle(root)
    // Column: padding 12 by 10 on surface.well (432:2142).
    await expect([rootStyle.paddingTop, rootStyle.paddingRight, rootStyle.paddingBottom, rootStyle.paddingLeft]).toEqual(['12px', '10px', '12px', '10px'])
    await expect(rootStyle.backgroundColor).toBe(swatch(canvasElement, 'well'))

    // File row: 27 high with the border, padding 8 at the start, radius 6, mono 12/17 (432:2161).
    const file = row(canvasElement, 'tokens.md')
    const fileStyle = getComputedStyle(file)
    await expect(file.getBoundingClientRect().height).toBe(27)
    await expect(fileStyle.borderTopLeftRadius).toBe('6px')
    await expect(fileStyle.borderTopColor).toBe('rgba(0, 0, 0, 0)')
    const text = getComputedStyle(textOf(file))
    await expect([text.fontSize, Math.round(Number.parseFloat(text.lineHeight)), text.fontWeight]).toEqual(['12px', 17, '400'])
    await expect(text.fontFamily).toContain('Geist Mono')
    await expect(fileStyle.color).toBe(swatch(canvasElement, 'default'))
    const icon = iconOf(file)
    await expect([icon.getBoundingClientRect().width, icon.getBoundingClientRect().height]).toEqual([14, 14])
    await expect(getComputedStyle(icon).stroke).toBe(swatch(canvasElement, 'muted'))
    await expect(textOf(file).getBoundingClientRect().left - icon.getBoundingClientRect().right).toBe(8)

    // A top-level row starts 8 in; each level below adds 16.
    const top = row(canvasElement, 'SKILL.md')
    await expect(getComputedStyle(top).paddingLeft).toBe('8px')
    await expect(fileStyle.paddingLeft).toBe('24px')
    await expect(getComputedStyle(row(canvasElement, 'one.md')).paddingLeft).toBe('40px')

    // Rows are 2 apart.
    const folder = row(canvasElement, 'references/')
    await expect(file.getBoundingClientRect().top - folder.getBoundingClientRect().bottom).toBe(2)

    // A folder row has a chevron, the folder icon and a muted count.
    await expect(folder.getBoundingClientRect().height).toBe(27)
    const count = folder.querySelector('.tree-view__trailing')
    if (!(count instanceof HTMLElement)) throw new Error('no count')
    await expect(count.textContent).toBe('2')
    await expect(getComputedStyle(count).color).toBe(swatch(canvasElement, 'muted'))
    await expect(folder.querySelectorAll('svg').length).toBe(2)

    // The caption under SKILL.md is small and muted (432:2149).
    const caption = top.querySelector('.tree-view__caption')
    if (!(caption instanceof HTMLElement)) throw new Error('no caption')
    const captionStyle = getComputedStyle(caption)
    await expect([captionStyle.fontSize, Math.round(Number.parseFloat(captionStyle.lineHeight))]).toEqual(['12px', 17])
    await expect(captionStyle.color).toBe(swatch(canvasElement, 'muted'))
    await expect(caption.getBoundingClientRect().left).toBe(textOf(top).getBoundingClientRect().left)

    // Selected row: surface.selected, a border.selected border and accent text and icon (432:2213).
    const selected = row(canvasElement, 'check-values.sh')
    const selectedStyle = getComputedStyle(selected)
    await expect(selected.getAttribute('aria-selected')).toBe('true')
    await expect(selected.getBoundingClientRect().height).toBe(27)
    await expect(selectedStyle.backgroundColor).toBe(swatch(canvasElement, 'selected'))
    await expect(selectedStyle.borderTopColor).toBe(swatch(canvasElement, 'selectedBorder'))
    await expect(selectedStyle.color).toBe(swatch(canvasElement, 'accent'))
    await expect(getComputedStyle(iconOf(selected)).stroke).toBe(swatch(canvasElement, 'accent'))

    // A script row draws the set's CodeIcon (432:2214) at 14 px: the same
    // paths as a reference CodeIcon, in fg.muted when not selected.
    const codeRef = canvasElement.querySelector('[data-ref="code"] svg')
    if (!(codeRef instanceof SVGSVGElement)) throw new Error('no code reference')
    const script = iconOf(row(canvasElement, 'outline.py'))
    await expect(script.innerHTML).toBe(codeRef.innerHTML)
    await expect(iconOf(selected).innerHTML).toBe(codeRef.innerHTML)
    await expect([script.getBoundingClientRect().width, script.getBoundingClientRect().height]).toEqual([14, 14])
    await expect(getComputedStyle(script).stroke).toBe(swatch(canvasElement, 'muted'))
    await expect(getComputedStyle(script).strokeWidth).toBe('2px')
  },
} satisfies Meta<typeof Tree>
export default meta

export const Dark: StoryObj<typeof meta> = { globals: { mode: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { mode: 'light' } }

const onSelect = fn<(path: string) => void>()
const onExpandedChange = fn<(paths: string[]) => void>()

function Controlled() {
  const [selected, setSelected] = useState<string | undefined>(undefined)
  const [expanded, setExpanded] = useState<string[]>(['references'])
  return (
    <main className={page}>
      <div className={browser}>
        <FileTree
          nodes={skill}
          selected={selected}
          onSelect={(path) => {
            setSelected(path)
            onSelect(path)
          }}
          expanded={expanded}
          onExpandedChange={(paths) => {
            setExpanded(paths)
            onExpandedChange(paths)
          }}
        />
      </div>
    </main>
  )
}

/** A click selects a file; the arrow keys move, open and close; Enter selects. */
export const Behaviour: StoryObj<typeof meta> = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    onSelect.mockClear()
    onExpandedChange.mockClear()
    const canvas = within(canvasElement)
    const item = (name: string) => canvas.getByRole('treeitem', { name: new RegExp(`^${name.replace('.', '\\.')}`) })

    // A click on a file selects it and reports its path.
    await userEvent.click(canvas.getByText('tokens.md'))
    await expect(onSelect).toHaveBeenLastCalledWith('references/tokens.md')
    await expect(item('tokens.md')).toHaveAttribute('aria-selected', 'true')

    // A closed folder hides its files and points its chevron right.
    const scripts = item('scripts/')
    await expect(scripts).toHaveAttribute('aria-expanded', 'false')
    await expect(canvas.queryByText('check-values.sh')).not.toBeVisible()
    const chevron = scripts.querySelector('.tree-view__branchIndicator')
    if (!(chevron instanceof HTMLElement)) throw new Error('no chevron')
    await expect(getComputedStyle(chevron).transform).not.toBe('none')

    // Down moves to the next row; Right opens a folder, Left closes it.
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(item('checklist.md')).toHaveFocus())
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(row(canvasElement, 'scripts/')).toHaveFocus())
    await userEvent.keyboard('{ArrowRight}')
    await expect(onExpandedChange).toHaveBeenLastCalledWith(['references', 'scripts'])
    await waitFor(() => expect(scripts).toHaveAttribute('aria-expanded', 'true'))
    await expect(canvas.getByText('check-values.sh')).toBeVisible()
    await expect(getComputedStyle(chevron).transform).toBe('none')

    // Enter on a file selects it.
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(item('check-values.sh')).toHaveFocus())
    await userEvent.keyboard('{Enter}')
    await expect(onSelect).toHaveBeenLastCalledWith('scripts/check-values.sh')
    await expect(item('check-values.sh')).toHaveAttribute('aria-selected', 'true')

    // Left on a file moves to its folder; Left again closes it.
    await userEvent.keyboard('{ArrowLeft}')
    await waitFor(() => expect(row(canvasElement, 'scripts/')).toHaveFocus())
    await userEvent.keyboard('{ArrowLeft}')
    await expect(onExpandedChange).toHaveBeenLastCalledWith(['references'])
    await waitFor(() => expect(scripts).toHaveAttribute('aria-expanded', 'false'))
  },
}

const onEdgeSelect = fn<(value: string) => void>()

const edgeNodes: TreeViewNode[] = [
  { value: '', label: 'Workspace' },
  { value: 'a', label: 'Alpha', caption: 'No icon, with a caption' },
  { value: 'blocked', label: 'Blocked', disabled: true },
  { value: 'b', label: 'Beta' },
]

function Edges() {
  const [selected, setSelected] = useState<string | null>('b')
  const [nodes, setNodes] = useState(edgeNodes)
  return (
    <main className={page}>
      <div className={browser}>
        <TreeView
          label="Edge cases"
          nodes={nodes}
          selected={selected}
          onSelect={(value) => {
            setSelected(value)
            onEdgeSelect(value)
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => {
          setSelected(null)
        }}
      >
        Clear selection
      </button>
      <button
        type="button"
        onClick={() => {
          setNodes((current) => current.filter((n) => n.value !== 'a'))
        }}
      >
        Remove Alpha
      </button>
    </main>
  )
}

/** An empty value, a disabled row, clearing the selection and removing the focused row. */
export const EdgeCases: StoryObj<typeof meta> = {
  render: () => <Edges />,
  play: async ({ canvasElement }) => {
    onEdgeSelect.mockClear()
    const canvas = within(canvasElement)
    const item = (name: string) => canvas.getByRole('treeitem', { name: new RegExp(`^${name}`) })

    // A node whose value is the empty string is a real row, and the first Tab stop.
    await expect(item('Workspace').tabIndex).toBe(0)
    await userEvent.click(canvas.getByText('Workspace'))
    await expect(onEdgeSelect).toHaveBeenLastCalledWith('')
    await expect(item('Workspace')).toHaveAttribute('aria-selected', 'true')

    // A disabled row is not selected by a click.
    await userEvent.click(canvas.getByText('Blocked'))
    await expect(onEdgeSelect).toHaveBeenCalledTimes(1)
    await expect(item('Blocked')).toHaveAttribute('aria-disabled', 'true')
    await expect(item('Blocked')).not.toHaveAttribute('aria-selected', 'true')

    // `null` clears a controlled selection.
    await userEvent.click(canvas.getByRole('button', { name: 'Clear selection' }))
    await expect(canvas.queryAllByRole('treeitem', { selected: true })).toHaveLength(0)

    // A caption sits under the label, also with no icon.
    const alpha = item('Alpha')
    const label = alpha.querySelector('.tree-view__itemText')
    const caption = alpha.querySelector('.tree-view__caption')
    if (!(label instanceof HTMLElement) || !(caption instanceof HTMLElement)) throw new Error('no caption')
    await expect(caption.getBoundingClientRect().left).toBe(label.getBoundingClientRect().left)
    await expect(caption.getBoundingClientRect().top).toBeGreaterThanOrEqual(label.getBoundingClientRect().bottom)

    // When the focused row is removed, Tab still reaches the tree.
    await userEvent.click(canvas.getByText('Alpha'))
    await waitFor(() => expect(item('Alpha')).toHaveFocus())
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Alpha' }))
    await expect(canvas.queryByText('Alpha')).toBeNull()
    const stops = canvas.getAllByRole('treeitem').filter((el) => el.tabIndex === 0)
    await expect(stops).toHaveLength(1)
  },
}
