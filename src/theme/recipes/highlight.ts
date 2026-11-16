import { defineRecipe } from '@pandacss/dev'

// The match of a search query inside a text: Artifacts D4 (403:8232, the
// title "Skill eval pass rates", and 403:8264, its description) draws the
// match "eval" in #5ee1ff (fg.accent), Geist SemiBold and underlined, with
// no fill; Inbox D10 (346:4030), T10 and M14 mark the match "f-005" the same
// way. The mark keeps the size and line height of the text around it. A
// `<mark>` has a yellow fill and black text by default, so both are reset.
export const highlight = defineRecipe({
  className: 'highlight',
  jsx: ['Highlight', 'TruncatedText', 'ListRow'],
  staticCss: ['*'],
  base: {
    bg: 'transparent',
    color: 'fg.accent',
    // The library has no weight token outside the text styles; SemiBold 600 is the weight of text.heading.
    fontWeight: 'text.heading',
    textDecoration: 'underline',
  },
})
