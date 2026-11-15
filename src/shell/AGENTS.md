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
