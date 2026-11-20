/**
 * Waits until Ark's dismissable layers take an outside click, after an overlay (popover, menu, dialog, sheet) opened
 * or closed. zag starts to track an opened layer one animation frame later and adds its outside pointerdown listener
 * in a `setTimeout(0)` after that (@zag-js/dismissable, @zag-js/interact-outside). After a close, it keeps the node in
 * `layerStack.recentlyRemoved` for two frames and reads every outside click in that time as a click in a nested
 * layer. Until both are done, an outside click is lost and the overlay stays open. On a loaded runner a frame can take
 * longer than a close, an open and a click (popover Behaviour, "expected <div data-scope=popover> to be null").
 * Our two frames start after zag's frames, and our task after its timer, so they end after them.
 */
export async function layerSettled(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve()
      })
    })
  })
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0)
  })
}
