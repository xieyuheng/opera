import { errorReport } from "@windbell/std.ts/error"
import type { Database } from "../database/index.ts"
import type { Repl } from "../repl/Repl.ts"
import type { Session } from "../session/index.ts"
import { unwrap } from "@windbell/std.ts/result"

export function makeTitleChangeHandler(
  database: Database,
  session: Session,
): (title: string) => Promise<void> {
  return async (title) => {
    unwrap(await database.sessions.updateTitle(session.id, title))
    session.title = title
  }
}

export function printAgentReplError(repl: Repl, error: unknown): void {
  repl.println(`[error] ${errorReport(error)}`)
}
