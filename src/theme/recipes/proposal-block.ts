import { defineSlotRecipe } from '@pandacss/dev'

// The block where an agent proposes a change and the user approves or
// denies it. Inbox D15 403:1450 (update) and D19 403:3402 (remove): fill
// rgba(23,33,58,0.7) (surface.inset), radius 12, padding 12, gap 12, a 1 px
// border in #9e8fff or #ff6b80 at 0.5; the eyebrow in Geist Mono 11 in the
// tone's colour; buttons 8 apart. Workbench D1 105:291 (approval): an amber
// card, fill #ffb86b at 0.08 (merged into the 0.14 status tint), border at
// 0.6 (status border 0.5), radius 10 (radius.lg, as the inventory lists the
// approval card), gap 8, the eyebrow in Geist Mono 10 (merged into eyebrow).
export const proposalBlock = defineSlotRecipe({
  className: 'proposal-block',
  jsx: ['ProposalBlock'],
  staticCss: ['*'],
  slots: ['root', 'label', 'title', 'body', 'note', 'actions'],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12',
      minW: '0',
      p: '12',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderRadius: 'xl',
      bg: 'surface.inset',
    },
    label: { textStyle: 'eyebrow', textTransform: 'uppercase', m: '0' },
    // D19 403:3407 and D1 105:293: Geist Medium 13, merged into `label`.
    title: { textStyle: 'label', color: 'fg.default', m: '0', overflowWrap: 'anywhere' },
    body: { display: 'flex', flexDirection: 'column', gap: '12', minW: '0', _empty: { display: 'none' } },
    // D19 403:3411: Geist Regular 11 in #8a97b8, merged into `small`.
    note: { textStyle: 'small', color: 'fg.muted', m: '0' },
    actions: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8' },
  },
  variants: {
    tone: {
      // An update: Inbox D15. The border is #9e8fff at 0.5, the value of status.running.border.
      update: { root: { borderColor: 'status.running.border' }, label: { color: 'accent.discuss' } },
      // A removal: Inbox D19. The title of the item it removes is struck through in fg.muted.
      remove: {
        root: { borderColor: 'status.danger.border' },
        label: { color: 'status.danger.fg' },
        title: { color: 'fg.muted', textDecoration: 'line-through' },
      },
      // A request to run something: Workbench D1.
      approval: {
        root: { gap: '8', borderRadius: 'lg', bg: 'status.needsYou.bg', borderColor: 'status.needsYou.border' },
        label: { color: 'status.needsYou.fg' },
        body: { gap: '8' },
      },
    },
  },
  defaultVariants: { tone: 'update' },
})
