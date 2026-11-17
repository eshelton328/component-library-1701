// The `data-*` attributes an app sets on an overlay's box, such as a key its checks find the box by. Ark's own
// `data-scope`, `data-part` and `data-state` are left as Ark sets them.
const arkData = new Set(['data-scope', 'data-part', 'data-state'])

/** Picks the app's `data-*` attributes from the rest of a component's props. */
export const dataAttributesOf = (props: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(props).filter(([key, value]) => key.startsWith('data-') && !arkData.has(key) && value !== undefined))
