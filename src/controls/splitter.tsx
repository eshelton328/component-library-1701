import { Splitter as ArkSplitter, useSplitterContext } from '@ark-ui/react/splitter'
import type { ReactNode } from 'react'
import { createSlotRecipeContext } from '../../styled-system/jsx'
import { splitter } from '../../styled-system/recipes'

const { withProvider, withContext } = createSlotRecipeContext(splitter)
const Root = withProvider(ArkSplitter.Root, 'root')
const Panel = withContext(ArkSplitter.Panel, 'panel')
const Trigger = withContext(ArkSplitter.ResizeTrigger, 'resizeTrigger')
const Indicator = withContext(ArkSplitter.ResizeTriggerIndicator, 'resizeTriggerIndicator')

/** One panel of a splitter. */
export type SplitterPanel = {
  /** Unique within the splitter. Any string, colons included. */
  id: string
  content: ReactNode
  /** The smallest size, in percent of the splitter. 10 by default. */
  minSize?: number | undefined
}

export type SplitterProps = {
  /** `horizontal` (the default) puts the panels side by side; `vertical` stacks them. */
  orientation?: 'horizontal' | 'vertical' | undefined
  /** The panels, in order. One panel fills the splitter and has no handle. */
  panels: readonly SplitterPanel[]
  /** The sizes in percent, one for each panel. Set it with `onSizeChange` to control the splitter. */
  size?: readonly number[] | undefined
  /** The first sizes of an uncontrolled splitter. Equal shares by default. */
  defaultSize?: readonly number[] | undefined
  /** Called with the new sizes while the user drags a handle or moves it with the keyboard. */
  onSizeChange?: ((size: number[]) => void) | undefined
  /** The accessible name of each handle. "Resize" by default. */
  handleLabel?: string | undefined
}

// Ark names a handle "before:after" and splits that name at the colon, so
// the ids it sees must have none. encodeURIComponent turns ":" into "%3A"
// and keeps distinct ids distinct.
const arkId = (id: string) => encodeURIComponent(id)
const minOf = (p: SplitterPanel | undefined) => p?.minSize ?? 10

// Double-click shares the two panels beside a handle equally, within their
// minimum sizes, and leaves every other panel as it is.
function Handle({ before, after, panels, label }: { before: number; after: number; panels: readonly SplitterPanel[]; label: string }) {
  const api = useSplitterContext()
  const a = panels[before]
  const b = panels[after]
  if (a === undefined || b === undefined) return null
  return (
    <Trigger
      id={`${arkId(a.id)}:${arkId(b.id)}`}
      type="button"
      aria-label={label}
      onDoubleClick={() => {
        const sizes = api.getSizes()
        const sa = sizes[before]
        const sb = sizes[after]
        if (sa === undefined || sb === undefined) return
        const total = sa + sb
        const next = Math.min(Math.max(total / 2, minOf(a)), total - minOf(b))
        api.setSizes(sizes.map((s, i) => (i === before ? next : i === after ? total - next : s)))
      }}
    >
      <Indicator />
    </Trigger>
  )
}

/**
 * Panels with a resize handle between each pair. Drag a handle, or focus
 * it and use the arrow keys, Home and End; double-click it to share the
 * two panels' space equally. The sizes stay inside Ark and are
 * controllable with `size` and `onSizeChange` (d-069). Each panel keeps
 * its React state when panels are added, removed or reordered.
 */
export function Splitter({ orientation = 'horizontal', panels, size, defaultSize, onSizeChange, handleLabel = 'Resize' }: SplitterProps) {
  const equal = panels.map(() => 100 / panels.length)
  return (
    <Root
      orientation={orientation}
      panels={panels.map((p) => ({ id: arkId(p.id), minSize: minOf(p) }))}
      {...(size === undefined ? { defaultSize: [...(defaultSize ?? equal)] } : { size: [...size] })}
      onResize={(details) => onSizeChange?.(details.size)}
    >
      {panels.flatMap((p, i) => {
        const panel = (
          <Panel key={`panel:${p.id}`} id={arkId(p.id)}>
            {p.content}
          </Panel>
        )
        const next = panels[i + 1]
        return next === undefined
          ? [panel]
          : [panel, <Handle key={`handle:${p.id}:${next.id}`} before={i} after={i + 1} panels={panels} label={handleLabel} />]
      })}
    </Root>
  )
}
