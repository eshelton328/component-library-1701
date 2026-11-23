# shell

The Shell tier: the frame that every page sits in. Storybook and Figma
show it under Layout, Navigation or Overlays (d-065, d-066).

- Import only from `foundations/`, `controls/` and other shell files. A
  shell component takes Parts as children or slot props, never by import
  (`../structure.ts`).
- The shell is the same in every theme; a theme changes only tokens and
  recipe skins (d-035). Nav items come in as props; the shell reads no
  settings (d-038, d-068).
- The app picks the layout with the `size` prop. The shell never measures
  the window to pick a layout; it reads only `visualViewport`, for the
  keyboard dock.
- `AppShell` calls `useInputModality()` on mount, so a page's own block
  under `focusRing` gets `data-focus-quiet` after a press (R16).
- Before you change the keyboard dock, read the comments in
  `app-shell.tsx` and the stories in `app-shell.stories.tsx` and
  `../pages/phone-tab-bar.stories.tsx`; they guard R18, R19 and R22.
- Ask whether a field opens the keyboard with `editable` from
  `../controls/editable.ts`, which `ScrollFrame` shares. Check
  `document.activeElement` on each fit too: WebKit fires no `focusout`
  when the focused field is removed.
- The dock leaves a ScrollFrame body to the browser only while a field
  in it has the focus. A tap on the thread focuses the body itself, and
  the body must still keep the reader's place (`TapClosesKeyboard`).
- The dock follows the iOS keyboard on its clock, also with Reduce
  Motion: it rises with the viewport's first report (iOS reports once,
  as it first draws the keyboard), never at the focus, and falls from
  the focusout (R37, `KeyboardFollow`). Only a mouse with reduced
  motion jumps. Opening state (the expected keyboard for an early
  report) starts only on a page the user has pressed
  (`navigator.userActivation.hasBeenActive`, `LoadFocus`); a story that
  focuses a field with motion sets the activation it needs
  (`fakeActivation`).
- A control that acts on the focused field and must keep the keyboard
  open carries `data-keyboard-keep` (R19).
- Space under a docked footer comes from ScrollFrame `foot`, never a
  bottom padding on the frame (R21, `FooterFoot`).
- A mistake the shell finds at run time goes to `onDiagnostic`, and to
  the console only without it (audit L-8, `NestedFooterReported`).
- The dock's limit for a frame-by-frame keyboard grows with the frames it
  measured, and one gap does not end it; test a dock change on slow
  frames too (`FrameStepsSlow`, `FrameStepsJank`).
- A keyboard move is the compositor's (R39): transform animations started
  once per move, and no style, scroll or box change between its first and
  last frame (`DockFrameWork`). The layout changes only at a close's start
  and an open's end (`DockEdges`), and a turn starts from where the dock is
  drawn (`DockTurns`). A story reads the drawn dock from transforms and
  rects at the frame's `document.timeline` time (`drawnTime`), not
  `--app-shell-keyboard`: a busy frame draws a time from before it ran.
- Known gap: during a move a body keeps its larger layout, so its lines
  can paint under the drawn footer, between it and the keyboard (R44,
  iPad). It is not clipped: a `clip-path` animation repaints the body in
  each frame on iOS, and a clip by transforms around the body cost more
  frames over 20 ms on an iPhone close in the Simulator trace than no
  clip (R44 gate, 2026-11-23).
- A move animates a body's children that show at some shift of it, 0
  included (a child left out is drawn at its layout place), and a child
  that a scroll brings into view or a page adds during the move (R44,
  `DockEntries`).
- A page changes its layout for a keyboard move in `appShellDockEvent`
  (a composer that grows), never at the focus; a footer that changes its
  height during a move restarts the move from where it is drawn
  (`GrowOnDock`).
- Read a token as a number only through `css-values.ts`, which throws
  on a form it does not know (audit L-2, `MotionTokens` story).
- The tab bar stays in the shell's flow, never `position: fixed`. Its
  height is defined once, as `tabBarHeight` in
  `../theme/recipes/tab-bar-height.ts`.
- The `AppShell` root pads its sides by `env(safe-area-inset-*)`, read
  through `safeInset` in `../theme/recipes/tab-bar-height.ts`. A story or
  the design canvas sets `--app-shell-safe-<side>`, as `env()` is 0 in
  Chromium.
- Pages set nothing for the keyboard, the tab bar or the home indicator;
  the shell keeps that room.
- The `Backdrop` root has `isolation: isolate`, so a z-index inside the
  page stays under the overlays' layers, which come after it in
  `<body>` and set no z-index. Keep it; `LiftedOverPage` in
  `backdrop.stories.tsx` guards it.
