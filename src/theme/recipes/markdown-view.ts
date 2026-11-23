import { defineRecipe } from '@pandacss/dev'

// Rendered Markdown, as the Toolkit D3 file preview draws it ("rendered
// markdown" 427:284): padding 18 by 22 (no token: 20 by 24, d-072), the
// blocks 10 apart with no margins. h1 Geist SemiBold 20/29 #e6ecff (427:285,
// `title`); the subheading Medium 14/20 #e6ecff (427:287, `label`), used
// for h2 and h3; paragraphs and list items Regular 14/20 #8a97b8 (427:286,
// 427:288, `body`, fg.muted); a path line in Mono 14/20 #8a97b8 (427:290,
// `code`). Inline code, code blocks, links, quotes and tables are not
// drawn; see each rule below. A Markdown table renders with the Table part.
// `size="sm"` is the 13 px body text of the Inbox detail sections (D1
// 346:354, Geist Regular 13/20 #8a97b8, `bodySm`), with `labelSm` for the
// h2 to h6 subheadings. h1 and code keep their styles: no Figma frame draws
// them at this size.
// `padding="none"` drops the 20 by 24 padding, so the text sits flush in a
// box that sets its own, as an Inbox detail section does (D1 346:354: the
// body text starts at the section's edge).
export const markdownView = defineRecipe({
  className: 'markdown-view',
  jsx: ['MarkdownView'],
  staticCss: ['*'],
  base: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10',
    minW: '0',
    py: '20',
    px: '24',
    textStyle: 'body',
    color: 'fg.muted',
    overflowWrap: 'anywhere',
    '& :where(h1, h2, h3, h4, h5, h6, p, ul, ol, pre, blockquote)': { m: '0' },
    '& h1': { textStyle: 'title', color: 'fg.default' },
    '& :where(h2, h3, h4, h5, h6)': { textStyle: 'label', color: 'fg.default' },
    // Figma types "1. " into each item, with no indent; a real list keeps
    // its marker inside the text column and its items 10 apart.
    '& :where(ul, ol)': { display: 'flex', flexDirection: 'column', gap: '10', p: '0', listStylePosition: 'inside' },
    '& ul': { listStyleType: 'disc' },
    '& ol': { listStyleType: 'decimal' },
    '& :where(li) > :where(ul, ol)': { mt: '10', ps: '16' },
    // A loose list wraps each item in a paragraph. The first one stays on
    // the marker's line; later ones are blocks 10 below.
    '& :where(li) > p:first-child': { display: 'inline' },
    '& :where(li) > p:not(:first-child)': { mt: '10' },
    '& strong': { fontWeight: 'text.heading', color: 'fg.default' },
    // Inline code and code blocks are not drawn; they take the `code` style
    // of the path line, with no fill.
    '& code': { textStyle: 'code' },
    '& pre': { textStyle: 'code', whiteSpace: 'pre-wrap' },
    // Links are not drawn here; the inventory lists cyan for links.
    '& a': { color: 'fg.accent', textDecoration: 'underline' },
    '& a:focus-visible': { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
    // GFM (remark-gfm, R51). Strikethrough keeps the text colour with a line
    // through it. A task list item drops its marker and draws the disabled
    // checkbox the renderer writes in its place, 8 before the text, centred
    // on the first line and in the accent colour when checked. Autolinks are
    // plain `a` elements and take the link style above; the root's
    // overflow-wrap breaks a long URL. Tables are the Table part's.
    '& del': { textDecoration: 'line-through' },
    '& :where(li.task-list-item)': { listStyleType: 'none' },
    '& :where(li.task-list-item) > input[type=checkbox]': { m: '0', me: '8', verticalAlign: 'middle', accentColor: 'accent.default' },
  },
  variants: {
    size: {
      md: {},
      sm: { textStyle: 'bodySm', '& :where(h2, h3, h4, h5, h6)': { textStyle: 'labelSm' } },
    },
    padding: {
      default: {},
      none: { py: '0', px: '0' },
    },
  },
  defaultVariants: { size: 'md', padding: 'default' },
})
