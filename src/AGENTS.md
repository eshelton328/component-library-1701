# src

The library's source. Each tier is a folder; `structure.ts` lists the
tiers, the purpose groups and the bans that the lint reads. Read it before
you add a file. `theme/` is not a tier.

## Rules

- A file sits in the tier its imports allow (d-064, d-071); the lint rule
  `structure/tier-imports` names the allowed tiers. No file imports the
  `index.ts` barrel, and `pnpm check:cycles` fails on an import cycle.
- Component styles are config recipes in `theme/recipes/` (d-067). Tier
  code uses no `css()`, `cva()` or `sva()` (`structure/no-inline-recipe`);
  only story and `foundations/` files may, for their own frames.
- Draw an icon once, in `foundations/icons.tsx`, on the 24 grid in
  `currentColor`; a component draws no inline `<svg>`.
- Use tokens only: no raw values, `'[...]'` values, opacity modifiers or
  inline `style` props. Use a text style (`textStyle: 'body'`), not
  `fontSize` alone. Never edit `foundations/colours.mdx`; `pnpm tokens`
  writes it.
- Place components with Container, Stack, Inline and Grid (d-066), never
  Panda's `Box`, `Spacer` or other free-form patterns.
- No smart components (d-068, d-069): data comes in as props and goes out
  through callbacks. No fetch, storage, router, URL or state library.
- Text that can be cut uses `TruncatedText` (`controls/tooltip.tsx`), with
  `lines` for two or three lines, never an ellipsis or a `Clamp`. Its
  story shows a long value and calls `expectCutText` in its play function.
- Content text that may wrap at the larger text sizes (d-131), such as a
  card's description, takes `TruncatedText grow`: Small keeps its
  ellipsis, Default and Large wrap it and the box grows. One-line chrome
  (a tab, a pane header, a tree row) never takes `grow`. Its
  `TextSizes` story calls `expectGrown` with the slots that grow.
- Chrome keeps the Small type at every text size (d-131): the tab bar,
  the nav rail, the page header's actions, the pane header, the workspace
  tabs and hint bar, and the map canvas set `data-text-fixed` on their root, which sets
  the type tokens back (`_textFixed` in the token build). Its
  `FixedTextSizes` story uses `fixedTypePlay`. Text there that sets no
  text style of its own inherits the page's size; give it one.
- `fg.subtle` only on the surfaces its description names; on
  `surface.raised` or `surface.selected`, use `fg.muted`.

## Stories

- A story title starts with its purpose group, such as `Actions/Button`,
  never a tier name (d-065, `structure/story-title`). Use a plain `title`
  key in the default export.
- A story that shows colours or text exports a `Dark` and a `Light`
  story (`globals: { mode: 'dark' }`), so the axe test checks both.
- A story that changes a DevTools emulation or puts its own `window` or
  `navigator` property adds it to `.storybook/story-reset.ts`, which puts
  it back before each story test, also after a timeout.
- Write a story's `tags` as a literal on its own object: Storybook reads
  tags without running the file, so a spread or a helper loses `!dev`
  (`pnpm check:story-tags`, review of #296).
- A part whose text must not be cut at the Default and Large text sizes
  (d-122) has a `<Name>TextSizes` Dark and Light pair that renders it at
  Small and checks Small is as before, then at the larger sizes with
  `atTextSize` and `textSpills` (`controls/text-size.testing.ts`);
  `brokenWords` for text that wraps (no word broken inside), and
  `shortFields` for a field (its line fits its height). The
  larger sizes change a recipe only under `_textDefault` and
  `_textLarge`, so Small stays the Figma frames' size.
- A play that moves a fake `visualViewport` takes it from `viewportPlay`,
  never from the global, so a play that timed out cannot move the next
  story's viewport (Keyboard Light, `expected 1654 to be 810`).

## Folders

- [controls/AGENTS.md](controls/AGENTS.md): read before changing a control
  or a layout component.
- [parts/AGENTS.md](parts/AGENTS.md): read before changing a domain
  component.
- [shell/AGENTS.md](shell/AGENTS.md): read before changing the page frame
  or the keyboard dock.
- [pages/AGENTS.md](pages/AGENTS.md): read before adding an example page.
- [theme/AGENTS.md](theme/AGENTS.md): read before writing a recipe.
