// expect: eslint no-restricted-properties
export const read = () => window.localStorage.getItem('item')
