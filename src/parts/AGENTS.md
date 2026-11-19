# parts

The Parts tier: the domain components. Storybook and Figma show them
under their purpose group, never under "Parts" (d-065).

- Import only from `foundations/`, `controls/` and other parts. Never
  import `@ark-ui/react`; use the control that wraps the Ark part.
- A part shows the data it gets as props and reports through callbacks;
  the composer calls `onSubmit` and sends nothing (d-068, d-069).
- Pure geometry may sit in a `.ts` file beside its part. `../index.ts`
  does not export it, and the part's stories test what it draws.
