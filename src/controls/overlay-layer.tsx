import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// The layer of the overlay a part renders in, or `undefined` on the page.
const LayerContext = createContext<HTMLElement | undefined>(undefined)

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
 * Portals an overlay's parts (its backdrop and positioner) into a layer of their own, so an overlay opened from
 * inside another one paints over it and a pointer reaches it. An overlay on the page has its layer at the end of
 * `<body>`, as Ark's `Portal` put its parts. An overlay inside another one (a menu, select, popover or tooltip in
 * a Dialog or BottomSheet, or a Dialog opened from a sheet) puts its layer at the end of that overlay's layer,
 * after the overlay's own parts. No overlay sets a z-index; the document order alone sets the stack.
 *
 * Without it, each overlay portalled to the end of `<body>` in the order React mounted them, and a child mounts
 * before its parent, so a dialog covered the menu opened from it (the-bridge Artifacts D5, Add a link).
 *
 * A layer inside another one is in the document only while its parts render something, as Ark adds a part only
 * when it renders: a layer that waited empty in a dialog's layer would be hidden from assistive technology when
 * the dialog opens, and a tooltip that opened in it later would stay hidden. So a modal dialog hides the same
 * elements as before: the parts that exist when it opens, except a menu that an expanded trigger controls. The
 * layer and its parts box are plain blocks with no style: they hold only fixed and absolute boxes, so they take
 * no space, clip nothing and make no stacking context or containing block.
 */
export function OverlayPortal({ children }: { children: ReactNode }) {
  const parent = useContext(LayerContext)
  const [layer] = useState(() => (typeof document === 'undefined' ? null : createLayer(document)))
  const runs = useRef(0)
  useLayoutEffect(() => {
    if (layer === null) return undefined
    runs.current += 1
    const run = runs.current
    const { root, parts } = layer
    const leave = () => {
      // Strict Mode runs this cleanup and then the effect again in the same commit. The layer leaves the document
      // only when the effect does not come back, so its parts never leave and come back.
      queueMicrotask(() => {
        if (runs.current === run) root.remove()
      })
    }
    const host = parent ?? root.ownerDocument.body
    // A layer goes to the end of its host when its overlay opens, so the overlay opened last is on top, whatever
    // order the overlays mounted in (a confirm dialog opened from a sibling dialog that mounted after it). Only a
    // part or its box counts: an open submenu row deeper down does not move its menu, which has the focus.
    let open = false
    const place = () => {
      // A layer inside another one leaves the document while it is empty (see above).
      if (parent !== undefined && parts.childElementCount === 0) {
        root.remove()
        open = false
        return
      }
      const opened = parts.querySelector(':scope > [data-state="open"], :scope > * > [data-state="open"]') !== null
      if (root.parentNode !== host || (opened && !open && host.lastElementChild !== root)) host.append(root)
      open = opened
    }
    // A child's effect runs before its parent's, but the parent's layer exists from its first render, so a part
    // that appears in the same commit as the parent's still lands in it, after the parent's parts.
    place()
    const watch = new MutationObserver(place)
    watch.observe(parts, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state'] })
    return () => {
      watch.disconnect()
      leave()
    }
  }, [layer, parent])
  if (layer === null) return null
  return <LayerContext.Provider value={layer.root}>{createPortal(children, layer.parts)}</LayerContext.Provider>
}
