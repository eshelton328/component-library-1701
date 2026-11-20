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
- A control that acts on the focused field and must keep the keyboard
  open carries `data-keyboard-keep` (R19).
- Space under a docked footer comes from ScrollFrame `foot`, never a
  bottom padding on the frame (R21, `FooterFoot`).
- A mistake the shell finds at run time goes to `onDiagnostic`, and to
  the console only without it (audit L-8, `NestedFooterReported`).
- The dock's limit for a frame-by-frame keyboard grows with the frames it
  measured, and one gap does not end it; test a dock change on slow
  frames too (`FrameStepsSlow`, `FrameStepsJank`).
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
