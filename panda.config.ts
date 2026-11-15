import { defineConfig } from '@pandacss/dev'

// Tokens and themes arrive in phase 3, built from DTCG JSON. Until then the
// theme is empty, so `strictTokens` allows no colour, size or radius at all.
export default defineConfig({
  // Utilities and conditions only; preset-panda's default tokens stay out.
  presets: ['@pandacss/preset-base'],
  preflight: true,
  include: ['./src/**/*.{ts,tsx}'],
  exclude: ['./src/**/*.test.{ts,tsx}'],
  outdir: 'styled-system',
  outExtension: 'js',
  jsxFramework: 'react',
  // No style props on JSX: a screen styles a component only through its
  // recipe variants, never by passing CSS props.
  jsxStyleProps: 'none',
  strictTokens: true,
  strictPropertyValues: true,
  theme: { extend: {} },
})
