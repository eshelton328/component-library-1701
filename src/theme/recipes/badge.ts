import { defineSlotRecipe } from '@pandacss/dev'

// The small badges of the Toolkit and Artifacts pages, with an optional
// icon before the label. `variant` picks the build and `tone` the status
// colour of the text and icon:
// - `pill`: a status tint, no border, the pill text style. New 403:450 and
//   402:15454 (cyan, `working`), "43 of 43 pass" 492:2167 (`done`), Running
//   479:14 (`running`). Figma padding 7-8 / 3 and gap 5 take 8 / 4 and 6,
//   the larger of each pair of tokens (d-072), so the pill is 24 high.
//   `size="sm"` pads it 8 / 2 for Figma's 20 px pills of the Inbox
//   (Recommended T2 346:5764, T3 346:5976; Working T5 346:6381): the 16 px
//   pill line and 2 above and below. The other variants have one size.
// - `tag`: a status tint in a radius.sm box, mono text. Loop 460:59; Figma
//   tints it at 0.12, which the inventory merges into the 0.14 status tint,
//   and draws radius 5, which it merges into radius.sm. Padding 6 / 2, gap 4.
// - `outline`: surface.overlay with a border.default border, mono text.
//   "uses · link.sh" 495:546. Padding 6 / 2; gap 5 takes 6 (d-072).
// - `quiet`: a bordered surface.overlay pill with fg.muted text in the
//   small text style, whatever the tone. The read-only pill 425:12; Figma
//   padding 10 / 5 takes 10 / 6 (d-072).
export const badge = defineSlotRecipe({
  className: 'badge',
  jsx: ['Badge'],
  staticCss: ['*'],
  slots: ['root', 'icon'],
  base: {
    root: {
      display: 'inline-flex',
      alignItems: 'center',
      flexShrink: '0',
      whiteSpace: 'nowrap',
      borderStyle: 'solid',
      borderWidth: 'default',
      borderColor: 'transparent',
    },
    // The icon recipe's size variant wins over a slot rule, so the caller
    // sizes the icon: 12 (Figma 9-11, and 13 in `quiet`).
    icon: { display: 'inline-flex', flexShrink: '0' },
  },
  variants: {
    variant: {
      pill: { root: { gap: '6', px: '8', py: '4', borderWidth: '0', borderRadius: 'full', textStyle: 'pill' } },
      tag: { root: { gap: '4', px: '6', py: '2', borderWidth: '0', borderRadius: 'sm', textStyle: 'mono' } },
      outline: { root: { gap: '6', px: '6', py: '2', borderColor: 'border.default', borderRadius: 'sm', textStyle: 'mono' } },
      quiet: { root: { gap: '6', px: '10', py: '6', borderColor: 'border.default', borderRadius: 'full', textStyle: 'small' } },
    },
    tone: {
      working: { root: { color: 'status.working.fg', bg: 'status.working.bg' } },
      running: { root: { color: 'status.running.fg', bg: 'status.running.bg' } },
      needsYou: { root: { color: 'status.needsYou.fg', bg: 'status.needsYou.bg' } },
      idle: { root: { color: 'status.idle.fg', bg: 'status.idle.bg' } },
      done: { root: { color: 'status.done.fg', bg: 'status.done.bg' } },
      danger: { root: { color: 'status.danger.fg', bg: 'status.danger.bg' } },
    },
    size: {
      md: {},
      sm: {},
    },
  },
  compoundVariants: [
    { variant: 'pill', size: 'sm', css: { root: { py: '2' } } },
    { variant: ['outline', 'quiet'], css: { root: { bg: 'surface.overlay' } } },
    { variant: 'quiet', css: { root: { color: 'fg.muted' } } },
  ],
  defaultVariants: { variant: 'pill', tone: 'idle', size: 'md' },
})
