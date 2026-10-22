import { unwrap } from "@xieyuheng/std.ts/result"

import type { SessionStore } from "../database/SessionStore.ts"
import type { Sign } from "../sign/index.ts"
import type { Turn } from "./Turn.ts"

export type TurnReplayOptions = {
  sessions: SessionStore
  turn: Turn
}

export async function* turnReplay(
  options: TurnReplayOptions,
): AsyncGenerator<Sign> {
  const signs = unwrap(
    await options.sessions.sliceContextBySequence(
      options.turn.sessionId,
      options.turn.startSequence,
      options.turn.endSequence,
    ),
  )

  yield* signs
}
