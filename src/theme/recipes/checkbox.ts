import { checkboxAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'
import { focusRing } from './focus'

// The filter checks of Inbox (D4, T14) and Artifacts (D3): a checkbox with
// a label, checked or not, in groups. The box border is `border.control`, the
// checked box `accent.default` (inventory: `#8a97b8` at 0.7 and `#5ee1ff`).
// `trailing` sits at the end of the row, such as the count of each row in the
// Inbox Filter menu (D4 346:1747: Geist Mono 11 pushed to the end; `mono`,
// fg.muted, as the popover's labels on surface.overlay are).
// `labelStyle="mono"` sets the label in `mono`, as the project and tag rows
// of that menu are (346:1787 and 346:1824: Geist Mono 12); the kind rows
// keep `body`.
// `size="sm"` is the type of that menu: the kind labels are Geist Regular 12
// (346:1745, `small`) and the counts Geist Mono 11 (346:1747, `monoSm`). A
// mono label stays `mono` at both sizes: the project rows are Geist Mono 12
// (346:1787), as at the default size. The box stays 16 (346:1741). Figma's
// rows are 28 high, 2 apart (D4 346:1740 to 346:1748, T14 and M7 the same),
// so `sm` takes control.sm (28) as its minimum height, not control.md: with
// 32 px rows the menu was 52 px taller and covered the list under it.
// `tone="discuss"` fills a checked box in violet, as the new tasks a
// discussion proposes are (M21 402:7278, #9e8fff: accent.discuss); the
// check stays fg.onAccent, which passes 4.5:1 on it in both modes.
// `description` is a line under the label, aligned with it in the `text`
// column, such as the meta line of a new task in a discussion proposal
// (D17 403:2441, T20 402:11871: Geist Mono 11 on a 14 px line; `monoSm`,
// fg.muted). It is `mono` at `size="md"`, as `trailing` is. The column is
// centred on the box, as Figma centres the 16 px box on the two lines.
// `size="compact"` is the type of that new task (D17 403:2440, T20
// 402:11870, M21 402:7278): the title is Geist 13 on a 17 px line, which
// takes `bodySm` (Regular 13/20, d-100 rule 4: the nearest token with
// Figma's size and weight; `labelSm` is 13/16 but Medium), and the
// description and count `monoSm`. With the 2 px gap the label and
// description are 38 high (Figma's 17 + 3 + 14 = 34), so a box that pads
// them 6 inside a 1 px border is Figma's 52 (403:2435). The row is then
// taller than `control.md`, so the 32 px minimum touch height stays and
// does not add height.
// `labelTone="muted"` and `inline` draw "Also remove this task" under the
// new tasks of a discussion proposal (T20 402:11886, D17, M21): the row is
// 16 high (the 16 px box 402:11887 and the label 402:11889 in Geist 12/16,
// #8a97b8: `small` at `size="sm"`, fg.muted), with the label 8 after the
// box (35 to 59, less the 16 px box). `inline` drops the `control.md`
// minimum and sets that gap; a `::before` reaches 4 above and below the row,
// so the press area stays 24 high (WCAG 2.5.8) with no layout height.
export const checkbox = defineSlotRecipe({
  className: 'checkbox',
  jsx: ['Checkbox', 'CheckboxGroup'],
  staticCss: ['*'],
  slots: [...checkboxAnatomy.keys(), 'groupLabel', 'trailing', 'text', 'description'],
  base: {
    root: {
      display: 'flex',
      alignItems: 'center',
      gap: '10',
      minH: 'control.md',
      cursor: 'pointer',
      userSelect: 'none',
      _disabled: { cursor: 'not-allowed', opacity: 'disabled' },
    },
    control: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: '0',
      w: 'icon.16',
      h: 'icon.16',
      borderRadius: 'xs',
      borderWidth: 'strong',
      borderStyle: 'solid',
      borderColor: 'border.control',
      color: 'fg.onAccent',
      '& svg': { w: 'icon.12', h: 'icon.12' },
      _checked: { bg: 'accent.default', borderColor: 'accent.default' },
      _indeterminate: { bg: 'accent.default', borderColor: 'accent.default' },
      outline: 'none',
      [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
    },
    indicator: { display: 'inline-flex' },
    text: { display: 'flex', flexDirection: 'column', gap: '2', minW: '0' },
    label: { textStyle: 'body', color: 'fg.default' },
    description: { textStyle: 'mono', color: 'fg.muted' },
    trailing: { flexShrink: '0', ms: 'auto', textStyle: 'mono', color: 'fg.muted' },
    group: { display: 'flex', flexDirection: 'column', gap: '2' },
    groupLabel: { textStyle: 'small', color: 'fg.muted', pb: '4' },
  },
  variants: {
    labelStyle: {
      text: {},
      mono: { label: { textStyle: 'mono' } },
    },
    labelTone: {
      default: {},
      muted: { label: { color: 'fg.muted' } },
    },
    inline: {
      true: {
        root: {
          minH: 'auto',
          gap: '8',
          position: 'relative',
          _before: { content: '""', position: 'absolute', insetInline: '0', top: '-4', bottom: '-4' },
        },
      },
      false: {},
    },
    tone: {
      accent: {},
      discuss: {
        control: {
          _checked: { bg: 'accent.discuss', borderColor: 'accent.discuss' },
          _indeterminate: { bg: 'accent.discuss', borderColor: 'accent.discuss' },
        },
      },
    },
    size: {
      md: {},
      compact: { label: { textStyle: 'bodySm' }, trailing: { textStyle: 'monoSm' }, description: { textStyle: 'monoSm' } },
      sm: {
        root: { minH: 'control.sm' },
        label: { textStyle: 'small' },
        trailing: { textStyle: 'monoSm' },
        description: { textStyle: 'monoSm' },
      },
    },
  },
  compoundVariants: [
    { size: 'compact', labelStyle: 'mono', css: { label: { textStyle: 'mono' } } },
    { size: 'sm', labelStyle: 'mono', css: { label: { textStyle: 'mono' } } },
    // An inline row keeps no minimum height at the small size too.
    { size: 'sm', inline: true, css: { root: { minH: 'auto' } } },
  ],
  defaultVariants: { labelStyle: 'text', size: 'md', tone: 'accent', labelTone: 'default', inline: false },
})
