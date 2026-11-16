import { defineRecipe } from '@pandacss/dev'

// Rendered Markdown, as the Toolkit D3 file preview draws it ("rendered
// markdown" 427:284): padding 18 by 22 (no token: 20 by 24, d-072), the
// blocks 10 apart with no margins. h1 Geist SemiBold 20/29 #e6ecff (427:285,
// `title`); the subheading Medium 14/20 #e6ecff (427:287, `label`), used
// for h2 and h3; paragraphs and list items Regular 14/20 #8a97b8 (427:286,
// 427:288, `body`, fg.muted); a path line in Mono 14/20 #8a97b8 (427:290,
// `code`). Inline code, code blocks, links, quotes and tables are not
// drawn; see each rule below.
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
    '& strong': { fontWeight: 'semibold', color: 'fg.default' },
    // Inline code and code blocks are not drawn; they take the `code` style
    // of the path line, with no fill.
    '& code': { textStyle: 'code' },
    '& pre': { textStyle: 'code', whiteSpace: 'pre-wrap' },
    // Links are not drawn here; the inventory lists cyan for links.
    '& a': { color: 'fg.accent', textDecoration: 'underline' },
    '& a:focus-visible': { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
  },
})
