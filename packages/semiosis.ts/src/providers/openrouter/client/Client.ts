import { makeJsonEndpoint, requestServerSentEvents } from "@windbell/http.ts"
import type { ChatCompletionInput } from "./ChatCompletionInput.ts"
import {
  ChatCompletionChunkSchema,
  ChatCompletionSchema,
  type ChatCompletion,
  type ChatCompletionChunk,
} from "./ChatCompletionSchema.ts"
import type { ClientConfig } from "./ClientConfig.ts"
import { type ModelList, ModelListSchema } from "./ModelListSchema.ts"

export type ChatCompletionRequestOptions = {
  signal?: AbortSignal
}

export type Client = {
  chat: {
    completions: {
      create: (input: ChatCompletionInput) => Promise<ChatCompletion>
      createStream: (
        input: ChatCompletionInput,
        options?: ChatCompletionRequestOptions,
      ) => AsyncIterable<ChatCompletionChunk>
    }
  }
  models: {
    list: () => Promise<ModelList>
  }
}

export function makeClient(config: ClientConfig): Client {
  const headers = new Headers({
    Authorization: `Bearer ${config.key}`,
    "HTTP-Referer": "https://windbell.xieyuheng.com",
    "X-Title": "windbell",
  })

  return {
    chat: {
      completions: {
        create: makeJsonEndpoint(config, {
          method: "POST",
          path: "/chat/completions",
          body: makeChatCompletionBody,
          output: ChatCompletionSchema,
          headers,
        }),

        createStream: (input, options) =>
          createChatCompletionStream(config, headers, input, options),
      },
    },

    models: {
      list: makeJsonEndpoint(config, {
        method: "GET",
        path: "/models",
        output: ModelListSchema,
        headers,
      }),
    },
  }
}

async function* createChatCompletionStream(
  config: ClientConfig,
  headers: Headers,
  input: ChatCompletionInput,
  options: ChatCompletionRequestOptions = {},
): AsyncGenerator<ChatCompletionChunk> {
  const events = requestServerSentEvents({
    baseUrl: config.baseUrl,
    method: "POST",
    path: "/chat/completions",
    body: makeChatCompletionBody({ ...input, stream: true }),
    headers,
    signal: options.signal,
  })

  for await (const event of events) {
    if (event.data.trim() === "") continue
    if (event.data.trim() === "[DONE]") return

    yield ChatCompletionChunkSchema.parse(JSON.parse(event.data))
  }
}

function makeChatCompletionBody(
  input: ChatCompletionInput,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: input.model,
    messages: input.messages,
  }

  if (input.tools.length !== 0) {
    body.tools = input.tools
  }

  if (input.reasoning !== undefined) {
    body.reasoning = input.reasoning
  }

  if (input.provider !== undefined) {
    body.provider = input.provider
  }

  if (input.extraBody !== undefined) {
    Object.assign(body, input.extraBody)
  }

  if (input.stream === true) {
    body.stream = true
  }

  return body
}
