import { createContext, useContext, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// The layer of the overlay a part renders in, or `undefined` on the page.
const LayerContext = createContext<HTMLElement | undefined>(undefined)

// No portal on the server or in the render that hydrates its HTML, as Ark's Portal does: a mismatch throws the
// server's HTML away with any text typed before hydration. A client-only render has the portal at once.
const noStore = () => () => undefined
const useServerPass = () =>
  useSyncExternalStore(
    noStore,
    () => false,
    () => true,
  )

type Layer = { root: HTMLElement; parts: HTMLElement }

function createLayer(doc: Document): Layer {
  const root = doc.createElement('div')
  root.setAttribute('data-overlay-layer', '')
  const parts = doc.createElement('div')
  parts.setAttribute('data-overlay-parts', '')
  root.append(parts)
  return { root, parts }
}

/**
 * Portals an overlay's parts into a layer of its own. A page-level layer goes at the end of `<body>`; a layer opened
 * inside another overlay goes at the end of that overlay's layer, so it paints on top by document order, with no
 * z-index (without it, a dialog covered the menu opened from it: the-bridge Artifacts D5). A nested layer is in the
 * document only while its parts render something, so a dialog that opens hides no empty layer from assistive
 * technology. The layer boxes have no style: they hold only fixed and absolute boxes.
 */
export function OverlayPortal({ children }: { children: ReactNode }) {
  const parent = useContext(LayerContext)
  const [layer] = useState(() => (typeof document === 'undefined' ? null : createLayer(document)))
  const runs = useRef(0)
  const serverPass = useServerPass()
  useLayoutEffect(() => {
    if (layer === null) return undefined
    runs.current += 1
    const run = runs.current
    const { root, parts } = layer
    const leave = () => {
      // Strict Mode reruns the effect in the same commit: the layer leaves only when the effect does not come back.
      queueMicrotask(() => {
        if (runs.current === run) root.remove()
      })
    }
    const host = parent ?? root.ownerDocument.body
    // A layer goes to the end of its host when its overlay opens, so the overlay opened last is on top whatever the
    // mount order. Only a part or its box counts: an open submenu row deeper down does not move its menu.
    let open = false
    const place = () => {
      if (parent !== undefined && parts.childElementCount === 0) {
        root.remove()
        open = false
        return
      }
      const opened = parts.querySelector(':scope > [data-state="open"], :scope > * > [data-state="open"]') !== null
      if (root.parentNode !== host || (opened && !open && host.lastElementChild !== root)) host.append(root)
      open = opened
    }
    // The parent's layer exists from its first render, so a part that appears in its commit lands after its parts.
    place()
    const watch = new MutationObserver(place)
    watch.observe(parts, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state'] })
    return () => {
      watch.disconnect()
      leave()
    }
  }, [layer, parent])
  if (layer === null || serverPass) return null
  return <LayerContext.Provider value={layer.root}>{createPortal(children, layer.parts)}</LayerContext.Provider>
}
