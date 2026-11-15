// expect: tsc TS1294
// Node strips types but cannot run an enum, so erasableSyntaxOnly rejects it.
export enum Mode {
  Dark,
  Light,
}
