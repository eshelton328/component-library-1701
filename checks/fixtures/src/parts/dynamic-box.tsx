// expect: eslint structure/tier-imports
// A dynamic import of a Panda pattern, by relative path.
export const load = () => import('../../../styled-system/patterns/box')
