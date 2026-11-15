// expect: eslint no-restricted-syntax
// scope: scripts too
export class State {
  value!: string
  read() {
    return this.value.toUpperCase()
  }
}
