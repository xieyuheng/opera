import type { Repl, ReplCommand } from "../../repl/Repl.ts"

export function makeExitCommand(repl: Repl): ReplCommand {
  return {
    name: "exit",
    description: "exit the repl",
    handler: () => {
      repl.close()
    },
  }
}
