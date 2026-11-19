import { defineConfig } from '@pandacss/dev'
import tokens from './tokens/generated/preset'
import { recipes, slotRecipes } from './src/theme/recipes'
import { keyframes } from './src/theme/keyframes'

// Tokens come from tokens/*.json through `pnpm tokens`, never from here.
// preset-base gives utilities and conditions (`.dark &` for dark mode);
// preset-panda's default tokens stay out, so only our tokens are valid.
export default defineConfig({
  presets: ['@pandacss/preset-base', tokens],
  preflight: true,
  include: ['./src/**/*.{ts,tsx}'],
  exclude: ['./src/**/*.test.{ts,tsx}'],
  outdir: 'styled-system',
  outExtension: 'js',
  // Write '.js' on internal imports, so the packed styled-system runs
  // under plain Node ESM, not only through a bundler.
  forceImportExtension: true,
  jsxFramework: 'react',
  // No style props on JSX: a screen styles a component only through its
  // recipe variants, never by passing CSS props.
  jsxStyleProps: 'none',
  strictTokens: true,
  strictPropertyValues: true,
  // Component styles are config recipes in src/theme/recipes (d-067).
  theme: { extend: { recipes, slotRecipes, keyframes } },
  globalCss: {
    body: { bg: 'bg.canvas', color: 'fg.default', fontFamily: 'sans', textStyle: 'body' },
    // No element draws the browser's default outline when it has the focus
    // but not focus-visible, such as after a mouse or touch press (screen
    // review R16). The recipes' `focusRing` stays the only ring, and a
    // keyboard focus (`:focus-visible`) is not matched here.
    '*:focus:not(:focus-visible)': { outline: 'none' },
  },
})
