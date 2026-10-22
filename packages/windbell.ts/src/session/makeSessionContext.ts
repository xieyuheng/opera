import type { SessionStore } from "../database/index.ts"
import type { Sign } from "../sign/index.ts"
import type { Session } from "./Session.ts"

export function makeSessionContext(options: {
  session: Session
  sessionStore: SessionStore
}) {
  return {
    getContext: async (): Promise<Array<Sign>> => {
      return options.session.context
    },

    appendContext: async (signs: Array<Sign>): Promise<void> => {
      options.session.context.push(...signs)

      for (const sign of signs) {
        await options.sessionStore.appendSign(options.session.id, sign)
      }
    },
  }
}
