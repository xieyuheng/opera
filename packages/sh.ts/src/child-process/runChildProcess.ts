import { spawn } from "node:child_process"
import process from "node:process"
import { StringDecoder } from "node:string_decoder"

import type { ShellOutput } from "../sh/index.ts"
import {
  killChildProcessTree,
  useDetachedChildProcess,
} from "./killChildProcessTree.ts"

export type RunChildProcessOptions = {
  executable: string
  args: Array<string>
  cwd: string
  timeoutMs: number
  maxOutputChars: number
  env: NodeJS.ProcessEnv
  signal?: AbortSignal
}

export function runChildProcess(
  options: RunChildProcessOptions,
): Promise<ShellOutput> {
  if (options.signal?.aborted) {
    return Promise.resolve(cancelledShellOutput())
  }

  return new Promise((resolve, reject) => {
    const child = spawn(options.executable, options.args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ["ignore", "pipe", "pipe"],
      detached: useDetachedChildProcess,
    })

    let stdout = ""
    let stderr = ""
    let stdoutTruncated = false
    let stderrTruncated = false
    let timedOut = false
    let cancelled = false

    const stdoutDecoder = new StringDecoder("utf8")
    const stderrDecoder = new StringDecoder("utf8")

    const onAbort = (): void => {
      cancelled = true
      killChildProcessTree(child)
    }

    const timer = setTimeout(() => {
      timedOut = true
      killChildProcessTree(child)
    }, options.timeoutMs)

    const cleanup = (): void => {
      clearTimeout(timer)
      options.signal?.removeEventListener("abort", onAbort)
    }

    const appendStdout = (text: string): void => {
      if (stdoutTruncated) return

      const remaining = options.maxOutputChars - stdout.length
      if (text.length > remaining) {
        stdout += text.slice(0, Math.max(remaining, 0))
        stdoutTruncated = true
      } else {
        stdout += text
      }
    }

    const appendStderr = (text: string): void => {
      if (stderrTruncated) return

      const remaining = options.maxOutputChars - stderr.length
      if (text.length > remaining) {
        stderr += text.slice(0, Math.max(remaining, 0))
        stderrTruncated = true
      } else {
        stderr += text
      }
    }

    child.stdout.on("data", (chunk: Buffer) => {
      appendStdout(stdoutDecoder.write(chunk))
    })

    child.stderr.on("data", (chunk: Buffer) => {
      appendStderr(stderrDecoder.write(chunk))
    })

    child.on("error", (error) => {
      cleanup()

      if (cancelled) {
        resolve(cancelledShellOutput())
        return
      }

      reject(error)
    })

    child.on("close", (code, signal) => {
      cleanup()
      appendStdout(stdoutDecoder.end())
      appendStderr(stderrDecoder.end())

      resolve({
        exitCode: code,
        signal,
        stdout,
        stderr,
        stdoutTruncated,
        stderrTruncated,
        timedOut,
        cancelled,
      })
    })

    options.signal?.addEventListener("abort", onAbort, { once: true })

    if (options.signal?.aborted) {
      onAbort()
    }
  })
}

function cancelledShellOutput(): ShellOutput {
  return {
    exitCode: null,
    signal: null,
    stdout: "",
    stderr: "",
    stdoutTruncated: false,
    stderrTruncated: false,
    timedOut: false,
    cancelled: true,
  }
}
