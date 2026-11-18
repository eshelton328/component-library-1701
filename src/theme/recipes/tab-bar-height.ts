// The phone and tablet tab bar's height, defined once for the tab-bar
// recipe (the bar's own height) and the app-shell recipe (the overlay's
// --app-shell-tab-bar-inset, which sets the detail's end padding and
// scroll padding and which a ScrollFrame reads). It is sizes.shell.tabBar
// (77, home-indicator area included), grown by the amount that the
// device's env(safe-area-inset-bottom) is more than
// sizes.shell.safeAreaBottom (34). Where env() is 0 (Chromium, or a page
// with no viewport-fit=cover) it is 77. With a 48 px inset it is 91.
export const tabBarHeight = 'calc(token(sizes.shell.tabBar) + max(0px, env(safe-area-inset-bottom) - token(sizes.shell.safeAreaBottom)))'
