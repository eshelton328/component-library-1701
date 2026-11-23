// A 44 px touch target (control.xl) for a control drawn smaller, such as the 26 px model chip and the 24 px back and
// actions buttons of the one-row chat header (d-121): a transparent ::before reaches 12 past each edge of the
// padding box (inside a 1 px border), so a 24 px control gets 46 and a 26 px one 48, and a tap there is a tap on the control. The box, its layout and its focus ring
// stay as they are. Spread it in a `touch` variant.
export const touchTarget = {
  position: 'relative',
  _before: { content: '""', position: 'absolute', insetBlock: '-12', insetInline: '-12' },
} as const
