# shell

The Shell tier: the frame of every page. App frame, Pane layout, Split
panes, the nav rail, the phone tab bar, the page header, the back row, the
drawer and the confirm dialog. Storybook and Figma show them under
Layout, Navigation or Overlays (d-065, d-066).

- Import only from `foundations/`, `controls/` and other shell files, as
  App frame imports the nav rail. A shell component takes Parts as
  children or slot props, never by import.
- No `css()`, `cva()` or `sva()`; the styles live in `../theme/recipes/`
  (d-067).
- The shell is the same in every theme; a theme changes only its tokens
  and recipe skins (d-035).
- Nav items come in as props; the shell does not read settings (d-038,
  d-068).
- `AppShell` is the App frame and the Pane layout in one component: it
  sits on the `Backdrop` and places the rail, list, detail, side and tab
  bar slots. The library has no breakpoint tokens, so the shell and
  `Container` take a `size` prop (`desktop`, `tablet`, `phone`) that the
  app picks; they never measure the window to pick a layout.
- The one thing `AppShell` reads from the window is `visualViewport`, in
  an effect: when an on-screen keyboard covers the layout and the browser
  does not resize it (iOS Safari), it sets `--app-shell-visible-height`
  and `--app-shell-visible-top` on its root with `style.setProperty`, the
  measured runtime values, and the recipe caps and moves the root with
  them. The keyboard-free height is `visualViewport.height * scale`, so
  Safari's focus zoom on a field under 16 px keeps the fit, and under a
  zoom the top stays at the last scale-1 `offsetTop`, moved only as far as
  the shell must to cover the visible area. Where the browser resizes the
  layout, at a pinch zoom with no keyboard, or with no `visualViewport`,
  nothing is set. Pages set nothing for the keyboard;
  the app's page needs `interactive-widget=resizes-content` in its
  viewport meta for Chrome on Android.
- On a tablet or phone the tab bar sits below the pane, or over its
  bottom with `tabBarOverlay`, as Figma draws the phone pages. The
  detail then ends its scroll with the bar's height and sets
  `--app-shell-tab-bar-inset` and `--app-shell-tab-bar-spacer` for its
  direct child only; a `ScrollFrame` there reads them, so its footer and
  the end of its body sit above the bar. Pages set no padding for the bar.
  The overlaid tab bar slot is filled with `bg.canvas`, so the bar's
  `surface.chrome` lies over the canvas and the page does not show
  through it.
- With no tab bar (inside a chat), a tablet or phone `AppShell` keeps
  `shell.safeAreaBottom` clear under the pane for the home indicator.
  Pages set no padding for it.
- `ListPaneToggle` is the one open and close button of a list pane, such
  as the Workbench sidebar: a `sm` icon-only `Button` with the panel
  icon, pressed and `border.selected` while open. It is controlled
  (`open`, `onOpenChange`); the page keeps the state and passes one
  `label` for both states (such as "Workspace sidebar"), as `aria-pressed`
  tells the state, and `data-*` props go on the button.
