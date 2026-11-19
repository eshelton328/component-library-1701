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
- `AppShell` calls `useInputModality()` from `../controls/input-modality.ts`
  on mount, so the pages' own blocks under `focusRing` get
  `data-focus-quiet` after a pointer press (screen review R16).
- Nav items come in as props; the shell does not read settings (d-038,
  d-068).
- `AppShell` is the App frame and the Pane layout in one component: it
  sits on the `Backdrop` and places the rail, list, detail, side and tab
  bar slots. The library has no breakpoint tokens, so the shell and
  `Container` take a `size` prop (`desktop`, `tablet`, `phone`) that the
  app picks; they never measure the window to pick a layout.
- The one thing `AppShell` reads from the window is `visualViewport`, in
  an effect: when an on-screen keyboard covers the layout and the browser
  does not resize it (iOS Safari), it sets `--app-shell-keyboard` on its
  root with `style.setProperty`, the measured runtime value of how far the
  keyboard covers the detail's bottom (the fit). The shell keeps its full
  height and nothing in the layout moves: the detail ends its scroll that
  far up (`--app-shell-detail-end`), and a `ScrollFrame` that is the
  detail's child moves its footer (the composer) up onto the keyboard
  with `translateY` and ends its body's view above it. The tab bar and
  the safe area stay under the keyboard; hiding them would move the
  layout as the keyboard opens and closes. The keyboard's top is the
  visible area's bottom, with the keyboard-free height
  `visualViewport.height * scale`, so Safari's focus zoom on a field
  under 16 px keeps the fit, and under a zoom the top stays at the last
  scale-1 `offsetTop`, moved only as far as the visible area needs. Where the browser resizes the
  layout, at a pinch zoom with no keyboard, or with no `visualViewport`,
  nothing is set. The fit applies only while a field that opens the
  keyboard has the focus (`editable` in `../controls/editable.ts`, shared
  with `ScrollFrame`): with none, the browser's bars that show and hide on
  a scroll also shrink the visual viewport, and the shell removes the property, so the page stays still. It
  listens to `focusin` and `focusout` on the document as well as the
  viewport's `resize` and `scroll`. A field taking the focus starts the
  fit at once; a `focusout` whose `relatedTarget` is another field keeps
  it. When the focus leaves the fields (to Send, or a blur), the fit stays
  until the next viewport `resize` or `scroll`, the keyboard closing, so
  the tap that took the focus lands on the button it pressed. With no
  such event the fit ends on its own (iOS standalone may report the
  keyboard's close late, in steps or never): one frame after the
  release (`pointerup` or `pointercancel`) of the press that took the
  focus, after its click, or 300 ms after a focusout with no pointer
  down; a field that takes the focus first cancels the end, and an end
  that comes while a pointer is down (a press on Send within the 300 ms)
  waits for that press's release and one frame, so its click lands
  first. The
  window's `resize`, `orientationchange` and `pageshow` and the
  document's `visibilitychange` count as such an event: they read the
  focus again and drop a fit that no focused field needs. Each fit also
  checks `editable(document.activeElement)`, not only the flag the focus
  events keep, because WebKit fires no `focusout` when the focused field
  is removed (a route change or a closed dialog, which the library does
  not see); the removed field then counts as not focused, and the shell
  never follows a later viewport shrink for it. Pages set nothing for the
  keyboard;
  the app's page needs `interactive-widget=resizes-content` in its
  viewport meta for Chrome on Android.
- The `AppShell` detail scrolls with no scroll bar and stops a scroll at
  its end, so the page never bounces (`scrollArea`,
  `../theme/AGENTS.md`); the `Backdrop`, a `Pane` body and the nav rail
  do too. The app's document does not scroll. A wheel, a trackpad, a
  touch drag and the keys still scroll the focused detail.
- The `AppShell` detail is an inline-size query container. A detail
  `Container` in it widens to `shell.detailWide` and centres itself
  when the detail is at least `shell.detailWideFrom` wide; an item or
  page `Container` then stops at `shell.itemWide` or `shell.pageWide`
  and centres itself.
- `DetailSplit` is the child of the detail for an open item with a side
  pane beside it (the Inbox and Artifacts discussions). The item keeps
  its content's width, the side takes the rest up to
  `shell.discussionPane`, and past that the item takes the rest. The
  Toolkit discussion uses the `AppShell` side slot (420), not this part.
- On a tablet or phone the tab bar sits below the pane, or over its
  bottom with `tabBarOverlay`, as Figma draws the phone pages. The
  detail then ends its scroll with the bar's height and sets
  `--app-shell-tab-bar-inset` and `--app-shell-tab-bar-spacer` for its
  direct child only; a `ScrollFrame` there reads them, so its footer and
  the end of its body sit above the bar. Pages set no padding for the bar.
  The overlaid tab bar slot is filled with `bg.canvas`, so the bar's
  `surface.chrome` lies over the canvas and the page does not show
  through it.
- The tab bar is in the shell's flow, or at the shell's bottom with the
  overlay, never `position: fixed`, so its bottom is the shell's bottom.
  `TabBar` is `shell.tabBar` (77) high with the home-indicator area, and
  grows only by the amount that `env(safe-area-inset-bottom)` is more
  than `shell.safeAreaBottom` (34). That height is defined once, as
  `tabBarHeight` in `../theme/recipes/tab-bar-height.ts`: the tab-bar
  recipe's height and the overlay's `--app-shell-tab-bar-inset` (the
  detail's end padding and scroll padding, and the `ScrollFrame` inset)
  both use it, so the shell keeps the bar's full height. The shell is
  always as tall as its parent, so a gap under the bar is the parent being shorter than the screen.
- With no tab bar (inside a chat), a tablet or phone `AppShell` keeps
  `shell.safeAreaBottom` clear under the pane for the home indicator.
  Pages set no padding for it.
- `ListPaneToggle` is the one open and close button of a list pane, such
  as the Workbench sidebar: a `sm` icon-only `Button` with the panel
  icon, pressed and `border.selected` while open. It is controlled
  (`open`, `onOpenChange`); the page keeps the state and passes one
  `label` for both states (such as "Workspace sidebar"), as `aria-pressed`
  tells the state, and `data-*` props go on the button.
