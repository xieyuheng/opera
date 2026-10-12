import type { ChildProcess } from "node:child_process"
import process from "node:process"

// POSIX process groups are used to terminate the shell and its descendants.
// Windows does not have the same POSIX process group semantics.
export const useDetachedChildProcess = process.platform !== "win32"

export function killChildProcessTree(child: ChildProcess): void {
  if (child.pid === undefined) return

  try {
    if (process.platform === "win32") {
      child.kill("SIGKILL")
      return
    }

    // POSIX: detached: true makes child.pid the leader of a new process group.
    // A negative pid tells process.kill to signal the whole process group.
    process.kill(-child.pid, "SIGKILL")
  } catch {
    // The process or process group may have already exited.
  }
}
