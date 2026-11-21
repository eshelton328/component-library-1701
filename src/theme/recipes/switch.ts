import { switchAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'

// The on/off switch of the Notifications setting (d-118): a row in the phone
// More drawer and a stacked switch at the end of the desktop nav rail. Figma
// has no such part (an owner-approved frame exception), so there are no node
// ids; the parts take the tokens of their nearest neighbours.
// The track is 36 x 20 (`control.lg` x `icon.20`, full radius) with a 16 px
// thumb (`icon.16`) 2 in from its ends; the thumb moves to the end when on,
// with no animation (the library has no general motion token). On, the track
// is `accent.default`, which keeps 3:1 against bg.canvas, surface.pane and
// surface.overlay (contrast.json) and on surface.chrome; off, it is
// `border.control`, the unchecked Checkbox's colour, which keeps 3.5:1 or more
// against surface.overlay and surface.chrome in both modes. The thumb is
// `fg.onAccent` in both states: 4.5:1 on accent.default (contrast.json) and
// 3.5:1 or more on the off track. The focus ring sits on the track, as the
// Checkbox's sits on its box.
// `layout="inline"` (the default) is a full-width row for the drawer: the
// label in `label` (Medium 14/20, fg.default), as the drawer's item titles,
// and the hint in `small` (fg.muted), as their descriptions, 2 apart; the
// track at the end. `layout="stacked"` fits the 64 px rail: the track centred
// over the label and the hint, both in `railLabel` (Medium 9/12, fg.muted) as
// the rail's idle item labels, centred and wrapping between words; the row
// pads 6 above and below, as the rail items do, with 4 between the track and
// the text. Both layouts are at least 44 px high (`control.xl`) for touch.
export const switchRecipe = defineSlotRecipe({
  className: 'switch',
  jsx: ['Switch'],
  staticCss: ['*'],
  slots: [...switchAnatomy.keys(), 'text', 'hint'],
  base: {
    root: {
      display: 'flex',
      alignItems: 'center',
      gap: '12',
      w: '100%',
      minH: 'control.xl',
      cursor: 'pointer',
      userSelect: 'none',
      _disabled: { cursor: 'not-allowed', opacity: 'disabled' },
    },
    control: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      flexShrink: '0',
      w: 'control.lg',
      h: 'icon.20',
      p: '2',
      borderRadius: 'full',
      bg: 'border.control',
      _checked: { justifyContent: 'flex-end', bg: 'accent.default' },
      outline: 'none',
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
    },
    thumb: { display: 'block', flexShrink: '0', w: 'icon.16', h: 'icon.16', borderRadius: 'full', bg: 'fg.onAccent' },
    text: { display: 'flex', flexDirection: 'column', gap: '2', flex: '1', minW: '0' },
    label: { textStyle: 'label', color: 'fg.default' },
    hint: { textStyle: 'small', color: 'fg.muted' },
  },
  variants: {
    layout: {
      inline: {},
      stacked: {
        root: { flexDirection: 'column', justifyContent: 'center', gap: '4', py: '6', textAlign: 'center' },
        text: { flex: 'none', alignItems: 'center', w: '100%', gap: '0' },
        label: { textStyle: 'railLabel', color: 'fg.muted', overflowWrap: 'anywhere' },
        hint: { textStyle: 'railLabel', color: 'fg.muted', overflowWrap: 'anywhere' },
      },
    },
  },
  defaultVariants: { layout: 'inline' },
})
