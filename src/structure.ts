// The library's structure in one place. eslint.shared.js reads it for the
// tier import rules and the story title rule, and the Figma drift check
// will compare the same lists. Decisions in the brain: tiers d-064, groups
// d-065, layout d-066, theme recipes d-067.

/**
 * Code tiers. Each is a folder under `src/`, and a file may import only
 * the tiers in its `mayImport` list. The tiers never name a Storybook entry
 * or a Figma page; the groups below do.
 */
export const tiers = {
  foundations: { mayImport: [] },
  controls: { mayImport: ['foundations', 'controls'] },
  parts: { mayImport: ['foundations', 'controls', 'parts'] },
  // Shell takes Parts as children through slots, never by import.
  shell: { mayImport: ['foundations', 'controls'] },
  pages: { mayImport: ['foundations', 'controls', 'parts', 'shell', 'pages'] },
} as const satisfies Record<string, { mayImport: readonly string[] }>

export type Tier = keyof typeof tiers

/** The only tier that may import `@ark-ui/react`. `src/theme/` may import its anatomy. */
export const arkTier = 'controls' satisfies Tier

/**
 * Purpose groups, in sidebar order. Every story title starts with one, and
 * the Figma library pages use the same names. `.storybook/preview.ts`
 * repeats this order as a literal, because Storybook reads `storySort`
 * without running the file.
 */
export const groups = [
  'Foundations',
  'Actions',
  'Forms',
  'Navigation',
  'Layout',
  'Overlays',
  'Status',
  'Data display',
  'Conversation',
  'Examples',
] as const

export type Group = (typeof groups)[number]

/**
 * Panda layout patterns that only the layout components in Controls use.
 * Other tiers use those components (Container, Stack, Inline, Grid).
 */
export const layoutPatterns = ['Container', 'Stack', 'HStack', 'VStack', 'Grid', 'GridItem', 'Wrap'] as const

/** Panda patterns that no file uses: the library has no Box and no Spacer (d-066). */
export const bannedPatterns = [
  'Box',
  'Spacer',
  'Flex',
  'Center',
  'Circle',
  'Square',
  'Float',
  'Bleed',
  'AspectRatio',
  'Divider',
  'Cq',
  'LinkOverlay',
  'VisuallyHidden',
] as const

/**
 * Libraries that hold application state, data or routing. Components take
 * data through props and report through callbacks; they never manage
 * application state (d-068, d-069).
 */
export const stateLibraries = [
  '@tanstack/react-query',
  '@tanstack/react-router',
  'swr',
  'axios',
  'zustand',
  'jotai',
  'valtio',
  'recoil',
  'mobx',
  'mobx-react-lite',
  'redux',
  'react-redux',
  '@reduxjs/toolkit',
  'react-router',
  'react-router-dom',
  'next/router',
  'next/navigation',
] as const

/** Browser globals that reach data, storage or the URL. */
export const stateGlobals = [
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'location',
  'history',
] as const
