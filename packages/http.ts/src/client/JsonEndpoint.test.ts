import assert from "node:assert/strict"
import { once } from "node:events"
import { createServer } from "node:http"
import type { AddressInfo } from "node:net"
import { test } from "node:test"

import { z } from "zod"

import { makeJsonEndpoint } from "./JsonEndpoint.ts"

const outputSchema = z.object({
  method: z.string(),
  url: z.string(),
  authorization: z.string().nullable(),
  contentType: z.string().nullable(),
  body: z.unknown(),
})

test("makeJsonEndpoint builds a JSON request and parses the response", async (t) => {
  const requests: Array<{
    method: string | undefined
    url: string | undefined
    authorization: string | undefined
    contentType: string | undefined
    body: string
  }> = []

  const server = createServer(async (request, response) => {
    const chunks: Array<Buffer> = []

    for await (const chunk of request) {
      chunks.push(chunk as Buffer)
    }

    const body = Buffer.concat(chunks).toString("utf8")

    requests.push({
      method: request.method,
      url: request.url,
      authorization: request.headers.authorization,
      contentType: request.headers["content-type"],
      body,
    })

    response.setHeader("Content-Type", "application/json")
    response.end(
      JSON.stringify({
        method: request.method,
        url: request.url,
        authorization: request.headers.authorization ?? null,
        contentType: request.headers["content-type"] ?? null,
        body: body === "" ? null : JSON.parse(body),
      }),
    )
  })

  server.listen(0, "127.0.0.1")
  await once(server, "listening")

  t.after(() => {
    server.close()
  })

  const address = server.address() as AddressInfo
  const config = {
    baseUrl: `http://127.0.0.1:${address.port}`,
    headers: new Headers({
      Authorization: "Bearer secret",
    }),
  }

  const endpoint = makeJsonEndpoint<
    { id: string; limit: number; message: string },
    z.infer<typeof outputSchema>
  >(config, {
    method: "POST",
    path: (input) => `/items/${input.id}`,
    query: (input) => {
      const query = new URLSearchParams()
      query.set("limit", String(input.limit))
      return query
    },
    body: (input) => ({
      message: input.message,
    }),
    output: outputSchema,
  })

  const output = await endpoint({
    id: "abc",
    limit: 10,
    message: "hello",
  })

  assert.deepEqual(output, {
    method: "POST",
    url: "/items/abc?limit=10",
    authorization: "Bearer secret",
    contentType: "application/json",
    body: {
      message: "hello",
    },
  })

  assert.deepEqual(requests, [
    {
      method: "POST",
      url: "/items/abc?limit=10",
      authorization: "Bearer secret",
      contentType: "application/json",
      body: '{"message":"hello"}',
    },
  ])
})
