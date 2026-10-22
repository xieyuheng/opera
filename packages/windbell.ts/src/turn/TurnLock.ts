import type { SessionId } from "../session/Session.ts"
import type { TurnId } from "./Turn.ts"

export class TurnLock {
  private running = new Set<string>()

  tryLock(sessionId: SessionId, turnId: TurnId): (() => void) | undefined {
    const key = `${sessionId}:${turnId}`

    if (this.running.has(key)) {
      return undefined
    }

    this.running.add(key)

    return () => {
      this.running.delete(key)
    }
  }
}
