import { defineSlotRecipe } from '@pandacss/dev'

// A callout: the box that GitHub's alert syntax (`> [!NOTE]`) draws in
// Markdown. Figma has no frame of it. Each tone has its own callout.*
// tokens (the owner, 2026-11-25: "These should be able to change with a
// change in theme"), today with the values of the status tokens of the
// same hue, as GitHub draws them: note = status.working (cyan), tip =
// status.done (green), important = status.running (violet), warning =
// status.needsYou (amber), caution = status.danger (red). contrast.json
// checks each callout fg on the canvas, pane, raised and overlay. The
// title and icon take the tone's fg; the body keeps the text colour of the
// box it sits in, so a callout in a MarkdownView has its muted body text.
// The box has the tone's 1 px border and no fill, so the text stays on the
// surface whose contrast is checked.
// `size` follows MarkdownView: `md` draws the title in `label` and the
// body in `body`; `sm` in `labelSm` and `bodySm`.
export const callout = defineSlotRecipe({
  className: 'callout',
  jsx: ['Callout'],
  staticCss: ['*'],
  slots: ['root', 'header', 'title', 'body'],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8',
      minW: '0',
      py: '10',
      px: '12',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderRadius: 'xl',
    },
    header: { display: 'flex', alignItems: 'center', gap: '8', minW: '0' },
    title: { minW: '0', m: '0' },
    body: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10',
      minW: '0',
      '& > :where(p, ul, ol, pre, blockquote)': { m: '0' },
    },
  },
  variants: {
    tone: {
      note: { root: { borderColor: 'callout.note.border' }, header: { color: 'callout.note.fg' } },
      tip: { root: { borderColor: 'callout.tip.border' }, header: { color: 'callout.tip.fg' } },
      important: { root: { borderColor: 'callout.important.border' }, header: { color: 'callout.important.fg' } },
      warning: { root: { borderColor: 'callout.warning.border' }, header: { color: 'callout.warning.fg' } },
      caution: { root: { borderColor: 'callout.caution.border' }, header: { color: 'callout.caution.fg' } },
    },
    size: {
      md: { title: { textStyle: 'label' }, body: { textStyle: 'body' } },
      sm: { title: { textStyle: 'labelSm' }, body: { textStyle: 'bodySm' } },
    },
  },
  defaultVariants: { tone: 'note', size: 'md' },
})
