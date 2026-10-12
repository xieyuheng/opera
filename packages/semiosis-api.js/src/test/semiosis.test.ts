import assert from "node:assert/strict"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import Path from "node:path"
import { test } from "node:test"
import * as S from "@windbell/semiosis.js/node"
import { makeSemiosisClient, startSemiosisServer } from "../index.ts"

test("semiosis client and server", async (t) => {
  const root = await mkdtemp(Path.join(tmpdir(), "semiosis-api-"))
  const database = S.makeDatabase({ root })

  const { server, url } = await startSemiosisServer({
    database,
    hostname: "127.0.0.1",
    port: 0,
    basePath: "",
  })
  const client = makeSemiosisClient({ baseUrl: url })

  t.after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
    await rm(root, { recursive: true, force: true })
  })

  assert.deepEqual(await client.health(), {
    ok: true,
    service: "semiosis-api",
  })

  assert.deepEqual(
    (await client.providers.list()).map(
      (providerConfig) => providerConfig.name,
    ),
    ["deepseek", "openrouter"],
  )

  assert.deepEqual(await client.providers.getApiKeyStatus("deepseek"), {
    configured: false,
  })

  await client.providers.putApiKey({
    providerName: "deepseek",
    key: "sk-test",
  })

  assert.deepEqual(await client.providers.getApiKeyStatus("deepseek"), {
    configured: true,
  })

  await client.providers.deleteApiKey("deepseek")

  assert.deepEqual(await client.providers.getApiKeyStatus("deepseek"), {
    configured: false,
  })

  assert.deepEqual(
    await client.providers.listModels({ providerName: "deepseek" }),
    [],
  )

  await client.providers.pinModel({
    providerName: "deepseek",
    modelName: "deepseek-flash",
  })

  const models = await client.providers.listModels({ providerName: "deepseek" })
  assert.equal(models.length, 1)
  assert.equal(models[0]?.name, "deepseek-flash")
  assert.equal(models[0]?.pinned, true)

  await client.providers.setDefaultModel({
    providerName: "deepseek",
    modelName: "deepseek-flash",
  })
  await client.providers.unpinModel({
    providerName: "deepseek",
    modelName: "deepseek-flash",
  })

  assert.equal(
    (await client.providers.get("deepseek"))?.defaultModel,
    "deepseek-flash",
  )

  assert.deepEqual(await client.settings.get(), {
    defaultProvider: null,
    themeId: null,
  })

  await client.settings.put({
    defaultProvider: "deepseek",
    themeId: "builtin-default",
  })

  assert.deepEqual(await client.settings.get(), {
    defaultProvider: "deepseek",
    themeId: "builtin-default",
  })

  const workspaceRoot = Path.join(root, "workspace")
  await mkdir(workspaceRoot, { recursive: true })
  await writeFile(Path.join(workspaceRoot, "README.md"), "# Test\n")

  const workspace = await client.workspaces.ensure({
    name: "test",
    root: workspaceRoot,
  })
  assert.equal(workspace.name, "test")
  assert.equal(workspace.root, workspaceRoot)

  const sameWorkspace = await client.workspaces.ensure({
    name: "another-name",
    root: workspaceRoot,
  })
  assert.equal(sameWorkspace.id, workspace.id)

  const session = await client.sessions.make({
    workspaceId: workspace.id,
    title: "test session",
  })
  assert.ok(session.context.length > 0)
  assert.equal(session.context[0]?.kind, "ToolSign")

  await new Promise((resolve) => setTimeout(resolve, 10))

  const signs: Array<S.Sign> = []

  for await (const event of client.sessions.interpret({
    sessionId: session.id,
    model: {
      providerName: "mock",
      name: "conversation",
    },
    turnId: "turn-test-1",
    input: [S.UserSign("hello")],
  })) {
    if (event.type === "error") throw new Error(event.message)
    if (event.type === "delta") continue

    signs.push(event.sign)
  }

  assert.ok(signs.length > 0)
  assert.equal(signs[0]?.kind, "UserSign")

  const beforeReplay = await client.sessions.get(session.id)

  const replayedSigns: Array<S.Sign> = []

  for await (const event of client.sessions.interpret({
    sessionId: session.id,
    model: {
      providerName: "mock",
      name: "conversation",
    },
    turnId: "turn-test-1",
    input: [S.UserSign("hello")],
  })) {
    if (event.type === "error") throw new Error(event.message)
    if (event.type === "delta") continue

    replayedSigns.push(event.sign)
  }

  assert.deepEqual(
    replayedSigns.map((sign) => sign.kind),
    signs.map((sign) => sign.kind),
  )

  const gotSession = await client.sessions.get(session.id)
  assert.ok((gotSession?.context.length ?? 0) > 1)
  assert.equal(gotSession?.context.length, beforeReplay?.context.length)

  const updatedWorkspace = await client.workspaces.get(workspace.id)
  assert.equal(updatedWorkspace?.updatedAt, gotSession?.updatedAt)

  const indexes = await client.sessions.list({
    workspaceId: workspace.id,
  })
  assert.equal(indexes.length, 1)
  assert.equal(indexes[0]?.id, session.id)

  await client.dustbin.sessions.trash(session.id)
  assert.equal(await client.sessions.get(session.id), undefined)
  assert.equal(
    (await client.sessions.list({ workspaceId: workspace.id })).length,
    0,
  )

  const dustbinSessions = await client.dustbin.sessions.list({
    workspaceId: workspace.id,
  })
  assert.equal(dustbinSessions.length, 1)
  assert.equal(dustbinSessions[0]?.id, session.id)
  assert.equal(typeof dustbinSessions[0]?.deletedAt, "number")

  const dustbinSession = await client.dustbin.sessions.get(session.id)
  assert.ok(dustbinSession !== undefined)
  assert.equal(dustbinSession.id, session.id)
  assert.ok(dustbinSession.context.length > 1)

  await client.dustbin.sessions.restore(session.id)
  assert.ok((await client.sessions.get(session.id)) !== undefined)
  assert.equal(await client.dustbin.sessions.get(session.id), undefined)
  assert.equal(
    (await client.dustbin.sessions.list({ workspaceId: workspace.id })).length,
    0,
  )

  await client.dustbin.sessions.trash(session.id)
  await client.dustbin.sessions.remove(session.id)
  assert.equal(await client.sessions.get(session.id), undefined)
  assert.equal(
    (await client.dustbin.sessions.list({ workspaceId: workspace.id })).length,
    0,
  )

  await client.sessions.remove(session.id)
  assert.equal(await client.sessions.get(session.id), undefined)

  await assert.rejects(
    () => client.dustbin.sessions.restore("missing-session"),
    /session not found in dustbin/,
  )

  const cascadeSession = await client.sessions.make({
    workspaceId: workspace.id,
    title: "cascade session",
  })
  const individualSession = await client.sessions.make({
    workspaceId: workspace.id,
    title: "individual session",
  })

  await client.dustbin.sessions.trash(individualSession.id)

  {
    const sessions = await client.dustbin.sessions.list({
      workspaceId: workspace.id,
    })
    const index = sessions.find(
      (session) => session.id === individualSession.id,
    )
    assert.equal(index?.trashedWithWorkspace, undefined)
  }

  await client.dustbin.workspaces.trash(workspace.id)
  assert.equal(await client.workspaces.get(workspace.id), undefined)
  assert.equal(
    (await client.sessions.list({ workspaceId: workspace.id })).length,
    0,
  )

  const dustbinWorkspaces = await client.dustbin.workspaces.list()
  assert.equal(dustbinWorkspaces.length, 1)
  assert.equal(dustbinWorkspaces[0]?.id, workspace.id)
  assert.equal(typeof dustbinWorkspaces[0]?.deletedAt, "number")

  {
    const sessions = await client.dustbin.sessions.list({
      workspaceId: workspace.id,
    })
    assert.equal(sessions.length, 2)

    const cascadeIndex = sessions.find(
      (session) => session.id === cascadeSession.id,
    )
    assert.equal(cascadeIndex?.trashedWithWorkspace, true)

    const individualIndex = sessions.find(
      (session) => session.id === individualSession.id,
    )
    assert.equal(individualIndex?.trashedWithWorkspace, undefined)
  }

  const dustbinWorkspace = await client.dustbin.workspaces.get(workspace.id)
  assert.ok(dustbinWorkspace !== undefined)
  assert.equal(dustbinWorkspace.id, workspace.id)
  assert.equal(dustbinWorkspace.name, "test")

  await client.dustbin.workspaces.restore(workspace.id)
  assert.ok((await client.workspaces.get(workspace.id)) !== undefined)
  assert.ok((await client.sessions.get(cascadeSession.id)) !== undefined)
  assert.equal(await client.sessions.get(individualSession.id), undefined)
  assert.equal(
    (await client.dustbin.sessions.list({ workspaceId: workspace.id })).length,
    1,
  )

  await client.dustbin.workspaces.trash(workspace.id)
  assert.equal(
    (await client.dustbin.sessions.list({ workspaceId: workspace.id })).length,
    2,
  )

  await client.dustbin.workspaces.remove(workspace.id)
  assert.equal(await client.workspaces.get(workspace.id), undefined)
  assert.equal(
    (await client.sessions.list({ workspaceId: workspace.id })).length,
    0,
  )
  assert.equal(
    (await client.dustbin.sessions.list({ workspaceId: workspace.id })).length,
    0,
  )
  assert.equal((await client.dustbin.workspaces.list()).length, 0)

  await client.workspaces.remove(workspace.id)
  assert.equal(await client.workspaces.get(workspace.id), undefined)
})
