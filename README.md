# component-library-1701

The React component library for the-bridge, the interface to Erik's
NCC-1701 workspace. It uses Ark UI for behaviour, Panda CSS for styles and
Storybook for docs and tests.

## Status

Not released. The repository has its checks (lint, type checks, story
tests and CI) and the Viewscreen theme's tokens in dark and light. The
components come next.

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

## Help

Open an issue in this repository. Agents read [AGENTS.md](AGENTS.md).
