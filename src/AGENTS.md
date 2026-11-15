# src

The library's source. `structure.ts` lists the code tiers, the purpose
groups and the bans that the lint reads. Read it before you add a file.

| Folder | What it holds |
| --- | --- |
| `foundations/` | Token and icon pages; a tier that imports nothing else in `src/` |
| `controls/` | One Ark part or one element each, and the layout components |
| `parts/` | Domain components |
| `shell/` | The page frame and its panes |
| `pages/` | Example pages as stories; never exported |
| `theme/` | The config recipe of each component; not a tier |

## Rules

- A file sits in the tier that its imports allow (d-064). The lint
  (`structure/tier-imports` in `../eslint.structure.js`) resolves each
  relative import, re-export and dynamic import to its folder, so the
  spelling of a path does not matter, and names the allowed tiers. A
  tier may import files in its own folder. No file imports the `src`
  barrel (`index.ts`); a tier folder such as `../controls` is that tier.
  A dynamic import needs a static path, and may not load a restricted
  module such as a Panda pattern.
- Component styles are config recipes in `theme/recipes/` (d-067).
  Components in `controls/`, `parts/` and `shell/` use no `css()`,
  `cva()` or `sva()`; they connect Ark parts to the generated recipe with
  `createSlotRecipeContext`, or use `styled(element, recipe)`. The lint
  (`structure/no-inline-recipe`) rejects an object literal as the recipe,
  also through a renamed `styled` or a local const, and rejects
  `@pandacss/dev` there. Story and
  foundation files may use `css()` for their own frames.
- Use tokens only. The lint rejects raw values, `'[...]'` values, opacity
  modifiers, primitive tokens where a semantic token exists, and inline
  `style` props. Use a text style (`textStyle: 'body'`), not `fontSize`
  alone.
- Place components with the layout components in `controls/` (d-066).
  No file uses Panda's `Box`, `Spacer` or other free-form patterns, from
  the barrel or a deep path, as a component or as a pattern function.
- No smart components (d-068, d-069). Components take data as props and
  report through callbacks. Ark keeps its own interaction state, and each
  state has a controlled prop pair. No fetch, storage, router, URL or
  state library, or a subpath of one; the lint blocks them.
- `fg.subtle` is allowed only on the surfaces its description names. On
  `surface.raised` or `surface.selected`, use `fg.muted`.
- If a design needs a value that no token has, stop and name the missing
  token in your reply (d-050).

## Stories

- A story title starts with its purpose group from `structure.ts`, for
  example `Actions/Button` or `Data display/List row`, never with a tier
  name (d-065). The lint (`structure/story-title`) checks the `title` of
  the default export in `.stories.ts` and `.stories.tsx`, whatever its
  variable is called. It needs a plain `title` key: with no title, or a
  quoted `'title'` key, Storybook names the story after its tier folder. The sidebar
  follows that order.
- A story that shows colours or text exports a `Dark` and a `Light` story
  (`globals: { mode: 'dark' }`), so the axe test checks both modes.

## Public API

`index.ts` exports Controls, Parts and Shell; their props and recipe
variants are the contract. A removed or renamed prop or variant is a
breaking change (d-063): deprecate it in a minor version first, then
remove it with a `!` commit and a migration footer.

## Folders

- [controls/AGENTS.md](controls/AGENTS.md): read before adding a control or
  a layout component.
- [parts/AGENTS.md](parts/AGENTS.md): read before adding a domain
  component.
- [shell/AGENTS.md](shell/AGENTS.md): read before changing the page frame.
- [pages/AGENTS.md](pages/AGENTS.md): read before adding an example page.
- [theme/AGENTS.md](theme/AGENTS.md): read before writing a recipe.
