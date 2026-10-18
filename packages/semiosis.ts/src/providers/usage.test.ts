import assert from "node:assert/strict"
import { test } from "node:test"
import { UserSign } from "../sign/index.ts"
import type { Client as DeepSeekClient } from "./deepseek/client/index.ts"
import { interpret as deepseekInterpret } from "./deepseek/model/interpret.ts"
import type { ModelConfig as DeepSeekModelConfig } from "./deepseek/model/ModelConfig.ts"
import type { Client as OpenRouterClient } from "./openrouter/client/index.ts"
import { interpret as openrouterInterpret } from "./openrouter/model/interpret.ts"
import type { ModelConfig as OpenRouterModelConfig } from "./openrouter/model/ModelConfig.ts"

test("deepseek interpret emits normalized usage", async () => {
  const raw = {
    prompt_tokens: 100,
    completion_tokens: 20,
    total_tokens: 120,
    prompt_cache_hit_tokens: 80,
    prompt_cache_miss_tokens: 20,
    prompt_tokens_details: { cached_tokens: 80 },
    completion_tokens_details: { reasoning_tokens: 10 },
  }
  const client = {
    chat: {
      completions: {
        async *createStream() {
          yield { choices: [], usage: raw }
        },
      },
    },
  } as unknown as DeepSeekClient
  const config: DeepSeekModelConfig = {
    name: "deepseek-chat",
    pinned: false,
    thinking: "disabled",
    reasoningEffort: "none",
  }
  const events = []

  for await (const event of deepseekInterpret(client, config, [
    UserSign("hello"),
  ])) {
    events.push(event)
  }

  assert.deepEqual(events, [
    {
      type: "usage",
      usage: {
        input: 100,
        output: 20,
        cacheRead: 80,
        cacheMiss: 20,
        cacheWrite: 0,
        total: 120,
        raw,
      },
    },
  ])
})

test("openrouter interpret emits normalized usage", async () => {
  const raw = {
    prompt_tokens: 100,
    completion_tokens: 20,
    total_tokens: 120,
    prompt_tokens_details: {
      cached_tokens: 30,
      cache_write_tokens: 10,
    },
    completion_tokens_details: {
      reasoning_tokens: 5,
    },
  }
  const client = {
    chat: {
      completions: {
        async *createStream() {
          yield { choices: [], usage: raw }
        },
      },
    },
  } as unknown as OpenRouterClient
  const config: OpenRouterModelConfig = {
    name: "openrouter/test",
    pinned: false,
  }
  const events = []

  for await (const event of openrouterInterpret(client, config, [
    UserSign("hello"),
  ])) {
    events.push(event)
  }

  assert.deepEqual(events, [
    {
      type: "usage",
      usage: {
        input: 100,
        output: 20,
        cacheRead: 30,
        cacheMiss: 60,
        cacheWrite: 10,
        total: 120,
        raw,
      },
    },
  ])
})

test("deepseek interpret finalizes reasoning before assistant deltas", async () => {
  const client = {
    chat: {
      completions: {
        async *createStream() {
          yield { choices: [{ delta: { reasoning_content: "think" } }] }
          yield { choices: [{ delta: { content: "answer" } }] }
        },
      },
    },
  } as unknown as DeepSeekClient
  const config: DeepSeekModelConfig = {
    name: "deepseek-chat",
    pinned: false,
    thinking: "enabled",
    reasoningEffort: "high",
  }
  const events = []

  for await (const event of deepseekInterpret(client, config, [
    UserSign("hello"),
  ])) {
    events.push(event)
  }

  assert.deepEqual(events, [
    {
      type: "delta",
      delta: { signKind: "ReasoningSign", content: "think" },
    },
    {
      type: "sign",
      sign: { kind: "ReasoningSign", content: "think" },
    },
    {
      type: "delta",
      delta: { signKind: "AssistantSign", content: "answer" },
    },
    {
      type: "sign",
      sign: { kind: "AssistantSign", content: "answer" },
    },
  ])
})

test("openrouter interpret finalizes reasoning before assistant deltas", async () => {
  const detail = { type: "reasoning.text", text: "detail" }
  const client = {
    chat: {
      completions: {
        async *createStream() {
          yield {
            choices: [
              {
                delta: {
                  reasoning: "think",
                  reasoning_details: [detail],
                },
              },
            ],
          }
          yield { choices: [{ delta: { content: "answer" } }] }
        },
      },
    },
  } as unknown as OpenRouterClient
  const config: OpenRouterModelConfig = {
    name: "openrouter/test",
    pinned: false,
  }
  const events = []

  for await (const event of openrouterInterpret(client, config, [
    UserSign("hello"),
  ])) {
    events.push(event)
  }

  assert.deepEqual(events, [
    {
      type: "delta",
      delta: { signKind: "ReasoningSign", content: "think" },
    },
    {
      type: "sign",
      sign: { kind: "ReasoningSign", content: "think" },
    },
    {
      type: "sign",
      sign: {
        kind: "ProviderDataSign",
        provider: "openrouter",
        field: "reasoning_details",
        data: [detail],
      },
    },
    {
      type: "delta",
      delta: { signKind: "AssistantSign", content: "answer" },
    },
    {
      type: "sign",
      sign: { kind: "AssistantSign", content: "answer" },
    },
  ])
})
