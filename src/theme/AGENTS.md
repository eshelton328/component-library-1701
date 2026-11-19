# theme

The component styles (d-067, after Park UI's preset). `../../panda.config.ts`
adds the recipes and the keyframes to the Panda theme, and Panda generates
the typed recipe functions in `styled-system/recipes`. Tokens live in
[../../tokens/AGENTS.md](../../tokens/AGENTS.md), not here.

- Components never import this folder; they import the generated recipe.
- `keyframes.ts` holds the keyframes. A recipe names one in
  `animationName` and takes its duration and curve from the motion tokens
  (`durations`, `easings`), never a raw time or curve. Give the same part
  a `_motionReduce` style that only fades.

## Folders

- [recipes/AGENTS.md](recipes/AGENTS.md): read before writing or changing a
  recipe.
