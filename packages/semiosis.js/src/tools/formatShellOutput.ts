import type { ShellOutput } from "@windbell/sh.js/sh"

export function formatShellOutput(
  output: ShellOutput,
  timeoutMs: number,
): string {
  const lines: Array<string> = []

  if (output.cancelled) {
    lines.push(
      "[cancelled] user aborted tool execution; it may have partially executed.",
    )
  } else {
    if (output.timedOut) {
      lines.push(`[timeout ${timeoutMs}ms]`)
    }

    if (output.exitCode !== 0) {
      lines.push(`[exit-code ${output.exitCode}]`)
    }

    if (output.signal) {
      lines.push(`[signal ${output.signal}]`)
    }
  }

  lines.push(truncatedText(output.stdout, output.stdoutTruncated))

  if (output.stderr !== "") {
    lines.push("[stderr]")
    lines.push(truncatedText(output.stderr, output.stderrTruncated))
  }

  return lines.join("\n")
}

function truncatedText(text: string, truncated: boolean): string {
  if (!truncated) return text
  return `${text}\n[output-truncated]`
}
