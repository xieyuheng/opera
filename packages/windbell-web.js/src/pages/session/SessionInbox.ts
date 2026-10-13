import type * as S from "@windbell/semiosis.js"

export type PendingInterpret = {
  kind: "PendingInterpret"
  sessionId: S.SessionId
  content: string
  generateTitle: boolean
}

export type SessionMessage = PendingInterpret

const inbox = new Map<S.SessionId, Array<SessionMessage>>()

export function sendSessionMessage(message: SessionMessage): void {
  const messages = inbox.get(message.sessionId) ?? []

  messages.push(message)
  inbox.set(message.sessionId, messages)
}

export function receiveSessionMessages(
  sessionId: S.SessionId,
): Array<SessionMessage> {
  const messages = inbox.get(sessionId) ?? []
  inbox.delete(sessionId)
  return messages
}
