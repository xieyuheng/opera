import type * as W from "@xieyuheng/windbell.ts/core"

export type PendingInterpret = {
  kind: "PendingInterpret"
  sessionId: W.SessionId
  content: string
  generateTitle: boolean
}

export type SessionMessage = PendingInterpret

const inbox = new Map<W.SessionId, Array<SessionMessage>>()

export function sendSessionMessage(message: SessionMessage): void {
  const messages = inbox.get(message.sessionId) ?? []

  messages.push(message)
  inbox.set(message.sessionId, messages)
}

export function receiveSessionMessages(
  sessionId: W.SessionId,
): Array<SessionMessage> {
  const messages = inbox.get(sessionId) ?? []
  inbox.delete(sessionId)
  return messages
}
