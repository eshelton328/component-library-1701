// expect: tsc TS4114
class Base {
  label(): string {
    return 'base'
  }
}
export class Child extends Base {
  label(): string {
    return 'child'
  }
}
