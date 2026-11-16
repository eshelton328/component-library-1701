/**
 * A recipe's variant props with single values only. Panda's types also
 * accept a condition object (`{ base: '1', _print: '3' }`) or an array,
 * but `staticCss: ['*']` writes no CSS for those, so they would do nothing.
 */
export type Scalar<T> = { [K in keyof T]?: Exclude<T[K], readonly unknown[] | { readonly [key: string]: unknown }> }
