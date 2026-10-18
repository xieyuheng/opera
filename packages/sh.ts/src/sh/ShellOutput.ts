export type ShellOutput = {
  exitCode: number | null
  signal: string | null
  stdout: string
  stderr: string
  stdoutTruncated: boolean
  stderrTruncated: boolean
  timedOut: boolean
  cancelled: boolean
}
