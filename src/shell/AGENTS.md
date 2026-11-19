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
  far up (`--app-shell-detail-end`), as do a list or side pane beside
  it (a tablet's search results, `ListKeyboard`), and a `ScrollFrame` that is the
  detail's child moves its footer (the composer) up onto the keyboard
  with `translateY` and ends its body's view above it. Through the move,
  the line above the composer stays in place (R22): a body at its end
  stays at its end, and any other body scrolls by as much as its view
  shrinks or grows, except a body that holds the focused field. The body
  is the containing block of an absolute child, so that child never
  makes the `Backdrop` scroll. A `ScrollFrame`
  nested deeper does not dock; when the keyboard covers a field in its
  footer, AppShell warns once in the console (`NestedFooter`). The tab bar and
  the safe area stay under the keyboard; hiding them would move the
  layout as the keyboard opens and closes. The keyboard's top is the
  visible area's bottom, with the keyboard-free height
  `visualViewport.height * scale`, so Safari's focus zoom on a field
  under 16 px keeps the fit, and under a zoom the top stays at the last
  scale-1 `offsetTop`, moved only as far as the visible area needs. The
  dock moves for `durations.keyboard` (250 ms) on `easings.keyboard`,
  the iOS keyboard's curve, driven by the hook frame by frame from the
  token values; with
  `prefers-reduced-motion: reduce` it moves at once. On a touch screen
  with no VirtualKeyboard API (iOS), a field's focus starts the dock at
  once toward the expected keyboard: the last one measured in that
  orientation, or `sizes.shell.keyboard` (Figma's 380, Workbench M10
  147:97) on a first
  portrait open. A field that already has the focus when the shell
  mounts (a page that focuses its composer) starts the dock the same way.
  The measures live in `keyboard-measures.ts` for the page's life, so a
  shell that mounts on a new page expects the last measured keyboard. A new target in the first 70 % of a move's time keeps the move's end
  and curve, so a keyboard reported in the move makes one motion (R22);
  the limit is on the time, as the keyboard's curve is nine tenths done
  at 43 % of it. A keyboard step of 2
  px or less (a keyboard that rises frame by frame) keeps the move's end
  even late in it, and after the move it is followed at once, so the
  composer stays on the keyboard. Until the keyboard's
  measure settles (300 ms after its last resize, or 1 s with none), a
  smaller report holds the dock up as an early step of the rise when the
  expected keyboard was measured; against Figma's guess, a report of at
  least three quarters of it is the whole keyboard and is taken at once.
  The measure is kept for the next open. A layout that is still shorter
  than at the focus two frames later (a browser that resizes it for the
  keyboard, such as Firefox on Android) expects nothing again; iOS 18
  shortens it for about one frame as it reports the keyboard, and the
  shell fits again in each of those frames, so the measure stays. The fit
  reads the visible area's top and the detail's foot as they are with the
  document at its top, so the document scroll that iOS adds as it reports
  the keyboard, which the shell takes back, does not move the dock. A
  focus that moves to a field from an element that is not a field (the
  thread's body, a `data-keyboard-keep` control) starts the dock as a
  first focus does. At the focus, the shortfall the visible area had with
  no field focused (iOS's standalone app keeps it 68 px short after the
  first close) does not count as an open keyboard. Where the browser resizes the
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
- A tap outside the focused field closes the keyboard (R19): while a
  field that opens the keyboard has the focus, a touch or pen
  `pointerdown` in the shell (capture phase) whose target is not inside a
  field and not inside `[data-keyboard-keep]` blurs the field, and the
  click of that gesture is swallowed once (capture-phase `preventDefault`
  and `stopPropagation`), so the tap opens nothing; the swallow ends at
  that click, 100 ms after the release, at a `pointercancel` (a drag that
  scrolls) or 1 s after the press, so a later tap is never eaten. A tap
  on another field or its label moves the focus as always. A mouse
  changes nothing, and neither does a tap while no keyboard is docked
  (`--app-shell-keyboard` not set, as with a hardware keyboard). Put `data-keyboard-keep` on a control that
  acts on the field and must keep the keyboard: the `Composer` puts it on
  Send, Stop and Attach, and `SearchField` on Clear; a page puts it on a
  search's sort or filter. The blur comes while the press is down, so the
  dock waits for its release, as for Send.
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
