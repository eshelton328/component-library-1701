# tokens

The design tokens, as DTCG JSON, and the build that checks them and writes
the Panda preset. `resolver.json` lists the themes and the modes.

- `layout.json` (spacing, sizes) and `motion.json` (durations, easings)
  hold what no theme or mode may change (d-035).
- Write colours in object form (`colorSpace: "srgb"`, `components`,
  `alpha`, `hex`), with `hex` matching `components`.
- Every token needs a `$description` that says where to use it and where
  not to (d-050). A new token or a changed value needs the owner's approval.
- Run `pnpm tokens` after a change. It writes `generated/preset.ts` and
  `../src/foundations/colours.mdx`; never edit those by hand.
- `build.ts` holds the checks, `test.ts` their cases and `contrast.json`
  the contrast pairs; they are guarded, like `resolver.json`. A new check
  gets a case in `test.ts`.

## Folders

- [themes/AGENTS.md](themes/AGENTS.md): read before adding a theme or a
  themed token.
- [modes/AGENTS.md](modes/AGENTS.md): read before adding a mode.
- [figma/AGENTS.md](figma/AGENTS.md): read before changing the Figma
  export or running the Figma token sync.
