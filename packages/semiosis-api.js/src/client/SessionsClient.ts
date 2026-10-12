import type * as S from "@windbell/semiosis.js/node"
import {
  makeJsonEndpoint,
  withNotFoundAsUndefined,
  requestNdjson,
} from "@windbell/http.js"
import type { SemiosisClientConfig } from "./SemiosisClient.ts"
import {
  GenerateTitleOutputSchema,
  SessionIndexListSchema,
  SessionSchema,
  VoidSchema,
} from "./schemas.ts"

export type MakeSessionOptions = {
  workspaceId: S.WorkspaceId
  title: string
}

export type ListSessionsOptions = {
  workspaceId: S.WorkspaceId | undefined
}

export type GenerateTitleOptions = {
  sessionId: S.SessionId
  model: S.ModelRef
}

export type InterpretOptions = {
  sessionId: S.SessionId
  model: S.ModelRef
  turnId: string
  input: Array<S.Sign>
  signal?: AbortSignal
}

export type InterpretEvent =
  | { type: "delta"; delta: S.SignDelta }
  | { type: "sign"; sign: S.Sign }
  | { type: "done" }
  | {
      type: "error"
      message: string
      retryable: boolean
      inputPersisted: boolean
    }

export type SessionsInterpretEvent =
  | { type: "delta"; delta: S.SignDelta }
  | { type: "sign"; sign: S.Sign }
  | {
      type: "error"
      message: string
      retryable: boolean
      inputPersisted: boolean
    }

export type SessionsClient = {
  list(options: ListSessionsOptions): Promise<Array<S.SessionIndex>>
  make(options: MakeSessionOptions): Promise<S.Session>
  get(id: S.SessionId): Promise<S.Session | undefined>
  put(session: S.Session): Promise<void>
  generateTitle(options: GenerateTitleOptions): Promise<string>
  interpret(options: InterpretOptions): AsyncGenerator<SessionsInterpretEvent>
  remove(id: S.SessionId): Promise<void>
}

export function makeSessionsClient(
  config: SemiosisClientConfig,
): SessionsClient {
  return {
    list: makeJsonEndpoint(config, {
      method: "GET",
      path: "/sessions",
      query: (options: ListSessionsOptions) => {
        const query = new URLSearchParams()
        if (options.workspaceId !== undefined) {
          query.set("workspaceId", options.workspaceId)
        }
        return query
      },
      output: SessionIndexListSchema,
    }),

    make: makeJsonEndpoint(config, {
      method: "POST",
      path: "/sessions",
      body: (options: MakeSessionOptions) => options,
      output: SessionSchema,
    }),

    get: withNotFoundAsUndefined(
      makeJsonEndpoint(config, {
        method: "GET",
        path: (id: S.SessionId) => `/sessions/${encodeURIComponent(id)}`,
        output: SessionSchema,
      }),
    ),

    put: makeJsonEndpoint(config, {
      method: "PUT",
      path: (session: S.Session) =>
        `/sessions/${encodeURIComponent(session.id)}`,
      body: (session: S.Session) => session,
      output: VoidSchema,
    }),

    generateTitle: makeJsonEndpoint(config, {
      method: "POST",
      path: (options: GenerateTitleOptions) =>
        `/sessions/${encodeURIComponent(options.sessionId)}/title`,
      body: (options: GenerateTitleOptions) => options,
      output: GenerateTitleOutputSchema,
    }),

    async *interpret(
      options: InterpretOptions,
    ): AsyncGenerator<SessionsInterpretEvent> {
      for await (const event of requestNdjson<InterpretEvent>({
        baseUrl: config.baseUrl,
        method: "POST",
        path: `/sessions/${encodeURIComponent(options.sessionId)}/interpret`,
        body: {
          sessionId: options.sessionId,
          model: options.model,
          turnId: options.turnId,
          input: options.input,
        },
        signal: options.signal,
      })) {
        if (event.type === "delta") {
          yield { type: "delta", delta: event.delta }
        } else if (event.type === "sign") {
          yield { type: "sign", sign: event.sign }
        } else if (event.type === "error") {
          yield {
            type: "error",
            message: event.message,
            retryable: event.retryable,
            inputPersisted: event.inputPersisted,
          }
          return
        } else if (event.type === "done") {
          return
        }
      }
    },

    remove: makeJsonEndpoint(config, {
      method: "DELETE",
      path: (id: S.SessionId) => `/sessions/${encodeURIComponent(id)}`,
      output: VoidSchema,
    }),
  }
}
