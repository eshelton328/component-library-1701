// semantic-release for @eshelton328/component-library-1701 (brain decision
// d-061, toolkit rule releases.md). Each version gets GitHub release notes;
// there is no CHANGELOG.md and no release commit. The version in
// package.json stays 0.0.0-development in git; the npm plugin writes the
// computed version only in the release job's checkout.
//
// Analyzer 13.0.1, notes generator 14.1.1 and preset 9.3.1 are the tested
// combination; preset 10.x needs a changelog writer that the generator does
// not declare. Check notes before upgrading any of them.
const conventional = { preset: 'conventionalcommits', presetConfig: {} }

export default {
  // `beta` releases 1.0.0-beta.N until the first stable contract. The
  // release workflow runs on `main` only when the owner sets RELEASE_MAIN.
  branches: ['main', { name: 'beta', channel: 'beta', prerelease: 'beta' }],
  tagFormat: 'v${version}',
  plugins: [
    ['@semantic-release/commit-analyzer', conventional],
    ['@semantic-release/release-notes-generator', conventional],
    // Writes the version, then publishes to GitHub Packages (publishConfig).
    '@semantic-release/npm',
    // Builds after the version is written, so dist/panda/lib.json carries it.
    ['@semantic-release/exec', { prepareCmd: 'pnpm build:lib' }],
    ['@semantic-release/github', { successComment: false, failComment: false, releasedLabels: false }],
  ],
}
