// Puts back, before each story test, every browser state a story may change for itself: the DevTools emulations
// (media features such as prefers-reduced-motion, touch, safe-area insets, CPU speed) and the own properties a story
// puts on window or navigator in place of the browser's (matchMedia, visualViewport, virtualKeyboard,
// userActivation). A story still
// undoes its own changes in the cleanup that its beforeEach returns, but a story that times out never runs that
// cleanup, and the next story would start in its state. Only the story test runner (Vitest Browser Mode) has the
// DevTools session; the Storybook UI runs nothing here.

/** The properties a story may define in place of the browser's, with the browser's own descriptor from before any
 * story ran. Window keeps its members on the object itself, so a reset must put the descriptor back, not delete. */
const faked = ([
  [window, 'matchMedia'],
  [window, 'visualViewport'],
  [navigator, 'virtualKeyboard'],
  [navigator, 'userActivation'],
] as const).map(([target, key]) => ({ target, key, own: Object.getOwnPropertyDescriptor(target, key) }))

export async function resetStoryState(): Promise<void> {
  if (!('__vitest_browser__' in globalThis)) return
  for (const { target, key, own } of faked) {
    if (own) Object.defineProperty(target, key, own)
    else Reflect.deleteProperty(target, key)
  }
  const { cdp } = await import('vitest/browser')
  const session = cdp()
  await session.send('Emulation.setEmulatedMedia', { media: '', features: [] })
  await session.send('Emulation.setTouchEmulationEnabled', { enabled: false })
  await session.send('Emulation.setSafeAreaInsetsOverride', { insets: {} })
  await session.send('Emulation.setCPUThrottlingRate', { rate: 1 })
}
