// The story files that the story-tags check loads in the browser. Keep the extensions the same as the `stories`
// glob of .storybook/main.ts; story-tags-lib.test.ts checks it.
export const storyModules: Record<string, Record<string, unknown>> = import.meta.glob(['../src/**/*.stories.tsx'], { eager: true })
