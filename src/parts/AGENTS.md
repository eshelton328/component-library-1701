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
- `collapsed` draws the stacked composer as one row (attach, text, Send)
  in the same DOM, so the text area never remounts and keeps the focus
  and caret as the caller expands it from `onFocusChange(true)`.
  Attachments keep it expanded (`CollapsedPhone` and
  `CollapsedExpandOnFocusPhone` stories, screen review R31).
- Loading (the loading standard, 2026-11-23): `Skeleton` draws a line,
  block or circle; a line takes the text style it sits in, so it has the
  height of the text that replaces it. `ListRow`, `Card` and
  `GroupHeader` take `loading`; the presets in `skeleton-rows.tsx` are
  those parts with skeletons in their slots. Each preset's story stands it
  beside the part it stands for and checks that both have the same height
  (`skeleton.stories.tsx`); add such a pair for a new preset.
- The shimmer is one band for the page (screen review R65): the fill is
  sized in viewport units and placed from the bar's own left, which
  `Skeleton` writes to `--skeleton-x` when its shimmer starts (also
  when a hidden bar is shown), on a window resize and when a box that
  holds it resizes; every shimmer starts at time 0 of the document
  timeline. Nothing runs per frame. A part that draws its own placeholder uses `Skeleton`,
  never the recipe alone, or its band is out of step (`SharedBand`
  stories).
- `Message from="peer"` is a message that another chat sent (the-bridge
  R55; the owner asked for "a yellow background or text to show that it's not
  from me"): no bubble, an amber start bar and "From <name>" with the chat
  icon. It uses `status.needsYou.fg` because the library has one amber
  today, for "not from you" and "needs you", and that token's contrast
  entries already cover it. A later peer token changes only the `peer`
  variant in `theme/recipes/message.ts` (`PeerDark` and `PeerLight`
  stories check the bar, the label and the contrast).
- `Callout` is GitHub's Markdown alert (`> [!NOTE]`): five tones, each
  with its own `callout.<tone>.fg` and `.border` tokens (the owner,
  2026-11-25: they "should be able to change with a change in theme"),
  today with the values of the status token of the same hue. It has no
  fill, so its text stays on the surface that contrast.json checks.
- `DiagramFrame` holds a diagram drawn from text, such as a Mermaid
  block: the caller draws the diagram (as an `img`) and runs the engine;
  the frame shows a skeleton, the diagram or the reason and source, and
  a "Show source" toggle. Its body takes the focus, so a wide diagram
  scrolls with the arrow keys, as the Table frame does.
- `ImageFigure` is an image in a Markdown message: the picture at its own
  size up to the column's width, a button that opens it in a `wide`
  Dialog, a skeleton while it loads and a line with its text alternative
  when it does not load. It loads only the `src` it gets; the caller
  decides which URLs may load.
- `MentionChip` never breaks over two lines (the-bridge R75): it is one
  inline flex box with its name in `TruncatedText`, so at a line end it
  moves to the next line whole and a name wider than the column ends with
  an ellipsis (`MentionLineEnd` and `MentionLongName` stories). Its
  box is 4 px shorter than the line, with a 2 px block margin, so its line
  is no taller than the text and a chip on the next line keeps a gap
  (`MentionAdjacentLines`, the Design System gate's no-touching-boxes).
  `FileChip` stays inline and wraps.
- Pure geometry may sit in a `.ts` file beside its part. `../index.ts`
  does not export it, and the part's stories test what it draws.
- The Table parts (`table.tsx`) work as react-markdown overrides for
  `table` to `td`: they drop react-markdown's `node` prop and turn GFM
  alignment (`style.textAlign` or `align`) into the recipe's `data-align`,
  never an inline style. MarkdownView styles the other GFM elements
  (`del`, task list items); it draws no table itself.
- `MarkdownCodeBlock` is a fenced code block for a react-markdown `pre`
  override inside a MarkdownView: the language and `onCopy`'s button in
  its head, one line each with sideways scroll, CodeLines' `segments`, a
  diff's line tints, and a fold after `fold` lines (default 20). It
  parses no code and copies nothing itself; MarkdownView's own `pre`
  style skips its body (`markdown-code-block.stories.tsx`).
- `Pager` is controlled: it shows `page` (from 1) and reports Previous,
  Next and the Rows picker through `onPageChange` and
  `onPageSizeChange`; the caller sets the page after a size change. The
  page picks `size` (`desktop`, `tablet`, `phone`), never a window
  measure; `phone` draws no Rows picker.
