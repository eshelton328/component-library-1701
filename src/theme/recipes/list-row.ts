import { defineSlotRecipe } from '@pandacss/dev'

// The list rows of Inbox (D1 346:195, 346:266; snoozed 346:1610; running
// 346:2205) and of the Workbench sidebar (D2 105:660, selected 105:643). The
// whole row is the target of its title button: the button's ::after covers
// the row, and the `actions` slot sits above it.
export const listRow = defineSlotRecipe({
  className: 'list-row',
  jsx: ['ListRow'],
  staticCss: ['*'],
  slots: ['root', 'leading', 'body', 'title', 'meta', 'lines', 'actions', 'trailing'],
  base: {
    root: {
      position: 'relative',
      display: 'flex',
      gap: '10',
      borderRadius: 'lg',
      borderWidth: 'default',
      borderStyle: 'solid',
      borderColor: 'transparent',
      color: 'fg.default',
      // The keyboard focus of the title button rings the whole row.
      '&:has(.list-row__title:focus-visible)': { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
      '&[data-selected], &[data-running]': { bg: 'surface.selected', borderColor: 'border.selected' },
      // A selected or running row is not dimmed: its text must keep 4.5:1 on the selected colour.
      '&[data-snoozed]:not([data-selected]):not([data-running])': { opacity: 'snoozed' },
      // Figma draws the age in #4a5675 (fg.subtle). On surface.selected fg.subtle is not allowed, and on a
      // snoozed row's 0.85 opacity it falls under 4.5:1, so those rows keep fg.muted.
      '&:is([data-selected], [data-running], [data-snoozed]) .list-row__trailing': { color: 'fg.muted' },
    },
    leading: { display: 'inline-flex', flexShrink: '0' },
    body: { display: 'flex', flexDirection: 'column', gap: '4', flex: '1', minW: '0' },
    title: {
      textStyle: 'label',
      color: 'fg.default',
      textAlign: 'start',
      bg: 'transparent',
      border: 'none',
      p: '0',
      outline: 'none',
      '&:is(button)': {
        cursor: 'pointer',
        _after: { content: '""', position: 'absolute', inset: '0', borderRadius: 'inherit' },
      },
    },
    meta: { textStyle: 'mono', color: 'fg.muted' },
    lines: { display: 'flex', flexDirection: 'column', gap: '4', textStyle: 'small', color: 'fg.muted' },
    // Buttons in the row, such as Approve. They sit above the title's ::after, so a click reaches them.
    // The space between the buttons passes clicks to the title cover; only the buttons take them.
    actions: { position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '6', pt: '4', pointerEvents: 'none', '& > *': { pointerEvents: 'auto' } },
    trailing: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6', flexShrink: '0', textStyle: 'mono', color: 'fg.subtle', whiteSpace: 'nowrap' },
  },
  variants: {
    variant: {
      // An Inbox row: its title and meta wrap, and the items sit at the top.
      inbox: { root: { alignItems: 'flex-start', p: '10' } },
      // A chat row of the Workbench sidebar: one line of title, centred items.
      sidebar: {
        root: { alignItems: 'center', py: '8', ps: '24', pe: '10' },
        title: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
        meta: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
      },
    },
  },
  defaultVariants: { variant: 'inbox' },
})
