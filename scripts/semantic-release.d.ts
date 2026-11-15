// Types for the two untyped modules that check-release-api.ts and
// check-release-registry.ts load.
declare module '@semantic-release/commit-analyzer' {
  type Logger = Record<'log' | 'error' | 'warn' | 'success', (...args: unknown[]) => void>
  export function analyzeCommits(
    pluginConfig: unknown,
    context: { commits: { hash: string; message: string }[]; logger: Logger; cwd: string; options: Record<string, unknown> },
  ): Promise<string | null>
}
declare module '*/release.config.js' {
  const config: unknown
  export default config
}
