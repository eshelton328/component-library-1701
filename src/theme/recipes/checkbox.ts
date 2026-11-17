import { checkboxAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'

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
// (346:1787), as at the default size. The box stays 16 (346:1741).
// `tone="discuss"` fills a checked box in violet, as the new tasks a
// discussion proposes are (M21 402:7278, #9e8fff: accent.discuss); the
// check stays fg.onAccent, which passes 4.5:1 on it in both modes.
export const checkbox = defineSlotRecipe({
  className: 'checkbox',
  jsx: ['Checkbox', 'CheckboxGroup'],
  staticCss: ['*'],
  slots: [...checkboxAnatomy.keys(), 'groupLabel', 'trailing'],
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
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus', outlineOffset: '2' },
    },
    indicator: { display: 'inline-flex' },
    label: { textStyle: 'body', color: 'fg.default' },
    trailing: { flexShrink: '0', ms: 'auto', textStyle: 'mono', color: 'fg.muted' },
    group: { display: 'flex', flexDirection: 'column', gap: '2' },
    groupLabel: { textStyle: 'small', color: 'fg.muted', pb: '4' },
  },
  variants: {
    labelStyle: {
      text: {},
      mono: { label: { textStyle: 'mono' } },
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
      sm: { label: { textStyle: 'small' }, trailing: { textStyle: 'monoSm' } },
    },
  },
  compoundVariants: [{ size: 'sm', labelStyle: 'mono', css: { label: { textStyle: 'mono' } } }],
  defaultVariants: { labelStyle: 'text', size: 'md', tone: 'accent' },
})
