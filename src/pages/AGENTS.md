# pages

Example pages as stories only: Inbox, Workbench, Artifacts and Toolkit
put together from the library with sample content, and the phone tab
bar in the `AppShell` on the iPhone screen (`phone-tab-bar.stories.tsx`).
Their titles start with `Examples/`. Nothing imports these files, and
`../index.ts` never exports them.

- A page may import any tier, but not `@ark-ui/react` and not Panda
  patterns. It uses the components as the-bridge will.
- Sample content is a constant in the story file. A page never fetches
  or stores data (d-068).
