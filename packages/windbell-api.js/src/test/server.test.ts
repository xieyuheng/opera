import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import Path from "node:path"
import { test } from "node:test"
import * as S from "@windbell/semiosis.js/node"
import { makeWindbellRouter } from "../router/index.ts"

test("windbell router", async (t) => {
  const root = await mkdtemp(Path.join(tmpdir(), "windbell-api-"))
  const database = S.makeNodeDatabase({ root })
  const lockRoot = Path.join(root, "locks")
  const app = makeWindbellRouter({
    database,
    corsOrigin: undefined,
    lockRoot,
  })

  t.after(async () => {
    await rm(root, { recursive: true, force: true })
  })

  {
    const response = await app.request("/api/health")
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      ok: true,
      service: "windbell-api",
    })
  }

  {
    const response = await app.request("/api/fs/exists", {
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
    const createResponse = await app.request("/api/themes", {
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

    const listResponse = await app.request("/api/themes")
    assert.equal(listResponse.status, 200)
    const themes = (await listResponse.json()) as Array<{ id: string }>
    assert.equal(themes.length, 1)

    const updateResponse = await app.request(`/api/themes/${created.id}`, {
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

    const deleteResponse = await app.request(`/api/themes/${created.id}`, {
      method: "DELETE",
    })
    assert.equal(deleteResponse.status, 204)

    const emptyListResponse = await app.request("/api/themes")
    assert.equal(emptyListResponse.status, 200)
    assert.deepEqual(await emptyListResponse.json(), [])
  }

  {
    const response = await app.request("/api/settings")
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      defaultProvider: null,
      themeId: null,
    })
  }

  {
    const pageWorkspace = await database.workspaces.make({
      name: "page-test",
      root: Path.join(root, "page-test"),
    })
    const session = await database.sessions.make({
      workspaceId: pageWorkspace.id,
      title: "page-test-session",
    })

    const homeResponse = await app.request("/api/pages/home")
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

    const workspaceResponse = await app.request(
      `/api/pages/workspaces/${pageWorkspace.id}`,
    )
    assert.equal(workspaceResponse.status, 200)
    const workspaceData = (await workspaceResponse.json()) as {
      workspace: { id: string }
      sessions: Array<{ id: string }>
    }
    assert.equal(workspaceData.workspace.id, pageWorkspace.id)
    assert.equal(workspaceData.sessions[0]?.id, session.id)

    const sessionResponse = await app.request(
      `/api/pages/sessions/${session.id}`,
    )
    assert.equal(sessionResponse.status, 200)
    const sessionData = (await sessionResponse.json()) as {
      session: { id: string }
      workspace: { id: string }
    }
    assert.equal(sessionData.session.id, session.id)
    assert.equal(sessionData.workspace.id, pageWorkspace.id)

    const createSessionResponse = await app.request("/api/sessions", {
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

    const domainSessionsResponse = await app.request("/api/sessions")
    assert.equal(domainSessionsResponse.status, 200)
    const domainSessions = (await domainSessionsResponse.json()) as Array<{
      id: string
    }>
    assert.equal(
      domainSessions.some((item) => item.id === session.id),
      true,
    )
  }

  {
    const response = await app.request("/api/config")

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      databaseRoot: database.root,
      lockRoot,
      shellName: process.platform === "win32" ? "pwsh" : "bash",
    })
  }
})
