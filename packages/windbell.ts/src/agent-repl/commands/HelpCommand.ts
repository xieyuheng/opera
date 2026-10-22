import type { Repl, ReplCommand } from "../../repl/Repl.ts"

export function makeHelpCommand(repl: Repl): ReplCommand {
  return {
    name: "help",
    description: "show available commands",
    handler: () => {
      repl.println(`commands:`)
      for (const command of repl.listCommands()) {
        repl.println(`  /${command.name} -- ${command.description}`)
      }
    },
  }
}
