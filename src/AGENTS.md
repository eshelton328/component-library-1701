# src

The library's source: components, their recipes and stories, and the
foundation pages in `foundations/`.

- Style only with tokens, through `css()`, `cva()`, `sva()` or a recipe.
  The lint rejects raw values, `'[...]'` values, opacity modifiers,
  primitive tokens where a semantic token exists, and inline `style`
  props.
- Use a text style (`textStyle: 'body'`), not `fontSize` alone.
- `fg.subtle` is allowed only on the surfaces its description names. On
  `surface.raised` or `surface.selected`, use `fg.muted`.
- If a design needs a value that no token has, stop and name the missing
  token in your reply (d-050).
- A story that shows colours or text exports a `Dark` and a `Light` story
  (`globals: { mode: 'dark' }`), so the axe test checks both modes.
