// Pure parts of check-worktree.ts, tested in worktree.test.ts.

export interface LineWriter {
  write: (text: string) => void
  flush: () => void
}

// Sends each complete line of one output stream to sink with a prefix as
// soon as the line ends; flush sends a last line that has no newline.
export function lineWriter(prefix: string, sink: (line: string) => void): LineWriter {
  let partial = ''
  return {
    write: (text) => {
      const lines = (partial + text).split('\n')
      partial = lines.pop() ?? ''
      for (const line of lines) sink(`${prefix}${line}\n`)
    },
    flush: () => {
      if (partial !== '') sink(`${prefix}${partial}\n`)
      partial = ''
    },
  }
}
