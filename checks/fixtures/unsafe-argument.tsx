// expect: eslint @typescript-eslint/no-unsafe-argument
const shout = (text: string) => text.toUpperCase()
export const loud = (raw: string) => shout(JSON.parse(raw))
