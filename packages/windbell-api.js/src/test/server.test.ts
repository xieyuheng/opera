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
  const app = makeWindbellRouter({
    database,
    corsOrigin: undefined,
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
    const response = await app.request("/api/config")

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      databaseRoot: database.root,
      shellName: process.platform === "win32" ? "pwsh" : "bash",
    })
  }

  {
    const response = await app.request("/api/sh/health")

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      ok: true,
      service: "sh",
    })
  }
})
