import { segmentGroupAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'

// The segmented view switch of Artifacts, Toolkit and Workbench (Grid or
// List; List, Map or Activity; Explain or Code). The pages drew it with and
// without icons; one recipe serves both (inconsistency 10).
//
// `size="lg"` is Toolkit's switch (D1 425:18, T1 428:12): 38 high in Figma,
// which takes control.lg (36, the nearest control token; d-100), with 30 px
// items inside the 1 px border and 2 px padding, as Figma's 4 px inset gives
// them. Figma's icons are 15 (`icon/list` 425:20, `icon/map` 425:24,
// `icon/chart` 457:9), so `lg` draws them at icon.16; `sm` and `md` keep 12.
//
// `tone="accent"` is Toolkit's selected look (`view · List` 425:19): the
// selected fill with no border, and the label and icon in fg.accent, as the
// nav rail's selected item. The items have no border, so each is 10 + icon +
// 6 + label + 10 wide, as Figma's (65 for List). `default` keeps the
// border.selected border and the fg.default label.
export const viewSwitch = defineSlotRecipe({
  className: 'view-switch',
  jsx: ['ViewSwitch'],
  staticCss: ['*'],
  slots: segmentGroupAnatomy.keys(),
  base: {
    root: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '2',
      p: '2',
      bg: 'surface.inset',
      borderRadius: 'md',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'border.default',
      // Ark disables each item too, and the items carry the opacity, so it is not applied twice.
      _disabled: { cursor: 'not-allowed' },
    },
    // Each item shows its own checked state, so the moving indicator is not drawn.
    indicator: { display: 'none' },
    item: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6',
      h: '100%',
      px: '10',
      borderRadius: 'sm',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'transparent',
      color: 'fg.muted',
      cursor: 'pointer',
      userSelect: 'none',
      // Each size sets the icon size: an important size here would beat the variant's.
      '& svg': { flexShrink: '0' },
      _checked: { bg: 'surface.selected', color: 'fg.default', borderColor: 'border.selected' },
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
      _disabled: { cursor: 'not-allowed', opacity: 'disabled' },
    },
    itemText: { textStyle: 'label', whiteSpace: 'nowrap' },
    itemControl: { display: 'none' },
  },
  variants: {
    size: {
      sm: { root: { h: 'control.sm' }, item: { '& svg': { width: 'icon.12!', height: 'icon.12!' } } },
      md: { root: { h: 'control.md' }, item: { '& svg': { width: 'icon.12!', height: 'icon.12!' } } },
      lg: { root: { h: 'control.lg' }, item: { '& svg': { width: 'icon.16!', height: 'icon.16!' } } },
    },
    tone: {
      default: {},
      accent: { item: { borderWidth: '0', _checked: { color: 'fg.accent' } } },
    },
  },
  defaultVariants: { size: 'md', tone: 'default' },
})
