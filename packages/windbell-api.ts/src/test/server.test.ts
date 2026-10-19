import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import Path from "node:path"
import process from "node:process"
import { test } from "node:test"

import { makeLocalFileSystem } from "@windbell/fs.ts/local-fs"
import * as S from "@windbell/semiosis.ts"
import { makePath } from "@windbell/std.ts/path"
import { unwrap } from "@windbell/std.ts/result"

import { makeAccessTokenStore } from "../auth/AccessToken.ts"
import { makeWindbellRouter } from "../router/index.ts"

test("windbell router", async (t) => {
  const root = await mkdtemp(Path.join(tmpdir(), "windbell-api-"))
  const database = S.makeDatabase({
    fs: makeLocalFileSystem(),
    path: makePath(process.platform === "win32" ? "win32" : "posix"),
    root,
  })
  const lockRoot = Path.join(root, "locks")
  const accessTokenStore = makeAccessTokenStore({ database })
  const accessToken = await accessTokenStore.create()
  const expiredAccessToken = await accessTokenStore.create({
    expiredAt: Date.now() - 1,
  })
  const app = makeWindbellRouter({
    database,
    corsOrigin: undefined,
    lockRoot,
  })

  function request(path: string, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers)
    headers.set("Authorization", `Bearer ${accessToken.value}`)
    return Promise.resolve(app.request(path, { ...init, headers }))
  }

  t.after(async () => {
    await rm(root, { recursive: true, force: true })
  })

  {
    const response = await app.request("/api/health")
    assert.equal(response.status, 401)
    assert.equal(
      response.headers.get("WWW-Authenticate"),
      'Bearer realm="windbell"',
    )

    const queryTokenResponse = await app.request(
      `/api/health?token=${accessToken.value}`,
    )
    assert.equal(queryTokenResponse.status, 401)

    const wrongTokenResponse = await app.request("/api/health", {
      headers: {
        Authorization: "Bearer wrong-token",
      },
    })
    assert.equal(wrongTokenResponse.status, 401)

    const expiredTokenResponse = await app.request("/api/health", {
      headers: {
        Authorization: `Bearer ${expiredAccessToken.value}`,
      },
    })
    assert.equal(expiredTokenResponse.status, 401)
  }

  {
    const response = await request("/api/health")
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      ok: true,
      service: "windbell-api",
    })

    const stored = await accessTokenStore.get(accessToken.value)
    assert.ok(stored !== undefined)
    assert.ok(stored.updatedAt >= accessToken.updatedAt)

    const lateAccessToken = await accessTokenStore.create()
    const lateResponse = await app.request("/api/health", {
      headers: {
        Authorization: `Bearer ${lateAccessToken.value}`,
      },
    })
    assert.equal(lateResponse.status, 200)
    await accessTokenStore.remove(lateAccessToken.value)
  }

  {
    const response = await request("/api/fs/exists", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: process.cwd(),
      }),
    })

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      kind: "OkResult",
      value: true,
    })
  }

  {
    const createResponse = await request("/api/themes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test Theme",
        colors: {
          light: {
            paper: "#ffffff",
          },
          dark: {
            paper: "#000000",
          },
        },
      }),
    })

    assert.equal(createResponse.status, 201)
    const created = (await createResponse.json()) as {
      id: string
      name: string
    }
    assert.equal(created.name, "Test Theme")
    assert.match(created.id, /^theme-/)

    const listResponse = await request("/api/themes")
    assert.equal(listResponse.status, 200)
    const themes = (await listResponse.json()) as Array<{ id: string }>
    assert.equal(themes.length, 1)

    const updateResponse = await request(`/api/themes/${created.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Updated Theme",
        colors: {
          light: {
            paper: "#fafaf9",
          },
          dark: {
            paper: "#181818",
          },
        },
      }),
    })

    assert.equal(updateResponse.status, 200)
    assert.equal(
      ((await updateResponse.json()) as { name: string }).name,
      "Updated Theme",
    )

    const deleteResponse = await request(`/api/themes/${created.id}`, {
      method: "DELETE",
    })
    assert.equal(deleteResponse.status, 204)

    const emptyListResponse = await request("/api/themes")
    assert.equal(emptyListResponse.status, 200)
    assert.deepEqual(await emptyListResponse.json(), [])
  }

  {
    const response = await request("/api/settings")
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      defaultProvider: null,
      themeId: null,
    })
  }

  {
    const pageWorkspace = unwrap(
      await database.workspaces.make({
        name: "page-test",
        root: Path.join(root, "page-test"),
      }),
    )
    const session = unwrap(
      await database.sessions.make({
        workspaceId: pageWorkspace.id,
        title: "page-test-session",
      }),
    )

    const homeResponse = await request("/api/pages/home")
    assert.equal(homeResponse.status, 200)
    const home = (await homeResponse.json()) as {
      workspaces: Array<{ id: string }>
      sessionsByWorkspaceId: Record<string, Array<{ id: string }>>
    }
    assert.equal(
      home.workspaces.some((item) => item.id === pageWorkspace.id),
      true,
    )
    assert.equal(
      home.sessionsByWorkspaceId[pageWorkspace.id]?.[0]?.id,
      session.id,
    )

    const workspaceResponse = await request(
      `/api/pages/workspaces/${pageWorkspace.id}`,
    )
    assert.equal(workspaceResponse.status, 200)
    const workspaceData = (await workspaceResponse.json()) as {
      workspace: { id: string }
      sessions: Array<{ id: string }>
    }
    assert.equal(workspaceData.workspace.id, pageWorkspace.id)
    assert.equal(workspaceData.sessions[0]?.id, session.id)

    const sessionResponse = await request(`/api/pages/sessions/${session.id}`)
    assert.equal(sessionResponse.status, 200)
    const sessionData = (await sessionResponse.json()) as {
      session: { id: string }
      workspace: { id: string }
    }
    assert.equal(sessionData.session.id, session.id)
    assert.equal(sessionData.workspace.id, pageWorkspace.id)

    const createSessionResponse = await request("/api/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspaceId: pageWorkspace.id,
        title: "created-through-domain-api",
      }),
    })
    assert.equal(createSessionResponse.status, 201)
    const createdSession = (await createSessionResponse.json()) as {
      id: string
      title: string
    }
    assert.equal(createdSession.title, "created-through-domain-api")

    const domainSessionsResponse = await request("/api/sessions")
    assert.equal(domainSessionsResponse.status, 200)
    const domainSessions = (await domainSessionsResponse.json()) as Array<{
      id: string
    }>
    assert.equal(
      domainSessions.some((item) => item.id === session.id),
      true,
    )

    const turn: S.Turn = {
      id: "turn-test",
      sessionId: session.id,
      status: "completed",
      model: { providerName: "test", name: "test" },
      inputHash: "input-hash",
      inputPersisted: true,
      startSequence: 0,
      endSequence: 1,
      createdAt: 1,
      updatedAt: 2,
      completedAt: 3,
    }
    unwrap(await database.sessions.putTurn(turn))

    const step: S.TurnStep = {
      sessionId: session.id,
      turnId: turn.id,
      sequenceNumber: 1,
      status: "completed",
      createdAt: 1,
      updatedAt: 2,
      completedAt: 3,
    }
    unwrap(await database.sessions.putStep(step))

    const turnsResponse = await request(`/api/sessions/${session.id}/turns`)
    assert.equal(turnsResponse.status, 200)
    assert.deepEqual(await turnsResponse.json(), [turn])

    const turnDetailsResponse = await request(
      `/api/sessions/${session.id}/turns?details`,
    )
    assert.equal(turnDetailsResponse.status, 200)
    assert.deepEqual(await turnDetailsResponse.json(), [
      { ...turn, steps: [step] },
    ])
  }

  {
    const response = await request("/api/config")

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      databaseRoot: database.root,
      lockRoot,
      shellName: process.platform === "win32" ? "pwsh" : "bash",
    })
  }
})
