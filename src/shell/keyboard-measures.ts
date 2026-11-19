// The on-screen keyboards that AppShell measured last, per orientation ('portrait' or 'landscape'), kept for the page's
// life: a shell that mounts again after a page change (the Inbox opening a chat, screen review R23) expects the
// keyboard it measured before, not Figma's guess. Not exported from the package; stories clear it between runs.
export const keyboardMeasures = new Map<string, number>()
