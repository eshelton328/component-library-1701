// expect: eslint structure/tier-imports
// The src barrel re-exports every tier, so it would hide a forbidden import.
export * from '../index'
