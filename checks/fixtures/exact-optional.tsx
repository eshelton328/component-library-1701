// expect: tsc TS2375
type Options = { label?: string }
const empty: string | undefined = undefined
export const options: Options = { label: empty }
