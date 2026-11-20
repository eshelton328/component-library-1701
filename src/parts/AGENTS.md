# parts

The Parts tier: the domain components. Storybook and Figma show them
under their purpose group, never under "Parts" (d-065).

- Import only from `foundations/`, `controls/` and other parts. Never
  import `@ark-ui/react`; use the control that wraps the Ark part.
- A part shows the data it gets as props and reports through callbacks;
  the composer calls `onSubmit` or `onSend` and sends nothing (d-068, d-069).
- With `onSend`, the composer keeps the draft until the send succeeds
  (`SendResult` stories in `composer.stories.tsx`).
- The composer uploads nothing: `onAddFiles` hands dropped or pasted
  files to the page, and the page shows each upload through an
  attachment's `status` and `progress` (`AttachmentStates` and `AddFiles`
  stories). A story that drops or pastes sends a `DragEvent` or
  `userEvent.paste` with a `DataTransfer`, and waits for the drop state:
  React renders a drag's state change after the event returns.
- With every attachment ready, Send and Enter submit `''` for a message of
  files alone; an `uploading` or `failed` file holds it (`FilesOnly`
  stories). `retry: false` takes Retry off one failed chip
  (`RetryPerFile` stories).
- Pure geometry may sit in a `.ts` file beside its part. `../index.ts`
  does not export it, and the part's stories test what it draws.