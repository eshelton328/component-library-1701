# pages

Example pages as stories, put together from the library with sample
content. Their titles start with `Examples/`. Nothing imports these files,
and `../index.ts` never exports them.

- A page may import any tier, but not `@ark-ui/react` and not Panda
  patterns (`../structure.ts`). It uses the components as the-bridge will.
- Sample content is a constant in the story file. A page never fetches
  or stores data (d-068).
