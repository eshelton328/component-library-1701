// expect: eslint no-restricted-syntax
export class State {
  value!: string
  read() {
    return this.value.toUpperCase()
  }
}
