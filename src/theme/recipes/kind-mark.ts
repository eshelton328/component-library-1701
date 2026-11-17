import { defineRecipe } from '@pandacss/dev'

// The Claude, Codex and shell marks that name who runs a chat or a step.
// Figma draws each mark at 13, 14, 16, 18 and 20 px with a 2 px stroke at
// every size; the library keeps 12 (for 13 and 14), 16 and 20, on the
// 4 px icon scale.
export const kindMark = defineRecipe({
  className: 'kind-mark',
  jsx: ['KindMark'],
  staticCss: ['*'],
  base: {
    display: 'inline-block',
    flexShrink: '0',
    verticalAlign: 'middle',
  },
  variants: {
    kind: {
      claude: { color: 'agent.claude' },
      codex: { color: 'agent.codex' },
      shell: { color: 'agent.shell' },
    },
    size: {
      '12': { w: 'icon.12', h: 'icon.12' },
      '16': { w: 'icon.16', h: 'icon.16' },
      '20': { w: 'icon.20', h: 'icon.20' },
    },
  },
  defaultVariants: { kind: 'claude', size: '16' },
})
