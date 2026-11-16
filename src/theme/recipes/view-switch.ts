import { segmentGroupAnatomy } from '@ark-ui/react/anatomy'
import { defineSlotRecipe } from '@pandacss/dev'

// The segmented view switch of Artifacts, Toolkit and Workbench (Grid or
// List; List, Map or Activity; Explain or Code). The pages drew it with and
// without icons; one recipe serves both (inconsistency 10).
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
      h: 'full',
      px: '10',
      borderRadius: 'sm',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'transparent',
      color: 'fg.muted',
      cursor: 'pointer',
      userSelect: 'none',
      '& svg': { width: 'icon.14', height: 'icon.14', flexShrink: '0' },
      _checked: { bg: 'surface.selected', color: 'fg.default', borderColor: 'border.selected' },
      _focusVisible: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
      _disabled: { cursor: 'not-allowed', opacity: 'disabled' },
    },
    itemText: { textStyle: 'label', whiteSpace: 'nowrap' },
    itemControl: { display: 'none' },
  },
  variants: {
    size: {
      sm: { root: { h: 'control.sm' } },
      md: { root: { h: 'control.md' } },
      lg: { root: { h: 'control.lg' } },
    },
  },
  defaultVariants: { size: 'md' },
})
