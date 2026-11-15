# tokens

The design tokens, as DTCG JSON, and the build that checks them and writes
the Panda preset.

- `resolver.json` lists the themes and the modes. `layout.json` holds
  spacing and sizes, which no theme or mode can change (d-035).
- One file per theme in `themes/`. It holds a `dark` and a `light` group
  (colours and shadows), plus type, radii, border widths, blur and opacity.
  A token in one group must also be in the other. `modes/` picks a group
  with `$extends`.
- Write colours in object form (`colorSpace: "srgb"`, `components`,
  `alpha`, `hex`), with `hex` matching `components`.
- Every token needs a `$description` that says where to use it and where
  not to (d-050). A new token or a changed value needs Erik's approval.
- Run `pnpm tokens` after a change. It writes `generated/preset.ts` and
  `../src/foundations/colours.mdx`; never edit those by hand.
- `build.ts` holds the checks, `test.ts` the cases that prove them, and
  `contrast.json` the contrast pairs. Agents change these three only in a
  session started with `LIB_ALLOW_CHECK_EDITS=1`. A new check gets a case
  in `test.ts`.
