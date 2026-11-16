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
  /** Unique within the splitter; Ark names the handles after it. */
  id: string
  content: ReactNode
  /** The smallest size, in percent of the splitter. 10 by default. */
  minSize?: number | undefined
}

export type SplitterProps = {
  /** `horizontal` (the default) puts the panels side by side; `vertical` stacks them. */
  orientation?: 'horizontal' | 'vertical' | undefined
  /** Two or more panels, in order. */
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

// Double-click sets the two panels beside a handle to equal halves of their joint size.
function Handle({ id, before, after, label }: { id: `${string}:${string}`; before: number; after: number; label: string }) {
  const api = useSplitterContext()
  return (
    <Trigger
      id={id}
      aria-label={label}
      onDoubleClick={() => {
        const sizes = api.getSizes()
        const a = sizes[before]
        const b = sizes[after]
        if (a === undefined || b === undefined) return
        const half = (a + b) / 2
        api.setSizes(sizes.map((s, i) => (i === before || i === after ? half : s)))
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
 * controllable with `size` and `onSizeChange` (d-069).
 */
export function Splitter({ orientation = 'horizontal', panels, size, defaultSize, onSizeChange, handleLabel = 'Resize' }: SplitterProps) {
  const equal = panels.map(() => 100 / panels.length)
  return (
    <Root
      orientation={orientation}
      panels={panels.map((p) => ({ id: p.id, minSize: p.minSize ?? 10 }))}
      {...(size === undefined ? { defaultSize: [...(defaultSize ?? equal)] } : { size: [...size] })}
      onResize={(details) => onSizeChange?.(details.size)}
    >
      {panels.map((p, i) => {
        const next = panels[i + 1]
        return [
          <Panel key={p.id} id={p.id}>
            {p.content}
          </Panel>,
          next === undefined ? null : <Handle key={`${p.id}:${next.id}`} id={`${p.id}:${next.id}`} before={i} after={i + 1} label={handleLabel} />,
        ]
      })}
    </Root>
  )
}
