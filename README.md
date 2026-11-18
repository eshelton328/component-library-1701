# component-library-1701

The React component library for the-bridge, the interface to Erik's
NCC-1701 workspace. It uses Ark UI for behaviour, Panda CSS for styles and
Storybook for docs and tests.

## Status

Not released yet. The repository has its checks (lint, type checks, story
tests and CI), the Viewscreen theme's tokens in dark and light, and the
release automation, and the first components, which the package exports
from its root (`src/index.ts`).
The first release is `1.0.0-beta.1` from the `beta` branch. Each version's notes are on the
[releases page](https://github.com/eshelton328/component-library-1701/releases).

## Prerequisites

- Node.js 24 or later: <https://nodejs.org>
- pnpm 11: `npm install -g pnpm@11.24.0`
- Read access to this private repository, through the GitHub CLI:
  `gh auth login`

## Quick start

```sh
gh repo clone eshelton328/component-library-1701 ~/Projects/component-library-1701
cd ~/Projects/component-library-1701
pnpm install
pnpm exec playwright install chromium
pnpm verify
```

## First use

`pnpm storybook` starts Storybook at <http://localhost:6006>.
`pnpm verify` runs every check that CI runs, and prints the first failure.

## Focus rings on page blocks

A page writes the focus ring of its own block under the exported
`focusRing` condition and sets `outline: 'none'` on the same element, never
`_focusVisible`. The ring then shows after the keyboard and hides after a
mouse, pen or touch press, as on the library's controls:

```tsx
import { focusRing } from '@eshelton328/component-library-1701'
import { css } from '../styled-system/css'

const block = css({
  outline: 'none',
  [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
})
```

## Help

Open an issue in this repository. Agents read [AGENTS.md](AGENTS.md).
