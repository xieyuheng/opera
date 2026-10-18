import type { Agent } from "../../agent/index.ts"
import { formatWithBackground } from "../../format/index.ts"
import { generateTitle } from "../../session/index.ts"
import type { Repl, ReplCommand } from "../../repl/Repl.ts"
import { printAgentReplError } from "../shared.ts"

export async function generateAndPrintTitle(
  agent: Agent,
  repl: Repl,
  options: {
    onTitleChange?: (title: string) => Promise<void> | void
  },
): Promise<void> {
  const result = await generateTitle({
    model: agent.model,
    context: await agent.getContext(),
  })

  if (result.kind === "error") {
    printAgentReplError(repl, result.error)
    return
  }

  const title = result.kind === "ok" ? result.title : ""

  if (title !== "") {
    await options.onTitleChange?.(title)
  }

  const titleTag = repl.useColor
    ? formatWithBackground("[title]", 240)
    : "[title]"

  repl.println(`${titleTag}\n\n${title === "" ? "(empty)" : title}\n`)
}

export function makeTitleCommand(
  agent: Agent,
  repl: Repl,
  options: {
    onTitleChange?: (title: string) => Promise<void> | void
  },
): ReplCommand {
  return {
    name: "title",
    description: "generate and print title",
    handler: async () => {
      await generateAndPrintTitle(agent, repl, options)
    },
  }
}
