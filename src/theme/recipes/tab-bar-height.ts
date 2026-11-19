// The device's safe-area inset on one side: env(safe-area-inset-*), or the
// --app-shell-safe-* property where a story or the design canvas sets it,
// as env() is 0 in Chromium and on a page with no viewport-fit=cover.
export const safeInset = (side: 'top' | 'right' | 'bottom' | 'left'): string => `var(--app-shell-safe-${side}, env(safe-area-inset-${side}))`

// The phone and tablet tab bar's height, defined once for the tab-bar
// recipe (the bar's own height) and the app-shell recipe (the overlay's
// --app-shell-tab-bar-inset, which sets the detail's end padding and
// scroll padding and which a ScrollFrame reads). It is sizes.shell.tabBar
// (77, home-indicator area included), grown by the amount that the
// device's bottom inset is more than sizes.shell.safeAreaBottom (34).
// Where the inset is 0 it is 77. With a 48 px inset it is 91.
export const tabBarHeight = `calc(token(sizes.shell.tabBar) + max(0px, ${safeInset('bottom')} - token(sizes.shell.safeAreaBottom)))`
