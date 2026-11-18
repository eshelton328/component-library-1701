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
  app picks; they never measure the window.
- On a tablet or phone the tab bar sits below the pane, or over its
  bottom with `tabBarOverlay`, as Figma draws the phone pages. The
  detail then ends its scroll with the bar's height and sets
  `--app-shell-tab-bar-inset` and `--app-shell-tab-bar-spacer` for its
  direct child only; a `ScrollFrame` there reads them, so its footer and
  the end of its body sit above the bar. Pages set no padding for the bar.
  The overlaid tab bar slot is filled with `bg.canvas`, so the bar's
  `surface.chrome` lies over the canvas and the page does not show
  through it.
